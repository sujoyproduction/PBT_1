import { useState, useEffect, useMemo, FormEvent, MouseEvent, useRef } from 'react';
import CreateProjectWizard from './CreateProjectWizard';
import { generateStandardCategoriesForProject, cleanProjectTitle, isProjectAdminRole } from '../data';
import { 
  subscribeCompanies, 
  subscribeWorkspaceProjects, 
  subscribeProjects,
  saveCompany, 
  saveWorkspaceProject,
  saveProject,
  saveCategory,
  saveCategoriesBatch,
  deleteWorkspaceProject,
  deleteProject,
  deleteCompany,
  deleteDocData,
  DEFAULT_COMPANIES,
  DEFAULT_WORKSPACE_PROJECTS
} from '../services/firebaseService';
import { 
  Building2, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  Wrench, 
  AlertTriangle, 
  Gauge, 
  RefreshCw, 
  Bell, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  FolderPlus,
  FolderOpen,
  Briefcase,
  Edit3,
  Pencil,
  Trash2,
  MapPin,
  Mail,
  Phone,
  FileText,
  CreditCard,
  ArrowLeft,
  Save,
  Check,
  Calendar,
  Clock,
  X,
  Tag,
  Filter,
  ShieldAlert,
  Users,
  Video,
  Film,
  Clapperboard,
  Tv,
  PhoneCall,
  Flame,
  TrendingUp,
  ExternalLink,
  Eye,
  Info,
  Flag
} from 'lucide-react';
import { Project, DBLog } from '../types';
import { getIndianHolidayForDate, formatDateDMY } from '../utils/indianHolidays';

interface WorkspaceViewProps {
  currentRole?: string;
  userEmail?: string;
  userAuthorizedCompanies?: Company[];
  userAuthorizedProjects?: Project[];
  onSelectProject: (projectId: string) => void;
  onAddLog: (log: DBLog) => void;
  onTriggerCreateProject?: () => void;
}

export interface Company {
  id: string;
  name: string; // Company Legal Name
  legalName?: string;
  address: string; // Address (Mandatory)
  email?: string; // Email Id
  phone?: string;
  contactNumber?: string; // Contact Number
  panNumber?: string; // PAN Number
  gstNumber?: string; // GST Number
  entityType?: string;
  code: string;
  description?: string;
  projectCount: number;
  utilization: number;
  status: 'Active' | 'Maintained';
  lastSynced: string;
  createdBy?: string;
  ownerEmail?: string;
}

export interface WorkspaceProject {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  projectType?: string;
  projectCode?: string;
  showFormat?: string;
  channelPlatform?: string;
  directorName?: string;
  ref: string;
  status: 'On Track' | 'At Risk' | 'Syncing' | 'Upcoming' | 'Archived' | 'Done';
  pipelineStage?: 'pre_prod' | 'in_prod' | 'post_prod' | 'completed';
  utilization: number;
  budget: string;
  totalBudget?: number;
  compGstin?: string;
  compPan?: string;
  compAddress?: string;
  compEmail?: string;
  compPhone?: string;
  compLegalName?: string;
  compRegNumber?: string;
  compCity?: string;
  compState?: string;
  compCountry?: string;
  compPinCode?: string;
  seasonName?: string;
  seasonCode?: string;
  seasonStartDate?: string;
  telecastStartDate?: string;
  episodeDuration?: string;
  expectedEpisodes?: number;
  expectedShootDays?: number;
  expectedSeasonsCount?: number;
  createdBy?: string;
  createdAt?: string;
  resources: string[];
  lastSync: string;
  imgUrl: string;
  rawProject?: any;
}

export const getCompanyProjectsList = (
  comp: Company | null, 
  workspaceProjectsList: WorkspaceProject[], 
  projectsList: Project[]
): WorkspaceProject[] => {
  if (!comp) return [];
  
  const compIdLower = (comp.id || '').trim().toLowerCase();
  const compCodeLower = (comp.code || '').trim().toLowerCase();
  const compNameLower = (comp.name || '').trim().toLowerCase();

  // 1. Filter workspaceProjects
  const wpMatches = workspaceProjectsList.filter(p => {
    const pCompId = (p.companyId || '').trim().toLowerCase();
    const pCompName = (p.companyName || '').trim().toLowerCase();
    const pName = (p.name || '').trim().toLowerCase();

    return (
      (pCompId && (pCompId === compIdLower || pCompId === compCodeLower || (compNameLower && pCompId === compNameLower))) ||
      (pCompName && compNameLower && (pCompName === compNameLower || pCompName.includes(compNameLower) || compNameLower.includes(pCompName))) ||
      (compNameLower && compNameLower.length > 2 && pName && pName.includes(compNameLower))
    );
  });

  const matchedIds = new Set(wpMatches.map(p => p.id));

  // 2. Also check ERP projects array (projectsList)
  const erpMatches: WorkspaceProject[] = [];
  projectsList.forEach(p => {
    if (matchedIds.has(p.id) || matchedIds.has(`wp_${p.id}`)) return;

    const pCompId = (p.companyId || '').trim().toLowerCase();
    const pCompCode = (p.projectCode || '').trim().toLowerCase();
    const pCompName = (p.companyName || '').trim().toLowerCase();
    const pName = (p.name || '').trim().toLowerCase();

    const isMatch = (
      (pCompId && (pCompId === compIdLower || pCompId === compCodeLower || (compNameLower && pCompId === compNameLower))) ||
      (pCompCode && compCodeLower && pCompCode === compCodeLower) ||
      (pCompName && compNameLower && (pCompName === compNameLower || pCompName.includes(compNameLower) || compNameLower.includes(pCompName))) ||
      (compNameLower && compNameLower.length > 2 && pName && pName.includes(compNameLower))
    );

    if (isMatch) {
      let statusLabel: WorkspaceProject['status'] = 'On Track';
      const statusStr = (p.status || '') as string;
      if (statusStr === 'Completed' || statusStr === 'Done' || statusStr === 'Archived' || statusStr === 'Released') {
        statusLabel = 'Done';
      } else if (statusStr === 'At Risk' || statusStr === 'Hold' || statusStr === 'Upcoming') {
        statusLabel = 'At Risk';
      }

      erpMatches.push({
        id: p.id,
        ref: p.projectCode || p.id.substring(0, 8).toUpperCase(),
        name: p.name,
        budget: typeof p.totalBudget === 'number' 
          ? (p.totalBudget >= 10000000 ? `₹${(p.totalBudget / 10000000).toFixed(1)} Cr` : `₹${(p.totalBudget / 100000).toFixed(1)} L`) 
          : String(p.totalBudget || '₹0'),
        status: statusLabel,
        companyId: comp.id,
        companyName: comp.name,
        utilization: 0,
        resources: ['JD'],
        lastSync: 'Synced',
        imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80'
      });
    }
  });

  return [...wpMatches, ...erpMatches];
};

// Calendar Note Flag interface
export interface CalendarNoteFlag {
  id: string;
  dateStr: string; // YYYY-MM-DD
  category: 'meeting' | 'office_visit' | 'location_visit' | 'call_reminder' | 'shoot_schedule' | 'general_note' | 'indian_holiday' | string;
  title: string;
  description?: string;
  time?: string;
  projectId?: string;
  projectName?: string;
  createdBy?: string;
}

// Caution Item interface
export interface ProjectCautionItem {
  id: string;
  projectId: string;
  projectName: string;
  companyName?: string;
  categoryName?: string;
  severity: 'high_risk' | 'warning' | 'permit_lookout';
  title: string;
  description: string;
  actionRecommended: string;
  loggedAt: string;
  allocatedAmount?: number;
  spentAmount?: number;
}

// Helper function to clean project title by removing code suffixes like (LOG-2026-003)

export default function WorkspaceView({ 
  currentRole, 
  userEmail,
  userAuthorizedCompanies,
  userAuthorizedProjects,
  onSelectProject, 
  onAddLog, 
  onTriggerCreateProject 
}: WorkspaceViewProps) {
  // Active state
  const [activeCompanyId, setActiveCompanyId] = useState<string>('gp');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [showNewCompanyModal, setShowNewCompanyModal] = useState<boolean>(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);

  // Dedicated Page Mode for Editing Company Registration Details
  const [editingCompanyPage, setEditingCompanyPage] = useState<Company | null>(null);
  const [pageCompName, setPageCompName] = useState('');
  const [pageCompAddress, setPageCompAddress] = useState('');
  const [pageCompEmail, setPageCompEmail] = useState('');
  const [pageCompContact, setPageCompContact] = useState('');
  const [pageCompPan, setPageCompPan] = useState('');
  const [pageCompGst, setPageCompGst] = useState('');
  const [pageCompStatus, setPageCompStatus] = useState<'Active' | 'Maintained'>('Active');
  const [pageCompDesc, setPageCompDesc] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Company Form (New / Edit Modal)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyPan, setNewCompanyPan] = useState('');
  const [newCompanyGst, setNewCompanyGst] = useState('');

  // Edit Project state (using CreateProjectWizard)
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);

  // Delete Project & Delete Company Modal states
  const [deletingProject, setDeletingProject] = useState<WorkspaceProject | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [companyDeleteBlockedMsg, setCompanyDeleteBlockedMsg] = useState<string | null>(null);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Companies & Projects state synced with Firestore or authorized props
  const [companies, setCompanies] = useState<Company[]>(userAuthorizedCompanies || []);
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>([]);
  const [projects, setProjects] = useState<Project[]>(userAuthorizedProjects || []);

  // Display mode for Projects section: 'list' (Single Row List) vs 'kanban' (Pipeline Stages)
  const [projectDisplayMode, setProjectDisplayMode] = useState<'list' | 'kanban'>('list');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedProjectTypeFilter, setSelectedProjectTypeFilter] = useState<string>('all');

  // Real-time Pipeline Stages map override for projects
  const [projectStages, setProjectStages] = useState<Record<string, 'pre_prod' | 'in_prod' | 'post_prod' | 'completed'>>(() => {
    try {
      const saved = localStorage.getItem('project_pipeline_stages');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Ref & scroll function for Horizontal Project Row
  const projectRowScrollRef = useRef<HTMLDivElement>(null);

  const scrollProjectRow = (direction: 'left' | 'right') => {
    if (projectRowScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      projectRowScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Save pipeline stage change
  const handleSetProjectStage = (projId: string, stage: 'pre_prod' | 'in_prod' | 'post_prod' | 'completed') => {
    const updated = { ...projectStages, [projId]: stage };
    setProjectStages(updated);
    localStorage.setItem('project_pipeline_stages', JSON.stringify(updated));
    onAddLog({
      id: `l_stage_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_PROJECT_STAGE_UPDATE',
      sqlQuery: `UPDATE projects SET stage='${stage}' WHERE id='${projId}';`,
      status: 'success'
    });
  };

  // Sync with authorized props if passed
  useEffect(() => {
    if (userAuthorizedCompanies) {
      setCompanies(prev => {
        if (prev.length === userAuthorizedCompanies.length && prev.every((c, i) => c.id === userAuthorizedCompanies[i]?.id)) {
          return prev;
        }
        return userAuthorizedCompanies;
      });
    }
    if (userAuthorizedProjects) {
      setProjects(prev => {
        if (prev.length === userAuthorizedProjects.length && prev.every((p, i) => p.id === userAuthorizedProjects[i]?.id)) {
          return prev;
        }
        return userAuthorizedProjects;
      });
    }
  }, [userAuthorizedCompanies, userAuthorizedProjects]);

  // Real-time Firebase Subscriptions
  useEffect(() => {
    const unsubCompanies = subscribeCompanies((data) => {
      if (!userAuthorizedCompanies) {
        setCompanies(data);
      }
    });

    const unsubWorkspace = subscribeWorkspaceProjects((data) => {
      setWorkspaceProjects(data);
    });

    const unsubProjects = subscribeProjects((data) => {
      if (!userAuthorizedProjects) {
        setProjects(data);
      }
    });

    return () => {
      unsubCompanies();
      unsubWorkspace();
      unsubProjects();
    };
  }, [userAuthorizedCompanies, userAuthorizedProjects]);

  // Handle active company auto-selection
  useEffect(() => {
    if (companies.length > 0 && !companies.find(c => c.id === activeCompanyId)) {
      setActiveCompanyId(companies[0].id);
    }
  }, [companies, activeCompanyId]);

  // -------------------------------------------------------------
  // ROW 2: CALENDAR NOTE FLAGS STATE
  // -------------------------------------------------------------
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [calendarFlags, setCalendarFlags] = useState<CalendarNoteFlag[]>(() => {
    try {
      const saved = localStorage.getItem('user_calendar_flags');
      if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    } catch {}

    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');

    return [
      {
        id: 'flag_def_1',
        dateStr: `${y}-${m}-${String(today.getDate()).padStart(2, '0')}`,
        category: 'meeting',
        title: 'Director & Exec Producer Briefing',
        description: 'Pre-production timeline alignment & cast dates confirmation.',
        time: '10:30 AM',
        projectName: 'RAADHUNI NA KAADUNI',
        createdBy: userEmail
      },
      {
        id: 'flag_def_2',
        dateStr: `${y}-${m}-05`,
        category: 'location',
        title: 'Heritage Fort Location Recce',
        description: 'Technical site survey for camera placements and power access.',
        time: '02:00 PM',
        projectName: 'RAADHUNI NA KAADUNI',
        createdBy: userEmail
      },
      {
        id: 'flag_def_3',
        dateStr: `${y}-${m}-12`,
        category: 'office',
        title: 'GST & Corporate Tax Clearance',
        description: 'Review quarterly tax submissions with finance auditor.',
        time: '11:00 AM',
        projectName: 'SVF Entertainment',
        createdBy: userEmail
      },
      {
        id: 'flag_def_4',
        dateStr: `${y}-${m}-18`,
        category: 'call',
        title: 'Equipment Vendor Call',
        description: 'Confirm camera and lighting package availability.',
        time: '04:30 PM',
        projectName: 'RAADHUNI NA KAADUNI',
        createdBy: userEmail
      },
      {
        id: 'flag_def_5',
        dateStr: `${y}-${m}-26`,
        category: 'shoot',
        title: 'Day 1 Principal Photography Shoot',
        description: 'First call sheet setup at Studio 3.',
        time: '07:00 AM',
        projectName: 'RAADHUNI NA KAADUNI',
        createdBy: userEmail
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('user_calendar_flags', JSON.stringify(calendarFlags));
  }, [calendarFlags]);

  // Generate Indian Holiday virtual flags across neighboring years
  const indianHolidayFlags = useMemo(() => {
    const flags: CalendarNoteFlag[] = [];
    const yearsToScan = [currentYear - 1, currentYear, currentYear + 1];

    yearsToScan.forEach(y => {
      for (let m = 0; m < 12; m++) {
        const totalDays = new Date(y, m + 1, 0).getDate();
        const monthStr = String(m + 1).padStart(2, '0');
        for (let d = 1; d <= totalDays; d++) {
          const dayStr = String(d).padStart(2, '0');
          const dateStr = `${y}-${monthStr}-${dayStr}`;
          const hol = getIndianHolidayForDate(dateStr);
          if (hol) {
            flags.push({
              id: `ind_hol_${dateStr}`,
              dateStr,
              category: 'indian_holiday',
              title: hol.title,
              description: hol.description || `Indian ${hol.type === 'national' ? 'National Holiday' : hol.type === 'gazetted' ? 'Gazetted Public Holiday' : 'Festival & Cultural Celebration'}`,
              time: 'All Day',
              projectName: 'Indian Official Calendar',
              createdBy: 'Government / Official Indian Calendar'
            });
          }
        }
      }
    });
    return flags;
  }, [currentYear]);

  // Combined list of user flags and official Indian holiday flags
  const allEffectiveFlags = useMemo(() => {
    const userKeys = new Set(calendarFlags.map(f => `${f.dateStr}_${f.title}`));
    const uniqueIndianHols = indianHolidayFlags.filter(h => !userKeys.has(`${h.dateStr}_${h.title}`));
    return [...calendarFlags, ...uniqueIndianHols];
  }, [calendarFlags, indianHolidayFlags]);

  // Present to future notes sorted chronologically
  const presentToFutureFlags = useMemo(() => {
    return allEffectiveFlags
      .filter(f => f.dateStr >= todayStr)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr) || (a.time || '').localeCompare(b.time || ''));
  }, [allEffectiveFlags, todayStr]);

  // Calendar Flag Modals
  const [showAddFlagModal, setShowAddFlagModal] = useState<boolean>(false);
  const [selectedFlagDetail, setSelectedFlagDetail] = useState<CalendarNoteFlag | null>(null);

  // New Flag Form state
  const [flagCategory, setFlagCategory] = useState<CalendarNoteFlag['category']>('meeting');
  const [flagTitle, setFlagTitle] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [flagTime, setFlagTime] = useState('10:00 AM');
  const [flagDateStr, setFlagDateStr] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  const [flagProjectId, setFlagProjectId] = useState('');

  const handleSaveFlag = (e: FormEvent) => {
    e.preventDefault();
    if (!flagTitle.trim()) return;

    const matchedProj = projects.find(p => p.id === flagProjectId);
    const newFlag: CalendarNoteFlag = {
      id: `flag_${Date.now()}`,
      dateStr: flagDateStr,
      category: flagCategory,
      title: flagTitle.trim(),
      description: flagDescription.trim(),
      time: flagTime,
      projectId: flagProjectId || undefined,
      projectName: matchedProj?.name || 'General Workspace',
      createdBy: userEmail
    };

    setCalendarFlags(prev => [...prev, newFlag]);
    setShowAddFlagModal(false);
    setFlagTitle('');
    setFlagDescription('');
    
    onAddLog({
      id: `l_flag_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_CALENDAR_NOTE_ADD',
      sqlQuery: `INSERT INTO calendar_flags (id, date, category, title) VALUES ('${newFlag.id}', '${newFlag.dateStr}', '${newFlag.category}', '${newFlag.title.replace(/'/g, "''")}');`,
      status: 'success'
    });
  };

  const handleDeleteFlag = (flagId: string) => {
    setCalendarFlags(prev => prev.filter(f => f.id !== flagId));
    setSelectedFlagDetail(null);
  };

  // -------------------------------------------------------------
  // ROW 3: CAUTION & LOOKOUT DASHBOARD STATE (2-COLUMN VIEW)
  // -------------------------------------------------------------
  const [cautionFilter, setCautionFilter] = useState<'all' | 'high_risk' | 'warning' | 'permit_lookout'>('all');
  const [selectedCautionProjectId, setSelectedCautionProjectId] = useState<string>('all');

  const [cautions, setCautions] = useState<ProjectCautionItem[]>(() => {
    try {
      const saved = localStorage.getItem('user_project_cautions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !item.id?.startsWith('caut_def_'));
        }
      }
    } catch {}

    return [];
  });

  useEffect(() => {
    localStorage.setItem('user_project_cautions', JSON.stringify(cautions));
  }, [cautions]);

  // Helper formatting for currency
  const formatCurrencyINR = (val?: number) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // List of monitored projects for Column 1 (max 5 projects)
  const monitoredProjectsList = useMemo(() => {
    if (projects && projects.length > 0) {
      return projects.slice(0, 5).map(p => {
        const budget = p.totalBudget || 0;
        const spent = p.spent || 0;
        const util = budget > 0 ? (spent / budget) * 100 : 0;
        const status = budget > 0 && util > 100 ? ('Over Budget' as const) : (budget > 0 && util >= 85 ? ('Near Limit' as const) : ('On Track' as const));
        const count = cautions.filter(c => c.projectId === p.id || c.projectName.toLowerCase() === p.name.toLowerCase()).length;
        return {
          id: p.id,
          name: p.name,
          companyName: p.companyName || 'Corporate',
          totalBudget: budget,
          totalSpent: spent,
          status,
          issuesCount: count
        };
      });
    }

    return [];
  }, [projects, cautions]);

  // List of budget category issues for Column 2 (max 5 issues)
  const column2CategoryIssues = useMemo(() => {
    let list = cautions;

    if (selectedCautionProjectId !== 'all') {
      const matchedProj = monitoredProjectsList.find(p => p.id === selectedCautionProjectId);
      const projNameLower = (matchedProj?.name || selectedCautionProjectId).toLowerCase();
      list = list.filter(c => c.projectId === selectedCautionProjectId || c.projectName.toLowerCase().includes(projNameLower));
    }

    if (cautionFilter === 'high_risk') {
      list = list.filter(c => c.severity === 'high_risk' || (c.spentAmount && c.allocatedAmount && c.spentAmount > c.allocatedAmount));
    } else if (cautionFilter === 'warning') {
      list = list.filter(c => c.severity === 'warning' || (c.spentAmount && c.allocatedAmount && c.spentAmount <= c.allocatedAmount && c.spentAmount >= c.allocatedAmount * 0.85));
    } else if (cautionFilter === 'permit_lookout') {
      list = list.filter(c => c.severity === 'permit_lookout');
    }

    return list.slice(0, 5);
  }, [cautions, selectedCautionProjectId, cautionFilter, monitoredProjectsList]);

  const [showAddCautionModal, setShowAddCautionModal] = useState<boolean>(false);
  const [cautionProjId, setCautionProjId] = useState('');
  const [cautionCategoryName, setCautionCategoryName] = useState('');
  const [cautionSeverity, setCautionSeverity] = useState<ProjectCautionItem['severity']>('warning');
  const [cautionTitle, setCautionTitle] = useState('');
  const [cautionDesc, setCautionDesc] = useState('');
  const [cautionAction, setCautionAction] = useState('');

  const handleSaveCaution = (e: FormEvent) => {
    e.preventDefault();
    if (!cautionTitle.trim()) return;

    const matchedProj = projects.find(p => p.id === cautionProjId);
    const newCaution: ProjectCautionItem = {
      id: `caut_${Date.now()}`,
      projectId: cautionProjId || 'p_gen',
      projectName: matchedProj?.name || 'General Project',
      companyName: matchedProj?.companyName || 'Corporate',
      categoryName: cautionCategoryName || 'General Category',
      severity: cautionSeverity,
      title: cautionTitle.trim(),
      description: cautionDesc.trim(),
      actionRecommended: cautionAction.trim() || 'Review project management details.',
      loggedAt: 'Just now'
    };

    setCautions(prev => [newCaution, ...prev]);
    setShowAddCautionModal(false);
    setCautionTitle('');
    setCautionDesc('');
    setCautionAction('');

    onAddLog({
      id: `l_caut_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_CAUTION_LOGGED',
      sqlQuery: `INSERT INTO project_cautions (id, project_id, severity, title) VALUES ('${newCaution.id}', '${newCaution.projectId}', '${newCaution.severity}', '${newCaution.title.replace(/'/g, "''")}');`,
      status: 'info'
    });
  };

  const handleResolveCaution = (id: string) => {
    setCautions(prev => prev.filter(c => c.id !== id));
    onAddLog({
      id: `l_res_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_CAUTION_RESOLVED',
      sqlQuery: `DELETE FROM project_cautions WHERE id='${id}';`,
      status: 'success'
    });
  };

  // Horizontal scroll ref for company profiles
  const companyScrollRef = useRef<HTMLDivElement>(null);
  const scrollCompanies = (direction: 'left' | 'right') => {
    if (companyScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      companyScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper for company creation
  const handleOpenNewCompanyModal = () => {
    setEditingCompany(null);
    setNewCompanyName('');
    setNewCompanyAddress('');
    setNewCompanyEmail('');
    setNewCompanyContact('');
    setNewCompanyPan('');
    setNewCompanyGst('');
    setShowNewCompanyModal(true);
  };

  const handleCompanySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyAddress.trim()) {
      alert('Company Legal Name and Full Registered Address are required fields.');
      return;
    }

    const words = newCompanyName.trim().split(' ');
    let generatedCode = '';
    if (words.length === 1) {
      generatedCode = words[0].substring(0, 3).toUpperCase();
    } else {
      generatedCode = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }

    const companyId = editingCompany ? editingCompany.id : `comp_${Date.now()}`;
    
    const companyData: Company = {
      id: companyId,
      name: newCompanyName.trim(),
      address: newCompanyAddress.trim(),
      email: newCompanyEmail.trim(),
      contactNumber: newCompanyContact.trim(),
      panNumber: newCompanyPan.trim().toUpperCase(),
      gstNumber: newCompanyGst.trim().toUpperCase(),
      code: editingCompany ? editingCompany.code : generatedCode,
      description: `Registered entity ${newCompanyName.trim()} (${newCompanyGst.trim().toUpperCase() || 'GST Pending'})`,
      projectCount: editingCompany ? editingCompany.projectCount : 0,
      utilization: editingCompany ? editingCompany.utilization : 0,
      status: editingCompany ? editingCompany.status : 'Active',
      lastSynced: 'Just now',
      createdBy: userEmail || 'sujoy.production@gmail.com',
      ownerEmail: userEmail || 'sujoy.production@gmail.com'
    };

    saveCompany(companyData);

    onAddLog({
      id: `l_comp_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: editingCompany ? 'SYS_COMPANY_UPDATE' : 'SYS_COMPANY_CREATE',
      sqlQuery: editingCompany 
        ? `UPDATE companies SET name='${companyData.name.replace(/'/g, "''")}', address='${companyData.address.replace(/'/g, "''")}' WHERE id='${companyId}';`
        : `INSERT INTO companies (id, name, code, address, gst) VALUES ('${companyId}', '${companyData.name.replace(/'/g, "''")}', '${companyData.code}', '${companyData.address.replace(/'/g, "''")}', '${companyData.gstNumber}');`,
      status: 'success'
    });

    setActiveCompanyId(companyId);
    setShowNewCompanyModal(false);
    setEditingCompany(null);
  };

  const handleSavePageCompanySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingCompanyPage) return;

    if (!pageCompName.trim() || !pageCompAddress.trim()) {
      alert('Company Legal Name and Address are required.');
      return;
    }

    const updatedComp: Company = {
      ...editingCompanyPage,
      name: pageCompName.trim(),
      address: pageCompAddress.trim(),
      email: pageCompEmail.trim(),
      contactNumber: pageCompContact.trim(),
      panNumber: pageCompPan.trim().toUpperCase(),
      gstNumber: pageCompGst.trim().toUpperCase(),
      status: pageCompStatus,
      description: pageCompDesc.trim() || editingCompanyPage.description,
      lastSynced: 'Just now'
    };

    saveCompany(updatedComp);

    setSaveSuccessMsg('Company registration details successfully updated and saved to cloud database!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    onAddLog({
      id: `l_comp_save_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_COMPANY_PROFILE_SAVE',
      sqlQuery: `UPDATE company_profiles SET name='${updatedComp.name.replace(/'/g, "''")}', gst='${updatedComp.gstNumber}' WHERE id='${updatedComp.id}';`,
      status: 'success'
    });
  };

  const handleDeleteCompanyClick = (comp: Company, e: MouseEvent) => {
    e.stopPropagation();
    const compProjects = getCompanyProjectsList(comp, workspaceProjects, projects);
    if (compProjects.length > 0) {
      setCompanyDeleteBlockedMsg(`Cannot delete company '${comp.name}'. It currently has ${compProjects.length} linked active project(s). Please delete or reassign all projects under this company first.`);
      return;
    }
    setDeletingCompany(comp);
  };

  const handleConfirmDeleteCompany = () => {
    if (!deletingCompany) return;

    deleteCompany(deletingCompany.id);

    onAddLog({
      id: `l_comp_del_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_COMPANY_DELETE',
      sqlQuery: `DELETE FROM companies WHERE id='${deletingCompany.id}';`,
      status: 'success'
    });

    if (editingCompanyPage && editingCompanyPage.id === deletingCompany.id) {
      setEditingCompanyPage(null);
    }

    setDeletingCompany(null);
  };

  const handleDeleteProjectClick = (proj: any, e: MouseEvent) => {
    e.stopPropagation();
    if (!isProjectAdminRole(currentRole)) {
      alert("Access Denied: Only a Project Admin (Producer / Executive Producer / Admin) can delete a project.");
      return;
    }
    setDeletingProject(proj);
  };

  const handleConfirmDeleteProject = async () => {
    if (!deletingProject) return;
    if (!isProjectAdminRole(currentRole)) {
      alert("Access Denied: Only a Project Admin (Producer / Executive Producer / Admin) can delete a project.");
      setDeletingProject(null);
      return;
    }
    const proj = deletingProject;
    const projName = proj.name || 'this project';
    const projId = proj.id;
    const cleanId = projId.replace(/^(wp_|p_|proj_)/, '');
    const cleanName = cleanProjectTitle(projName).toLowerCase().trim();

    // Gather all doc ID variants that could exist in Firestore
    const docIds = new Set<string>();
    docIds.add(projId);
    docIds.add(cleanId);
    docIds.add(`p_${cleanId}`);
    docIds.add(`wp_${cleanId}`);

    if ((proj as any).allDocIds && Array.isArray((proj as any).allDocIds)) {
      (proj as any).allDocIds.forEach((id: string) => docIds.add(id));
    }
    if (proj.rawProject?.id) {
      docIds.add(proj.rawProject.id);
      docIds.add(proj.rawProject.id.replace(/^(wp_|p_|proj_)/, ''));
      docIds.add(`p_${proj.rawProject.id.replace(/^(wp_|p_|proj_)/, '')}`);
    }

    // Match any additional records in local states with matching clean name
    projects.forEach(p => {
      const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
      if (pCleanName && pCleanName === cleanName) {
        docIds.add(p.id);
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        docIds.add(pCleanId);
        docIds.add(`p_${pCleanId}`);
      }
    });
    workspaceProjects.forEach(wp => {
      const wpCleanName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
      if (wpCleanName && wpCleanName === cleanName) {
        docIds.add(wp.id);
        const wpCleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
        docIds.add(wpCleanId);
        docIds.add(`wp_${wpCleanId}`);
      }
    });

    try {
      const allIds = Array.from(docIds);
      for (const id of allIds) {
        await deleteDocData('projects', id);
        await deleteDocData('workspaceProjects', id);
        await deleteProject(id);
        await deleteWorkspaceProject(id);
      }

      // Immediately filter local state in WorkspaceView
      const isMatchToDelete = (id: string, name?: string) => {
        if (docIds.has(id)) return true;
        const cId = id.replace(/^(wp_|p_|proj_)/, '');
        if (docIds.has(cId) || docIds.has(`p_${cId}`) || docIds.has(`wp_${cId}`)) return true;
        if (name && cleanProjectTitle(name).toLowerCase().trim() === cleanName) return true;
        return false;
      };

      setWorkspaceProjects(prev => prev.filter(wp => !isMatchToDelete(wp.id, wp.name)));
      setProjects(prev => prev.filter(p => !isMatchToDelete(p.id, p.name)));

      if (onAddLog) {
        onAddLog({
          id: `l_proj_del_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'SYS_PROJECT_DELETE',
          sqlQuery: `DELETE FROM projects WHERE id='${cleanId}';`,
          status: 'success'
        });
      }

      setToastMsg(`Project "${projName}" deleted successfully from server.`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setDeletingProject(null);
    }
  };

  // Unified list of all projects across ERP and Workspace
  const allUnifiedProjectsList = useMemo(() => {
    const map = new Map<string, WorkspaceProject & { rawProject?: Project; allDocIds?: string[] }>();
    
    workspaceProjects.forEach(wp => {
      const cleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
      const cleanTitle = cleanProjectTitle(wp.name);
      const cleanNameKey = cleanTitle.toLowerCase().trim();

      let existingKey: string | undefined = undefined;
      if (map.has(cleanId)) {
        existingKey = cleanId;
      } else if (cleanNameKey) {
        for (const [k, v] of map.entries()) {
          if (cleanProjectTitle(v.name).toLowerCase().trim() === cleanNameKey) {
            existingKey = k;
            break;
          }
        }
      }

      const stageOverride = projectStages[cleanId] || projectStages[wp.id];
      const matchedP = projects.find(p => {
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
        return p.id === wp.id || pCleanId === cleanId || (pCleanName && pCleanName === cleanNameKey);
      });

      const docIds = [wp.id, cleanId, `wp_${cleanId}`, `p_${cleanId}`];
      if (matchedP) {
        docIds.push(matchedP.id, `p_${matchedP.id.replace(/^(wp_|p_|proj_)/, '')}`);
      }

      if (existingKey) {
        const existing = map.get(existingKey)!;
        if (matchedP && !existing.rawProject) existing.rawProject = matchedP;
        if (wp.projectType && wp.projectType !== 'Film / Feature Production') existing.projectType = wp.projectType;
        if (wp.budget && wp.budget !== '₹0') existing.budget = wp.budget;
        existing.allDocIds = Array.from(new Set([...(existing.allDocIds || []), ...docIds]));
      } else {
        map.set(cleanId, {
          ...wp,
          id: cleanId,
          name: cleanTitle,
          projectType: wp.projectType || matchedP?.projectType || 'Film / Feature Production',
          directorName: wp.directorName || matchedP?.directorName || '',
          rawProject: matchedP,
          pipelineStage: stageOverride || (wp.status === 'Done' || wp.status === 'Archived' ? 'completed' : wp.status === 'At Risk' || wp.status === 'Upcoming' ? 'pre_prod' : 'in_prod'),
          allDocIds: Array.from(new Set(docIds))
        });
      }
    });

    projects.forEach(p => {
      const cleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
      const cleanTitle = cleanProjectTitle(p.name);
      const cleanNameKey = cleanTitle.toLowerCase().trim();

      // Check if already in map by cleanId or clean title
      let existingKey: string | undefined = undefined;
      if (map.has(cleanId)) {
        existingKey = cleanId;
      } else {
        for (const [k, v] of map.entries()) {
          if (cleanProjectTitle(v.name).toLowerCase().trim() === cleanNameKey) {
            existingKey = k;
            break;
          }
        }
      }

      if (existingKey) {
        const existing = map.get(existingKey)!;
        existing.rawProject = existing.rawProject || p;
        existing.allDocIds = Array.from(new Set([...(existing.allDocIds || []), p.id, cleanId, `p_${cleanId}`, `wp_${cleanId}`]));
      } else {
        const stageOverride = projectStages[cleanId] || projectStages[p.id];
        let defaultStage: WorkspaceProject['pipelineStage'] = 'in_prod';
        const rawStatus = (p.status || '') as string;
        if (rawStatus === 'Completed' || rawStatus === 'Done' || rawStatus === 'Archived' || rawStatus === 'Released') {
          defaultStage = 'completed';
        } else if (rawStatus === 'Pre-Production' || rawStatus === 'Planning' || rawStatus === 'Upcoming') {
          defaultStage = 'pre_prod';
        } else if (rawStatus === 'Post-Production' || rawStatus === 'Editing') {
          defaultStage = 'post_prod';
        }

        map.set(cleanId, {
          id: cleanId,
          ref: p.projectCode || cleanId.substring(0, 8).toUpperCase(),
          name: cleanTitle,
          companyId: p.companyId || 'gp',
          companyName: p.companyName || 'Corporate',
          projectType: p.projectType || 'Film / Feature Production',
          directorName: p.directorName || '',
          budget: typeof p.totalBudget === 'number' 
            ? (p.totalBudget >= 10000000 ? `₹${(p.totalBudget / 10000000).toFixed(1)} Cr` : `₹${(p.totalBudget / 100000).toFixed(1)} L`) 
            : String(p.totalBudget || '₹0'),
          status: rawStatus === 'Completed' || rawStatus === 'Released' || rawStatus === 'Done' ? 'Done' : rawStatus === 'Hold' ? 'At Risk' : 'On Track',
          pipelineStage: stageOverride || defaultStage,
          utilization: 0,
          resources: ['JD'],
          lastSync: 'Synced',
          imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80',
          rawProject: p,
          allDocIds: [p.id, cleanId, `p_${cleanId}`, `wp_${cleanId}`]
        });
      }
    });

    return Array.from(map.values());
  }, [workspaceProjects, projects, projectStages]);

  // Unique lists for Company and Project Type filter dropdowns
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    allUnifiedProjectsList.forEach(p => {
      if (p.companyName) set.add(p.companyName);
    });
    companies.forEach(c => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set).sort();
  }, [allUnifiedProjectsList, companies]);

  const availableProjectTypes = useMemo(() => {
    const set = new Set<string>();
    allUnifiedProjectsList.forEach(p => {
      if (p.projectType) set.add(p.projectType);
    });
    // Default production types
    ['Film', 'OTT', 'AD Film', 'TV Series', 'Non-Fiction TV Show', 'Reality Show', 'Documentary', 'Short Film'].forEach(t => set.add(t));
    return Array.from(set).sort();
  }, [allUnifiedProjectsList]);

  // Filtered projects based on search query, company, project type, stage, and authorization assignment
  const filteredProjectsList = allUnifiedProjectsList.filter(p => {
    // 1. Authorization check: Users can ONLY access projects they created or were assigned to as team members in their user workspace
    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : '';
    const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
    const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();

    const isAuthorized = projects.some(ap => {
      const apCleanId = ap.id.replace(/^(wp_|p_|proj_)/, '');
      const apCleanName = cleanProjectTitle(ap.name || '').toLowerCase().trim();
      return ap.id === p.id || apCleanId === pCleanId || (apCleanName && apCleanName === pCleanName);
    }) 
    || (p.rawProject && Array.isArray(p.rawProject.assignedUsers) && p.rawProject.assignedUsers.some((u: any) => u.email?.toLowerCase().trim() === cleanEmail))
    || (p.createdBy && p.createdBy.toLowerCase().trim() === cleanEmail)
    || ((p as any).ownerEmail && (p as any).ownerEmail.toLowerCase().trim() === cleanEmail)
    || (p.rawProject?.createdBy && p.rawProject.createdBy.toLowerCase().trim() === cleanEmail)
    || (p.rawProject && (p.rawProject as any).email && (p.rawProject as any).email.toLowerCase().trim() === cleanEmail)
    || (Array.isArray(p.resources) && p.resources.some((r: string) => r.toLowerCase().trim() === cleanEmail));

    if (!isAuthorized) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || 
        (p.ref && p.ref.toLowerCase().includes(q)) || 
        (p.companyName && p.companyName.toLowerCase().includes(q)) ||
        (p.directorName && p.directorName.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (selectedCompanyFilter !== 'all') {
      if (p.companyName !== selectedCompanyFilter && p.companyId !== selectedCompanyFilter) return false;
    }

    if (selectedProjectTypeFilter !== 'all') {
      if (p.projectType !== selectedProjectTypeFilter) return false;
    }

    if (selectedStageFilter !== 'all') {
      if (p.pipelineStage !== selectedStageFilter) return false;
    }

    return true;
  });

  // Categorize projects into Pipeline Columns
  const pipelineColumns = [
    {
      id: 'pre_prod' as const,
      title: 'Pre-Production / Planning',
      icon: Clock,
      color: 'border-amber-500/50 text-amber-400 bg-amber-950/20',
      badgeBg: 'bg-amber-950 text-amber-400 border-amber-800',
      projects: filteredProjectsList.filter(p => p.pipelineStage === 'pre_prod')
    },
    {
      id: 'in_prod' as const,
      title: 'In Production / Shooting',
      icon: Video,
      color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20',
      badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      projects: filteredProjectsList.filter(p => p.pipelineStage === 'in_prod')
    },
    {
      id: 'post_prod' as const,
      title: 'Post-Production / Editing',
      icon: FilmIcon,
      color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/20',
      badgeBg: 'bg-cyan-950 text-cyan-400 border-cyan-800',
      projects: filteredProjectsList.filter(p => p.pipelineStage === 'post_prod')
    },
    {
      id: 'completed' as const,
      title: 'Completed / Delivered',
      icon: CheckCircle2,
      color: 'border-blue-500/50 text-blue-400 bg-blue-950/20',
      badgeBg: 'bg-blue-950 text-blue-400 border-blue-800',
      projects: filteredProjectsList.filter(p => p.pipelineStage === 'completed')
    }
  ];

  // Helper function to render calendar days for current month
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay(); // 0 for Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, fullDateStr: '' });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({ day: d, isCurrentMonth: true, fullDateStr: dateStr });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, fullDateStr: '' });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentYear, currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Flag Category Color mapping
  const flagCategoryBadge = (cat: CalendarNoteFlag['category']) => {
    switch (cat) {
      case 'meeting':
        return { label: 'Meeting', bg: 'bg-blue-950/90 text-blue-300 border-blue-800', icon: Users };
      case 'office_visit':
      case 'office':
        return { label: 'Office Visit', bg: 'bg-purple-950/90 text-purple-300 border-purple-800', icon: Building2 };
      case 'location_visit':
      case 'location':
        return { label: 'Location Visit', bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-800', icon: MapPin };
      case 'call_reminder':
      case 'call':
        return { label: 'Call Reminder', bg: 'bg-amber-950/90 text-amber-300 border-amber-800', icon: PhoneCall };
      case 'shoot_schedule':
      case 'shoot':
        return { label: 'Shoot Schedule', bg: 'bg-rose-950/90 text-rose-300 border-rose-800', icon: Video };
      case 'indian_holiday':
      case 'holiday':
        return { label: 'Indian Special Day', bg: 'bg-amber-950/90 text-amber-300 border-amber-600/80 ring-1 ring-amber-500/30', icon: Flag };
      default:
        return { label: 'General Note', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: FileText };
    }
  };

  const filteredCautions = cautions.filter(c => {
    if (cautionFilter === 'all') return true;
    return c.severity === cautionFilter;
  });

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  return (
    <div className="space-y-4 animate-fade-in text-slate-100 pb-8">


      {/* PROJECTS SECTION */}
      <section className="space-y-3">
        {/* COMPACT UNIFIED PROJECTS HEADER BAR */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Registered Project Folders</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">
                ({filteredProjectsList.length})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* SEARCH INPUT WITH ICON */}
            <div className="relative min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
              <input 
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-7 pr-6 bg-slate-950 border border-slate-800 rounded-lg outline-none text-[10px] text-white placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* COMPANY NAME FILTER DROPDOWN */}
            <div className="flex items-center bg-slate-950 px-2 h-7 rounded-lg border border-slate-800 text-[10px] gap-1.5">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-1 text-[10px]"
              >
                <option value="all" className="bg-slate-900 text-slate-200">Company: All</option>
                {availableCompanies.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                ))}
              </select>
            </div>

            {/* PROJECT TYPE FILTER DROPDOWN */}
            <div className="flex items-center bg-slate-950 px-2 h-7 rounded-lg border border-slate-800 text-[10px] gap-1.5">
              <Film className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                value={selectedProjectTypeFilter}
                onChange={(e) => setSelectedProjectTypeFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-1 text-[10px]"
              >
                <option value="all" className="bg-slate-900 text-slate-200">Type: All</option>
                {availableProjectTypes.map(t => (
                  <option key={t} value={t} className="bg-slate-900 text-slate-200">{t}</option>
                ))}
              </select>
            </div>

            {/* RESET FILTERS BUTTON */}
            {(selectedCompanyFilter !== 'all' || selectedProjectTypeFilter !== 'all' || selectedStageFilter !== 'all' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCompanyFilter('all');
                  setSelectedProjectTypeFilter('all');
                  setSelectedStageFilter('all');
                  setSearchQuery('');
                }}
                className="px-2 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset all filters"
              >
                <X className="w-3 h-3 text-amber-400" />
                <span>Reset</span>
              </button>
            )}

            {/* DISPLAY MODE SWITCHER */}
            <div className="flex items-center bg-slate-950 p-0.5 h-7 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setProjectDisplayMode('list')}
                className={`px-2 h-6 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                  projectDisplayMode === 'list' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectDisplayMode('kanban')}
                className={`px-2 h-6 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                  projectDisplayMode === 'kanban' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Folder View</span>
              </button>
            </div>

            {/* ADD PROJECT BUTTON */}
            <button 
              type="button"
              onClick={() => {
                setProjectToEdit(null);
                setShowNewProjectModal(true);
              }}
              className="h-7 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs border border-blue-400/30 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-blue-100 stroke-[2.5]" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* MODE 1: ULTRA-COMPACT SINGLE ROW LIST VIEW (DEFAULT) */}
        {projectDisplayMode === 'list' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            {/* List Table Header */}
            <div className="hidden md:grid grid-cols-12 bg-slate-950/90 px-3.5 py-2 text-[10px] font-extrabold font-mono text-slate-400 border-b border-slate-800 uppercase tracking-wider items-center gap-2">
              <div className="col-span-3">Project Folder & Director</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-2">Project Type</div>
              <div className="col-span-2">Pipeline Stage</div>
              <div className="col-span-1 text-right">Budget</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* List Table Rows */}
            <div className="divide-y divide-slate-800/60">
              {filteredProjectsList
                .filter(p => selectedStageFilter === 'all' || p.pipelineStage === selectedStageFilter)
                .map((proj) => (
                  <div 
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      if (onAddLog) {
                        onAddLog({
                          id: `l_open_${Date.now()}`,
                          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                          action: 'SYS_PROJECT_OPEN',
                          sqlQuery: `SELECT * FROM projects WHERE id='${proj.id}';`,
                          status: 'success'
                        });
                      }
                    }}
                    className="flex flex-col md:grid md:grid-cols-12 px-3.5 py-2 items-center gap-2 hover:bg-slate-800/60 transition-colors text-xs cursor-pointer group"
                  >
                    {/* Project Folder & Director */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0 w-full">
                      <FolderOpen className="w-4 h-4 text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white group-hover:text-blue-300 transition-colors truncate text-[11.5px]">
                            {cleanProjectTitle(proj.name)}
                          </span>
                          {(proj.projectCode || proj.rawProject?.projectCode) && (
                            <span className="px-1 py-0.2 rounded text-[8.5px] font-mono font-bold bg-slate-900 text-blue-300 border border-blue-800/80">
                              {proj.projectCode || proj.rawProject?.projectCode}
                            </span>
                          )}
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase font-mono border ${
                            proj.status === 'Done' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                            proj.status === 'At Risk' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                            'bg-blue-950 text-blue-400 border-blue-800'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 mt-0.5">
                          {(proj.channelPlatform || proj.rawProject?.channelPlatform) && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Tv className="w-2.5 h-2.5 inline" /> {proj.channelPlatform || proj.rawProject?.channelPlatform}
                            </span>
                          )}
                          {(proj.seasonName || proj.rawProject?.seasonName) && (
                            <span className="text-cyan-300 font-mono">
                              {proj.seasonName || proj.rawProject?.seasonName} ({proj.expectedEpisodes || proj.rawProject?.expectedEpisodes || 1} Eps | {proj.expectedShootDays || proj.rawProject?.expectedShootDays || 1} Days)
                            </span>
                          )}
                          {(proj.directorName || proj.rawProject?.directorName) && (
                            <span className="text-amber-300 font-medium flex items-center gap-1">
                              <Clapperboard className="w-2.5 h-2.5 text-amber-400 inline" />
                              <span>Dir: <strong className="text-amber-200">{proj.directorName || proj.rawProject?.directorName}</strong></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="col-span-2 text-[11px] text-slate-300 font-medium truncate w-full">
                      <span className="md:hidden text-[9px] text-slate-500 font-mono mr-1">Company:</span>
                      <div>
                        <span className="font-semibold text-slate-200">{proj.companyName || 'Corporate'}</span>
                        {(proj.compGstin || proj.rawProject?.compGstin) && (
                          <span className="block text-[9.5px] font-mono text-slate-500 truncate">
                            GSTIN: {proj.compGstin || proj.rawProject?.compGstin}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project Type & Show Format */}
                    <div className="col-span-2 w-full space-y-0.5">
                      <span className="px-1.5 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 text-[9px] font-bold rounded uppercase tracking-wider font-mono inline-block">
                        {proj.projectType || proj.rawProject?.projectType || 'Film / Feature'}
                      </span>
                      {(proj.showFormat || proj.rawProject?.showFormat) && (
                        <span className="block text-[9.5px] text-slate-400 truncate">
                          {proj.showFormat || proj.rawProject?.showFormat}
                        </span>
                      )}
                    </div>

                    {/* Pipeline Stage Dropdown */}
                    <div className="col-span-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={proj.pipelineStage}
                        onChange={(e) => handleSetProjectStage(proj.id, e.target.value as any)}
                        className="h-6 px-1.5 bg-slate-950 border border-slate-700 text-[10px] font-bold text-slate-200 rounded-md outline-none cursor-pointer hover:border-slate-500 max-w-[130px]"
                      >
                        <option value="pre_prod">Pre-Prod</option>
                        <option value="in_prod">In Prod</option>
                        <option value="post_prod">Post-Prod</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Budget */}
                    <div className="col-span-1 text-left md:text-right font-extrabold text-emerald-400 font-mono text-[11px] w-full">
                      <span className="md:hidden text-[9px] text-slate-500 font-mono mr-1">Budget:</span>
                      {proj.budget}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-2 flex items-center justify-start md:justify-end gap-1.5 w-full">
                      {isProjectAdminRole(currentRole) && (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToEdit(proj.rawProject ? { ...proj.rawProject, ...proj } : proj);
                              setShowNewProjectModal(true);
                            }}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors border border-slate-700/60 cursor-pointer"
                            title="Edit Project"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteProjectClick(proj, e)}
                            className="p-1 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 hover:border-rose-700/60 rounded transition-colors border border-slate-700/60 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

              {filteredProjectsList.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No registered projects found. Click "+ Add Project" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: COMPACT KANBAN GRID */}
        {projectDisplayMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {pipelineColumns.map((col) => {
              const Icon = col.icon;
              return (
                <div 
                  key={col.id} 
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 shadow-xs flex flex-col min-h-[300px]"
                >
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${col.color}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <h3 className="text-[11px] font-bold tracking-tight truncate">{col.title}</h3>
                    </div>
                    <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${col.badgeBg}`}>
                      {col.projects.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {col.projects.length === 0 ? (
                      <div className="h-24 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                        <p className="text-[11px] text-slate-500 font-medium">No projects in this stage</p>
                      </div>
                    ) : (
                      col.projects.map((proj) => (
                        <div 
                          key={proj.id}
                          onClick={() => {
                            onSelectProject(proj.id);
                            if (onAddLog) {
                              onAddLog({
                                id: `l_open_${Date.now()}`,
                                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                                action: 'SYS_PROJECT_OPEN',
                                sqlQuery: `SELECT * FROM projects WHERE id='${proj.id}';`,
                                status: 'success'
                              });
                            }
                          }}
                          className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-lg space-y-1.5 group text-xs cursor-pointer transition-all"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <FolderOpen className="w-3 h-3 text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" />
                                <h4 className="text-[11px] font-extrabold text-white group-hover:text-blue-300 truncate transition-colors">
                                  {cleanProjectTitle(proj.name)}
                                </h4>
                                {(proj.projectCode || proj.rawProject?.projectCode) && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-900 text-blue-300 border border-blue-800/80">
                                    {proj.projectCode || proj.rawProject?.projectCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                                <span>{proj.companyName || 'Corporate'}</span>
                                {(proj.projectType || proj.rawProject?.projectType) && (
                                  <span className="text-indigo-300 font-bold">
                                    {proj.projectType || proj.rawProject?.projectType}
                                  </span>
                                )}
                              </div>
                              {((proj.channelPlatform || proj.rawProject?.channelPlatform) || (proj.seasonName || proj.rawProject?.seasonName)) && (
                                <div className="mt-1 pt-1 border-t border-slate-700/40 text-[9px] text-slate-300 space-y-0.5">
                                  {(proj.channelPlatform || proj.rawProject?.channelPlatform) && (
                                    <p className="text-emerald-400 font-semibold truncate flex items-center gap-1">
                                      <Tv className="w-2.5 h-2.5 shrink-0" /> {proj.channelPlatform || proj.rawProject?.channelPlatform}
                                    </p>
                                  )}
                                  {(proj.seasonName || proj.rawProject?.seasonName) && (
                                    <p className="text-cyan-300 font-mono truncate">
                                      {proj.seasonName || proj.rawProject?.seasonName} • {proj.expectedEpisodes || proj.rawProject?.expectedEpisodes || 1} Eps • {proj.expectedShootDays || proj.rawProject?.expectedShootDays || 1} Days
                                      {(proj.episodeDuration || proj.rawProject?.episodeDuration) ? ` (${proj.episodeDuration || proj.rawProject?.episodeDuration})` : ''}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold px-1 py-0.2 rounded uppercase font-mono border bg-blue-950 text-blue-400 border-blue-800 shrink-0">
                              {proj.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                            <span className="font-extrabold text-emerald-400 font-mono text-[10.5px]">{proj.budget}</span>
                            <div className="flex items-center gap-1.5">
                              {isProjectAdminRole(currentRole) && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProjectToEdit(proj.rawProject ? { ...proj.rawProject, ...proj } : proj);
                                      setShowNewProjectModal(true);
                                    }}
                                    className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                    title="Edit Project"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => handleDeleteProjectClick(proj, e)}
                                    className="p-0.5 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-400" />
                                  </button>
                                </>
                              )}
                              <span className="text-[9.5px] font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-0.5 ml-0.5">
                                Open <ChevronRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* ========================================================================= */}
      {/* ROW 2: CALENDAR TYPE LAYOUT WITH NOTE FLAGS - 2 COLUMN VIEW */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-900 rounded-md">SCHEDULE</span>
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Schedule & Note</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button 
                type="button"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(prev => prev - 1);
                  } else {
                    setCurrentMonth(prev => prev - 1);
                  }
                }}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <span className="text-[11px] font-bold text-white font-mono px-2">
                {monthNames[currentMonth]} {currentYear}
              </span>

              <button 
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(prev => prev + 1);
                  } else {
                    setCurrentMonth(prev => prev + 1);
                  }
                }}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              type="button"
              onClick={() => {
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
              }}
              className="h-7 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 cursor-pointer"
            >
              Today
            </button>

            <button 
              type="button"
              onClick={() => setShowAddFlagModal(true)}
              className="h-7.5 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm hover:shadow-amber-900/30 border border-amber-400/30 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Flag</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          
          {/* COLUMN 1: NOW DISPLAYING (Calendar & Legend) */}
          <div className="lg:col-span-7 flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px] text-amber-400 font-black uppercase tracking-wide">NOW DISPLAYING</span>
                <span className="text-slate-600">•</span>
                <span className="text-white font-mono font-bold">{monthNames[currentMonth]} {currentYear}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Today: <span className="text-blue-400 font-bold">{today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* FLAG LEGEND BAR */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <span className="text-slate-400 font-mono uppercase text-[9px]">LEGEND:</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/80 ring-1 ring-amber-500/30 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5 text-amber-400" /> Indian Special Day
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> Meeting
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" /> Office
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" /> Location
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                <PhoneCall className="w-2.5 h-2.5" /> Call
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                <Video className="w-2.5 h-2.5" /> Shoot
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> Note
              </span>
            </div>

            {/* MONTHLY CALENDAR GRID */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 overflow-x-auto shadow-xs flex-1 flex flex-col justify-between">
              <div className="min-w-[480px]">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[9.5px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                  <div className="py-0.5">Sun</div>
                  <div className="py-0.5">Mon</div>
                  <div className="py-0.5">Tue</div>
                  <div className="py-0.5">Wed</div>
                  <div className="py-0.5">Thu</div>
                  <div className="py-0.5">Fri</div>
                  <div className="py-0.5">Sat</div>
                </div>

                {/* Calendar Cells Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cell, idx) => {
                    const dayFlags = cell.isCurrentMonth 
                      ? allEffectiveFlags.filter(f => f.dateStr === cell.fullDateStr)
                      : [];
                    const isToday = cell.isCurrentMonth && 
                      cell.day === today.getDate() && 
                      currentMonth === today.getMonth() && 
                      currentYear === today.getFullYear();

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (cell.isCurrentMonth && cell.fullDateStr) {
                            setFlagDateStr(cell.fullDateStr);
                            setShowAddFlagModal(true);
                          }
                        }}
                        className={`min-h-[42px] p-1 rounded-md border transition-all flex flex-col justify-start gap-0.5 ${
                          !cell.isCurrentMonth ? 'bg-slate-950/40 border-slate-900/60 text-slate-700 opacity-25' :
                          isToday ? 'bg-blue-950/40 border-blue-500/70 ring-1 ring-blue-500/40' :
                          'bg-slate-800/40 hover:bg-slate-800 border-slate-800 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between leading-none">
                          <span className={`text-[9.5px] font-bold font-mono ${
                            isToday ? 'w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]' : 
                            cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {cell.day}
                          </span>

                          {cell.isCurrentMonth && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlagDateStr(cell.fullDateStr);
                                setShowAddFlagModal(true);
                              }}
                              className="p-0.5 hover:bg-slate-700 text-slate-500 hover:text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Add Note Flag"
                            >
                              <Plus className="w-2 h-2" />
                            </button>
                          )}
                        </div>

                        {/* Render Flag Chips */}
                        <div className="space-y-0.5">
                          {dayFlags.map((flag) => {
                            const badgeInfo = flagCategoryBadge(flag.category);
                            const FlagIcon = badgeInfo.icon;
                            return (
                              <div 
                                key={flag.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFlagDetail(flag);
                                }}
                                className={`px-1 py-0.2 rounded text-[8.5px] leading-tight font-medium border flex items-center gap-0.5 cursor-pointer hover:scale-[1.01] transition-transform ${badgeInfo.bg}`}
                                title={`${badgeInfo.label}: ${flag.title}`}
                              >
                                <FlagIcon className="w-2 h-2 shrink-0" />
                                <span className="truncate font-sans font-bold">{flag.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: PRESENT TO FUTURE DATE WISE NOTE */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-xs">
            <div className="flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Present & Future Notes
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-amber-400 rounded-md border border-slate-700">
                  {presentToFutureFlags.length} Notes
                </span>
              </div>

              {/* Date-wise list of notes starting from today into the future (Max 4 visible at once, scroll for more) */}
              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-[315px] min-h-[310px] flex-1">
                {presentToFutureFlags.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-1.5 h-full justify-center">
                    <Calendar className="w-7 h-7 text-slate-600 mb-1" />
                    <p className="font-semibold text-slate-400">No upcoming flags or notes scheduled</p>
                    <p className="text-[11px] text-slate-500 max-w-[200px]">Click "+ Add Flag" or pick a date on the calendar to log upcoming events.</p>
                    <button 
                      type="button" 
                      onClick={() => setShowAddFlagModal(true)}
                      className="mt-2 px-3 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                    >
                      + Add Note Flag
                    </button>
                  </div>
                ) : (
                  presentToFutureFlags.map((flag) => {
                    const badgeInfo = flagCategoryBadge(flag.category);
                    const FlagIcon = badgeInfo.icon;
                    const isToday = flag.dateStr === todayStr;

                    return (
                      <div 
                        key={flag.id}
                        onClick={() => setSelectedFlagDetail(flag)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer hover:border-amber-500/50 flex flex-col gap-1 ${
                          isToday ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/20' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border ${badgeInfo.bg} flex items-center gap-1`}>
                              <FlagIcon className="w-2.5 h-2.5" />
                              {badgeInfo.label}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[8.5px] font-extrabold uppercase font-mono rounded tracking-wider">
                                TODAY
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9.5px]">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            <span>{flag.time || 'All Day'}</span>
                            <span className="text-slate-600">•</span>
                            <span className="font-bold text-amber-300">{formatDateDMY(flag.dateStr)}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-bold text-slate-100 leading-snug">{flag.title}</h4>
                          {flag.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium">{flag.description}</p>
                          )}
                        </div>

                        {flag.projectName && (
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <FolderOpen className="w-2.5 h-2.5 text-slate-600" />
                            <span className="truncate">{flag.projectName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* ROW 3: CAUTION & LOOKOUT DASHBOARD - 2 COLUMN VIEW */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-900 rounded-md">ROW 3</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">Project Cautions & Critical Lookout Alert Center</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              2-Column Watchlist: Column 1 lists monitored projects (max 5); Column 2 lists budget category overruns & warning thresholds (max 5).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
              <button 
                type="button"
                onClick={() => setCautionFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  cautionFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Issues ({cautions.length})
              </button>
              <button 
                type="button"
                onClick={() => setCautionFilter('high_risk')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  cautionFilter === 'high_risk' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Overruns
              </button>
              <button 
                type="button"
                onClick={() => setCautionFilter('warning')}
                className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  cautionFilter === 'warning' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Near Limit
              </button>
            </div>

            <button 
              type="button"
              onClick={() => setShowAddCautionModal(true)}
              className="h-7.5 px-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm hover:shadow-rose-900/40 border border-rose-400/30 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Caution</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN GRID FOR ROW 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">

          {/* COLUMN 1: PROJECT WATCHLIST (MAX 5 PROJECTS DISPLAY) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-xs">
            <div className="flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Monitored Projects (Max 5)
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {selectedCautionProjectId !== 'all' && (
                    <button 
                      type="button"
                      onClick={() => setSelectedCautionProjectId('all')}
                      className="text-[9px] text-amber-400 hover:underline font-mono mr-1"
                    >
                      Show All
                    </button>
                  )}
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-blue-400 rounded-md border border-slate-700">
                    {monitoredProjectsList.length} / 5
                  </span>
                </div>
              </div>

              {/* Projects List (Max 5 Display) */}
              <div className="space-y-2 flex-1 min-h-[300px]">
                {monitoredProjectsList.map((proj) => {
                  const isSelected = selectedCautionProjectId === proj.id;
                  const utilPercent = Math.round((proj.totalSpent / proj.totalBudget) * 100);

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => setSelectedCautionProjectId(isSelected ? 'all' : proj.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/30' 
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-bold text-white text-[11px] truncate">{proj.name}</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase font-mono border shrink-0 ${
                          proj.status === 'Over Budget' 
                            ? 'bg-rose-950 text-rose-300 border-rose-800' 
                            : proj.status === 'Near Limit' 
                            ? 'bg-amber-950 text-amber-300 border-amber-800' 
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {proj.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                        <div>
                          <span className="text-slate-500 text-[9px] block">Allocated Budget</span>
                          <span className="font-bold text-slate-200">{formatCurrencyINR(proj.totalBudget)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">Expense Spent</span>
                          <span className={`font-bold ${utilPercent > 100 ? 'text-rose-400' : utilPercent >= 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatCurrencyINR(proj.totalSpent)} ({utilPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono pt-0.5">
                        <span className="text-slate-500">{proj.companyName}</span>
                        <div className="flex items-center gap-1.5">
                          {proj.issuesCount > 0 ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {proj.issuesCount} Category {proj.issuesCount === 1 ? 'Issue' : 'Issues'}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> All Clear
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CATEGORY BUDGET ISSUES (MAX 5 CATEGORY ISSUES DISPLAY) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-xs">
            <div className="flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Category Budget Issues & Overruns (Max 5)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-rose-400 rounded-md border border-slate-700">
                  {column2CategoryIssues.length} / 5 Category Issues
                </span>
              </div>

              {/* Category Issues List (Max 5 Display) */}
              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-[300px]">
                {column2CategoryIssues.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2 h-full justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                    <p className="font-bold text-slate-300">No Category Overruns or Threshold Warnings</p>
                    <p className="text-[11px] text-slate-400 max-w-[260px]">
                      {selectedCautionProjectId !== 'all' 
                        ? 'All categories for this project are operating safely within allocated budget limits.' 
                        : 'All project budget categories are operating smoothly within allocated budgets.'}
                    </p>
                    {selectedCautionProjectId !== 'all' && (
                      <button 
                        type="button"
                        onClick={() => setSelectedCautionProjectId('all')}
                        className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-md border border-slate-700 cursor-pointer"
                      >
                        Show All Projects
                      </button>
                    )}
                  </div>
                ) : (
                  column2CategoryIssues.map((item) => {
                    const allocated = item.allocatedAmount || 100000;
                    const spent = item.spentAmount || 0;
                    const isCrossed = spent > allocated;
                    const diff = Math.abs(spent - allocated);
                    const percent = Math.round((spent / allocated) * 100);

                    return (
                      <div 
                        key={item.id}
                        className={`p-3 rounded-xl border bg-slate-800/40 space-y-2 shadow-xs transition-all ${
                          isCrossed ? 'border-rose-500/50 ring-1 ring-rose-500/20' : 'border-amber-500/50 ring-1 ring-amber-500/20'
                        }`}
                      >
                        {/* Header Badge & Category Name */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8.5px] font-extrabold font-mono uppercase px-2 py-0.2 rounded border flex items-center gap-1 ${
                                isCrossed ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}>
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                {isCrossed ? 'CRITICAL OVERRUN (BUDGET CROSSED)' : 'WARNING / NEAR BUDGET LIMIT'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">{item.projectName}</span>
                            </div>
                            <h4 className="text-xs font-black text-white">{item.categoryName || item.title}</h4>
                          </div>

                          <span className="text-[9.5px] text-slate-500 font-mono shrink-0">{item.loggedAt}</span>
                        </div>

                        {/* Financial Comparison Numbers */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[10px] font-mono">
                          <div>
                            <span className="text-slate-500 text-[8.5px] block">Allocated Budget</span>
                            <span className="font-bold text-slate-200">{formatCurrencyINR(allocated)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[8.5px] block">Expense Amount</span>
                            <span className={`font-bold ${isCrossed ? 'text-rose-400' : 'text-amber-400'}`}>
                              {formatCurrencyINR(spent)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[8.5px] block">{isCrossed ? 'Budget Crossed By' : 'Remaining Cushion'}</span>
                            <span className={`font-black ${isCrossed ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isCrossed ? `+${formatCurrencyINR(diff)} (+${percent - 100}%)` : `${formatCurrencyINR(diff)} (${percent}% used)`}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-slate-400">
                            <span>Category Budget Utilization</span>
                            <span className={`font-bold ${isCrossed ? 'text-rose-400' : 'text-amber-400'}`}>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full transition-all duration-500 rounded-full ${
                                isCrossed ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Description & Recommended Action */}
                        <p className="text-[10.5px] text-slate-300 font-medium leading-snug">{item.description}</p>

                        <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-[10px] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold font-mono text-[9px] uppercase">ACTION:</span>
                            <span className="text-slate-200 font-medium text-[10px]">{item.actionRecommended}</span>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleResolveCaution(item.id)}
                            className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[9.5px] font-bold rounded transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-2.5 h-2.5" />
                            <span>Resolve</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. CREATE PROJECT WIZARD MODAL */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-5xl my-auto">
            <CreateProjectWizard 
              initialCompanyName={activeCompany?.name}
              projectToEdit={projectToEdit}
              currentRole={currentRole}
              userEmail={userEmail}
              onDeleteProject={async (deletedId) => {
                const cleanId = deletedId.startsWith('wp_') ? deletedId.substring(3) : (deletedId.startsWith('p_') ? deletedId.substring(2) : deletedId);
                await deleteDocData('projects', `p_${cleanId}`);
                await deleteDocData('projects', cleanId);
                await deleteDocData('workspaceProjects', `wp_${cleanId}`);
                await deleteDocData('workspaceProjects', cleanId);
                await deleteDocData('workspaceProjects', deletedId);
                await deleteProject(cleanId);
                await deleteWorkspaceProject(deletedId);

                setWorkspaceProjects(prev => prev.filter(p => p.id !== deletedId && p.id !== cleanId && p.id !== `wp_${cleanId}`));
                setProjects(prev => prev.filter(p => p.id !== deletedId && p.id !== cleanId && p.id !== `p_${cleanId}`));

                if (onAddLog) {
                  onAddLog({
                    id: `l_proj_del_${Date.now()}`,
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    action: 'SYS_PROJECT_DELETE',
                    sqlQuery: `DELETE FROM projects WHERE id='${cleanId}';`,
                    status: 'success'
                  });
                }
                setToastMsg(`Project deleted successfully.`);
                setTimeout(() => setToastMsg(null), 3000);
                setShowNewProjectModal(false);
                setProjectToEdit(null);
              }}
              onProjectCreated={(newProj, newCategories, mfgLog) => {
                const cleanNewName = cleanProjectTitle(newProj.name || '').toLowerCase().trim();
                const cleanNewId = newProj.id.replace(/^(wp_|p_|proj_)/, '');

                const exists = projects.some(p => {
                  if (projectToEdit) {
                    const editCleanId = (projectToEdit.id || '').replace(/^(wp_|p_|proj_)/, '');
                    if (p.id === projectToEdit.id || p.id.replace(/^(wp_|p_|proj_)/, '') === editCleanId) return false;
                  }
                  const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
                  const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
                  return pCleanName === cleanNewName && pCleanId !== cleanNewId && p.id !== newProj.id;
                }) || workspaceProjects.some(wp => {
                  if (projectToEdit) {
                    const editCleanId = (projectToEdit.id || '').replace(/^(wp_|p_|proj_)/, '');
                    if (wp.id === projectToEdit.id || wp.id.replace(/^(wp_|p_|proj_)/, '') === editCleanId) return false;
                  }
                  const wpCleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
                  const wpCleanName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
                  return wpCleanName === cleanNewName && wpCleanId !== cleanNewId && wp.id !== newProj.id;
                });

                if (exists) {
                  alert(`Cannot create project: A project named "${newProj.name}" already exists in your workspace. Duplicate project names are not allowed.`);
                  return;
                }

                saveProject(newProj);
                saveCategoriesBatch(newCategories);
                onAddLog(mfgLog);

                const numBudget = newProj.totalBudget || 0;
                const formattedBudget = numBudget >= 10000000
                  ? `₹${(numBudget / 10000000).toFixed(1)} Cr`
                  : numBudget >= 100000 
                  ? `₹${(numBudget / 100000).toFixed(1)} L` 
                  : `₹${numBudget.toLocaleString()}`;

                let pStage: WorkspaceProject['pipelineStage'] = 'pre_prod';
                let wpStatus: WorkspaceProject['status'] = 'On Track';
                const sLow = (newProj.status || '').toLowerCase();
                if (sLow.includes('completed') || sLow.includes('done') || sLow.includes('archived')) {
                  pStage = 'completed';
                  wpStatus = 'Done';
                } else if (sLow.includes('post') || sLow.includes('edit')) {
                  pStage = 'post_prod';
                  wpStatus = 'Syncing';
                } else if (sLow.includes('prod') || sLow.includes('shoot') || sLow.includes('active')) {
                  pStage = 'in_prod';
                  wpStatus = 'On Track';
                } else if (sLow.includes('pre') || sLow.includes('plan') || sLow.includes('upcoming')) {
                  pStage = 'pre_prod';
                  wpStatus = 'Upcoming';
                }

                let extractedRef = newProj.projectCode || newProj.id.toUpperCase();
                const refMatch = newProj.name.match(/\(([^)]+)\)$/);
                if (refMatch) {
                  extractedRef = refMatch[1].toUpperCase();
                } else if (projectToEdit?.ref) {
                  extractedRef = projectToEdit.ref;
                }

                const wpId = projectToEdit?.id?.startsWith('wp_') 
                  ? projectToEdit.id 
                  : (workspaceProjects.find(wp => wp.id === `wp_${newProj.id}` || wp.id === newProj.id || wp.id.replace(/^wp_/, '') === newProj.id.replace(/^(wp_|p_)/, ''))?.id || `wp_${newProj.id.replace(/^p_/, '')}`);

                const updatedWp: WorkspaceProject = {
                  id: wpId,
                  companyId: newProj.companyId || activeCompanyId,
                  companyName: newProj.companyName,
                  name: newProj.name,
                  projectType: newProj.projectType || 'Film / Feature Production',
                  projectCode: newProj.projectCode,
                  showFormat: newProj.showFormat,
                  channelPlatform: newProj.channelPlatform,
                  ref: extractedRef,
                  status: wpStatus,
                  pipelineStage: pStage,
                  utilization: projectToEdit?.utilization ?? 0,
                  budget: formattedBudget,
                  totalBudget: numBudget,
                  compGstin: newProj.compGstin,
                  compPan: newProj.compPan,
                  compAddress: newProj.compAddress,
                  compEmail: newProj.compEmail,
                  compPhone: newProj.compPhone,
                  compLegalName: newProj.compLegalName,
                  compRegNumber: newProj.compRegNumber,
                  compCity: newProj.compCity,
                  compState: newProj.compState,
                  compCountry: newProj.compCountry,
                  compPinCode: newProj.compPinCode,
                  seasonName: newProj.seasonName,
                  seasonCode: newProj.seasonCode,
                  seasonStartDate: newProj.seasonStartDate,
                  telecastStartDate: newProj.telecastStartDate,
                  episodeDuration: newProj.episodeDuration,
                  expectedEpisodes: newProj.expectedEpisodes,
                  expectedShootDays: newProj.expectedShootDays,
                  expectedSeasonsCount: newProj.expectedSeasonsCount,
                  resources: projectToEdit?.resources || [newProj.createdBy?.substring(0, 2).toUpperCase() || 'PO'],
                  lastSync: 'Just now',
                  imgUrl: projectToEdit?.imgUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80',
                  rawProject: newProj
                };
                saveWorkspaceProject(updatedWp);

                // Instantly update local React state to reflect edited or created project
                setProjects(prev => {
                  const editCleanId = (projectToEdit?.id || '').replace(/^(wp_|p_|proj_)/, '');
                  const editCleanName = cleanProjectTitle(projectToEdit?.name || '').toLowerCase().trim();
                  const newCleanId = newProj.id.replace(/^(wp_|p_|proj_)/, '');
                  const newCleanName = cleanProjectTitle(newProj.name || '').toLowerCase().trim();

                  const filtered = prev.filter(p => {
                    const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
                    const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
                    if (p.id === newProj.id || pCleanId === newCleanId || pCleanName === newCleanName) return false;
                    if (projectToEdit && (p.id === projectToEdit.id || pCleanId === editCleanId || pCleanName === editCleanName)) return false;
                    return true;
                  });
                  return [newProj, ...filtered];
                });

                setWorkspaceProjects(prev => {
                  const editCleanId = (projectToEdit?.id || '').replace(/^(wp_|p_|proj_)/, '');
                  const editCleanName = cleanProjectTitle(projectToEdit?.name || '').toLowerCase().trim();
                  const newCleanId = newProj.id.replace(/^(wp_|p_|proj_)/, '');
                  const newCleanName = cleanProjectTitle(newProj.name || '').toLowerCase().trim();

                  const filtered = prev.filter(wp => {
                    const wpCleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
                    const wpCleanName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
                    if (wp.id === updatedWp.id || wpCleanId === newCleanId || wpCleanName === newCleanName) return false;
                    if (projectToEdit && (wp.id === projectToEdit.id || wpCleanId === editCleanId || wpCleanName === editCleanName)) return false;
                    return true;
                  });
                  return [updatedWp, ...filtered];
                });

                if (!projectToEdit && activeCompany) {
                  saveCompany({
                    ...activeCompany,
                    projectCount: (activeCompany.projectCount || 0) + 1
                  });
                }

                setShowNewProjectModal(false);
                setProjectToEdit(null);
              }}
              onCancel={() => {
                setShowNewProjectModal(false);
                setProjectToEdit(null);
              }}
            />
          </div>
        </div>
      )}


      {/* 2. REGISTER COMPANY MODAL */}
      {showNewCompanyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Register New Corporate Entity</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowNewCompanyModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompanySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Company Legal Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Greenlight Pictures Pvt Ltd"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Registered Office Address *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Plot 42, Film City, Mumbai"
                  value={newCompanyAddress}
                  onChange={(e) => setNewCompanyAddress(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">GST Number</label>
                  <input 
                    type="text"
                    maxLength={15}
                    placeholder="27ABCDE1234F1Z5"
                    value={newCompanyGst}
                    onChange={(e) => setNewCompanyGst(e.target.value.toUpperCase())}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">PAN Number</label>
                  <input 
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={newCompanyPan}
                    onChange={(e) => setNewCompanyPan(e.target.value.toUpperCase())}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Official E-mail</label>
                  <input 
                    type="email"
                    placeholder="contact@company.com"
                    value={newCompanyEmail}
                    onChange={(e) => setNewCompanyEmail(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Contact Phone</label>
                  <input 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newCompanyContact}
                    onChange={(e) => setNewCompanyContact(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowNewCompanyModal(false)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Register Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 3. ADD CALENDAR NOTE FLAG MODAL */}
      {showAddFlagModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Add Calendar Operational Flag</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddFlagModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFlag} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Flag Category *</label>
                <select 
                  value={flagCategory}
                  onChange={(e) => setFlagCategory(e.target.value as any)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none cursor-pointer"
                >
                  <option value="indian_holiday">🇮🇳 Indian Special Day / Holiday</option>
                  <option value="meeting">🤝 Meeting</option>
                  <option value="office_visit">🏢 Office Visit</option>
                  <option value="location_visit">📍 Location Visit</option>
                  <option value="call_reminder">📞 Call Reminder</option>
                  <option value="shoot_schedule">🎬 Shoot Schedule</option>
                  <option value="general_note">📝 General Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Flag Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Director & Producer Script Lock Meeting"
                  value={flagTitle}
                  onChange={(e) => setFlagTitle(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Event Date *</label>
                  <input 
                    type="date"
                    required
                    value={flagDateStr}
                    onChange={(e) => setFlagDateStr(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Time</label>
                  <input 
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={flagTime}
                    onChange={(e) => setFlagTime(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Associated Project</label>
                <select 
                  value={flagProjectId}
                  onChange={(e) => setFlagProjectId(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none cursor-pointer"
                >
                  <option value="">-- General Workspace --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Description / Agenda Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Add additional details or location address..."
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowAddFlagModal(false)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-8 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 4. CALENDAR FLAG DETAIL MODAL */}
      {selectedFlagDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${flagCategoryBadge(selectedFlagDetail.category).bg}`}>
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-white">{selectedFlagDetail.title}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedFlagDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-800/60 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">DATE & TIME</span>
                  <p className="text-white font-mono font-bold">{formatDateDMY(selectedFlagDetail.dateStr)} ({selectedFlagDetail.time || 'All Day'})</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">PROJECT</span>
                  <p className="text-blue-300 font-bold truncate">{selectedFlagDetail.projectName || 'General Workspace'}</p>
                </div>
              </div>

              {selectedFlagDetail.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">DETAILS / AGENDA</span>
                  <p className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl text-slate-200 leading-relaxed">
                    {selectedFlagDetail.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => handleDeleteFlag(selectedFlagDetail.id)}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-900 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Flag</span>
              </button>

              <button 
                type="button"
                onClick={() => setSelectedFlagDetail(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 5. ADD CAUTION MODAL */}
      {showAddCautionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Log Critical Project Caution / Lookout</span>
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddCautionModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCaution} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Target Project *</label>
                <select 
                  value={cautionProjId}
                  onChange={(e) => setCautionProjId(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none cursor-pointer"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Severity Level *</label>
                <select 
                  value={cautionSeverity}
                  onChange={(e) => setCautionSeverity(e.target.value as any)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none cursor-pointer"
                >
                  <option value="high_risk">🔴 Critical Overrun Risk</option>
                  <option value="warning">🟡 Warning / Uncleared Advance</option>
                  <option value="permit_lookout">🔵 Permit Expiry / Compliance Lookout</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Caution Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Catering Budget Limit Reached"
                  value={cautionTitle}
                  onChange={(e) => setCautionTitle(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Category / Component</label>
                <input 
                  type="text"
                  placeholder="e.g. Camera Rentals or Cash Advances"
                  value={cautionCategoryName}
                  onChange={(e) => setCautionCategoryName(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Cause & Impact Description</label>
                <textarea 
                  rows={2}
                  placeholder="Describe cause of caution and risk impact..."
                  value={cautionDesc}
                  onChange={(e) => setCautionDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Recommended Action</label>
                <input 
                  type="text"
                  placeholder="e.g. Audit original vendor invoices immediately"
                  value={cautionAction}
                  onChange={(e) => setCautionAction(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowAddCautionModal(false)}
                  className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="h-8 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Log Caution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE PROJECT CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                <span>Delete Project Confirmation</span>
              </h2>
              <button 
                type="button"
                onClick={() => setDeletingProject(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl space-y-1">
                <p className="font-bold text-rose-300">
                  Are you sure you want to delete project "{deletingProject.name}"?
                </p>
                <p className="text-[11px] text-slate-400">
                  This action will permanently delete the project record and its workspace folder from the database server. This action cannot be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block uppercase text-[9px]">Project Ref:</span>
                  <span className="text-slate-200 font-bold">{deletingProject.ref || deletingProject.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[9px]">Budget:</span>
                  <span className="text-emerald-400 font-bold">{deletingProject.budget}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setDeletingProject(null)}
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmDeleteProject}
                className="h-8 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Internal helper component
function FilmIcon(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M7 3v18"/>
      <path d="M3 7.5h4"/>
      <path d="M3 12h18"/>
      <path d="M3 16.5h4"/>
      <path d="M17 3v18"/>
      <path d="M17 7.5h4"/>
      <path d="M17 16.5h4"/>
    </svg>
  );
}
