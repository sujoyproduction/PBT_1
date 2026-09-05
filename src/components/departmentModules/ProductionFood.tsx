import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Coffee
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionFoodProps {
  project?: Project;
}

export interface MealSession {
  id: string;
  sessionName: 'Breakfast' | 'Morning Snacks & Tea' | 'Buffet Lunch' | 'Evening Hi-Tea' | 'Dinner' | 'Midnight Pack';
  serviceTiming: string;
  catererVendor: string;
  vegCount: number;
  nonVegCount: number;
  jainCount: number;
  totalPax: number;
  costPerPlate: number;
  menuHighlights: string;
  status: 'Served' | 'In Preparation' | 'Scheduled';
}

const DEFAULT_MEALS: MealSession[] = [
  {
    id: 'm1',
    sessionName: 'Breakfast',
    serviceTiming: '06:45 AM - 08:30 AM',
    catererVendor: 'Annapurna Royal Caterers',
    vegCount: 65,
    nonVegCount: 75,
    jainCount: 5,
    totalPax: 145,
    costPerPlate: 120,
    menuHighlights: 'Luchi-Alur Dom, Idli-Sambar, Boiled Eggs, Tea & Fresh Fruit',
    status: 'Served'
  },
  {
    id: 'm2',
    sessionName: 'Morning Snacks & Tea',
    serviceTiming: '10:45 AM - 11:15 AM',
    catererVendor: 'Annapurna Royal Caterers',
    vegCount: 80,
    nonVegCount: 65,
    jainCount: 5,
    totalPax: 150,
    costPerPlate: 45,
    menuHighlights: 'Singara (Samosa), Biscuits, Ginger Cardamom Tea & Coffee',
    status: 'Served'
  },
  {
    id: 'm3',
    sessionName: 'Buffet Lunch',
    serviceTiming: '01:30 PM - 02:30 PM',
    catererVendor: 'Annapurna Royal Caterers',
    vegCount: 60,
    nonVegCount: 85,
    jainCount: 5,
    totalPax: 150,
    costPerPlate: 250,
    menuHighlights: 'Rice, Dal, Katla Fish Kalia / Mutton Curry, Paneer Butter Masala, Salad, Mishti',
    status: 'In Preparation'
  },
  {
    id: 'm4',
    sessionName: 'Evening Hi-Tea',
    serviceTiming: '05:30 PM - 06:15 PM',
    catererVendor: 'Annapurna Royal Caterers',
    vegCount: 70,
    nonVegCount: 75,
    jainCount: 5,
    totalPax: 150,
    costPerPlate: 60,
    menuHighlights: 'Fish Finger / Paneer Pakoda, Masala Chai, Filter Coffee',
    status: 'Scheduled'
  },
  {
    id: 'm5',
    sessionName: 'Dinner',
    serviceTiming: '08:30 PM - 09:30 PM',
    catererVendor: 'Annapurna Royal Caterers',
    vegCount: 55,
    nonVegCount: 85,
    jainCount: 5,
    totalPax: 145,
    costPerPlate: 220,
    menuHighlights: 'Tandoori Roti, Chicken Chaap / Kadai Paneer, Yellow Dal Tadka, Ice Cream',
    status: 'Scheduled'
  }
];

export const ProductionFood: React.FC<ProductionFoodProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [meals, setMeals] = useState<MealSession[]>(DEFAULT_MEALS);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [sessionName, setSessionName] = useState<MealSession['sessionName']>('Midnight Pack');
  const [timing, setTiming] = useState('11:00 PM');
  const [caterer, setCaterer] = useState('Annapurna Royal Caterers');
  const [veg, setVeg] = useState(30);
  const [nonVeg, setNonVeg] = useState(40);
  const [jain, setJain] = useState(2);
  const [plateCost, setPlateCost] = useState(100);
  const [menu, setMenu] = useState('Egg Rolls & Veg Rolls, Hot Bournvita');

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ meals: MealSession[] }>('production_catering', projectId, (data) => {
      if (data && data.meals && data.meals.length > 0) {
        setMeals(data.meals);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: MealSession[]) => {
    setMeals(updated);
    saveDocData('production_catering', projectId, { meals: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(veg) + Number(nonVeg) + Number(jain);
    const newM: MealSession = {
      id: `meal_${Date.now()}`,
      sessionName,
      serviceTiming: timing,
      catererVendor: caterer,
      vegCount: Number(veg),
      nonVegCount: Number(nonVeg),
      jainCount: Number(jain),
      totalPax: total,
      costPerPlate: Number(plateCost),
      menuHighlights: menu,
      status: 'Scheduled'
    };

    const updated = [...meals, newM];
    handleSaveToFirebase(updated);
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: MealSession['status'][] = ['Scheduled', 'In Preparation', 'Served'];
    const updated = meals.map(m => {
      if (m.id === id) {
        const nextIdx = (statuses.indexOf(m.status) + 1) % statuses.length;
        return { ...m, status: statuses[nextIdx] };
      }
      return m;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    handleSaveToFirebase(updated);
  };

  const totalMealCost = meals.reduce((sum, m) => sum + (m.totalPax * m.costPerPlate), 0);
  const totalPaxServed = meals.reduce((sum, m) => sum + m.totalPax, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Daily Catering &amp; Meal Logistics</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {meals.length} Meal Sessions Planned
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track daily meal counts (Veg/Non-Veg/Jain), caterer timings &amp; catering budget disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Total Estimated Catering Day Budget</span>
            <span className="text-sm font-black text-emerald-400">₹{totalMealCost.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Meal Session</span>
          </button>
        </div>
      </div>

      {/* Add Meal Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Catering Meal Session
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Session Name</label>
              <select
                value={sessionName}
                onChange={e => setSessionName(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Morning Snacks & Tea">Morning Snacks &amp; Tea</option>
                <option value="Buffet Lunch">Buffet Lunch</option>
                <option value="Evening Hi-Tea">Evening Hi-Tea</option>
                <option value="Dinner">Dinner</option>
                <option value="Midnight Pack">Midnight Pack</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Service Timing</label>
              <input
                type="text"
                placeholder="e.g. 01:30 PM - 02:30 PM"
                value={timing}
                onChange={e => setTiming(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Caterer / Kitchen Vendor</label>
              <input
                type="text"
                value={caterer}
                onChange={e => setCaterer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Veg Headcount</label>
              <input
                type="number"
                value={veg}
                onChange={e => setVeg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Non-Veg Headcount</label>
              <input
                type="number"
                value={nonVeg}
                onChange={e => setNonVeg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Jain / Special Diet</label>
              <input
                type="number"
                value={jain}
                onChange={e => setJain(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Cost Per Plate (₹)</label>
              <input
                type="number"
                value={plateCost}
                onChange={e => setPlateCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Menu Items &amp; Highlights</label>
            <input
              type="text"
              placeholder="e.g. Rice, Dal, Fish Kalia, Paneer, Salad, Dessert"
              value={menu}
              onChange={e => setMenu(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
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
              Save Meal Session
            </button>
          </div>
        </form>
      )}

      {/* Meal Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {meals.map(m => (
          <div 
            key={m.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">{m.sessionName}</span>
                <button
                  onClick={() => handleToggleStatus(m.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    m.status === 'Served' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    m.status === 'In Preparation' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {m.status}
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{m.serviceTiming}</span>
              </div>

              {/* Headcounts Breakdown */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-2 rounded-xl text-center border border-slate-800 text-[11px] font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Veg</span>
                  <span className="font-bold text-emerald-400">{m.vegCount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Non-Veg</span>
                  <span className="font-bold text-rose-400">{m.nonVegCount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Jain</span>
                  <span className="font-bold text-amber-400">{m.jainCount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Total</span>
                  <span className="font-bold text-white">{m.totalPax}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 rounded-xl text-xs text-slate-300 border border-slate-800/80">
                <span className="text-[9px] font-mono uppercase text-slate-500 block">Menu:</span>
                <p className="mt-0.5 text-slate-200 line-clamp-2">{m.menuHighlights}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">
                ₹{m.costPerPlate}/plate • <strong className="text-emerald-400">₹{(m.totalPax * m.costPerPlate).toLocaleString('en-IN')}</strong>
              </span>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                title="Delete meal session"
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
