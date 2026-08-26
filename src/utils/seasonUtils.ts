import { SeasonStage, ScheduledTask } from '../types';

export interface TaskReadiness {
  isReadyNow: boolean; // Ready to occur right now based on BOTH soil temp and season
  isCompleted: boolean;
  isPastSeason: boolean; // Season has already passed for this calendar year
  isSoilTempPassed: boolean; // Soil temp has exceeded max threshold (e.g. too warm)
  isUpcomingSeason: boolean; // Scheduled for a future month/season
  isAwaitingSoilTemp: boolean; // In season, but waiting for soil temp to warm up to min threshold
  statusText: string;
  statusCategory: 'ready_now' | 'past_window' | 'upcoming' | 'awaiting_temp' | 'completed';
  explanation: string;
}

/**
 * Returns the current calendar month (1-12)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Returns formatted current date string e.g. "August 25, 2026"
 */
export function getCurrentFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns human-readable season name and stage based on month
 */
export function getSeasonStageForMonth(month: number): { seasonStage: SeasonStage; label: string; description: string } {
  switch (month) {
    case 1:
      return {
        seasonStage: 'Winter',
        label: 'Mid Winter (January)',
        description: 'Dormancy period. Avoid pruning tender plants or fertilizing.',
      };
    case 2:
      return {
        seasonStage: 'Late Winter',
        label: 'Late Winter (February)',
        description: 'Dormant pruning for hardwoods, fruit trees & clematis before bud break.',
      };
    case 3:
      return {
        seasonStage: 'Early Spring',
        label: 'Early Spring (March)',
        description: 'Soil thawing. Acid tone top-dressing and crabgrass pre-emergent prep.',
      };
    case 4:
      return {
        seasonStage: 'Mid Spring',
        label: 'Mid Spring (April)',
        description: 'Active vegetative surge, perennial crown cleanups, spring fertilizing.',
      };
    case 5:
      return {
        seasonStage: 'Late Spring',
        label: 'Late Spring (May)',
        description: 'Post-flowering prune for early bloomers (Lilacs, Azaleas). Secondary feeds.',
      };
    case 6:
      return {
        seasonStage: 'Early Summer',
        label: 'Early Summer (June)',
        description: 'Gardenia post-bloom shaping, rose rebloom maintenance, summer hydration.',
      };
    case 7:
      return {
        seasonStage: 'Summer',
        label: 'Mid Summer (July)',
        description: 'Mid-summer booster feeds (Hydrangeas), delphinium deadheading, deep watering.',
      };
    case 8:
      return {
        seasonStage: 'Summer',
        label: 'Late Summer (August)',
        description: 'Late summer maintenance. Avoid pruning spring bloomers (Gardenia/Azalea) to protect next year’s buds. Halt high-nitrogen feeds.',
      };
    case 9:
      return {
        seasonStage: 'Early Fall',
        label: 'Early Fall (September)',
        description: 'Prime cool-season turf aeration, overseeding, and root-building fall fertilizers.',
      };
    case 10:
      return {
        seasonStage: 'Early Fall',
        label: 'Mid Fall (October)',
        description: 'Lawn winterizer applications, fall perennial cutbacks as foliage collapses.',
      };
    case 11:
      return {
        seasonStage: 'Late Fall',
        label: 'Late Fall (November)',
        description: 'Pre-winter bed mulching, final mow, post-frost perennial cuts.',
      };
    case 12:
      return {
        seasonStage: 'Winter',
        label: 'Early Winter (December)',
        description: 'Winter dormancy. Protect broadleaf evergreens from wind desiccation.',
      };
    default:
      return {
        seasonStage: 'Summer',
        label: 'Summer',
        description: 'Warm season care.',
      };
  }
}

/**
 * Evaluates whether a task is actionable right now based on BOTH current season/month AND soil temperature.
 * Strictly respects user intent: tasks whose season or soil temp window has passed are NEVER shown as active pending.
 */
export function evaluateTaskTiming(
  task: ScheduledTask,
  currentSoilTempF: number,
  currentMonth: number = getCurrentMonth()
): TaskReadiness {
  if (task.completed) {
    return {
      isReadyNow: false,
      isCompleted: true,
      isPastSeason: false,
      isSoilTempPassed: false,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: `Completed ${task.completedDate ? `on ${task.completedDate}` : ''}`,
      statusCategory: 'completed',
      explanation: 'Task has been recorded as finished.',
    };
  }

  const targetMonths = task.targetMonths || [3, 4];
  const minMonth = Math.min(...targetMonths);
  const maxMonth = Math.max(...targetMonths);

  const minSoilTemp = task.minSoilTempF ?? 0;
  const maxSoilTemp = task.maxSoilTempF ?? 999;

  const isInSeason = targetMonths.includes(currentMonth);
  const isSoilTempMatch = currentSoilTempF >= minSoilTemp && currentSoilTempF <= maxSoilTemp;

  // 1. Has the seasonal month window already passed for this calendar year?
  // (e.g. task is for months [3, 4] or [5, 6], and current month is 8 / August)
  const isPastMonth = currentMonth > maxMonth;

  // 2. Is the task scheduled for a future month?
  // (e.g. task is for months [9, 10] or [10, 11], and current month is 8 / August)
  const isFutureMonth = currentMonth < minMonth;

  // 3. Soil temp window passed (e.g. soil has gotten too warm for early-spring/dormant tasks)
  const isSoilTempTooWarm = currentSoilTempF > maxSoilTemp;
  const isSoilTempTooCold = currentSoilTempF < minSoilTemp;

  // Special plant horticultural safety rules:
  // e.g. Gardenia pruning (plantId 'gg-1', type 'prune') must NEVER be performed in late summer or fall (month > 6)
  if (task.plantName.toLowerCase().includes('gardenia') && task.type === 'prune' && currentMonth >= 7) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: true,
      isSoilTempPassed: false,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: 'Pruning Window Passed (Late Summer)',
      statusCategory: 'past_window',
      explanation:
        'DO NOT PRUNE in late summer. Gardenias set next spring’s flower buds in late summer/early autumn. Pruning now destroys next year’s flowers and stimulates freeze-vulnerable soft shoots.',
    };
  }

  // Azalea & Rhododendron post-bloom pruning window passes after June
  if (
    (task.plantName.toLowerCase().includes('azalea') || task.plantName.toLowerCase().includes('rhododendron')) &&
    task.type === 'prune' &&
    currentMonth >= 7
  ) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: true,
      isSoilTempPassed: false,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: 'Pruning Window Passed (Post-Bloom Passed)',
      statusCategory: 'past_window',
      explanation:
        'Post-bloom pruning window closed in June. Buds for next spring have already set. Do not prune now.',
    };
  }

  // Crabgrass pre-emergent window passes after early spring / May
  if (task.title.toLowerCase().includes('crabgrass') && (currentMonth >= 6 || currentSoilTempF > 65)) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: true,
      isSoilTempPassed: true,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: 'Pre-Emergent Window Passed',
      statusCategory: 'past_window',
      explanation:
        'Crabgrass germination window (50-55°F spring) has passed. Focus on summer weed spot-treatment or upcoming fall lawn aeration/overseeding.',
    };
  }

  // General evaluation
  if (isInSeason && isSoilTempMatch) {
    return {
      isReadyNow: true,
      isCompleted: false,
      isPastSeason: false,
      isSoilTempPassed: false,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: 'Ready Now (Season & Soil Match)',
      statusCategory: 'ready_now',
      explanation: `Current season (${getSeasonStageForMonth(currentMonth).label}) and current soil temp (${currentSoilTempF}°F) are optimal.`,
    };
  }

  if (isPastMonth) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: true,
      isSoilTempPassed: isSoilTempTooWarm,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: `Past Season Window (${task.targetSeason})`,
      statusCategory: 'past_window',
      explanation: `Seasonal window closed (Target was ${task.timingNote || task.targetSeason}). Not active for current season.`,
    };
  }

  if (isFutureMonth) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: false,
      isSoilTempPassed: false,
      isUpcomingSeason: true,
      isAwaitingSoilTemp: false,
      statusText: `Upcoming Season (${task.targetSeason})`,
      statusCategory: 'upcoming',
      explanation: `Scheduled for upcoming month window: ${task.timingNote || task.targetSeason}.`,
    };
  }

  if (isInSeason && isSoilTempTooCold) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: false,
      isSoilTempPassed: false,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: true,
      statusText: `Awaiting Soil Temp (${minSoilTemp}°F–${maxSoilTemp}°F)`,
      statusCategory: 'awaiting_temp',
      explanation: `Right season, but soil is currently ${currentSoilTempF}°F (needs to reach at least ${minSoilTemp}°F).`,
    };
  }

  if (isInSeason && isSoilTempTooWarm) {
    return {
      isReadyNow: false,
      isCompleted: false,
      isPastSeason: false,
      isSoilTempPassed: true,
      isUpcomingSeason: false,
      isAwaitingSoilTemp: false,
      statusText: `Soil Temp Exceeded Max (${maxSoilTemp}°F)`,
      statusCategory: 'past_window',
      explanation: `Soil temperature (${currentSoilTempF}°F) is above optimal maximum of ${maxSoilTemp}°F.`,
    };
  }

  return {
    isReadyNow: false,
    isCompleted: false,
    isPastSeason: isPastMonth,
    isSoilTempPassed: isSoilTempTooWarm,
    isUpcomingSeason: isFutureMonth,
    isAwaitingSoilTemp: isSoilTempTooCold,
    statusText: 'Out of Season Window',
    statusCategory: 'past_window',
    explanation: 'Conditions do not match active seasonal and temperature triggers.',
  };
}
