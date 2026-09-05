import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  Save, 
  ExternalLink, 
  Sparkles,
  Camera
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionDsrSummaryProps {
  project?: Project;
  onNavigateToFullDsr?: () => void;
}

export interface DsrSummaryData {
  shootDayNo: number;
  totalDays: number;
  reportDate: string;
  unit: string;
  director: string;
  firstAD: string;
  
  crewCall: string;
  firstShot: string;
  lunchStart: string;
  lunchEnd: string;
  secondHalfStart: string;
  lastShot: string;
  cameraWrap: string;
  
  scenesPlanned: number;
  scenesShot: number;
  retakesCount: number;
  totalSetups: number;
  runningFootageMins: number;
  
  soundSyncStatus: 'Clean Sync' | 'Minor Ambient Noise' | 'ADR Flagged';
  dataBackedUpGB: number;
  delaysSummary: string;
  keyHighlights: string;
}

const DEFAULT_DSR: DsrSummaryData = {
  shootDayNo: 12,
  totalDays: 35,
  reportDate: new Date().toISOString().substring(0, 10),
  unit: 'Main Unit',
  director: 'Sujoy Ghosh',
  firstAD: 'Ananya Roy',
  
  crewCall: '06:30 AM',
  firstShot: '07:55 AM',
  lunchStart: '01:30 PM',
  lunchEnd: '02:15 PM',
  secondHalfStart: '02:20 PM',
  lastShot: '07:15 PM',
  cameraWrap: '07:35 PM',
  
  scenesPlanned: 3,
  scenesShot: 3,
  retakesCount: 4,
  totalSetups: 16,
  runningFootageMins: 42,
  
  soundSyncStatus: 'Clean Sync',
  dataBackedUpGB: 840,
  delaysSummary: '15 mins delay due to gas burner ignition valve replacement. Recovered before lunch.',
  keyHighlights: 'Quarter-final cook-off episode wrapped on schedule. High emotional drama achieved.'
};

export const ProductionDsrSummary: React.FC<ProductionDsrSummaryProps> = ({ project, onNavigateToFullDsr }) => {
  const projectId = project?.id || 'proj_default';
  const [dsr, setDsr] = useState<DsrSummaryData>(DEFAULT_DSR);
  const [isSaved, setIsSaved] = useState(false);

  // Subscribe to Firebase
  useEffect(() => {
    const unsub = subscribeDoc<DsrSummaryData>('production_dsr_summaries', projectId, (data) => {
      if (data && data.reportDate) {
        setDsr(data);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSave = () => {
    saveDocData('production_dsr_summaries', projectId, dsr);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">Daily Shooting Status Report (DSR)</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
              Day {dsr.shootDayNo} of {dsr.totalDays}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official daily production progress, timing milestones, scenes shot &amp; delay logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToFullDsr && (
            <button
              onClick={onNavigateToFullDsr}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Master DSR System</span>
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved!' : 'Save DSR Entry'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Scenes Shot / Target</span>
          <span className="text-lg font-black text-emerald-400">{dsr.scenesShot} / {dsr.scenesPlanned} Scenes</span>
          <span className="text-[10px] text-slate-500 block">100% Target Met</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Camera Setups</span>
          <span className="text-lg font-black text-cyan-400">{dsr.totalSetups} Setups</span>
          <span className="text-[10px] text-slate-500 block">{dsr.retakesCount} Retakes logged</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Footage Generated</span>
          <span className="text-lg font-black text-purple-400">{dsr.runningFootageMins} mins</span>
          <span className="text-[10px] text-slate-500 block">{dsr.dataBackedUpGB} GB RAW data</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Sound Sync</span>
          <span className="text-sm font-bold text-emerald-300 block mt-1">{dsr.soundSyncStatus}</span>
          <span className="text-[10px] text-slate-500 block">DIT dual verified</span>
        </div>
      </div>

      {/* Daily Shift Milestones Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Shift Timeline &amp; Timing Breakdown
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">Crew Call</span>
            <input 
              type="text" 
              value={dsr.crewCall} 
              onChange={e => setDsr({ ...dsr, crewCall: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-white outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">First Shot</span>
            <input 
              type="text" 
              value={dsr.firstShot} 
              onChange={e => setDsr({ ...dsr, firstShot: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-emerald-400 outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">Lunch Start</span>
            <input 
              type="text" 
              value={dsr.lunchStart} 
              onChange={e => setDsr({ ...dsr, lunchStart: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-slate-300 outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">Lunch End</span>
            <input 
              type="text" 
              value={dsr.lunchEnd} 
              onChange={e => setDsr({ ...dsr, lunchEnd: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-slate-300 outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">2nd Half In</span>
            <input 
              type="text" 
              value={dsr.secondHalfStart} 
              onChange={e => setDsr({ ...dsr, secondHalfStart: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-slate-300 outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">Last Shot</span>
            <input 
              type="text" 
              value={dsr.lastShot} 
              onChange={e => setDsr({ ...dsr, lastShot: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-cyan-400 outline-none"
            />
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] font-mono uppercase text-slate-500 block">Wrap Time</span>
            <input 
              type="text" 
              value={dsr.cameraWrap} 
              onChange={e => setDsr({ ...dsr, cameraWrap: e.target.value })}
              className="w-full text-center bg-transparent font-bold text-xs text-amber-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Delays & Key Highlights Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Production Delays &amp; Stoppage Analysis
          </label>
          <textarea
            rows={3}
            value={dsr.delaysSummary}
            onChange={e => setDsr({ ...dsr, delaysSummary: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500"
            placeholder="Log any delays, power cuts, equipment faults or weather stoppages..."
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Key Shoot Highlights &amp; Creative Notes
          </label>
          <textarea
            rows={3}
            value={dsr.keyHighlights}
            onChange={e => setDsr({ ...dsr, keyHighlights: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500"
            placeholder="Summarize key creative scenes completed, performances, and wrap notes..."
          />
        </div>
      </div>
    </div>
  );
};
