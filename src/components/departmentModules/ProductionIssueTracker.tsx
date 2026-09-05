import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionIssueTrackerProps {
  project?: Project;
}

export interface ProductionIssue {
  id: string;
  issueTitle: string;
  category: 'Technical / Equipment' | 'Artist / Talent' | 'Art / Set Damage' | 'Power / Genset' | 'Weather / Outdoor' | 'Sound / Interference';
  severity: 'Critical (Shoot Halted)' | 'Major (Delay)' | 'Minor (Workaround)';
  minutesLost: number;
  timeReported: string;
  rootCause: string;
  correctiveActionTaken: string;
  loggedBy: string;
  status: 'Open / In Progress' | 'Resolved / Resumed' | 'Flagged for Post';
}

const DEFAULT_ISSUES: ProductionIssue[] = [
  {
    id: 'iss_1',
    issueTitle: 'Master Cooking Stove Gas Regulator Pressure Drop',
    category: 'Technical / Equipment',
    severity: 'Major (Delay)',
    minutesLost: 20,
    timeReported: '09:15 AM',
    rootCause: 'Defective dual-stage valve on Gas Cylinder 4',
    correctiveActionTaken: 'Art team replaced regulator within 15 mins. Tested with safety lead.',
    loggedBy: '1st AD - Ananya Roy',
    status: 'Resolved / Resumed'
  },
  {
    id: 'iss_2',
    issueTitle: 'Audio RF Interference on Lapel Mic 3 (Host)',
    category: 'Sound / Interference',
    severity: 'Minor (Workaround)',
    minutesLost: 8,
    timeReported: '11:40 AM',
    rootCause: 'Frequency clash with nearby mobile telecom transmission tower',
    correctiveActionTaken: 'Sound engineer shifted frequency from 580MHz to 642MHz digital channel.',
    loggedBy: 'Sound Recordist - Debjit',
    status: 'Resolved / Resumed'
  },
  {
    id: 'iss_3',
    issueTitle: 'Studio Air-Conditioning Blower Humming Sound',
    category: 'Power / Genset',
    severity: 'Minor (Workaround)',
    minutesLost: 5,
    timeReported: '03:10 PM',
    rootCause: 'Loose damper in HVAC exhaust duct 2',
    correctiveActionTaken: 'Silenced during dialogue takes via remote relay trip.',
    loggedBy: 'Floor AD - Rahul',
    status: 'Resolved / Resumed'
  }
];

export const ProductionIssueTracker: React.FC<ProductionIssueTrackerProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [issues, setIssues] = useState<ProductionIssue[]>(DEFAULT_ISSUES);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<ProductionIssue['category']>('Technical / Equipment');
  const [sev, setSev] = useState<ProductionIssue['severity']>('Major (Delay)');
  const [mins, setMins] = useState(15);
  const [time, setTime] = useState('10:30 AM');
  const [cause, setCause] = useState('');
  const [action, setAction] = useState('');
  const [loggedBy, setLoggedBy] = useState('');

  // Firebase
  useEffect(() => {
    const unsub = subscribeDoc<{ issues: ProductionIssue[] }>('production_issues', projectId, (data) => {
      if (data && data.issues && data.issues.length > 0) {
        setIssues(data.issues);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSaveToFirebase = (updated: ProductionIssue[]) => {
    setIssues(updated);
    saveDocData('production_issues', projectId, { issues: updated });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newIssue: ProductionIssue = {
      id: `iss_${Date.now()}`,
      issueTitle: title,
      category: cat,
      severity: sev,
      minutesLost: Number(mins) || 0,
      timeReported: time,
      rootCause: cause || 'Under diagnosis',
      correctiveActionTaken: action || 'Action initiated',
      loggedBy: loggedBy || 'Production Team',
      status: 'Open / In Progress'
    };

    const updated = [...issues, newIssue];
    handleSaveToFirebase(updated);

    setTitle('');
    setCause('');
    setAction('');
    setShowAdd(false);
  };

  const handleToggleStatus = (id: string) => {
    const statuses: ProductionIssue['status'][] = ['Open / In Progress', 'Resolved / Resumed', 'Flagged for Post'];
    const updated = issues.map(iss => {
      if (iss.id === id) {
        const nextIdx = (statuses.indexOf(iss.status) + 1) % statuses.length;
        return { ...iss, status: statuses[nextIdx] };
      }
      return iss;
    });
    handleSaveToFirebase(updated);
  };

  const handleDelete = (id: string) => {
    const updated = issues.filter(iss => iss.id !== id);
    handleSaveToFirebase(updated);
  };

  const totalMinutesLost = issues.reduce((sum, i) => sum + (Number(i.minutesLost) || 0), 0);
  const openIssuesCount = issues.filter(i => i.status === 'Open / In Progress').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-extrabold text-white">On-Set Issue, Snag &amp; Delay Stoppage Log</h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
              {openIssuesCount} Active / {issues.length} Total Logged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of technical snags, lost minutes, root causes &amp; corrective resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Total Shoot Delay Logged</span>
            <span className="text-sm font-black text-rose-400">{totalMinutesLost} Minutes</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Log Snag / Delay</span>
          </button>
        </div>
      </div>

      {/* Add Issue Subform */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-900 border border-rose-500/40 rounded-2xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Log Production Snag / Stoppage
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Issue / Stoppage Title</label>
              <input
                type="text"
                placeholder="e.g. Camera A Sensor Overheating"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Category</label>
              <select
                value={cat}
                onChange={e => setCat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Technical / Equipment">Technical / Equipment</option>
                <option value="Artist / Talent">Artist / Talent</option>
                <option value="Art / Set Damage">Art / Set Damage</option>
                <option value="Power / Genset">Power / Genset</option>
                <option value="Weather / Outdoor">Weather / Outdoor</option>
                <option value="Sound / Interference">Sound / Interference</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Severity</label>
              <select
                value={sev}
                onChange={e => setSev(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Critical (Shoot Halted)">Critical (Shoot Halted)</option>
                <option value="Major (Delay)">Major (Delay)</option>
                <option value="Minor (Workaround)">Minor (Workaround)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Minutes Lost</label>
              <input
                type="number"
                value={mins}
                onChange={e => setMins(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Time Reported</label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Logged By</label>
              <input
                type="text"
                placeholder="AD / HOD Name"
                value={loggedBy}
                onChange={e => setLoggedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Root Cause Diagnosis</label>
              <input
                type="text"
                placeholder="Why did this occur?"
                value={cause}
                onChange={e => setCause(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Corrective Action Taken</label>
              <input
                type="text"
                placeholder="How was it resolved?"
                value={action}
                onChange={e => setAction(e.target.value)}
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
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
            >
              Save Incident Log
            </button>
          </div>
        </form>
      )}

      {/* Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5">Issue Title &amp; Category</th>
                <th className="px-3 py-2.5">Severity</th>
                <th className="px-3 py-2.5 text-center">Delay</th>
                <th className="px-3 py-2.5">Time</th>
                <th className="px-3 py-2.5">Root Cause &amp; Resolution</th>
                <th className="px-3 py-2.5">Logged By</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {issues.map(iss => (
                <tr 
                  key={iss.id}
                  onClick={() => handleToggleStatus(iss.id)}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3">
                    <span className="font-bold text-white block">{iss.issueTitle}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{iss.category}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      iss.severity.includes('Critical') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      iss.severity.includes('Major') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {iss.severity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-rose-400">
                    +{iss.minutesLost}m
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-400 text-[11px]">{iss.timeReported}</td>
                  <td className="px-3 py-3 max-w-xs">
                    <div className="text-slate-300 text-[11px]"><strong className="text-slate-400">Cause:</strong> {iss.rootCause}</div>
                    <div className="text-emerald-300 text-[11px]"><strong className="text-emerald-400">Fix:</strong> {iss.correctiveActionTaken}</div>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-400">{iss.loggedBy}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      iss.status.includes('Resolved') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      iss.status.includes('Flagged') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {iss.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(iss.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete log"
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
