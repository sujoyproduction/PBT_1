import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Radio, 
  Camera, 
  Film,
  Sparkles
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionUnitPlanningProps {
  project?: Project;
}

export interface UnitDetail {
  id: string;
  unitName: string;
  unitType: 'Main Unit' | 'Splinter / 2nd Unit' | 'Action / Stunt Unit' | 'Chroma / Virtual' | 'BTS & Promo';
  director: string;
  dop: string;
  adLead: string;
  location: string;
  callTime: string;
  scenesAssigned: string[];
  cameraPackage: string;
  crewHeadcount: number;
  status: 'Active Shoot' | 'Prep' | 'Rehearsal' | 'Moving' | 'Wrapped';
}

const DEFAULT_UNITS: UnitDetail[] = [
  {
    id: 'unit_1',
    unitName: 'Unit 1 (Main Studio Floor)',
    unitType: 'Main Unit',
    director: 'Sujoy Ghosh (Series Director)',
    dop: 'Ravi Varman, ISC',
    adLead: '1st AD - Ananya Roy',
    location: 'Studio Floor 3 - Main Grand Stage',
    callTime: '06:30 AM',
    scenesAssigned: ['SC-42', 'SC-43A', 'SC-44'],
    cameraPackage: '3x ARRI Alexa Mini LF + Cook Anamorphic + Jib',
    crewHeadcount: 85,
    status: 'Active Shoot'
  },
  {
    id: 'unit_2',
    unitName: 'Unit 2 (Kitchen Exterior & Prep Area)',
    unitType: 'Splinter / 2nd Unit',
    director: 'Vikramaditya (Splinter Director)',
    dop: 'Karan Dave',
    adLead: '2nd AD - Rahul Sen',
    location: 'Outdoor Pantry & Backstage Prep Bay',
    callTime: '07:30 AM',
    scenesAssigned: ['SC-43B (B-Roll)', 'Contestant Prep Inserts'],
    cameraPackage: '2x RED V-Raptor + Macro Master Primes',
    crewHeadcount: 24,
    status: 'Active Shoot'
  },
  {
    id: 'unit_3',
    unitName: 'Unit 3 (Promo & Confessional Booth)',
    unitType: 'BTS & Promo',
    director: 'Tanvi Shah (Promo Producer)',
    dop: 'Alok Tiwari',
    adLead: 'Associate AD - Pooja',
    location: 'Sound Stage 1 - Green Room 4',
    callTime: '09:00 AM',
    scenesAssigned: ['Judge Soundbites', 'Elimination Reactions'],
    cameraPackage: '2x Sony FX9 + GM Primes',
    crewHeadcount: 12,
    status: 'Prep'
  }
];

export const ProductionUnitPlanning: React.FC<ProductionUnitPlanningProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [units, setUnits] = useState<UnitDetail[]>(DEFAULT_UNITS);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Form State
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<UnitDetail['unitType']>('Main Unit');
  const [director, setDirector] = useState('');
  const [dop, setDop] = useState('');
  const [adLead, setAdLead] = useState('');
  const [location, setLocation] = useState('');
  const [callTime, setCallTime] = useState('07:00 AM');
  const [scenes, setScenes] = useState('');
  const [cameraPackage, setCameraPackage] = useState('');
  const [crewHeadcount, setCrewHeadcount] = useState(25);

  // Subscribe to Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ units: UnitDetail[] }>('production_unit_plans', projectId, (data) => {
      if (data && data.units && data.units.length > 0) {
        setUnits(data.units);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updatedUnits: UnitDetail[]) => {
    setUnits(updatedUnits);
    saveDocData('production_unit_plans', projectId, { units: updatedUnits });
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    const newUnit: UnitDetail = {
      id: `unit_${Date.now()}`,
      unitName,
      unitType,
      director: director || 'Director in Charge',
      dop: dop || 'DoP in Charge',
      adLead: adLead || '1st AD',
      location: location || 'Studio Set',
      callTime,
      scenesAssigned: scenes.split(',').map(s => s.trim()).filter(Boolean),
      cameraPackage: cameraPackage || 'Standard Broadcast Package',
      crewHeadcount: Number(crewHeadcount) || 20,
      status: 'Prep'
    };

    const updated = [...units, newUnit];
    handleSaveToFirebase(updated);

    // Reset
    setUnitName('');
    setDirector('');
    setDop('');
    setAdLead('');
    setLocation('');
    setScenes('');
    setShowAddUnit(false);
  };

  const handleToggleUnitStatus = (unitId: string) => {
    const updated = units.map(u => {
      if (u.id === unitId) {
        const statuses: UnitDetail['status'][] = ['Active Shoot', 'Prep', 'Rehearsal', 'Moving', 'Wrapped'];
        const nextIdx = (statuses.indexOf(u.status) + 1) % statuses.length;
        return { ...u, status: statuses[nextIdx] };
      }
      return u;
    });
    handleSaveToFirebase(updated);
  };

  const handleDeleteUnit = (unitId: string) => {
    const updated = units.filter(u => u.id !== unitId);
    handleSaveToFirebase(updated);
  };

  return (
    <div className="space-y-6">
      {/* Unit Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Multi-Unit Production Deployment Board</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
              {units.length} Units Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Coordinate simultaneous shooting units, splinter units, promo crews &amp; resource allocations.
          </p>
        </div>

        <button
          onClick={() => setShowAddUnit(!showAddUnit)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddUnit ? 'Cancel' : 'Deploy New Unit'}</span>
        </button>
      </div>

      {/* Add Unit Subform */}
      {showAddUnit && (
        <form onSubmit={handleAddUnit} className="bg-slate-900 border border-cyan-500/40 p-5 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Configure &amp; Deploy Shooting Unit
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Unit Name</label>
              <input
                type="text"
                placeholder="e.g. Unit 2 (Action / Chroma)"
                value={unitName}
                onChange={e => setUnitName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Unit Type</label>
              <select
                value={unitType}
                onChange={e => setUnitType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Main Unit">Main Unit</option>
                <option value="Splinter / 2nd Unit">Splinter / 2nd Unit</option>
                <option value="Action / Stunt Unit">Action / Stunt Unit</option>
                <option value="Chroma / Virtual">Chroma / Virtual</option>
                <option value="BTS & Promo">BTS &amp; Promo</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Location / Stage</label>
              <input
                type="text"
                placeholder="e.g. Stage 4 / Backlot"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Director / Lead</label>
              <input
                type="text"
                placeholder="Director name"
                value={director}
                onChange={e => setDirector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">DoP / Cinematographer</label>
              <input
                type="text"
                placeholder="DoP name"
                value={dop}
                onChange={e => setDop(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">1st AD / In-Charge</label>
              <input
                type="text"
                placeholder="AD name"
                value={adLead}
                onChange={e => setAdLead(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Unit Call Time</label>
              <input
                type="text"
                placeholder="07:00 AM"
                value={callTime}
                onChange={e => setCallTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Scenes (comma separated)</label>
              <input
                type="text"
                placeholder="SC-12, SC-14, B-Roll"
                value={scenes}
                onChange={e => setScenes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Camera Package</label>
              <input
                type="text"
                placeholder="e.g. 2x Sony FX6 + Primes"
                value={cameraPackage}
                onChange={e => setCameraPackage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Crew Headcount</label>
              <input
                type="number"
                value={crewHeadcount}
                onChange={e => setCrewHeadcount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddUnit(false)}
              className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
            >
              Deploy Unit
            </button>
          </div>
        </form>
      )}

      {/* Units Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div 
            key={unit.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/40">
                    {unit.unitType}
                  </span>
                  <h4 className="text-sm font-extrabold text-white mt-1.5">{unit.unitName}</h4>
                </div>

                {/* Status Toggle Badge */}
                <button
                  onClick={() => handleToggleUnitStatus(unit.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    unit.status === 'Active Shoot' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    unit.status === 'Prep' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    unit.status === 'Rehearsal' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    unit.status === 'Moving' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Click to cycle status"
                >
                  {unit.status}
                </button>
              </div>

              {/* Key Crew info */}
              <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Director:</span>
                  <span className="font-semibold text-white truncate max-w-[170px]">{unit.director}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">DoP:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[170px]">{unit.dop}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">1st AD / In-Charge:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">{unit.adLead}</span>
                </div>
              </div>

              {/* Location & Call */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{unit.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Call: <strong>{unit.callTime}</strong></span>
                  <span className="text-slate-600">•</span>
                  <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span><strong>{unit.crewHeadcount}</strong> Crew</span>
                </div>
              </div>

              {/* Assigned Scenes */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Assigned Targets</span>
                <div className="flex flex-wrap gap-1">
                  {unit.scenesAssigned.map((sc, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono font-bold">
                      {sc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Camera Rig info */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">Package:</span>
                <p className="truncate text-slate-300">{unit.cameraPackage}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">Unit ID: {unit.id}</span>
              <button
                onClick={() => handleDeleteUnit(unit.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove Unit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
