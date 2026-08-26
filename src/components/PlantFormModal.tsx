import React, { useState, useEffect } from 'react';
import { X, Sprout, Edit3, Trash2 } from 'lucide-react';
import { PlantRecord, GardenBed, FertilizerType } from '../types';

interface PlantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlant: (plant: PlantRecord) => void;
  initialPlant?: PlantRecord | null;
}

export const PlantFormModal: React.FC<PlantFormModalProps> = ({
  isOpen,
  onClose,
  onSavePlant,
  initialPlant,
}) => {
  const isEditing = Boolean(initialPlant);

  const [name, setName] = useState('');
  const [bed, setBed] = useState<GardenBed>('Front Garden');
  const [category, setCategory] = useState<PlantRecord['category']>('Shrub');
  const [fertilizing, setFertilizing] = useState('');
  const [pruning, setPruning] = useState('');
  const [watering, setWatering] = useState('');
  const [yearPlanted, setYearPlanted] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('Holly Tone');
  const [minSoilTempF, setMinSoilTempF] = useState(45);
  const [maxSoilTempF, setMaxSoilTempF] = useState(75);

  useEffect(() => {
    if (initialPlant) {
      setName(initialPlant.name);
      setBed(initialPlant.bed);
      setCategory(initialPlant.category);
      setFertilizing(initialPlant.fertilizing);
      setPruning(initialPlant.pruning || '');
      setWatering(initialPlant.watering || '');
      setYearPlanted(initialPlant.yearPlanted || '');
      setExtraNotes(initialPlant.extraNotes || '');
      setFertilizerType(initialPlant.fertilizerType);
      setMinSoilTempF(initialPlant.optimalSoilTempMinF);
      setMaxSoilTempF(initialPlant.optimalSoilTempMaxF);
    } else {
      setName('');
      setBed('Front Garden');
      setCategory('Shrub');
      setFertilizing('');
      setPruning('');
      setWatering('');
      setYearPlanted(String(new Date().getFullYear()));
      setExtraNotes('');
      setFertilizerType('Holly Tone');
      setMinSoilTempF(45);
      setMaxSoilTempF(75);
    }
  }, [initialPlant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fertilizing.trim()) return;

    const plantData: PlantRecord = {
      id: initialPlant ? initialPlant.id : 'plant-' + Date.now(),
      name: name.trim(),
      bed,
      category,
      fertilizing: fertilizing.trim(),
      pruning: pruning.trim() || 'Minimal pruning required',
      watering: watering.trim() || '1x weekly in spring / summer',
      yearPlanted: yearPlanted.trim() || String(new Date().getFullYear()),
      extraNotes: extraNotes.trim(),
      fertilizerType,
      optimalSoilTempMinF: minSoilTempF,
      optimalSoilTempMaxF: maxSoilTempF,
      pruneWindowText: pruning.trim() || 'Prune as needed',
      fertilizeWindowText: fertilizing.trim(),
      wateringGuidance: watering.trim(),
    };

    onSavePlant(plantData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 border-b border-emerald-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-emerald-800 text-amber-300">
              {isEditing ? (
                <Edit3 className="w-4 h-4" />
              ) : (
                <Sprout className="w-4 h-4" />
              )}
            </span>
            <h3 className="font-serif-natural font-bold text-base text-white tracking-normal">
              {isEditing ? `Edit Plant: ${initialPlant?.name}` : 'Add New Garden Plant'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-mono overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Plant Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Endless Summer Hydrangea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Bed & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Garden Bed</label>
              <select
                value={bed}
                onChange={(e) => setBed(e.target.value as GardenBed)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="Front Garden">Front Garden</option>
                <option value="Shared Garden">Shared Garden</option>
                <option value="Garage Garden">Garage Garden</option>
                <option value="Backyard">Backyard</option>
                <option value="Planter Box">Planter Box</option>
                <option value="Lawn Care">Lawn Care</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Plant Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlantRecord['category'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="Shrub">Shrub</option>
                <option value="Perennial">Perennial</option>
                <option value="Rose">Rose</option>
                <option value="Tree">Tree</option>
                <option value="Climber">Climber</option>
                <option value="Groundcover">Groundcover</option>
                <option value="Turf">Turf</option>
              </select>
            </div>
          </div>

          {/* Fertilizer Product & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Fertilizer Type</label>
              <select
                value={fertilizerType}
                onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="Holly Tone">Holly Tone (Acid)</option>
                <option value="Plant Tone">Plant Tone</option>
                <option value="Rose Tone">Rose Tone</option>
                <option value="10-10-10 Balanced">10-10-10 Balanced</option>
                <option value="All Purpose">All Purpose</option>
                <option value="Fruit Tree">Fruit Tree</option>
                <option value="Granular Rose Fertilizer">Granular Rose Fertilizer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Year Planted</label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={yearPlanted}
                onChange={(e) => setYearPlanted(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Soil Temp Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Min Optimal Soil Temp (°F)</label>
              <input
                type="number"
                value={minSoilTempF}
                onChange={(e) => setMinSoilTempF(Number(e.target.value) || 45)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Max Optimal Soil Temp (°F)</label>
              <input
                type="number"
                value={maxSoilTempF}
                onChange={(e) => setMaxSoilTempF(Number(e.target.value) || 75)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900"
              />
            </div>
          </div>

          {/* Fertilizing Text */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Fertilizing Instructions *</label>
            <input
              type="text"
              required
              placeholder="e.g., Holly Tone: early spring and July"
              value={fertilizing}
              onChange={(e) => setFertilizing(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Pruning & Watering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Pruning Protocol</label>
              <input
                type="text"
                placeholder="e.g. Early spring post-bloom"
                value={pruning}
                onChange={(e) => setPruning(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Watering Schedule</label>
              <input
                type="text"
                placeholder="e.g. 1-2x weekly deep soak"
                value={watering}
                onChange={(e) => setWatering(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Extra Notes */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Extra Notes / Cultivar Details</label>
            <input
              type="text"
              placeholder="e.g., Prefers morning sun, afternoon shade"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Add Plant to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
