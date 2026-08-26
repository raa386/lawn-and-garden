import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Sun,
  CloudRain,
  Snowflake,
  Navigation,
  RefreshCw,
  Compass,
  Layers,
} from 'lucide-react';
import { WeatherCondition } from '../types';
import { PRESET_LOCATIONS, searchLocationCoordinates } from '../services/weatherService';

interface WeatherSoilBarProps {
  weather: WeatherCondition;
  onSelectLocation: (lat: number, lon: number, name: string, zone?: string) => void;
  onManualSoilTempChange: (tempF: number) => void;
  onDetectUserLocation?: () => void;
  isDetectingLocation?: boolean;
}

export const WeatherSoilBar: React.FC<WeatherSoilBarProps> = ({
  weather,
  onSelectLocation,
  onManualSoilTempChange,
  onDetectUserLocation,
  isDetectingLocation = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchLocationCoordinates(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 text-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Main Status Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 text-xs">
          {/* Soil Agronomic & Meteorological Readings (Open-Meteo) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Root Depth Soil Temp (6cm) */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 font-mono font-medium text-amber-950 border border-amber-200/90 shadow-2xs"
              title="Root Zone Soil Temperature (soil_temperature_6cm)"
            >
              <Thermometer className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Soil (6cm Root):{' '}
                <strong className="text-amber-800 text-sm font-mono font-bold">
                  {weather.soilTemp6cmF ?? weather.soilTempF}°F
                </strong>
              </span>
            </div>

            {/* Surface Soil Temp (0cm) */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-950 font-mono border border-emerald-200/80"
              title="Surface Soil Temperature (soil_temperature_0cm)"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Surface (0cm):{' '}
                <strong className="text-emerald-900 font-mono font-bold">
                  {weather.soilTemp0cmF ?? weather.soilTempF}°F
                </strong>
              </span>
            </div>

            {/* Air Temp & Humidity */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-950 font-mono border border-sky-200/80"
              title="Air Temperature (temperature_2m) & Relative Humidity (relative_humidity_2m)"
            >
              <Sun className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                Air: <strong className="font-bold text-sky-900">{weather.airTempF}°F</strong> ({weather.humidity}% RH)
              </span>
            </div>

            {/* Live Precipitation */}
            <div
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-950 font-mono border border-blue-200/80"
              title="Current Precipitation (precipitation)"
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Precip: <strong className="font-bold text-blue-900">{weather.precipitation ?? 0} in</strong>
              </span>
            </div>

            {/* Agronomic State Badge */}
            <div className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white border border-emerald-800 font-mono font-medium flex items-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>
                Stage: <strong className="text-white">{weather.soilState}</strong>
              </span>
            </div>

            {weather.isFrostRisk && (
              <div className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-300 font-mono flex items-center space-x-1.5 animate-pulse">
                <Snowflake className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  <strong>Frost Warning:</strong> Lows near freezing
                </span>
              </div>
            )}
          </div>

          {/* Location Action & Expand Toggle */}
          <div className="flex items-center space-x-2 text-slate-600 font-mono text-[11px] flex-wrap">
            <button
              onClick={() => onSelectLocation(40.7609, -73.1812, 'Islip Terrace, NY 11752', 'Zone 7b')}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Reset live weather and soil temps to Islip Terrace 11752"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>11752 Long Island (Home)</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium flex items-center space-x-1 transition-colors border border-slate-200 cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Soil Forecast & Data' : 'Soil Forecast & Data'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Detailed Panel */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* 7-Day Soil & Air Forecast */}
            <div className="lg:col-span-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-serif-natural font-bold text-base text-slate-900 flex items-center space-x-1.5">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  <span>7-Day Soil & Air Temperature Forecast (Open-Meteo)</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Coordinates: {weather.latitude.toFixed(2)}°, {weather.longitude.toFixed(2)}°
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weather.forecast.map((day) => (
                  <div
                    key={day.date}
                    className={`p-2.5 rounded-lg border text-center font-mono transition-shadow hover:shadow-2xs ${
                      day.frostWarning
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="font-bold text-emerald-800 text-[11px] mb-1">{day.dayName}</div>
                    <div className="text-xs font-bold text-amber-700">
                      {day.soilTempF}°F{' '}
                      <span className="text-[9px] font-normal text-slate-500 block">6cm soil</span>
                    </div>
                    <div className="text-[11px] text-slate-800 mt-1">
                      {day.highF}° / <span className="text-slate-400">{day.lowF}°</span>
                    </div>
                    <div className="text-[10px] text-blue-700 mt-1 flex items-center justify-center space-x-0.5 font-medium">
                      <CloudRain className="w-2.5 h-2.5 text-blue-500" />
                      <span>{day.precipProb}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Selector & Soil Temp Simulation */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-serif-natural font-bold text-base text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Search Location or Zone</span>
                </h4>

                <form onSubmit={handleSearch} className="flex space-x-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Enter city, zip, or region..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-mono text-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    {isSearching ? '...' : 'Search'}
                  </button>
                </form>

                {/* Quick Presets */}
                <div className="text-[10px] font-mono text-slate-500 mb-1">Regional Presets:</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {PRESET_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => onSelectLocation(loc.lat, loc.lon, loc.name, loc.zone)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${
                        weather.locationName.includes(loc.name.split(' ')[0])
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      {loc.name.split('/')[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Search Results if any */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500">Matching Locations:</span>
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onSelectLocation(res.lat, res.lon, res.name);
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 bg-white hover:bg-emerald-50 text-slate-800 text-xs rounded-md border border-slate-200 font-mono truncate cursor-pointer"
                      >
                        {res.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulation slider for testing different soil temperature conditions */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-600">Simulate Soil Temp (°F):</span>
                  <span className="font-bold text-amber-700">{weather.soilTempF}°F</span>
                </div>
                <input
                  type="range"
                  min={32}
                  max={85}
                  value={weather.soilTempF}
                  onChange={(e) => onManualSoilTempChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                  <span>32°F (Frozen)</span>
                  <span>52°F (Early Spring)</span>
                  <span>65°F (Summer)</span>
                  <span>85°F</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
