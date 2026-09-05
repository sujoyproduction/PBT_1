import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sun, 
  Moon, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  Camera,
  Film
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionDailyPlanningProps {
  project?: Project;
  onNavigateToTab?: (tab: string, subTab?: string) => void;
}

export interface DailyPlanData {
  shootDay: number;
  totalShootDays: number;
  planDate: string;
  shiftType: 'Day Shift' | 'Night Shift' | 'Dawn to Dusk' | 'Split Shift';
  crewCallTime: string;
  firstShotTime: string;
  estWrapTime: string;
  locationName: string;
  stageNo: string;
  baseCampLocation: string;
  weatherForecast: string;
  temperature: string;
  plannedScenes: Array<{
    sceneNo: string;
    setting: 'INT' | 'EXT';
    timeOfDay: 'DAY' | 'NIGHT';
    description: string;
    castInvolved: string;
    pages: string;
    estMinutes: number;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
  }>;
  keyDepartmentNotes: {
    camera: string;
    lighting: string;
    sound: string;
    art: string;
    action: string;
    catering: string;
  };
  safetyAlerts: string;
}

const DEFAULT_PLAN: DailyPlanData = {
  shootDay: 12,
  totalShootDays: 35,
  planDate: new Date().toISOString().substring(0, 10),
  shiftType: 'Day Shift',
  crewCallTime: '06:30 AM',
  firstShotTime: '08:00 AM',
  estWrapTime: '07:30 PM',
  locationName: 'Studio Floor 3 - Main Grand Stage',
  stageNo: 'Floor 3',
  baseCampLocation: 'North Lot - Vanity Compound & Catering Tent',
  weatherForecast: 'Partly Cloudy, Dry',
  temperature: '29°C / 84°F',
  plannedScenes: [
    {
      sceneNo: 'SC-42',
      setting: 'INT',
      timeOfDay: 'DAY',
      description: 'Host Entrance & Contestant Elimination Round',
      castInvolved: 'Host, 4 Finalists, 2 Judges',
      pages: '3.5 pgs',
      estMinutes: 120,
      status: 'Completed'
    },
    {
      sceneNo: 'SC-43A',
      setting: 'INT',
      timeOfDay: 'DAY',
      description: 'Grand Kitchen Cook-off Challenge & Reveal',
      castInvolved: 'All Contestants, Guest Celebrity Chef',
      pages: '4.2 pgs',
      estMinutes: 180,
      status: 'In Progress'
    },
    {
      sceneNo: 'SC-44',
      setting: 'INT',
      timeOfDay: 'NIGHT',
      description: 'Final Verdict & Trophy Award Ceremony',
      castInvolved: 'Host, Judges, Finalists, Studio Audience',
      pages: '2.8 pgs',
      estMinutes: 90,
      status: 'Scheduled'
    }
  ],
  keyDepartmentNotes: {
    camera: 'Multi-cam setup: 5 Broadcast rigs on Floor, 1 Jimmy Jib + 2 Steadicams.',
    lighting: 'Special moving head DMX cue on winner reveal in SC-44.',
    sound: '12 Wireless lapels + 4 Boom mics for kitchen live cooking sizzle.',
    art: 'Fresh food ingredients prep ready by 07:30 AM on set counters.',
    action: 'Cold pyrotechnics & confetti cannons primed for final verdict scene.',
    catering: 'Breakfast at 06:45 AM, Hot Buffet Lunch at 01:30 PM for 145 crew.'
  },
  safetyAlerts: 'Live gas stoves in kitchen set. Fire marshals on standby with CO2 extinguishers.'
};

export const ProductionDailyPlanning: React.FC<ProductionDailyPlanningProps> = ({ project, onNavigateToTab }) => {
  const projectId = project?.id || 'proj_default';
  const [plan, setPlan] = useState<DailyPlanData>(DEFAULT_PLAN);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Scene Form State
  const [newSceneNo, setNewSceneNo] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [newSceneCast, setNewSceneCast] = useState('');
  const [newScenePages, setNewScenePages] = useState('1.5 pgs');
  const [newSceneMinutes, setNewSceneMinutes] = useState(60);
  const [newSceneSetting, setNewSceneSetting] = useState<'INT' | 'EXT'>('INT');
  const [newSceneTime, setNewSceneTime] = useState<'DAY' | 'NIGHT'>('DAY');
  const [showAddScene, setShowAddScene] = useState(false);

  // Load from Firebase
  useEffect(() => {
    const unsub = subscribeDoc<DailyPlanData>('production_daily_plans', projectId, (data) => {
      if (data && data.plannedScenes) {
        setPlan(data);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      await saveDocData('production_daily_plans', projectId, plan);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save daily plan:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneNo.trim()) return;

    const newScene = {
      sceneNo: newSceneNo,
      setting: newSceneSetting,
      timeOfDay: newSceneTime,
      description: newSceneDesc || 'Shoot Sequence',
      castInvolved: newSceneCast || 'Main Cast',
      pages: newScenePages,
      estMinutes: Number(newSceneMinutes) || 60,
      status: 'Scheduled' as const
    };

    const updated = {
      ...plan,
      plannedScenes: [...plan.plannedScenes, newScene]
    };
    setPlan(updated);
    saveDocData('production_daily_plans', projectId, updated);

    // Reset inputs
    setNewSceneNo('');
    setNewSceneDesc('');
    setNewSceneCast('');
    setShowAddScene(false);
  };

  const handleToggleSceneStatus = (index: number) => {
    const updatedScenes = [...plan.plannedScenes];
    const current = updatedScenes[index].status;
    const nextStatus = current === 'Scheduled' ? 'In Progress' : current === 'In Progress' ? 'Completed' : current === 'Completed' ? 'Delayed' : 'Scheduled';
    updatedScenes[index].status = nextStatus;

    const updated = { ...plan, plannedScenes: updatedScenes };
    setPlan(updated);
    saveDocData('production_daily_plans', projectId, updated);
  };

  const handleDeleteScene = (index: number) => {
    const updatedScenes = plan.plannedScenes.filter((_, i) => i !== index);
    const updated = { ...plan, plannedScenes: updatedScenes };
    setPlan(updated);
    saveDocData('production_daily_plans', projectId, updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Shoot Day</span>
            <span className="text-sm font-extrabold text-white">Day {plan.shootDay} of {plan.totalShootDays}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Crew Call &amp; Wrap</span>
            <span className="text-sm font-extrabold text-white">{plan.crewCallTime} - {plan.estWrapTime}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Main Location</span>
            <span className="text-sm font-extrabold text-white truncate max-w-[140px] block" title={plan.locationName}>
              {plan.locationName}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Planned Scenes</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {plan.plannedScenes.filter(s => s.status === 'Completed').length} / {plan.plannedScenes.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Shift Parameters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Daily Production Shift Parameters</h3>
          </div>
          <button
            onClick={handleSavePlan}
            disabled={isSaving}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Plan'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">Plan Date</label>
            <input 
              type="date" 
              value={plan.planDate} 
              onChange={e => setPlan({ ...plan, planDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">Shift Type</label>
            <select
              value={plan.shiftType}
              onChange={e => setPlan({ ...plan, shiftType: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            >
              <option value="Day Shift">Day Shift (06:30 AM - 07:30 PM)</option>
              <option value="Night Shift">Night Shift (06:00 PM - 06:00 AM)</option>
              <option value="Dawn to Dusk">Dawn to Dusk (05:30 AM - 06:30 PM)</option>
              <option value="Split Shift">Split Shift (Morning / Evening)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">Weather &amp; Temp</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={plan.weatherForecast} 
                onChange={e => setPlan({ ...plan, weatherForecast: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                placeholder="Forecast"
              />
              <input 
                type="text" 
                value={plan.temperature} 
                onChange={e => setPlan({ ...plan, temperature: e.target.value })}
                className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                placeholder="Temp"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">Crew Call Time</label>
            <input 
              type="text" 
              value={plan.crewCallTime} 
              onChange={e => setPlan({ ...plan, crewCallTime: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">First Shot On Set</label>
            <input 
              type="text" 
              value={plan.firstShotTime} 
              onChange={e => setPlan({ ...plan, firstShotTime: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase mb-1 block">Estimated Camera Wrap</label>
            <input 
              type="text" 
              value={plan.estWrapTime} 
              onChange={e => setPlan({ ...plan, estWrapTime: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Target Scenes Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Today's Shooting Targets &amp; Sequences</span>
            </h3>
            <p className="text-[11px] text-slate-400">Click any row to cycle status (Scheduled → In Progress → Completed → Delayed)</p>
          </div>
          <button
            onClick={() => setShowAddScene(!showAddScene)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddScene ? 'Cancel' : 'Add Scene Target'}</span>
          </button>
        </div>

        {/* Add Scene Subform */}
        {showAddScene && (
          <form onSubmit={handleAddScene} className="p-4 bg-slate-950/80 border border-cyan-900/50 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-cyan-300">Add New Shooting Scene Target</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Scene #</label>
                <input 
                  type="text" 
                  placeholder="e.g. SC-45"
                  value={newSceneNo}
                  onChange={e => setNewSceneNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Setting / Time</label>
                <div className="flex gap-1.5">
                  <select 
                    value={newSceneSetting} 
                    onChange={e => setNewSceneSetting(e.target.value as any)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="INT">INT</option>
                    <option value="EXT">EXT</option>
                  </select>
                  <select 
                    value={newSceneTime} 
                    onChange={e => setNewSceneTime(e.target.value as any)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="DAY">DAY</option>
                    <option value="NIGHT">NIGHT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Pages</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2.5 pgs"
                  value={newScenePages}
                  onChange={e => setNewScenePages(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Est Minutes</label>
                <input 
                  type="number" 
                  placeholder="60"
                  value={newSceneMinutes}
                  onChange={e => setNewSceneMinutes(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Scene Action / Description</label>
                <input 
                  type="text" 
                  placeholder="Brief scene description or activity..."
                  value={newSceneDesc}
                  onChange={e => setNewSceneDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Cast / Characters</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lead, Supporting Cast, Extras"
                  value={newSceneCast}
                  onChange={e => setNewSceneCast(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Add Scene to Day Plan
              </button>
            </div>
          </form>
        )}

        {/* Scene Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Scene #</th>
                <th className="px-3 py-2.5">Set / Time</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5">Cast Required</th>
                <th className="px-3 py-2.5 text-right">Length</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {plan.plannedScenes.map((s, idx) => (
                <tr 
                  key={idx}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleSceneStatus(idx)}
                >
                  <td className="px-3 py-3 font-mono font-bold text-white flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{s.sceneNo}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mr-1">{s.setting}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{s.timeOfDay}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-200">{s.description}</td>
                  <td className="px-3 py-3 text-slate-400">{s.castInvolved}</td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] text-slate-400">{s.pages} ({s.estMinutes}m)</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      s.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      s.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      s.status === 'Delayed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDeleteScene(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Briefings & Safety Directives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Key Department Technical Notes
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block">Camera &amp; Rigging</span>
              <p className="text-slate-300 mt-0.5">{plan.keyDepartmentNotes.camera}</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">Lighting &amp; Power</span>
              <p className="text-slate-300 mt-0.5">{plan.keyDepartmentNotes.lighting}</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Sound &amp; Audio</span>
              <p className="text-slate-300 mt-0.5">{plan.keyDepartmentNotes.sound}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Safety, Fire &amp; Environmental Briefing
            </h3>
            <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-200">
              <p className="font-semibold">{plan.safetyAlerts}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-rose-300/80 font-mono">
                <span>• First Aid Kit: Stage Floor 3 Desk</span>
                <span>• Production Medic: Dr. Sharma (+91-98765-43210)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">All crew briefed at 06:45 AM</span>
            <button
              onClick={handleSavePlan}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Confirm &amp; Publish Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
