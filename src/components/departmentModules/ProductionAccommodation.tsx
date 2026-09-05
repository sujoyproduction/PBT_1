import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Calendar, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionAccommodationProps {
  project?: Project;
}

export interface RoomBooking {
  id: string;
  hotelName: string;
  roomNo: string;
  roomType: 'Deluxe Single' | 'Twin Sharing' | 'Executive Suite' | 'Standard Room' | 'Dormitory';
  guestName: string;
  department: string;
  checkInDate: string;
  checkOutDate: string;
  tariffPerNight: number;
  status: 'Occupied' | 'Reserved' | 'Checked Out';
  notes?: string;
}

const DEFAULT_ROOMS: RoomBooking[] = [
  {
    id: 'r1',
    hotelName: 'Taj Bengal Kolkata',
    roomNo: 'Suite 402',
    roomType: 'Executive Suite',
    guestName: 'Parambrata Chatterjee (Host)',
    department: 'Talent & Cast',
    checkInDate: '2026-08-18',
    checkOutDate: '2026-08-28',
    tariffPerNight: 12500,
    status: 'Occupied',
    notes: 'Breakfast included, late check-out requested'
  },
  {
    id: 'r2',
    hotelName: 'Taj Bengal Kolkata',
    roomNo: 'Suite 405',
    roomType: 'Executive Suite',
    guestName: 'Chef Sanjeev (Master Judge)',
    department: 'Talent & Cast',
    checkInDate: '2026-08-20',
    checkOutDate: '2026-08-26',
    tariffPerNight: 12500,
    status: 'Occupied'
  },
  {
    id: 'r3',
    hotelName: 'The Peerless Inn (Chowringhee)',
    roomNo: 'Deluxe 204',
    roomType: 'Deluxe Single',
    guestName: 'Ravi Varman, ISC (DoP)',
    department: 'Camera Dept',
    checkInDate: '2026-08-19',
    checkOutDate: '2026-08-27',
    tariffPerNight: 5500,
    status: 'Occupied'
  },
  {
    id: 'r4',
    hotelName: 'The Peerless Inn (Chowringhee)',
    roomNo: 'Twin 308',
    roomType: 'Twin Sharing',
    guestName: 'Camera Assts (Rohan + Tanmoy)',
    department: 'Camera Dept',
    checkInDate: '2026-08-19',
    checkOutDate: '2026-08-27',
    tariffPerNight: 4200,
    status: 'Occupied'
  },
  {
    id: 'r5',
    hotelName: 'Hotel Park Prime',
    roomNo: 'Twin 102',
    roomType: 'Twin Sharing',
    guestName: 'Sound Engineers (Babul + Joy)',
    department: 'Sound Dept',
    checkInDate: '2026-08-20',
    checkOutDate: '2026-08-26',
    tariffPerNight: 3800,
    status: 'Occupied'
  }
];

export const ProductionAccommodation: React.FC<ProductionAccommodationProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [rooms, setRooms] = useState<RoomBooking[]>(DEFAULT_ROOMS);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [hotelName, setHotelName] = useState('Taj Bengal Kolkata');
  const [roomNo, setRoomNo] = useState('');
  const [roomType, setRoomType] = useState<RoomBooking['roomType']>('Deluxe Single');
  const [guestName, setGuestName] = useState('');
  const [department, setDepartment] = useState('Talent & Cast');
  const [checkIn, setCheckIn] = useState(new Date().toISOString().substring(0, 10));
  const [checkOut, setCheckOut] = useState(new Date().toISOString().substring(0, 10));
  const [tariff, setTariff] = useState(4500);

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ rooms: RoomBooking[] }>('production_accommodations', projectId, (data) => {
      if (data && data.rooms && data.rooms.length > 0) {
        setRooms(data.rooms);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: RoomBooking[]) => {
    setRooms(updated);
    saveDocData('production_accommodations', projectId, { rooms: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newR: RoomBooking = {
      id: `r_${Date.now()}`,
      hotelName,
      roomNo: roomNo || 'TBD',
      roomType,
      guestName,
      department,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      tariffPerNight: Number(tariff) || 0,
      status: 'Occupied'
    };

    const updated = [...rooms, newR];
    handleSaveToFirebase(updated);

    setRoomNo('');
    setGuestName('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: RoomBooking['status'][] = ['Occupied', 'Reserved', 'Checked Out'];
    const updated = rooms.map(r => {
      if (r.id === id) {
        const nextIdx = (statuses.indexOf(r.status) + 1) % statuses.length;
        return { ...r, status: statuses[nextIdx] };
      }
      return r;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = rooms.filter(r => r.id !== id);
    handleSaveToFirebase(updated);
  };

  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const totalTariffDay = rooms.filter(r => r.status === 'Occupied').reduce((sum, r) => sum + (Number(r.tariffPerNight) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Cast &amp; Crew Accommodation Allocations</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              {occupiedRooms} / {rooms.length} Rooms Occupied
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hotel bookings, room tariffs, check-in/out dates &amp; occupant management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Daily Accommodation Burn</span>
            <span className="text-sm font-black text-emerald-400">₹{totalTariffDay.toLocaleString('en-IN')} / night</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Book Room</span>
          </button>
        </div>
      </div>

      {/* Add Room Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Room Allocation
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Hotel / Guest House</label>
              <input
                type="text"
                value={hotelName}
                onChange={e => setHotelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Room #</label>
              <input
                type="text"
                placeholder="e.g. Suite 402 / Deluxe 201"
                value={roomNo}
                onChange={e => setRoomNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={e => setRoomType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Executive Suite">Executive Suite</option>
                <option value="Deluxe Single">Deluxe Single</option>
                <option value="Twin Sharing">Twin Sharing</option>
                <option value="Standard Room">Standard Room</option>
                <option value="Dormitory">Dormitory</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Guest / Crew Name</label>
              <input
                type="text"
                placeholder="Full guest name"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Direction, Camera, Talent"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Check-In Date</label>
              <input
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Tariff / Night (₹)</label>
              <input
                type="number"
                value={tariff}
                onChange={e => setTariff(Number(e.target.value))}
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
              Confirm Booking
            </button>
          </div>
        </form>
      )}

      {/* Rooms Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Hotel &amp; Room #</th>
                <th className="px-3 py-2.5">Room Category</th>
                <th className="px-3 py-2.5">Occupant / Guest</th>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">Stay Dates</th>
                <th className="px-3 py-2.5 text-right">Tariff / Nt</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rooms.map(r => (
                <tr 
                  key={r.id}
                  onClick={() => handleToggleStatus(r.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3">
                    <span className="font-bold text-white block">{r.roomNo}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-500" />
                      {r.hotelName}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-slate-300">{r.roomType}</td>
                  <td className="px-3 py-3 font-semibold text-white">
                    {r.guestName}
                    {r.notes && <span className="text-[10px] text-slate-400 block font-normal italic">{r.notes}</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-400">{r.department}</td>
                  <td className="px-3 py-3 font-mono text-[10px] text-slate-300">
                    {r.checkInDate} → {r.checkOutDate}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                    ₹{r.tariffPerNight.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      r.status === 'Occupied' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      r.status === 'Reserved' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete room"
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
