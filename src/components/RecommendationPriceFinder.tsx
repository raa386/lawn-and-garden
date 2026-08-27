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
  const [isGrounded, setIsGrounded] = useState<boolean>(false);
  const [, setGroundingSources] = useState<Array<{ title: string; url: string }>>([]);
  const [, setSummary] = useState<string>('');
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
          soilTempF: weather?.soilTempF || 72,
          airTempF: weather?.airTempF || 78,
          zone: weather?.zone || 'Zone 7a',
          currentDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
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
      } catch (err) {
        console.error('Error loading recommendations:', err);
        setStatusMessage('Showing cached agronomic pricing data.');
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
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-amber-300">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Recommendation & Price Finder
              </h2>
              {isGrounded && (
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Google Search Grounded</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Analyzes estimated 7-day soil and air temperature trajectories to predict upcoming maintenance windows.
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

        {/* 7-Day Horizon */}
        {predictions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {predictions.map((p, idx) => (
                <div key={`${p.date}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-emerald-800">
                        In ~{p.daysOut} Days ({p.date})
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-700">{p.condition}</span>
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
                  </div>
                </div>
              ))}
              <div className="md:col-span-2 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-900">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>7-Day Advance Notification Protocol Active</span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Products are selected with ~7 days advance delivery window before soil temperature triggers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lawn Survey */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Lawn Health Diagnostic</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">1. Weed Level</label>
            {[
              { value: 'clean', label: 'Clean Lawn (< 5%)' },
              { value: 'moderate', label: 'Moderate (10–30%)' },
              { value: 'heavy', label: 'Heavy (> 40%)' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="weedLevel"
                  checked={lawnCondition.weedLevel === opt.value}
                  onChange={() => handleConditionChange({ weedLevel: opt.value as WeedLevel })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">2. Dead Spots</label>
            {[
              { value: 'none', label: 'Thick Turf' },
              { value: 'few_patches', label: 'Scattered Patches' },
              { value: 'severe_bare', label: 'Large Bare Zones' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bareSpotsLevel"
                  checked={lawnCondition.bareSpotsLevel === opt.value}
                  onChange={() => handleConditionChange({ bareSpotsLevel: opt.value as BareSpotsLevel })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 uppercase text-[11px]">3. Turf Variety</label>
            {[
              { value: 'fescue_bluegrass', label: 'Cool Season (Fescue/KBG)' },
              { value: 'bermuda_zoysia', label: 'Warm Season (Bermuda/Zoysia)' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2 p-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="turfType"
                  checked={lawnCondition.turfType === opt.value}
                  onChange={() => handleConditionChange({ turfType: opt.value as TurfGrassType })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono font-bold text-slate-600 uppercase flex items-center space-x-1">
          <Tag className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
              filterCategory === cat
                ? 'bg-emerald-800 text-white border-emerald-800 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
          <div className="font-mono text-sm font-bold text-slate-900">Searching live prices...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => (
            <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-800 text-white">
                    {rec.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{rec.name}</h3>
                  <p className="text-xs text-slate-700">{rec.purpose}</p>
                </div>

                <div className="w-full lg:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Cheapest
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {rec.cheapestPriceFormatted}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {rec.stores?.map((st) => (
                      <a
                        key={st.storeName}
                        href={st.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-1.5 rounded-lg text-xs font-mono hover:bg-slate-100"
                      >
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {st.storeName}
                        </span>
                        <span className="flex items-center gap-1">
                          {st.priceFormatted}
                          <ExternalLink className="w-3 h-3 text-amber-600" />
                        </span>
                      </a>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSend7DayAdvancePush(rec)}
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-800 text-white text-xs font-mono font-bold hover:bg-emerald-900"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-300" />
                    <span>{notificationSentMap[rec.id] ? '✓ Scheduled' : 'Send 7-Day Alert'}</span>
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
