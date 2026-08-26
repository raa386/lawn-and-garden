import React, { useState } from 'react';
import {
  Calendar,
  Thermometer,
  ShieldCheck,
  Scissors,
  Droplets,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import { TurfGrassType } from '../types';

interface SeasonalGuideProps {
  currentSoilTempF: number;
  currentZone: string;
}

interface TurfProgramStep {
  stepNumber: number;
  name: string;
  windowTitle: string;
  targetMonths: string;
  soilTempTrigger: string;
  minSoilTemp: number;
  maxSoilTemp: number;
  purpose: string;
  recommendedProducts: string[];
  applicationRate: string;
  agronomicTips: string[];
  category: 'Fertilizer' | 'Weed Control' | 'Insect/Disease' | 'Seeding/Renovation';
}

export const SeasonalGuide: React.FC<SeasonalGuideProps> = ({
  currentSoilTempF,
  currentZone,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'turf-schedule' | 'season-milestones'>('turf-schedule');
  const [selectedGrassType, setSelectedGrassType] = useState<TurfGrassType>('fescue_bluegrass');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // 7-Step Turf Schedule for Long Island (11752 / Suffolk County • Zone 7b Cool-Season)
  const coolSeasonTurfSteps: TurfProgramStep[] = [
    {
      stepNumber: 1,
      name: 'Early Spring Pre-Emergent & Soil Awakening (Post-April 1)',
      windowTitle: 'Round 1: Crabgrass Barrier & Zero-Phosphorus Awakening',
      targetMonths: 'April 1 – Mid-April (Suffolk Law: Blackout lifts April 1)',
      soilTempTrigger: '50°F – 55°F (at 2" depth)',
      minSoilTemp: 48,
      maxSoilTemp: 56,
      category: 'Weed Control',
      purpose: 'Establish a pre-emergent barrier in Long Island sandy loam just as forsythias drop petals. Compliant with Suffolk County April 1 blackout lifting.',
      recommendedProducts: [
        'Scotts Halts Crabgrass Preventer',
        'Jonathan Green Season-Long Weed Preventer (Dimension / Dithiopyr)',
        'Prodiamine 65 WDG (Barricade)',
      ],
      applicationRate: 'Apply at label bag rate; calibrate spreader for Long Island sandy loam',
      agronomicTips: [
        'Suffolk County Law: Fertilizer blackout is in effect until April 1. Apply pre-emergent in early to mid-April.',
        'Apply when soil temperatures sustain 50-55°F for 3 consecutive days (Forsythia petal drop).',
        'Must be watered in with 0.5 inches of rain or irrigation to seal the barrier into topsoil.',
      ],
    },
    {
      stepNumber: 2,
      name: 'Late Spring Broadleaf Weed Control & Sandy Soil Conditioning',
      windowTitle: 'Round 2: Broadleaf Knockdown & Mag-I-Cal Plus pH Buffer',
      targetMonths: 'Late April – May',
      soilTempTrigger: '55°F – 65°F',
      minSoilTemp: 55,
      maxSoilTemp: 65,
      category: 'Fertilizer',
      purpose: 'Knock down dandelions/clover and condition Long Island naturally acidic sandy soil (pH 5.5-6.2) with slow-release nitrogen (zero phosphorus).',
      recommendedProducts: [
        'Jonathan Green MAG-I-CAL Plus for Acidic & Sandy Soils (Calcium & Humates)',
        'SpeedZone or T-Zone SE Broadleaf Herbicide (Spot Spray)',
        'Slow-Release Granular 24-0-4 (50% Slow-Release Nitrogen - Suffolk Compliant)',
      ],
      applicationRate: '0.75 lb Nitrogen per 1,000 sq. ft. (Zero Phosphorus)',
      agronomicTips: [
        'NYS Zero-Phosphorus Law: Always use phosphorus-free fertilizer (middle number 0) unless establishing new seed.',
        'Mag-I-Cal Plus releases trapped micronutrients in Suffolk County sandy glacial soil.',
        'Spot-spray broadleaf weeds on a calm morning rather than blanket chemical spraying.',
      ],
    },
    {
      stepNumber: 3,
      name: 'Early Summer Grub Preventative & Coastal Iron Color Boost',
      windowTitle: 'Round 3: Subsurface Grub Defense & Non-Burning Iron Greening',
      targetMonths: 'June',
      soilTempTrigger: '65°F – 72°F',
      minSoilTemp: 65,
      maxSoilTemp: 75,
      category: 'Insect/Disease',
      purpose: 'Inoculate root zone against European chafer & Japanese beetle grubs (very prevalent in Long Island sand) and boost emerald color with iron (no fast nitrogen).',
      recommendedProducts: [
        'Scotts GrubEx (Chlorantraniliprole - Long Island Essential)',
        'Milorganite 6-4-0 or Ironite Plus (High Iron, Zero Heat Burn)',
        'Jonathan Green Green-Up with Iron (Zero Phosphorus)',
      ],
      applicationRate: 'GrubEx at label rate; water in immediately with 0.5-1.0 inch irrigation.',
      agronomicTips: [
        'Long Island sandy loam provides easy burrowing for grubs; June is the non-negotiable window for preventative control.',
        'Never apply high fast-release nitrogen in summer—it burns sandy lawns and causes brown patch fungus.',
        'Iron provides deep emerald greening through chlorophyll without triggering heat stress.',
      ],
    },
    {
      stepNumber: 4,
      name: 'Mid-Summer Heat Stress Defense & Disease/Sedge Mitigation',
      windowTitle: 'Round 4: Coastal Humidity Fungus Shield & Sedge Control',
      targetMonths: 'July – August',
      soilTempTrigger: '72°F – 82°F',
      minSoilTemp: 72,
      maxSoilTemp: 85,
      category: 'Insect/Disease',
      purpose: 'Protect turf through Long Island coastal humidity, brown patch fungus pressure, and yellow nutsedge emergence.',
      recommendedProducts: [
        'BioAdvanced Fungus Control for Lawns (or Heritage G)',
        'Sedgehammer Plus (Selective Yellow Nutsedge Knockdown)',
        'Liquid Humic Acid & Seaweed Extract Bio-Stimulant',
      ],
      applicationRate: 'Spot-treat nutsedge with Sedgehammer; apply fungicide if night temps exceed 70°F with high humidity.',
      agronomicTips: [
        'Mowing height: Raise mower deck to 3.5" – 4.0" to shade root crowns in sandy soil.',
        'Watering protocol: Water deeply 1.0 – 1.5 inches per week at 5:00 AM. Avoid evening watering to prevent foliar fungal blights.',
        'Do NOT hand-pull nutsedge—spraying with Sedgehammer kills the underground nutlets.',
      ],
    },
    {
      stepNumber: 5,
      name: 'Late Summer / Early Fall Aeration, Overseeding & Starter Feed',
      windowTitle: 'Round 5: Prime Long Island Seeding Window & Deep Root Establishment',
      targetMonths: 'Late August – September (Prime Long Island Window)',
      soilTempTrigger: '55°F – 65°F (Cooling)',
      minSoilTemp: 55,
      maxSoilTemp: 68,
      category: 'Seeding/Renovation',
      purpose: 'The most critical event of the year for 11752: core aerate sandy soil, introduce drought-hardy Jonathan Green Black Beauty Ultra, and apply seed-safe starter fertilizer.',
      recommendedProducts: [
        'Jonathan Green Black Beauty Ultra Grass Seed (Tall Fescue + KBG blend)',
        'Scotts Turf Builder Starter Food for New Grass Plus Weed Preventer (Mesotrione)',
        'Jonathan Green MAG-I-CAL Plus (Soil Conditioner)',
      ],
      applicationRate: 'Overseeding: 4–5 lbs per 1,000 sq. ft. | Starter fertilizer at label rate',
      agronomicTips: [
        'Atlantic Maritime Advantage: Long Island enjoys warm soil and cooling nights well through October, making late August to late September ideal.',
        'Mesotrione (Tenacity) is crucial: prevents crabgrass/clover while grass seed sprouts safely.',
        'Keep top 1/2 inch of soil consistently damp with 2-3 brief daily sprinkler cycles until new grass is 2 inches tall.',
      ],
    },
    {
      stepNumber: 6,
      name: 'Mid-Fall Root Expansion & Young Tiller Feed',
      windowTitle: 'Round 6: Follow-Up Tiller Thickener & Leaf Mulching',
      targetMonths: 'October (Apply before Oct 25)',
      soilTempTrigger: '50°F – 58°F',
      minSoilTemp: 50,
      maxSoilTemp: 60,
      category: 'Fertilizer',
      purpose: 'Thicken new seedlings, push lateral tillers, and deepen root anchors in sandy soil before winter dormancy.',
      recommendedProducts: [
        'Jonathan Green Green-Up Fall Lawn Food (Zero-Phosphorus)',
        'Scotts Turf Builder Fall Lawn Food (32-0-10)',
        'Organic Leaf Compost Topdressing',
      ],
      applicationRate: '0.75 – 1.0 lb Nitrogen per 1,000 sq. ft. (Zero Phosphorus)',
      agronomicTips: [
        'Apply once newly seeded turf has been mowed at least twice.',
        'Mulch fallen oak/maple leaves directly into the lawn with your mower to build organic matter in sandy topsoil.',
      ],
    },
    {
      stepNumber: 7,
      name: 'Late Fall Turf Winterizer (MANDATORY: Apply Before Nov 1 Cutoff)',
      windowTitle: 'Round 7: Carbohydrate Storing & Suffolk County Cutoff Compliance',
      targetMonths: 'Late October (Strict Cutoff: October 31)',
      soilTempTrigger: '42°F – 48°F',
      minSoilTemp: 40,
      maxSoilTemp: 48,
      category: 'Fertilizer',
      purpose: 'Store carbohydrates in root systems for instant spring green-up. MUST be applied on or before October 31 to comply with Suffolk County / NYS law.',
      recommendedProducts: [
        'Jonathan Green Winter Survival Fall Lawn Food (10-0-20 High Potassium)',
        'Scotts Turf Builder WinterGuard Fall Lawn Food',
        'GreenView Fall Fertilizer (High Potassium)',
      ],
      applicationRate: '0.75 – 1.0 lb Nitrogen per 1,000 sq. ft.',
      agronomicTips: [
        'SUFFOLK COUNTY LAW COMPLIANCE: All fertilizer applications are legally barred between November 1 and April 1 to protect the Long Island sole-source aquifer.',
        'Apply during the final week of October right after the final regular mowing.',
        'Lower mower deck to 2.5" on the last cut to prevent snow mold during wet Long Island winter storms.',
      ],
    },
  ];

  // Warm-Season Steps (Bermuda / Zoysia)
  const warmSeasonTurfSteps: TurfProgramStep[] = [
    {
      stepNumber: 1,
      name: 'Late Winter Pre-Emergent for Summer Weeds',
      windowTitle: 'Round 1: Pre-Emergent before Spring Green-Up',
      targetMonths: 'February – Early March',
      soilTempTrigger: '50°F – 55°F',
      minSoilTemp: 48,
      maxSoilTemp: 55,
      category: 'Weed Control',
      purpose: 'Block summer annual weeds before dormant turf breaks dormancy.',
      recommendedProducts: ['Prodiamine 65 WDG', 'Dimension (Dithiopyr)'],
      applicationRate: '0.5 – 0.75 lb AI/Acre',
      agronomicTips: ['Do not apply high nitrogen while turf is dormant.'],
    },
    {
      stepNumber: 2,
      name: 'Spring Green-Up & Light Nutrition',
      windowTitle: 'Round 2: Post Green-Up Wake Up Feed',
      targetMonths: 'April – May',
      soilTempTrigger: '65°F+',
      minSoilTemp: 62,
      maxSoilTemp: 72,
      category: 'Fertilizer',
      purpose: 'Feed turf once at least 70% green to support vigorous stolon growth.',
      recommendedProducts: ['16-4-8 Slow Release', 'Milorganite'],
      applicationRate: '0.75 lb Nitrogen per 1,000 sq. ft.',
      agronomicTips: ['Wait until second mow before applying heavy nitrogen.'],
    },
    {
      stepNumber: 3,
      name: 'Summer Peak Growth & Micronutrient Feeds',
      windowTitle: 'Round 3: High Vigor Nitrogen & Aeration',
      targetMonths: 'June – July',
      soilTempTrigger: '75°F – 88°F',
      minSoilTemp: 75,
      maxSoilTemp: 90,
      category: 'Fertilizer',
      purpose: 'Peak vegetative growth for Bermuda/Zoysia; optimal window for warm-season core aeration.',
      recommendedProducts: ['Scotts Turf Builder Southern Lawn Food', 'Bermuda Special 21-7-14'],
      applicationRate: '1.0 lb Nitrogen per 1,000 sq. ft. monthly in summer.',
      agronomicTips: ['Core aerate in June during active recovery phase.'],
    },
    {
      stepNumber: 4,
      name: 'Early Fall Pre-Emergent for Winter Annuals (Poa Annua)',
      windowTitle: 'Round 4: Winter Weed Barrier & Potassium Hardening',
      targetMonths: 'September – October',
      soilTempTrigger: '70°F cooling to 60°F',
      minSoilTemp: 58,
      maxSoilTemp: 70,
      category: 'Weed Control',
      purpose: 'Block Poa annua (annual bluegrass) and henbit before winter dormancy.',
      recommendedProducts: ['Prodiamine 65 WDG', '0-0-20 High Potassium Fall Food'],
      applicationRate: 'Label rate pre-emergent + high potash.',
      agronomicTips: ['Cease nitrogen 6 weeks before first expected frost.'],
    },
  ];

  const activeSteps = selectedGrassType === 'fescue_bluegrass' ? coolSeasonTurfSteps : warmSeasonTurfSteps;

  const stages = [
    {
      season: 'Late Winter',
      soilRange: '< 45°F',
      timing: 'February – Early March',
      focus: 'Dormancy Pruning & Structural Cleaning',
      gardenActions: [
        'Prune Clematis hard down to 6" above soil before bud break.',
        'Hardwood renewal pruning on Lilac (remove 1/3 oldest thick stems).',
        'Prune crossing branches on Kwanzan Flowering Cherry Tree.',
      ],
      lawnActions: [
        'Keep lawn clear of heavy debris and winter leaves.',
        'Service mower, sharpen blades, test soil pH if needed.',
      ],
    },
    {
      season: 'Early Spring',
      soilRange: '45°F – 55°F',
      timing: 'March – April',
      focus: 'Kickoff Fertilization & Lawn Pre-Emergent',
      gardenActions: [
        'Apply Holly Tone to Boxwoods, Bloomstruck Hydrangeas, Olympic Fire, Azaleas, Rhodos, Gardenia.',
        'Apply Rose Tone to Carpet Rose; shape bushes back by 1/3.',
        'Apply Granular Rose Fertilizer to Let\'s Dance Can Do Hydrangea once ground thaws.',
        'Top dress Astilbe, Bleeding Heart, Coneflower, Euonymus, Leylands with All-Purpose food.',
        'Cut old Astilbe & Coneflower winter foliage down to ground.',
      ],
      lawnActions: [
        'Round 1 Turf: Crabgrass pre-emergent barrier when 2" soil hits 50-55°F.',
        'Begin regular mowing at 3.0" height once turf starts active vertical growth.',
      ],
    },
    {
      season: 'Mid to Late Spring',
      soilRange: '55°F – 65°F',
      timing: 'May – Early June',
      focus: 'Post-Bloom Pruning & Round 2 Rose Fertilizer',
      gardenActions: [
        'Prune Azaleas & Rhododendrons immediately after blooms finish (snap spent trusses).',
        'Softwood prune Lilacs immediately after flowers fade.',
        'Prune Gardenia after spring flowering cycle to shape.',
        'Snip spent blooms on Olympic Fire mountain laurel.',
        'Apply Round 2 Granular Rose Fertilizer to Can Do Hydrangea.',
        'Delphinium 10-10-10 feeding as flower spikes rise.',
      ],
      lawnActions: [
        'Round 2 Turf: Broadleaf weed & feed or spot spray dandelion/clover during active growth.',
        'Split pre-emergent booster if heavy weed history exists.',
      ],
    },
    {
      season: 'Summer Peak',
      soilRange: '65°F – 80°F',
      timing: 'June – August',
      focus: 'Hydrangea July Booster, Delphinium 2nd Bloom & Hydration',
      gardenActions: [
        'July Holly Tone Booster for Bloomstruck & Shared Garden Hydrangeas.',
        'Monthly Rose Tone feeding for Carpet Rose.',
        'Delphinium: Remove center bloom spike, then cut back to 2" for second late-summer bloom.',
        'Watering focus: Deep weekly soak for boxwoods, hydrangeas, astilbes, and roses.',
      ],
      lawnActions: [
        'Round 3 Turf: Grub control preventative (GrubEx/Chlorantraniliprole) + non-burning Ironite/Milorganite.',
        'Round 4 Turf: Raise deck to 3.5"-4.0", deep morning watering (1-1.5" weekly), spray nutsedge with Sedgehammer.',
      ],
    },
    {
      season: 'Autumn / Fall',
      soilRange: '55°F – 65°F (Cooling)',
      timing: 'September – November',
      focus: 'Lawn Aeration/Overseeding & Winter Prep',
      gardenActions: [
        'Delphinium: Prune entire plant down to ground after autumn frost wilts foliage.',
        'Light fall feeding on Ice Plant (optional); verify gravel drainage.',
        'Water evergreens (Boxwoods, Rhodos, Leylands) deeply before ground freezes.',
      ],
      lawnActions: [
        'Round 5 Turf: PEAK WINDOW — Core aeration, fescue overseeding, and starter fertilizer with Mesotrione.',
        'Round 6 Turf: Mid-fall root thickening feed 4-6 weeks after seed emergence.',
        'Round 7 Turf: Late fall winterizer (high potassium + quick nitrogen) when top growth stops.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-amber-300">
                <Calendar className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold font-serif-natural text-slate-900 tracking-normal">
                Agronomic Milestones & Complete Turf Schedule
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-sans">
              Comprehensive 7-step turf nutrition, herbicide timing, disease prevention, and seasonal garden bed milestones.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex items-center space-x-2 shadow-2xs">
            <Thermometer className="w-4 h-4 text-rose-600" />
            <span>Current Soil: <strong className="text-emerald-800">{currentSoilTempF}°F</strong> ({currentZone})</span>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('turf-schedule')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'turf-schedule'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Long Island 7-Step Turf Schedule</span>
          </button>

          <button
            onClick={() => setActiveSubTab('season-milestones')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'season-milestones'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-amber-300" />
            <span>Garden & Bed Milestones</span>
          </button>
        </div>
      </div>

      {/* Long Island 11752 Environmental & Soil Profile Callout */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs font-mono text-slate-800 shadow-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-emerald-800 text-amber-300 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-serif-natural font-bold text-base text-slate-900">
                Islip Terrace, NY 11752 • Long Island Soil & Regulatory Profile
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                Suffolk County Compliance
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-emerald-800 mb-1 flex items-center space-x-1">
                  <span>⚠️ Suffolk County Fertilizer Law</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  <strong className="text-slate-900">Blackout: Nov 1 – April 1.</strong> NYS ECL § 17-2101 prohibits turf fertilizer in winter to protect our sole-source aquifer and Great South Bay.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-emerald-800 mb-1 flex items-center space-x-1">
                  <span>🧪 Zero-Phosphorus Mandate</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Lawn fertilizer must be 0% phosphorus (e.g., 24-0-4, 10-0-20) on established turf to prevent coastal algae blooms in Long Island waterways.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-emerald-800 mb-1 flex items-center space-x-1">
                  <span>🌱 Sandy Glacial Loam & pH 5.8</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Long Island sandy soil leaches quickly and trends acidic. Use slow-release nitrogen, humates, and <strong className="text-slate-900">Jonathan Green Mag-I-Cal Plus</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SubTab 1: Complete Turf Treatment & Feeding Schedule */}
      {activeSubTab === 'turf-schedule' && (
        <div className="space-y-4">
          {/* Turf grass selector bar */}
          <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-300" />
              <span className="font-bold text-xs font-mono uppercase tracking-wide">Turfgrass Variety Program:</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <button
                onClick={() => setSelectedGrassType('fescue_bluegrass')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedGrassType === 'fescue_bluegrass'
                    ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                    : 'bg-emerald-800/80 text-emerald-100 hover:text-white border border-emerald-700'
                }`}
              >
                Cool Season (Tall Fescue / KBG / Rye)
              </button>
              <button
                onClick={() => setSelectedGrassType('bermuda_zoysia')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedGrassType === 'bermuda_zoysia'
                    ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                    : 'bg-emerald-800/80 text-emerald-100 hover:text-white border border-emerald-700'
                }`}
              >
                Warm Season (Bermuda / Zoysia)
              </button>
            </div>
          </div>

          {/* Granular Step Cards */}
          <div className="space-y-3">
            {activeSteps.map((step) => {
              const isSoilReadyNow =
                currentSoilTempF >= step.minSoilTemp && currentSoilTempF <= step.maxSoilTemp;
              const isExpanded = expandedStep === step.stepNumber;

              return (
                <div
                  key={step.stepNumber}
                  className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all ${
                    isSoilReadyNow
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                    className={`p-4 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b ${
                      isSoilReadyNow
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50/60 border-slate-100'
                    } hover:bg-slate-100/70 transition-colors`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs ${
                          isSoilReadyNow
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-900 text-white'
                        }`}
                      >
                        #{step.stepNumber}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4 className="font-bold text-sm text-slate-900 font-mono">
                            {step.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              step.category === 'Fertilizer'
                                ? 'bg-emerald-100 text-emerald-900'
                                : step.category === 'Weed Control'
                                ? 'bg-rose-100 text-rose-900'
                                : step.category === 'Seeding/Renovation'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-sky-100 text-sky-900'
                            }`}
                          >
                            {step.category}
                          </span>
                          {isSoilReadyNow && (
                            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono font-bold animate-pulse">
                              ● Soil Ready ({currentSoilTempF}°F)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-sans mt-0.5">
                          {step.windowTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-slate-900 font-bold">{step.targetMonths}</div>
                        <div className="text-[11px] text-amber-700 font-semibold">Soil: {step.soilTempTrigger}</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Step Expanded Content */}
                  <div className={`p-4 sm:p-5 space-y-4 text-xs font-mono ${isExpanded ? 'block' : 'block md:block'}`}>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans text-slate-800">
                      <strong className="font-mono text-emerald-800 mr-1">PRIMARY OBJECTIVE:</strong>
                      <span>{step.purpose}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Products & Rate */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>RECOMMENDED PRODUCTS</span>
                        </div>
                        <ul className="space-y-1.5 text-xs font-sans text-slate-700">
                          {step.recommendedProducts.map((p, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-emerald-700 font-bold">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2.5 border-t border-slate-200 text-[11px]">
                          <strong className="text-slate-900">Target Dosage/Rate: </strong>
                          <span className="text-slate-600">{step.applicationRate}</span>
                        </div>
                      </div>

                      {/* Agronomic Pro Tips */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-[11px]">
                          <Info className="w-3.5 h-3.5 text-emerald-700" />
                          <span>AGRONOMIC PROTOCOL & APPLICATION RULES</span>
                        </div>
                        <ul className="space-y-1.5 text-xs font-sans text-slate-700">
                          {step.agronomicTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-emerald-700 font-bold">▪</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Garden & Bed Milestones */}
      {activeSubTab === 'season-milestones' && (
        <div className="space-y-4">
          {stages.map((stg) => {
            const isCurrentActiveStage =
              (stg.season === 'Early Spring' && currentSoilTempF >= 45 && currentSoilTempF <= 55) ||
              (stg.season === 'Late Winter' && currentSoilTempF < 45) ||
              (stg.season === 'Mid to Late Spring' && currentSoilTempF > 55 && currentSoilTempF <= 65) ||
              (stg.season === 'Summer Peak' && currentSoilTempF > 65);

            return (
              <div
                key={stg.season}
                className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all ${
                  isCurrentActiveStage
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-3.5 sm:px-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                    isCurrentActiveStage
                      ? 'bg-emerald-900 text-white border-emerald-800'
                      : 'bg-slate-50 text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-serif-natural font-bold text-base tracking-normal">
                      {stg.season}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                        isCurrentActiveStage
                          ? 'bg-emerald-800 text-amber-300 border border-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Soil: {stg.soilRange}
                    </span>
                    {isCurrentActiveStage && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-emerald-950 font-bold text-[10px] font-mono uppercase animate-pulse">
                        ● Active Now
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono opacity-90">{stg.timing}</div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  {/* Garden Plants Focus */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-emerald-800 font-bold uppercase text-[11px]">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Garden & Perennial Care</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 font-sans text-xs">
                      {stg.gardenActions.map((act, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-emerald-700 font-bold">▪</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Lawn Care Focus */}
                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5">
                    <div className="flex items-center space-x-1.5 text-amber-800 font-bold uppercase text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Turfgrass & Lawn Protocol</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 font-sans text-xs">
                      {stg.lawnActions.map((act, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-amber-700 font-bold">▪</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
