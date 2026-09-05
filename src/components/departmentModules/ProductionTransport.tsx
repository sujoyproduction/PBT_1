import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Fuel,
  Sparkles
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionTransportProps {
  project?: Project;
}

export interface TransportVehicle {
  id: string;
  vehicleNo: string;
  vehicleType: 'Talent Vanity Van' | 'Innova / SUV' | 'Equipment Truck (10 Ton)' | 'Camera Van' | 'Lighting Truck' | 'Crew Bus / Traveller' | 'Genset Van' | 'Production Spot Car';
  driverName: string;
  driverPhone: string;
  reportingTime: string;
  pickupLocation: string;
  destination: string;
  assignedTo: string;
  fuelTollExpense: number;
  status: 'Scheduled' | 'Dispatched' | 'On Set' | 'En Route' | 'Released';
}

const DEFAULT_VEHICLES: TransportVehicle[] = [
  {
    id: 'v1',
    vehicleNo: 'WB-02-AK-9812',
    vehicleType: 'Innova / SUV',
    driverName: 'Ramesh Das',
    driverPhone: '+91-98301-22334',
    reportingTime: '05:30 AM',
    pickupLocation: 'Hotel Taj Bengal (Alipore)',
    destination: 'Studio Floor 3 (Tollygunge)',
    assignedTo: 'Lead Anchor / Parambrata',
    fuelTollExpense: 1800,
    status: 'On Set'
  },
  {
    id: 'v2',
    vehicleNo: 'WB-19-M-4521',
    vehicleType: 'Talent Vanity Van',
    driverName: 'Mohan Lal',
    driverPhone: '+91-98310-77889',
    reportingTime: '05:00 AM',
    pickupLocation: 'North Garage Bay',
    destination: 'Gate 2 Vanity Parking Lot',
    assignedTo: 'Judge #1 & Host Vanity #1',
    fuelTollExpense: 3500,
    status: 'On Set'
  },
  {
    id: 'v3',
    vehicleNo: 'WB-24-C-8871',
    vehicleType: 'Equipment Truck (10 Ton)',
    driverName: 'Harish Yadav',
    driverPhone: '+91-98741-99881',
    reportingTime: '04:30 AM',
    pickupLocation: 'Camera Rental Warehouse',
    destination: 'Studio Floor 3 Loading Bay',
    assignedTo: 'Camera & Jib Rigs',
    fuelTollExpense: 2400,
    status: 'On Set'
  },
  {
    id: 'v4',
    vehicleNo: 'WB-01-T-3342',
    vehicleType: 'Crew Bus / Traveller',
    driverName: 'Bikram Mondal',
    driverPhone: '+91-98308-55441',
    reportingTime: '05:45 AM',
    pickupLocation: 'Howrah Station & Sealdah',
    destination: 'Studio Main Gate',
    assignedTo: 'Camera & Lighting Assistants (18 Crew)',
    fuelTollExpense: 2200,
    status: 'Released'
  },
  {
    id: 'v5',
    vehicleNo: 'WB-02-E-1002',
    vehicleType: 'Lighting Truck',
    driverName: 'Pintoo Mondal',
    driverPhone: '+91-98319-33221',
    reportingTime: '04:30 AM',
    pickupLocation: 'Grip & Cine Light Godown',
    destination: 'Studio Floor 3 Perimeter',
    assignedTo: 'Jagdish Light Package',
    fuelTollExpense: 2800,
    status: 'On Set'
  }
];

export const ProductionTransport: React.FC<ProductionTransportProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [vehicles, setVehicles] = useState<TransportVehicle[]>(DEFAULT_VEHICLES);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState<TransportVehicle['vehicleType']>('Innova / SUV');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [reportingTime, setReportingTime] = useState('06:00 AM');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('Studio Floor 3');
  const [assignedTo, setAssignedTo] = useState('');
  const [fuelToll, setFuelToll] = useState(1500);

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ vehicles: TransportVehicle[] }>('production_transports', projectId, (data) => {
      if (data && data.vehicles && data.vehicles.length > 0) {
        setVehicles(data.vehicles);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: TransportVehicle[]) => {
    setVehicles(updated);
    saveDocData('production_transports', projectId, { vehicles: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) return;

    const newV: TransportVehicle = {
      id: `v_${Date.now()}`,
      vehicleNo,
      vehicleType,
      driverName: driverName || 'Driver',
      driverPhone: driverPhone || '+91-',
      reportingTime,
      pickupLocation: pickup || 'City Location',
      destination: destination || 'Studio Set',
      assignedTo: assignedTo || 'Production Fleet',
      fuelTollExpense: Number(fuelToll) || 0,
      status: 'Scheduled'
    };

    const updated = [...vehicles, newV];
    handleSaveToFirebase(updated);

    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setPickup('');
    setAssignedTo('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: TransportVehicle['status'][] = ['Scheduled', 'Dispatched', 'En Route', 'On Set', 'Released'];
    const updated = vehicles.map(v => {
      if (v.id === id) {
        const nextIdx = (statuses.indexOf(v.status) + 1) % statuses.length;
        return { ...v, status: statuses[nextIdx] };
      }
      return v;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    handleSaveToFirebase(updated);
  };

  const totalFuelToll = vehicles.reduce((sum, v) => sum + (Number(v.fuelTollExpense) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Production Transport Fleet &amp; Vehicle Movement</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {vehicles.length} Vehicles Deployed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Talent pickup/drop, heavy equipment trucks, driver contacts &amp; fuel/toll logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Total Fuel / Toll Disbursed</span>
            <span className="text-sm font-black text-emerald-400">₹{totalFuelToll.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Vehicle</span>
          </button>
        </div>
      </div>

      {/* Add Vehicle Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Vehicle Assignment &amp; Movement
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Vehicle Registration #</label>
              <input
                type="text"
                placeholder="e.g. WB-02-AB-1234"
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Innova / SUV">Innova / SUV</option>
                <option value="Talent Vanity Van">Talent Vanity Van</option>
                <option value="Equipment Truck (10 Ton)">Equipment Truck (10 Ton)</option>
                <option value="Camera Van">Camera Van</option>
                <option value="Lighting Truck">Lighting Truck</option>
                <option value="Crew Bus / Traveller">Crew Bus / Traveller</option>
                <option value="Genset Van">Genset Van</option>
                <option value="Production Spot Car">Production Spot Car</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Guest / Dept</label>
              <input
                type="text"
                placeholder="e.g. Lead Host, Camera Crew"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="Driver full name"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Driver Phone</label>
              <input
                type="text"
                placeholder="+91-98765-43210"
                value={driverPhone}
                onChange={e => setDriverPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Reporting Time</label>
              <input
                type="text"
                value={reportingTime}
                onChange={e => setReportingTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Fuel / Toll Advance (₹)</label>
              <input
                type="number"
                value={fuelToll}
                onChange={e => setFuelToll(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Pickup Location</label>
              <input
                type="text"
                placeholder="e.g. Hotel Taj Bengal / Airport"
                value={pickup}
                onChange={e => setPickup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
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
              Save Assignment
            </button>
          </div>
        </form>
      )}

      {/* Fleet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Vehicle #</th>
                <th className="px-3 py-2.5">Type &amp; Purpose</th>
                <th className="px-3 py-2.5">Driver &amp; Mobile</th>
                <th className="px-3 py-2.5">Reporting Time</th>
                <th className="px-3 py-2.5">Route / Pick-Drop</th>
                <th className="px-3 py-2.5 text-right">Fuel/Toll</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vehicles.map(v => (
                <tr 
                  key={v.id}
                  onClick={() => handleToggleStatus(v.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3 font-mono font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{v.vehicleNo}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-slate-200 block">{v.vehicleType}</span>
                    <span className="text-[10px] text-slate-400">Assigned: {v.assignedTo}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-semibold text-white block">{v.driverName}</span>
                    <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />
                      {v.driverPhone}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-amber-300 font-bold">{v.reportingTime}</td>
                  <td className="px-3 py-3 text-slate-300">
                    <div className="text-[11px] truncate max-w-[170px]">{v.pickupLocation}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[170px]">→ {v.destination}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                    ₹{v.fuelTollExpense.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      v.status === 'On Set' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      v.status === 'En Route' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      v.status === 'Dispatched' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      v.status === 'Released' ? 'bg-slate-800 text-slate-400' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete assignment"
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
