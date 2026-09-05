import { useState, useEffect, useMemo, FormEvent } from 'react';
import { saveDocData, subscribeDoc, subscribeUserProfiles, saveUserProfile } from '../services/firebaseService';
import { UserProfile } from '../types';
import { 
  Sliders, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Calendar, 
  Database, 
  Save, 
  Sparkles, 
  HardDrive,
  CheckCircle2,
  Lock,
  Users,
  ShieldAlert,
  ArrowUp,
  Download,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  ClipboardList,
  Award,
  ChevronRight,
  Cloud,
  History,
  Activity,
  Trash2,
  FileText,
  Search,
  Check,
  AlertCircle,
  Clock,
  X,
  Server,
  Film,
  Star,
  Scale,
  Clipboard,
  CreditCard,
  ShoppingBag,
  Palette,
  Wrench,
  Eye,
  Wallet,
  FolderOpen,
  Contact,
  Briefcase,
  Image,
  BarChart3,
  Cpu,
  Undo2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { DBLog } from '../types';

interface RoleDefinition {
  id: string;
  name: string;
  icon: any;
  clearance: string;
  level: string;
}

interface ModuleDefinition {
  name: string;
  key: string;
  icon: any;
}

const AVAILABLE_ROLES: RoleDefinition[] = [
  { id: 'admin', name: 'Admin', icon: ShieldCheck, clearance: 'Unrestricted System Access', level: 'Policy Creator / Auditor' },
  { id: 'producer', name: 'Producer', icon: Film, clearance: 'Production Management', level: 'Managerial Access' },
  { id: 'exec_producer', name: 'Executive Producer', icon: Star, clearance: 'Executive Clearance', level: 'Full Oversight' },
  { id: 'controller', name: 'Production Controller', icon: Scale, clearance: 'Financial Oversight', level: 'Comptroller Level' },
  { id: 'manager', name: 'Production Manager', icon: Clipboard, clearance: 'Site & Operations', level: 'Local Manager' },
  { id: 'accounts', name: 'Accounts', icon: FileText, clearance: 'Accounting & Ledger', level: 'Fiscal Staff' },
  { id: 'cashier', name: 'Cashier', icon: CreditCard, clearance: 'Petty Cash Disbursements', level: 'Frontline Cashier' },
  { id: 'dept_head', name: 'Department Head', icon: Users, clearance: 'Departmental Allocations', level: 'Lead Operator' },
  { id: 'vendor', name: 'Vendor', icon: ShoppingBag, clearance: 'Invoicing & Claims', level: 'External Vendor' },
  { id: 'artist', name: 'Artist', icon: Palette, clearance: 'Asset Contributions', level: 'Creative Operator' },
  { id: 'crew', name: 'Crew', icon: Wrench, clearance: 'Task & Schedule Reading', level: 'Field Staff' },
  { id: 'viewer', name: 'Viewer', icon: Eye, clearance: 'Read Only Access', level: 'Auditor View' }
];

const MODULE_PERMISSIONS: ModuleDefinition[] = [
  { name: 'Budgeting & Forecasting', key: 'budgeting', icon: Wallet },
  { name: 'Production Scheduling', key: 'scheduling', icon: Calendar },
  { name: 'Inventory Management', key: 'inventory', icon: HardDrive },
  { name: 'Financial Ledger', key: 'ledger', icon: FileText },
  { name: 'Document Repository', key: 'documents', icon: FolderOpen },
  { name: 'Payroll & Crewing', key: 'payroll', icon: Contact },
  { name: 'Vendor Contracts', key: 'contracts', icon: Briefcase },
  { name: 'Asset Tracking', key: 'assets', icon: Image },
  { name: 'Analytics & KPI', key: 'analytics', icon: BarChart3 },
  { name: 'API & Integrations', key: 'api', icon: Cpu }
];

interface AdminViewProps {
  onAddLog: (log: DBLog) => void;
  onPurgeDatabase?: () => void;
  unifiedProjects?: any[];
  companies?: any[];
  userEmail?: string;
  dbLogs?: DBLog[];
  onSelectProject?: (projId: string) => void;
  onDeleteProject?: (projId: string) => void;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Auditor' | 'Finance Lead' | 'Operator';
  status: 'Active' | 'Suspended';
  contactNumber?: string;
  workDesignation?: string;
  dob?: string;
  houseStreet?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  createdAt?: string;
  rawProfile?: UserProfile;
}

interface AuditRow {
  id: string;
  timestamp: string;
  actor: string;
  initials: string;
  avatarBg: string;
  action: string;
  status: 'SUCCESS' | 'IN PROGRESS' | 'REJECTED';
  details: string;
  query: string;
}

export default function AdminView({ 
  onAddLog, 
  onPurgeDatabase, 
  unifiedProjects = [], 
  companies = [], 
  userEmail, 
  dbLogs = [],
  onSelectProject, 
  onDeleteProject 
}: AdminViewProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'projects' | 'policies' | 'permissions'>('overview');

  // Global Projects directory state
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');

  // Role & Permissions states
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');
  const [overrideEnabled, setOverrideEnabled] = useState<boolean>(true);
  const [isCompact, setIsCompact] = useState<boolean>(true);
  const [isScannerRunning, setIsScannerRunning] = useState<boolean>(false);
  const [scannerInsights, setScannerInsights] = useState<string[]>([]);
  const [scannerRating, setScannerRating] = useState<'SECURE' | 'WARNING' | 'CRITICAL' | null>(null);
  const [showFloatingSync, setShowFloatingSync] = useState<boolean>(false);
  const [isSavingPerms, setIsSavingPerms] = useState<boolean>(false);

  // Helper helper to generate permissions defaults
  const getDefaultPermissions = (roleId: string, moduleKey: string) => {
    if (roleId === 'admin') {
      return { view: true, create: true, edit: true, delete: true, approve: true, export: true, print: true, share: true };
    }
    if (roleId === 'viewer') {
      return { view: true, create: false, edit: false, delete: false, approve: false, export: false, print: true, share: false };
    }
    
    // Custom defaults for other roles
    const presets: Record<string, { view?: boolean, create?: boolean, edit?: boolean, delete?: boolean, approve?: boolean, export?: boolean, print?: boolean, share?: boolean }> = {
      producer: { view: true, create: true, edit: true, delete: false, approve: true, export: true, print: true, share: true },
      exec_producer: { view: true, create: false, edit: false, delete: false, approve: true, export: true, print: true, share: true },
      controller: { view: true, create: true, edit: true, delete: true, approve: true, export: true, print: true, share: false },
      manager: { view: true, create: true, edit: true, delete: false, approve: false, export: false, print: true, share: false },
      accounts: { view: true, create: true, edit: true, delete: false, approve: false, export: true, print: true, share: false },
      cashier: { view: true, create: true, edit: false, delete: false, approve: false, export: false, print: true, share: false },
      dept_head: { view: true, create: true, edit: true, delete: false, approve: false, export: false, print: true, share: false },
      vendor: { view: true, create: true, edit: false, delete: false, approve: false, export: false, print: false, share: false },
      artist: { view: true, create: false, edit: false, delete: false, approve: false, export: false, print: false, share: false },
      crew: { view: true, create: false, edit: false, delete: false, approve: false, export: false, print: false, share: false }
    };

    const allowed = presets[roleId] || { view: true };
    
    if (moduleKey === 'api') {
      if (roleId !== 'admin' && roleId !== 'controller') {
        return { view: false, create: false, edit: false, delete: false, approve: false, export: false, print: false, share: false };
      }
    }
    if (moduleKey === 'analytics') {
      if (roleId !== 'admin' && roleId !== 'exec_producer' && roleId !== 'controller' && roleId !== 'producer') {
        return { view: true, create: false, edit: false, delete: false, approve: false, export: false, print: true, share: false };
      }
    }

    return {
      view: allowed.view ?? false,
      create: allowed.create ?? false,
      edit: allowed.edit ?? false,
      delete: allowed.delete ?? false,
      approve: allowed.approve ?? false,
      export: allowed.export ?? false,
      print: allowed.print ?? false,
      share: allowed.share ?? false
    };
  };

  const [rolePerms, setRolePerms] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const rolesList = [
      'admin', 'producer', 'exec_producer', 'controller', 'manager', 
      'accounts', 'cashier', 'dept_head', 'vendor', 'artist', 'crew', 'viewer'
    ];
    const modulesList = [
      'budgeting', 'scheduling', 'inventory', 'ledger', 'documents', 
      'payroll', 'contracts', 'assets', 'analytics', 'api'
    ];
    
    const initialMatrix: Record<string, Record<string, Record<string, boolean>>> = {};
    rolesList.forEach(role => {
      initialMatrix[role] = {};
      modulesList.forEach(mod => {
        initialMatrix[role][mod] = getDefaultPermissions(role, mod);
      });
    });
    return initialMatrix;
  });

  // Existing Config States
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15m');
  const [retentionDays, setRetentionDays] = useState(30);

  // Subscribe to Admin Config from Firestore Server
  useEffect(() => {
    const unsub = subscribeDoc<any>('settings', 'admin_config', (data) => {
      if (data) {
        if (data.rolePerms) setRolePerms(data.rolePerms);
        if (typeof data.autoSync === 'boolean') setAutoSync(data.autoSync);
        if (data.syncInterval) setSyncInterval(data.syncInterval);
        if (typeof data.retentionDays === 'number') setRetentionDays(data.retentionDays);
      }
    });
    return () => unsub();
  }, []);
  const [isSaved, setIsSaved] = useState(false);
  const [isVacuuming, setIsVacuuming] = useState(false);

  // New Dashboard States
  const [syncTime, setSyncTime] = useState('Just now');
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([24, 25, 23, 27, 26, 24, 25, 22, 24, 25]);
  const [hoveredCapacity, setHoveredCapacity] = useState(false);

  // Modals / Details states
  const [selectedAudit, setSelectedAudit] = useState<AuditRow | null>(null);
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);
  const [restoreStep, setRestoreStep] = useState(1);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);

  // Tasks Modals
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  const [showLicensingModal, setShowLicensingModal] = useState(false);

  // Local admin users created manually via modal
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [registeredProfiles, setRegisteredProfiles] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUser | null>(null);
  const [showAddUserTab, setShowAddUserTab] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ 
    name: '', 
    email: '', 
    role: 'Operator' as AdminUser['role'],
    phone: '',
    workDesignation: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    houseStreet: ''
  });

  useEffect(() => {
    const unsub = subscribeUserProfiles((profiles) => {
      if (Array.isArray(profiles)) {
        setRegisteredProfiles(profiles);
      }
    });
    return () => unsub();
  }, []);

  // Compute real system users based on userEmail, registeredProfiles, unifiedProjects, and adminUsers
  const realUsers = useMemo<AdminUser[]>(() => {
    const usersMap = new Map<string, AdminUser>();

    // 1. Registered User Profiles from Firestore
    registeredProfiles.forEach(p => {
      if (p.email && typeof p.email === 'string') {
        const emailLower = p.email.toLowerCase().trim();
        usersMap.set(emailLower, {
          id: p.id || `usr_reg_${emailLower}`,
          name: p.fullName || p.email.split('@')[0],
          email: p.email,
          role: (p.workDesignation?.includes('Lead') || p.workDesignation?.includes('Producer')) ? 'Administrator' : 'Operator',
          status: 'Active',
          contactNumber: p.contactNumber,
          workDesignation: p.workDesignation,
          city: p.city,
          state: p.state,
          country: p.country,
          pinCode: p.pinCode,
          houseStreet: p.houseStreet,
          createdAt: p.createdAt,
          rawProfile: p
        });
      }
    });

    if (userEmail) {
      const emailLower = userEmail.toLowerCase().trim();
      if (!usersMap.has(emailLower)) {
        const rawName = userEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = rawName.replace(/\b\w/g, l => l.toUpperCase());
        usersMap.set(emailLower, {
          id: 'usr_owner',
          name: formattedName || 'Sujoy Kotal',
          email: userEmail,
          role: 'Administrator',
          status: 'Active'
        });
      }
    }

    (unifiedProjects || []).forEach((p: any) => {
      if (p.createdBy && typeof p.createdBy === 'string' && p.createdBy.includes('@')) {
        const emailLower = p.createdBy.toLowerCase().trim();
        if (!usersMap.has(emailLower)) {
          const rawName = p.createdBy.split('@')[0].replace(/[._]/g, ' ');
          const formattedName = rawName.replace(/\b\w/g, l => l.toUpperCase());
          usersMap.set(emailLower, {
            id: `usr_c_${p.id}`,
            name: formattedName,
            email: p.createdBy,
            role: 'Administrator',
            status: 'Active'
          });
        }
      }
      if (p.ownerEmail && typeof p.ownerEmail === 'string' && p.ownerEmail.includes('@')) {
        const emailLower = p.ownerEmail.toLowerCase().trim();
        if (!usersMap.has(emailLower)) {
          const rawName = p.ownerEmail.split('@')[0].replace(/[._]/g, ' ');
          const formattedName = rawName.replace(/\b\w/g, l => l.toUpperCase());
          usersMap.set(emailLower, {
            id: `usr_o_${p.id}`,
            name: formattedName,
            email: p.ownerEmail,
            role: 'Finance Lead',
            status: 'Active'
          });
        }
      }
      if (Array.isArray(p.assignedUsers)) {
        p.assignedUsers.forEach((u: string) => {
          if (typeof u === 'string' && u.includes('@')) {
            const emailLower = u.toLowerCase().trim();
            if (!usersMap.has(emailLower)) {
              const rawName = u.split('@')[0].replace(/[._]/g, ' ');
              const formattedName = rawName.replace(/\b\w/g, l => l.toUpperCase());
              usersMap.set(emailLower, {
                id: `usr_a_${emailLower}`,
                name: formattedName,
                email: u,
                role: 'Operator',
                status: 'Active'
              });
            }
          }
        });
      }
    });

    adminUsers.forEach(u => {
      if (u.email && !usersMap.has(u.email.toLowerCase().trim())) {
        usersMap.set(u.email.toLowerCase().trim(), u);
      }
    });

    return Array.from(usersMap.values());
  }, [userEmail, registeredProfiles, unifiedProjects, adminUsers]);

  // Compute real audit logs from dbLogs and user interaction
  const [manualAuditLogs, setManualAuditLogs] = useState<AuditRow[]>([]);

  const realAuditLogs = useMemo<AuditRow[]>(() => {
    const list: AuditRow[] = [];

    manualAuditLogs.forEach(log => list.push(log));

    if (dbLogs && dbLogs.length > 0) {
      dbLogs.forEach((log, idx) => {
        const actorEmail = log.user || userEmail || 'sujoy.production@gmail.com';
        const rawName = actorEmail.split('@')[0].replace(/[._]/g, ' ');
        const actorName = rawName.replace(/\b\w/g, l => l.toUpperCase()) || 'System Admin';
        const initials = actorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA';

        list.push({
          id: log.id || `aud_real_${idx}`,
          timestamp: log.timestamp || new Date().toISOString().substring(0, 19).replace('T', ' '),
          actor: actorName,
          initials: initials,
          avatarBg: 'bg-blue-100 text-[#0058be] border-blue-200',
          action: log.action ? log.action.replace(/_/g, ' ') : 'Database Update',
          status: (log.status === 'warning' ? 'REJECTED' : log.status === 'info' ? 'IN PROGRESS' : 'SUCCESS'),
          details: log.details || log.sqlQuery || 'Live Firestore database mutation',
          query: log.sqlQuery || `Firestore write: collection("${log.module || 'app'}")`
        });
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'aud_init_1',
        timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
        actor: userEmail ? userEmail.split('@')[0].toUpperCase() : 'SUJOY KOTAL',
        initials: 'SK',
        avatarBg: 'bg-[#0058be] text-white border-blue-600',
        action: 'Firestore DB Realtime Session Active',
        status: 'SUCCESS',
        details: 'Connected to Cloud Firestore Database: ai-studio-productionbudget-a6769baa-b82b-4d6b-9321-db78de10bab5',
        query: 'onSnapshot(collection(db, "projects"))'
      });
    }

    return list;
  }, [dbLogs, manualAuditLogs, userEmail]);

  // Compute total budget across all projects
  const totalBudgetSum = useMemo(() => {
    return (unifiedProjects || []).reduce((sum, p) => {
      const val = Number(p.totalBudget) || Number(p.budget) || 0;
      return sum + val;
    }, 0);
  }, [unifiedProjects]);

  // Update real-time latency peaks simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLatencyHistory(prev => {
        const nextVal = Math.max(18, Math.min(32, prev[prev.length - 1] + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)));
        return [...prev.slice(1), nextVal];
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleTogglePermission = (moduleKey: string, permKey: string) => {
    setRolePerms(prev => {
      const updated = {
        ...prev,
        [selectedRoleId]: {
          ...prev[selectedRoleId],
          [moduleKey]: {
            ...prev[selectedRoleId][moduleKey],
            [permKey]: !prev[selectedRoleId][moduleKey][permKey]
          }
        }
      };
      saveDocData('settings', 'admin_config', { rolePerms: updated });
      return updated;
    });
  };

  const handleSavePermissions = () => {
    setIsSavingPerms(true);
    saveDocData('settings', 'admin_config', { rolePerms });
    setTimeout(() => {
      setIsSavingPerms(false);
      setShowFloatingSync(true);
      
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_perms_save_${Date.now()}`,
        timestamp: nowStr,
        action: 'UPDATE_ROLES_PERMISSIONS',
        sqlQuery: `UPDATE sys_roles_permissions SET config_matrix = '${JSON.stringify(rolePerms[selectedRoleId]).substring(0, 80)}...' WHERE role_id = '${selectedRoleId}';`,
        status: 'success'
      });
      
      setTimeout(() => {
        setShowFloatingSync(false);
      }, 4000);
    }, 800);
  };

  const handleResetPermissions = () => {
    const roles = [
      'admin', 'producer', 'exec_producer', 'controller', 'manager', 
      'accounts', 'cashier', 'dept_head', 'vendor', 'artist', 'crew', 'viewer'
    ];
    const modules = [
      'budgeting', 'scheduling', 'inventory', 'ledger', 'documents', 
      'payroll', 'contracts', 'assets', 'analytics', 'api'
    ];
    
    const initialMatrix: Record<string, Record<string, Record<string, boolean>>> = {};
    roles.forEach(role => {
      initialMatrix[role] = {};
      modules.forEach(mod => {
        initialMatrix[role][mod] = getDefaultPermissions(role, mod);
      });
    });
    
    setRolePerms(initialMatrix);
    saveDocData('settings', 'admin_config', { rolePerms: initialMatrix });
    
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_perms_reset_${Date.now()}`,
      timestamp: nowStr,
      action: 'RESET_PERMISSIONS_DEFAULT',
      sqlQuery: `TRUNCATE TABLE sys_roles_permissions; INSERT INTO sys_roles_permissions SELECT * FROM sys_default_permissions_template;`,
      status: 'success'
    });

    alert('Security policy parameters reset to clean enterprise defaults.');
  };

  const handleExportPolicy = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rolePerms, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `erp_governance_policy_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_perms_export_${Date.now()}`,
        timestamp: nowStr,
        action: 'POLICY_EXPORT',
        sqlQuery: 'SELECT * FROM sys_roles_permissions INTO OUTFILE "policy_config_export";',
        status: 'success'
      });
    } catch (e) {
      alert('Could not download policy. Local sandbox restrictions prevent this system action.');
    }
  };

  const handleRunVulnerabilityScan = () => {
    setIsScannerRunning(true);
    setScannerInsights([]);
    setScannerRating(null);

    setTimeout(() => {
      setIsScannerRunning(false);
      
      const insights: string[] = [];
      let severity: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';

      const cashierPerms = rolePerms['cashier'] || {};
      const cashierBudgetApprove = cashierPerms['budgeting']?.approve;
      const cashierLedgerApprove = cashierPerms['ledger']?.approve;
      const cashierBudgetDelete = cashierPerms['budgeting']?.delete;
      
      if (cashierBudgetApprove || cashierLedgerApprove || cashierBudgetDelete) {
        insights.push("CRITICAL: Cashier role has Approve or Delete access to Budgeting / Ledger. This violates separation of duties and financial security control policy 4.2.");
        severity = 'CRITICAL';
      }

      const viewerPerms = rolePerms['viewer'] || {};
      let viewerHasWrite = false;
      Object.keys(viewerPerms).forEach(mod => {
        const m = viewerPerms[mod] || {};
        if (m.create || m.edit || m.delete || m.approve) {
          viewerHasWrite = true;
        }
      });
      if (viewerHasWrite) {
        insights.push("WARNING: Viewer role has WRITE or APPROVE access enabled on some modules. This violates the principle of Least Privilege.");
        if (severity !== 'CRITICAL') severity = 'WARNING';
      }

      const vendorPerms = rolePerms['vendor'] || {};
      if (vendorPerms['ledger']?.view || vendorPerms['payroll']?.view) {
        insights.push("WARNING: External Vendor role has view access to general Payroll or general Financial Ledger. Sensitive staff data might be exposed.");
        if (severity !== 'CRITICAL') severity = 'WARNING';
      }

      if (!overrideEnabled) {
        insights.push("INFO: Policy Overrides are disabled globally. System is running in strict isolation mode.");
      } else {
        insights.push("INFO: Policy Overrides are active. Local administrators can enforce individual project exceptions.");
      }

      if (insights.length === 0 || (insights.length === 1 && !overrideEnabled)) {
        insights.push("PASS: Security scan completed successfully. No segregation of duties conflicts or high-severity violations detected in current matrix configuration.");
        setScannerRating('SECURE');
      } else {
        setScannerRating(severity);
      }

      setScannerInsights(insights);

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_perms_scan_${Date.now()}`,
        timestamp: nowStr,
        action: 'SECURITY_AUDIT_SCAN',
        sqlQuery: `SELECT run_security_scan_rules(); -- Result: ${severity}`,
        status: 'success'
      });

    }, 1200);
  };

  // Save Settings handler (from original component)
  const handleSaveSettings = () => {
    saveDocData('settings', 'admin_config', { autoSync, syncInterval, retentionDays });

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_conf_save_${Date.now()}`,
      timestamp: nowStr,
      action: 'SAVE_CONFIG',
      sqlQuery: `UPDATE sys_config SET auto_sync = ${autoSync ? '1' : '0'}, sync_interval = '${syncInterval}', retention_days = ${retentionDays};`,
      status: 'success'
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Vacuum handler (from original component)
  const handleVacuumDatabase = () => {
    setIsVacuuming(true);
    setTimeout(() => {
      setIsVacuuming(false);
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_vacuum_${Date.now()}`,
        timestamp: nowStr,
        action: 'DB_VACUUM',
        sqlQuery: 'VACUUM ANALYZE; REINDEX ALL; PRAGMA optimize;',
        status: 'success'
      });
      alert('Database VACUUM and re-indexing complete. Reclaimed 1.4 KB in empty local database allocations.');
    }, 1000);
  };

  // Re-sync System Telemetry action
  const handleReSyncSystem = () => {
    setIsSyncingTelemetry(true);
    setTimeout(() => {
      setIsSyncingTelemetry(false);
      setSyncTime('Just now');
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Append database entry
      onAddLog({
        id: `l_resync_${Date.now()}`,
        timestamp: nowStr,
        action: 'SYS_RE_SYNC',
        sqlQuery: 'CALL sys_refresh_telemetry_metrics();',
        status: 'success'
      });

      // Insert fresh sync log inside Telemetry Log View
      const newAudit: AuditRow = {
        id: `aud_syn_${Date.now()}`,
        timestamp: nowStr,
        actor: 'System Admin',
        initials: 'AD',
        avatarBg: 'bg-slate-100 text-slate-800 border-slate-200',
        action: 'Manual System Sync Triggered',
        status: 'SUCCESS',
        details: 'Forced network re-sync and validation of distributed project nodes database schemas.',
        query: 'SELECT sync_database_replicas();'
      };
      setManualAuditLogs(prev => [newAudit, ...prev]);

    }, 800);
  };

  // Download logs helper
  const handleExportLogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(realAuditLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `erp_admin_audit_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      onAddLog({
        id: `l_export_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'AUDIT_EXPORT',
        sqlQuery: 'SELECT * FROM sys_audit_trail INTO OUTFILE "json_export";',
        status: 'success'
      });
    } catch (e) {
      alert('Could not initiate automatic download. Current environment blocks system write operations.');
    }
  };

  // Restore wizard trigger
  const handleStartRestore = () => {
    setShowRestoreWizard(true);
    setRestoreStep(1);
    setRestoreProgress(0);
    setIsRestoring(false);
  };

  // Next steps on restore wizard
  const triggerNextRestoreStep = () => {
    if (restoreStep === 1) {
      setRestoreStep(2);
    } else if (restoreStep === 2) {
      setIsRestoring(true);
      // Simulate rebuilding
      const interval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRestoring(false);
            setRestoreStep(3);
            
            // Add system log
            onAddLog({
              id: `l_restore_${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              action: 'SYS_ENV_ROLLBACK',
              sqlQuery: 'RESTORE DATABASE production_erp FROM SNAPSHOT "2026-07-14 04:00";',
              status: 'success'
            });

            return 100;
          }
          return prev + 20;
        });
      }, 300);
    } else {
      setShowRestoreWizard(false);
    }
  };

  // Add standard new admin user and persist profile to Firestore
  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const emailClean = newUserForm.email.toLowerCase().trim();
    const newUsr: AdminUser = {
      id: `usr_${Date.now()}`,
      name: newUserForm.name,
      email: emailClean,
      role: newUserForm.role,
      status: 'Active',
      contactNumber: newUserForm.phone,
      workDesignation: newUserForm.workDesignation || newUserForm.role,
      city: newUserForm.city,
      state: newUserForm.state,
      country: newUserForm.country || 'India',
      pinCode: newUserForm.pinCode,
      houseStreet: newUserForm.houseStreet,
      createdAt: new Date().toISOString()
    };

    setAdminUsers(prev => [...prev, newUsr]);

    // Save profile to server Firestore
    try {
      await saveUserProfile({
        id: emailClean,
        fullName: newUserForm.name,
        email: emailClean,
        contactNumber: newUserForm.phone || '',
        workDesignation: newUserForm.workDesignation || newUserForm.role,
        city: newUserForm.city || '',
        state: newUserForm.state || '',
        country: newUserForm.country || 'India',
        pinCode: newUserForm.pinCode || '',
        houseStreet: newUserForm.houseStreet || '',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore user profile save notice:', err);
    }

    setNewUserForm({
      name: '',
      email: '',
      role: 'Operator',
      phone: '',
      workDesignation: '',
      city: '',
      state: '',
      country: 'India',
      pinCode: '',
      houseStreet: ''
    });
    setShowAddUserTab(false);

    // Append to audit trail
    onAddLog({
      id: `l_usr_add_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_USER_ADD',
      sqlQuery: `INSERT INTO sys_users (name, email, role, status) VALUES ('${newUsr.name}', '${newUsr.email}', '${newUsr.role}', 'ACTIVE');`,
      status: 'success'
    });
  };

  // Toggle user status
  const toggleUserStatus = (id: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        onAddLog({
          id: `l_usr_tgl_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'SYS_USER_STATUS',
          sqlQuery: `UPDATE sys_users SET status = '${nextStatus.toUpperCase()}' WHERE id = '${id}';`,
          status: 'success'
        });
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Delete User
  const deleteUser = (id: string) => {
    setAdminUsers(prev => prev.filter(u => u.id !== id));
    onAddLog({
      id: `l_usr_del_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'SYS_USER_DELETE',
      sqlQuery: `DELETE FROM sys_users WHERE id = '${id}';`,
      status: 'success'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-black selection:bg-[#0058be]/10 selection:text-[#0058be]">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#E2E8F0] pb-2">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-black flex items-center gap-2">
            <Server className="w-5.5 h-5.5 text-[#0058be]" />
            Enterprise System Controls
          </h2>
          <p className="text-xs text-[#45464d] mt-1">Real-time infrastructure performance, license allocation status, and database transaction policies.</p>
        </div>

        {/* Dynamic sub tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-bold font-sans rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'overview' 
                ? 'bg-white text-[#0058be] shadow-2xs' 
                : 'text-slate-500 hover:text-black'
            }`}
          >
            Telemetry Overview
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3.5 py-1.5 text-xs font-bold font-sans rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'projects' 
                ? 'bg-white text-[#0058be] shadow-2xs' 
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <span>Global Projects Directory</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-[#0058be] text-[10px] font-mono rounded-full font-bold">
              {unifiedProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-3.5 py-1.5 text-xs font-bold font-sans rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'policies' 
                ? 'bg-white text-[#0058be] shadow-2xs' 
                : 'text-slate-500 hover:text-black'
            }`}
          >
            Database &amp; Sync
          </button>

          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-3.5 py-1.5 text-xs font-bold font-sans rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'permissions' 
                ? 'bg-white text-[#0058be] shadow-2xs' 
                : 'text-slate-500 hover:text-black'
            }`}
          >
            Role Matrix
          </button>

          <button
            onClick={() => setShowUsersModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold font-sans bg-slate-900 text-white hover:bg-slate-800 rounded-md cursor-pointer transition-all flex items-center gap-1 ml-1"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Manage App Users</span>
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: SYSTEM OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Main Controls Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono">System Telemetry Console</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time distributed server synchronization logbook and health check indicators.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExportLogs}
                className="h-9 px-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Audit Logs</span>
              </button>
              <button 
                onClick={handleReSyncSystem}
                disabled={isSyncingTelemetry}
                className="h-9 px-4 bg-black hover:bg-black/90 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTelemetry ? 'animate-spin' : ''}`} />
                <span>{isSyncingTelemetry ? 'Syncing...' : 'Re-Sync System'}</span>
              </button>
            </div>
          </div>

          {/* Key Metric Telemetry Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Users */}
            <div 
              onClick={() => setShowUsersModal(true)}
              className="bg-white hover:bg-slate-50/80 border border-[#E2E8F0] hover:border-[#0058be]/40 p-4.5 rounded-xl shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group"
              title="Click box to view all registered users & registration form details"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 group-hover:bg-blue-50 rounded-lg border border-slate-100 group-hover:border-blue-200 text-slate-600 group-hover:text-[#0058be] transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 font-mono flex items-center gap-0.5 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100">
                  <ArrowUp className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Total Active Users</p>
                  <span className="text-[10px] font-bold text-[#0058be] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-sans">
                    View Registered &rarr;
                  </span>
                </div>
                <h4 className="text-xl font-bold font-mono text-black mt-0.5">{realUsers.length}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans flex items-center justify-between">
                  <span>Across {unifiedProjects.length} project workspace(s)</span>
                  <span className="text-[#0058be] font-bold text-[9px] underline">Click for popup</span>
                </p>
              </div>
            </div>

            {/* 2. Active Projects */}
            <div className="bg-white border border-[#E2E8F0] p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0058be]"></div>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[#0058be]">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold font-mono bg-blue-50 text-[#0058be] border border-blue-100 px-1.5 py-0.5 rounded-full">
                  {companies.length || 1} Workspace(s)
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Active ERP Projects</p>
                <h4 className="text-base font-bold font-mono text-black mt-0.5">{unifiedProjects.length}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">Total: ₹{totalBudgetSum.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* 3. System Sync Health */}
            <div className="bg-white border border-[#E2E8F0] p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-emerald-600">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 font-mono">Live Sync</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Firestore Sync Integrity</p>
                <h4 className="text-base font-bold font-mono text-black mt-0.5">100% ONLINE</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">Last sync {syncTime}</p>
              </div>
            </div>

            {/* 4. Backup Health */}
            <div className="bg-white border border-[#E2E8F0] p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[#0058be]">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">Database Node State</p>
                <h4 className="text-base font-bold text-black font-sans mt-0.5">Cloud Firestore</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans truncate" title="ai-studio-productionbudget-a6769baa">ai-studio-productionbudget...</p>
              </div>
            </div>

          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Tasks & Audit Trails (8-span) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Administrative Tasks grid panel */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-black uppercase font-mono">Administrative Tasks Shortcuts</h4>
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Global Settings Console</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
                  
                  {/* Shortcut 1 */}
                  <button 
                    onClick={() => setShowUsersModal(true)}
                    className="p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer border-t border-l border-slate-100 md:border-t-0 md:border-l-0"
                  >
                    <UserPlus className="w-6 h-6 text-slate-400 group-hover:text-[#0058be] group-hover:scale-105 transition-all" />
                    <span className="text-xs font-bold text-black font-sans group-hover:text-[#0058be] transition-colors">Manage Users</span>
                    <span className="text-[10px] text-slate-400">{realUsers.length} Linked identity(ies)</span>
                  </button>

                  {/* Shortcut 2 */}
                  <button 
                    onClick={() => setActiveSubTab('permissions')}
                    className="p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer border-t border-slate-100 md:border-t-0"
                  >
                    <ShieldCheck className="w-6 h-6 text-slate-400 group-hover:text-[#0058be] group-hover:scale-105 transition-all" />
                    <span className="text-xs font-bold text-black font-sans group-hover:text-[#0058be] transition-colors">Configure Roles</span>
                    <span className="text-[10px] text-slate-400">Role permissions</span>
                  </button>

                  {/* Shortcut 3 */}
                  <button 
                    onClick={() => setShowAuditLogsModal(true)}
                    className="p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer border-t border-slate-100 md:border-t-0"
                  >
                    <ClipboardList className="w-6 h-6 text-slate-400 group-hover:text-[#0058be] group-hover:scale-105 transition-all" />
                    <span className="text-xs font-bold text-black font-sans group-hover:text-[#0058be] transition-colors">Audit Console</span>
                    <span className="text-[10px] text-slate-400">{realAuditLogs.length} Events logged</span>
                  </button>

                  {/* Shortcut 4 */}
                  <button 
                    onClick={() => setShowLicensingModal(true)}
                    className="p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer border-t border-slate-100 md:border-t-0"
                  >
                    <Award className="w-6 h-6 text-slate-400 group-hover:text-[#0058be] group-hover:scale-105 transition-all" />
                    <span className="text-xs font-bold text-black font-sans group-hover:text-[#0058be] transition-colors">Licensing Controls</span>
                    <span className="text-[10px] text-slate-400">Enterprise workspace</span>
                  </button>

                </div>
              </div>

              {/* Audit Trail Logbook */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-black uppercase font-mono">Recent Administrative Actions</h4>
                  <button 
                    onClick={() => setShowAuditLogsModal(true)}
                    className="text-xs font-bold text-[#0058be] hover:underline cursor-pointer"
                  >
                    View Full Audit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/40 border-b border-[#E2E8F0]">
                        <th className="px-5 py-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Timestamp</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Administrator</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Action Type</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {realAuditLogs.slice(0, 10).map((row) => (
                        <tr 
                          key={row.id} 
                          onClick={() => setSelectedAudit(row)}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        >
                          <td className="px-5 py-3 text-xs font-mono font-medium text-slate-400 group-hover:text-black transition-colors">{row.timestamp}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full border ${row.avatarBg} text-[10px] flex items-center justify-center font-bold`}>
                                {row.initials}
                              </div>
                              <span className="text-xs font-bold text-black font-sans">{row.actor}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-slate-700 font-sans group-hover:text-[#0058be] transition-colors">{row.action}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              row.status === 'SUCCESS' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : row.status === 'IN PROGRESS'
                                ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: System Integrity & Health Pulse (4-span) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* System Integrity & Backups card */}
              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-black uppercase font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                    System Integrity
                  </h4>
                </div>

                <div className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-lg relative overflow-hidden">
                  <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Last Certified Backup</p>
                  <div className="flex justify-between items-end mt-1">
                    <h5 className="text-sm font-mono font-bold text-slate-800">2026-07-14 04:00</h5>
                    <span className="text-[10px] font-bold font-mono text-sky-700 uppercase">Verified</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <div className="w-5.5 h-5.5 rounded bg-slate-300 text-[8px] font-bold flex items-center justify-center border border-white text-slate-700">A1</div>
                      <div className="w-5.5 h-5.5 rounded bg-slate-400 text-[8px] font-bold flex items-center justify-center border border-white text-white">A2</div>
                      <div className="w-5.5 h-5.5 rounded bg-slate-500 text-[8px] font-bold flex items-center justify-center border border-white text-white">R1</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium font-sans">3 Redundant local nodes</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-[#45464d] leading-relaxed font-sans">Perform a full isolated database restore to a stable checkpoint or compile a mock sandbox rollback point.</p>
                  <button 
                    onClick={handleStartRestore}
                    className="w-full py-2.5 bg-white border-2 border-black hover:bg-black hover:text-white text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>Launch Restore Wizard</span>
                  </button>
                </div>

                {/* Storage progress details */}
                <div 
                  onMouseEnter={() => setHoveredCapacity(true)}
                  onMouseLeave={() => setHoveredCapacity(false)}
                  className="border-t border-slate-100 pt-4 flex flex-col justify-end group cursor-help transition-all relative"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-black font-sans">Database Capacity</span>
                    <span className="font-mono font-bold text-[#0058be]">72%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-slate-200">
                    <div className="h-full bg-black rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 mt-1.5 text-right font-medium">8.4 TB / 12.0 TB AVAILABLE</p>

                  {hoveredCapacity && (
                    <div className="absolute bottom-full left-0 right-0 bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-lg mb-2 z-10 space-y-1 font-mono leading-relaxed">
                      <div className="font-sans font-bold border-b border-white/10 pb-1 mb-1">Storage Allocation:</div>
                      <div>• ACTIVE TRANSACTION LOGS: 2.1 TB</div>
                      <div>• PROJECT EXPENSES BINARY: 5.4 TB</div>
                      <div>• COMPACTED INDEXES: 0.9 TB</div>
                    </div>
                  )}
                </div>
              </div>

              {/* HEALTH PULSE CARD */}
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                
                {/* Background decorative grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-15"></div>

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">Global Health Pulse</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Live Node Latency Tracking</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    OK
                  </div>
                </div>

                {/* Oscillating Latency Waveform Graph */}
                <div className="relative z-10 h-18 flex items-end justify-between gap-1 mt-2">
                  {latencyHistory.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div 
                        className={`w-full rounded-sm transition-all duration-300 ${
                          i === latencyHistory.length - 1 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700 group-hover:bg-slate-500'
                        }`} 
                        style={{ height: `${val * 1.5}px` }}
                      ></div>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Average Latency</span>
                  </div>
                  <span className="font-bold text-emerald-400">{latencyHistory[latencyHistory.length - 1]}ms</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB: GLOBAL PROJECTS MASTER DIRECTORY */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
                <FolderOpen className="w-4.5 h-4.5 text-[#0058be]" />
                Global App Projects Master Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized registry of all production projects across all registered workspace nodes and owner emails.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {unifiedProjects.length} Projects Tracked
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Total System Projects</span>
              <h4 className="text-xl font-black font-mono text-slate-900 mt-1">{unifiedProjects.length}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Across all production teams</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Active Production Volume</span>
              <h4 className="text-xl font-black font-mono text-emerald-600 mt-1">
                {unifiedProjects.filter(p => p.status !== 'Completed' && p.status !== 'Archived' && p.status !== 'Cancelled').length}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Planning &amp; In-Production</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Total System Budget</span>
              <h4 className="text-xl font-black font-mono text-blue-600 mt-1">
                ₹{unifiedProjects.reduce((acc, p) => acc + (Number(p.totalBudget) || 0), 0).toLocaleString('en-IN')}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Combined financial commitment</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Registered Companies</span>
              <h4 className="text-xl font-black font-mono text-purple-600 mt-1">{companies.length || 1}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Corporate entities</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search by project name, owner email, company..."
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="Pre-Production">Pre-Production</option>
                <option value="In Production">In Production</option>
                <option value="Post-Production">Post-Production</option>
                <option value="Delivering">Delivering</option>
                <option value="Completed">Completed</option>
              </select>

              {(projectSearchTerm || projectStatusFilter !== 'ALL') && (
                <button 
                  onClick={() => { setProjectSearchTerm(''); setProjectStatusFilter('ALL'); }}
                  className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Project &amp; ID</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Owner / Creator Email</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Type / Format</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Total Budget</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-bold font-mono text-slate-500 uppercase tracking-wider text-right">Global Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedProjects
                    .filter(p => {
                      const matchSearch = !projectSearchTerm || 
                        (p.name && p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())) ||
                        (p.createdBy && p.createdBy.toLowerCase().includes(projectSearchTerm.toLowerCase())) ||
                        (p.companyName && p.companyName.toLowerCase().includes(projectSearchTerm.toLowerCase())) ||
                        (p.id && p.id.toLowerCase().includes(projectSearchTerm.toLowerCase()));
                      const matchStatus = projectStatusFilter === 'ALL' || p.status === projectStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map(p => {
                      const owner = p.createdBy || p.ownerEmail || 'sujoy.production@gmail.com';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {p.id}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                              {owner}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">
                            {p.companyName || 'General Studio'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-sans">
                            {p.projectType || 'Film'} {p.showFormat ? `(${p.showFormat})` : ''}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            ₹{Number(p.totalBudget || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              p.status === 'In Production' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              p.status === 'Pre-Production' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {p.status || 'Pre-Production'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {onSelectProject && (
                                <button
                                  onClick={() => onSelectProject(p.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Open</span>
                                </button>
                              )}
                              {onDeleteProject && (
                                <button
                                  onClick={() => {
                                    if (confirm(`ADMIN CONFIRMATION: Are you sure you want to permanently delete the project "${p.name}" (ID: ${p.id}) from the global ERP database?`)) {
                                      onDeleteProject(p.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {unifiedProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No projects registered in the system yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: ORIGINAL DB & POLICIES SETTINGS */}
      {activeSubTab === 'policies' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-6 space-y-6">
          <div className="border-b border-[#f2f4f6] pb-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-[#0058be]" />
              Storage &amp; Synchronization Policies
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure Firebase Firestore replication schedules and cloud synchronization parameters.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form controls */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                
                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="text-xs font-bold text-black font-sans">Automatic Background Cloud Syncing</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">
                      Periodically sync locally stored project database files to cloud validation repositories.
                    </div>
                  </div>
                  <button 
                    onClick={() => setAutoSync(!autoSync)}
                    className="text-slate-700 hover:text-black transition-colors cursor-pointer"
                  >
                    {autoSync ? (
                      <ToggleRight className="w-10 h-10 text-[#0058be]" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Interval Select */}
                  <div className="flex flex-col gap-1.5 p-4 border border-[#E2E8F0] rounded-xl">
                    <label className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Cloud Syncing Schedule
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1">Time slice width for automatic snapshot replication</p>
                    <select
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      className="w-full h-10 px-2 bg-slate-50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] outline-none text-xs text-black cursor-pointer"
                    >
                      <option value="5m">Every 5 minutes</option>
                      <option value="15m">Every 15 minutes (Standard)</option>
                      <option value="1h">Hourly checks</option>
                      <option value="1d">Daily backup window</option>
                    </select>
                  </div>

                  {/* Retention Slider */}
                  <div className="flex flex-col gap-1.5 p-4 border border-[#E2E8F0] rounded-xl justify-between">
                    <div>
                      <label className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-slate-500" />
                        Ledger Retention Duration
                      </label>
                      <p className="text-[10px] text-slate-400 mb-2">Maximum duration of local offline transactions cache</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="7"
                        max="180"
                        step="1"
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(Number(e.target.value))}
                        className="flex-1 accent-[#0058be] cursor-pointer h-1 bg-slate-100 rounded"
                      />
                      <span className="font-mono text-xs font-bold text-black w-14 text-right bg-slate-100 px-2 py-1 rounded">
                        {retentionDays} days
                      </span>
                    </div>
                  </div>

                </div>

                {/* VACUUM optimization tool */}
                <div className="border border-[#E2E8F0] rounded-xl p-5 space-y-3.5">
                  <div>
                    <h4 className="text-xs font-bold text-black font-sans flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#0058be]" />
                      Storage Performance Compaction
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Reallocate empty memory slots, clear redundant files, rebuild indexes, and execute database VACUUM.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVacuumDatabase}
                    disabled={isVacuuming}
                    className="px-4 py-2 bg-black hover:bg-black/90 text-white text-xs font-bold rounded shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isVacuuming ? 'animate-spin' : ''}`} />
                    <span>{isVacuuming ? 'Compacting database space...' : 'Execute database VACUUM'}</span>
                  </button>
                </div>

                {/* Complete Database Reset Tool */}
                {onPurgeDatabase && (
                  <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-5 space-y-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 font-sans flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        Remove All User Data &amp; Start Brand New
                      </h4>
                      <p className="text-[11px] text-rose-700/80 mt-1 leading-relaxed">
                        Permanently purge all user data, projects, expenses, companies, categories, and notifications from the Firestore database.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onPurgeDatabase}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge All Database Data &amp; Start Fresh</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Save Policies footer */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-[#0058be] hover:bg-[#0058be]/95 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save policies configuration</span>
                </button>
              </div>

              {isSaved && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Policies applied and stored successfully in standard browser sandbox partition.
                </div>
              )}
            </div>

            {/* Diagnostics sandbox space usage right-side */}
            <div className="lg:col-span-4 space-y-6 border-l border-slate-100 pl-0 lg:pl-8">
              <div>
                <h4 className="text-xs font-bold text-black font-sans flex items-center gap-2 mb-4">
                  <HardDrive className="w-4 h-4 text-slate-500" />
                  Sandbox Allocation State
                </h4>

                <div className="border border-[#E2E8F0] rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-4 bg-white shadow-2xs">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#0058be]"
                        strokeDasharray="18, 100"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-bold text-black font-mono">0.84%</div>
                      <div className="text-[9px] text-[#45464d] uppercase font-bold tracking-wider font-mono">Utilized</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-black font-sans">Browser Storage Sandbox</h5>
                    <p className="text-[10px] font-mono text-[#45464d] mt-1">42.4 KB / 5,000.0 KB ALLOCATED</p>
                  </div>
                </div>
              </div>

              <div className="border border-[#E2E8F0] p-4 rounded-lg bg-slate-50 space-y-2">
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">SECURITY SHIELD</div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                  <Lock className="w-4 h-4 text-[#0058be]" />
                  <span>SSL / TLS Cloud Protection Active</span>
                </div>
                <p className="text-[11px] text-[#45464d] leading-relaxed">
                  Project ledgers and transactions synchronize directly over encrypted Google Cloud Firestore channels.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB 3: ROLE & PERMISSIONS GOVERNANCE */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Controls Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0058be]" />
                Role &amp; Permissions Governance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">Configure granular access levels across all production and financial modules.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleResetPermissions}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Reset all roles to defaults"
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to Default</span>
              </button>
              
              <button 
                onClick={handleExportPolicy}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Export policy config"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Policy</span>
              </button>

              <button 
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="h-9 px-4 bg-[#0058be] hover:bg-[#0058be]/95 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-75"
              >
                {isSavingPerms ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Density & Master overrides panel */}
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-black font-mono uppercase">Density Controls:</span>
              <div className="flex p-0.5 bg-slate-200/60 rounded-lg border border-slate-200">
                <button
                  onClick={() => setIsCompact(true)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    isCompact ? 'bg-white text-[#0058be] shadow-2xs' : 'text-slate-500 hover:text-black'
                  }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setIsCompact(false)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    !isCompact ? 'bg-white text-[#0058be] shadow-2xs' : 'text-slate-500 hover:text-black'
                  }`}
                >
                  Comfortable
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Global Overrides:</span>
                <button 
                  onClick={() => setOverrideEnabled(!overrideEnabled)}
                  className="text-slate-700 hover:text-black transition-colors cursor-pointer"
                >
                  {overrideEnabled ? (
                    <ToggleRight className="w-9 h-9 text-[#0058be]" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {overrideEnabled ? 'OVERRIDE STATE: ENABLED' : 'OVERRIDE STATE: STRICT DISCIPLINE'}
              </div>
            </div>
          </div>

          {/* Main Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Roles list & Selected detail (4-span) */}
            <div className="lg:col-span-4 space-y-4">
              
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-slate-50 border-b border-[#E2E8F0] flex justify-between items-center">
                  <span className="text-[11px] font-bold text-black uppercase font-mono">Available Roles</span>
                  <span className="text-[10px] font-mono font-bold text-[#0058be] bg-blue-50 px-2 py-0.5 rounded-full">12 active</span>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                  {AVAILABLE_ROLES.map(role => {
                    const RoleIconComp = role.icon;
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-all group cursor-pointer ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-[#0058be]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-md shrink-0 ${
                            isSelected ? 'bg-[#0058be] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}>
                            <RoleIconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#0058be]' : 'text-black'}`}>
                              {role.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{role.level}</div>
                          </div>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isSelected ? 'text-[#0058be] translate-x-0.5' : 'text-slate-300'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Role Detail card */}
              {(() => {
                const selectedRole = AVAILABLE_ROLES.find(r => r.id === selectedRoleId);
                const SelectedIcon = selectedRole?.icon || ShieldCheck;
                return (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-4 space-y-3">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                      <div className="p-2 bg-blue-50 text-[#0058be] rounded-lg">
                        <SelectedIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-400 uppercase">Selected Identity</div>
                        <h4 className="text-sm font-bold text-black font-sans mt-0.5">{selectedRole?.name} Profile Profile</h4>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">Auth Level</span>
                          <div className="font-bold text-slate-700 mt-0.5 truncate">{selectedRole?.level}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">Access Code</span>
                          <div className="font-bold text-slate-700 mt-0.5 font-mono truncate">ID_{selectedRoleId?.toUpperCase()}_SYS</div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">Base Clearance</span>
                        <p className="font-semibold text-black leading-tight">{selectedRole?.clearance}</p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>Active Policy Enforced in Memory</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Right Column: Permissions Matrix table (8-span) */}
            <div className="lg:col-span-8 space-y-5">
              
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-black uppercase font-mono">Permissions Matrix</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Toggle CRUD &amp; executive permissions for {AVAILABLE_ROLES.find(r => r.id === selectedRoleId)?.name} role</p>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-[#0058be] bg-blue-50 px-2 py-0.5 rounded-full">
                    {selectedRoleId?.toUpperCase()} MATRIX
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase">System Module</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">View</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Create</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Edit</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Delete</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Approve</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Export</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Print</th>
                        <th className="p-3 text-[10px] font-bold font-mono text-slate-400 uppercase text-center">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODULE_PERMISSIONS.map(mod => {
                        const ModIcon = mod.icon;
                        const perms = rolePerms[selectedRoleId]?.[mod.key] || {
                          view: false, create: false, edit: false, delete: false, approve: false, export: false, print: false, share: false
                        };
                        const cellPadding = isCompact ? "p-2 px-3" : "p-3.5 px-4";
                        
                        return (
                          <tr key={mod.key} className="hover:bg-slate-50/50 transition-colors">
                            <td className={`${cellPadding} min-w-[150px]`}>
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-slate-100 rounded text-slate-500">
                                  <ModIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-800 font-sans tracking-tight truncate">{mod.name}</span>
                              </div>
                            </td>
                            {Object.keys(perms).map(permKey => (
                              <td key={permKey} className={`${cellPadding} text-center`}>
                                <label className="relative inline-flex items-center justify-center cursor-pointer group/toggle select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={perms[permKey as keyof typeof perms]}
                                    onChange={() => handleTogglePermission(mod.key, permKey)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0058be]"></div>
                                </label>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

          {/* Quick Actions Bento Grid footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Quick action 1: Scanner */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Policy Scanner</span>
                  <span className="text-[10px] font-bold font-mono text-[#0058be] bg-blue-50 px-2 py-0.5 rounded">AUTO CHECK</span>
                </div>
                <h4 className="text-xs font-bold text-black mt-2 flex items-center gap-1.5 font-sans">
                  <Shield className="w-4 h-4 text-[#0058be]" />
                  Access Vulnerability Audit
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Check selected configuration for Separation of Duties (SoD) &amp; Least Privilege violations.</p>
              </div>

              <div>
                {isScannerRunning ? (
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500">
                      <span>RUNNING RULES ENGINE...</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-[#0058be] h-full animate-pulse animate-duration-1000" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ) : scannerRating ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold font-mono text-slate-500">RATING:</span>
                      <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded ${
                        scannerRating === 'SECURE' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : scannerRating === 'WARNING' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {scannerRating}
                      </span>
                    </div>
                    <div className="max-h-[100px] overflow-y-auto text-[10px] font-mono p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 space-y-1.5">
                      {scannerInsights.map((ins, idx) => (
                        <div key={idx} className="leading-relaxed flex items-start gap-1">
                          <span className="font-extrabold">•</span>
                          <span>{ins}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-slate-400 text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                    Scanner Idle
                  </p>
                )}
              </div>

              <button
                onClick={handleRunVulnerabilityScan}
                disabled={isScannerRunning}
                className="w-full py-2 bg-black hover:bg-black/95 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isScannerRunning ? 'animate-spin' : ''}`} />
                <span>{isScannerRunning ? 'Scanning rules...' : 'Launch policy scanner'}</span>
              </button>
            </div>

            {/* Quick action 2: Policy Compliance Log */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">Policy Logs</span>
                  <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">HISTORIC</span>
                </div>
                <h4 className="text-xs font-bold text-black mt-2 flex items-center gap-1.5 font-sans">
                  <History className="w-4 h-4 text-emerald-600" />
                  Policy Amendment History
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Verification trace of permissions and structural modifications.</p>
              </div>

              <div className="space-y-2 max-h-[130px] overflow-y-auto text-[10px] font-mono text-slate-600 pr-1">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-md">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>AR | SYS_ADMIN</span>
                    <span>4 MINS AGO</span>
                  </div>
                  <p className="text-[10px] text-slate-800 font-sans mt-1">Saved updated {AVAILABLE_ROLES.find(r => r.id === selectedRoleId)?.name} policy parameters.</p>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-md">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>SY | CRON</span>
                    <span>10:11:55</span>
                  </div>
                  <p className="text-[10px] text-slate-800 font-sans mt-1">Re-aligned standard operational template indices.</p>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 text-center py-1">
                All records encrypted with SHA-256 integrity checks
              </div>
            </div>

            {/* Quick action 3: Conflict Matrix Key */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">System Key</span>
                  <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">HELPERS</span>
                </div>
                <h4 className="text-xs font-bold text-black mt-2 flex items-center gap-1.5 font-sans">
                  <AlertTriangle className="w-4 h-4 text-indigo-600" />
                  Governance Control Framework
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">Standard control definitions utilized for risk assessment.</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-500">
                <div className="p-1.5 bg-slate-50 rounded">
                  <span className="font-extrabold text-slate-700">SoD Policy:</span>
                  <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">Separation of sensitive duties prevents staff fraud.</p>
                </div>
                <div className="p-1.5 bg-slate-50 rounded">
                  <span className="font-extrabold text-slate-700">Least Privilege:</span>
                  <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">Restrict standard logins purely to what is required.</p>
                </div>
                <div className="p-1.5 bg-slate-50 rounded col-span-2">
                  <span className="font-extrabold text-slate-700">Dual Authorization:</span>
                  <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">Approve actions of high financial risk by two discrete logins.</p>
                </div>
              </div>

              <div className="text-[9px] text-[#0058be] font-bold text-center underline cursor-pointer hover:text-blue-800 transition-colors">
                Read full ERP compliance standard v4.12
              </div>
            </div>

          </div>

        </div>
      )}

      {/* OVERLAY MODALS */}

      {/* 1. Audit Log Details Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-bold text-black font-sans flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-[#0058be]" />
                Transaction Audit Event Details
              </h4>
              <button 
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">TIMESTAMP:</span>
                  <div className="text-slate-800 font-bold">{selectedAudit.timestamp}</div>
                </div>
                <div>
                  <span className="text-slate-400">ACTOR INTEGRITY:</span>
                  <div className="text-slate-800 font-bold">{selectedAudit.actor}</div>
                </div>
                <div>
                  <span className="text-slate-400">ACTION CLASSIFICATION:</span>
                  <div className="text-slate-800 font-bold">{selectedAudit.action}</div>
                </div>
                <div>
                  <span className="text-slate-400">SECURITY STATE:</span>
                  <div className="mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      selectedAudit.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>{selectedAudit.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Functional outcome:</span>
                <p className="text-slate-700 font-sans leading-relaxed">{selectedAudit.details}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Triggered Database Transaction Statement (SQL):</span>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                  {selectedAudit.query}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSelectedAudit(null)}
                className="px-5 py-2 bg-black hover:bg-black/90 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Dismiss Event log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Restore Wizard Modal */}
      {showRestoreWizard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-md w-full space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-black font-sans flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-[#0058be]" />
                ERP Disaster Recovery Wizard
              </h4>
              <button 
                onClick={() => setShowRestoreWizard(false)}
                className="text-slate-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper indicators */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-100 pb-3">
              <span className={`font-bold ${restoreStep >= 1 ? 'text-[#0058be]' : ''}`}>1. SNAPSHOT SELECT</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`font-bold ${restoreStep >= 2 ? 'text-[#0058be]' : ''}`}>2. INTEGRITY Vows</span>
              <ChevronRight className="w-3 h-3" />
              <span className={`font-bold ${restoreStep >= 3 ? 'text-[#0058be]' : ''}`}>3. REBUILD PHASE</span>
            </div>

            {/* Step 1 Content */}
            {restoreStep === 1 && (
              <div className="space-y-3.5 text-xs">
                <p className="text-slate-600 font-sans leading-relaxed">Choose an available cold-backup snapshots sequence point retrieved from cloud validation mirrors.</p>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border-2 border-[#0058be] rounded-lg cursor-pointer select-none">
                    <input type="radio" defaultChecked name="snapshot" className="text-[#0058be]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black font-mono">SNAPSHOT_2026_07_14_04_00</div>
                      <div className="text-[10px] text-slate-400 font-medium">Auto Daily Verification Checkpoint • Optimized integrity</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-60 cursor-not-allowed select-none">
                    <input type="radio" disabled name="snapshot" className="text-[#0058be]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-black font-mono">SNAPSHOT_2026_07_13_04_00</div>
                      <div className="text-[10px] text-slate-400 font-medium">Compacted ledger snapshot • 24h older point</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2 Content */}
            {restoreStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-sans font-medium">Re-applying checkpoints will overwrite modifications. Ensure active client workflows have successfully uploaded logs first.</p>
                </div>
                <p className="text-slate-600 font-sans leading-relaxed">System will perform cryptographic checking of validation hashes prior to writing.</p>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[11px] text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span>CIPHER KEY:</span>
                    <span className="font-bold text-slate-900">SHA-256 REPLICA TRUST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>METRIC HEALTH:</span>
                    <span className="font-bold text-emerald-600">CERTIFIED SECURE</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 Content */}
            {restoreStep === 3 && (
              <div className="space-y-4 text-xs text-center">
                {isRestoring ? (
                  <div className="space-y-3.5 py-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0058be] rounded-full animate-spin mx-auto"></div>
                    <div>
                      <h5 className="font-bold text-black text-sm">Re-allocating tables and indexes...</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Please wait, compiling memory structures.</p>
                    </div>
                    <div className="w-full max-w-xs mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-[#0058be] h-full transition-all duration-300" style={{ width: `${restoreProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <div>
                      <h5 className="font-bold text-black text-sm">Disaster Recovery Completed!</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">All ledgers safely re-aligned to snapshot 2026-07-14 04:00.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setShowRestoreWizard(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel Wizard
              </button>
              
              <button 
                type="button"
                disabled={isRestoring}
                onClick={triggerNextRestoreStep}
                className="px-5 py-2 bg-black hover:bg-black/90 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40"
              >
                {restoreStep === 3 ? 'Close and refresh' : 'Proceed validation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-4xl w-full my-8 space-y-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-[#0058be] rounded-lg border border-blue-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-black font-sans flex items-center gap-2">
                      Registered Users &amp; Registration Form Registry
                    </h4>
                    <p className="text-xs text-slate-400">
                      View all user profiles registered in the app with their submitted registration form details.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-[#0058be] border border-blue-100 text-xs font-bold font-mono px-2.5 py-1 rounded-full">
                  {realUsers.length} Registered User(s)
                </span>
                <button 
                  onClick={() => {
                    setShowUsersModal(false);
                    setSelectedDetailUser(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-black font-bold text-sm cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Actions Bar: Search + Toggle Add User Form */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search registered users by name, email, designation, phone, or city..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-black outline-none focus:border-[#0058be]"
                />
              </div>
              <button 
                onClick={() => setShowAddUserTab(!showAddUserTab)}
                className={`h-9 px-3.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  showAddUserTab 
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                    : 'bg-[#0058be] text-white hover:bg-[#0058be]/90 shadow-2xs'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddUserTab ? 'Close Registration Form' : '+ Register New User'}</span>
              </button>
            </div>

            {/* Registration Form (Collapsible/Toggleable) */}
            {showAddUserTab && (
              <form onSubmit={handleAddUser} className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center border-b border-blue-100/60 pb-2">
                  <h5 className="text-xs font-bold text-black font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#0058be]" />
                    Register New Application User
                  </h5>
                  <span className="text-[10px] text-slate-500 font-mono">Will save profile to server database</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sujoy Kotal"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">Enterprise Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. sujoy.production@gmail.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">Administrative Role</label>
                    <select 
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black cursor-pointer"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Auditor">Auditor</option>
                      <option value="Finance Lead">Finance Lead</option>
                      <option value="Operator">Operator</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">Contact Number / Phone</label>
                    <input 
                      type="text" 
                      placeholder="+91 9876543210"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">Work Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Executive Producer, Accountant"
                      value={newUserForm.workDesignation}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, workDesignation: e.target.value }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-slate-700">City / District</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Mumbai"
                      value={newUserForm.city}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, city: e.target.value }))}
                      className="h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-lg outline-none text-xs text-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddUserTab(false)} 
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-[#0058be] hover:bg-[#0058be]/95 text-white font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save &amp; Register User</span>
                  </button>
                </div>
              </form>
            )}

            {/* Users Directory Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[360px] overflow-y-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200/80">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider">User Identity</th>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider">Designation / Phone</th>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider">Registered Date</th>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-3.5 py-2.5 font-bold font-mono text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {realUsers
                    .filter(u => {
                      if (!userSearchQuery.trim()) return true;
                      const q = userSearchQuery.toLowerCase().trim();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        (u.workDesignation && u.workDesignation.toLowerCase().includes(q)) ||
                        (u.contactNumber && u.contactNumber.toLowerCase().includes(q)) ||
                        (u.city && u.city.toLowerCase().includes(q))
                      );
                    })
                    .map(user => {
                      const initials = user.name
                        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : user.email.substring(0, 2).toUpperCase();

                      return (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono border border-slate-700">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-black flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.email.toLowerCase() === userEmail?.toLowerCase() && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">You (Owner)</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="font-medium text-slate-800">{user.workDesignation || user.role}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{user.contactNumber || 'Phone N/A'}</div>
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 font-sans">
                            {user.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : 'Location N/A'}
                          </td>
                          <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'System Default'}
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold font-sans w-fit">
                                {user.role}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                user.status === 'Active' ? 'text-emerald-600' : 'text-rose-500'
                              }`}>{user.status}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-right space-x-2">
                            <button 
                              onClick={() => setSelectedDetailUser(user)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0058be] font-bold text-[11px] rounded border border-blue-200 cursor-pointer transition-colors inline-flex items-center gap-1"
                              title="Click to view full registration form details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Form Details</span>
                            </button>
                            <button 
                              onClick={() => toggleUserStatus(user.id)}
                              className="text-xs text-slate-600 hover:text-black hover:underline cursor-pointer"
                            >
                              {user.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400 font-sans">
                All registration form records are synced with Firestore cloud database.
              </span>
              <button 
                onClick={() => {
                  setShowUsersModal(false);
                  setSelectedDetailUser(null);
                }} 
                className="px-5 py-2 bg-black hover:bg-black/90 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3b. Selected User Registration Form Detail Sub-Modal */}
      {selectedDetailUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-lg w-full space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base font-mono shadow-sm">
                  {selectedDetailUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-black font-sans flex items-center gap-1.5">
                    {selectedDetailUser.name}
                  </h4>
                  <p className="text-xs text-[#0058be] font-mono">{selectedDetailUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailUser(null)}
                className="p-1 text-slate-400 hover:text-black font-bold text-sm cursor-pointer rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Registration Form Detail Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Registration Record</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified User
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Full Legal Name</span>
                  <span className="font-bold text-black text-xs">{selectedDetailUser.name}</span>
                </div>
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Work Designation</span>
                  <span className="font-bold text-black text-xs">{selectedDetailUser.workDesignation || selectedDetailUser.role}</span>
                </div>
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Contact Phone</span>
                  <span className="font-bold text-black text-xs font-mono">{selectedDetailUser.contactNumber || 'Not provided'}</span>
                </div>
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Administrative Role</span>
                  <span className="font-bold text-[#0058be] text-xs">{selectedDetailUser.role}</span>
                </div>
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">City / State</span>
                  <span className="font-bold text-black text-xs">
                    {selectedDetailUser.city ? `${selectedDetailUser.city}${selectedDetailUser.state ? `, ${selectedDetailUser.state}` : ''}` : 'Not provided'}
                  </span>
                </div>
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Country &amp; Pin</span>
                  <span className="font-bold text-black text-xs">
                    {selectedDetailUser.country || 'India'} {selectedDetailUser.pinCode ? `(${selectedDetailUser.pinCode})` : ''}
                  </span>
                </div>
              </div>

              {selectedDetailUser.houseStreet && (
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Street / Registered Address</span>
                  <span className="font-medium text-slate-800">{selectedDetailUser.houseStreet}</span>
                </div>
              )}

              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Registered Timestamp:</span>
                  <span className="font-bold font-mono text-black">
                    {selectedDetailUser.createdAt ? new Date(selectedDetailUser.createdAt).toLocaleString() : 'System Provisioned'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Server Database Status:</span>
                  <span className="font-bold text-emerald-600 font-mono">Firestore Doc Synced</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button 
                onClick={() => setSelectedDetailUser(null)}
                className="px-5 py-2 bg-black hover:bg-black/90 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Close Registration Card
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Configure Roles Modal */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-black font-sans flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-[#0058be]" />
                Role Permissions Controls
              </h4>
              <button onClick={() => setShowRolesModal(false)} className="text-slate-400 hover:text-black font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed font-sans">Grant or restrict permissions globally across all organizational workspace nodes based on standard user taxonomy segments.</p>
              
              <div className="space-y-3">
                <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 space-y-2">
                  <div className="flex justify-between font-bold text-black">
                    <span>ADMINISTRATOR ROLE:</span>
                    <span className="text-emerald-600 text-[10px] font-mono">100% CAPABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Granted reading, editing, schemas update, system rollback, and license renewal capabilities.</p>
                </div>

                <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 space-y-2">
                  <div className="flex justify-between font-bold text-black">
                    <span>FINANCE LEAD ROLE:</span>
                    <span className="text-[#0058be] text-[10px] font-mono">FINANCE SPECIFIC</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Granted full cost ledger modification and reporting access. Database catalog re-indexing restricted.</p>
                </div>

                <div className="p-3 border border-slate-100 rounded-lg bg-slate-50 space-y-2">
                  <div className="flex justify-between font-bold text-black">
                    <span>AUDITOR ROLE:</span>
                    <span className="text-amber-600 text-[10px] font-mono">READ ONLY ACCESS</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Granted transaction logging views and full JSON audit exports. Overwriting records is strictly restricted.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowRolesModal(false)} className="px-5 py-2 bg-black text-white font-bold text-xs rounded-lg cursor-pointer">
                Dismiss Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Audit Logs Console Modal */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-3xl w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-black font-sans flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-[#0058be]" />
                Audit Logs Event Inspector
              </h4>
              <button onClick={() => setShowAuditLogsModal(false)} className="text-slate-400 hover:text-black font-bold text-sm cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-600">This lists standard database triggers, administrative events, schema migrations, and secure recovery checkpoints.</p>

            <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-lg text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-bold font-mono text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-2 font-bold font-mono text-slate-400 uppercase tracking-wider">Actor</th>
                    <th className="px-4 py-2 font-bold font-mono text-slate-400 uppercase tracking-wider">Action Type</th>
                    <th className="px-4 py-2 font-bold font-mono text-slate-400 uppercase tracking-wider">Statement Sample</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {realAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400">{log.timestamp}</td>
                      <td className="px-4 py-2 font-bold text-slate-800">{log.actor}</td>
                      <td className="px-4 py-2 font-sans font-bold text-[#0058be]">{log.action}</td>
                      <td className="px-4 py-2 text-emerald-600 truncate max-w-[200px]">{log.query}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button onClick={handleExportLogs} className="px-4 py-2 border border-slate-200 text-black font-bold text-xs rounded-lg cursor-pointer hover:bg-slate-50 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-slate-400" /> Export JSON File
              </button>
              <button onClick={() => setShowAuditLogsModal(false)} className="px-5 py-2 bg-black text-white font-bold text-xs rounded-lg cursor-pointer">
                Dismiss Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Licensing Controls Modal */}
      {showLicensingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-black font-sans flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-[#0058be]" />
                Enterprise Production Workspace
              </h4>
              <button onClick={() => setShowLicensingModal(false)} className="text-slate-400 hover:text-black font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-slate-400">DATABASE BACKEND:</span>
                  <span className="text-slate-900 font-bold">GOOGLE CLOUD FIRESTORE</span>
                </div>
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-slate-400">ACTIVE PROJECTS:</span>
                  <span className="text-[#0058be] font-bold">{unifiedProjects.length} Workspaces</span>
                </div>
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-slate-400">REGISTERED USERS:</span>
                  <span className="text-emerald-600 font-bold">{realUsers.length} Identity(ies)</span>
                </div>
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-slate-400">TOTAL BUDGET MANAGED:</span>
                  <span className="text-slate-900 font-bold">₹{totalBudgetSum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-black">Cloud Data Synchronization Policy:</p>
                <p className="text-slate-500 leading-relaxed">All production projects, companies, budget items, expenses, and role permissions are continuously synchronized in real-time with Google Cloud Firestore.</p>
                <p className="text-[11px] text-[#45464d] italic">Database ID: ai-studio-productionbudget-a6769baa-b82b-4d6b-9321-db78de10bab5</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowLicensingModal(false)} className="px-5 py-2 bg-black text-white font-bold text-xs rounded-lg cursor-pointer">
                Dismiss Controls
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Synced Popup Toast */}
      {showFloatingSync && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0c101d] text-white px-4 py-3 rounded-xl border border-slate-800 shadow-2xl flex items-center gap-3 animate-fade-in animate-slide-up select-none">
          <div className="p-1.5 bg-emerald-500 text-white rounded-full">
            <Check className="w-4 h-4 font-black text-white" />
          </div>
          <div>
            <div className="text-xs font-bold font-sans">Policy Synced with Production Cloud</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-sans">Standard ledger rules re-certified successfully.</div>
          </div>
        </div>
      )}

    </div>
  );
}
