import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Phone, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Zap, 
  Users,
  ShieldCheck
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionVanityProps {
  project?: Project;
}

export interface VanityVanBooking {
  id: string;
  vanNumber: string;
  vanType: 'Single Door Luxury' | '2-Door Deluxe' | '3-Door Multi-Artist' | 'Makeup & Trial Studio';
  assignedArtist: string;
  parkingBay: string;
  powerSource: 'Connected to Genset 3' | 'Studio Shore Power' | 'Internal Inverter';
  driverName: string;
  driverPhone: string;
  dailyRent: number;
  housekeepingStatus: 'Sanitized & Ready' | 'In Use' | 'Cleaning In Progress';
}

const DEFAULT_VANITY: VanityVanBooking[] = [
  {
    id: 'van_1',
    vanNumber: 'WB-02-V-9901',
    vanType: 'Single Door Luxury',
    assignedArtist: 'Parambrata Chatterjee (Host)',
    parkingBay: 'Bay 1 (Near Stage 3 VIP Ramp)',
    powerSource: 'Connected to Genset 3',
    driverName: 'Raju Guchhait',
    driverPhone: '+91-98744-11229',
    dailyRent: 12000,
    housekeepingStatus: 'In Use'
  },
  {
    id: 'van_2',
    vanNumber: 'WB-02-V-9904',
    vanType: '2-Door Deluxe',
    assignedArtist: 'Chef Sanjeev & Chef Manjit (Judges)',
    parkingBay: 'Bay 2 (Near Green Room Entry)',
    powerSource: 'Connected to Genset 3',
    driverName: 'Sanjay Yadav',
    driverPhone: '+91-98319-55662',
    dailyRent: 15000,
    housekeepingStatus: 'In Use'
  },
  {
    id: 'van_3',
    vanNumber: 'WB-19-V-3310',
    vanType: '3-Door Multi-Artist',
    assignedArtist: 'Top 4 Finalist Contestants (Holding & Rest)',
    parkingBay: 'Bay 3 (Rear Lawn)',
    powerSource: 'Connected to Genset 3',
    driverName: 'Nantu Ghosh',
    driverPhone: '+91-98305-11002',
    dailyRent: 18000,
    housekeepingStatus: 'Sanitized & Ready'
  },
  {
    id: 'van_4',
    vanNumber: 'WB-02-V-7711',
    vanType: 'Makeup & Trial Studio',
    assignedArtist: 'Costume & Special Effects Trial Unit',
    parkingBay: 'Bay 4 (Costume Bay)',
    powerSource: 'Studio Shore Power',
    driverName: 'Pintoo Paul',
    driverPhone: '+91-98741-22998',
    dailyRent: 14000,
    housekeepingStatus: 'Sanitized & Ready'
  }
];

export const ProductionVanity: React.FC<ProductionVanityProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [vans, setVans] = useState<VanityVanBooking[]>(DEFAULT_VANITY);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [vanNumber, setVanNumber] = useState('');
  const [vanType, setVanType] = useState<VanityVanBooking['vanType']>('Single Door Luxury');
  const [artist, setArtist] = useState('');
  const [bay, setBay] = useState('Bay 1');
  const [power, setPower] = useState<VanityVanBooking['powerSource']>('Connected to Genset 3');
  const [driver, setDriver] = useState('');
  const [phone, setPhone] = useState('');
  const [rent, setRent] = useState(12000);

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ vans: VanityVanBooking[] }>('production_vanities', projectId, (data) => {
      if (data && data.vans && data.vans.length > 0) {
        setVans(data.vans);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: VanityVanBooking[]) => {
    setVans(updated);
    saveDocData('production_vanities', projectId, { vans: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vanNumber.trim()) return;

    const newVan: VanityVanBooking = {
      id: `van_${Date.now()}`,
      vanNumber,
      vanType,
      assignedArtist: artist || 'Lead Talent',
      parkingBay: bay,
      powerSource: power,
      driverName: driver || 'Vanity Driver',
      driverPhone: phone || '+91-',
      dailyRent: Number(rent) || 10000,
      housekeepingStatus: 'Sanitized & Ready'
    };

    const updated = [...vans, newVan];
    handleSaveToFirebase(updated);

    setVanNumber('');
    setArtist('');
    setDriver('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: VanityVanBooking['housekeepingStatus'][] = ['Sanitized & Ready', 'In Use', 'Cleaning In Progress'];
    const updated = vans.map(v => {
      if (v.id === id) {
        const nextIdx = (statuses.indexOf(v.housekeepingStatus) + 1) % statuses.length;
        return { ...v, housekeepingStatus: statuses[nextIdx] };
      }
      return v;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = vans.filter(v => v.id !== id);
    handleSaveToFirebase(updated);
  };

  const totalVanCost = vans.reduce((sum, v) => sum + (Number(v.dailyRent) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Talent Vanity Vans &amp; Artist Trailers</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {vans.length} Vans Parked &amp; Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Artist allocations, parking bays, power distribution &amp; housekeeping status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Daily Vanity Rental Burn</span>
            <span className="text-sm font-black text-emerald-400">₹{totalVanCost.toLocaleString('en-IN')} / day</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vanity Van</span>
          </button>
        </div>
      </div>

      {/* Add Van Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Vanity Van Allocation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Van Registration #</label>
              <input
                type="text"
                placeholder="e.g. WB-02-V-1234"
                value={vanNumber}
                onChange={e => setVanNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Van Category</label>
              <select
                value={vanType}
                onChange={e => setVanType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Single Door Luxury">Single Door Luxury</option>
                <option value="2-Door Deluxe">2-Door Deluxe</option>
                <option value="3-Door Multi-Artist">3-Door Multi-Artist</option>
                <option value="Makeup & Trial Studio">Makeup &amp; Trial Studio</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Artist / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Lead Star / Judge"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Parking Bay</label>
              <input
                type="text"
                value={bay}
                onChange={e => setBay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Power Source</label>
              <select
                value={power}
                onChange={e => setPower(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Connected to Genset 3">Connected to Genset 3</option>
                <option value="Studio Shore Power">Studio Shore Power</option>
                <option value="Internal Inverter">Internal Inverter</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Driver Name &amp; Phone</label>
              <input
                type="text"
                placeholder="Driver Name"
                value={driver}
                onChange={e => setDriver(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Daily Rent (₹)</label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(Number(e.target.value))}
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
              Save Vanity Assignment
            </button>
          </div>
        </form>
      )}

      {/* Van Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {vans.map(v => (
          <div 
            key={v.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono uppercase font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/40">
                    {v.vanType}
                  </span>
                  <h4 className="text-base font-extrabold text-white mt-1.5">{v.assignedArtist}</h4>
                  <span className="text-xs text-slate-400 font-mono">Reg: {v.vanNumber}</span>
                </div>

                <button
                  onClick={() => handleToggleStatus(v.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    v.housekeepingStatus === 'Sanitized & Ready' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    v.housekeepingStatus === 'In Use' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {v.housekeepingStatus}
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>Parking:</strong> {v.parkingBay}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong>Power:</strong> {v.powerSource}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span><strong>Driver:</strong> {v.driverName} ({v.driverPhone})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="font-mono font-bold text-emerald-400">
                ₹{v.dailyRent.toLocaleString('en-IN')} / day
              </span>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                title="Delete vanity record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
