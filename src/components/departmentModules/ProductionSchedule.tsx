import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Film, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Save, 
  Download, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionScheduleProps {
  project?: Project;
}

export interface ScheduleDay {
  id: string;
  dayNo: number;
  date: string;
  unit: string;
  scenes: string;
  setting: string; // INT / EXT
  dayNight: string; // DAY / NIGHT
  location: string;
  cast: string;
  pageCount: string;
  estHours: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Postponed' | 'Cancelled';
  notes?: string;
}

const DEFAULT_SCHEDULE: ScheduleDay[] = [
  {
    id: 'sch_1',
    dayNo: 1,
    date: '2026-08-20',
    unit: 'Main Unit',
    scenes: 'SC-01, SC-02, SC-04',
    setting: 'INT',
    dayNight: 'DAY',
    location: 'Studio Floor 1 - Audition Hall',
    cast: 'Host, Judges, Contestants 1-10',
    pageCount: '4.5 pgs',
    estHours: 11,
    status: 'Completed',
    notes: 'Flawless shoot. All 3 scenes wrapped 30 mins ahead.'
  },
  {
    id: 'sch_2',
    dayNo: 2,
    date: '2026-08-21',
    unit: 'Main Unit',
    scenes: 'SC-05, SC-06, SC-08',
    setting: 'INT',
    dayNight: 'DAY',
    location: 'Studio Floor 1 - Master Cooking Arena',
    cast: 'Host, Top 12 Contestants',
    pageCount: '5.0 pgs',
    estHours: 12,
    status: 'Completed',
    notes: 'Completed with 1 overtime hour for live cook-off challenge.'
  },
  {
    id: 'sch_3',
    dayNo: 3,
    date: '2026-08-22',
    unit: 'Main Unit',
    scenes: 'SC-10, SC-11',
    setting: 'INT / EXT',
    dayNight: 'NIGHT',
    location: 'Outdoor Courtyard & Campfire Set',
    cast: 'Host, Celebrity Guests, All Cast',
    pageCount: '3.8 pgs',
    estHours: 10,
    status: 'Completed',
    notes: 'Night shift completed at 04:30 AM.'
  },
  {
    id: 'sch_4',
    dayNo: 4,
    date: '2026-08-23',
    unit: 'Main Unit',
    scenes: 'SC-42, SC-43A, SC-44',
    setting: 'INT',
    dayNight: 'DAY',
    location: 'Studio Floor 3 - Main Grand Stage',
    cast: 'Host, 4 Finalists, 2 Judges',
    pageCount: '4.2 pgs',
    estHours: 12,
    status: 'In Progress',
    notes: 'Today shoot. Quarter-final cook-off in progress.'
  },
  {
    id: 'sch_5',
    dayNo: 5,
    date: '2026-08-24',
    unit: 'Main Unit',
    scenes: 'SC-48, SC-49, SC-50',
    setting: 'INT',
    dayNight: 'DAY',
    location: 'Studio Floor 3 - Elimination Chamber',
    cast: 'Host, Semi-Finalists',
    pageCount: '4.0 pgs',
    estHours: 11,
    status: 'Scheduled',
    notes: 'Special pyro & visual effect cues required.'
  },
  {
    id: 'sch_6',
    dayNo: 6,
    date: '2026-08-25',
    unit: 'Splinter Unit',
    scenes: 'Promo Inserts & Title Sequence B-Roll',
    setting: 'EXT',
    dayNight: 'GOLDEN HOUR',
    location: 'City Market & Heritage Fort',
    cast: '4 Finalists Hero Shots',
    pageCount: '2.0 pgs',
    estHours: 8,
    status: 'Scheduled',
    notes: 'Drone permissions approved by municipal authority.'
  }
];

export const ProductionSchedule: React.FC<ProductionScheduleProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [dayNo, setDayNo] = useState(schedule.length + 1);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [unit, setUnit] = useState('Main Unit');
  const [scenes, setScenes] = useState('');
  const [setting, setSetting] = useState('INT');
  const [dayNight, setDayNight] = useState('DAY');
  const [location, setLocation] = useState('');
  const [cast, setCast] = useState('');
  const [pageCount, setPageCount] = useState('3.5 pgs');
  const [estHours, setEstHours] = useState(11);
  const [notes, setNotes] = useState('');

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ schedule: ScheduleDay[] }>('production_schedules', projectId, (data) => {
      if (data && data.schedule && data.schedule.length > 0) {
        setSchedule(data.schedule);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: ScheduleDay[]) => {
    setSchedule(updated);
    saveDocData('production_schedules', projectId, { schedule: updated });
  };

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    const newDay: ScheduleDay = {
      id: `sch_${Date.now()}`,
      dayNo: Number(dayNo) || schedule.length + 1,
      date,
      unit,
      scenes: scenes || 'Scene Sequences',
      setting,
      dayNight,
      location: location || 'Studio Floor',
      cast: cast || 'Main Cast',
      pageCount,
      estHours: Number(estHours) || 11,
      status: 'Scheduled',
      notes
    };

    const updated = [...schedule, newDay].sort((a, b) => a.dayNo - b.dayNo);
    handleSaveToFirebase(updated);

    // Reset form
    setScenes('');
    setLocation('');
    setCast('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: ScheduleDay['status'][] = ['Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled'];
    const updated = schedule.map(s => {
      if (s.id === id) {
        const nextIdx = (statuses.indexOf(s.status) + 1) % statuses.length;
        return { ...s, status: statuses[nextIdx] };
      }
      return s;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = schedule.filter(s => s.id !== id);
    handleSaveToFirebase(updated);
  };

  const completedDays = schedule.filter(s => s.status === 'Completed').length;
  const progressPct = schedule.length > 0 ? Math.round((completedDays / schedule.length) * 100) : 0;

  const filtered = schedule.filter(s => {
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchSearch = !search || 
      s.scenes.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      s.cast.toLowerCase().includes(search.toLowerCase()) ||
      `day ${s.dayNo}`.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Schedule Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold text-white">Master Shooting Schedule &amp; Day-Wise Milestones</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Track schedule completion, scene allocations, page counts &amp; location logistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Completed Progress</span>
              <span className="text-sm font-bold text-cyan-400">{completedDays} of {schedule.length} Days ({progressPct}%)</span>
            </div>
            <button
              onClick={() => {
                setDayNo(schedule.length + 1);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shoot Day</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Day, Scene, Location or Cast..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Scheduled', 'In Progress', 'Completed', 'Postponed'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st 
                  ? 'bg-cyan-600 text-white shadow-xs' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Add Day Modal/Subform */}
      {showAddModal && (
        <form onSubmit={handleAddDay} className="bg-slate-900 border border-cyan-500/40 p-5 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Schedule Day Entry
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Shoot Day #</label>
              <input
                type="number"
                value={dayNo}
                onChange={e => setDayNo(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Shoot Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Shooting Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Main Unit">Main Unit</option>
                <option value="Splinter Unit">Splinter Unit</option>
                <option value="Action Unit">Action Unit</option>
                <option value="Promo / BTS">Promo / BTS</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Est Shift Duration</label>
              <input
                type="number"
                value={estHours}
                onChange={e => setEstHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Scenes Scheduled</label>
              <input
                type="text"
                placeholder="e.g. SC-55, SC-56, SC-57"
                value={scenes}
                onChange={e => setScenes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Setting &amp; Lighting</label>
              <div className="flex gap-2">
                <select
                  value={setting}
                  onChange={e => setSetting(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                >
                  <option value="INT">INT</option>
                  <option value="EXT">EXT</option>
                  <option value="INT/EXT">INT/EXT</option>
                </select>
                <select
                  value={dayNight}
                  onChange={e => setDayNight(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                >
                  <option value="DAY">DAY</option>
                  <option value="NIGHT">NIGHT</option>
                  <option value="DUSK">DUSK</option>
                  <option value="DAWN">DAWN</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Est Page Count</label>
              <input
                type="text"
                value={pageCount}
                onChange={e => setPageCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Location / Stage</label>
              <input
                type="text"
                placeholder="e.g. Stage 3 or Outdoor Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Cast Required</label>
              <input
                type="text"
                placeholder="e.g. Lead Actors, Judges, Extras"
                value={cast}
                onChange={e => setCast(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Special Equipment / Props Notes</label>
            <input
              type="text"
              placeholder="e.g. Rain machine, Steadicam, Special FX required"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
            >
              Save Schedule Day
            </button>
          </div>
        </form>
      )}

      {/* Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Day / Date</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Scenes Scheduled</th>
                <th className="px-4 py-3">Set / Lighting</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Cast &amp; Pages</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(s => (
                <tr 
                  key={s.id}
                  onClick={() => handleToggleStatus(s.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px] flex items-center justify-center">
                        {s.dayNo}
                      </span>
                      <div>
                        <span className="font-bold text-white block">Day {s.dayNo}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.date}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                    {s.unit}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-white">
                    {s.scenes}
                    {s.notes && <p className="text-[10px] text-slate-400 font-normal italic mt-0.5">{s.notes}</p>}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mr-1">{s.setting}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{s.dayNight}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{s.location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-300 truncate max-w-[160px]">{s.cast}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{s.pageCount} • {s.estHours}h shift</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      s.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      s.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      s.status === 'Postponed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      s.status === 'Cancelled' ? 'bg-slate-800 text-slate-500' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Schedule Entry"
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
