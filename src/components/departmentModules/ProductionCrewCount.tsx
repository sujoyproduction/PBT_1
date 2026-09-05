import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Utensils, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionCrewCountProps {
  project?: Project;
}

export interface DeptCrewMuster {
  id: string;
  department: string;
  headName: string;
  plannedPax: number;
  actualPax: number;
  otHours: number;
  breakfastPax: number;
  lunchPax: number;
  dinnerPax: number;
  notes?: string;
}

const DEFAULT_MUSTER: DeptCrewMuster[] = [
  { id: 'm1', department: 'Direction & Script', headName: 'Sujoy Ghosh / Ananya', plannedPax: 6, actualPax: 6, otHours: 1, breakfastPax: 6, lunchPax: 6, dinnerPax: 6 },
  { id: 'm2', department: 'Camera & DIT', headName: 'Ravi Varman / Karan', plannedPax: 14, actualPax: 14, otHours: 1.5, breakfastPax: 14, lunchPax: 14, dinnerPax: 14 },
  { id: 'm3', department: 'Sound & Audio', headName: 'Debjit Changmai', plannedPax: 8, actualPax: 8, otHours: 1, breakfastPax: 8, lunchPax: 8, dinnerPax: 8 },
  { id: 'm4', department: 'Lighting & Rigging', headName: 'Gaffer Jagdish', plannedPax: 18, actualPax: 18, otHours: 2, breakfastPax: 18, lunchPax: 18, dinnerPax: 18 },
  { id: 'm5', department: 'Art, Set & Props', headName: 'Art Director Subrata', plannedPax: 12, actualPax: 13, otHours: 2, breakfastPax: 13, lunchPax: 13, dinnerPax: 13, notes: '1 extra carpenter for cooking stove rig' },
  { id: 'm6', department: 'Costume & Wardrobe', headName: 'Suchismita Das', plannedPax: 6, actualPax: 6, otHours: 1, breakfastPax: 6, lunchPax: 6, dinnerPax: 6 },
  { id: 'm7', department: 'Makeup & Hair', headName: 'Vikram Gaikwad', plannedPax: 8, actualPax: 8, otHours: 1, breakfastPax: 8, lunchPax: 8, dinnerPax: 8 },
  { id: 'm8', department: 'Production & Accounts', headName: 'Subhashish Das', plannedPax: 10, actualPax: 10, otHours: 2, breakfastPax: 10, lunchPax: 10, dinnerPax: 10 },
  { id: 'm9', department: 'Spot Boys & Catering Helper', headName: 'Spot In-charge Raju', plannedPax: 16, actualPax: 16, otHours: 2, breakfastPax: 16, lunchPax: 16, dinnerPax: 16 },
  { id: 'm10', department: 'Security & Housekeeping', headName: 'Security Lead Sharma', plannedPax: 12, actualPax: 12, otHours: 0, breakfastPax: 12, lunchPax: 12, dinnerPax: 12 },
  { id: 'm11', department: 'Transport & Drivers', headName: 'Fleet Supv. Anil', plannedPax: 14, actualPax: 14, otHours: 2.5, breakfastPax: 14, lunchPax: 14, dinnerPax: 14 }
];

export const ProductionCrewCount: React.FC<ProductionCrewCountProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [muster, setMuster] = useState<DeptCrewMuster[]>(DEFAULT_MUSTER);
  const [isSaved, setIsSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [newDept, setNewDept] = useState('');
  const [newHead, setNewHead] = useState('');
  const [newPlanned, setNewPlanned] = useState(5);
  const [newActual, setNewActual] = useState(5);
  const [newOt, setNewOt] = useState(0);

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ muster: DeptCrewMuster[] }>('production_crew_musters', projectId, (data) => {
      if (data && data.muster && data.muster.length > 0) {
        setMuster(data.muster);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: DeptCrewMuster[]) => {
    setMuster(updated);
    saveDocData('production_crew_musters', projectId, { muster: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;

    const newRow: DeptCrewMuster = {
      id: `m_${Date.now()}`,
      department: newDept,
      headName: newHead || 'Department Head',
      plannedPax: Number(newPlanned) || 5,
      actualPax: Number(newActual) || 5,
      otHours: Number(newOt) || 0,
      breakfastPax: Number(newActual) || 5,
      lunchPax: Number(newActual) || 5,
      dinnerPax: Number(newActual) || 5
    };

    const updated = [...muster, newRow];
    handleSaveToFirebase(updated);

    setNewDept('');
    setNewHead('');
    setShowAdd(false);
  };

  const handleUpdatePax = (id: string, field: keyof DeptCrewMuster, val: any) => {
    const updated = muster.map(m => {
      if (m.id === id) {
        return { ...m, [field]: val };
      }
      return m;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = muster.filter(m => m.id !== id);
    handleSaveToFirebase(updated);
  };

  // Metrics
  const totalPlanned = muster.reduce((sum, m) => sum + (Number(m.plannedPax) || 0), 0);
  const totalActual = muster.reduce((sum, m) => sum + (Number(m.actualPax) || 0), 0);
  const totalOtHours = muster.reduce((sum, m) => sum + ((Number(m.otHours) || 0) * (Number(m.actualPax) || 0)), 0);
  const totalLunch = muster.reduce((sum, m) => sum + (Number(m.lunchPax) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Crew Present</span>
          <span className="text-xl font-black text-cyan-400">{totalActual} Pax</span>
          <span className="text-[10px] text-slate-500 block">Planned: {totalPlanned} Pax</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Attendance Rate</span>
          <span className="text-xl font-black text-emerald-400">
            {totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 100}%
          </span>
          <span className="text-[10px] text-slate-500 block">100% Core Dept Coverage</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total OT Man-Hours</span>
          <span className="text-xl font-black text-amber-400">{totalOtHours.toFixed(1)} hrs</span>
          <span className="text-[10px] text-slate-500 block">Across {muster.length} Departments</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Lunch Catering Count</span>
          <span className="text-xl font-black text-purple-400">{totalLunch} Meals</span>
          <span className="text-[10px] text-slate-500 block">Direct sync with Food tab</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Department Crew Muster &amp; Headcount Register</span>
            </h3>
            <p className="text-[11px] text-slate-400">Live on-set headcount tracking, overtime hours &amp; catering pax sync.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
            <button
              onClick={() => handleSaveToFirebase(muster)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved!' : 'Save Muster'}</span>
            </button>
          </div>
        </div>

        {/* Add Department Form */}
        {showAdd && (
          <form onSubmit={handleAddDept} className="p-4 bg-slate-950 rounded-xl border border-cyan-900/50 space-y-3">
            <h4 className="text-xs font-bold text-cyan-300">Add Department Muster Entry</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Action / Stunts"
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">HOD / Lead</label>
                <input
                  type="text"
                  placeholder="e.g. Master Sunil"
                  value={newHead}
                  onChange={e => setNewHead(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Planned Pax</label>
                <input
                  type="number"
                  value={newPlanned}
                  onChange={e => setNewPlanned(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Actual Present</label>
                <input
                  type="number"
                  value={newActual}
                  onChange={e => setNewActual(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">OT (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newOt}
                  onChange={e => setNewOt(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
              >
                Add Row
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">HOD / In-Charge</th>
                <th className="px-3 py-2.5 text-center">Planned</th>
                <th className="px-3 py-2.5 text-center">Actual Present</th>
                <th className="px-3 py-2.5 text-center">OT (Hrs)</th>
                <th className="px-3 py-2.5 text-center">Breakfast</th>
                <th className="px-3 py-2.5 text-center">Lunch</th>
                <th className="px-3 py-2.5 text-center">Dinner</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {muster.map(m => (
                <tr key={m.id} className="hover:bg-slate-850/50">
                  <td className="px-3 py-3 font-bold text-white">
                    {m.department}
                    {m.notes && <span className="text-[10px] text-slate-400 block font-normal italic">{m.notes}</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-300 font-mono text-[11px]">{m.headName}</td>
                  <td className="px-3 py-3 text-center font-mono text-slate-400">{m.plannedPax}</td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="number"
                      value={m.actualPax}
                      onChange={e => handleUpdatePax(m.id, 'actualPax', Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono font-bold text-cyan-300 outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="number"
                      step="0.5"
                      value={m.otHours}
                      onChange={e => handleUpdatePax(m.id, 'otHours', Number(e.target.value))}
                      className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center font-mono text-amber-300 outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-slate-400">{m.breakfastPax}</td>
                  <td className="px-3 py-3 text-center font-mono text-emerald-400 font-bold">{m.lunchPax}</td>
                  <td className="px-3 py-3 text-center font-mono text-slate-400">{m.dinnerPax}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete entry"
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
    </div>
  );
};
