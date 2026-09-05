import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Sparkles, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Film, 
  Calendar, 
  Smile,
  ShieldCheck
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionArtistAttendanceProps {
  project?: Project;
}

export interface ArtistAttendanceRecord {
  id: string;
  artistName: string;
  characterName: string;
  castCategory: 'Lead Actor' | 'Supporting Cast' | 'Special Appearance / Cameo' | 'Junior Artist / Background';
  vanityVanNo: string;
  callTime: string;
  makeupCallTime: string;
  onSetTime: string;
  firstShotTime: string;
  wrapTime: string;
  scenesScheduled: string;
  attendanceStatus: 'On Set / Ready' | 'In Makeup & Hair' | 'En Route / Picked Up' | 'Wrapped for Day' | 'Not Called Today';
  specialRequirements: string;
}

const DEFAULT_ARTISTS: ArtistAttendanceRecord[] = [
  {
    id: 'art_1',
    artistName: 'Prosenjit Chatterjee',
    characterName: 'DCP Prabir Roy Chowdhury',
    castCategory: 'Lead Actor',
    vanityVanNo: 'Vanity #1 (VIP)',
    callTime: '06:00 AM',
    makeupCallTime: '06:30 AM',
    onSetTime: '07:45 AM',
    firstShotTime: '08:15 AM',
    wrapTime: '07:30 PM',
    scenesScheduled: 'Scene 14, 15, 18B (Int. Police Station)',
    attendanceStatus: 'On Set / Ready',
    specialRequirements: 'Sugar-free black coffee, prosthetics touch-up between shots'
  },
  {
    id: 'art_2',
    artistName: 'Parambrata Chatterjee',
    characterName: 'Inspector Abhijit Pakrashi',
    castCategory: 'Lead Actor',
    vanityVanNo: 'Vanity #2',
    callTime: '06:30 AM',
    makeupCallTime: '07:00 AM',
    onSetTime: '08:00 AM',
    firstShotTime: '08:30 AM',
    wrapTime: '08:00 PM',
    scenesScheduled: 'Scene 14, 15, 21 (Corridor & Interrogation)',
    attendanceStatus: 'On Set / Ready',
    specialRequirements: 'Stunt double on standby for Scene 21 fall'
  },
  {
    id: 'art_3',
    artistName: 'Raima Sen',
    characterName: 'Amrita Mukherjee',
    castCategory: 'Supporting Cast',
    vanityVanNo: 'Vanity #3',
    callTime: '08:30 AM',
    makeupCallTime: '09:00 AM',
    onSetTime: '10:15 AM',
    firstShotTime: '10:45 AM',
    wrapTime: '05:00 PM',
    scenesScheduled: 'Scene 16 (Press Briefing Room)',
    attendanceStatus: 'In Makeup & Hair',
    specialRequirements: 'Costume change #2 approved by director'
  },
  {
    id: 'art_4',
    artistName: 'Koushik Sen',
    characterName: 'Public Prosecutor S. Sen',
    castCategory: 'Special Appearance / Cameo',
    vanityVanNo: 'Vanity #4 (Green Room)',
    callTime: '11:00 AM',
    makeupCallTime: '11:30 AM',
    onSetTime: '12:15 PM',
    firstShotTime: '01:00 PM',
    wrapTime: '06:00 PM',
    scenesScheduled: 'Scene 17A (Chambers Discussion)',
    attendanceStatus: 'En Route / Picked Up',
    specialRequirements: 'Flight arrival CCU 09:30 AM; car dispatched'
  },
  {
    id: 'art_5',
    artistName: 'Crowd Unit (12 Actors)',
    characterName: 'Media Reporters & Police Constables',
    castCategory: 'Junior Artist / Background',
    vanityVanNo: 'Holding Area Hall B',
    callTime: '06:00 AM',
    makeupCallTime: '06:30 AM',
    onSetTime: '08:00 AM',
    firstShotTime: '08:30 AM',
    wrapTime: '04:00 PM',
    scenesScheduled: 'Scene 14, 16 (Police Station Lobby)',
    attendanceStatus: 'On Set / Ready',
    specialRequirements: 'Props: 6x mock press cameras, 4x wireless walkie talkies'
  }
];

export const ProductionArtistAttendance: React.FC<ProductionArtistAttendanceProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const docKey = `artist_attendance_${projectId}`;

  const [artists, setArtists] = useState<ArtistAttendanceRecord[]>(DEFAULT_ARTISTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [newArtist, setNewArtist] = useState<Partial<ArtistAttendanceRecord>>({
    artistName: '',
    characterName: '',
    castCategory: 'Lead Actor',
    vanityVanNo: 'Vanity #1',
    callTime: '07:00 AM',
    makeupCallTime: '07:30 AM',
    onSetTime: '08:30 AM',
    firstShotTime: '09:00 AM',
    wrapTime: '07:00 PM',
    scenesScheduled: '',
    attendanceStatus: 'On Set / Ready',
    specialRequirements: ''
  });

  // Subscribe to Firestore for real-time sync
  useEffect(() => {
    const unsub = subscribeDoc('production_controls', docKey, (data: any) => {
      if (data && Array.isArray(data.artists) && data.artists.length > 0) {
        setArtists(data.artists);
      }
    });
    return () => unsub();
  }, [docKey]);

  const handleSaveToFirestore = async (updatedList: ArtistAttendanceRecord[]) => {
    try {
      await saveDocData('production_controls', docKey, {
        artists: updatedList,
        updatedAt: new Date().toISOString(),
        projectId
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save artist attendance to Firestore:', e);
    }
  };

  const handleAddArtist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.artistName) return;

    const record: ArtistAttendanceRecord = {
      id: `art_${Date.now()}`,
      artistName: newArtist.artistName || 'Actor Name',
      characterName: newArtist.characterName || 'Character',
      castCategory: (newArtist.castCategory as any) || 'Lead Actor',
      vanityVanNo: newArtist.vanityVanNo || 'Holding Area',
      callTime: newArtist.callTime || '07:00 AM',
      makeupCallTime: newArtist.makeupCallTime || '07:30 AM',
      onSetTime: newArtist.onSetTime || '08:30 AM',
      firstShotTime: newArtist.firstShotTime || '09:00 AM',
      wrapTime: newArtist.wrapTime || '07:00 PM',
      scenesScheduled: newArtist.scenesScheduled || 'TBD',
      attendanceStatus: (newArtist.attendanceStatus as any) || 'On Set / Ready',
      specialRequirements: newArtist.specialRequirements || ''
    };

    const updated = [record, ...artists];
    setArtists(updated);
    handleSaveToFirestore(updated);
    setShowAddModal(false);
    setNewArtist({
      artistName: '',
      characterName: '',
      castCategory: 'Lead Actor',
      vanityVanNo: 'Vanity #1',
      callTime: '07:00 AM',
      makeupCallTime: '07:30 AM',
      onSetTime: '08:30 AM',
      firstShotTime: '09:00 AM',
      wrapTime: '07:00 PM',
      scenesScheduled: '',
      attendanceStatus: 'On Set / Ready',
      specialRequirements: ''
    });
  };

  const handleDeleteArtist = (id: string) => {
    if (!confirm('Remove this cast member from today\'s attendance muster?')) return;
    const updated = artists.filter(a => a.id !== id);
    setArtists(updated);
    handleSaveToFirestore(updated);
  };

  const handleStatusChange = (id: string, newStatus: ArtistAttendanceRecord['attendanceStatus']) => {
    const updated = artists.map(a => a.id === id ? { ...a, attendanceStatus: newStatus } : a);
    setArtists(updated);
    handleSaveToFirestore(updated);
  };

  const filteredArtists = artists.filter(a => {
    const matchesSearch = 
      a.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.scenesScheduled.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.vanityVanNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || a.castCategory === categoryFilter;
    const matchesStatus = statusFilter === 'All' || a.attendanceStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const onSetCount = artists.filter(a => a.attendanceStatus === 'On Set / Ready').length;
  const makeupCount = artists.filter(a => a.attendanceStatus === 'In Makeup & Hair').length;
  const enRouteCount = artists.filter(a => a.attendanceStatus === 'En Route / Picked Up').length;

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-900/60">
              Cast & Talent Logistics
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {project?.name || 'All Units'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            ARTIST ATTENDANCE & CAST CALL TIME MUSTER
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time artist tracking, vanity van assignments, makeup schedules, on-set timings & wrap logs.
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
            <span>Add Artist Record</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Cast Scheduled</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base md:text-lg font-black text-white font-mono">
            {artists.length} Talent
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Lead, Supporting & BG
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>On Set / Ready</span>
            <Film className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base md:text-lg font-black text-emerald-400 font-mono">
            {onSetCount} On Floor
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Shooting / Ready for Shot
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>In Makeup & Hair</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-base md:text-lg font-black text-purple-300 font-mono">
            {makeupCount} In Vanity
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Styling / Prosthetics
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>En Route / Pickup</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base md:text-lg font-black text-amber-300 font-mono">
            {enRouteCount} In Transit
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Airport / Hotel Cab
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by artist name, character, scene number, vanity van..."
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
            <option value="All">All Cast Tiers</option>
            <option value="Lead Actor">Lead Actor</option>
            <option value="Supporting Cast">Supporting Cast</option>
            <option value="Special Appearance / Cameo">Cameo / Special</option>
            <option value="Junior Artist / Background">Junior Artists</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 px-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="On Set / Ready">On Set / Ready</option>
            <option value="In Makeup & Hair">In Makeup & Hair</option>
            <option value="En Route / Picked Up">En Route / Picked Up</option>
            <option value="Wrapped for Day">Wrapped for Day</option>
            <option value="Not Called Today">Not Called Today</option>
          </select>
        </div>
      </div>

      {/* Artist Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Artist & Character</th>
                <th className="py-2.5 px-3">Vanity Van</th>
                <th className="py-2.5 px-3">Scheduled Scenes</th>
                <th className="py-2.5 px-3 text-center">Call Time</th>
                <th className="py-2.5 px-3 text-center">On Set</th>
                <th className="py-2.5 px-3 text-center">Wrap</th>
                <th className="py-2.5 px-3 text-center">Live Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredArtists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-sm text-slate-300">No artist records found</p>
                    <p className="text-xs text-slate-500 mt-1">Adjust filters or click "Add Artist Record" to add talent to today's call sheet.</p>
                  </td>
                </tr>
              ) : (
                filteredArtists.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{a.artistName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          {a.castCategory}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-300 mt-0.5">
                        as <strong className="text-amber-300">{a.characterName}</strong>
                      </div>
                      {a.specialRequirements && (
                        <div className="text-[10px] text-slate-400 mt-0.5 italic">
                          Note: {a.specialRequirements}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                      {a.vanityVanNo}
                    </td>

                    <td className="py-2.5 px-3 text-slate-200">
                      {a.scenesScheduled || 'General Scenes'}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      <div>{a.callTime}</div>
                      <div className="text-[10px] text-slate-500">M/U: {a.makeupCallTime}</div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-semibold">
                      {a.onSetTime}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {a.wrapTime}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={a.attendanceStatus}
                        onChange={(e) => handleStatusChange(a.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${
                          a.attendanceStatus === 'On Set / Ready'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : a.attendanceStatus === 'In Makeup & Hair'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : a.attendanceStatus === 'En Route / Picked Up'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : a.attendanceStatus === 'Wrapped for Day'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="On Set / Ready">On Set / Ready</option>
                        <option value="In Makeup & Hair">In Makeup & Hair</option>
                        <option value="En Route / Picked Up">En Route / Picked Up</option>
                        <option value="Wrapped for Day">Wrapped for Day</option>
                        <option value="Not Called Today">Not Called Today</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteArtist(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Delete artist record"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Artist Call Sheet Record</h3>
                  <p className="text-xs text-slate-400">Set call time, makeup timing, vanity van and scheduled scenes</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddArtist} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Artist / Actor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prosenjit Chatterjee"
                    value={newArtist.artistName}
                    onChange={(e) => setNewArtist({ ...newArtist, artistName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Character Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DCP Prabir Roy Chowdhury"
                    value={newArtist.characterName}
                    onChange={(e) => setNewArtist({ ...newArtist, characterName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Cast Category</label>
                  <select
                    value={newArtist.castCategory}
                    onChange={(e) => setNewArtist({ ...newArtist, castCategory: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Lead Actor">Lead Actor</option>
                    <option value="Supporting Cast">Supporting Cast</option>
                    <option value="Special Appearance / Cameo">Special Appearance / Cameo</option>
                    <option value="Junior Artist / Background">Junior Artist / Background</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Vanity Van / Holding Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Vanity Van #1 (VIP)"
                    value={newArtist.vanityVanNo}
                    onChange={(e) => setNewArtist({ ...newArtist, vanityVanNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Call Time</label>
                  <input
                    type="text"
                    placeholder="06:30 AM"
                    value={newArtist.callTime}
                    onChange={(e) => setNewArtist({ ...newArtist, callTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Makeup Time</label>
                  <input
                    type="text"
                    placeholder="07:00 AM"
                    value={newArtist.makeupCallTime}
                    onChange={(e) => setNewArtist({ ...newArtist, makeupCallTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">On Set Time</label>
                  <input
                    type="text"
                    placeholder="08:00 AM"
                    value={newArtist.onSetTime}
                    onChange={(e) => setNewArtist({ ...newArtist, onSetTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Scenes Scheduled</label>
                <input
                  type="text"
                  placeholder="e.g. Scene 12, 14, 15 (Int. Courtroom)"
                  value={newArtist.scenesScheduled}
                  onChange={(e) => setNewArtist({ ...newArtist, scenesScheduled: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase font-mono text-slate-400 block mb-1">Special Requirements & Dietary</label>
                <input
                  type="text"
                  placeholder="e.g. Black coffee, vegan meals, wheelchair assistance..."
                  value={newArtist.specialRequirements}
                  onChange={(e) => setNewArtist({ ...newArtist, specialRequirements: e.target.value })}
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
                  Save Artist Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionArtistAttendance;
