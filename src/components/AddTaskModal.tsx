import React, { useState } from 'react';
import { X, Plus, Calendar, Sprout, Tag } from 'lucide-react';
import { ScheduledTask, GardenBed, FertilizerType, TaskType, SeasonStage } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: ScheduledTask) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [plantName, setPlantName] = useState('');
  const [bed, setBed] = useState<GardenBed>('Front Garden');
  const [type, setType] = useState<TaskType>('fertilize');
  const [targetSeason, setTargetSeason] = useState<SeasonStage>('Early Spring');
  const [instruction, setInstruction] = useState('');
  const [fertilizerProduct, setFertilizerProduct] = useState<FertilizerType>('Holly Tone');
  const [minSoilTempF, setMinSoilTempF] = useState(45);
  const [maxSoilTempF, setMaxSoilTempF] = useState(65);
  const [recommendedDose, setRecommendedDose] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instruction.trim()) return;

    const newTask: ScheduledTask = {
      id: 'custom-task-' + Date.now(),
      plantName: plantName.trim() || 'Custom Plant/Bed',
      bed,
      type,
      title: title.trim(),
      instruction: instruction.trim(),
      soilTempCondition: `Soil Temp ${minSoilTempF}°F–${maxSoilTempF}°F`,
      minSoilTempF,
      maxSoilTempF,
      targetSeason,
      targetMonths: [3, 4],
      fertilizerProduct: type === 'fertilize' ? fertilizerProduct : undefined,
      recommendedDose: recommendedDose.trim() || undefined,
      completed: false,
      isCustom: true,
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-emerald-800 text-amber-300">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-serif-natural font-bold text-base text-white tracking-normal">
              Add Custom Care Task
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-mono">
          {/* Title */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Apply Holly Tone to Boxwoods"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Plant & Bed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Plant / Target</label>
              <input
                type="text"
                placeholder="e.g., Winter Gem Boxwoods"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>

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
          </div>

          {/* Action Type & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Action Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="fertilize">Fertilizing</option>
                <option value="prune">Pruning</option>
                <option value="lawn">Lawn Care</option>
                <option value="water">Watering</option>
                <option value="soil_temp">Soil Temp Trigger</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Target Season</label>
              <select
                value={targetSeason}
                onChange={(e) => setTargetSeason(e.target.value as SeasonStage)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="Late Winter">Late Winter</option>
                <option value="Early Spring">Early Spring</option>
                <option value="Mid Spring">Mid Spring</option>
                <option value="Late Spring">Late Spring</option>
                <option value="Summer">Summer</option>
                <option value="Early Fall">Early Fall</option>
                <option value="Late Fall">Late Fall</option>
              </select>
            </div>
          </div>

          {/* Product & Dose (if fertilize) */}
          {type === 'fertilize' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <div>
                <label className="block text-emerald-950 font-bold mb-1 uppercase text-[10px]">Fertilizer Product</label>
                <select
                  value={fertilizerProduct}
                  onChange={(e) => setFertilizerProduct(e.target.value as FertilizerType)}
                  className="w-full px-2 py-1.5 border border-emerald-200 rounded-lg text-xs bg-white text-slate-900"
                >
                  <option value="Holly Tone">Holly Tone (Acid food)</option>
                  <option value="Plant Tone">Plant Tone (All purpose)</option>
                  <option value="Rose Tone">Rose Tone</option>
                  <option value="10-10-10 Balanced">10-10-10 Balanced</option>
                  <option value="Granular Rose Fertilizer">Granular Rose Fertilizer</option>
                  <option value="Fruit Tree">Fruit Tree Food</option>
                </select>
              </div>

              <div>
                <label className="block text-emerald-950 font-bold mb-1 uppercase text-[10px]">Dose / Rate</label>
                <input
                  type="text"
                  placeholder="e.g. 1 cup per shrub"
                  value={recommendedDose}
                  onChange={(e) => setRecommendedDose(e.target.value)}
                  className="w-full px-2 py-1.5 border border-emerald-200 rounded-lg font-sans text-xs bg-white text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Optimal Soil Temp Trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Min Soil Temp (°F)</label>
              <input
                type="number"
                value={minSoilTempF}
                onChange={(e) => setMinSoilTempF(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Max Soil Temp (°F)</label>
              <input
                type="number"
                value={maxSoilTempF}
                onChange={(e) => setMaxSoilTempF(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-900"
              />
            </div>
          </div>

          {/* Instruction */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 uppercase text-[11px]">Care Instructions</label>
            <textarea
              required
              rows={3}
              placeholder="Detail pruning cuts, broadcast application steps, or watering timing..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
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
              Save Scheduled Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
