import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  BellRing,
  CalendarClock,
  RefreshCw,
  Tag,
  Building2,
  Info,
  CheckCircle2,
  Thermometer,
  CloudSun,
  Sliders,
  Zap,
  Target,
  ShieldAlert,
  ArrowUpRight,
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

const DEFAULT_PREDICTIONS: SevenDayForecastPrediction[] = [
  {
    daysOut: 3,
    date: '3 Days Out',
    estimatedSoilTempF: 54,
    estimatedAirTempF: 62,
    condition: 'Pre-Emergent Prime Window',
  },
  {
    daysOut: 7,
    date: '7 Days Out',
    estimatedSoilTempF: 58,
    estimatedAirTempF: 67,
    condition: 'Optimal Germination Window',
  },
];

const DEFAULT_RECOMMENDATIONS: ProductRecommendation[] = [
  {
    id: 'rec-1',
    category: 'Pre-Emergent',
    name: 'Prodiamine 65 WDG Herbicide',
    purpose: 'Crabgrass & Broadleaf Weed Pre-Emergent Preventative',
    targetPestsOrWeeds: 'Crabgrass, Foxtail, Goosegrass, Chickweed',
    applicationTimingWindow: 'Apply before soil temps consistently hit 55°F',
    idealSoilTempRange: '50°F - 55°F',
    cheapestPriceFormatted: '$28.99',
    cheapestUrl: 'https://www.google.com',
    advanceNotificationTitle: '7-Day Pre-Emergent Alert',
    advanceNotificationBody: 'Soil temps reaching 55°F in 7 days. Time to apply Prodiamine!',
    stores: [
      { storeName: 'SiteOne Landscape Supply', priceFormatted: '$28.99', url: 'https://www.siteone.com' },
      { storeName: 'Lawn Care Nut', priceFormatted: '$32.50', url: 'https://lawncarenut.com' },
      { storeName: 'Amazon', priceFormatted: '$34.99', url: 'https://amazon.com' },
    ],
  },
  {
    id: 'rec-2',
    category: 'Fertilizer',
    name: 'Lesco 24-0-11 Lawn Fertilizer',
    purpose: 'High-Nitrogen Spring Slow-Release Turf Boost',
    targetPestsOrWeeds: 'Spring Green-up & Root Establishment',
    applicationTimingWindow: 'Apply during early active growth',
    idealSoilTempRange: '55°F - 65°F',
    cheapestPriceFormatted: '$44.98',
    cheapestUrl: 'https://www.homedepot.com',
    advanceNotificationTitle: '7-Day Fertilizer Alert',
    advanceNotificationBody: 'Optimal root activity window opening in 7 days.',
    stores: [
      { storeName: 'Home Depot', priceFormatted: '$44.98', url: 'https://www.homedepot.com' },
      { storeName: "Lowe's", priceFormatted: '$47.99', url: 'https://www.lowes.com' },
    ],
  },
  {
    id: 'rec-3',
    category: 'Turf Seed & Lawn',
    name: 'Jonathan Green Black Beauty Ultra Grass Seed',
    purpose: 'Tall Fescue & Kentucky Bluegrass Blend for Overseeding',
    targetPestsOrWeeds: 'Bare spots, thin turf density',
    applicationTimingWindow: 'Soil temps between 55°F and 65°F',
    idealSoilTempRange: '55°F - 65°F',
    cheapestPriceFormatted: '$39.99',
    cheapestUrl: 'https://www.acehardware.com',
    advanceNotificationTitle: '7-Day Seed Window Alert',
    advanceNotificationBody: 'Soil conditions reach prime seed germination temp next week.',
    stores: [
      { storeName: 'Ace Hardware', priceFormatted: '$39.99', url: 'https://www.acehardware.com' },
      { storeName: 'Amazon', priceFormatted: '$42.99', url: 'https://amazon.com' },
    ],
  },
];

const DEFAULT_SUMMARY =
  'Soil temperatures are approaching the critical 55°F threshold. Applying pre-emergent now will block weed seed germination before spring growth surges. Overseeding and starter fertilization should follow once ground temperatures stabilize above 58°F.';

export const RecommendationPriceFinder: React.FC<RecommendationPriceFinderProps> = ({
  weather,
  currentSeason,
  currentMonth,
  onOpenPushModal,
}) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>(DEFAULT_RECOMMENDATIONS);
  const [predictions, setPredictions] = useState<SevenDayForecastPrediction[]>(DEFAULT_PREDICTIONS);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [groundingSources, setGroundingSources] = useState<Array<{ title: string; url: string }>>([
    { title: 'NC State TurfFiles', url: 'https://www.turffiles.ncsu.edu' },
    { title: 'SiteOne Supply Catalog', url: 'https://www.siteone.com' },
  ]);
  const [summary, setSummary] = useState<string>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [notificationSentMap, setNotificationSentMap] = useState<{ [id: string]: boolean }>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadData = useCallback(
    async (cat: string = filterCategory, condition: LawnCondition = lawnCondition) => {
      setLoading(true);
      setStatusMessage(null);
      try {
        const res = await fetchRecommendationsAndPrices({
          locationName: weather?.locationName || 'Charlotte, NC',
          latitude: weather?.latitude || 35.2271,
          longitude: weather?.longitude || -80.8431,
          soilTempF: weather?.soilTempF || 52,
          airTempF: weather?.airTempF || 64,
          zone: weather?.zone || 'Zone 7a',
          currentDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          currentSeason: currentSeason || 'Spring',
          currentMonth: currentMonth || 4,
          filterCategory: cat === 'All' ? undefined : cat,
          lawnCondition: condition,
        });

        if (res && res.recommendations && res.recommendations.length > 0) {
          setRecommendations(res.recommendations);
          setPredictions(res.predictions || DEFAULT_PREDICTIONS);
          setSummary(res.summary || DEFAULT_SUMMARY);
          setIsGrounded(Boolean(res.searchGrounded));
          setGroundingSources(res.groundingSources || []);
        } else {
          setRecommendations(DEFAULT_RECOMMENDATIONS);
          setPredictions(DEFAULT_PREDICTIONS);
          setSummary(DEFAULT_SUMMARY);
        }
      } catch (err) {
        console.error('API call failed, using default preview data:', err);
        setRecommendations(DEFAULT_RECOMMENDATIONS);
        setPredictions(DEFAULT_PREDICTIONS);
        setSummary(DEFAULT_SUMMARY);
        setStatusMessage('Displaying local preview data.');
      } finally {
        setLoading(false);
      }
    },
    [weather, currentSeason, currentMonth]
  );

  useEffect(() => {
    loadData(filterCategory, lawnCondition);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadData]);

  const handleCategoryChange = (cat: string) => {
    setFilterCategory(cat);
    loadData(cat, lawnCondition);
  };

  const handleConditionChange = (updated: Partial<LawnCondition>) => {
    const nextCondition = { ...lawnCondition, ...updated };
    setLawnCondition(nextCondition);
    loadData(filterCategory, nextCondition);
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleSend7DayAdvancePush = async (rec: ProductRecommendation) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg?.showNotification) {
            await reg.showNotification(rec.advanceNotificationTitle, {
              body: rec.advanceNotificationBody,
              icon: '/favicon.ico',
              tag: `7day-advance-${rec.id}`,
              data: { url: rec.cheapestUrl },
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
        showStatus(`📲 7-Day Advance Alert sent for "${rec.name}"!`);
      } else if (onOpenPushModal) {
        onOpenPushModal();
      } else if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') handleSend7DayAdvancePush(rec);
      }
    } catch (e) {
      console.error('Error sending notification:', e);
      setStatusMessage('Unable to trigger notification. Check browser permissions.');
    }
  };

  const filteredRecs =
    filterCategory === 'All'
      ? recommendations
      : recommendations.filter((r) =>
          r.category.toLowerCase().includes(filterCategory.toLowerCase())
        );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-800 text-amber-300 shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Recommendation & Price Finder
                </h2>
                <div className="flex items-center space-x-2 mt-0.5">
                  {isGrounded && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Google Search Grounded</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono">
                    {weather?.locationName || 'Charlotte, NC'}
                  </span>
                </div>
              </div>
            </div>
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
                <span>Push Alerts</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Summary Box */}
        {summary && (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-800 block font-mono">
                AI Agronomic Analysis
              </span>
              <p>{summary}</p>
            </div>
          </div>
        )}

        {/* Grounding Sources */}
        {groundingSources.length > 0 && (
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-600 overflow-x-auto pb-1">
            <span className="font-bold uppercase text-slate-400 shrink-0">Sources:</span>
            {groundingSources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 border border-slate-200 transition-colors"
              >
                <span className="truncate max-w-[140px]">{src.title}</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 flex items-center justify-between">
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

        {/* 7-Day Temp Forecast */}
        {predictions.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 mb-2 font-mono text-xs font-bold text-slate-700 uppercase">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              <span>7-Day Temperature & Timing Window</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {predictions.map((p, idx) => (
                <div key={`${p.date}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                    +{p.daysOut}d
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-emerald-900">
                        {p.date}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        {p.condition}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-700 font-mono">
                      <span className="flex items-center space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                        <span>Soil: ~{p.estimatedSoilTempF}°F</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                        <span>Air: ~{p.estimatedAirTempF}°F</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lawn Diagnostic Survey */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Lawn Diagnostic Survey</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Tailors product targets to your lawn conditions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">Weed Pressure</label>
            {[
              { value: 'clean', label: 'Clean (< 5%)' },
              { value: 'moderate', label: 'Moderate (10–30%)' },
              { value: 'heavy', label: 'Heavy (> 40%)' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1 cursor-pointer">
                <input
                  type="radio"
                  name="weedLevel"
                  className="accent-emerald-700"
                  checked={lawnCondition.weedLevel === opt.value}
                  onChange={() => handleConditionChange({ weedLevel: opt.value as WeedLevel })}
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">Bare / Thin Spots</label>
            {[
              { value: 'none', label: 'Dense Turf' },
              { value: 'few_patches', label: 'Scattered Patches' },
              { value: 'severe_bare', label: 'Large Bare Areas' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1 cursor-pointer">
                <input
                  type="radio"
                  name="bareSpotsLevel"
                  className="accent-emerald-700"
                  checked={lawnCondition.bareSpotsLevel === opt.value}
                  onChange={() => handleConditionChange({ bareSpotsLevel: opt.value as BareSpotsLevel })}
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">Turf Grass Type</label>
            {[
              { value: 'fescue_bluegrass', label: 'Cool Season (Fescue/KBG)' },
              { value: 'bermuda_zoysia', label: 'Warm Season (Bermuda/Zoysia)' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1 cursor-pointer">
                <input
                  type="radio"
                  name="turfType"
                  className="accent-emerald-700"
                  checked={lawnCondition.turfType === opt.value}
                  onChange={() => handleConditionChange({ turfType: opt.value as TurfGrassType })}
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">Primary Goal</label>
            {[
              { value: 'overseeding', label: 'Overseeding / Thickening' },
              { value: 'weed_control', label: 'Active Weed Eradication' },
              { value: 'maintenance', label: 'Greening & Maintenance' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1 cursor-pointer">
                <input
                  type="radio"
                  name="primaryGoal"
                  className="accent-emerald-700"
                  checked={lawnCondition.primaryGoal === opt.value}
                  onChange={() => handleConditionChange({ primaryGoal: opt.value })}
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase flex items-center space-x-1 shrink-0">
          <Tag className="w-3.5 h-3.5" />
          <span>Category:</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border cursor-pointer shrink-0 ${
              filterCategory === cat
                ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Cards */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <div className="font-mono text-sm font-bold text-slate-900">
            Grounding real-time store prices & agronomic windows...
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-5">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-800 text-white">
                      {rec.category}
                    </span>
                    {rec.idealSoilTempRange && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        Target Soil: {rec.idealSoilTempRange}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{rec.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.purpose}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    {rec.targetPestsOrWeeds && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start space-x-2">
                        <Target className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[10px] uppercase">
                            Target Spectrum
                          </span>
                          <span className="text-slate-600">{rec.targetPestsOrWeeds}</span>
                        </div>
                      </div>
                    )}
                    {rec.applicationTimingWindow && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[10px] uppercase">
                            Application Window
                          </span>
                          <span className="text-slate-600">{rec.applicationTimingWindow}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shrink-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1 uppercase">
                        <TrendingDown className="w-4 h-4 text-emerald-600" /> Best Price
                      </span>
                      <span className="text-lg font-extrabold font-mono text-slate-900">
                        {rec.cheapestPriceFormatted}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                        Live Merchant Options
                      </span>
                      {rec.stores?.map((st) => (
                        <a
                          key={st.storeName}
                          href={st.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono hover:border-emerald-600 hover:text-emerald-800 transition-colors group"
                        >
                          <span className="flex items-center gap-2 font-semibold text-slate-800 group-hover:text-emerald-900">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                            {st.storeName}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-slate-900">
                            {st.priceFormatted}
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSend7DayAdvancePush(rec)}
                    className="w-full mt-3 inline-flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {notificationSentMap[rec.id] ? '✓ Alert Scheduled' : 'Set 7-Day Advance Alert'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
