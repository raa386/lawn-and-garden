import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Filter,
  Plus,
  Scissors,
  Droplet,
  Sparkles,
  Thermometer,
  Search,
  CheckCircle2,
  Circle,
  Tag,
  Trash2,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { ScheduledTask, GardenBed, TaskType, SeasonStage } from '../types';
import {
  getCurrentMonth,
  getCurrentFormattedDate,
  getSeasonStageForMonth,
  evaluateTaskTiming,
  TaskReadiness,
} from '../utils/seasonUtils';

interface TaskScheduleListProps {
  tasks: ScheduledTask[];
  currentSoilTempF: number;
  currentZone: string;
  onToggleTask: (taskId: string) => void;
  onDeleteCustomTask: (taskId: string) => void;
  onOpenAddTask: () => void;
  onBulkCompletePastTasks?: () => void;
  highlightedTaskId?: string;
  currentMonth?: number;
}

export const TaskScheduleList: React.FC<TaskScheduleListProps> = ({
  tasks,
  currentSoilTempF,
  currentZone,
  onToggleTask,
  onDeleteCustomTask,
  onOpenAddTask,
  onBulkCompletePastTasks,
  highlightedTaskId,
  currentMonth = getCurrentMonth(),
}) => {
  const [selectedBed, setSelectedBed] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  // Default to 'ready_now' so only actionable tasks for current season + soil temp are shown by default,
  // or user can choose 'all', 'past_window', 'upcoming', 'completed'
  const [statusFilter, setStatusFilter] = useState<'ready_now' | 'all' | 'past_window' | 'upcoming' | 'completed'>('ready_now');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const seasonInfo = getSeasonStageForMonth(currentMonth);

  const beds: Array<GardenBed | 'all'> = [
    'all',
    'Front Garden',
    'Shared Garden',
    'Garage Garden',
    'Backyard',
    'Planter Box',
    'Lawn Care',
  ];

  const types: Array<{ value: TaskType | 'all'; label: string }> = [
    { value: 'all', label: 'All Actions' },
    { value: 'fertilize', label: 'Fertilizing' },
    { value: 'prune', label: 'Pruning' },
    { value: 'lawn', label: 'Lawn Care' },
    { value: 'water', label: 'Watering' },
  ];

  const seasons: Array<{ value: SeasonStage | 'active_now' | 'all'; label: string }> = [
    { value: 'all', label: 'All Seasons' },
    { value: 'active_now', label: '🔥 Ready Now (Season & Soil Match)' },
    { value: 'Late Winter', label: 'Late Winter' },
    { value: 'Early Spring', label: 'Early Spring' },
    { value: 'Mid Spring', label: 'Mid Spring' },
    { value: 'Late Spring', label: 'Late Spring' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Early Fall', label: 'Early Fall' },
    { value: 'Late Fall', label: 'Late Fall' },
  ];

  // Evaluate readiness for all tasks
  const evaluatedTasks = tasks.map((task) => ({
    task,
    timing: evaluateTaskTiming(task, currentSoilTempF, currentMonth),
  }));

  const readyNowCount = evaluatedTasks.filter((item) => item.timing.isReadyNow).length;
  const pastWindowCount = evaluatedTasks.filter((item) => !item.task.completed && (item.timing.isPastSeason || item.timing.isSoilTempPassed)).length;
  const upcomingCount = evaluatedTasks.filter((item) => !item.task.completed && item.timing.isUpcomingSeason).length;
  const completedCount = evaluatedTasks.filter((item) => item.task.completed).length;

  const filteredTasks = evaluatedTasks.filter(({ task, timing }) => {
    // Bed filter
    if (selectedBed !== 'all' && task.bed !== selectedBed) return false;
    // Type filter
    if (selectedType !== 'all' && task.type !== selectedType) return false;

    // Status filter: strictly enforce user requirement
    // "do not show actions as pending if the soil temp or season has passed. Pending actions should only be those that are ready to occur now based on soil temp and season."
    if (statusFilter === 'ready_now' && !timing.isReadyNow) return false;
    if (statusFilter === 'past_window' && (task.completed || (!timing.isPastSeason && !timing.isSoilTempPassed))) return false;
    if (statusFilter === 'upcoming' && (task.completed || !timing.isUpcomingSeason)) return false;
    if (statusFilter === 'completed' && !task.completed) return false;

    // Season filter
    if (selectedSeason === 'active_now') {
      if (!timing.isReadyNow) return false;
    } else if (selectedSeason !== 'all' && task.targetSeason !== selectedSeason) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        task.plantName.toLowerCase().includes(q) ||
        task.bed.toLowerCase().includes(q) ||
        task.instruction.toLowerCase().includes(q) ||
        (task.fertilizerProduct && task.fertilizerProduct.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Seasonal Context Ribbon */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <h3 className="text-xl font-bold font-serif-natural text-slate-900 tracking-normal">
                Automated Care Schedule & Timing
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-sans">
              Evaluated for <strong>{seasonInfo.label}</strong> ({getCurrentFormattedDate()}) with{' '}
              <strong>{currentSoilTempF}°F soil</strong> in {currentZone}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddTask}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Task</span>
            </button>
          </div>
        </div>

        {/* Status Segmented Tabs: Highlights "Ready Now" strictly based on Season + Soil Temp */}
        <div className="flex flex-wrap gap-1.5 mb-3.5 p-1 bg-slate-200/80 rounded-xl border border-slate-300 text-xs font-mono">
          <button
            onClick={() => setStatusFilter('ready_now')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'ready_now'
                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                : 'text-slate-700 hover:bg-slate-300/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready to Occur Now ({readyNowCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-700 hover:bg-slate-300/80'
            }`}
          >
            <span>All Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('past_window')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'past_window'
                ? 'bg-white text-amber-800 font-bold shadow-2xs'
                : 'text-slate-700 hover:bg-slate-300/80'
            }`}
            title="Tasks whose seasonal calendar or soil temp window has passed for this year"
          >
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Past Season Window ({pastWindowCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'upcoming'
                ? 'bg-white text-sky-800 font-bold shadow-2xs'
                : 'text-slate-700 hover:bg-slate-300/80'
            }`}
          >
            <Calendar className="w-3 h-3 text-sky-600" />
            <span>Upcoming Season ({upcomingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                : 'text-slate-700 hover:bg-slate-300/80'
            }`}
          >
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Done ({completedCount})</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search plant, fertilizer, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Bed Selector */}
          <div>
            <select
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Beds ({tasks.length})</option>
              <option value="Front Garden">Front Garden (Row 5)</option>
              <option value="Shared Garden">Shared Garden</option>
              <option value="Garage Garden">Garage Garden</option>
              <option value="Backyard">Backyard</option>
              <option value="Planter Box">Planter Box</option>
              <option value="Lawn Care">Lawn Care Turf</option>
            </select>
          </div>

          {/* Action Type Selector */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Season / Trigger Selector */}
          <div>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            >
              {seasons.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Late-Season Catchup Banner in Schedule tab */}
      {statusFilter === 'past_window' && pastWindowCount > 0 && onBulkCompletePastTasks && (
        <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs font-mono flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Started using this app late in the season? Mark all {pastWindowCount} past-window tasks as already completed.
            </span>
          </div>
          <button
            onClick={onBulkCompletePastTasks}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors shadow-2xs text-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            ✓ Mark All {pastWindowCount} Past Tasks Done
          </button>
        </div>
      )}

      {/* Task Rows */}
      <div className="divide-y divide-slate-100">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            <p>
              {statusFilter === 'ready_now'
                ? `No actions currently pending for ${seasonInfo.label} at ${currentSoilTempF}°F soil. (Past-season actions are hidden from Pending).`
                : 'No maintenance tasks match the selected filters.'}
            </p>
            <button
              onClick={() => {
                setSelectedBed('all');
                setSelectedType('all');
                setSelectedSeason('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 text-emerald-700 underline font-medium cursor-pointer"
            >
              View all tasks & seasons
            </button>
          </div>
        ) : (
          filteredTasks.map(({ task, timing }) => {
            const isHighlighted = highlightedTaskId === task.id;

            return (
              <div
                key={task.id}
                id={`task-${task.id}`}
                className={`p-4 sm:p-4.5 transition-colors ${
                  task.completed
                    ? 'bg-slate-50/50 opacity-75'
                    : isHighlighted
                    ? 'bg-amber-50/70 border-l-4 border-amber-500'
                    : timing.isReadyNow
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-emerald-600'
                    : timing.isPastSeason || timing.isSoilTempPassed
                    ? 'bg-white opacity-85 border-l-2 border-slate-300'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox + Title & Content */}
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors border shrink-0 cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:border-emerald-600 text-transparent'
                      }`}
                      title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="flex-1">
                      {/* Top Badges */}
                      <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-mono mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase border border-slate-200">
                          {task.bed}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                          {task.plantName}
                        </span>

                        {/* Status Badge */}
                        {timing.isReadyNow && !task.completed && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold flex items-center space-x-1 shadow-2xs">
                            <Flame className="w-2.5 h-2.5 text-amber-300" />
                            <span>READY NOW ({currentSoilTempF}°F • In Season)</span>
                          </span>
                        )}

                        {(timing.isPastSeason || timing.isSoilTempPassed) && !task.completed && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>{timing.statusText}</span>
                          </span>
                        )}

                        {timing.isUpcomingSeason && !task.completed && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                            {timing.statusText}
                          </span>
                        )}

                        {timing.isAwaitingSoilTemp && !task.completed && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            {timing.statusText}
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {task.targetSeason}
                        </span>

                        {task.fertilizerProduct && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            {task.fertilizerProduct}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-sm font-bold font-mono ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Instruction */}
                      <p className="text-xs font-sans text-slate-700 mt-1 leading-relaxed">
                        {task.instruction}
                      </p>

                      {/* Seasonal / Horticultural Explanation */}
                      <div className="mt-1.5 text-[11px] font-sans italic text-slate-500">
                        {timing.explanation}
                      </div>

                      {/* Dosage / Soil Temp Threshold info */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {task.recommendedDose && (
                          <div>
                            <strong className="text-slate-900">Dose/Rate:</strong> {task.recommendedDose}
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-900">Soil Temp Trigger:</strong>{' '}
                          <span className="text-emerald-800 font-semibold">{task.soilTempCondition}</span>
                        </div>
                        {task.timingNote && (
                          <div>
                            <strong className="text-slate-900">Seasonal Window:</strong> {task.timingNote}
                          </div>
                        )}
                        {task.completed && task.completedDate && (
                          <div className="text-emerald-700 font-semibold">
                            ✓ Completed on {task.completedDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {task.isCustom && (
                      <button
                        onClick={() => onDeleteCustomTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete custom task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Showing {filteredTasks.length} tasks (<strong>{readyNowCount}</strong> ready right now in {seasonInfo.label})
        </span>
        <span className="text-emerald-800 font-semibold">
          {completedCount} tasks completed ({Math.round((completedCount / (tasks.length || 1)) * 100)}%)
        </span>
      </div>
    </div>
  );
};
