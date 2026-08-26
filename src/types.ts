export type GardenBed =
  | 'Front Garden'
  | 'Shared Garden'
  | 'Garage Garden'
  | 'Backyard'
  | 'Planter Box'
  | 'Lawn Care';

export type FertilizerType =
  | 'Holly Tone'
  | 'Plant Tone'
  | 'Rose Tone'
  | '10-10-10 Balanced'
  | 'All Purpose'
  | 'Fruit Tree'
  | 'Granular Rose Fertilizer'
  | 'Lawn Fertilizer (Pre-emergent)'
  | 'Lawn Fertilizer (Spring/Fall)'
  | 'None';

export type SeasonStage =
  | 'Late Winter'
  | 'Early Spring'
  | 'Mid Spring'
  | 'Late Spring'
  | 'Early Summer'
  | 'Summer'
  | 'Early Fall'
  | 'Late Fall'
  | 'Winter';

export interface PlantRecord {
  id: string;
  bed: GardenBed;
  name: string;
  fertilizing: string;
  pruning: string;
  watering: string;
  yearPlanted: string;
  extraNotes: string;
  fertilizerType: FertilizerType;
  optimalSoilTempMinF: number;
  optimalSoilTempMaxF: number;
  pruneWindowText: string;
  fertilizeWindowText: string;
  wateringGuidance: string;
  hardinessNotes?: string;
  category: 'Shrub' | 'Perennial' | 'Tree' | 'Climber' | 'Rose' | 'Groundcover' | 'Turf';
}

export type TaskType = 'fertilize' | 'prune' | 'water' | 'lawn' | 'soil_temp' | 'general';
export type TaskUrgency = 'urgent' | 'optimal' | 'upcoming' | 'completed' | 'dormant';

export interface ScheduledTask {
  id: string;
  plantId?: string;
  plantName: string;
  bed: GardenBed;
  type: TaskType;
  title: string;
  instruction: string;
  soilTempCondition: string;
  minSoilTempF?: number;
  maxSoilTempF?: number;
  targetSeason: SeasonStage;
  targetMonths: number[]; // 1 = Jan, 12 = Dec
  timingNote?: string;
  fertilizerProduct?: FertilizerType;
  recommendedDose?: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  isCustom?: boolean;
}

export interface WeatherCondition {
  locationName: string;
  latitude: number;
  longitude: number;
  zone: string;
  airTempF: number; // temperature_2m
  soilTempF: number; // primary agronomic root depth soil temp (~6cm)
  soilTemp0cmF: number; // soil_temperature_0cm (surface level)
  soilTemp6cmF: number; // soil_temperature_6cm (root zone depth ~2.4 in)
  precipitation: number; // precipitation (current precipitation in inches)
  soilMoisturePercent: number;
  conditionText: string;
  humidity: number; // relative_humidity_2m
  windMph: number;
  precipProbability: number;
  isFrostRisk: boolean;
  isUserLocation?: boolean;
  soilState: 'Frozen' | 'Thawed / Cold' | 'Early Growth (45-55°F)' | 'Active Growth (55-70°F)' | 'Warm / Summer (>70°F)';
  forecast: Array<{
    date: string;
    dayName: string;
    highF: number;
    lowF: number;
    soilTempF: number;
    soilTemp0cmF?: number;
    soilTemp6cmF?: number;
    precipProb: number;
    condition: string;
    frostWarning: boolean;
  }>;
  lastUpdated: string;
}

export type WeedLevel = 'minimal' | 'moderate' | 'heavy';
export type BareSpotsLevel = 'none' | 'few_patches' | 'severe_bare';
export type TurfGrassType = 'fescue_bluegrass' | 'bermuda_warm' | 'mixed_unknown';
export type TurfPrimaryGoal = 'general_health' | 'weed_control' | 'bare_patch_repair' | 'overseeding_renovation';

export interface LawnCondition {
  weedLevel: WeedLevel;
  bareSpotsLevel: BareSpotsLevel;
  turfType?: TurfGrassType;
  primaryGoal?: TurfPrimaryGoal;
}

export interface StorePriceOption {
  storeName: 'Home Depot' | 'Amazon Prime' | "Lowe's" | 'Walmart' | 'Online Direct' | 'Shipping Only';
  price: number;
  priceFormatted: string;
  inStock: boolean;
  shippingNote: string;
  url: string;
  isCheapest: boolean;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category: 'Fertilizer' | 'Pruning & Shears' | 'Pre-Emergent' | 'Turf Seed & Lawn' | 'Soil Conditioner' | 'Pest & Disease';
  purpose: string;
  timingTrigger: string;
  estimatedReadyDaysOut: number; // e.g. 7 days
  estimatedReadyDate: string;
  advanceNotificationTitle: string;
  advanceNotificationBody: string;
  cheapestStore: string;
  cheapestPrice: number;
  cheapestPriceFormatted: string;
  cheapestUrl: string;
  stores: StorePriceOption[];
  applicationTip: string;
  coverageOrDose: string;
  relatedPlantsOrLawn: string[];
  groundingSources?: Array<{ title: string; url: string }>;
}

export interface SevenDayForecastPrediction {
  daysOut: number;
  date: string;
  estimatedAirTempF: number;
  estimatedSoilTempF: number;
  condition: string;
  upcomingActionsReady: string[];
}
