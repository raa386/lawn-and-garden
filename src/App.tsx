import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WeatherSoilBar } from './components/WeatherSoilBar';
import { ActionAlerts } from './components/ActionAlerts';
import { TaskScheduleList } from './components/TaskScheduleList';
import { PlantDirectory } from './components/PlantDirectory';
import { FertilizerTracker } from './components/FertilizerTracker';
import { SeasonalGuide } from './components/SeasonalGuide';
import { RecommendationPriceFinder } from './components/RecommendationPriceFinder';
import { AddTaskModal } from './components/AddTaskModal';
import { PlantFormModal } from './components/PlantFormModal';
import { FirebasePushManagerModal } from './components/FirebasePushManagerModal';
import { INITIAL_PLANTS, INITIAL_SCHEDULED_TASKS } from './data/gardenData';
import { PlantRecord, ScheduledTask, WeatherCondition } from './types';
import {
  fetchLiveWeatherAndSoil,
  getUserGeolocation,
  reverseGeocodeCoordinates,
  PRESET_LOCATIONS,
} from './services/weatherService';
import { setupForegroundMessageListener } from './services/firebaseService';
import { evaluateTaskTiming, getCurrentMonth, getSeasonStageForMonth } from './utils/seasonUtils';
import { BellRing, X } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'schedule' | 'plants' | 'fertilizer' | 'seasonal' | 'price-finder'>('schedule');

  // Current Month / Season simulation option (defaults to real month)
  const [currentMonth, setCurrentMonth] = useState<number>(getCurrentMonth());

  // Plant & Task State with LocalStorage Persistence
  const [plants, setPlants] = useState<PlantRecord[]>(() => {
    try {
      const saved = localStorage.getItem('garden_app_plants_v1');
      return saved ? JSON.parse(saved) : INITIAL_PLANTS;
    } catch {
      return INITIAL_PLANTS;
    }
  });

  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem('garden_app_tasks_v1');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_TASKS;
    } catch {
      return INITIAL_SCHEDULED_TASKS;
    }
  });

  // Weather & Soil Condition State (Permanent Home: Islip Terrace, NY 11752 - Long Island, Zone 7b)
  const defaultLoc = PRESET_LOCATIONS[0];
  const [weather, setWeather] = useState<WeatherCondition>({
    locationName: 'Islip Terrace, NY 11752',
    latitude: 40.7609,
    longitude: -73.1812,
    zone: 'Zone 7b',
    airTempF: 58,
    soilTempF: 52,
    soilTemp0cmF: 55,
    soilTemp6cmF: 52,
    precipitation: 0.0,
    soilMoisturePercent: 34,
    conditionText: 'Partly Cloudy',
    humidity: 50,
    windMph: 8,
    precipProbability: 15,
    isFrostRisk: false,
    soilState: 'Early Growth (45-55°F)',
    forecast: [
      { date: '2026-03-15', dayName: 'Today', highF: 62, lowF: 44, soilTempF: 52, soilTemp0cmF: 54, soilTemp6cmF: 52, precipProb: 10, condition: 'Partly Cloudy', frostWarning: false },
      { date: '2026-03-16', dayName: 'Mon', highF: 64, lowF: 46, soilTempF: 53, soilTemp0cmF: 56, soilTemp6cmF: 53, precipProb: 20, condition: 'Mostly Sunny', frostWarning: false },
      { date: '2026-03-17', dayName: 'Tue', highF: 58, lowF: 40, soilTempF: 51, soilTemp0cmF: 53, soilTemp6cmF: 51, precipProb: 45, condition: 'Light Rain', frostWarning: false },
      { date: '2026-03-18', dayName: 'Wed', highF: 60, lowF: 42, soilTempF: 52, soilTemp0cmF: 55, soilTemp6cmF: 52, precipProb: 15, condition: 'Clear', frostWarning: false },
      { date: '2026-03-19', dayName: 'Thu', highF: 66, lowF: 48, soilTempF: 55, soilTemp0cmF: 58, soilTemp6cmF: 55, precipProb: 5, condition: 'Sunny', frostWarning: false },
    ],
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | undefined>();

  // Modals State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantRecord | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // In-App Foreground Notification Toast
  const [foregroundToast, setForegroundToast] = useState<{ title: string; body: string } | null>(null);

  // Setup foreground push listener
  useEffect(() => {
    const cleanup = setupForegroundMessageListener((payload) => {
      setForegroundToast({
        title: payload.title || '🌱 Garden & Lawn Care Alert',
        body: payload.body || 'New care reminder triggered.',
      });
      setTimeout(() => {
        setForegroundToast(null);
      }, 7000);
    });

    return () => cleanup();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('garden_app_plants_v1', JSON.stringify(plants));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [plants]);

  useEffect(() => {
    try {
      localStorage.setItem('garden_app_tasks_v1', JSON.stringify(tasks));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [tasks]);

  // Initial Weather Fetch: Long Island 11752
  useEffect(() => {
    const initWeather = async () => {
      setIsLoadingWeather(true);
      try {
        await loadLiveWeather(40.7609, -73.1812, 'Islip Terrace, NY 11752', 'Zone 7b', false);
      } catch (err) {
        console.warn('Live weather fetch for 11752 encountered error, falling back:', err);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    initWeather();
  }, []);

  const loadLiveWeather = async (
    lat: number,
    lon: number,
    name: string,
    zone?: string,
    isUserLocation?: boolean
  ) => {
    setIsLoadingWeather(true);
    const liveData = await fetchLiveWeatherAndSoil(lat, lon, name, zone, isUserLocation);
    setWeather(liveData);
    setIsLoadingWeather(false);
  };

  const handleSelectLocation = (lat: number, lon: number, name: string, zone?: string) => {
    loadLiveWeather(lat, lon, name, zone, false);
  };

  const handleDetectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const coords = await getUserGeolocation();
      const placeName = await reverseGeocodeCoordinates(coords.lat, coords.lon);
      await loadLiveWeather(coords.lat, coords.lon, placeName, undefined, true);
    } catch (err: any) {
      console.warn('Could not retrieve user GPS position:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleManualSoilTempChange = (tempF: number) => {
    setWeather((prev) => ({
      ...prev,
      soilTempF: tempF,
      soilTemp6cmF: tempF,
      soilState:
        tempF < 35
          ? 'Frozen'
          : tempF < 45
          ? 'Thawed / Cold'
          : tempF < 55
          ? 'Early Growth (45-55°F)'
          : tempF < 70
          ? 'Active Growth (55-70°F)'
          : 'Warm / Summer (>70°F)',
    }));
  };

  // Task Toggle
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willComplete = !t.completed;
          return {
            ...t,
            completed: willComplete,
            completedDate: willComplete
              ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : undefined,
          };
        }
        return t;
      })
    );
  };

  // Bulk Complete Fertilizer Feeds (for Late-Season Catchup or Product-specific)
  const handleBulkCompleteFertilizer = (fertilizerProduct?: string, onlyPastSeasons: boolean = false) => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setTasks((prev) =>
      prev.map((t) => {
        const isFertilizer = t.type === 'fertilize' || Boolean(t.fertilizerProduct);
        if (!isFertilizer) return t;

        if (fertilizerProduct) {
          if (fertilizerProduct === 'All Purpose') {
            if (t.fertilizerProduct !== 'All Purpose' && t.fertilizerProduct !== 'Plant Tone') return t;
          } else if (fertilizerProduct === 'Rose Tone') {
            if (t.fertilizerProduct !== 'Rose Tone' && t.fertilizerProduct !== 'Granular Rose Fertilizer') return t;
          } else if (t.fertilizerProduct !== fertilizerProduct) {
            return t;
          }
        }

        if (onlyPastSeasons) {
          const maxMonth = t.targetMonths ? Math.max(...t.targetMonths) : 4;
          if (maxMonth >= currentMonth) return t; // Keep current and future pending
        }

        return {
          ...t,
          completed: true,
          completedDate: t.completedDate || `Applied (${dateStr})`,
        };
      })
    );
  };

  const handleResetFertilizerTasks = (fertilizerProduct?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        const isFertilizer = t.type === 'fertilize' || Boolean(t.fertilizerProduct);
        if (!isFertilizer) return t;

        if (fertilizerProduct) {
          if (fertilizerProduct === 'All Purpose') {
            if (t.fertilizerProduct !== 'All Purpose' && t.fertilizerProduct !== 'Plant Tone') return t;
          } else if (fertilizerProduct === 'Rose Tone') {
            if (t.fertilizerProduct !== 'Rose Tone' && t.fertilizerProduct !== 'Granular Rose Fertilizer') return t;
          } else if (t.fertilizerProduct !== fertilizerProduct) {
            return t;
          }
        }

        return {
          ...t,
          completed: false,
          completedDate: undefined,
        };
      })
    );
  };

  // Bulk Complete All Past Window Tasks (for onboarding late in the season)
  const handleBulkCompleteAllPastTasks = () => {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setTasks((prev) =>
      prev.map((t) => {
        const maxMonth = t.targetMonths ? Math.max(...t.targetMonths) : 4;
        if (maxMonth >= currentMonth) return t; // Only complete past tasks
        return {
          ...t,
          completed: true,
          completedDate: t.completedDate || `Completed earlier in season (${dateStr})`,
        };
      })
    );
  };

  const handleDeleteCustomTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleAddTask = (newTask: ScheduledTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Plant Management: Add, Edit, Delete
  const handleSavePlant = (savedPlant: PlantRecord) => {
    setPlants((prev) => {
      const exists = prev.some((p) => p.id === savedPlant.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPlant.id ? savedPlant : p));
      }
      return [savedPlant, ...prev];
    });

    // Update associated tasks or generate new task if brand new plant
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.plantId === savedPlant.id);
      if (taskIndex >= 0) {
        return prev.map((t) =>
          t.plantId === savedPlant.id
            ? {
                ...t,
                plantName: savedPlant.name,
                bed: savedPlant.bed,
                fertilizerProduct: savedPlant.fertilizerType,
                title: `${savedPlant.name}: ${savedPlant.fertilizing}`,
                instruction: `Follow care specifications: Fertilize with ${savedPlant.fertilizerType}. Prune: ${savedPlant.pruning}. Water: ${savedPlant.watering}`,
                minSoilTempF: savedPlant.optimalSoilTempMinF,
                maxSoilTempF: savedPlant.optimalSoilTempMaxF,
              }
            : t
        );
      } else {
        const autoTask: ScheduledTask = {
          id: 'auto-task-' + Date.now(),
          plantId: savedPlant.id,
          plantName: savedPlant.name,
          bed: savedPlant.bed,
          type: savedPlant.fertilizing.toLowerCase().includes('prun') ? 'prune' : 'fertilize',
          title: `${savedPlant.name}: ${savedPlant.fertilizing}`,
          instruction: `Follow care specifications: Fertilize with ${savedPlant.fertilizerType}. Prune: ${savedPlant.pruning}. Water: ${savedPlant.watering}`,
          soilTempCondition: `Soil Temp ${savedPlant.optimalSoilTempMinF}°F–${savedPlant.optimalSoilTempMaxF}°F`,
          minSoilTempF: savedPlant.optimalSoilTempMinF,
          maxSoilTempF: savedPlant.optimalSoilTempMaxF,
          targetSeason: 'Early Spring',
          targetMonths: [3, 4],
          fertilizerProduct: savedPlant.fertilizerType,
          completed: false,
          isCustom: true,
        };
        return [autoTask, ...prev];
      }
    });
  };

  const handleDeletePlant = (plantId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
  };

  const handleOpenAddPlant = () => {
    setEditingPlant(null);
    setIsPlantModalOpen(true);
  };

  const handleOpenEditPlant = (plant: PlantRecord) => {
    setEditingPlant(plant);
    setIsPlantModalOpen(true);
  };

  const handleSelectTaskFromAlert = (taskId: string) => {
    setActiveTab('schedule');
    setHighlightedTaskId(taskId);
    setTimeout(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Strictly calculate tasks that are ready right now based on BOTH season AND soil temperature
  const readyNowCount = tasks.filter((t) => {
    const timing = evaluateTaskTiming(t, weather.soilTempF, currentMonth);
    return timing.isReadyNow;
  }).length;

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* Foreground Alert Notification Toast */}
      {foregroundToast && (
        <div className="fixed top-18 right-4 z-50 max-w-sm w-full bg-emerald-950 text-white p-3.5 rounded-2xl shadow-xl border border-emerald-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between space-x-2">
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-xs font-mono text-white">{foregroundToast.title}</h4>
                <p className="text-xs text-emerald-200 font-sans mt-0.5 leading-snug">{foregroundToast.body}</p>
              </div>
            </div>
            <button
              onClick={() => setForegroundToast(null)}
              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        weather={weather}
        onRefreshWeather={() =>
          loadLiveWeather(
            weather.latitude,
            weather.longitude,
            weather.locationName,
            weather.zone,
            weather.isUserLocation
          )
        }
        isLoadingWeather={isLoadingWeather}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab as any);
        }}
        pendingTasksCount={pendingTasksCount}
        urgentTasksCount={readyNowCount}
        onOpenPushModal={() => setIsPushModalOpen(true)}
      />

      {/* Real-time Weather & Soil Temperature Ribbon */}
      <WeatherSoilBar
        weather={weather}
        onSelectLocation={handleSelectLocation}
        onManualSoilTempChange={handleManualSoilTempChange}
        onDetectUserLocation={handleDetectUserLocation}
        isDetectingLocation={isDetectingLocation}
      />

      {/* Actionable Live Care Alerts */}
      <ActionAlerts
        weather={weather}
        tasks={tasks}
        onSelectTask={handleSelectTaskFromAlert}
        currentMonth={currentMonth}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'schedule' && (
          <TaskScheduleList
            tasks={tasks}
            currentSoilTempF={weather.soilTempF}
            currentZone={weather.zone}
            onToggleTask={handleToggleTask}
            onDeleteCustomTask={handleDeleteCustomTask}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onBulkCompletePastTasks={handleBulkCompleteAllPastTasks}
            highlightedTaskId={highlightedTaskId}
            currentMonth={currentMonth}
          />
        )}

        {activeTab === 'price-finder' && (
          <RecommendationPriceFinder
            weather={weather}
            currentSeason={getSeasonStageForMonth(currentMonth).label}
            currentMonth={currentMonth}
            onOpenPushModal={() => setIsPushModalOpen(true)}
          />
        )}

        {activeTab === 'plants' && (
          <PlantDirectory
            plants={plants}
            currentSoilTempF={weather.soilTempF}
            onOpenAddPlant={handleOpenAddPlant}
            onEditPlant={handleOpenEditPlant}
            onDeletePlant={handleDeletePlant}
          />
        )}

        {activeTab === 'fertilizer' && (
          <FertilizerTracker
            plants={plants}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onBulkCompleteFertilizer={handleBulkCompleteFertilizer}
            onResetFertilizerTasks={handleResetFertilizerTasks}
            currentMonth={currentMonth}
            currentSoilTempF={weather.soilTempF}
          />
        )}

        {activeTab === 'seasonal' && (
          <SeasonalGuide
            currentSoilTempF={weather.soilTempF}
            currentZone={weather.zone}
          />
        )}
      </main>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <PlantFormModal
        isOpen={isPlantModalOpen}
        onClose={() => {
          setIsPlantModalOpen(false);
          setEditingPlant(null);
        }}
        onSavePlant={handleSavePlant}
        initialPlant={editingPlant}
      />

      <FirebasePushManagerModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        weather={weather}
        currentMonth={currentMonth}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Garden & Lawn Care Maintenance Platform • Soil Temperature & Zone-Optimized Live Weather</span>
          <span>Comprehensive 7-Step Turf Schedule • Garden Inventory & Price Grounding</span>
        </div>
      </footer>
    </div>
  );
}
