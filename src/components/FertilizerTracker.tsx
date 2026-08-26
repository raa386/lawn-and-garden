import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  Scale,
  Sprout,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
  Calendar,
  Tag,
} from 'lucide-react';
import { PlantRecord, ScheduledTask } from '../types';
import { getCurrentMonth, evaluateTaskTiming } from '../utils/seasonUtils';

interface FertilizerTrackerProps {
  plants: PlantRecord[];
  tasks: ScheduledTask[];
  onToggleTask?: (taskId: string) => void;
  onBulkCompleteFertilizer?: (fertilizerProduct?: string, onlyPastSeasons?: boolean) => void;
  onResetFertilizerTasks?: (fertilizerProduct?: string) => void;
  currentMonth?: number;
  currentSoilTempF?: number;
}

export const FertilizerTracker: React.FC<FertilizerTrackerProps> = ({
  plants,
  tasks,
  onToggleTask,
  onBulkCompleteFertilizer,
  onResetFertilizerTasks,
  currentMonth = getCurrentMonth(),
  currentSoilTempF = 74,
}) => {
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Extract all fertilizer tasks
  const fertilizerTasks = tasks.filter(
    (t) => t.type === 'fertilize' || Boolean(t.fertilizerProduct)
  );

  // Filter tasks by specific product
  const getTasksForProduct = (productCategory: 'holly' | 'rose' | 'all-purpose' | '10-10' | 'lawn' | 'fruit') => {
    switch (productCategory) {
      case 'holly':
        return fertilizerTasks.filter((t) => t.fertilizerProduct === 'Holly Tone');
      case 'rose':
        return fertilizerTasks.filter(
          (t) => t.fertilizerProduct === 'Rose Tone' || t.fertilizerProduct === 'Granular Rose Fertilizer'
        );
      case 'all-purpose':
        return fertilizerTasks.filter(
          (t) => t.fertilizerProduct === 'All Purpose' || t.fertilizerProduct === 'Plant Tone'
        );
      case '10-10':
        return fertilizerTasks.filter((t) => t.fertilizerProduct === '10-10-10 Balanced');
      case 'fruit':
        return fertilizerTasks.filter((t) => t.fertilizerProduct === 'Fruit Tree');
      case 'lawn':
        return fertilizerTasks.filter((t) => t.fertilizerProduct?.includes('Lawn'));
    }
  };

  const hollyTasks = getTasksForProduct('holly');
  const roseTasks = getTasksForProduct('rose');
  const allPurposeTasks = getTasksForProduct('all-purpose');
  const tenTenTasks = getTasksForProduct('10-10');
  const fruitTasks = getTasksForProduct('fruit');
  const lawnTasks = getTasksForProduct('lawn');

  // Count assigned plants by fertilizer product
  const hollyTonePlants = plants.filter((p) => p.fertilizerType === 'Holly Tone');
  const roseTonePlants = plants.filter(
    (p) => p.fertilizerType === 'Rose Tone' || p.fertilizerType === 'Granular Rose Fertilizer'
  );
  const allPurposePlants = plants.filter(
    (p) => p.fertilizerType === 'All Purpose' || p.fertilizerType === 'Plant Tone'
  );
  const tenTenTenPlants = plants.filter((p) => p.fertilizerType === '10-10-10 Balanced');
  const fruitTreePlants = plants.filter((p) => p.fertilizerType === 'Fruit Tree');
  const lawnFertilizerPlants = plants.filter((p) => p.fertilizerType?.includes('Lawn'));

  // Calculate task completion for fertilizers
  const completedHollyTasks = hollyTasks.filter((t) => t.completed).length;
  const completedRoseTasks = roseTasks.filter((t) => t.completed).length;
  const completedAllPurposeTasks = allPurposeTasks.filter((t) => t.completed).length;
  const completed1010Tasks = tenTenTasks.filter((t) => t.completed).length;
  const completedLawnTasks = lawnTasks.filter((t) => t.completed).length;

  // Aggregate stats
  const totalFertilizerTasks = fertilizerTasks.length;
  const completedTotalTasks = fertilizerTasks.filter((t) => t.completed).length;
  const progressPercent = totalFertilizerTasks > 0 ? Math.round((completedTotalTasks / totalFertilizerTasks) * 100) : 0;

  // Count past-season pending feeds that can be caught up
  const pastPendingFeedsCount = fertilizerTasks.filter((t) => {
    if (t.completed) return false;
    const maxMonth = t.targetMonths ? Math.max(...t.targetMonths) : 4;
    return maxMonth < currentMonth;
  }).length;

  // Filtered task list for the interactive checklist table
  const filteredFeedList = fertilizerTasks.filter((task) => {
    // Product filter
    if (selectedProductFilter === 'holly' && task.fertilizerProduct !== 'Holly Tone') return false;
    if (
      selectedProductFilter === 'rose' &&
      task.fertilizerProduct !== 'Rose Tone' &&
      task.fertilizerProduct !== 'Granular Rose Fertilizer'
    )
      return false;
    if (
      selectedProductFilter === 'all-purpose' &&
      task.fertilizerProduct !== 'All Purpose' &&
      task.fertilizerProduct !== 'Plant Tone'
    )
      return false;
    if (
      selectedProductFilter === 'lawn-specialty' &&
      task.fertilizerProduct !== '10-10-10 Balanced' &&
      task.fertilizerProduct !== 'Fruit Tree' &&
      !task.fertilizerProduct?.includes('Lawn')
    )
      return false;

    // Status filter
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        task.plantName.toLowerCase().includes(q) ||
        task.bed.toLowerCase().includes(q) ||
        (task.fertilizerProduct && task.fertilizerProduct.toLowerCase().includes(q)) ||
        (task.instruction && task.instruction.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Live Fertilizer Management & Needs Banner */}
      <div className="bg-gradient-to-br from-[#0A3326] via-[#0E4433] to-[#0A3326] text-white p-5 rounded-2xl border border-emerald-800/80 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-emerald-800/60">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-bold font-serif-natural tracking-normal text-white">
                Fertilizer Management & Needs
              </h3>
            </div>
            <p className="text-xs text-emerald-200 mt-1 font-sans">
              Dynamic nutritional requirements and scheduled feeds calculated across all active plants and garden beds.
            </p>
          </div>

          {/* Quick Catch-Up Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onBulkCompleteFertilizer && (
              <button
                onClick={() => onBulkCompleteFertilizer(undefined, true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                title="Mark all feeds scheduled for past spring/summer months as completed"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Mark Past Feeds Done {pastPendingFeedsCount > 0 ? `(${pastPendingFeedsCount})` : ''}</span>
              </button>
            )}

            {onBulkCompleteFertilizer && (
              <button
                onClick={() => onBulkCompleteFertilizer(undefined, false)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-medium flex items-center space-x-1 transition-all border border-emerald-500/50 cursor-pointer shadow-2xs"
                title="Mark all 27 scheduled feeds as completed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Mark All Done</span>
              </button>
            )}

            {onResetFertilizerTasks && completedTotalTasks > 0 && (
              <button
                onClick={() => onResetFertilizerTasks(undefined)}
                className="px-2.5 py-1.5 rounded-lg bg-[#07241A] hover:bg-[#051C14] text-emerald-300 hover:text-white text-xs font-mono transition-all border border-emerald-700/60 cursor-pointer"
                title="Reset all fertilizer feeds to pending"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress summary bar */}
        <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-emerald-200">Overall Application Progress:</span>
            <span className="font-bold text-amber-300 text-sm">
              {completedTotalTasks} / {totalFertilizerTasks} Completed ({progressPercent}%)
            </span>
            {completedTotalTasks < totalFertilizerTasks && pastPendingFeedsCount > 0 && (
              <span className="text-[11px] text-amber-200 bg-[#07241A]/90 px-2 py-0.5 rounded-md border border-amber-500/40">
                💡 {pastPendingFeedsCount} earlier-season feeds can be caught up
              </span>
            )}
          </div>
          <div className="w-full sm:w-64 bg-[#07241A] h-2.5 rounded-full overflow-hidden border border-emerald-700/60 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Metric Cards with Inline Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
          {/* Holly Tone */}
          <div className="bg-[#0D382B] p-3.5 rounded-xl border border-emerald-600/50 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                <span>HOLLY TONE (4-3-4 ACID FOOD)</span>
                <span className="text-sm font-bold text-white">{hollyTonePlants.length} Plants</span>
              </div>
              <p className="text-emerald-100/90 text-[11px] font-sans">
                Acid-loving shrubs & evergreens: Boxwoods, Bloomstruck Hydrangeas, Olympic Fire, Azaleas, Rhododendrons, Gardenia.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-700/60 flex items-center justify-between text-[10px] text-emerald-200">
              <span>Optimal Temp: 45°F–60°F</span>
              <div className="flex items-center space-x-2">
                <span className="text-amber-300 font-semibold">
                  {completedHollyTasks}/{hollyTasks.length} Feeds Done
                </span>
                {onBulkCompleteFertilizer && completedHollyTasks < hollyTasks.length && (
                  <button
                    onClick={() => onBulkCompleteFertilizer('Holly Tone')}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark All Done
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Plant Tone / All-Purpose */}
          <div className="bg-[#1D3627] p-3.5 rounded-xl border border-amber-500/40 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                <span>PLANT TONE / ALL PURPOSE</span>
                <span className="text-sm font-bold text-white">{allPurposePlants.length} Plants</span>
              </div>
              <p className="text-emerald-100/90 text-[11px] font-sans">
                Balanced 5-3-3: Astilbe, Royal Candles, Bleeding Heart, Lilac Bush, Coneflower, Euonymus, Leylands, Clematis.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-700/60 flex items-center justify-between text-[10px] text-emerald-200">
              <span>Optimal Temp: 45°F–65°F</span>
              <div className="flex items-center space-x-2">
                <span className="text-amber-300 font-semibold">
                  {completedAllPurposeTasks}/{allPurposeTasks.length} Feeds Done
                </span>
                {onBulkCompleteFertilizer && completedAllPurposeTasks < allPurposeTasks.length && (
                  <button
                    onClick={() => onBulkCompleteFertilizer('All Purpose')}
                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark All Done
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rose Tone */}
          <div className="bg-[#381B24] p-3.5 rounded-xl border border-rose-500/40 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                <span>ROSE TONE & ROSE FOOD</span>
                <span className="text-sm font-bold text-white">{roseTonePlants.length} Plant Groups</span>
              </div>
              <p className="text-rose-100/90 text-[11px] font-sans">
                High potassium & trace minerals for Carpet Rose (monthly through Sept) & Let's Dance Can Do Hydrangea.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-700/60 flex items-center justify-between text-[10px] text-rose-200">
              <span>Optimal Temp: 50°F–70°F</span>
              <div className="flex items-center space-x-2">
                <span className="text-rose-200 font-semibold">
                  {completedRoseTasks}/{roseTasks.length} Feeds Done
                </span>
                {onBulkCompleteFertilizer && completedRoseTasks < roseTasks.length && (
                  <button
                    onClick={() => onBulkCompleteFertilizer('Rose Tone')}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark All Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Late-Season Catchup Note Callout */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 text-xs font-mono text-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                Late-Season Setup & Feed Completion Tracker
              </div>
              <p className="text-slate-600 text-[12px] font-sans mt-0.5 leading-relaxed">
                If you planted or started tracking later in the year, check off earlier feeds below or click{' '}
                <strong className="text-emerald-800">"Catch Up Past Feeds"</strong> to bring your garden's status up to date with your actual applications.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onBulkCompleteFertilizer && (
              <button
                onClick={() => onBulkCompleteFertilizer(undefined, true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Catch Up Past Feeds</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Feed Checklist & Application Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h4 className="font-serif-natural font-bold text-base text-slate-900 flex items-center space-x-2">
              <span>Interactive Feed Checklist & Application Log</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-bold border border-emerald-200">
                {completedTotalTasks} of {totalFertilizerTasks} Applied
              </span>
            </h4>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Click the checkbox on any plant to mark feeds completed or update your nutritional history.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search feed, plant, bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter Segment Tabs */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedProductFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductFilter === 'all'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50'
              }`}
            >
              All Products ({fertilizerTasks.length})
            </button>
            <button
              onClick={() => setSelectedProductFilter('holly')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductFilter === 'holly'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50'
              }`}
            >
              Holly Tone ({hollyTasks.length})
            </button>
            <button
              onClick={() => setSelectedProductFilter('all-purpose')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductFilter === 'all-purpose'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-amber-50'
              }`}
            >
              Plant Tone ({allPurposeTasks.length})
            </button>
            <button
              onClick={() => setSelectedProductFilter('rose')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductFilter === 'rose'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-rose-50'
              }`}
            >
              Rose Tone ({roseTasks.length})
            </button>
            <button
              onClick={() => setSelectedProductFilter('lawn-specialty')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedProductFilter === 'lawn-specialty'
                  ? 'bg-slate-800 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Lawn & Specialty ({tenTenTasks.length + fruitTasks.length + lawnTasks.length})
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending ({fertilizerTasks.filter((t) => !t.completed).length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Done ({completedTotalTasks})
            </button>
          </div>
        </div>

        {/* Feed List Items */}
        <div className="divide-y divide-slate-100">
          {filteredFeedList.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No fertilizer tasks match the selected filters.
            </div>
          ) : (
            filteredFeedList.map((task) => {
              const timing = evaluateTaskTiming(task, currentSoilTempF, currentMonth);
              const isPast = !task.completed && (timing.isPastSeason || timing.isSoilTempPassed);

              return (
                <div
                  key={task.id}
                  id={`feed-${task.id}`}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    task.completed
                      ? 'bg-slate-50/50 hover:bg-slate-50'
                      : isPast
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'bg-white hover:bg-emerald-50/30'
                  }`}
                >
                  {/* Left Column: Checkbox & Info */}
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onToggleTask && onToggleTask(task.id)}
                      className="mt-0.5 text-emerald-600 hover:text-emerald-700 transition-transform active:scale-95 cursor-pointer shrink-0"
                      title={task.completed ? 'Mark as pending' : 'Mark feed completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-600" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span
                          className={`font-mono text-sm font-bold ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.plantName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                          {task.bed}
                        </span>
                        {task.fertilizerProduct && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              task.fertilizerProduct === 'Holly Tone'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : task.fertilizerProduct.includes('Rose')
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : task.fertilizerProduct.includes('Plant') || task.fertilizerProduct.includes('Purpose')
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {task.fertilizerProduct}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs font-sans leading-relaxed ${
                          task.completed ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {task.instruction}
                      </p>

                      {task.recommendedDose && (
                        <div className="text-[11px] font-mono text-amber-800 flex items-center space-x-1">
                          <Scale className="w-3 h-3 text-amber-600" />
                          <span>Dose: {task.recommendedDose}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timing Badge & Toggle Action */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs font-mono shrink-0 pl-8 sm:pl-0">
                    <div className="text-right">
                      {task.completed ? (
                        <div className="flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{task.completedDate || 'Applied'}</span>
                        </div>
                      ) : isPast ? (
                        <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                          Past Window ({task.targetSeason || 'Spring'})
                        </div>
                      ) : timing.isReadyNow ? (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-300 font-bold flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>Ready Now</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {task.targetSeason || 'Scheduled'}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {task.soilTempCondition || 'Soil Temp 45-65°F'}
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleTask && onToggleTask(task.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        task.completed
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                      }`}
                    >
                      {task.completed ? 'Undo' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Product Breakdown & Bed Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="font-serif-natural font-bold text-base text-slate-900">
              Active Fertilizer Protocols & Plant Targets
            </h4>
            <p className="text-xs text-slate-600 font-sans">
              Formulations matched to plant acid, potassium, and seasonal vegetative requirements.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs font-mono">
          {/* Holly Tone Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-emerald-600"></span>
                <strong className="text-slate-900 font-mono text-sm">Holly Tone (4-3-4 Organic Acid Plant Food)</strong>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                {hollyTonePlants.length} Plant Varieties • {completedHollyTasks}/{hollyTasks.length} Feeds Done
              </span>
            </div>
            <p className="text-slate-600 font-sans text-xs mb-3">
              Formulated with elemental sulfur and bio-tone microbes to lower soil pH for acid-loving shrubs and evergreens.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {hollyTonePlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-1">{p.fertilizing}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rose Tone Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-rose-600"></span>
                <strong className="text-slate-900 font-mono text-sm">Rose Tone & Granular Rose Fertilizer</strong>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                {roseTonePlants.length} Plant Groups • {completedRoseTasks}/{roseTasks.length} Feeds Done
              </span>
            </div>
            <p className="text-slate-600 font-sans text-xs mb-3">
              High potassium & trace minerals for stem strength and continuous floral rebloom.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roseTonePlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-rose-800 font-semibold mt-1">{p.fertilizing}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plant Tone / All Purpose Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <strong className="text-slate-900 font-mono text-sm">Plant Tone / All-Purpose Organic Food</strong>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]">
                {allPurposePlants.length} Plant Varieties • {completedAllPurposeTasks}/{allPurposeTasks.length} Feeds Done
              </span>
            </div>
            <p className="text-slate-600 font-sans text-xs mb-3">
              Balanced 5-3-3 slow-release organic nutrients for perennial crowns, shrubs, and climbers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {allPurposePlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-amber-900 font-semibold mt-1">{p.fertilizing}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Specialty: 10-10-10 Balanced & Fruit Tree & Lawn */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded bg-teal-600"></span>
                <strong className="text-slate-900 font-mono text-sm">Specialty: 10-10-10, Fruit Tree & Turf</strong>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
              {tenTenTenPlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-teal-800 font-semibold mt-1">10-10-10 Balanced Heavy Feeder</div>
                </div>
              ))}
              {fruitTreePlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-amber-800 font-semibold mt-1">Fruit Tree / Spring Dripline</div>
                </div>
              ))}
              {lawnFertilizerPlants.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.bed}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-1">Lawn Pre-Emergent & Fall Feeds</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
