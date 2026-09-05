import React, { useState, useMemo, useEffect, useRef } from 'react';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import { formatCustomDate } from '../utils/indianHolidays';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2, 
  Calendar, 
  UserPlus, 
  Zap, 
  TrendingUp, 
  Sliders, 
  Activity, 
  Info, 
  Users, 
  Flag, 
  Star, 
  Play, 
  AlertCircle,
  Clock,
  Clock3,
  Edit3,
  Pencil,
  Settings,
  RefreshCw,
  Film,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { DBLog, Project } from '../types';
import { 
  generateDefaultPhasesForProject, 
  computeEndAndDays, 
  cleanYYYYMMDD, 
  TimelinePhase 
} from '../data';

function parseYYYYMMDDToMs(dateStr?: string, defaultFallbackMs?: number): number {
  if (!dateStr) return defaultFallbackMs ?? new Date(2024, 9, 1).getTime();
  const clean = cleanYYYYMMDD(dateStr);
  const parts = clean.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const ms = new Date(y, m, d).getTime();
  if (isNaN(ms)) return defaultFallbackMs ?? new Date(2024, 9, 1).getTime();
  return ms;
}

function isValidDateString(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const clean = dateStr.trim().split('T')[0].split(' ')[0];
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 2000 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

function sanitizeDateString(dateStr?: string, defaultFallback: string = '2024-10-01'): string {
  return cleanYYYYMMDD(dateStr, defaultFallback);
}

function sanitizePhase(p: TimelinePhase): TimelinePhase {
  const startDate = cleanYYYYMMDD(p.startDate, '2024-10-01');
  const endDate = cleanYYYYMMDD(p.endDate, '2024-11-15');
  
  const sMs = parseYYYYMMDDToMs(startDate);
  const eMs = parseYYYYMMDDToMs(endDate);
  
  let durationDays = p.durationDays;
  if (!durationDays || durationDays <= 0 || isNaN(sMs) || isNaN(eMs)) {
    durationDays = Math.max(1, Math.round((eMs - sMs) / (1000 * 60 * 60 * 24))) || 30;
  }
  
  return {
    ...p,
    startDate,
    endDate,
    durationDays
  };
}

function formatDateNice(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const clean = cleanYYYYMMDD(dateStr, '');
  if (!clean) return formatCustomDate(dateStr);
  return formatCustomDate(clean);
}

const DEFAULT_INITIAL_PHASES: TimelinePhase[] = [
  {
    id: 'phase-1',
    name: 'Pre-Production & Scripting',
    startDate: '2024-10-01',
    endDate: '2024-11-15',
    durationDays: 45,
    durationUnit: 'Days',
    startMonth: 0,
    duration: 2,
    progress: 100,
    status: 'Completed',
    color: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-400'
  },
  {
    id: 'phase-2',
    name: 'Principal Photography',
    startDate: '2024-11-16',
    endDate: '2025-01-15',
    durationDays: 60,
    durationUnit: 'Days',
    startMonth: 1,
    duration: 2,
    progress: 65,
    status: 'In Progress',
    color: 'bg-blue-950/80 text-blue-300 border-blue-900/60',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400'
  },
  {
    id: 'phase-3',
    name: 'Post-Production & Editing',
    startDate: '2025-01-16',
    endDate: '2025-03-15',
    durationDays: 58,
    durationUnit: 'Days',
    startMonth: 3,
    duration: 2,
    progress: 0,
    status: 'Scheduled',
    color: 'bg-slate-800 text-slate-300 border-slate-700',
    borderColor: 'border-slate-600',
    textColor: 'text-slate-400'
  }
];

interface Milestone {
  id: string;
  title: string;
  desc: string;
  status: 'Done' | 'In Review' | 'Pending';
  date: string;
}

interface AssignedTeamMember {
  id: string;
  name: string;
  role: string;
  phaseId: string;
  avatarUrl: string;
}

interface TimelineViewProps {
  projects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddLog: (log: DBLog) => void;
}

export default function TimelineView({ projects = [], selectedProjectId, onSelectProject, onAddLog }: TimelineViewProps) {
  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  const cleanProjId = useMemo(() => {
    if (!activeProject?.id) return 'default';
    return activeProject.id.startsWith('wp_') ? activeProject.id.substring(3) : activeProject.id;
  }, [activeProject?.id]);

  const isRemoteUpdatingRef = useRef<boolean>(false);
  const loadedProjIdRef = useRef<string>(cleanProjId);

  // Timeline Phases synced with localStorage & Firestore Server for active project
  const [phases, setPhases] = useState<TimelinePhase[]>(() => {
    if (!activeProject) return DEFAULT_INITIAL_PHASES.map(p => sanitizePhase(p));
    try {
      const key = `erp_timeline_${cleanProjId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          return parsed.phases.map((p: any) => sanitizePhase(p));
        }
      }
    } catch (e) {
      console.warn('Failed to parse timeline phases from localStorage', e);
    }
    return generateDefaultPhasesForProject(activeProject);
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    if (!activeProject) return [];
    try {
      const key = `erp_timeline_${cleanProjId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.milestones)) return parsed.milestones;
      }
    } catch {}
    
    const projStart = activeProject.startDate || new Date().toISOString().substring(0, 10);
    const projEnd = activeProject.endDate || '';
    
    if (!projStart) return [];

    return [
      { id: `m1_${cleanProjId}`, title: `${activeProject.name || 'Project'} Kickoff`, desc: 'Project initialization and setup', status: 'Done', date: projStart },
      ...(projEnd ? [{ id: `m2_${cleanProjId}`, title: 'Project Delivery & Wrap', desc: 'Final deliverables handover', status: 'Pending' as const, date: projEnd }] : [])
    ];
  });

  const [teamMembers, setTeamMembers] = useState<AssignedTeamMember[]>(() => {
    if (!activeProject) return [];
    try {
      const key = `erp_timeline_${cleanProjId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.teamMembers)) return parsed.teamMembers;
      }
    } catch {}
    return [];
  });

  // Calculate dynamic timeline bounds and column span from phase dates
  const timelineBounds = useMemo(() => {
    if (!phases || phases.length === 0) {
      const now = new Date();
      const minMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const maxMs = new Date(now.getFullYear(), now.getMonth() + 6, 0).getTime();
      return {
        minMs,
        maxMs,
        totalMs: maxMs - minMs,
        spanText: 'Active Schedule Span',
        monthCols: ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR']
      };
    }

    let minMs = Infinity;
    let maxMs = -Infinity;

    phases.forEach(p => {
      let sMs = parseYYYYMMDDToMs(p.startDate);
      let eMs = parseYYYYMMDDToMs(p.endDate);
      if (isNaN(eMs)) {
        const dDays = p.durationDays || (p.duration ? p.duration * 30 : 30);
        eMs = sMs + dDays * 24 * 60 * 60 * 1000;
      }

      if (sMs < minMs) minMs = sMs;
      if (eMs > maxMs) maxMs = eMs;
    });

    if (minMs === Infinity || maxMs === -Infinity || minMs >= maxMs) {
      const now = new Date();
      minMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      maxMs = new Date(now.getFullYear(), now.getMonth() + 6, 0).getTime();
    }

    // Add 2 padding days on left and right for clean visual margins
    const minPadded = minMs - 2 * 24 * 60 * 60 * 1000;
    const maxPadded = maxMs + 2 * 24 * 60 * 60 * 1000;
    const totalMs = Math.max(1, maxPadded - minPadded);

    const startD = new Date(minMs);
    const endD = new Date(maxMs);

    // Build month column labels
    const cols: string[] = [];
    let curr = new Date(startD.getFullYear(), startD.getMonth(), 1);
    const endMonth = new Date(endD.getFullYear(), endD.getMonth(), 1);

    while (curr <= endMonth || cols.length < 3) {
      cols.push(
        curr.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() + " '" + curr.getFullYear().toString().slice(-2)
      );
      curr.setMonth(curr.getMonth() + 1);
    }

    const spanText = `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return {
      minMs: minPadded,
      maxMs: maxPadded,
      totalMs,
      spanText,
      monthCols: cols
    };
  }, [phases]);

  // Subscribe to Timeline Data from Firestore Server
  useEffect(() => {
    if (!activeProject?.id) return;
    const storageKey = `erp_timeline_${cleanProjId}`;
    const docId = `timeline_${cleanProjId}`;

    // Mark current project ID as loaded for this active subscription
    loadedProjIdRef.current = cleanProjId;

    let restoredLocal = false;
    // 1. Instantly restore from localStorage
    try {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          setPhases(parsed.phases.map((p: any) => sanitizePhase(p)));
          restoredLocal = true;
        }
        if (Array.isArray(parsed.milestones)) setMilestones(parsed.milestones);
        if (Array.isArray(parsed.teamMembers)) setTeamMembers(parsed.teamMembers);
      }
    } catch {}

    if (!restoredLocal) {
      const defaultP = generateDefaultPhasesForProject(activeProject);
      setPhases(defaultP);
      setMilestones([
        { id: `m1_${cleanProjId}`, title: 'Pre-Production & Script Lock', desc: 'Screenplay approved and budget frozen', status: 'Done', date: defaultP[0]?.startDate || '2026-08-01' },
        { id: `m2_${cleanProjId}`, title: 'Principal Photography Day 1', desc: 'Call sheet issued and camera setup', status: 'In Review', date: defaultP[1]?.startDate || '2026-09-15' },
        { id: `m3_${cleanProjId}`, title: 'Picture Lock & Sound Mix', desc: 'Final picture cut locked', status: 'Pending', date: defaultP[2]?.startDate || '2026-11-15' },
        { id: `m4_${cleanProjId}`, title: 'Theatrical Release', desc: 'Worldwide release', status: 'Pending', date: defaultP[3]?.startDate || '2027-01-15' }
      ]);
      setTeamMembers([]);
    }

    // 2. Subscribe to Firestore
    const unsub = subscribeDoc<any>('settings', docId, (data) => {
      if (data) {
        isRemoteUpdatingRef.current = true;
        if (Array.isArray(data.phases) && data.phases.length > 0) {
          const sanitized = data.phases.map((p: any) => sanitizePhase(p));
          setPhases(sanitized);
        }
        if (Array.isArray(data.milestones)) setMilestones(data.milestones);
        if (Array.isArray(data.teamMembers)) setTeamMembers(data.teamMembers);
        setTimeout(() => { isRemoteUpdatingRef.current = false; }, 100);
      }
    });
    return () => unsub();
  }, [cleanProjId, activeProject?.startDate]);

  // Sync Timeline Data to localStorage & Firestore Server when updated
  useEffect(() => {
    if (!cleanProjId || cleanProjId === 'default') return;
    // Strictly ensure we only save if state belongs to the current cleanProjId
    if (loadedProjIdRef.current !== cleanProjId) return;

    if (phases.length > 0 || milestones.length > 0 || teamMembers.length > 0) {
      const storageKey = `erp_timeline_${cleanProjId}`;
      const docId = `timeline_${cleanProjId}`;

      const payload = { phases, milestones, teamMembers };
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save timeline data to localStorage:', e);
      }

      if (!isRemoteUpdatingRef.current) {
        saveDocData('settings', docId, payload);
      }
    }
  }, [phases, milestones, teamMembers, cleanProjId]);

  // Form & Interaction States
  const [velocityBoost, setVelocityBoost] = useState<number>(84);
  const [boosted, setBoosted] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedPhaseForEdit, setSelectedPhaseForEdit] = useState<TimelinePhase | null>(null);
  const [editingPhaseModal, setEditingPhaseModal] = useState<TimelinePhase | null>(null);

  // Modals / Dropdowns
  const [showAddPhaseModal, setShowAddPhaseModal] = useState<boolean>(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState<boolean>(false);
  const [showAssignResourceModal, setShowAssignResourceModal] = useState<boolean>(false);

  // Project Production Timeline Schedule Modal State
  const [showScheduleConfigModal, setShowScheduleConfigModal] = useState<boolean>(false);
  const [modalPreStart, setModalPreStart] = useState<string>('');
  const [modalPreDays, setModalPreDays] = useState<number>(45);
  const [modalShootStart, setModalShootStart] = useState<string>('');
  const [modalShootDays, setModalShootDays] = useState<number>(60);
  const [modalPostDays, setModalPostDays] = useState<number>(60);
  const [modalTargetRelease, setModalTargetRelease] = useState<string>('');

  const handleOpenScheduleModal = () => {
    const sched = activeProject?.schedule || {};
    const firstPhaseStart = phases[0]?.startDate || activeProject?.startDate || new Date().toISOString().substring(0, 10);
    
    setModalPreStart(sched.preProductionStartDate || firstPhaseStart);
    setModalPreDays(sched.preProductionDays || phases[0]?.durationDays || 45);
    setModalShootStart(sched.shootingStartDate || phases[1]?.startDate || '');
    setModalShootDays(sched.shootingDays || phases[1]?.durationDays || 60);
    setModalPostDays(sched.postProductionDays || phases[2]?.durationDays || 60);
    setModalTargetRelease(sched.targetReleaseDate || phases[3]?.startDate || '');
    setShowScheduleConfigModal(true);
  };

  const handleSaveProjectSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    const pStart = cleanYYYYMMDD(modalPreStart, new Date().toISOString().substring(0, 10));
    const pEnd = computeEndAndDays(pStart, modalPreDays, 'Days').endDateStr;
    const sStart = cleanYYYYMMDD(modalShootStart || pEnd, pEnd);
    const sEnd = computeEndAndDays(sStart, modalShootDays, 'Days').endDateStr;
    const poStart = sEnd;
    const poEnd = computeEndAndDays(poStart, modalPostDays, 'Days').endDateStr;
    const relDate = cleanYYYYMMDD(modalTargetRelease || poEnd, poEnd);

    const updatedSchedule = {
      preProductionStartDate: pStart,
      preProductionDays: modalPreDays,
      shootingStartDate: sStart,
      shootingDays: modalShootDays,
      postProductionStartDate: poStart,
      postProductionDays: modalPostDays,
      targetReleaseDate: relDate
    };

    activeProject.schedule = updatedSchedule;

    const newPhases = generateDefaultPhasesForProject(activeProject);
    setPhases(newPhases);

    const newMilestones: Milestone[] = [
      { id: `m1_${cleanProjId}`, title: 'Pre-Production & Script Lock', desc: 'Screenplay approved and budget frozen', status: 'Done', date: pStart },
      { id: `m2_${cleanProjId}`, title: 'Principal Photography Day 1', desc: 'Call sheet issued and camera setup', status: 'In Review', date: sStart },
      { id: `m3_${cleanProjId}`, title: 'Picture Lock & Sound Mix', desc: 'Final picture cut locked', status: 'Pending', date: poStart },
      { id: `m4_${cleanProjId}`, title: 'Theatrical Release', desc: 'Worldwide release', status: 'Pending', date: relDate }
    ];
    setMilestones(newMilestones);

    const storageKey = `erp_timeline_${cleanProjId}`;
    const docId = `timeline_${cleanProjId}`;
    const payload = { phases: newPhases, milestones: newMilestones, teamMembers };

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {}
    saveDocData('settings', docId, payload);

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_sched_recalc_${Date.now()}`,
      timestamp,
      action: 'SYS_PROJECT_SCHEDULE_RECALCULATE',
      sqlQuery: `UPDATE project_schedule SET pre_prod_start='${pStart}', shoot_start='${sStart}', target_release='${relDate}' WHERE project_id='${cleanProjId}';`,
      status: 'success'
    });

    setShowScheduleConfigModal(false);
  };

  // New Phase Form (Date-wise)
  const [newPhaseName, setNewPhaseName] = useState<string>('');
  const [newPhaseStartDate, setNewPhaseStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newPhaseDurationVal, setNewPhaseDurationVal] = useState<number>(30);
  const [newPhaseDurationUnit, setNewPhaseDurationUnit] = useState<'Days' | 'Weeks' | 'Months'>('Days');
  const [newPhaseProgress, setNewPhaseProgress] = useState<number>(0);
  const [newPhaseStatus, setNewPhaseStatus] = useState<'Completed' | 'In Progress' | 'Scheduled' | 'Deferred'>('Scheduled');

  // New Milestone Form
  const [newMTitle, setNewMTitle] = useState<string>('');
  const [newMDesc, setNewMDesc] = useState<string>('');
  const [newMStatus, setNewMStatus] = useState<'Done' | 'In Review' | 'Pending'>('Pending');
  const [newMDate, setNewMDate] = useState<string>('');

  // New Resource Assignment Form
  const [newResName, setNewResName] = useState<string>('');
  const [newResRole, setNewResRole] = useState<string>('');
  const [newResPhase, setNewResPhase] = useState<string>('phase-2');
  const [newResAvatar, setNewResAvatar] = useState<string>('https://lh3.googleusercontent.com/aida-public/AB6AXuCxYF1-nVY5VZfvjzlomjEbt0PyIK0apwBiEJwSusBVz1DZpHr9lzuwPJrGkhpCE5tVIeKg48RYRwmTpacaqQ9hp71V--C7h_yX1TuAuOA-PlB_reIFMbGb2WkczmQULKnsIgd8n3njC1a-Y_MvWEZX4ctAhLAZEsxIIhODoAyPD161K2qN46pUZ1AHHkd3VZ0ear0iXMH1NZ1yjY4DEVOpT8mpGMxEOta_N4cke6-cGrSXVYa3pAoDr1cvMW8H6KeC40cj9N0EY8A');

  // Velocity boost click handler
  const handleBoostVelocity = () => {
    if (boosted) return;
    setBoosted(true);
    setVelocityBoost(92);
    
    // Update Production Phase progress to reflect faster timeline completion
    setPhases(prev => prev.map(p => {
      if (p.id === 'phase-2') {
        return { ...p, progress: 85 };
      }
      return p;
    }));

    // Create a transaction log
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sqlStatement = `UPDATE timeline_configuration SET velocity_threshold = 92, target_acceleration_factor = 1.15 WHERE project_id = 'p_active';
UPDATE timeline_phases SET progress = 85 WHERE phase_id = 'phase-2';`;

    const log: DBLog = {
      id: `l_timeline_boost_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_ACCELERATE',
      sqlQuery: sqlStatement,
      status: 'success'
    };
    onAddLog(log);
  };

  // Add Phase Handler (Date-wise)
  const handleCreatePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;

    const id = `phase-${Date.now()}`;
    let color = 'bg-slate-800 text-slate-300 border-slate-700';
    let borderColor = 'border-slate-600';
    let textColor = 'text-slate-400';

    if (newPhaseStatus === 'Completed') {
      color = 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60';
      borderColor = 'border-emerald-500';
      textColor = 'text-emerald-400';
    } else if (newPhaseStatus === 'In Progress') {
      color = 'bg-blue-950/80 text-blue-300 border-blue-900/60';
      borderColor = 'border-blue-500';
      textColor = 'text-blue-400';
    } else if (newPhaseStatus === 'Deferred') {
      color = 'bg-rose-950/80 text-rose-300 border-rose-900/60';
      borderColor = 'border-rose-500';
      textColor = 'text-rose-400';
    }

    const { endDateStr, totalDays } = computeEndAndDays(newPhaseStartDate, newPhaseDurationVal, newPhaseDurationUnit);
    const startMs = parseYYYYMMDDToMs(newPhaseStartDate);
    const parsedStartMonth = new Date(startMs).getMonth() % 6;

    const newPhase: TimelinePhase = {
      id,
      name: newPhaseName,
      startDate: newPhaseStartDate,
      endDate: endDateStr,
      durationDays: totalDays,
      durationUnit: newPhaseDurationUnit,
      startMonth: isNaN(parsedStartMonth) ? 0 : parsedStartMonth,
      duration: Math.max(1, Math.round(totalDays / 30)),
      progress: Number(newPhaseProgress),
      status: newPhaseStatus,
      color,
      borderColor,
      textColor
    };

    setPhases([...phases, newPhase]);

    // DB Log
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `INSERT INTO timeline_phases (phase_id, project_id, phase_name, start_date, end_date, duration_days, progress, status) 
VALUES ('${id}', 'p_active', '${newPhaseName.replace(/'/g, "''")}', '${newPhaseStartDate}', '${endDateStr}', ${totalDays}, ${newPhaseProgress}, '${newPhaseStatus}');`;

    onAddLog({
      id: `l_phase_add_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_PHASE_INSERT',
      sqlQuery: sql,
      status: 'success'
    });

    // Reset Form
    setNewPhaseName('');
    setShowAddPhaseModal(false);
  };

  // Phase date modification handler
  const handlePhaseDateChange = (phaseId: string, field: 'startDate' | 'endDate' | 'durationDays', value: any) => {
    if ((field === 'startDate' || field === 'endDate') && !isValidDateString(value)) {
      return; // Do not commit incomplete or invalid date strings to state/Firestore
    }

    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        const updated = { ...p };
        if (field === 'startDate') {
          const sDate = sanitizeDateString(value, p.startDate || '2024-10-01');
          const dDays = p.durationDays || 30;
          const { endDateStr, totalDays } = computeEndAndDays(sDate, dDays, 'Days');
          updated.startDate = sDate;
          updated.endDate = endDateStr;
          updated.durationDays = totalDays;
          updated.duration = Math.max(1, Math.round(totalDays / 30));
        } else if (field === 'durationDays') {
          const sDate = p.startDate || '2024-10-01';
          const dDays = Math.max(1, Number(value) || 1);
          const { endDateStr, totalDays } = computeEndAndDays(sDate, dDays, 'Days');
          updated.startDate = sDate;
          updated.endDate = endDateStr;
          updated.durationDays = totalDays;
          updated.duration = Math.max(1, Math.round(totalDays / 30));
        } else if (field === 'endDate') {
          const sDate = p.startDate || '2024-10-01';
          const eDate = sanitizeDateString(value, p.endDate || '2024-11-15');
          const startMs = parseYYYYMMDDToMs(sDate);
          const endMs = parseYYYYMMDDToMs(eDate);
          if (!isNaN(startMs) && !isNaN(endMs)) {
            const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
            updated.endDate = eDate;
            updated.durationDays = diffDays;
            updated.duration = Math.max(1, Math.round(diffDays / 30));
          }
        }
        return updated;
      }
      return p;
    }));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `UPDATE timeline_phases SET ${field} = '${value}' WHERE phase_id = '${phaseId}';`;
    onAddLog({
      id: `l_phase_date_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_PHASE_UPDATE',
      sqlQuery: sql,
      status: 'success'
    });
  };

  // Phase edit slider/progress change
  const handlePhaseSliderChange = (phaseId: string, field: 'startMonth' | 'duration' | 'progress', value: number) => {
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        const updated = { ...p, [field]: value };
        // Automatically determine status
        if (field === 'progress') {
          if (value === 100) {
            updated.status = 'Completed';
            updated.color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            updated.borderColor = 'border-emerald-500';
            updated.textColor = 'text-emerald-700';
          } else if (value > 0) {
            updated.status = 'In Progress';
            updated.color = 'bg-blue-50 text-blue-900 border-blue-200';
            updated.borderColor = 'border-[#0058be]';
            updated.textColor = 'text-[#0058be]';
          } else {
            updated.status = 'Scheduled';
            updated.color = 'bg-slate-50 text-slate-700 border-slate-200';
            updated.borderColor = 'border-slate-400';
            updated.textColor = 'text-slate-600';
          }
        }
        return updated;
      }
      return p;
    }));

    // Throttled / batched database logs simulation
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `UPDATE timeline_phases SET ${field === 'startMonth' ? 'start_index' : field === 'duration' ? 'duration_months' : 'progress'} = ${value} WHERE phase_id = '${phaseId}';`;
    onAddLog({
      id: `l_phase_mod_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_PHASE_UPDATE',
      sqlQuery: sql,
      status: 'success'
    });
  };

  // Delete Phase
  const handleDeletePhase = (phaseId: string) => {
    setPhases(prev => prev.filter(p => p.id !== phaseId));
    if (selectedPhaseForEdit?.id === phaseId) {
      setSelectedPhaseForEdit(null);
    }
    if (editingPhaseModal?.id === phaseId) {
      setEditingPhaseModal(null);
    }
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_phase_del_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_PHASE_DELETE',
      sqlQuery: `DELETE FROM timeline_phases WHERE phase_id = '${phaseId}';`,
      status: 'success'
    });
  };

  // Phase Name inline update
  const handlePhaseNameChange = (phaseId: string, newName: string) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, name: newName } : p));
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_phase_rename_${Date.now()}`,
      timestamp,
      action: 'SYS_TIMELINE_PHASE_UPDATE',
      sqlQuery: `UPDATE timeline_phases SET phase_name = '${newName.replace(/'/g, "''")}' WHERE phase_id = '${phaseId}';`,
      status: 'success'
    });
  };

  // Modal Phase field updater
  const handleUpdateModalPhaseField = (field: string, value: any) => {
    if (!editingPhaseModal) return;
    let updated = { ...editingPhaseModal };

    if (field === 'name') {
      updated.name = value;
    } else if (field === 'status') {
      updated.status = value;
      if (value === 'Completed') {
        updated.color = 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60';
        updated.borderColor = 'border-emerald-500';
        updated.textColor = 'text-emerald-400';
      } else if (value === 'In Progress') {
        updated.color = 'bg-blue-950/80 text-blue-300 border-blue-900/60';
        updated.borderColor = 'border-blue-500';
        updated.textColor = 'text-blue-400';
      } else if (value === 'Deferred') {
        updated.color = 'bg-rose-950/80 text-rose-300 border-rose-900/60';
        updated.borderColor = 'border-rose-500';
        updated.textColor = 'text-rose-400';
      } else {
        updated.color = 'bg-slate-800 text-slate-300 border-slate-700';
        updated.borderColor = 'border-slate-600';
        updated.textColor = 'text-slate-400';
      }
    } else if (field === 'progress') {
      updated.progress = Number(value);
    } else if (field === 'startDate') {
      updated.startDate = value;
      if (isValidDateString(value)) {
        const sDate = value;
        const dDays = updated.durationDays || 30;
        const { endDateStr, totalDays } = computeEndAndDays(sDate, dDays, 'Days');
        updated.endDate = endDateStr;
        updated.durationDays = totalDays;
        updated.duration = Math.max(1, Math.round(totalDays / 30));
      }
    } else if (field === 'durationDays') {
      const dDays = Math.max(1, Number(value) || 1);
      updated.durationDays = dDays;
      const sDate = updated.startDate || '2024-10-01';
      if (isValidDateString(sDate)) {
        const { endDateStr, totalDays } = computeEndAndDays(sDate, dDays, 'Days');
        updated.endDate = endDateStr;
        updated.duration = Math.max(1, Math.round(totalDays / 30));
      }
    } else if (field === 'endDate') {
      updated.endDate = value;
      if (isValidDateString(value)) {
        const sDate = updated.startDate || '2024-10-01';
        const startMs = parseYYYYMMDDToMs(sDate);
        const endMs = parseYYYYMMDDToMs(value);
        if (!isNaN(startMs) && !isNaN(endMs)) {
          const diffDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
          updated.durationDays = diffDays;
          updated.duration = Math.max(1, Math.round(diffDays / 30));
        }
      }
    }

    setEditingPhaseModal(updated);

    // Only commit to global phases state and Firestore if dates are valid 4-digit year dates
    if (isValidDateString(updated.startDate) && isValidDateString(updated.endDate)) {
      const cleanPhase = sanitizePhase(updated);
      setPhases(prev => prev.map(p => p.id === cleanPhase.id ? cleanPhase : p));

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_phase_edit_${Date.now()}`,
        timestamp,
        action: 'SYS_TIMELINE_PHASE_UPDATE',
        sqlQuery: `UPDATE timeline_phases SET phase_name = '${cleanPhase.name.replace(/'/g, "''")}', start_date = '${cleanPhase.startDate}', end_date = '${cleanPhase.endDate}', duration_days = ${cleanPhase.durationDays}, status = '${cleanPhase.status}', progress = ${cleanPhase.progress} WHERE phase_id = '${cleanPhase.id}';`,
        status: 'success'
      });
    }
  };

  // Add Milestone Handler
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMTitle.trim()) return;

    const id = `m-${Date.now()}`;
    const newMilestone: Milestone = {
      id,
      title: newMTitle,
      desc: newMDesc || 'Assigned milestone objective.',
      status: newMStatus,
      date: newMDate || 'TBD'
    };

    setMilestones([...milestones, newMilestone]);

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `INSERT INTO milestones (milestone_id, project_id, title, description, status, target_date) 
VALUES ('${id}', 'p_active', '${newMTitle.replace(/'/g, "''")}', '${newMDesc.replace(/'/g, "''")}', '${newMStatus}', '${newMDate}');`;

    onAddLog({
      id: `l_ms_add_${Date.now()}`,
      timestamp,
      action: 'SYS_MILESTONE_INSERT',
      sqlQuery: sql,
      status: 'success'
    });

    setNewMTitle('');
    setNewMDesc('');
    setNewMDate('');
    setShowAddMilestoneModal(false);
  };

  // Toggle Milestone Status
  const handleToggleMilestone = (id: string) => {
    let nextStatus: 'Done' | 'In Review' | 'Pending' = 'Done';
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        nextStatus = m.status === 'Done' ? 'Pending' : 'Done';
        return { ...m, status: nextStatus };
      }
      return m;
    }));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `UPDATE milestones SET status = '${nextStatus}' WHERE milestone_id = '${id}';`;

    onAddLog({
      id: `l_ms_toggle_${Date.now()}`,
      timestamp,
      action: 'SYS_MILESTONE_TOGGLE',
      sqlQuery: sql,
      status: 'success'
    });
  };

  // Delete Milestone
  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `DELETE FROM milestones WHERE milestone_id = '${id}';`;

    onAddLog({
      id: `l_ms_delete_${Date.now()}`,
      timestamp,
      action: 'SYS_MILESTONE_DELETE',
      sqlQuery: sql,
      status: 'success'
    });
  };

  // Assign Resource Handler
  const handleAssignResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;

    const id = `team-${Date.now()}`;
    const newMember: AssignedTeamMember = {
      id,
      name: newResName,
      role: newResRole || 'Operations Assistant',
      phaseId: newResPhase,
      avatarUrl: newResAvatar
    };

    setTeamMembers([...teamMembers, newMember]);

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `INSERT INTO staff_assignments (id, staff_name, role, phase_id) VALUES ('${id}', '${newResName.replace(/'/g, "''")}', '${newResRole.replace(/'/g, "''")}', '${newResPhase}');`;

    onAddLog({
      id: `l_res_assign_${Date.now()}`,
      timestamp,
      action: 'SYS_RESOURCE_ASSIGN',
      sqlQuery: sql,
      status: 'success'
    });

    setNewResName('');
    setNewResRole('');
    setShowAssignResourceModal(false);
  };

  // Unassign resource
  const handleUnassignResource = (id: string) => {
    setTeamMembers(prev => prev.filter(t => t.id !== id));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sql = `DELETE FROM staff_assignments WHERE id = '${id}';`;

    onAddLog({
      id: `l_res_unassign_${Date.now()}`,
      timestamp,
      action: 'SYS_RESOURCE_UNASSIGN',
      sqlQuery: sql,
      status: 'success'
    });
  };

  return (
    <div id="production-timeline-view-wrapper" className="space-y-4 text-slate-100">
      
      {/* View Header with Navigation & Mode toggling */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xs">
        <div>
          <nav className="flex items-center gap-1 mb-1 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            <span>Projects</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300 max-w-[200px] truncate">{activeProject?.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-blue-400">Timeline Scheduling</span>
          </nav>
          <h2 className="text-base font-bold text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Production Timeline
          </h2>
          <p className="text-[11px] text-slate-400">
            Coordinate workflow phases, track milestones, and manage resources for <span className="font-semibold text-slate-200">{activeProject?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleOpenScheduleModal}
            className="h-8 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Configure Project Production Schedule Parameters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Project Schedule Config</span>
          </button>

          <button 
            onClick={() => setShowAddPhaseModal(true)}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Phase</span>
          </button>

          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex">
            <button 
              onClick={() => setActiveViewMode('timeline')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeViewMode === 'timeline' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline Graph
            </button>
            <button 
              onClick={() => setActiveViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                activeViewMode === 'grid' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Controls
            </button>
          </div>
        </div>
      </div>

      {/* Main Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Column 1: Gantt Schedule Visualizer */}
        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col min-h-[450px]">
          
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/40 flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">Gantt Schedule Map</span>
            </div>
            <div className="text-[10px] font-mono text-blue-400 font-bold uppercase bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-900">
              ACTIVE SPAN: {timelineBounds.spanText}
            </div>
          </div>

          {/* Active Gantt Body */}
          <div className="flex-1 p-4 overflow-x-auto relative">
            <div className="min-w-[680px] space-y-4">
              
              {/* Month Header Columns */}
              <div className="flex border-b border-slate-800 pb-2">
                <div className="w-52 shrink-0 text-[10px] font-bold font-mono text-slate-400 uppercase">PHASE / WORKFLOW & DATES</div>
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${timelineBounds.monthCols.length}, minmax(0, 1fr))` }}>
                  {timelineBounds.monthCols.map((m, idx) => (
                    <div key={idx} className="text-center text-[10px] font-bold font-mono text-slate-400 truncate">
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* Phases Rendering */}
              <div className="space-y-3 relative">
                
                {/* Vertical grid lines */}
                <div className="absolute left-52 right-0 top-0 bottom-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${timelineBounds.monthCols.length}, minmax(0, 1fr))` }}>
                  {timelineBounds.monthCols.map((_, i) => (
                    <div key={i} className="border-r border-slate-800/60 h-full border-dashed"></div>
                  ))}
                </div>

                {phases.map((phase) => {
                  const sMs = parseYYYYMMDDToMs(phase.startDate, timelineBounds.minMs);
                  const eMs = parseYYYYMMDDToMs(phase.endDate, sMs + (phase.durationDays || 30) * 24 * 60 * 60 * 1000);
                  const durationDays = phase.durationDays || Math.max(1, Math.round((eMs - sMs) / (1000 * 60 * 60 * 24)));

                  const rawStartPct = ((sMs - timelineBounds.minMs) / timelineBounds.totalMs) * 100;
                  const rawWidthPct = ((eMs - sMs) / timelineBounds.totalMs) * 100;

                  const startPercent = Math.max(0, Math.min(95, rawStartPct));
                  const percentWidth = Math.max(2, Math.min(100 - startPercent, rawWidthPct));

                  return (
                    <div key={phase.id} className="flex items-center group relative z-10">
                      
                      {/* Left Phase Identity & Details */}
                      <div className="w-52 shrink-0 pr-3">
                        <div className="flex items-center justify-between gap-1 group/title">
                          <span className="text-xs font-bold text-white leading-tight block truncate" title={phase.name}>{phase.name}</span>
                          <button 
                            onClick={() => setEditingPhaseModal(phase)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
                            title="Edit Phase / Workflow Name & Dates"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-slate-300">
                            {phase.status}
                          </span>
                          <button
                            onClick={() => setEditingPhaseModal(phase)}
                            className="text-[9px] font-mono font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Click to edit dates"
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDateNice(phase.startDate)} → {formatDateNice(phase.endDate)} ({durationDays}d)
                          </button>
                        </div>
                      </div>

                      {/* Right Grid Track containing the bar */}
                      <div className="flex-1 relative h-10 bg-slate-800/50 rounded-lg border border-slate-800 flex items-center">
                        <div 
                          className={`absolute h-7 rounded-md border ${phase.color} shadow-2xs flex items-center px-2.5 justify-between group-hover:brightness-110 transition-all`}
                          style={{ 
                            left: `${startPercent}%`, 
                            width: `${percentWidth}%`,
                            minWidth: '50px'
                          }}
                        >
                          <div className="overflow-hidden whitespace-nowrap mr-1 flex items-center gap-1">
                            {phase.status === 'Completed' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {phase.status === 'In Progress' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping shrink-0"></span>}
                            <span className="text-[10px] font-bold font-mono text-white truncate">
                              {phase.progress}% ({durationDays}d)
                            </span>
                          </div>

                          <button 
                            onClick={() => setEditingPhaseModal(phase)}
                            className="text-[9px] font-mono font-bold bg-slate-900/90 hover:bg-slate-900 text-blue-400 hover:text-white border border-slate-700 rounded px-1.5 py-0.5 cursor-pointer transition-all shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1"
                            title="Edit phase & dates"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Vertical TODAY line overlay */}
                {(() => {
                  const nowMs = new Date().getTime();
                  const todayPct = ((nowMs - timelineBounds.minMs) / timelineBounds.totalMs) * 100;
                  if (todayPct < 0 || todayPct > 100) return null;
                  return (
                    <div className="absolute top-0 bottom-0 pointer-events-none z-20" style={{ left: `calc(208px + (100% - 208px) * ${todayPct / 100})` }}>
                      <div className="w-[1.5px] h-full bg-rose-500 relative">
                        <div className="absolute -top-1 -left-[3.5px] w-2 h-2 rounded-full bg-rose-500"></div>
                        <div className="absolute -top-4 -left-7 bg-rose-500 text-white text-[8px] font-mono font-black rounded px-1 py-0.2 shadow-2xs">
                          TODAY
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          </div>

          {/* Inline Slider Config Tool for clicked Phase */}
          {selectedPhaseForEdit && (
            <div className="border-t border-slate-800 bg-slate-800/60 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    Configure Area: {selectedPhaseForEdit.name}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedPhaseForEdit(null)}
                  className="text-[10px] font-mono text-slate-400 hover:text-white font-bold uppercase cursor-pointer"
                >
                  ✕ Close Configuration
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                  <span>PHASE / WORKFLOW TITLE</span>
                </div>
                <input 
                  type="text"
                  value={selectedPhaseForEdit.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handlePhaseNameChange(selectedPhaseForEdit.id, newName);
                    setSelectedPhaseForEdit(prev => prev ? { ...prev, name: newName } : null);
                  }}
                  className="w-full h-8 bg-slate-800 border border-slate-700 rounded px-2 text-xs font-bold font-sans text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span>START DATE</span>
                    <span className="text-white font-semibold">{formatDateNice(selectedPhaseForEdit.startDate)}</span>
                  </div>
                  <input 
                    type="date"
                    value={selectedPhaseForEdit.startDate || ''}
                    onChange={(e) => {
                      handlePhaseDateChange(selectedPhaseForEdit.id, 'startDate', e.target.value);
                      setSelectedPhaseForEdit(prev => prev ? { ...prev, startDate: e.target.value } : null);
                    }}
                    className="w-full h-8 bg-slate-800 border border-slate-700 rounded px-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span>DURATION (DAYS)</span>
                    <span className="text-white font-semibold">{selectedPhaseForEdit.durationDays || (selectedPhaseForEdit.duration * 30)} days</span>
                  </div>
                  <input 
                    type="number"
                    min="1"
                    value={selectedPhaseForEdit.durationDays || (selectedPhaseForEdit.duration * 30)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handlePhaseDateChange(selectedPhaseForEdit.id, 'durationDays', val);
                      setSelectedPhaseForEdit(prev => prev ? { ...prev, durationDays: val } : null);
                    }}
                    className="w-full h-8 bg-slate-800 border border-slate-700 rounded px-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400">
                    <span>COMPLETION PERCENTAGE</span>
                    <span className="text-white font-semibold">{selectedPhaseForEdit.progress}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedPhaseForEdit.progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handlePhaseSliderChange(selectedPhaseForEdit.id, 'progress', val);
                      setSelectedPhaseForEdit(prev => prev ? { ...prev, progress: val } : null);
                    }}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-3"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Quick System Warning Info Strip */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-800/30 flex items-start gap-2 text-[11px] text-slate-400 leading-normal">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Adjusting the interactive sliders dynamically updates the timeline parameters. All duration shifting, timeline restructuring, and parameter synchronization requests generate audit records logged in the central <strong>Log Viewer</strong> tab.
            </p>
          </div>

        </div>

        {/* Column 2: Milestones & Project Acceleration */}
        <div className="md:col-span-4 space-y-4">

          {/* Milestones Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xs p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">Critical Milestones</span>
              </div>
              <button 
                onClick={() => setShowAddMilestoneModal(true)}
                className="text-[10px] font-mono text-blue-400 hover:underline font-bold cursor-pointer"
              >
                + New Milestone
              </button>
            </div>

            <div className="space-y-2.5">
              {milestones.map((ms) => (
                <div key={ms.id} className="p-2.5 border border-slate-800 rounded-lg bg-slate-800/40 flex items-start gap-2.5 relative group">
                  <button 
                    onClick={() => handleToggleMilestone(ms.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      ms.status === 'Done' 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-slate-800 border-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {ms.status === 'Done' && <Check className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 pr-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white leading-tight">{ms.title}</span>
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                        ms.status === 'Done' 
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/60' 
                          : ms.status === 'In Review' 
                            ? 'bg-amber-950/80 text-amber-400 border-amber-900/60' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {ms.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{ms.desc}</p>
                    
                    <div className="flex items-center gap-1 text-[9px] text-blue-400 font-mono font-bold mt-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{ms.date}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteMilestone(ms.id)}
                    className="absolute top-2.5 right-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* Completion Velocity Acceleration Card */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 relative overflow-hidden shadow-2xs space-y-3">
            <div className="relative z-10">
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">Project Performance</span>
              
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-black font-sans tracking-tight text-white">{velocityBoost}%</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +5.2% ACCELERATED
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Current performance projections indicate project deliverables are tracking 4 days ahead of scheduled milestones. 
              </p>

              <div className="pt-3">
                <button 
                  onClick={handleBoostVelocity}
                  disabled={boosted}
                  className={`w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    boosted ? 'opacity-50 pointer-events-none bg-slate-800 text-slate-500 border border-slate-700' : ''
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{boosted ? 'Acceleration Protocol Enabled' : 'Accelerate Target Schedule'}</span>
                </button>
              </div>
            </div>

            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-600/10 rounded-full"></div>
            <div className="absolute right-4 top-2 w-12 h-12 bg-white/5 rounded-full blur-xl"></div>
          </div>

        </div>

      </div>

      {/* Grid Mode: Raw controls interactive panel */}
      {activeViewMode === 'grid' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xs p-4 space-y-3 animate-fade-in">
          <div className="border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Interactive Phase Restructuring Parameters
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct spreadsheet-style inputs to modify active operational start dates and durations.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/60 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="p-2.5 pl-3">Phase Name</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Start Date</th>
                  <th className="p-2.5">Duration (Days)</th>
                  <th className="p-2.5">End Date</th>
                  <th className="p-2.5">Completion Rate</th>
                  <th className="p-2.5 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-200 font-sans">
                {phases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 pl-3 font-bold text-white">
                      <input 
                        type="text"
                        value={p.name}
                        onChange={(e) => handlePhaseNameChange(p.id, e.target.value)}
                        className="w-full min-w-[120px] bg-slate-800 border border-slate-700 focus:border-blue-500 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <select 
                        value={p.status}
                        onChange={(e) => {
                          const status = e.target.value as any;
                          setPhases(prev => prev.map(item => {
                            if (item.id === p.id) {
                              let color = 'bg-slate-800 text-slate-300 border-slate-700';
                              let borderColor = 'border-slate-600';
                              let textColor = 'text-slate-400';
                              if (status === 'Completed') {
                                color = 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60';
                                borderColor = 'border-emerald-500';
                                textColor = 'text-emerald-400';
                              } else if (status === 'In Progress') {
                                color = 'bg-blue-950/80 text-blue-300 border-blue-900/60';
                                borderColor = 'border-blue-500';
                                textColor = 'text-blue-400';
                              } else if (status === 'Deferred') {
                                color = 'bg-rose-950/80 text-rose-300 border-rose-900/60';
                                borderColor = 'border-rose-500';
                                textColor = 'text-rose-400';
                              }
                              return { ...item, status, color, borderColor, textColor };
                            }
                            return item;
                          }));
                          const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                          onAddLog({
                            id: `l_phase_status_${Date.now()}`,
                            timestamp,
                            action: 'SYS_TIMELINE_STATUS_UPDATE',
                            sqlQuery: `UPDATE timeline_phases SET status = '${status}' WHERE phase_id = '${p.id}';`,
                            status: 'success'
                          });
                        }}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-sans text-white focus:outline-none"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Deferred">Deferred</option>
                      </select>
                    </td>
                    <td className="p-2.5">
                      <input 
                        type="date"
                        value={p.startDate || ''}
                        onChange={(e) => handlePhaseDateChange(p.id, 'startDate', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <input 
                        type="number"
                        min="1"
                        value={p.durationDays || (p.duration * 30)}
                        onChange={(e) => handlePhaseDateChange(p.id, 'durationDays', Number(e.target.value))}
                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono font-bold text-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <input 
                        type="date"
                        value={p.endDate || ''}
                        onChange={(e) => handlePhaseDateChange(p.id, 'endDate', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={p.progress}
                          onChange={(e) => handlePhaseSliderChange(p.id, 'progress', Number(e.target.value))}
                          className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono font-bold text-white focus:outline-none"
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td className="p-2.5 pr-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingPhaseModal(p)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                          title="Edit Phase & Dates"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeletePhase(p.id)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                          title="Delete Phase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Human Resource Phase Assignments section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xs p-4 space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white font-sans uppercase tracking-wider">Active Resource Allocation</span>
          </div>
          <button 
            onClick={() => setShowAssignResourceModal(true)}
            className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Personnel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {teamMembers.map((member) => {
            const phase = phases.find(p => p.id === member.phaseId);
            return (
              <div key={member.id} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center gap-2.5 relative group">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-700 shadow-3xs">
                  <img 
                    className="w-full h-full object-cover" 
                    alt={member.name} 
                    src={member.avatarUrl} 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white font-sans truncate">{member.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{member.role}</p>
                  
                  {phase && (
                    <span className="inline-block text-[9px] font-mono font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-900/60 mt-1 truncate max-w-full">
                      {phase.name}
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => handleUnassignResource(member.id)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                  title="Unassign personnel"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <div 
            onClick={() => setShowAssignResourceModal(true)}
            className="border border-dashed border-slate-700 hover:border-blue-500 p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer group"
          >
            <UserPlus className="w-4 h-4 text-slate-500 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-sans font-bold">Assign New Staff</span>
          </div>

        </div>

      </div>

      {/* --- POP-UP MODAL OVERLAYS --- */}

      {/* Modal 1: Add Phase (Date-wise) */}
      {showAddPhaseModal && (() => {
        const { endDateStr, totalDays } = computeEndAndDays(newPhaseStartDate, newPhaseDurationVal, newPhaseDurationUnit);
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl max-w-[500px] w-full p-5 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white font-sans uppercase">Create Timeline Phase</h3>
                </div>
                <button onClick={() => setShowAddPhaseModal(false)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreatePhase} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Phase Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Pre-Production, Shooting, Quality Assurance"
                    value={newPhaseName} 
                    onChange={e => setNewPhaseName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Start Date
                    </label>
                    <input 
                      type="date"
                      required
                      value={newPhaseStartDate} 
                      onChange={e => setNewPhaseStartDate(e.target.value)}
                      className="w-full h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5 text-amber-400" /> Duration
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        max="365"
                        value={newPhaseDurationVal} 
                        onChange={e => setNewPhaseDurationVal(Number(e.target.value))}
                        className="w-1/2 h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select 
                        value={newPhaseDurationUnit} 
                        onChange={e => setNewPhaseDurationUnit(e.target.value as any)}
                        className="w-1/2 h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium focus:outline-none"
                      >
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date Summary Card */}
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Target Schedule Span</span>
                    <span className="font-bold text-white font-mono">
                      {formatDateNice(newPhaseStartDate)} → {formatDateNice(endDateStr)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Total Duration</span>
                    <span className="text-xs font-black font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Initial Progress (%)</label>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      max="100"
                      value={newPhaseProgress} 
                      onChange={e => setNewPhaseProgress(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Status</label>
                    <select 
                      value={newPhaseStatus} 
                      onChange={e => setNewPhaseStatus(e.target.value as any)}
                      className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowAddPhaseModal(false)}
                    className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                  >
                    Deploy Phase
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal 2: Add Milestone */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl max-w-[480px] w-full p-5 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white font-sans uppercase">Create Milestone Objective</h3>
              <button onClick={() => setShowAddMilestoneModal(false)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Milestone Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Final Regulatory Green-light"
                  value={newMTitle} 
                  onChange={e => setNewMTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Summary Objective</label>
                <textarea 
                  rows={2}
                  placeholder="Detail the parameters required to clear this milestone..."
                  value={newMDesc} 
                  onChange={e => setNewMDesc(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Target Completion Date</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Dec 15, 2023"
                    value={newMDate} 
                    onChange={e => setNewMDate(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Initial Status</label>
                  <select 
                    value={newMStatus} 
                    onChange={e => setNewMStatus(e.target.value as any)}
                    className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                >
                  Deploy Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Resource */}
      {showAssignResourceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl max-w-[480px] w-full p-5 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white font-sans uppercase">Assign Personnel</h3>
              <button onClick={() => setShowAssignResourceModal(false)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAssignResource} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Staff Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Sarah Jenkins"
                  value={newResName} 
                  onChange={e => setNewResName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Designation &amp; Role</label>
                <input 
                  type="text" 
                  placeholder="e.g., Senior QA Specialist"
                  value={newResRole} 
                  onChange={e => setNewResRole(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Assign to Phase</label>
                  <select 
                    value={newResPhase} 
                    onChange={e => setNewResPhase(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Avatar Selection</label>
                  <select 
                    value={newResAvatar} 
                    onChange={e => setNewResAvatar(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="https://lh3.googleusercontent.com/aida-public/AB6AXuCxYF1-nVY5VZfvjzlomjEbt0PyIK0apwBiEJwSusBVz1DZpHr9lzuwPJrGkhpCE5tVIeKg48RYRwmTpacaqQ9hp71V--C7h_yX1TuAuOA-PlB_reIFMbGb2WkczmQULKnsIgd8n3njC1a-Y_MvWEZX4ctAhLAZEsxIIhODoAyPD161K2qN46pUZ1AHHkd3VZ0ear0iXMH1NZ1yjY4DEVOpT8mpGMxEOta_N4cke6-cGrSXVYa3pAoDr1cvMW8H6KeC40cj9N0EY8A">Professional Male Avatar</option>
                    <option value="https://lh3.googleusercontent.com/aida-public/AB6AXuBtDPzg7Xjed1N3q3T9bthI64cqZP8-GEUAWW26IZiXejosqtvnIHe-mSvtAx82w3_EGWAGvefjfB25zsVznfaNQkgfj6lqI6wo3FP5MMSwJCRiwo8b7HBfXb3jCUII7z9c5eSu7rC_-wXMQMousx7nIfjtVM9ai2CaTtaZhrnBkp0KZ5W0alQ7NV252i2YxQZgWe45s2DMbNLLfaBBweuFIOJ2V9G7pBZn19KfAv0giCNYgTOt5NTYPtDTKhj1oOgOq3Fk2UzJICg">Professional Female Avatar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAssignResourceModal(false)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edit Phase & Workflow Dates */}
      {editingPhaseModal && (() => {
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-[520px] w-full p-5 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Phase / Workflow &amp; Dates</h3>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {editingPhaseModal.id}</p>
                  </div>
                </div>
                <button onClick={() => setEditingPhaseModal(null)} className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3">
                {/* Phase Name / Workflow */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Phase / Workflow Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingPhaseModal.name} 
                    onChange={e => handleUpdateModalPhaseField('name', e.target.value)}
                    className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Dates & Duration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Start Date
                    </label>
                    <input 
                      type="date"
                      required
                      value={editingPhaseModal.startDate || ''} 
                      onChange={e => handleUpdateModalPhaseField('startDate', e.target.value)}
                      className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5 text-amber-400" /> Duration (Days)
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      max="365"
                      value={editingPhaseModal.durationDays || (editingPhaseModal.duration * 30)} 
                      onChange={e => handleUpdateModalPhaseField('durationDays', Number(e.target.value))}
                      className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" /> End Date
                    </label>
                    <input 
                      type="date"
                      required
                      value={editingPhaseModal.endDate || ''} 
                      onChange={e => handleUpdateModalPhaseField('endDate', e.target.value)}
                      className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Date Summary Card */}
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Computed Schedule Span</span>
                    <span className="font-bold text-white font-mono">
                      {formatDateNice(editingPhaseModal.startDate)} → {formatDateNice(editingPhaseModal.endDate)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Total Span</span>
                    <span className="text-xs font-black font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {editingPhaseModal.durationDays || 30} Days
                    </span>
                  </div>
                </div>

                {/* Status & Progress */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Status</label>
                    <select 
                      value={editingPhaseModal.status} 
                      onChange={e => handleUpdateModalPhaseField('status', e.target.value as any)}
                      className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Deferred">Deferred</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Completion Rate (%)</label>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      max="100"
                      step="5"
                      value={editingPhaseModal.progress} 
                      onChange={e => handleUpdateModalPhaseField('progress', Number(e.target.value))}
                      className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePhase(editingPhaseModal.id);
                      setEditingPhaseModal(null);
                    }}
                    className="h-9 px-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-900/80 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Phase</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setEditingPhaseModal(null)}
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    Done &amp; Save Changes
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Project Schedule Config Modal */}
      {showScheduleConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-md">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wider">
                    Project Timeline &amp; Schedule Config
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Customize production timeline parameters for <span className="text-amber-300 font-semibold">{activeProject?.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectSchedule} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                
                {/* Pre-production start date & duration */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    Pre-Production Start Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={modalPreStart}
                    onChange={(e) => setModalPreStart(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Pre-Production Days
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={365}
                    value={modalPreDays}
                    onChange={(e) => setModalPreDays(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Principal Photography (Shooting) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    Shooting Start Date
                  </label>
                  <input 
                    type="date"
                    value={modalShootStart}
                    onChange={(e) => setModalShootStart(e.target.value)}
                    placeholder="Auto-computed if empty"
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Shooting Shifts / Days
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={365}
                    value={modalShootDays}
                    onChange={(e) => setModalShootDays(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Post-Production & Release */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Post-Production Days
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={365}
                    value={modalPostDays}
                    onChange={(e) => setModalPostDays(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300 font-sans flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Target Release Date
                  </label>
                  <input 
                    type="date"
                    value={modalTargetRelease}
                    onChange={(e) => setModalTargetRelease(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Updating this schedule recalculates phase windows and target milestones specifically for {activeProject?.name}.
              </p>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowScheduleConfigModal(false)}
                  className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-9 px-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update &amp; Apply Project Timeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
