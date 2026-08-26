import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Flame,
  Droplets,
  Scissors,
  ArrowRight,
  Info,
  ShieldAlert,
  Sun,
  CloudRain,
  Leaf,
} from 'lucide-react';
import { WeatherCondition, ScheduledTask } from '../types';
import {
  getCurrentMonth,
  getCurrentFormattedDate,
  getSeasonStageForMonth,
  evaluateTaskTiming,
} from '../utils/seasonUtils';

interface ActionAlertsProps {
  weather: WeatherCondition;
  tasks: ScheduledTask[];
  onSelectTask: (taskId: string) => void;
  currentMonth?: number;
}

export const ActionAlerts: React.FC<ActionAlertsProps> = ({
  weather,
  tasks,
  onSelectTask,
  currentMonth = getCurrentMonth(),
}) => {
  const soilTemp = weather.soilTempF;
  const seasonInfo = getSeasonStageForMonth(currentMonth);

  // Derive dynamic agronomic alerts evaluated against BOTH live soil temperature AND the active seasonal calendar
  const alerts: Array<{
    id: string;
    type: 'urgent' | 'optimal' | 'info' | 'weather' | 'warning';
    title: string;
    description: string;
    actionLabel?: string;
    relatedTaskId?: string;
    category: 'Lawn' | 'Fertilizing' | 'Pruning' | 'Weather' | 'Seasonal Warning';
  }> = [];

  // Evaluate tasks readiness
  const readyTasks = tasks.filter((t) => {
    const timing = evaluateTaskTiming(t, soilTemp, currentMonth);
    return timing.isReadyNow;
  });

  // --- 1. EARLY SPRING ALERTS (March - April only) ---
  if (currentMonth >= 3 && currentMonth <= 4) {
    // Lawn Crabgrass Pre-Emergent Alert (Soil 50 - 55°F in Spring)
    if (soilTemp >= 50 && soilTemp <= 56) {
      alerts.push({
        id: 'alert-crabgrass-peak',
        type: 'urgent',
        category: 'Lawn',
        title: `CRITICAL SPRING CRABGRASS PRE-EMERGENT WINDOW (Soil: ${soilTemp}°F)`,
        description:
          'Soil temperatures are in the 50°F–55°F early spring sweet spot. Apply pre-emergent barrier now before crabgrass seed germination commences.',
        actionLabel: 'View Lawn Pre-Emergent Task',
        relatedTaskId: 'task-es-1',
      });
    }

    // Early Spring Holly Tone
    if (soilTemp >= 45 && soilTemp <= 65) {
      const uncompletedHollyTasks = readyTasks.filter((t) => t.fertilizerProduct === 'Holly Tone');
      if (uncompletedHollyTasks.length > 0) {
        alerts.push({
          id: 'alert-holly-tone-spring',
          type: 'optimal',
          category: 'Fertilizing',
          title: `SPRING FEEDING WINDOW: Holly Tone for Acid Lovers (${uncompletedHollyTasks.length} active now)`,
          description: `Soil has thawed (${soilTemp}°F) in ${seasonInfo.label}. Apply Holly Tone to Boxwoods, Hydrangeas, Olympic Fire, and Azaleas.`,
          actionLabel: `View Ready Holly Tone Tasks`,
        });
      }
    }
  }

  // --- 3. SUMMER & LATE SUMMER ACTIVE ALERTS (May - September) ---
  if (currentMonth >= 5 && currentMonth <= 9) {
    // Active Monthly Rose Tone Tasks
    const activeRoseTask = readyTasks.find((t) => t.fertilizerProduct === 'Rose Tone' || t.fertilizerProduct === 'Granular Rose Fertilizer');
    if (activeRoseTask) {
      alerts.push({
        id: 'alert-rose-monthly',
        type: 'optimal',
        category: 'Fertilizing',
        title: `ACTIVE MONTHLY ROSE TONE FEEDING (${seasonInfo.label})`,
        description: `Carpet Rose monthly organic booster application is active. Feeds through September maintain continuous recurring floral flushes.`,
        actionLabel: 'View Rose Feeding Task',
        relatedTaskId: activeRoseTask.id,
      });
    }

    // Mid-Summer Hydrangea Booster (July)
    if (currentMonth === 7 && soilTemp >= 65) {
      alerts.push({
        id: 'alert-hydrangea-july-boost',
        type: 'optimal',
        category: 'Fertilizing',
        title: `JULY HYDRANGEA BOOSTER FEEDING WINDOW`,
        description: `Mid-summer secondary application of Holly Tone for Bloomstruck & Shared Hydrangeas to support vigorous mid-to-late summer flowerheads.`,
        actionLabel: 'View Hydrangea July Task',
        relatedTaskId: 'task-sum-1',
      });
    }
  }

  // --- 4. UPCOMING FALL LAWN TURF WINDOW (August - October) ---
  if (currentMonth === 8) {
    alerts.push({
      id: 'alert-fall-lawn-prep',
      type: 'info',
      category: 'Lawn',
      title: `UPCOMING FALL LAWN RENOVATION WINDOW (Target: September / Soil 55-65°F)`,
      description: `Current date is ${getCurrentFormattedDate()}. Early fall (September) is the golden window for cool-season turf aeration, overseeding with tall fescue, and root-building fall fertilizers as summer heat subsides.`,
      actionLabel: 'Preview Fall Lawn Tasks',
      relatedTaskId: 'task-fa-3',
    });
  } else if (currentMonth >= 9 && currentMonth <= 10 && soilTemp >= 50 && soilTemp <= 65) {
    alerts.push({
      id: 'alert-fall-lawn-active',
      type: 'urgent',
      category: 'Lawn',
      title: `PRIME FALL LAWN AERATION & OVERSEEDING WINDOW (Soil: ${soilTemp}°F)`,
      description: `Optimal cool-season turf renovation window is active now in ${seasonInfo.label}. Soil temperatures between 55°F–65°F provide rapid seed germination and deep root development before winter.`,
      actionLabel: 'View Fall Lawn Renovation Task',
      relatedTaskId: 'task-fa-3',
    });
  }

  // --- 5. WEATHER & PRECIPITATION / FROST ADVISORY ---
  if (weather.isFrostRisk) {
    alerts.push({
      id: 'alert-frost-warning',
      type: 'weather',
      category: 'Weather',
      title: 'FROST ADVISORY: Temperatures Near Freezing (32°F)',
      description:
        'Overnight lows approach freezing. Protect tender container plants and hold off on new pruning cuts until freeze risk clears.',
    });
  } else if (weather.precipitation > 0 || (weather.precipProbability >= 40 && weather.precipProbability <= 75)) {
    alerts.push({
      id: 'alert-rain-optimal',
      type: 'optimal',
      category: 'Weather',
      title: `FAVORABLE PRECIPITATION FOR SOIL ABSORPTION (${weather.precipProbability}% Rain / ${weather.precipitation} in)`,
      description:
        'Natural precipitation helps dissolve and move granular organic nutrients (Holly Tone / Rose Tone) deep into root zones.',
    });
  }

  return (
    <div className="bg-[#F2F7F4] border-b border-emerald-100/90 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold font-serif-natural tracking-normal text-slate-900">
              Seasonal & Soil Action Alerts ({seasonInfo.label} • Soil {soilTemp}°F • {weather.zone})
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-white text-emerald-900 text-[11px] font-mono font-semibold border border-emerald-200 shadow-2xs">
              {readyTasks.length} action{readyTasks.length === 1 ? '' : 's'} ready now
            </span>
            <span className="text-[11px] font-mono text-slate-600">
              {alerts.length} trigger{alerts.length === 1 ? '' : 's'} active
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {alerts.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-white text-slate-700 text-xs font-mono flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-sans text-[13px] text-slate-700">
                  All scheduled tasks are aligned with current seasonal timing ({seasonInfo.label}) and live soil temperature ({soilTemp}°F).
                </span>
              </div>
            </div>
          ) : (
            alerts.map((alert) => {
            const isUrgent = alert.type === 'urgent';
            const isOptimal = alert.type === 'optimal';
            const isWeather = alert.type === 'weather';
            const isWarning = alert.type === 'warning';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border text-xs font-mono transition-all shadow-xs ${
                  isWarning
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : isUrgent
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                    : isOptimal
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : isWeather
                    ? 'bg-sky-50/90 border-sky-300 text-sky-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isWarning && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                      {isUrgent && <AlertCircle className="w-4 h-4 text-rose-600" />}
                      {isOptimal && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isWeather && <Info className="w-4 h-4 text-sky-600" />}
                      {!isWarning && !isUrgent && !isOptimal && !isWeather && <Info className="w-4 h-4 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-xs tracking-tight">{alert.title}</span>
                        <span className="px-2 py-0.5 text-[9px] rounded-md font-mono uppercase bg-white/80 border border-slate-200 text-slate-700 font-semibold">
                          {alert.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-sans leading-relaxed text-slate-700 font-normal">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start mt-1 sm:mt-0">
                    {alert.actionLabel && (
                      <button
                        onClick={() => alert.relatedTaskId && onSelectTask(alert.relatedTaskId)}
                        className="px-3 py-1.5 text-[11px] font-mono font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{alert.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};
