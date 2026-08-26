import React, { useState } from 'react';
import {
  Sprout,
  Search,
  Plus,
  Info,
  Droplets,
  Scissors,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { PlantRecord, GardenBed } from '../types';

interface PlantDirectoryProps {
  plants: PlantRecord[];
  currentSoilTempF: number;
  onOpenAddPlant: () => void;
  onEditPlant: (plant: PlantRecord) => void;
  onDeletePlant: (plantId: string) => void;
}

export const PlantDirectory: React.FC<PlantDirectoryProps> = ({
  plants,
  currentSoilTempF,
  onOpenAddPlant,
  onEditPlant,
  onDeletePlant,
}) => {
  const [selectedBed, setSelectedBed] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [plantToDelete, setPlantToDelete] = useState<PlantRecord | null>(null);

  const beds: Array<GardenBed | 'all'> = [
    'all',
    'Front Garden',
    'Shared Garden',
    'Garage Garden',
    'Backyard',
    'Planter Box',
    'Lawn Care',
  ];

  const filteredPlants = plants.filter((plant) => {
    if (selectedBed !== 'all' && plant.bed !== selectedBed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        plant.name.toLowerCase().includes(q) ||
        plant.bed.toLowerCase().includes(q) ||
        plant.fertilizing.toLowerCase().includes(q) ||
        plant.pruning.toLowerCase().includes(q) ||
        plant.extraNotes.toLowerCase().includes(q) ||
        plant.fertilizerType.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const bedsOrder: GardenBed[] = [
    'Front Garden',
    'Shared Garden',
    'Garage Garden',
    'Backyard',
    'Planter Box',
    'Lawn Care',
  ];

  const confirmDelete = () => {
    if (plantToDelete) {
      onDeletePlant(plantToDelete.id);
      setPlantToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              <h3 className="text-xl font-bold font-serif-natural text-slate-900 tracking-normal">
                Plant & Garden Bed Directory
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-sans">
              Inventory of plantings with soil temperature triggers, fertilizer types, pruning protocols, and custom plant management.
            </p>
          </div>

          <button
            onClick={onOpenAddPlant}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors shadow-2xs self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Plant</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search plants, fertilizers, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex overflow-x-auto gap-1 pb-1 sm:pb-0 text-xs font-mono">
            {beds.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBed(b)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                  selectedBed === b
                    ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                {b === 'all' ? `All Beds (${plants.length})` : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Bed Display */}
      {bedsOrder.map((bedName) => {
        const bedPlants = filteredPlants.filter((p) => p.bed === bedName);
        if (bedPlants.length === 0) return null;

        return (
          <div key={bedName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Bed Header */}
            <div className="bg-gradient-to-r from-[#0A3326] to-[#0E4433] text-white px-4 py-3 border-b border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
                <h4 className="font-serif-natural font-bold text-base tracking-normal text-white">{bedName}</h4>
                <span className="text-emerald-200 text-xs font-mono">({bedPlants.length} plantings)</span>
              </div>
            </div>

            {/* Plant Table / Cards */}
            <div className="divide-y divide-slate-100">
              {bedPlants.map((plant) => {
                const isOptimalSoilNow =
                  currentSoilTempF >= plant.optimalSoilTempMinF &&
                  currentSoilTempF <= plant.optimalSoilTempMaxF;

                return (
                  <div key={plant.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Left: Plant Name & Core Tags */}
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <h5 className="text-base font-bold font-mono text-slate-900">
                            {plant.name}
                          </h5>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                            {plant.category}
                          </span>
                          {plant.yearPlanted && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Planted: {plant.yearPlanted}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                            {plant.fertilizerType}
                          </span>
                          {isOptimalSoilNow && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-600 text-white border border-emerald-600 font-bold shadow-2xs">
                              ✓ Optimal Soil Temp ({currentSoilTempF}°F)
                            </span>
                          )}
                        </div>

                        {/* Grid of 3 Core Properties */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          {/* Fertilizing */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-1.5 text-emerald-800 font-bold mb-1">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                              <span>FERTILIZING</span>
                            </div>
                            <p className="text-slate-700 font-sans text-xs leading-relaxed font-medium">
                              {plant.fertilizing}
                            </p>
                          </div>

                          {/* Pruning */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-1.5 text-amber-800 font-bold mb-1">
                              <Scissors className="w-3.5 h-3.5 text-amber-600" />
                              <span>PRUNING</span>
                            </div>
                            <p className="text-slate-700 font-sans text-xs leading-relaxed font-medium">
                              {plant.pruning || 'Minimal / as needed'}
                            </p>
                          </div>

                          {/* Watering */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-1.5 text-sky-800 font-bold mb-1">
                              <Droplets className="w-3.5 h-3.5 text-sky-600" />
                              <span>WATERING</span>
                            </div>
                            <p className="text-slate-700 font-sans text-xs leading-relaxed font-medium">
                              {plant.watering || 'Weekly regular soak in dry periods'}
                            </p>
                          </div>
                        </div>

                        {/* Extra Notes Row if present */}
                        {plant.extraNotes && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-sans text-slate-800 flex items-start space-x-2">
                            <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <strong className="font-mono text-[11px] text-amber-900 mr-1">EXTRA NOTES:</strong>
                              <span>{plant.extraNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Edit & Remove Action Buttons */}
                      <div className="shrink-0 flex items-center space-x-2 self-end lg:self-start">
                        <button
                          onClick={() => onEditPlant(plant)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 text-slate-800 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer hover:border-emerald-300"
                          title="Edit plant specifications"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setPlantToDelete(plant)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Remove plant from inventory"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      {plantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-natural font-bold text-base text-slate-900">
                  Remove Plant Record?
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-sans">
                  Are you sure you want to remove <strong>{plantToDelete.name}</strong> from <strong>{plantToDelete.bed}</strong>? Associated custom tasks will remain in your schedule unless deleted individually.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setPlantToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Yes, Remove Plant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
