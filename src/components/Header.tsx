import React from 'react';
import { Sprout, Calendar, Sparkles, MapPin, RefreshCw, ShoppingBag } from 'lucide-react';
import { WeatherCondition } from '../types';
import { NotificationPermissionControl } from './NotificationPermissionControl';

interface HeaderProps {
  weather: WeatherCondition;
  onRefreshWeather: () => void;
  isLoadingWeather: boolean;
  activeTab: 'schedule' | 'plants' | 'fertilizer' | 'seasonal' | 'price-finder';
  onSelectTab: (tab: 'schedule' | 'plants' | 'fertilizer' | 'seasonal' | 'price-finder') => void;
  pendingTasksCount: number;
  urgentTasksCount: number;
  onOpenPushModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  weather,
  onRefreshWeather,
  isLoadingWeather,
  activeTab,
  onSelectTab,
  pendingTasksCount,
  urgentTasksCount,
  onOpenPushModal,
}) => {
  return (
    <header className="border-b border-emerald-900/80 bg-gradient-to-r from-[#0A3326] via-[#0E4433] to-[#0A3326] text-[#FDFBF7] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-400/40 flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif-natural">
                  Garden & Lawn Maintenance
                </h1>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-emerald-800/80 text-emerald-200 border border-emerald-600/60 shadow-2xs">
                  {weather.zone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics, Location & Notification Permission UI */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            {/* PWA & Notification Permission Control */}
            <NotificationPermissionControl weather={weather} onOpenPushModal={onOpenPushModal} />

            <div className="flex items-center space-x-1.5 bg-[#07241A]/90 px-2.5 py-1.5 rounded-lg border border-emerald-700/60 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-emerald-100 font-medium truncate max-w-[150px]">
                {weather.locationName}
              </span>
              <button
                onClick={onRefreshWeather}
                disabled={isLoadingWeather}
                title="Refresh Live Weather & Soil Temp"
                className="ml-1 text-emerald-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div
              className="flex items-center space-x-2 bg-[#07241A]/90 px-3 py-1.5 rounded-lg border border-emerald-700/60 shadow-2xs"
              title={`Soil 6cm: ${weather.soilTemp6cmF ?? weather.soilTempF}°F | Surface 0cm: ${weather.soilTemp0cmF ?? weather.soilTempF}°F`}
            >
              <span className="text-emerald-300">Soil:</span>
              <span className="font-bold text-amber-300 text-sm">{weather.soilTemp6cmF ?? weather.soilTempF}°F</span>
            </div>

            <div className="flex items-center space-x-2 bg-[#07241A]/90 px-3 py-1.5 rounded-lg border border-emerald-700/60 shadow-2xs">
              <span className="text-emerald-300">Air:</span>
              <span className="font-bold text-white">{weather.airTempF}°F</span>
              <span className="text-emerald-300/80 text-[11px]">({weather.conditionText})</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-3.5 pt-2 border-t border-emerald-800/60 flex items-center space-x-1 overflow-x-auto text-xs font-mono">
          <button
            id="tab-schedule-btn"
            onClick={() => onSelectTab('schedule')}
            className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center space-x-2 font-medium cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white text-emerald-950 shadow-sm font-bold border-t-2 border-emerald-500'
                : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Care Schedule & Tasks</span>
            {urgentTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-2xs">
                {urgentTasksCount} Ready
              </span>
            )}
            {urgentTasksCount === 0 && pendingTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/80 text-emerald-200 text-[10px]">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            id="tab-price-finder-btn"
            onClick={() => onSelectTab('price-finder')}
            className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center space-x-2 font-medium cursor-pointer ${
              activeTab === 'price-finder'
                ? 'bg-white text-emerald-950 shadow-sm font-bold border-t-2 border-emerald-500'
                : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">Recommendation & Price Finder</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] border border-amber-400/40">
              7-Day Advance
            </span>
          </button>

          <button
            id="tab-plants-btn"
            onClick={() => onSelectTab('plants')}
            className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center space-x-2 font-medium cursor-pointer ${
              activeTab === 'plants'
                ? 'bg-white text-emerald-950 shadow-sm font-bold border-t-2 border-emerald-500'
                : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Garden Beds & Plants</span>
          </button>

          <button
            id="tab-fertilizer-btn"
            onClick={() => onSelectTab('fertilizer')}
            className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center space-x-2 font-medium cursor-pointer ${
              activeTab === 'fertilizer'
                ? 'bg-white text-emerald-950 shadow-sm font-bold border-t-2 border-emerald-500'
                : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
            }`}
          >
            <span>Fertilizer Needs</span>
          </button>

          <button
            id="tab-seasonal-btn"
            onClick={() => onSelectTab('seasonal')}
            className={`px-3.5 py-2 rounded-t-lg transition-all flex items-center space-x-2 font-medium cursor-pointer ${
              activeTab === 'seasonal'
                ? 'bg-white text-emerald-950 shadow-sm font-bold border-t-2 border-emerald-500'
                : 'text-emerald-100 hover:text-white hover:bg-emerald-800/60'
            }`}
          >
            <span>Milestones & Turf</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

