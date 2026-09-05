import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Zap, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionGensetFuelProps {
  project?: Project;
}

export interface GensetLog {
  id: string;
  gensetName: string;
  capacityKVA: number;
  locationArea: string;
  startHourMeter: number;
  endHourMeter: number;
  totalRunHours: number;
  fuelFilledLitres: number;
  fuelRatePerLitre: number;
  totalFuelCost: number;
  operatorName: string;
  status: 'Running' | 'Standby' | 'Shut Down';
}

const DEFAULT_GENSETS: GensetLog[] = [
  {
    id: 'g1',
    gensetName: 'Genset 1 - Studio Stage Lighting Main',
    capacityKVA: 125,
    locationArea: 'Stage 3 Rear Yard (Genset Bay 1)',
    startHourMeter: 4210.5,
    endHourMeter: 4224.5,
    totalRunHours: 14.0,
    fuelFilledLitres: 210,
    fuelRatePerLitre: 94.5,
    totalFuelCost: 19845,
    operatorName: 'Manoj Mondal (+91-98302-88112)',
    status: 'Running'
  },
  {
    id: 'g2',
    gensetName: 'Genset 2 - AC, Pantry & Sound Stage',
    capacityKVA: 82.5,
    locationArea: 'Stage 3 Side Alley (Genset Bay 2)',
    startHourMeter: 2150.0,
    endHourMeter: 2162.0,
    totalRunHours: 12.0,
    fuelFilledLitres: 130,
    fuelRatePerLitre: 94.5,
    totalFuelCost: 12285,
    operatorName: 'Subir Paul (+91-98311-99220)',
    status: 'Running'
  },
  {
    id: 'g3',
    gensetName: 'Genset 3 - Vanity Vans & Basecamp Mobile',
    capacityKVA: 62.5,
    locationArea: 'Gate 2 Vanity Parking Bay',
    startHourMeter: 1045.0,
    endHourMeter: 1056.5,
    totalRunHours: 11.5,
    fuelFilledLitres: 95,
    fuelRatePerLitre: 94.5,
    totalFuelCost: 8977.5,
    operatorName: 'Raju Guchhait (+91-98744-11229)',
    status: 'Running'
  }
];

export const ProductionGensetFuel: React.FC<ProductionGensetFuelProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [gensets, setGensets] = useState<GensetLog[]>(DEFAULT_GENSETS);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [gensetName, setGensetName] = useState('');
  const [capacity, setCapacity] = useState(125);
  const [location, setLocation] = useState('Stage 3 Yard');
  const [runHours, setRunHours] = useState(12);
  const [fuelLitres, setFuelLitres] = useState(150);
  const [fuelRate, setFuelRate] = useState(94.5);
  const [operator, setOperator] = useState('');

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ gensets: GensetLog[] }>('production_gensets', projectId, (data) => {
      if (data && data.gensets && data.gensets.length > 0) {
        setGensets(data.gensets);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: GensetLog[]) => {
    setGensets(updated);
    saveDocData('production_gensets', projectId, { gensets: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gensetName.trim()) return;

    const totalCost = Number(fuelLitres) * Number(fuelRate);
    const newG: GensetLog = {
      id: `gen_${Date.now()}`,
      gensetName,
      capacityKVA: Number(capacity),
      locationArea: location,
      startHourMeter: 0,
      endHourMeter: Number(runHours),
      totalRunHours: Number(runHours),
      fuelFilledLitres: Number(fuelLitres),
      fuelRatePerLitre: Number(fuelRate),
      totalFuelCost: totalCost,
      operatorName: operator || 'Genset In-Charge',
      status: 'Running'
    };

    const updated = [...gensets, newG];
    handleSaveToFirebase(updated);

    setGensetName('');
    setOperator('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: GensetLog['status'][] = ['Running', 'Standby', 'Shut Down'];
    const updated = gensets.map(g => {
      if (g.id === id) {
        const nextIdx = (statuses.indexOf(g.status) + 1) % statuses.length;
        return { ...g, status: statuses[nextIdx] };
      }
      return g;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = gensets.filter(g => g.id !== id);
    handleSaveToFirebase(updated);
  };

  const totalFuelLitres = gensets.reduce((sum, g) => sum + (Number(g.fuelFilledLitres) || 0), 0);
  const totalFuelCost = gensets.reduce((sum, g) => sum + (Number(g.totalFuelCost) || 0), 0);
  const totalHours = gensets.reduce((sum, g) => sum + (Number(g.totalRunHours) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">Silent Generator Power &amp; Diesel Fuel Tracker</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
              {gensets.length} Gensets Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hour-meter logs, diesel refills, generator capacities (kVA) &amp; operator contacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Today Total Fuel Cost</span>
            <span className="text-sm font-black text-emerald-400">₹{Math.round(totalFuelCost).toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Generator</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Diesel Filled</span>
          <span className="text-xl font-black text-amber-400">{totalFuelLitres} Litres</span>
          <span className="text-[10px] text-slate-500 block">Avg Rate: ₹94.50 / Ltr</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Combined Run Hours</span>
          <span className="text-xl font-black text-cyan-400">{totalHours.toFixed(1)} hrs</span>
          <span className="text-[10px] text-slate-500 block">Across 3 Power Stations</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Power Capacity</span>
          <span className="text-xl font-black text-emerald-400">270 kVA</span>
          <span className="text-[10px] text-slate-500 block">3-Phase 415V Studio Load</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Power Safety Status</span>
          <span className="text-sm font-bold text-emerald-300 block mt-1">100% Earth Tested</span>
          <span className="text-[10px] text-slate-500 block">Earth pit impedance &lt; 2Ω</span>
        </div>
      </div>

      {/* Add Genset Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Genset Unit / Refill Log
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Genset Name &amp; Load Area</label>
              <input
                type="text"
                placeholder="e.g. Genset 4 (Stage 4 Lights)"
                value={gensetName}
                onChange={e => setGensetName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Capacity (kVA)</label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Location Bay</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Total Run Hours</label>
              <input
                type="number"
                step="0.5"
                value={runHours}
                onChange={e => setRunHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Diesel Filled (Litres)</label>
              <input
                type="number"
                value={fuelLitres}
                onChange={e => setFuelLitres(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Fuel Rate / Litre (₹)</label>
              <input
                type="number"
                step="0.1"
                value={fuelRate}
                onChange={e => setFuelRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Operator Name &amp; Contact</label>
              <input
                type="text"
                placeholder="Operator name"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
            >
              Save Genset Log
            </button>
          </div>
        </form>
      )}

      {/* Gensets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Genset Unit &amp; Location</th>
                <th className="px-3 py-2.5">Capacity</th>
                <th className="px-3 py-2.5">Run Hours</th>
                <th className="px-3 py-2.5">Diesel Litres</th>
                <th className="px-3 py-2.5 text-right">Fuel Cost</th>
                <th className="px-3 py-2.5">Operator</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {gensets.map(g => (
                <tr 
                  key={g.id}
                  onClick={() => handleToggleStatus(g.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3 font-bold text-white">
                    {g.gensetName}
                    <span className="text-[10px] text-slate-400 block font-normal">{g.locationArea}</span>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-amber-300">{g.capacityKVA} kVA</td>
                  <td className="px-3 py-3 font-mono text-slate-200">{g.totalRunHours} hrs</td>
                  <td className="px-3 py-3 font-mono text-slate-200">{g.fuelFilledLitres} L</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                    ₹{Math.round(g.totalFuelCost).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400">{g.operatorName}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      g.status === 'Running' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      g.status === 'Standby' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete log"
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
