import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  BellRing,
  CalendarClock,
  Search,
  CheckCircle2,
  Thermometer,
  CloudSun,
  ShieldCheck,
  RefreshCw,
  Tag,
  ArrowRight,
  Truck,
  Building2,
  Info,
  Check,
  Zap,
  HelpCircle,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import {
  ProductRecommendation,
  SevenDayForecastPrediction,
  WeatherCondition,
  LawnCondition,
  WeedLevel,
  BareSpotsLevel,
  TurfGrassType,
} from '../types';
import { fetchRecommendationsAndPrices } from '../services/recommendationService';

interface RecommendationPriceFinderProps {
  weather: WeatherCondition | null;
  currentSeason: string;
  currentMonth: number;
  onOpenPushModal?: () => void;
}

export const RecommendationPriceFinder: React.FC<RecommendationPriceFinderProps> = ({
  weather,
  currentSeason,
  currentMonth,
  onOpenPushModal,
}) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [predictions, setPredictions] = useState<SevenDayForecastPrediction[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isGrounded, setIsGrounded] = useState<boolean>(false);
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; url: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [notificationSentMap, setNotificationSentMap] = useState<{ [id: string]: boolean }>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Lawn Condition Survey State
  const [lawnCondition, setLawnCondition] = useState<LawnCondition>({
    weedLevel: 'moderate',
    bareSpotsLevel: 'few_patches',
    turfType: 'fescue_bluegrass',
    primaryGoal: 'overseeding',
  });

  const categories = [
    'All',
    'Fertilizer',
    'Turf Seed & Lawn',
    'Pre-Emergent',
    'Pruning & Shears',
    'Soil Conditioner',
  ];

  const loadData = async (cat: string = filterCategory, condition: LawnCondition = lawnCondition) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetchRecommendationsAndPrices({
        locationName: weather?.locationName || 'Charlotte, NC',
        latitude: weather?.latitude || 35.2271,
        longitude: weather?.longitude || -80.8431,
        soilTempF: weather?.soilTempF || 72,
        airTempF: weather?.airTempF || 78,
        zone: weather?.zone || 'Zone 7a',
        currentDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        currentSeason,
        currentMonth,
        filterCategory: cat === 'All' ? undefined : cat,
        lawnCondition: condition,
      });

      setRecommendations(res.recommendations || []);
      setPredictions(res.predictions || []);
      setSummary(res.summary || '');
      setIsGrounded(Boolean(res.searchGrounded));
      setGroundingSources(res.groundingSources || []);
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setStatusMessage('Showing cached agronomic pricing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filterCategory, lawnCondition);
  }, [weather?.locationName, currentMonth, currentSeason]);

  const handleCategoryChange = (cat: string) => {
    setFilterCategory(cat);
    loadData(cat, lawnCondition);
  };

  const handleConditionChange = (updated: Partial<LawnCondition>) => {
    const nextCondition = { ...lawnCondition, ...updated };
    setLawnCondition(nextCondition);
    loadData(filterCategory, nextCondition);
  };

  // Dispatch 7-Day Advance Push Notification to user's device
  const handleSend7DayAdvancePush = async (rec: ProductRecommendation) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(rec.advanceNotificationTitle, {
              body: rec.advanceNotificationBody,
              icon: '/favicon.ico',
              tag: `7day-advance-${rec.id}`,
              data: {
                url: rec.cheapestUrl,
              },
            });
          } else {
            new Notification(rec.advanceNotificationTitle, {
              body: rec.advanceNotificationBody,
              icon: '/favicon.ico',
            });
          }
        } else {
          new Notification(rec.advanceNotificationTitle, {
            body: rec.advanceNotificationBody,
            icon: '/favicon.ico',
          });
        }

        setNotificationSentMap((prev) => ({ ...prev, [rec.id]: true }));
        setStatusMessage(`📲 7-Day Advance Alert sent to your device for "${rec.name}"!`);
        setTimeout(() => setStatusMessage(null), 6000);
      } else {
        if (onOpenPushModal) {
          onOpenPushModal();
        } else if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            handleSend7DayAdvancePush(rec);
          }
        }
      }
    } catch (e) {
      console.error('Error sending advance notification:', e);
      setStatusMessage('Unable to trigger notification. Please check browser permission settings.');
    }
  };

  const filteredRecs = filterCategory === 'All'
    ? recommendations
    : recommendations.filter((r) => r.category.toLowerCase().includes(filterCategory.toLowerCase()) || filterCategory.toLowerCase().includes(r.category.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner & 7-Day Horizon Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-amber-300">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold font-serif-natural text-slate-900 tracking-tight">
                Recommendation & Price Finder
              </h2>
              {isGrounded && (
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Google Search Grounded</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-sans max-w-2xl">
              Analyzes estimated 7-day soil and air temperature trajectories to predict upcoming maintenance windows (pruning, fertilizing, overseeding, pre-emergent) and checks live prices across Home Depot, Amazon Prime, and online stores.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => loadData(filterCategory, lawnCondition)}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Grounding...' : 'Refresh Live Prices'}</span>
            </button>

            {onOpenPushModal && (
              <button
                onClick={onOpenPushModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-mono font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-300" />
                <span>Push Settings</span>
              </button>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 7-Day Forecast & Soil Temperature Horizon Prediction */}
        {predictions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {predictions.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-emerald-800">
                        In ~{p.daysOut} Days ({p.date})
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-700">
                        {p.condition}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-800 font-mono">
                      <span className="flex items-center space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                        <span>Soil: ~{p.estimatedSoilTempF}°F</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                        <span>Air: ~{p.estimatedAirTempF}°F</span>
                      </span>
                    </div>
                    {p.upcomingActionsReady && p.upcomingActionsReady.length > 0 && (
                      <div className="text-[11px] text-emerald-700 font-sans">
                        <span className="font-semibold">Ready Actions: </span>
                        {p.upcomingActionsReady.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="md:col-span-2 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-900">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>7-Day Advance Notification Protocol Active</span>
                </div>
                <p className="text-xs text-emerald-800 font-sans mt-1">
                  Products are selected with sufficient delivery time (~7 days advance) before the estimated soil temperature window begins, ensuring you receive items at the best online price right when conditions trigger.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lawn Condition Diagnostic Survey Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif-natural font-bold text-base text-slate-900">
              Lawn Health Diagnostic: Weeds & Dead Spot Assessment
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Tailors turf fertilizer, pre-emergent, and seeding recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Question 1: Weed Level */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">
              1. Weed Infestation Level
            </label>
            <div className="space-y-1.5">
              {[
                { value: 'clean', label: 'Clean Lawn (< 5% weeds)' },
                { value: 'moderate', label: 'Moderate Weeds (10–30% weeds)' },
                { value: 'heavy', label: 'Heavy Weeds (> 40% weeds)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                    lawnCondition.weedLevel === opt.value
                      ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                      : 'border-transparent hover:bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="weedLevel"
                    value={opt.value}
                    checked={lawnCondition.weedLevel === opt.value}
                    onChange={() => handleConditionChange({ weedLevel: opt.value as WeedLevel })}
                    className="text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2: Bare Spots / Dead Zones */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">
              2. Dead Spots & Bare Patches
            </label>
            <div className="space-y-1.5">
              {[
                { value: 'none', label: 'Thick Turf (No dead spots)' },
                { value: 'few_patches', label: 'Scattered Dead / Dog Spots' },
                { value: 'severe_bare', label: 'Large Bare Zones (Needs Overseeding)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                    lawnCondition.bareSpotsLevel === opt.value
                      ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                      : 'border-transparent hover:bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="bareSpotsLevel"
                    value={opt.value}
                    checked={lawnCondition.bareSpotsLevel === opt.value}
                    onChange={() => handleConditionChange({ bareSpotsLevel: opt.value as BareSpotsLevel })}
                    className="text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 3: Grass Variety */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">
              3. Turf Variety & Species
            </label>
            <div className="space-y-1.5">
              {[
                { value: 'fescue_bluegrass', label: 'Cool Season (Tall Fescue / KBG / Rye)' },
                { value: 'bermuda_zoysia', label: 'Warm Season (Bermuda / Zoysia)' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                    lawnCondition.turfType === opt.value
                      ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                      : 'border-transparent hover:bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="turfType"
                    value={opt.value}
                    checked={lawnCondition.turfType === opt.value}
                    onChange={() => handleConditionChange({ turfType: opt.value as TurfGrassType })}
                    className="text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Condition Feedback Callout */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-xs font-sans text-slate-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-mono text-slate-900 uppercase text-[11px] mr-1">
              Active Agronomic Filter:
            </strong>
            {lawnCondition.bareSpotsLevel !== 'none' && lawnCondition.weedLevel !== 'clean' && (
              <span>
                <strong>Weeds + Dead Spots Detected: </strong> Standard pre-emergents are suppressed to avoid killing grass seedlings. Recommending Mesotrione-safe starter fertilizer (e.g. Scotts Starter Food with Weed Preventer) combined with premium overseeding grass seed.
              </span>
            )}
            {lawnCondition.bareSpotsLevel !== 'none' && lawnCondition.weedLevel === 'clean' && (
              <span>
                <strong>Dead Spots Detected (Clean Lawn): </strong> Recommending seed-safe high-phosphorus starter nutrition + patch repair blends.
              </span>
            )}
            {lawnCondition.bareSpotsLevel === 'none' && lawnCondition.weedLevel === 'heavy' && (
              <span>
                <strong>Heavy Weeds with Full Canopy: </strong> Recommending post-emergent selective herbicides & dense weed & feed treatments to knock down active dandelions/clover.
              </span>
            )}
            {lawnCondition.bareSpotsLevel === 'none' && lawnCondition.weedLevel === 'clean' && (
              <span>
                <strong>Thick & Clean Lawn: </strong> Recommending balanced seasonal maintenance feeds, organic iron, and standard pre-emergent protection.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider shrink-0 mr-1 flex items-center space-x-1">
          <Tag className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors border cursor-pointer ${
              filterCategory === cat
                ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading Skeleton or Recommendations Grid */}
      {loading ? (
        <div className="space-y-4">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 animate-pulse">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <div className="font-mono text-sm font-bold text-slate-900">
              Searching Google for live product prices tailored to your lawn survey & 7-day soil forecast...
            </div>
            <div className="text-xs text-slate-600 font-sans">
              Comparing live prices across Home Depot, Amazon Prime, Lowe's, and online suppliers.
            </div>
          </div>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="font-mono font-bold text-sm text-slate-900">No matching products found</h3>
          <p className="text-xs text-slate-600 font-sans">
            Try switching category filters or refresh live prices.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => {
            const hasSentPush = notificationSentMap[rec.id];

            return (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden hover:border-emerald-400 transition-colors"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Product Info & Timing */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-800 text-white shadow-2xs">
                          {rec.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                          Brand: {rec.brand}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          ⏳ Ready in ~{rec.estimatedReadyDaysOut} Days
                        </span>
                      </div>

                      <h3 className="text-base font-bold font-serif-natural text-slate-900">
                        {rec.name}
                      </h3>

                      <p className="text-xs text-slate-700 font-sans">
                        <strong className="text-slate-900 font-semibold font-mono">Tailored Purpose: </strong>
                        {rec.purpose}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1 text-slate-800">
                        <div className="flex items-center space-x-1.5 text-rose-700">
                          <Thermometer className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-bold">Soil / Weather Trigger: </span>
                          <span>{rec.timingTrigger}</span>
                        </div>
                        <div className="text-slate-600 font-sans text-[11px]">
                          <strong>Application Tip: </strong>
                          {rec.applicationTip} {rec.coverageOrDose ? `(${rec.coverageOrDose})` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison & Best Store Card */}
                    <div className="w-full lg:w-80 bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shrink-0 space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-[11px] font-mono font-bold uppercase text-emerald-800 flex items-center space-x-1">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cheapest Price</span>
                          </span>
                          <span className="text-base font-bold font-mono text-slate-900">
                            {rec.cheapestPriceFormatted}
                          </span>
                        </div>

                        {/* Store List */}
                        <div className="mt-2.5 space-y-1.5">
                          {rec.stores && rec.stores.map((st, sIdx) => (
                            <a
                              key={sIdx}
                              href={st.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-between p-1.5 rounded-lg text-xs font-mono transition-colors ${
                                st.isCheapest
                                  ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                <span className="truncate">{st.storeName}</span>
                                {st.isCheapest && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase bg-emerald-700 text-white shrink-0">
                                    Best
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 shrink-0 ml-2">
                                <span>{st.priceFormatted}</span>
                                <ExternalLink className="w-3 h-3 text-amber-600" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* 7-Day Advance Action Buttons */}
                      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row lg:flex-col gap-2">
                        <a
                          href={rec.cheapestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-mono font-bold shadow-2xs transition-colors cursor-pointer text-center"
                        >
                          <span>Buy at {rec.cheapestStore} ({rec.cheapestPriceFormatted})</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                        </a>

                        <button
                          onClick={() => handleSend7DayAdvancePush(rec)}
                          className={`w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            hasSentPush
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          <BellRing className={`w-3.5 h-3.5 ${hasSentPush ? 'text-emerald-700' : 'text-amber-600'}`} />
                          <span>{hasSentPush ? '✓ 7-Day Alert Scheduled' : 'Send 7-Day Advance Alert'}</span>
                        </button>
                      </div>
                    </div>
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
