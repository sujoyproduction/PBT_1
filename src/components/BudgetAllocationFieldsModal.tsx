import React, { useState } from 'react';
import { ChildCategory } from '../types';
import { COOKING_SHOW_COST_TYPES } from '../data';
import { Tag, X, Check, ChefHat } from 'lucide-react';

interface BudgetAllocationFieldsModalProps {
  child: ChildCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<ChildCategory>) => void;
}

export const BudgetAllocationFieldsModal: React.FC<BudgetAllocationFieldsModalProps> = ({
  child,
  isOpen,
  onClose,
  onSave
}) => {
  const [season, setSeason] = useState(child.season || '');
  const [episode, setEpisode] = useState(child.episode || '');
  const [round, setRound] = useState(child.round || '');
  const [segment, setSegment] = useState(child.segment || '');
  const [challenge, setChallenge] = useState(child.challenge || '');
  const [shootingDay, setShootingDay] = useState(child.shootingDay || '');
  const [productionUnit, setProductionUnit] = useState(child.productionUnit || '');
  const [kitchenStation, setKitchenStation] = useState(child.kitchenStation || '');
  const [contestant, setContestant] = useState(child.contestant || '');
  const [hostJudge, setHostJudge] = useState(child.hostJudge || '');
  const [department, setDepartment] = useState(child.department || '');
  const [studio, setStudio] = useState(child.studio || '');
  const [vendor, setVendor] = useState(child.vendor || '');
  const [sponsor, setSponsor] = useState(child.sponsor || '');
  const [costType, setCostType] = useState(child.costType || '');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      season: season.trim() || undefined,
      episode: episode.trim() || undefined,
      round: round.trim() || undefined,
      segment: segment.trim() || undefined,
      challenge: challenge.trim() || undefined,
      shootingDay: shootingDay.trim() || undefined,
      productionUnit: productionUnit.trim() || undefined,
      kitchenStation: kitchenStation.trim() || undefined,
      contestant: contestant.trim() || undefined,
      hostJudge: hostJudge.trim() || undefined,
      department: department.trim() || undefined,
      studio: studio.trim() || undefined,
      vendor: vendor.trim() || undefined,
      sponsor: sponsor.trim() || undefined,
      costType: costType.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950/80 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Budget Line Allocation &amp; ERP Tracking</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Item: <span className="text-orange-300 font-semibold">{child.name}</span> {child.code ? `(${child.code})` : ''}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-200 flex items-start gap-2">
            <Tag className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
            <div className="text-[11px]">
              <strong className="font-semibold text-orange-300">Cooking Show &amp; ERP Tracking:</strong> Attach operational dimensions (Episode, Station, Challenge, Contestant) to calculate exact Cost Breakdown without altering ledger totals.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Season */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Season
              </label>
              <input
                type="text"
                placeholder="e.g. Season 01"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Episode */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Episode
              </label>
              <input
                type="text"
                placeholder="e.g. Episode 04"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Round */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Round
              </label>
              <input
                type="text"
                placeholder="e.g. Mystery Box"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Segment */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Segment
              </label>
              <input
                type="text"
                placeholder="e.g. Cooking, Tasting"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Challenge */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Challenge
              </label>
              <input
                type="text"
                placeholder="e.g. Team Challenge"
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Shooting Day */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Shooting Day
              </label>
              <input
                type="text"
                placeholder="e.g. Day 03"
                value={shootingDay}
                onChange={(e) => setShootingDay(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Kitchen Station */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Kitchen Station
              </label>
              <input
                type="text"
                placeholder="e.g. Station 03, Island B"
                value={kitchenStation}
                onChange={(e) => setKitchenStation(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Contestant */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Contestant
              </label>
              <input
                type="text"
                placeholder="e.g. Contestant 01"
                value={contestant}
                onChange={(e) => setContestant(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Host / Judge */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Host / Judge
              </label>
              <input
                type="text"
                placeholder="e.g. Celebrity Chef"
                value={hostJudge}
                onChange={(e) => setHostJudge(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Production Unit */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Production Unit
              </label>
              <input
                type="text"
                placeholder="e.g. Main Unit"
                value={productionUnit}
                onChange={(e) => setProductionUnit(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Culinary, Art"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Studio */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Studio / Floor
              </label>
              <input
                type="text"
                placeholder="e.g. Soundstage A"
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Gourmet Mart"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Sponsor */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Sponsor
              </label>
              <input
                type="text"
                placeholder="e.g. Kitchen Brand"
                value={sponsor}
                onChange={(e) => setSponsor(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Cost Type */}
            <div>
              <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase mb-1 block">
                Cost Type
              </label>
              <select
                value={costType}
                onChange={(e) => setCostType(e.target.value)}
                className="w-full h-8 px-2 bg-slate-950 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">-- Select Cost Type --</option>
                {COOKING_SHOW_COST_TYPES.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-750 text-slate-300 hover:bg-slate-800 text-xs font-medium rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
