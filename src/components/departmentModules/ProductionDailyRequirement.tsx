import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionDailyRequirementProps {
  project?: Project;
}

export interface DailyRequirementItem {
  id: string;
  department: string;
  itemDescription: string;
  quantity: string;
  priority: 'CRITICAL (Show Stopper)' | 'High' | 'Medium' | 'Low';
  requestedBy: string;
  requiredByTime: string;
  estimatedCost: number;
  status: 'Requested' | 'Approved' | 'Procured / On Way' | 'Delivered On Set';
}

const DEFAULT_REQUIREMENTS: DailyRequirementItem[] = [
  {
    id: 'req_1',
    department: 'Art & Setting',
    itemDescription: '12x Fresh Hilsa Fish (Ilish 1.2kg each) + 20x Fresh Banana Leaves for plating',
    quantity: '12 pcs + 20 leaves',
    priority: 'CRITICAL (Show Stopper)',
    requestedBy: 'Food Stylist Rahul',
    requiredByTime: '08:30 AM',
    estimatedCost: 18500,
    status: 'Delivered On Set'
  },
  {
    id: 'req_2',
    department: 'Camera & Grip',
    itemDescription: 'High-speed 128GB CFexpress Type B Cards (3 Nos) + 98Wh V-Mount Batteries (4 Nos)',
    quantity: '3 cards + 4 batts',
    priority: 'High',
    requestedBy: 'DIT Lead Tanmay',
    requiredByTime: '10:00 AM',
    estimatedCost: 8000,
    status: 'Delivered On Set'
  },
  {
    id: 'req_3',
    department: 'Special Effects (SFX)',
    itemDescription: 'CO2 Cryo Jet Gas Cylinders for Winner Announcement Smoke Blast',
    quantity: '4 Cylinders',
    priority: 'High',
    requestedBy: 'SFX Supervisor Bappaditya',
    requiredByTime: '03:00 PM',
    estimatedCost: 14000,
    status: 'Procured / On Way'
  },
  {
    id: 'req_4',
    department: 'Costume & Wardrobe',
    itemDescription: 'Emergency Handheld Garment Steamer + Replacement Chef Badges (Gold Embossed)',
    quantity: '1 Steamer + 4 Badges',
    priority: 'Medium',
    requestedBy: 'Wardrobe Lead Tina',
    requiredByTime: '11:00 AM',
    estimatedCost: 3500,
    status: 'Delivered On Set'
  }
];

export const ProductionDailyRequirement: React.FC<ProductionDailyRequirementProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [items, setItems] = useState<DailyRequirementItem[]>(DEFAULT_REQUIREMENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [dept, setDept] = useState('Art & Setting');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [priority, setPriority] = useState<DailyRequirementItem['priority']>('High');
  const [requestedBy, setRequestedBy] = useState('');
  const [requiredBy, setRequiredBy] = useState('10:00 AM');
  const [cost, setCost] = useState(2500);

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ items: DailyRequirementItem[] }>('production_requirements', projectId, (data) => {
      if (data && data.items && data.items.length > 0) {
        setItems(data.items);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: DailyRequirementItem[]) => {
    setItems(updated);
    saveDocData('production_requirements', projectId, { items: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    const newItem: DailyRequirementItem = {
      id: `req_${Date.now()}`,
      department: dept,
      itemDescription: desc,
      quantity: qty,
      priority,
      requestedBy: requestedBy || 'Department In-Charge',
      requiredByTime: requiredBy,
      estimatedCost: Number(cost) || 0,
      status: 'Requested'
    };

    const updated = [...items, newItem];
    handleSaveToFirebase(updated);

    setDesc('');
    setQty('1');
    setRequestedBy('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: DailyRequirementItem['status'][] = ['Requested', 'Approved', 'Procured / On Way', 'Delivered On Set'];
    const updated = items.map(it => {
      if (it.id === id) {
        const nextIdx = (statuses.indexOf(it.status) + 1) % statuses.length;
        return { ...it, status: statuses[nextIdx] };
      }
      return it;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(it => it.id !== id);
    handleSaveToFirebase(updated);
  };

  const deliveredCount = items.filter(i => i.status === 'Delivered On Set').length;
  const totalCost = items.reduce((sum, i) => sum + (Number(i.estimatedCost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Daily Department Equipment &amp; Material Requisitions</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {deliveredCount} / {items.length} Delivered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Urgent daily indents for Art props, SFX, extra cameras, wardrobe &amp; emergency supplies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Total Requisition Estimate</span>
            <span className="text-sm font-black text-emerald-400">₹{totalCost.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Requisition</span>
          </button>
        </div>
      </div>

      {/* Add Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Raise New Daily Material / Equipment Request
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Department</label>
              <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Art & Setting">Art &amp; Setting</option>
                <option value="Camera & Grip">Camera &amp; Grip</option>
                <option value="Lighting & Rigging">Lighting &amp; Rigging</option>
                <option value="Special Effects (SFX)">Special Effects (SFX)</option>
                <option value="Costume & Wardrobe">Costume &amp; Wardrobe</option>
                <option value="Makeup & Hair">Makeup &amp; Hair</option>
                <option value="Sound & Audio">Sound &amp; Audio</option>
                <option value="Production Logistics">Production Logistics</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="CRITICAL (Show Stopper)">CRITICAL (Show Stopper)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Quantity / Unit</label>
              <input
                type="text"
                placeholder="e.g. 4 nos / 10 kg"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Item Description &amp; Specific Specifications</label>
            <input
              type="text"
              placeholder="e.g. 2x Sony Tough 128GB SD cards, 1x Red diffuser sheet"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Requested By</label>
              <input
                type="text"
                placeholder="Crew member name"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Required On Set By</label>
              <input
                type="text"
                placeholder="e.g. 11:30 AM"
                value={requiredBy}
                onChange={e => setRequiredBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
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
              Submit Requisition
            </button>
          </div>
        </form>
      )}

      {/* Requisition Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">Required Items &amp; Specs</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Req. By / Time</th>
                <th className="px-3 py-2.5 text-right">Est. Cost</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map(it => (
                <tr 
                  key={it.id}
                  onClick={() => handleToggleStatus(it.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3 font-mono font-bold text-white">{it.department}</td>
                  <td className="px-3 py-3 text-slate-200 font-semibold max-w-xs">{it.itemDescription}</td>
                  <td className="px-3 py-3 font-mono text-cyan-300">{it.quantity}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      it.priority.includes('CRITICAL') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      it.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {it.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[11px] text-white">{it.requestedBy}</div>
                    <div className="text-[10px] text-amber-400 font-mono">By: {it.requiredByTime}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                    ₹{it.estimatedCost.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      it.status === 'Delivered On Set' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      it.status === 'Procured / On Way' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      it.status === 'Approved' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete item"
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
