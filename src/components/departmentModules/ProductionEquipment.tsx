import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Building2, 
  Sparkles,
  Zap,
  Mic,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionEquipmentProps {
  project?: Project;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Camera Body' | 'Lenses & Optics' | 'Lighting Package' | 'Sound / Audio Gear' | 'Grip & Crane' | 'DIT / Monitors / Wireless Video' | 'Special FX / Drone';
  vendor: string;
  serialNo: string;
  dailyRate: number;
  assignedUnit: string;
  status: 'In Use / On Set' | 'Standby / Storage' | 'Maintenance / Repair' | 'Returned to Vendor';
  dispatchedDate: string;
  returnDueDate: string;
  notes: string;
}

const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq_1',
    name: 'ARRI Alexa Mini LF Large Format Cinema Camera Body',
    category: 'Camera Body',
    vendor: 'One Stop Cine Rentals (Tollygunge)',
    serialNo: 'ALX-LF-84920',
    dailyRate: 35000,
    assignedUnit: 'Main Unit (A-Cam)',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-15',
    returnDueDate: '2025-03-05',
    notes: 'Includes Cage, Gold-mount batteries & CODEX Compact drives'
  },
  {
    id: 'eq_2',
    name: 'ARRI Alexa Mini S35 Camera Body (B-Cam)',
    category: 'Camera Body',
    vendor: 'One Stop Cine Rentals (Tollygunge)',
    serialNo: 'ALX-M-34190',
    dailyRate: 25000,
    assignedUnit: 'Main Unit (B-Cam)',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-15',
    returnDueDate: '2025-03-05',
    notes: 'Secondary angle and tight close-up camera'
  },
  {
    id: 'eq_3',
    name: 'Cooke Anamorphic /i Full Frame Prime Lens Set (5-Lens Set)',
    category: 'Lenses & Optics',
    vendor: 'CineLenses Prime Studio',
    serialNo: 'CK-AN-9920',
    dailyRate: 28000,
    assignedUnit: 'Main Unit (A-Cam)',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-16',
    returnDueDate: '2025-03-05',
    notes: '25mm, 32mm, 50mm, 75mm, 100mm T2.3 PL-mount'
  },
  {
    id: 'eq_4',
    name: 'ARRI SkyPanel S60-C LED Softlight (x4 Kit) + Chimeras',
    category: 'Lighting Package',
    vendor: 'LightCraft Grip & Electrics',
    serialNo: 'SKY-S60-0412',
    dailyRate: 16000,
    assignedUnit: 'Main Unit Lighting Grid',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-15',
    returnDueDate: '2025-03-05',
    notes: 'Full RGBW DMX controlled lighting package'
  },
  {
    id: 'eq_5',
    name: 'Sound Devices 833 8-Channel Field Mixer / Recorder + Lectrosonics Wireless',
    category: 'Sound / Audio Gear',
    vendor: 'Acoustic Labs Pro Audio',
    serialNo: 'SD-833-2810',
    dailyRate: 12000,
    assignedUnit: 'Sound Dept',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-15',
    returnDueDate: '2025-03-05',
    notes: '4x Cos-11 lavalier mics, 2x Schoeps CMIT5U boom mics'
  },
  {
    id: 'eq_6',
    name: 'Teradek Bolt 4K MAX Wireless Video Transmission Kit (1 TX / 2 RX)',
    category: 'DIT / Monitors / Wireless Video',
    vendor: 'One Stop Cine Rentals (Tollygunge)',
    serialNo: 'TDK-4K-9182',
    dailyRate: 9000,
    assignedUnit: 'Director / DIT Video Village',
    status: 'In Use / On Set',
    dispatchedDate: '2025-02-15',
    returnDueDate: '2025-03-05',
    notes: 'Zero latency feed to Director SmallHD 1703 monitor'
  },
  {
    id: 'eq_7',
    name: 'GF-8 Modular Crane / Jib with Remote 2-Axis Head',
    category: 'Grip & Crane',
    vendor: 'Precision Grips Kolkata',
    serialNo: 'GF-CRN-5521',
    dailyRate: 22000,
    assignedUnit: 'Main Unit Grip Dept',
    status: 'Standby / Storage',
    dispatchedDate: '2025-02-18',
    returnDueDate: '2025-02-28',
    notes: 'Reserved for Day 14 outdoor chase sequence'
  }
];

export const ProductionEquipment: React.FC<ProductionEquipmentProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const docKey = `production_equipment_${projectId}`;

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(DEFAULT_EQUIPMENT);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Equipment Form State
  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentItem>>({
    name: '',
    category: 'Camera Body',
    vendor: '',
    serialNo: '',
    dailyRate: 0,
    assignedUnit: 'Main Unit',
    status: 'In Use / On Set',
    dispatchedDate: new Date().toISOString().substring(0, 10),
    returnDueDate: '',
    notes: ''
  });

  // Subscribe to Firestore for real-time sync
  useEffect(() => {
    const unsub = subscribeDoc('production_controls', docKey, (data: any) => {
      if (data && Array.isArray(data.equipmentList) && data.equipmentList.length > 0) {
        setEquipmentList(data.equipmentList);
      }
    });
    return () => unsub();
  }, [docKey]);

  const handleSaveToFirestore = async (updatedList: EquipmentItem[]) => {
    setIsSaving(true);
    try {
      await saveDocData('production_controls', docKey, {
        equipmentList: updatedList,
        updatedAt: new Date().toISOString(),
        projectId
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save equipment data to Firestore:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipment.name || !newEquipment.vendor) return;

    const item: EquipmentItem = {
      id: `eq_${Date.now()}`,
      name: newEquipment.name || 'Equipment Gear',
      category: (newEquipment.category as any) || 'Camera Body',
      vendor: newEquipment.vendor || 'Rental Agency',
      serialNo: newEquipment.serialNo || `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      dailyRate: Number(newEquipment.dailyRate) || 0,
      assignedUnit: newEquipment.assignedUnit || 'Main Unit',
      status: (newEquipment.status as any) || 'In Use / On Set',
      dispatchedDate: newEquipment.dispatchedDate || new Date().toISOString().substring(0, 10),
      returnDueDate: newEquipment.returnDueDate || '',
      notes: newEquipment.notes || ''
    };

    const updated = [item, ...equipmentList];
    setEquipmentList(updated);
    handleSaveToFirestore(updated);
    setShowAddModal(false);
    setNewEquipment({
      name: '',
      category: 'Camera Body',
      vendor: '',
      serialNo: '',
      dailyRate: 0,
      assignedUnit: 'Main Unit',
      status: 'In Use / On Set',
      dispatchedDate: new Date().toISOString().substring(0, 10),
      returnDueDate: '',
      notes: ''
    });
  };

  const handleDeleteEquipment = (id: string) => {
    if (!confirm('Are you sure you want to remove this equipment item from the log?')) return;
    const updated = equipmentList.filter(eq => eq.id !== id);
    setEquipmentList(updated);
    handleSaveToFirestore(updated);
  };

  const handleStatusChange = (id: string, newStatus: EquipmentItem['status']) => {
    const updated = equipmentList.map(eq => eq.id === id ? { ...eq, status: newStatus } : eq);
    setEquipmentList(updated);
    handleSaveToFirestore(updated);
  };

  // Filtered Items
  const filteredItems = equipmentList.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedUnit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Analytics
  const totalDailyRent = equipmentList.reduce((sum, item) => sum + (item.dailyRate || 0), 0);
  const onSetCount = equipmentList.filter(item => item.status === 'In Use / On Set').length;
  const standbyCount = equipmentList.filter(item => item.status === 'Standby / Storage').length;

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100 animate-in fade-in duration-200">
      
      {/* Top Banner & KPI Bar */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-900/60">
              Camera & Technical Logistics
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {project?.name || 'All Units'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            EQUIPMENT USAGE & CAMERA PACKAGE DISPATCH
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time optical inventory, lighting packages, sound recorders, vendor rentals & on-set dispatch tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved to Database</span>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-950/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Units Logged</span>
            <Camera className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base md:text-lg font-black text-white font-mono">
            {equipmentList.length} Packages
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Active Cinema Gear
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>On Set / In Use</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base md:text-lg font-black text-emerald-400 font-mono">
            {onSetCount} Dispatched
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Active Shooting Floor
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Standby / Storage</span>
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base md:text-lg font-black text-amber-300 font-mono">
            {standbyCount} In Van
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Basecamp / Backup
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Daily Rental</span>
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-base md:text-lg font-black text-purple-300 font-mono">
            ₹{totalDailyRent.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Per Shift Expense
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Controls */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gear by name, vendor, serial number, unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 px-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Camera Body">Camera Body</option>
            <option value="Lenses & Optics">Lenses & Optics</option>
            <option value="Lighting Package">Lighting Package</option>
            <option value="Sound / Audio Gear">Sound / Audio Gear</option>
            <option value="Grip & Crane">Grip & Crane</option>
            <option value="DIT / Monitors / Wireless Video">DIT / Monitors</option>
            <option value="Special FX / Drone">Special FX / Drone</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 px-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Use / On Set">In Use / On Set</option>
            <option value="Standby / Storage">Standby / Storage</option>
            <option value="Maintenance / Repair">Maintenance</option>
            <option value="Returned to Vendor">Returned</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Equipment Item & Serial</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Vendor / Supplier</th>
                <th className="py-2.5 px-3">Assigned Unit</th>
                <th className="py-2.5 px-3 text-right">Daily Rate</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Due Return</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Video className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-sm text-slate-300">No equipment items found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or click "Add Equipment" to register new gear.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white text-xs">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>SN: {item.serialNo}</span>
                        {item.notes && <span className="text-slate-500">• {item.notes}</span>}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{item.vendor}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      {item.assignedUnit}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ₹{item.dailyRate.toLocaleString('en-IN')}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${
                          item.status === 'In Use / On Set'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : item.status === 'Standby / Storage'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : item.status === 'Maintenance / Repair'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="In Use / On Set">In Use / On Set</option>
                        <option value="Standby / Storage">Standby / Storage</option>
                        <option value="Maintenance / Repair">Maintenance</option>
                        <option value="Returned to Vendor">Returned</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                      {item.returnDueDate || 'Until Wrap'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteEquipment(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete equipment item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Equipment Package</h3>
                  <p className="text-xs text-slate-400">Register optics, cameras, lighting or sound kits for dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARRI Alexa 35 Camera Package"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Category</label>
                  <select
                    value={newEquipment.category}
                    onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Camera Body">Camera Body</option>
                    <option value="Lenses & Optics">Lenses & Optics</option>
                    <option value="Lighting Package">Lighting Package</option>
                    <option value="Sound / Audio Gear">Sound / Audio Gear</option>
                    <option value="Grip & Crane">Grip & Crane</option>
                    <option value="DIT / Monitors / Wireless Video">DIT / Monitors</option>
                    <option value="Special FX / Drone">Special FX / Drone</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Rental Vendor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CineRentals Pro"
                    value={newEquipment.vendor}
                    onChange={(e) => setNewEquipment({ ...newEquipment, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-883910"
                    value={newEquipment.serialNo}
                    onChange={(e) => setNewEquipment({ ...newEquipment, serialNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Daily Rental (₹)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={newEquipment.dailyRate || ''}
                    onChange={(e) => setNewEquipment({ ...newEquipment, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Assigned Unit</label>
                  <input
                    type="text"
                    placeholder="Main Unit / A-Cam"
                    value={newEquipment.assignedUnit}
                    onChange={(e) => setNewEquipment({ ...newEquipment, assignedUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={newEquipment.dispatchedDate}
                    onChange={(e) => setNewEquipment({ ...newEquipment, dispatchedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Due Return Date</label>
                  <input
                    type="date"
                    value={newEquipment.returnDueDate}
                    onChange={(e) => setNewEquipment({ ...newEquipment, returnDueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Notes & Accessories</label>
                <input
                  type="text"
                  placeholder="Batteries, cases, mounting plates..."
                  value={newEquipment.notes}
                  onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-950/40"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionEquipment;
