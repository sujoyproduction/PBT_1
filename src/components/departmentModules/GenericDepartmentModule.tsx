import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Clock, 
  Users, 
  FileText,
  Search
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface GenericDepartmentModuleProps {
  project?: Project;
  workspaceName: string;
  tabId: string;
  tabLabel: string;
}

export interface GenericItem {
  id: string;
  title: string;
  category: string;
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Approved';
  targetDate: string;
  notes: string;
}

export const GenericDepartmentModule: React.FC<GenericDepartmentModuleProps> = ({ 
  project, 
  workspaceName, 
  tabId, 
  tabLabel 
}) => {
  const projectId = project?.id || 'proj_default';
  const docKey = `dept_${tabId}_${projectId}`;
  
  const [items, setItems] = useState<GenericItem[]>([
    {
      id: 'gen_1',
      title: `${tabLabel} - Primary Task 1`,
      category: 'Operations',
      assignedTo: 'Lead Coordinator',
      priority: 'High',
      status: 'In Progress',
      targetDate: new Date().toISOString().substring(0, 10),
      notes: `Standard operational protocol for ${tabLabel}`
    },
    {
      id: 'gen_2',
      title: `${tabLabel} - Quality Checklist & Review`,
      category: 'Compliance',
      assignedTo: 'Department Lead',
      priority: 'Medium',
      status: 'Pending',
      targetDate: new Date().toISOString().substring(0, 10),
      notes: 'Ensure all equipment and deliverables meet broadcast standards'
    }
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operations');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<GenericItem['priority']>('High');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const unsub = subscribeDoc<{ items: GenericItem[] }>('department_generic_modules', docKey, (data) => {
      if (data && data.items && data.items.length > 0) {
        setItems(data.items);
      }
    });
    return () => unsub();
  }, [docKey]);

  const handleSaveToFirebase = (updated: GenericItem[]) => {
    setItems(updated);
    saveDocData('department_generic_modules', docKey, { items: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: GenericItem = {
      id: `item_${Date.now()}`,
      title,
      category,
      assignedTo: assignedTo || 'Department Team',
      priority,
      status: 'Pending',
      targetDate,
      notes
    };

    const updated = [...items, newItem];
    handleSaveToFirebase(updated);

    setTitle('');
    setNotes('');
    setAssignedTo('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: GenericItem['status'][] = ['Pending', 'In Progress', 'Completed', 'Approved'];
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

  const completedCount = items.filter(i => i.status === 'Completed' || i.status === 'Approved').length;
  const filtered = items.filter(i => 
    !search || 
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.assignedTo.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">{workspaceName} • {tabLabel}</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {completedCount} / {items.length} Tasks Complete
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active workspace module for {tabLabel}. Manage logs, deliverables, assignments &amp; review approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add {tabLabel} Item</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Item for {tabLabel}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Item Title / Action</label>
              <input
                type="text"
                placeholder={`e.g. Schedule check for ${tabLabel}`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Person / Vendor</label>
              <input
                type="text"
                placeholder="Name"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Remarks &amp; Technical Notes</label>
            <input
              type="text"
              placeholder="Provide specifications, checklist points or instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
              Save Item
            </button>
          </div>
        </form>
      )}

      {/* Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Item / Task Title</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Assigned To</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Target Date</th>
                <th className="px-3 py-2.5">Remarks</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(it => (
                <tr 
                  key={it.id}
                  onClick={() => handleToggleStatus(it.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3 font-bold text-white max-w-xs">{it.title}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-slate-400">{it.category}</td>
                  <td className="px-3 py-3 text-slate-300">{it.assignedTo}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      it.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      it.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {it.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-400 text-[11px]">{it.targetDate}</td>
                  <td className="px-3 py-3 text-[11px] text-slate-400 max-w-xs truncate">{it.notes}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      it.status === 'Completed' || it.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      it.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
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
