import React, { useState, useMemo, useEffect } from 'react';
import { Project, BudgetCategory, Expense, DBLog } from '../types';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import { formatCustomDate } from '../utils/indianHolidays';
import { 
  Tv, 
  Layers, 
  Film, 
  Calendar, 
  MapPin, 
  Settings, 
  FileText, 
  Clock, 
  ListOrdered, 
  Sparkles, 
  Video, 
  Wallet, 
  FileSpreadsheet, 
  FolderTree, 
  History, 
  Building2, 
  Receipt, 
  Coins, 
  CheckSquare, 
  Truck, 
  Flame, 
  Utensils, 
  HardDrive, 
  Users, 
  UserCheck, 
  Crown, 
  User, 
  Music, 
  Hotel, 
  FileCheck, 
  Home, 
  Hammer, 
  Wrench, 
  Package, 
  Palette, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Info,
  ShieldCheck,
  Tag,
  Trash2,
  Edit,
  Save,
  X,
  Check,
  Send,
  Eye,
  PlusCircle,
  Activity,
  CheckSquare2,
  ListTodo,
  AlertTriangle
} from 'lucide-react';

interface NonFictionProjectViewProps {
  project?: Project;
  company?: any;
  activeTab: string;
  activeSubTab: string;
  onNavigateSubTab: (tab: string, subTab: string) => void;
  categories: BudgetCategory[];
  expenses: Expense[];
  onAddLog?: (log: DBLog) => void;
}

export default function NonFictionProjectView({
  project,
  company,
  activeTab,
  activeSubTab,
  onNavigateSubTab,
  categories,
  expenses,
  onAddLog
}: NonFictionProjectViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('Season 01');
  const [selectedEpisode, setSelectedEpisode] = useState('Episode 101');

  // Active Hierarchy Identifiers with safe defaults
  const companyId = company?.id || project?.companyId || '';
  const projectId = project?.id || '';
  const projectName = project?.name || 'Active Project';
  const projectType = project?.projectType || 'Project Workspace';
  const totalBudget = Number(project?.totalBudget) || 0;
  const createdBy = project?.createdBy || '';
  const recordVersion = project?.recordVersion || 1;
  const projectPlatform = project?.channelPlatform || project?.showFormat || 'Platform';
  const seasonId = selectedSeason.toLowerCase().replace(/\s+/g, '_');
  const episodeId = selectedEpisode.toLowerCase().replace(/\s+/g, '_');
  const shootingDayId = 'day_01';

  // Calculate actual spent from expenses prop for this project
  const projectExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.projectId === projectId || (project?.id && e.projectId === project.id));
  }, [expenses, projectId, project]);

  const actualSpent = useMemo(() => {
    return projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [projectExpenses]);

  const cleanActiveProjId = (projectId || '').replace(/^(wp_|p_|proj_)/, '');

  const projectCategories = useMemo(() => {
    if (!categories) return [];
    if (!projectId) return categories;
    return categories.filter(c => 
      !c.projectId || 
      c.projectId === projectId || 
      c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanActiveProjId
    );
  }, [categories, projectId, cleanActiveProjId]);

  // Total approved budget computed dynamically from categories (approved/allocated line items)
  const totalApprovedBudget = useMemo(() => {
    return projectCategories.reduce((sum, c) => {
      if (typeof c.allocatedAmount === 'number' && c.allocatedAmount > 0) {
        return sum + c.allocatedAmount;
      }
      return sum + (c.subCategories || []).reduce((sAcc, sub) => {
        if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) {
          return sAcc + sub.allocatedAmount;
        }
        return sAcc + (sub.childCategories || []).reduce((cAcc, child) => {
          const childAlloc = typeof child.allocatedAmount === 'number' && child.allocatedAmount > 0 
            ? child.allocatedAmount 
            : ((child.count || 0) * (child.rate || 0) * (child.shifts || 1));
          return cAcc + childAlloc;
        }, 0);
      }, 0);
    }, 0);
  }, [projectCategories]);

  // State Collections with full CRUD capabilities
  const [seasons, setSeasons] = useState(() => [
    { 
      id: 'season_01', 
      name: project?.seasonName || 'Season 01', 
      code: project?.seasonCode || 'S01', 
      episodes: project?.expectedEpisodes || 26, 
      shootDays: project?.expectedShootDays || 15, 
      status: 'In Production', 
      platform: project?.channelPlatform || projectPlatform, 
      budget: Number(totalBudget) || 0,
      duration: project?.episodeDuration || '45 mins',
      startDate: project?.seasonStartDate || project?.startDate || '',
      telecastStartDate: project?.telecastStartDate || ''
    }
  ]);

  const [episodes, setEpisodes] = useState<Array<{ id: string; code: string; title: string; duration: string; status: string; airDate: string; shootDay: string; theme: string }>>([]);

  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; category: string; dueDate: string; status: string; owner: string }>>([]);

  const [timelinePhases, setTimelinePhases] = useState<Array<{ id: string; phase: string; startDate: string; endDate: string; progress: number; status: string; lead: string }>>([]);

  const [calendarEvents, setCalendarEvents] = useState<Array<{ id: string; date: string; time: string; title: string; location: string; dept: string }>>([]);

  const [projectRisks, setProjectRisks] = useState<Array<{ id: string; title: string; impact: string; mitigation: string; status: string }>>([]);

  const [keyHeads, setKeyHeads] = useState<Array<{ id: string; role: string; name: string; contact: string }>>([]);

  const [rundownList, setRundownList] = useState<Array<{ id: string; seg: string; title: string; duration: string; VT: string; props: string; audio: string; hostCue: string }>>([]);

  const [contestants, setContestants] = useState<Array<{ id: string; name: string; age: number; city: string; status: string; VTStatus: string; score: number; phone: string; hotel: string }>>([]);

  const [dsrList, setDsrList] = useState<Array<{ id: string; day: string; date: string; location: string; packup: string; footageGB: number; crewPresent: number; gensetFuel: string; status: string }>>([]);

  const [crewMembers, setCrewMembers] = useState<Array<{ id: string; name: string; dept: string; designation: string; dailyRate: number; phone: string; status: string }>>([]);

  // Real-time Firestore synchronization
  useEffect(() => {
    const unsub = subscribeDoc<any>('project_controls', projectId, (data) => {
      if (data) {
        if (data.seasons) setSeasons(data.seasons);
        if (data.episodes) setEpisodes(data.episodes);
        if (data.milestones) setMilestones(data.milestones);
        if (data.timelinePhases) setTimelinePhases(data.timelinePhases);
        if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
        if (data.projectRisks) setProjectRisks(data.projectRisks);
        if (data.keyHeads) setKeyHeads(data.keyHeads);
        if (data.rundownList) setRundownList(data.rundownList);
        if (data.contestants) setContestants(data.contestants);
        if (data.dsrList) setDsrList(data.dsrList);
        if (data.crewMembers) setCrewMembers(data.crewMembers);
      }
    });
    return () => unsub();
  }, [projectId]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [formInputs, setFormInputs] = useState<any>({});
  const [editingItem, setEditingItem] = useState<{ type: string; item: any } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: string; id: string; name?: string } | null>(null);

  const saveProjectControlsToFirestore = (updates: any) => {
    saveDocData('project_controls', projectId, updates);
  };

  const handleOpenEdit = (type: string, item: any) => {
    setEditingItem({ type, item });
    setFormInputs({
      ...item,
      name: item.name || item.title || item.phase || item.day || '',
      title: item.title || item.name || item.phase || item.day || '',
    });
    setShowAddModal(`edit_${type}`);
  };

  const handleDeleteItem = (type: string, id: string, name?: string) => {
    setDeleteConfirmTarget({ type, id, name });
  };

  const executeDeleteItem = () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;

    if (type === 'season') {
      const updated = seasons.filter(s => s.id !== id);
      setSeasons(updated);
      saveProjectControlsToFirestore({ seasons: updated });
    } else if (type === 'episode') {
      const updated = episodes.filter(ep => ep.id !== id);
      setEpisodes(updated);
      saveProjectControlsToFirestore({ episodes: updated });
    } else if (type === 'keyhead') {
      const updated = keyHeads.filter(kh => kh.id !== id);
      setKeyHeads(updated);
      saveProjectControlsToFirestore({ keyHeads: updated });
    } else if (type === 'milestone') {
      const updated = milestones.filter(m => m.id !== id);
      setMilestones(updated);
      saveProjectControlsToFirestore({ milestones: updated });
    } else if (type === 'timeline') {
      const updated = timelinePhases.filter(tp => tp.id !== id);
      setTimelinePhases(updated);
      saveProjectControlsToFirestore({ timelinePhases: updated });
    } else if (type === 'calendar') {
      const updated = calendarEvents.filter(ce => ce.id !== id);
      setCalendarEvents(updated);
      saveProjectControlsToFirestore({ calendarEvents: updated });
    } else if (type === 'risk') {
      const updated = projectRisks.filter(r => r.id !== id);
      setProjectRisks(updated);
      saveProjectControlsToFirestore({ projectRisks: updated });
    } else if (type === 'rundown') {
      const updated = rundownList.filter(r => r.id !== id);
      setRundownList(updated);
      saveProjectControlsToFirestore({ rundownList: updated });
    } else if (type === 'dsr') {
      const updated = dsrList.filter(d => d.id !== id);
      setDsrList(updated);
      saveProjectControlsToFirestore({ dsrList: updated });
    } else if (type === 'contestant') {
      const updated = contestants.filter(c => c.id !== id);
      setContestants(updated);
      saveProjectControlsToFirestore({ contestants: updated });
    } else if (type === 'crew') {
      const updated = crewMembers.filter(cr => cr.id !== id);
      setCrewMembers(updated);
      saveProjectControlsToFirestore({ crewMembers: updated });
    }

    setDeleteConfirmTarget(null);
  };

  // Toggle Handlers
  const handleToggleMilestone = (mId: string) => {
    const updated = milestones.map(m => {
      if (m.id === mId) {
        const nextStatus = m.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setMilestones(updated);
    saveProjectControlsToFirestore({ milestones: updated });
  };

  const handleToggleEpisodeStatus = (epId: string) => {
    const stages = ['Scripted', 'In Production', 'In Post-Production', 'Audio Mix & QC', 'Completed'];
    const updated = episodes.map(ep => {
      if (ep.id === epId) {
        const currentIdx = stages.indexOf(ep.status);
        const nextIdx = (currentIdx + 1) % stages.length;
        return { ...ep, status: stages[nextIdx] };
      }
      return ep;
    });
    setEpisodes(updated);
    saveProjectControlsToFirestore({ episodes: updated });
  };

  // Generic Add/Edit Handler
  const handleAddItem = (type: string) => {
    if (type.startsWith('edit_') && editingItem) {
      const targetType = type.replace('edit_', '');
      const id = editingItem.item.id;

      if (targetType === 'season') {
        const updated = seasons.map(s => s.id === id ? {
          ...s,
          name: formInputs.name || formInputs.title || s.name,
          code: formInputs.code || s.code,
          episodes: Number(formInputs.episodes) || s.episodes,
          shootDays: Number(formInputs.shootDays) || s.shootDays,
          status: formInputs.status || s.status,
          platform: formInputs.platform || s.platform,
          budget: Number(formInputs.budget) || s.budget
        } : s);
        setSeasons(updated);
        saveProjectControlsToFirestore({ seasons: updated });
      } else if (targetType === 'episode') {
        const updated = episodes.map(ep => ep.id === id ? {
          ...ep,
          title: formInputs.title || formInputs.name || ep.title,
          code: formInputs.code || ep.code,
          duration: formInputs.duration || ep.duration,
          airDate: formInputs.airDate || ep.airDate,
          shootDay: formInputs.shootDay || ep.shootDay,
          theme: formInputs.theme || ep.theme,
          status: formInputs.status || ep.status
        } : ep);
        setEpisodes(updated);
        saveProjectControlsToFirestore({ episodes: updated });
      } else if (targetType === 'keyhead') {
        const updated = keyHeads.map(kh => kh.id === id ? {
          ...kh,
          role: formInputs.role || kh.role,
          name: formInputs.name || formInputs.title || kh.name,
          contact: formInputs.contact || kh.contact
        } : kh);
        setKeyHeads(updated);
        saveProjectControlsToFirestore({ keyHeads: updated });
      } else if (targetType === 'milestone') {
        const updated = milestones.map(m => m.id === id ? {
          ...m,
          title: formInputs.title || formInputs.name || m.title,
          category: formInputs.category || m.category,
          owner: formInputs.owner || m.owner,
          dueDate: formInputs.dueDate || m.dueDate,
          status: formInputs.status || m.status
        } : m);
        setMilestones(updated);
        saveProjectControlsToFirestore({ milestones: updated });
      } else if (targetType === 'timeline') {
        const updated = timelinePhases.map(tp => tp.id === id ? {
          ...tp,
          phase: formInputs.title || formInputs.name || formInputs.phase || tp.phase,
          startDate: formInputs.startDate || tp.startDate,
          endDate: formInputs.endDate || tp.endDate,
          lead: formInputs.lead || tp.lead,
          status: formInputs.status || tp.status,
          progress: Number(formInputs.progress) || tp.progress
        } : tp);
        setTimelinePhases(updated);
        saveProjectControlsToFirestore({ timelinePhases: updated });
      } else if (targetType === 'calendar') {
        const updated = calendarEvents.map(ce => ce.id === id ? {
          ...ce,
          title: formInputs.title || formInputs.name || ce.title,
          date: formInputs.date || ce.date,
          time: formInputs.time || ce.time,
          location: formInputs.location || ce.location,
          dept: formInputs.dept || ce.dept
        } : ce);
        setCalendarEvents(updated);
        saveProjectControlsToFirestore({ calendarEvents: updated });
      } else if (targetType === 'risk') {
        const updated = projectRisks.map(r => r.id === id ? {
          ...r,
          title: formInputs.title || formInputs.name || r.title,
          impact: formInputs.impact || r.impact,
          mitigation: formInputs.mitigation || r.mitigation,
          status: formInputs.status || r.status
        } : r);
        setProjectRisks(updated);
        saveProjectControlsToFirestore({ projectRisks: updated });
      } else if (targetType === 'rundown') {
        const updated = rundownList.map(r => r.id === id ? {
          ...r,
          title: formInputs.title || formInputs.name || r.title,
          seg: formInputs.seg || r.seg,
          duration: formInputs.duration || r.duration,
          VT: formInputs.VT || r.VT,
          props: formInputs.props || r.props,
          audio: formInputs.audio || r.audio,
          hostCue: formInputs.hostCue || r.hostCue
        } : r);
        setRundownList(updated);
        saveProjectControlsToFirestore({ rundownList: updated });
      } else if (targetType === 'dsr') {
        const updated = dsrList.map(d => d.id === id ? {
          ...d,
          day: formInputs.day || formInputs.title || formInputs.name || d.day,
          date: formInputs.date || d.date,
          location: formInputs.location || d.location,
          packup: formInputs.packup || d.packup,
          footageGB: formInputs.footageGB !== undefined && formInputs.footageGB !== '' ? Number(formInputs.footageGB) : d.footageGB,
          crewPresent: formInputs.crewPresent !== undefined && formInputs.crewPresent !== '' ? Number(formInputs.crewPresent) : d.crewPresent,
          gensetFuel: formInputs.gensetFuel || d.gensetFuel,
          status: formInputs.status || d.status
        } : d);
        setDsrList(updated);
        saveProjectControlsToFirestore({ dsrList: updated });
      } else if (targetType === 'contestant') {
        const updated = contestants.map(c => c.id === id ? {
          ...c,
          name: formInputs.name || formInputs.title || c.name,
          age: formInputs.age !== undefined && formInputs.age !== '' ? Number(formInputs.age) : c.age,
          city: formInputs.city || c.city,
          status: formInputs.status || c.status,
          VTStatus: formInputs.VTStatus || c.VTStatus,
          score: formInputs.score !== undefined && formInputs.score !== '' ? Number(formInputs.score) : c.score,
          phone: formInputs.phone || c.phone,
          hotel: formInputs.hotel || c.hotel
        } : c);
        setContestants(updated);
        saveProjectControlsToFirestore({ contestants: updated });
      } else if (targetType === 'crew') {
        const updated = crewMembers.map(cr => cr.id === id ? {
          ...cr,
          name: formInputs.name || formInputs.title || cr.name,
          dept: formInputs.dept || cr.dept,
          designation: formInputs.designation || cr.designation,
          dailyRate: formInputs.dailyRate !== undefined && formInputs.dailyRate !== '' ? Number(formInputs.dailyRate) : cr.dailyRate,
          phone: formInputs.phone || cr.phone,
          status: formInputs.status || cr.status
        } : cr);
        setCrewMembers(updated);
        saveProjectControlsToFirestore({ crewMembers: updated });
      }

      setEditingItem(null);
      setShowAddModal(null);
      setFormInputs({});
      return;
    }

    if (type === 'season') {
      const newS = {
        id: `season_${Date.now()}`,
        name: formInputs.name || formInputs.title || `Season 0${seasons.length + 1}`,
        code: formInputs.code || `S0${seasons.length + 1}`,
        episodes: Number(formInputs.episodes) || 26,
        shootDays: Number(formInputs.shootDays) || 15,
        status: formInputs.status || 'Planning',
        platform: formInputs.platform || projectPlatform,
        budget: Number(formInputs.budget) || Number(totalBudget) || 0,
        duration: formInputs.duration || '45 mins',
        startDate: formInputs.startDate || new Date().toISOString().split('T')[0],
        telecastStartDate: formInputs.telecastStartDate || ''
      };
      const updated = [...seasons, newS];
      setSeasons(updated);
      saveProjectControlsToFirestore({ seasons: updated });
    } else if (type === 'episode') {
      const newEp = {
        id: `ep_10${episodes.length + 1}`,
        code: formInputs.code || `EP-10${episodes.length + 1}`,
        title: formInputs.title || formInputs.name || 'New Episode Title',
        duration: formInputs.duration || '60 mins',
        status: formInputs.status || 'Planning',
        airDate: formInputs.airDate || '2026-10-01',
        shootDay: formInputs.shootDay || 'Day 06',
        theme: formInputs.theme || 'General Episode'
      };
      const updated = [...episodes, newEp];
      setEpisodes(updated);
      saveProjectControlsToFirestore({ episodes: updated });
    } else if (type === 'milestone') {
      const newM = {
        id: `m_${Date.now()}`,
        title: formInputs.title || formInputs.name || 'New Milestone',
        category: formInputs.category || 'Production',
        dueDate: formInputs.dueDate || new Date().toISOString().split('T')[0],
        status: formInputs.status || 'Pending',
        owner: formInputs.owner || 'Department Lead'
      };
      const updated = [...milestones, newM];
      setMilestones(updated);
      saveProjectControlsToFirestore({ milestones: updated });
    } else if (type === 'timeline') {
      const newTP = {
        id: `tp_${Date.now()}`,
        phase: formInputs.title || formInputs.name || formInputs.phase || 'New Phase',
        startDate: formInputs.startDate || '2026-08-15',
        endDate: formInputs.endDate || '2026-09-01',
        progress: Number(formInputs.progress) || 0,
        status: formInputs.status || 'Upcoming',
        lead: formInputs.lead || 'Production Lead'
      };
      const updated = [...timelinePhases, newTP];
      setTimelinePhases(updated);
      saveProjectControlsToFirestore({ timelinePhases: updated });
    } else if (type === 'calendar') {
      const newCE = {
        id: `ce_${Date.now()}`,
        date: formInputs.date || new Date().toISOString().split('T')[0],
        time: formInputs.time || '08:00 AM',
        title: formInputs.title || formInputs.name || 'Production Event',
        location: formInputs.location || 'Studio Floor 3',
        dept: formInputs.dept || 'Production'
      };
      const updated = [...calendarEvents, newCE];
      setCalendarEvents(updated);
      saveProjectControlsToFirestore({ calendarEvents: updated });
    } else if (type === 'risk') {
      const newR = {
        id: `pr_${Date.now()}`,
        title: formInputs.title || formInputs.name || 'Identified Project Risk',
        impact: formInputs.impact || 'Medium',
        mitigation: formInputs.mitigation || 'Mitigation plan under review',
        status: 'Identified'
      };
      const updated = [...projectRisks, newR];
      setProjectRisks(updated);
      saveProjectControlsToFirestore({ projectRisks: updated });
    } else if (type === 'keyhead') {
      const newKH = {
        id: `kh_${Date.now()}`,
        role: formInputs.role || 'Department Lead',
        name: formInputs.name || formInputs.title || 'Head Name',
        contact: formInputs.contact || 'contact@production.com'
      };
      const updated = [...keyHeads, newKH];
      setKeyHeads(updated);
      saveProjectControlsToFirestore({ keyHeads: updated });
    } else if (type === 'rundown') {
      const newR = {
        id: `r_0${rundownList.length + 1}`,
        seg: formInputs.seg || `0${rundownList.length + 1}`,
        title: formInputs.title || formInputs.name || 'New Segment',
        duration: formInputs.duration || '03:00',
        VT: formInputs.VT || 'N/A',
        props: formInputs.props || 'None',
        audio: formInputs.audio || 'Default Track',
        hostCue: formInputs.hostCue || 'Host dialogue cue...'
      };
      const updated = [...rundownList, newR];
      setRundownList(updated);
      saveProjectControlsToFirestore({ rundownList: updated });
    } else if (type === 'contestant') {
      const newC = {
        id: `con_0${contestants.length + 1}`,
        name: formInputs.name || formInputs.title || 'New Contestant',
        age: Number(formInputs.age) || 20,
        city: formInputs.city || 'Kolkata',
        status: formInputs.status || 'Active',
        VTStatus: formInputs.VTStatus || 'In Edit',
        score: Number(formInputs.score) || 0,
        phone: formInputs.phone || '+91 90000 00000',
        hotel: formInputs.hotel || 'Unassigned'
      };
      const updated = [...contestants, newC];
      setContestants(updated);
      saveProjectControlsToFirestore({ contestants: updated });
    } else if (type === 'dsr') {
      const newDsr = {
        id: `dsr_0${dsrList.length + 1}`,
        day: formInputs.day || formInputs.name || formInputs.title || `Day 0${dsrList.length + 1}`,
        date: formInputs.date || new Date().toISOString().split('T')[0],
        location: formInputs.location || 'Studio Floor 3',
        packup: formInputs.packup || '21:00',
        footageGB: Number(formInputs.footageGB) || 400,
        crewPresent: Number(formInputs.crewPresent) || 100,
        gensetFuel: formInputs.gensetFuel || '150 Liters',
        status: formInputs.status || 'Submitted'
      };
      const updated = [...dsrList, newDsr];
      setDsrList(updated);
      saveProjectControlsToFirestore({ dsrList: updated });
    } else if (type === 'crew') {
      const newCrew = {
        id: `cr_0${crewMembers.length + 1}`,
        name: formInputs.name || formInputs.title || 'New Crew Member',
        dept: formInputs.dept || 'Direction',
        designation: formInputs.designation || 'Assistant',
        dailyRate: Number(formInputs.dailyRate) || 5000,
        phone: formInputs.phone || '+91 90000 00000',
        status: formInputs.status || 'Present'
      };
      const updated = [...crewMembers, newCrew];
      setCrewMembers(updated);
      saveProjectControlsToFirestore({ crewMembers: updated });
    }

    setShowAddModal(null);
    setFormInputs({});
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* RECORD METADATA & HIERARCHY BANNER */}
      <div className="p-3 bg-slate-900/95 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg border border-blue-800/60 shadow-inner">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">{projectName}</span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-400 text-[10px] font-mono rounded-full border border-blue-800">
                  {projectType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Company: <span className="text-slate-200 font-semibold">{project?.companyName || company?.name || 'SVF ENTERTAINMENT PVT LTD'}</span> | Platform: <span className="text-amber-400 font-semibold">{projectPlatform}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500 font-bold">Category:</span> {project?.showFormat ? `${project.projectType || 'Non-Fiction'} (${project.showFormat})` : 'Non-Fiction 36-Module ERP'}
            </div>
            <div className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-400 font-bold">
              Approved Budget: ₹{totalApprovedBudget.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* APPLICATION HIERARCHY BREADCRUMB */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10.5px] font-mono text-slate-400">
          <span className="text-slate-500 uppercase tracking-wider font-bold">Hierarchy:</span>
          <span className="px-1.5 py-0.5 bg-slate-950 text-indigo-300 rounded border border-slate-800">User: {createdBy}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-1.5 py-0.5 bg-slate-950 text-blue-300 rounded border border-slate-800">Project: {project?.projectCode || projectId}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-1.5 py-0.5 bg-slate-950 text-emerald-300 rounded border border-slate-800">Season: {seasonId}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-1.5 py-0.5 bg-slate-950 text-amber-300 rounded border border-slate-800">Episode: {episodeId}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-1.5 py-0.5 bg-slate-950 text-sky-300 rounded border border-slate-800">Shooting Day: {shootingDayId}</span>
        </div>


      </div>

      {/* DASHBOARD TAB */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sanctioned Budget</span>
              <p className="text-xl font-black font-mono text-amber-400">₹{totalApprovedBudget.toLocaleString('en-IN')}</p>
              <p className="text-[10.5px] text-slate-400">Approved Category Allocation</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Season Episodes</span>
              <p className="text-xl font-black font-mono text-emerald-400">{episodes.length} Episodes</p>
              <p className="text-[10.5px] text-slate-400">15 Planned Shoot Days</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DSR Shoot Progress</span>
              <p className="text-xl font-black font-mono text-blue-400">{dsrList.length} / 15 Days Shot</p>
              <p className="text-[10.5px] text-slate-400">1,350 GB Footage Recorded</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contestants & Talent</span>
              <p className="text-xl font-black font-mono text-indigo-400">{contestants.length} Active Talent</p>
              <p className="text-[10.5px] text-slate-400">2 Anchors | 3 Judges | {contestants.length} Contestants</p>
            </div>
          </div>

          {/* MODULE LINKS GRID */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Non-Fiction TV Show Production Modules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <button 
                onClick={() => onNavigateSubTab('project-setup', 'seasons')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-blue-300 block">Seasons & Episodes Roadmap</span>
                <span className="text-[10.5px] text-slate-400">{seasons.length} Seasons, {episodes.length} Episodes configured</span>
              </button>

              <button 
                onClick={() => onNavigateSubTab('creative-content', 'rundown')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-emerald-300 block">Show Rundown & Scripts</span>
                <span className="text-[10.5px] text-slate-400">{rundownList.length} Rundown Segments for Episode 101</span>
              </button>

              <button 
                onClick={() => onNavigateSubTab('budget', 'detailed_budget')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-amber-300 block">36 Non-Fiction Budget Categories</span>
                <span className="text-[10.5px] text-slate-400">Format, Studio, Talent, Crew, DSR & Equipment</span>
              </button>

              <button 
                onClick={() => onNavigateSubTab('production-dsr', 'day_wise_dsr')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-violet-300 block">Daily Shooting Report (DSR)</span>
                <span className="text-[10.5px] text-slate-400">{dsrList.length} Shooting Days Logged</span>
              </button>

              <button 
                onClick={() => onNavigateSubTab('talent-contestants', 'contestants')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-rose-300 block">Talent, Judges & Contestants</span>
                <span className="text-[10.5px] text-slate-400">{contestants.length} Contestants profiles & hotel rooms</span>
              </button>

              <button 
                onClick={() => onNavigateSubTab('studio-set', 'studios')}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-cyan-300 block">Studio Floor & Theme Sets</span>
                <span className="text-[10.5px] text-slate-400">Floor construction, props, theme changes & audience</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT CONTROL & SETUP SUBVIEWS */}
      {(activeTab === 'project-setup' || activeTab === 'project-control' || activeTab === 'project-overview' || activeTab === 'overview' || activeTab === 'timeline' || activeTab === 'status' || activeTab === 'milestones' || activeTab === 'calendar' || activeTab === 'settings') && (
        <div className="space-y-4">
          {/* SUB-NAVIGATOR / TAB BAR */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <button 
              onClick={() => onNavigateSubTab('project-control', 'overview')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'overview' || activeTab === 'overview' || activeTab === 'project-overview') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Overview
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'seasons')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'seasons' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Seasons ({seasons.length})
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'episodes')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'episodes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Episodes ({episodes.length})
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'timeline')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'timeline' || activeTab === 'timeline') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Timeline
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'status')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'status' || activeTab === 'status') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Project Status
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'milestones')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'milestones' || activeTab === 'milestones') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckSquare2 className="w-3.5 h-3.5" /> Milestones ({milestones.filter(m => m.status === 'Completed').length}/{milestones.length})
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'calendar')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'calendar' || activeTab === 'calendar') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>

            <button 
              onClick={() => onNavigateSubTab('project-control', 'settings')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                (activeSubTab === 'settings' || activeTab === 'settings') ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
          </div>

          {/* MAIN CONTENT BLOCK */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            {/* VIEW 1: OVERVIEW */}
            {(activeSubTab === 'overview' || activeTab === 'overview' || activeTab === 'project-overview' || (activeTab === 'project-setup' && !activeSubTab)) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Tv className="w-4 h-4 text-blue-400" />
                      <span>Project Setup & Control Overview</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Master configuration, production heads, platform agreement & live metrics.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddModal('keyhead')}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Key Head
                  </button>
                </div>

                {/* Key Metric Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sanctioned Budget</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded font-mono font-bold">
                        Approved Cap
                      </span>
                    </div>
                    <p className="text-lg font-mono font-black text-amber-400">₹{totalApprovedBudget.toLocaleString('en-IN')}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Currency: {project?.currency || 'INR'} (GST Excl.)</span>
                      <span>₹{(totalApprovedBudget / 100000).toFixed(2)}L</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Platform & Channel</span>
                    <p className="text-sm font-bold text-emerald-400 truncate">{project?.channelPlatform || projectPlatform}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Format: {project?.showFormat || 'Prime Time'}</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Season & Episodes</span>
                    <p className="text-sm font-bold text-blue-400">{project?.seasonName || 'Season 01'} ({project?.expectedEpisodes || episodes.length} Eps)</p>
                    <span className="text-[10px] text-slate-500 font-mono">{project?.expectedShootDays || 15} Planned Shoot Days</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Episode Duration & Air Date</span>
                    <p className="text-sm font-bold text-indigo-400">{project?.episodeDuration || '45 mins'}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Telecast: {project?.telecastStartDate || 'TBD'}</span>
                  </div>
                </div>

                {/* Season Specifications & Production Parameters */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Season Setup & Operational Parameters
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">Code: {project?.seasonCode || 'S01'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Broadcast Channel</span>
                      <span className="font-bold text-emerald-400 truncate block mt-0.5">{project?.channelPlatform || projectPlatform}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Show Format</span>
                      <span className="font-bold text-indigo-300 truncate block mt-0.5">{project?.showFormat || 'Standard Format'}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Target Duration</span>
                      <span className="font-bold text-amber-300 truncate block mt-0.5">{project?.episodeDuration || '45 mins'}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Telecast Date</span>
                      <span className="font-bold text-rose-300 truncate block mt-0.5">{project?.telecastStartDate || 'Not Scheduled'}</span>
                    </div>
                  </div>
                </div>

                {/* Company & Banking Registration Info */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      Production Company & Compliance
                    </span>
                    <span className="text-[10.5px] text-emerald-400 font-mono font-bold">{project?.compEntityType || 'Registered Entity'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Legal Entity Name</span>
                      <span className="font-bold text-white block mt-0.5">{project?.compLegalName || project?.companyName || company?.name || 'Production House'}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">GSTIN & PAN</span>
                      <span className="font-mono font-bold text-cyan-300 block mt-0.5">GST: {project?.compGstin || '19AABCF1234F1Z5'}</span>
                      <span className="font-mono text-[10px] text-slate-400 block">PAN: {project?.compPan || 'ABCDE1234F'}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                      <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Banking Details</span>
                      <span className="font-mono font-bold text-amber-300 block mt-0.5">{project?.bankName || 'Primary Operating Account'}</span>
                      <span className="font-mono text-[10px] text-slate-400 block">A/C: {project?.bankAccountNo || '—'} | IFSC: {project?.bankIfsc || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Key Department Heads Roster */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      Key Department Heads & Stakeholders
                    </span>
                    <span className="text-[10.5px] text-slate-500 font-mono">{keyHeads.length} Assigned Leads</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {keyHeads.map(kh => (
                      <div key={kh.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1 group relative">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">{kh.role}</span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEdit('keyhead', kh)}
                              className="p-0.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Edit Key Head"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('keyhead', kh.id)}
                              className="p-0.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Delete Key Head"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="font-extrabold text-white text-xs">{kh.name}</p>
                        <p className="text-[10.5px] text-slate-400 font-mono truncate">{kh.contact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SEASONS */}
            {activeSubTab === 'seasons' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Seasons Configuration & Budget Roadmap</span>
                  <button 
                    onClick={() => setShowAddModal('season')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Season
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seasons.map(s => (
                    <div key={s.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 group relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white text-sm">{s.name} ({s.code})</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-400 rounded-full font-mono text-[10px] border border-blue-800">{s.status}</span>
                          <button 
                            onClick={() => handleOpenEdit('season', s)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                            title="Edit Season"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem('season', s.id, s.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                            title="Delete Season"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 font-medium">{s.episodes} Episodes | {s.shootDays} Shoot Days {s.duration ? `• ${s.duration}` : ''}</p>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px] font-mono text-slate-400">
                        <p>Platform: <span className="text-emerald-400 font-bold">{s.platform || project?.channelPlatform || projectPlatform}</span></p>
                        <p>Telecast: <span className="text-rose-300">{s.telecastStartDate || project?.telecastStartDate || 'TBD'}</span></p>
                      </div>
                      <p className="text-amber-400 font-mono font-bold">Sanctioned Budget: ₹{s.budget ? s.budget.toLocaleString() : totalApprovedBudget.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: EPISODES */}
            {activeSubTab === 'episodes' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Episode Post-Production & Airing Roadmap</span>
                  <button 
                    onClick={() => setShowAddModal('episode')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Episode
                  </button>
                </div>

                <div className="space-y-2">
                  {episodes.map(ep => (
                    <div key={ep.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-amber-400 mr-2">{ep.code}</span>
                        <span className="font-extrabold text-white">{ep.title}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Duration: {ep.duration} | Shoot: {ep.shootDay} | Target Air: {formatCustomDate(ep.airDate)} | Theme: {ep.theme}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleToggleEpisodeStatus(ep.id)}
                          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-md font-mono text-[10px] border border-emerald-800/80 cursor-pointer transition-colors"
                          title="Click to cycle post-production stage"
                        >
                          {ep.status}
                        </button>
                        <button 
                          onClick={() => handleOpenEdit('episode', ep)}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Edit Episode"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('episode', ep.id, ep.title)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Delete Episode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: TIMELINE */}
            {(activeSubTab === 'timeline' || activeTab === 'timeline') && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Production Roadmap & Timeline Phases</span>
                  <button 
                    onClick={() => setShowAddModal('timeline')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Phase
                  </button>
                </div>

                <div className="space-y-2">
                  {timelinePhases.map(tp => (
                    <div key={tp.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{tp.phase}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${tp.status === 'Completed' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'}`}>
                            {tp.status}
                          </span>
                          <button 
                            onClick={() => handleOpenEdit('timeline', tp)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                            title="Edit Phase"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem('timeline', tp.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                            title="Delete Phase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Schedule: {formatCustomDate(tp.startDate)} → {formatCustomDate(tp.endDate)}</span>
                        <span>Lead: {tp.lead}</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${tp.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: PROJECT STATUS */}
            {(activeSubTab === 'status' || activeTab === 'status') && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Project Control & Health Status</span>
                  <button 
                    onClick={() => setShowAddModal('risk')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project Risk
                  </button>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Budget Utilization</span>
                    <p className="text-lg font-mono font-bold text-emerald-400">
                      {totalApprovedBudget > 0
                        ? `${Math.min(100, Math.round((actualSpent / totalApprovedBudget) * 100))}%`
                        : (Number(totalBudget) > 0 ? `${Math.min(100, Math.round((actualSpent / Number(totalBudget)) * 100))}%` : '0%')
                      }
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      ₹{(actualSpent / 100000).toFixed(2)}L Spent of ₹{((totalApprovedBudget || Number(totalBudget)) / 100000).toFixed(2)}L
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Photography Completion</span>
                    <p className="text-lg font-mono font-bold text-blue-400">
                      {Math.min(100, Math.round((dsrList.length / 15) * 100))}%
                    </p>
                    <p className="text-[10.5px] text-slate-500">{dsrList.length} of 15 Days Shot</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Master Tape Delivery</span>
                    <p className="text-lg font-mono font-bold text-amber-400">
                      {episodes.length > 0 ? Math.round((episodes.filter(ep => ep.status === 'Completed').length / episodes.length) * 100) : 0}%
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      {episodes.filter(ep => ep.status === 'Completed').length} of {episodes.length} Episodes Completed
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Rights & Legal Clearances</span>
                    <p className="text-lg font-mono font-bold text-indigo-400">
                      {milestones.length > 0 ? Math.round((milestones.filter(m => m.status === 'Completed').length / milestones.length) * 100) : 0}%
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      {milestones.filter(m => m.status === 'Completed').length} of {milestones.length} Milestones Cleared
                    </p>
                  </div>
                </div>

                {/* Risk Log */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Project Risks & Mitigation Matrix
                  </span>
                  <div className="space-y-2">
                    {projectRisks.map(r => (
                      <div key={r.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-white text-xs">{r.title}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">Mitigation: {r.mitigation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded font-mono text-[10px]">{r.impact} Impact</span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">{r.status}</span>
                          <button 
                            onClick={() => handleOpenEdit('risk', r)}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-950 rounded-md transition-colors cursor-pointer"
                            title="Edit Risk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem('risk', r.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-950 rounded-md transition-colors cursor-pointer"
                            title="Delete Risk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 6: MILESTONES */}
            {(activeSubTab === 'milestones' || activeTab === 'milestones') && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Production Milestones Checklist</span>
                  <button 
                    onClick={() => setShowAddModal('milestone')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Milestone
                  </button>
                </div>

                <div className="space-y-2">
                  {milestones.map(m => (
                    <div 
                      key={m.id} 
                      className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2 transition-colors"
                    >
                      <div 
                        onClick={() => handleToggleMilestone(m.id)}
                        className="flex items-start gap-2.5 flex-1 cursor-pointer"
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-xs ${m.status === 'Completed' ? 'bg-emerald-600 text-white' : 'border border-slate-600 text-transparent'}`}>
                          ✓
                        </div>
                        <div>
                          <span className={`font-semibold ${m.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {m.title}
                          </span>
                          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">Category: {m.category} | Due: {formatCustomDate(m.dueDate)} | Owner: {m.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${m.status === 'Completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                          {m.status}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit('milestone', m); }}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Edit Milestone"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem('milestone', m.id); }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 7: CALENDAR */}
            {(activeSubTab === 'calendar' || activeTab === 'calendar') && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Production Call Sheet & Calendar</span>
                  <button 
                    onClick={() => setShowAddModal('calendar')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                </div>

                <div className="space-y-2">
                  {calendarEvents.map(ce => (
                    <div key={ce.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-amber-400 mr-2">{formatCustomDate(ce.date)} @ {ce.time}</span>
                        <span className="font-bold text-white">{ce.title}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Location: {ce.location} | Dept: {ce.dept}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded font-mono text-[10px]">
                          Scheduled
                        </span>
                        <button 
                          onClick={() => handleOpenEdit('calendar', ce)}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('calendar', ce.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 8: SETTINGS */}
            {(activeSubTab === 'settings' || activeTab === 'settings') && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Project Control & Configuration Settings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">Budget Lock Status</span>
                    <p className="text-slate-400 text-[11px]">Sanctioned V01 budget is locked for editing without producer approval.</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-mono text-[10px]">V01 Budget Locked</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">Firestore Real-Time Cloud Sync</span>
                    <p className="text-slate-400 text-[11px]">Connected to real-time database listener: <span className="font-mono text-blue-300">project_controls/{projectId}</span></p>
                    <button 
                      onClick={() => saveProjectControlsToFirestore({ seasons, episodes, milestones, timelinePhases, calendarEvents, projectRisks, keyHeads })}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Sync Now to Firestore
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATIVE & CONTENT SUBVIEWS */}
      {activeTab === 'creative-content' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Creative & Content — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal('rundown')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Segment
              </button>
            </div>

            {activeSubTab === 'rundown' ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-2 font-mono text-[11px]">
                  {rundownList.map(r => (
                    <div key={r.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <span className="text-amber-400 font-bold mr-2">Seg #{r.seg}</span>
                        <span className="text-white font-sans font-semibold text-sm">{r.title}</span>
                        <p className="text-slate-300 font-sans text-xs italic">"{r.hostCue}"</p>
                        <div className="text-[10px] text-slate-400 font-mono">VT: {r.VT} | Props: {r.props} | Audio: {r.audio}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-blue-300 rounded font-bold border border-slate-800">{r.duration}</span>
                        <button 
                          onClick={() => handleOpenEdit('rundown', r)}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Edit Segment"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('rundown', r.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                          title="Delete Segment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p className="font-bold text-white text-sm uppercase">{activeSubTab.replace(/_/g, ' ')} Module</p>
                <p className="text-xs">Episode concept sheets, teleprompter host dialogue scripts & graphics assets.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUDGET SUBVIEWS */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Budget & Cost Center — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-400 font-bold">Sanctioned: ₹{totalApprovedBudget.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">36 Non-Fiction TV Budget Head Allocation</span>
                <span className="text-emerald-400 font-mono">V01 Locked Sanctioned Budget</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {categories.slice(0, 9).map(c => (
                  <div key={c.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] block">{c.code}</span>
                      <span className="font-semibold text-slate-200">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">₹{(c.allocatedAmount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES SUBVIEWS */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Expenses & Vouchers — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">{expenses.length} Logged Vouchers</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <p className="font-bold text-white">Production Vouchers with Record Versioning</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Every logged expense links automatically to <span className="font-mono text-blue-300">company_id, project_id, season_id, episode_id, shooting_day_id</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTION DSR SUBVIEWS */}
      {activeTab === 'production-dsr' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Production DSR — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal('dsr')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add DSR Day
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {dsrList.map(dsr => (
                <div key={dsr.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono">
                  <div>
                    <span className="font-bold text-amber-400 text-sm mr-2">{dsr.day}</span>
                    <span className="text-slate-300 font-sans font-semibold">{formatCustomDate(dsr.date)} — {dsr.location}</span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Packup: {dsr.packup} | Crew Present: {dsr.crewPresent} | Footage: {dsr.footageGB} GB | Diesel: {dsr.gensetFuel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] border border-emerald-800 font-sans font-bold">
                      {dsr.status}
                    </span>
                    <button 
                      onClick={() => handleOpenEdit('dsr', dsr)}
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                      title="Edit DSR"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem('dsr', dsr.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                      title="Delete DSR"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TALENT & CONTESTANTS SUBVIEWS */}
      {activeTab === 'talent-contestants' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-indigo-400" />
                <span>Talent & Contestants — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal('contestant')}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contestant
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {contestants.map(c => (
                <div key={c.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{c.name} ({c.city})</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${c.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        {c.status}
                      </span>
                      <button 
                        onClick={() => handleOpenEdit('contestant', c)}
                        className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                        title="Edit Contestant"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('contestant', c.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                        title="Delete Contestant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px]">Age: {c.age} | Intro VT: {c.VTStatus} | Jury Score: {c.score}/100</p>
                  <p className="text-slate-400 text-[10.5px]">Stay: {c.hotel} | Contact: {c.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREW & DEPARTMENTS SUBVIEWS */}
      {activeTab === 'crew-departments' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Crew & Departments — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal('crew')}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Crew Member
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {crewMembers.map(cr => (
                <div key={cr.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-sm">{cr.name}</span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-900 text-cyan-300 font-mono text-[10px] rounded">{cr.dept} - {cr.designation}</span>
                    <p className="text-slate-400 text-[10.5px] mt-0.5">Phone: {cr.phone} | Daily Rate: ₹{cr.dailyRate.toLocaleString()}/day</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-mono text-[10px]">{cr.status}</span>
                    <button 
                      onClick={() => handleOpenEdit('crew', cr)}
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                      title="Edit Crew Member"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem('crew', cr.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
                      title="Delete Crew Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDIO & SET SUBVIEWS */}
      {activeTab === 'studio-set' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-rose-400" />
                <span>Studio & Set Floor — {activeSubTab.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Film City Floor 3 Active</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white">Film City Studio Floor 3 (12,000 sq ft)</p>
              <p className="text-[11px] text-slate-400">
                Equipped with PCR control room, 12-Cam fiber setup, Jimmy Jib track, LED wall panels & central AC.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC MODALS FOR ADDING & EDITING ITEMS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl text-xs max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white uppercase tracking-wider">
                {showAddModal.startsWith('edit_') 
                  ? `Edit ${showAddModal.replace('edit_', '').toUpperCase()}` 
                  : `Add New ${showAddModal.toUpperCase()}`}
              </h4>
              <button onClick={() => { setShowAddModal(null); setEditingItem(null); setFormInputs({}); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-1">Title / Name</label>
                <input 
                  type="text" 
                  value={formInputs.name || formInputs.title || ''} 
                  onChange={e => setFormInputs({ ...formInputs, name: e.target.value, title: e.target.value })}
                  placeholder="Enter name or title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {(showAddModal === 'season' || showAddModal === 'edit_season') && (
                <div>
                  <label className="text-slate-400 block mb-1">Season Code & Status</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.code || ''} 
                      onChange={e => setFormInputs({ ...formInputs, code: e.target.value })}
                      placeholder="Code (e.g. S01)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <select 
                      value={formInputs.status || 'Planning'} 
                      onChange={e => setFormInputs({ ...formInputs, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Pre-Production">Pre-Production</option>
                      <option value="In Production">In Production</option>
                      <option value="Post-Production">Post-Production</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <label className="text-slate-400 block mb-1">Episodes & Shoot Days</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="number" 
                      value={formInputs.episodes || ''} 
                      onChange={e => setFormInputs({ ...formInputs, episodes: e.target.value })}
                      placeholder="Episodes (e.g. 26)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="number" 
                      value={formInputs.shootDays || ''} 
                      onChange={e => setFormInputs({ ...formInputs, shootDays: e.target.value })}
                      placeholder="Shoot Days (e.g. 15)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <label className="text-slate-400 block mb-1">Platform & Sanctioned Budget (INR)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={formInputs.platform || ''} 
                      onChange={e => setFormInputs({ ...formInputs, platform: e.target.value })}
                      placeholder="Platform / Broadcaster"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="number" 
                      value={formInputs.budget || ''} 
                      onChange={e => setFormInputs({ ...formInputs, budget: e.target.value })}
                      placeholder="Sanctioned Budget (₹)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(showAddModal === 'episode' || showAddModal === 'edit_episode') && (
                <div>
                  <label className="text-slate-400 block mb-1">Episode Code & Theme</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.code || ''} 
                      onChange={e => setFormInputs({ ...formInputs, code: e.target.value })}
                      placeholder="Episode Code (e.g. EP-101)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.theme || ''} 
                      onChange={e => setFormInputs({ ...formInputs, theme: e.target.value })}
                      placeholder="Theme"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <label className="text-slate-400 block mb-1">Duration & Shoot Day</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.duration || ''} 
                      onChange={e => setFormInputs({ ...formInputs, duration: e.target.value })}
                      placeholder="Duration (e.g. 60 mins)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.shootDay || ''} 
                      onChange={e => setFormInputs({ ...formInputs, shootDay: e.target.value })}
                      placeholder="Shoot Day (e.g. Day 06)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <label className="text-slate-400 block mb-1">Air Date & Post Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={formInputs.airDate || ''} 
                      onChange={e => setFormInputs({ ...formInputs, airDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <select 
                      value={formInputs.status || 'Scripted'} 
                      onChange={e => setFormInputs({ ...formInputs, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Scripted">Scripted</option>
                      <option value="In Production">In Production</option>
                      <option value="In Post-Production">In Post-Production</option>
                      <option value="Audio Mix & QC">Audio Mix & QC</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              )}

              {(showAddModal === 'keyhead' || showAddModal === 'edit_keyhead') && (
                <div>
                  <label className="text-slate-400 block mb-1">Role & Contact Email/Phone</label>
                  <input 
                    type="text" 
                    value={formInputs.role || ''} 
                    onChange={e => setFormInputs({ ...formInputs, role: e.target.value })}
                    placeholder="Role (e.g. Line Producer, DOP, Director)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <input 
                    type="text" 
                    value={formInputs.contact || ''} 
                    onChange={e => setFormInputs({ ...formInputs, contact: e.target.value })}
                    placeholder="Contact info / email"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {(showAddModal === 'milestone' || showAddModal === 'edit_milestone') && (
                <div>
                  <label className="text-slate-400 block mb-1">Category & Owner</label>
                  <input 
                    type="text" 
                    value={formInputs.category || ''} 
                    onChange={e => setFormInputs({ ...formInputs, category: e.target.value })}
                    placeholder="Category (e.g. Pre-Production, Shoot, Legal)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <input 
                    type="text" 
                    value={formInputs.owner || ''} 
                    onChange={e => setFormInputs({ ...formInputs, owner: e.target.value })}
                    placeholder="Owner / Lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <label className="text-slate-400 block mb-1">Due Date & Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={formInputs.dueDate || ''} 
                      onChange={e => setFormInputs({ ...formInputs, dueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <select 
                      value={formInputs.status || 'Pending'} 
                      onChange={e => setFormInputs({ ...formInputs, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              )}

              {(showAddModal === 'timeline' || showAddModal === 'edit_timeline') && (
                <div>
                  <label className="text-slate-400 block mb-1">Phase Dates, Progress & Lead</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="date" 
                      value={formInputs.startDate || ''} 
                      onChange={e => setFormInputs({ ...formInputs, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="date" 
                      value={formInputs.endDate || ''} 
                      onChange={e => setFormInputs({ ...formInputs, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={formInputs.lead || ''} 
                      onChange={e => setFormInputs({ ...formInputs, lead: e.target.value })}
                      placeholder="Phase Lead"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="number" 
                      value={formInputs.progress !== undefined ? formInputs.progress : ''} 
                      onChange={e => setFormInputs({ ...formInputs, progress: e.target.value })}
                      placeholder="Progress %"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(showAddModal === 'calendar' || showAddModal === 'edit_calendar') && (
                <div>
                  <label className="text-slate-400 block mb-1">Date, Time & Location</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="date" 
                      value={formInputs.date || ''} 
                      onChange={e => setFormInputs({ ...formInputs, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.time || ''} 
                      onChange={e => setFormInputs({ ...formInputs, time: e.target.value })}
                      placeholder="09:00 AM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={formInputs.location || ''} 
                    onChange={e => setFormInputs({ ...formInputs, location: e.target.value })}
                    placeholder="Studio Floor 3 / Outdoor location"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <input 
                    type="text" 
                    value={formInputs.dept || ''} 
                    onChange={e => setFormInputs({ ...formInputs, dept: e.target.value })}
                    placeholder="Department"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {(showAddModal === 'risk' || showAddModal === 'edit_risk') && (
                <div>
                  <label className="text-slate-400 block mb-1">Impact Level & Mitigation Plan</label>
                  <select 
                    value={formInputs.impact || 'Medium'} 
                    onChange={e => setFormInputs({ ...formInputs, impact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  >
                    <option value="Low">Low Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="High">High Impact</option>
                    <option value="Critical">Critical Impact</option>
                  </select>
                  <input 
                    type="text" 
                    value={formInputs.mitigation || ''} 
                    onChange={e => setFormInputs({ ...formInputs, mitigation: e.target.value })}
                    placeholder="Mitigation Strategy / Action plan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {(showAddModal === 'rundown' || showAddModal === 'edit_rundown') && (
                <div>
                  <label className="text-slate-400 block mb-1">Segment # & Duration</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.seg || ''} 
                      onChange={e => setFormInputs({ ...formInputs, seg: e.target.value })}
                      placeholder="Segment # (e.g. 01)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.duration || ''} 
                      onChange={e => setFormInputs({ ...formInputs, duration: e.target.value })}
                      placeholder="Duration (e.g. 03:00)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={formInputs.hostCue || ''} 
                    onChange={e => setFormInputs({ ...formInputs, hostCue: e.target.value })}
                    placeholder="Host dialogue / teleprompter cue"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500 mb-2"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      value={formInputs.VT || ''} 
                      onChange={e => setFormInputs({ ...formInputs, VT: e.target.value })}
                      placeholder="VT Roll"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.props || ''} 
                      onChange={e => setFormInputs({ ...formInputs, props: e.target.value })}
                      placeholder="Props"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.audio || ''} 
                      onChange={e => setFormInputs({ ...formInputs, audio: e.target.value })}
                      placeholder="Audio"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(showAddModal === 'dsr' || showAddModal === 'edit_dsr') && (
                <div>
                  <label className="text-slate-400 block mb-1">Date & Location</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="date" 
                      value={formInputs.date || ''} 
                      onChange={e => setFormInputs({ ...formInputs, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.location || ''} 
                      onChange={e => setFormInputs({ ...formInputs, location: e.target.value })}
                      placeholder="Shooting Location"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.packup || ''} 
                      onChange={e => setFormInputs({ ...formInputs, packup: e.target.value })}
                      placeholder="Packup (e.g. 21:30)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="number" 
                      value={formInputs.crewPresent || ''} 
                      onChange={e => setFormInputs({ ...formInputs, crewPresent: e.target.value })}
                      placeholder="Crew Present"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      value={formInputs.footageGB || ''} 
                      onChange={e => setFormInputs({ ...formInputs, footageGB: e.target.value })}
                      placeholder="Footage (GB)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.gensetFuel || ''} 
                      onChange={e => setFormInputs({ ...formInputs, gensetFuel: e.target.value })}
                      placeholder="Diesel Fuel"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(showAddModal === 'contestant' || showAddModal === 'edit_contestant') && (
                <div>
                  <label className="text-slate-400 block mb-1">Age & City</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="number" 
                      value={formInputs.age || ''} 
                      onChange={e => setFormInputs({ ...formInputs, age: e.target.value })}
                      placeholder="Age"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.city || ''} 
                      onChange={e => setFormInputs({ ...formInputs, city: e.target.value })}
                      placeholder="City Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <label className="text-slate-400 block mb-1">Phone & Hotel Stay</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.phone || ''} 
                      onChange={e => setFormInputs({ ...formInputs, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.hotel || ''} 
                      onChange={e => setFormInputs({ ...formInputs, hotel: e.target.value })}
                      placeholder="Hotel / Room"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <label className="text-slate-400 block mb-1">Status & VT Edit Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={formInputs.status || 'Active'} 
                      onChange={e => setFormInputs({ ...formInputs, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Eliminated">Eliminated</option>
                      <option value="Standby">Standby</option>
                    </select>
                    <input 
                      type="text" 
                      value={formInputs.VTStatus || ''} 
                      onChange={e => setFormInputs({ ...formInputs, VTStatus: e.target.value })}
                      placeholder="VT Status (e.g. Ready)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(showAddModal === 'crew' || showAddModal === 'edit_crew') && (
                <div>
                  <label className="text-slate-400 block mb-1">Department & Designation</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input 
                      type="text" 
                      value={formInputs.dept || ''} 
                      onChange={e => setFormInputs({ ...formInputs, dept: e.target.value })}
                      placeholder="Department (e.g. Direction)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.designation || ''} 
                      onChange={e => setFormInputs({ ...formInputs, designation: e.target.value })}
                      placeholder="Designation"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <label className="text-slate-400 block mb-1">Daily Rate (INR) & Phone</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      value={formInputs.dailyRate || ''} 
                      onChange={e => setFormInputs({ ...formInputs, dailyRate: e.target.value })}
                      placeholder="Daily Rate (₹)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text" 
                      value={formInputs.phone || ''} 
                      onChange={e => setFormInputs({ ...formInputs, phone: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => { setShowAddModal(null); setEditingItem(null); setFormInputs({}); }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAddItem(showAddModal)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <span className="font-bold text-white">{deleteConfirmTarget.name || deleteConfirmTarget.type}</span>? This action will remove it from project controls and cloud sync.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteItem}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
