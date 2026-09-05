import React, { useState, useEffect } from 'react';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import { 
  Network, 
  Database, 
  Smartphone, 
  Cloud, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Server,
  Zap,
  Radio,
  FileCode,
  Building2,
  Users,
  MapPin,
  HelpCircle,
  Plus,
  TrendingUp,
  Info,
  Sliders,
  Check,
  Building,
  User,
  ArrowRight
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  members: number;
  sites: number;
  occupancy: number;
  status: 'Operational' | 'Audit Phase' | 'Critical';
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  site: string;
  status: 'Active' | 'Away' | 'Offline';
  initials: string;
}

interface LocationSite {
  id: string;
  name: string;
  address: string;
  permitStatus: 'Active · 2025' | 'In Review' | 'Deferred';
  scouting: string;
  image: string;
}

export default function ResourceMap() {
  const [activeTab, setActiveTab] = useState<'departments' | 'team' | 'locations' | 'topology' | 'spec'>('departments');
  const [pinging, setPinging] = useState<string | null>(null);

  // Dynamic lists synced with Firestore Server
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [locations, setLocations] = useState<LocationSite[]>([]);

  // Subscribe to Resource Map Data from Firestore Server
  useEffect(() => {
    const unsub = subscribeDoc<any>('settings', 'resource_map', (data) => {
      if (data) {
        if (Array.isArray(data.departments)) setDepartments(data.departments);
        if (Array.isArray(data.teamMembers)) setTeamMembers(data.teamMembers);
        if (Array.isArray(data.locations)) setLocations(data.locations);
      }
    });
    return () => unsub();
  }, []);

  // Sync Resource Map to Firestore Server when updated
  useEffect(() => {
    if (departments.length > 0 || teamMembers.length > 0 || locations.length > 0) {
      saveDocData('settings', 'resource_map', { departments, teamMembers, locations });
    }
  }, [departments, teamMembers, locations]);

  // Topology node dataset
  const nodes = [
    {
      id: 'local',
      title: 'Browser Client Session',
      type: 'Client Side',
      status: 'Synced',
      ip: 'Client Application',
      icon: Smartphone,
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700',
      description: 'Responsive user session state connected directly to cloud synchronizers.'
    },
    {
      id: 'gateway',
      title: 'Cloud Real-Time Listener',
      type: 'Middle layer',
      status: 'Active',
      ip: 'Firestore Pipeline',
      icon: Radio,
      color: 'border-sky-200 bg-sky-50/40 text-sky-700',
      description: 'Streamed WebSocket sync layer managing real-time transactional reconciliations.'
    },
    {
      id: 'sqlite',
      title: 'Firebase Firestore DB',
      type: 'Cloud Database',
      status: 'Operational',
      ip: 'Cloud Firestore',
      icon: Database,
      color: 'border-blue-200 bg-blue-50/40 text-blue-700',
      description: 'Live cloud data store maintaining projects, categories, and ledger entries.'
    },
    {
      id: 'cloud',
      title: 'Cloud Document Storage',
      type: 'Enterprise Storage',
      status: 'Secure',
      ip: 'Cloud Primary',
      icon: Cloud,
      color: 'border-purple-200 bg-purple-50/40 text-purple-700',
      description: 'Encrypted cloud file archive for attachments and receipts.'
    }
  ];

  // Quick addition states
  const [showAddForm, setShowAddForm] = useState<'none' | 'department' | 'member' | 'location'>('none');

  // Form states
  const [fDeptName, setFDeptName] = useState('');
  const [fDeptMembers, setFDeptMembers] = useState(10);
  const [fDeptStatus, setFDeptStatus] = useState<'Operational' | 'Audit Phase' | 'Critical'>('Operational');

  const [fMemName, setFMemName] = useState('');
  const [fMemEmail, setFMemEmail] = useState('');
  const [fMemDept, setFMemDept] = useState('Engineering');
  const [fMemRole, setFMemRole] = useState('Analyst');
  const [fMemSite, setFMemSite] = useState('Berlin HQ');

  const [fLocId, setFLocId] = useState('');
  const [fLocName, setFLocName] = useState('');
  const [fLocAddress, setFLocAddress] = useState('');
  const [fLocPermit, setFLocPermit] = useState<'Active · 2025' | 'In Review' | 'Deferred'>('Active · 2025');

  const handlePingNode = (nodeId: string) => {
    setPinging(nodeId);
    setTimeout(() => {
      setPinging(null);
    }, 1500);
  };

  // Submission helpers
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fDeptName.trim()) return;
    const newD: Department = {
      id: `dep_${Date.now()}`,
      name: fDeptName,
      members: Number(fDeptMembers),
      sites: 1,
      occupancy: 75,
      status: fDeptStatus,
      color: fDeptStatus === 'Operational' ? 'bg-blue-50 text-[#0058be]' : fDeptStatus === 'Audit Phase' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
    };
    setDepartments([...departments, newD]);
    setFDeptName('');
    setShowAddForm('none');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fMemName.trim()) return;
    const initials = fMemName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const newM: TeamMember = {
      id: `t_${Date.now()}`,
      name: fMemName,
      email: fMemEmail || `${fMemName.toLowerCase().replace(/ /g, '.')}@projectflow.com`,
      department: fMemDept,
      role: fMemRole,
      site: fMemSite,
      status: 'Active',
      initials
    };
    setTeamMembers([...teamMembers, newM]);
    setFMemName('');
    setFMemEmail('');
    setShowAddForm('none');
  };

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fLocName.trim() || !fLocId.trim()) return;
    const newL: LocationSite = {
      id: fLocId.toUpperCase(),
      name: fLocName,
      address: fLocAddress || 'Global Coordinates',
      permitStatus: fLocPermit,
      scouting: 'Completed',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
    };
    setLocations([...locations, newL]);
    setFLocId('');
    setFLocName('');
    setFLocAddress('');
    setShowAddForm('none');
  };

  return (
    <div id="erp-master-resource-management-view" className="bg-slate-900 border border-slate-800 rounded-xl shadow-xs p-4 space-y-4 animate-fade-in text-white">
      
      {/* Top Header Ribbon & Dynamic Addition trigger */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-white font-sans flex items-center gap-2 uppercase tracking-tight">
            <Network className="w-5 h-5 text-blue-400" />
            Organization Resource Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage departments, team directories, and active production locations</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'departments' && (
            <button 
              onClick={() => setShowAddForm('department')}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          )}
          {activeTab === 'team' && (
            <button 
              onClick={() => setShowAddForm('member')}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Team Member</span>
            </button>
          )}
          {activeTab === 'locations' && (
            <button 
              onClick={() => setShowAddForm('location')}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Site Location</span>
            </button>
          )}

          {/* Core high-density Tab list */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button 
              onClick={() => { setActiveTab('departments'); setShowAddForm('none'); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeTab === 'departments' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Departments
            </button>
            <button 
              onClick={() => { setActiveTab('team'); setShowAddForm('none'); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeTab === 'team' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Team Directory
            </button>
            <button 
              onClick={() => { setActiveTab('locations'); setShowAddForm('none'); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeTab === 'locations' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Site Locations
            </button>
            <button 
              onClick={() => { setActiveTab('topology'); setShowAddForm('none'); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeTab === 'topology' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Map
            </button>
            <button 
              onClick={() => { setActiveTab('spec'); setShowAddForm('none'); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeTab === 'spec' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Specs
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Popover Dialog Addition Modals */}
      {showAddForm !== 'none' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 animate-fade-in space-y-3">
          <div className="flex justify-between items-center border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Add New {showAddForm === 'department' ? 'Department' : showAddForm === 'member' ? 'Team Member' : 'Site Location'} Entry
            </h3>
            <button onClick={() => setShowAddForm('none')} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">✕ Close</button>
          </div>

          {showAddForm === 'department' && (
            <form onSubmit={handleAddDept} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Department Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Legal & Compliance"
                  value={fDeptName} 
                  onChange={e => setFDeptName(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Assigned Personnel</label>
                <input 
                  type="number" 
                  required
                  value={fDeptMembers} 
                  onChange={e => setFDeptMembers(Number(e.target.value))}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Status</label>
                  <select 
                    value={fDeptStatus} 
                    onChange={e => setFDeptStatus(e.target.value as any)}
                    className="h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Audit Phase">Audit Phase</option>
                  </select>
                </div>
                <button type="submit" className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer">Onboard</button>
              </div>
            </form>
          )}

          {showAddForm === 'member' && (
            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Liam Sterling"
                  value={fMemName} 
                  onChange={e => setFMemName(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Official Email</label>
                <input 
                  type="email" 
                  placeholder="l.sterling@projectflow.com"
                  value={fMemEmail} 
                  onChange={e => setFMemEmail(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Dept / Role</label>
                <input 
                  type="text" 
                  required
                  placeholder="Engineering / Designer"
                  value={fMemRole} 
                  onChange={e => setFMemRole(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">HQ Hub Location</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Berlin HQ"
                    value={fMemSite} 
                    onChange={e => setFMemSite(e.target.value)}
                    className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer">Register</button>
              </div>
            </form>
          )}

          {showAddForm === 'location' && (
            <form onSubmit={handleAddLoc} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Site Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. ZRH-01"
                  value={fLocId} 
                  onChange={e => setFLocId(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono uppercase font-bold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Site Descriptive Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zurich Central Hub"
                  value={fLocName} 
                  onChange={e => setFLocName(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Full Address</label>
                <input 
                  type="text" 
                  required
                  placeholder="Zurich, Switzerland"
                  value={fLocAddress} 
                  onChange={e => setFLocAddress(e.target.value)}
                  className="h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Permits</label>
                  <select 
                    value={fLocPermit} 
                    onChange={e => setFLocPermit(e.target.value as any)}
                    className="h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="Active · 2025">Active · 2025</option>
                    <option value="In Review">In Review</option>
                  </select>
                </div>
                <button type="submit" className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer">Deploy</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB CONTENT: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in">
          {/* Org Summary Card */}
          <div className="md:col-span-4 p-4 bg-slate-800/60 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              Organizational Health
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              High-level overview of personnel spread and active physical operation site ratios.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 font-sans">Total Departments</span>
                <span className="font-mono text-sm font-black text-white">{departments.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 font-sans">Average Occupancy</span>
                <span className="font-mono text-sm font-black text-emerald-400">92%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 font-sans">Cross-Dept Projects</span>
                <span className="font-mono text-sm font-black text-blue-400">24</span>
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <div 
                key={dept.id} 
                className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                      dept.status === 'Operational' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {dept.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-sans group-hover:text-blue-400 transition-colors">{dept.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{dept.members} Members · {dept.sites} Active Sites</p>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>CAPACITY OCCUPANCY</span>
                    <span>{dept.occupancy}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-full" style={{ width: `${dept.occupancy}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEAM DIRECTORY */}
      {activeTab === 'team' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xs animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800">
                  <th className="p-2.5 pl-4 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="p-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="p-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="p-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Current Site</th>
                  <th className="p-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-2.5 pr-4 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider text-right w-[100px]">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {teamMembers.map((mem) => (
                  <tr key={mem.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center text-[10px] font-bold font-mono">
                          {mem.initials}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-sans">{mem.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{mem.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-xs text-slate-300 font-sans font-medium">{mem.department}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold font-mono rounded-full border border-slate-700">
                        {mem.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-xs text-slate-400 font-mono">{mem.site}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          mem.status === 'Active' ? 'bg-emerald-400' : mem.status === 'Away' ? 'bg-amber-400' : 'bg-slate-600'
                        }`} />
                        <span className="text-xs text-slate-300 font-sans font-medium">{mem.status}</span>
                      </div>
                    </td>
                    <td className="p-2.5 pr-4 text-right">
                      <button className="text-xs font-bold text-blue-400 hover:underline cursor-pointer">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SITE LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xs group hover:border-slate-700">
                <div className="h-36 relative bg-slate-950 overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70" 
                    alt={loc.name} 
                    src={loc.image} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded text-[10px] font-bold font-mono text-slate-300 border border-slate-700">
                    Site ID: {loc.id}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-black text-white font-sans uppercase tracking-tight">{loc.name}</h4>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {loc.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-800/60 border border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold font-mono uppercase">Permit Status</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{loc.permitStatus}</p>
                    </div>
                    <div className="p-2 bg-slate-800/60 border border-slate-800 rounded-lg">
                      <p className="text-[9px] text-slate-400 font-bold font-mono uppercase">Scouting</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{loc.scouting}</p>
                    </div>
                  </div>

                  <button className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-2xs transition-colors">
                    View Full Report
                  </button>
                </div>
              </div>
            ))}

            {/* Visual Stats Card (Global Site Distribution) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden">
              <div>
                <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider mb-3">Global Site Distribution</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                      <span>EMEA Region</span>
                      <span className="text-slate-200">45%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                      <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                      <span>APAC Region</span>
                      <span className="text-slate-200">32%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                      <div className="bg-blue-400 h-full" style={{ width: '32%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                      <span>Americas</span>
                      <span className="text-slate-200">23%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                      <div className="bg-slate-600 h-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono">
                <span className="font-bold text-blue-400">Interactive GIS active</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
                  <Cloud className="w-3.5 h-3.5" /> E-TUNNEL SECURE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INFRASTRUCTURE VISUAL MAP */}
      {activeTab === 'topology' && (
        <div className="space-y-4 animate-fade-in">
          {/* Active Diagnostic Status Board */}
          <div className="bg-slate-950 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-white border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full animate-pulse">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-sans">Active Sync Routing Operational</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">LATENCY: 5.4ms | INTEGRITY SHIELD: SHIELD-ACTIVE</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>SECURE SSL/TLS CLOUD SYNCHRONIZED</span>
            </div>
          </div>

          {/* Connected Visual Topology diagram */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {nodes.map((node, idx) => {
              const NodeIcon = node.icon;
              return (
                <div 
                  key={node.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-300 relative bg-slate-800/50 ${
                    pinging === node.id ? 'ring-2 ring-amber-400 scale-[1.02]' : 'border-slate-800'
                  }`}
                >
                  {/* Link lines for desktop visual guidance */}
                  {idx < nodes.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-2.5 w-5 h-0.5 bg-slate-700 z-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute left-1/2 -translate-x-1/2 -translate-y-[2px] animate-ping"></div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400">
                        <NodeIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {node.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white font-sans">{node.title}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">{node.type}</p>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{node.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{node.ip}</span>
                    <button
                      onClick={() => handlePingNode(node.id)}
                      disabled={pinging !== null}
                      className="text-[10px] font-sans font-bold text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {pinging === node.id ? 'Pinging...' : 'Trigger Ping'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-2.5 text-xs text-emerald-300 leading-relaxed">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Real-time Cloud Sync:</span> State modifications synchronize automatically to Firebase Firestore. Your work is backed up continuously to the cloud.
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SYSTEM SPECS */}
      {activeTab === 'spec' && (
        <div className="space-y-3 animate-fade-in text-xs leading-relaxed text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-800/40">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Server className="w-4 h-4 text-blue-400" /> Core Environment Specs
              </h3>
              <ul className="space-y-2 font-mono text-[11px]">
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="text-white font-bold">Firebase Firestore</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Cloud Host:</span>
                  <span className="text-white font-bold">Google Cloud Platform</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Active Sync Interval:</span>
                  <span className="text-white font-bold">Real-time (Stream)</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-slate-400">Security Layer:</span>
                  <span className="text-white font-bold">SSL / TLS Encrypted</span>
                </li>
              </ul>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-800/40">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileCode className="w-4 h-4 text-blue-400" /> Re-routing Schemas
              </h3>
              <ul className="space-y-2 font-mono text-[11px]">
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Master Projects DB:</span>
                  <span className="text-white font-bold">tbl_projects_master</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Budget Categories DB:</span>
                  <span className="text-white font-bold">tbl_budget_categories</span>
                </li>
                <li className="flex justify-between border-b border-dashed border-slate-800 pb-1">
                  <span className="text-slate-400">Expenses Ledger DB:</span>
                  <span className="text-white font-bold">tbl_expenses_ledger</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-slate-400">Transactional History:</span>
                  <span className="text-white font-bold">tbl_sync_transaction_logs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
