/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Project, BudgetCategory, Expense, DBLog, AuditLogEntry, UserAssignmentNotification, UserProfile } from './types';
import { DEFAULT_FILM_BUDGET_STRUCTURE, generateStandardCategoriesForProject, ensureStandardCategoriesForProject, sortCategoriesByStandardStructure, isCategoryStructureMismatched, cleanProjectTitle, isProjectAdminRole } from './data';
import { 
  loadProjectBudgetVersions, 
  saveProjectBudgetVersions, 
  createNewBudgetVersion, 
  updateApprovalSendStatus, 
  grantRoleApproval 
} from './lib/budgetVersionManager';
import { BudgetVersionRecord } from './components/BudgetApprovalWidget';
import { 
  seedInitialDataIfEmpty, 
  subscribeProjects, 
  subscribeWorkspaceProjects,
  subscribeCompanies,
  subscribeUserAssignments,
  subscribeCategories, 
  subscribeExpenses, 
  subscribeDbLogs, 
  subscribeDoc,
  subscribeUserProfiles,
  getUserProfile,
  saveUserProfile,
  saveProject, 
  saveCompany,
  saveCategory, 
  saveCategoriesBatch,
  deleteCategory,
  deleteCategoriesBatch,
  saveExpense, 
  deleteExpense,
  saveWorkspaceProject,
  saveDocData,
  deleteDocData,
  clearAllUserAssignments,
  clearAllDatabaseData,
  addDbLog 
} from './services/firebaseService';
import { safeGetStorage, safeSetStorage, safeRemoveStorage } from './lib/storage';
import DashboardView from './components/DashboardView';
import LedgerView from './components/LedgerView';
import { ExpenseView } from './components/ExpenseView';
import LoginView from './components/LoginView';
import LogViewer from './components/LogViewer';
import ResourceMap from './components/ResourceMap';
import AdminView from './components/AdminView';
import WorkspaceView, { WorkspaceProject, Company } from './components/WorkspaceView';
import CreateProjectWizard from './components/CreateProjectWizard';
import EditProfileModal from './components/EditProfileModal';
import TimelineView from './components/TimelineView';
import ApprovalsView from './components/ApprovalsView';
import CategoryConfigView from './components/CategoryConfigView';
import CashierConsoleView from './components/CashierConsoleView';
import ReimbursementView from './components/ReimbursementView';
import AuditView from './components/AuditView';
import RoleBaseManager, { AppRole, APP_ROLES_CATALOG, AppRoleConfig } from './components/RoleBaseManager';
import PBTLogo from './components/PBTLogo';
import RoleRestrictedView from './components/RoleRestrictedView';
import TeamPermissionsView from './components/TeamPermissionsView';
import VendorsView from './components/VendorsView';
import ThreeWayMatchingView from './components/ThreeWayMatchingView';
import PaymentsView from './components/PaymentsView';
import DocumentsView from './components/DocumentsView';
import ReportsView from './components/ReportsView';
import ProductionDSRView from './components/ProductionDSRView';
import NonFictionProjectView from './components/NonFictionProjectView';
import AIVideoStudioView from './components/AIVideoStudioView';
import AIImageStudioView from './components/AIImageStudioView';
import AIMapsLocationView from './components/AIMapsLocationView';
import AISearchIntelligenceView from './components/AISearchIntelligenceView';
import { DynamicSidebar } from './components/DynamicSidebar';
import { DynamicDashboard } from './components/DynamicDashboard';
import { DepartmentWorkspaceView } from './components/DepartmentWorkspaceView';
import { ProjectTypeModuleView } from './components/ProjectTypeModuleView';
import UserProfileView from './components/UserProfileView';
import { auth, signOut } from './lib/firebase';
import { 
  BarChart, 
  Layers, 
  Briefcase,
  Database, 
  FileSpreadsheet, 
  User, 
  Terminal, 
  Clock, 
  ArrowRight,
  Sparkles,
  Cloud,
  LogOut,
  Settings,
  Network,
  RefreshCw,
  Menu,
  X,
  Trash2,
  CheckCheck,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FolderPlus,
  HardDrive,
  Wallet,
  CheckSquare,
  FolderTree,
  Sliders,
  Coins,
  Receipt,
  Lock,
  UserCheck,
  Server,
  Building2,
  Building,
  Film,
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown
} from 'lucide-react';

type TabType = string;

const getInitialTab = (): TabType => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl) return tabFromUrl;
    const hashFromUrl = window.location.hash.replace('#', '');
    if (hashFromUrl) return hashFromUrl;
    const savedTab = safeGetStorage('local', 'erp_active_tab');
    if (savedTab) return savedTab;
  } catch (e) {
    console.error('Failed to read initial tab:', e);
  }
  return 'workspace';
};

const getInitialProjectId = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const projFromUrl = params.get('project');
    if (projFromUrl) {
      return projFromUrl;
    }
    const savedProj = safeGetStorage('local', 'erp_selected_project_id');
    if (savedProj) {
      return savedProj;
    }
  } catch (e) {
    console.error('Failed to read initial project id:', e);
  }
  return '';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(getInitialProjectId);
  const [videoTransferImage, setVideoTransferImage] = useState<string | null>(null);
  const [videoTransferPrompt, setVideoTransferPrompt] = useState<string>('');

  // Sync tab and selected project to URL search params and localStorage
  useEffect(() => {
    try {
      safeSetStorage('local', 'erp_active_tab', activeTab);
      if (selectedProjectId) {
        safeSetStorage('local', 'erp_selected_project_id', selectedProjectId);
      } else {
        safeRemoveStorage('local', 'erp_selected_project_id');
      }

      const url = new URL(window.location.href);
      let changed = false;
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        changed = true;
      }
      if (selectedProjectId) {
        if (url.searchParams.get('project') !== selectedProjectId) {
          url.searchParams.set('project', selectedProjectId);
          changed = true;
        }
      } else if (url.searchParams.has('project')) {
        url.searchParams.delete('project');
        changed = true;
      }

      if (changed) {
        window.history.pushState({ tab: activeTab, project: selectedProjectId }, '', url.toString());
      }
    } catch (e) {
      console.error('Failed to sync URL/localStorage:', e);
    }
  }, [activeTab, selectedProjectId]);

  // Listen to browser Back / Forward (popstate) navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabFromUrl = params.get('tab') as TabType;
        const projFromUrl = params.get('project');

        if (tabFromUrl && typeof tabFromUrl === 'string') {
          setActiveTab(tabFromUrl);
        } else {
          const savedTab = safeGetStorage('local', 'erp_active_tab') as TabType;
          if (savedTab && typeof savedTab === 'string') {
            setActiveTab(savedTab);
          }
        }

        if (projFromUrl !== null) {
          setSelectedProjectId(projFromUrl);
        } else {
          const savedProj = safeGetStorage('local', 'erp_selected_project_id');
          if (savedProj) setSelectedProjectId(savedProj);
        }
      } catch (e) {
        console.error('Failed on popstate navigation:', e);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Tab/Browser session storage with default preview auto-login
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const explicitLogout = safeGetStorage('session', 'erp_explicit_logout');
      if (explicitLogout === 'true') return false;
      // Default to true in development/preview so the app opens immediately
      return true;
    } catch {
      return true;
    }
  });
  const [userEmail, setUserEmail] = useState<string>(() => safeGetStorage('session', 'erp_user_email') || 'sujoy.production@gmail.com');

  const handleLogout = async () => {
    const emailToLog = userEmail;
    setIsLoggedIn(false);
    safeSetStorage('session', 'erp_explicit_logout', 'true');
    safeRemoveStorage('session', 'erp_session_active');
    safeRemoveStorage('session', 'erp_user_email');

    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (authErr) {
      console.warn('Firebase signOut error:', authErr);
    }

    try {
      await addDbLog({
        id: `l_logout_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'USER_LOGOUT',
        sqlQuery: `UPDATE sys_session SET active = false WHERE user_email = '${emailToLog}';`,
        status: 'info'
      });
    } catch (e) {
      console.warn('Logout log warning:', e);
    }
  };

  // User Profile State & Firestore Realtime Sync
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    if (!userEmail) return null;
    const clean = userEmail.toLowerCase().trim();
    const cached = safeGetStorage('local', `pbt_user_profile_${clean}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch and subscribe to User Profiles
  useEffect(() => {
    if (!userEmail) return;
    const cleanEmail = userEmail.toLowerCase().trim();

    getUserProfile(cleanEmail).then((prof) => {
      if (prof) {
        setCurrentUserProfile(prof);
        safeSetStorage('local', `pbt_user_profile_${cleanEmail}`, JSON.stringify(prof));
      }
    });

    const unsubProfiles = subscribeUserProfiles((users) => {
      const myProf = users.find(u => u.email?.toLowerCase().trim() === cleanEmail);
      if (myProf) {
        setCurrentUserProfile(myProf);
        safeSetStorage('local', `pbt_user_profile_${cleanEmail}`, JSON.stringify(myProf));
      }
    });

    return () => unsubProfiles();
  }, [userEmail]);

  const handleSaveUserProfile = async (updatedProfile: UserProfile) => {
    const cleanEmail = userEmail.toLowerCase().trim();
    setCurrentUserProfile(updatedProfile);
    safeSetStorage('local', `pbt_user_profile_${cleanEmail}`, JSON.stringify(updatedProfile));
    await saveUserProfile(updatedProfile);
    setAssignmentToast('Profile details & photo saved successfully!');
    setTimeout(() => setAssignmentToast(null), 3500);
  };

  const userPhotoUrl = currentUserProfile?.photoUrl || '';
  const userDisplayName = currentUserProfile?.fullName || userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const userInitials = (userDisplayName || userEmail)
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  // App Role Base Structure State
  const [currentRole, setCurrentRole] = useState<AppRole>('Producer');

  // Multi-Tenant Companies State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');

  // System Audit Logs State
  const [auditLogEntries, setAuditLogEntries] = useState<AuditLogEntry[]>([]);

  const handleRoleChange = (newRole: AppRole) => {
    setCurrentRole(newRole);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    addDbLog({
      id: `l_role_switch_${Date.now()}`,
      timestamp: nowStr,
      action: 'SYS_ACTIVE_ROLE_SWITCH',
      sqlQuery: `UPDATE sys_session SET active_role = '${newRole}' WHERE user_email = '${userEmail}';`,
      status: 'info'
    });
  };

  // Helper to check if a tab is allowed under current role configuration
  const isTabAllowedForRole = (tabKey: string): boolean => {
    return true; // All default app modules are fully unlocked and accessible everywhere
  };

  // Helper to match projects by ID, prefix, or name
  const findMatchingProject = (projList: Project[], targetId: string | undefined): Project | undefined => {
    if (!targetId || targetId === 'all') return undefined;
    
    // 1. Exact ID
    let match = projList.find(p => p.id === targetId);
    if (match) return match;

    // 2. Stripped prefix
    const cleanTargetId = targetId.replace(/^wp_/, '');
    match = projList.find(p => p.id === cleanTargetId || p.id.replace(/^wp_/, '') === cleanTargetId);
    if (match) return match;

    // 3. Case-insensitive ID
    match = projList.find(p => p.id.toLowerCase() === targetId.toLowerCase() || p.id.replace(/^wp_/, '').toLowerCase() === cleanTargetId.toLowerCase());
    if (match) return match;

    // 4. Name match
    const lowerTarget = targetId.toLowerCase();
    match = projList.find(p => 
      p.name && (p.name.toLowerCase().includes(lowerTarget) || lowerTarget.includes(p.name.toLowerCase()))
    );
    if (match) return match;

    return undefined;
  };

  // Database States (Synced with Firestore Server)
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProject[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserAssignmentNotification[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const [assignmentToast, setAssignmentToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dbLogs, setDbLogs] = useState<DBLog[]>([]);
  const initializedProjectsRef = useRef<Set<string>>(new Set());
  const categoriesRef = useRef<BudgetCategory[]>(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notification Tab State & History Toggle
  const [notificationTab, setNotificationTab] = useState<'assignments' | 'approvals' | 'updates'>('assignments');
  const [showViewedNotifications, setShowViewedNotifications] = useState<boolean>(false);

  // Filter pending assignments for the logged in user (Only unviewed requests display as active notifications)
  const pendingAssignments = useMemo(() => {
    if (!userEmail) return [];
    const cleanEmail = userEmail.toLowerCase().trim();

    const matching = userAssignments.filter(
      a => a.status === 'Pending' && (showViewedNotifications || !a.isViewed) && (
        a.assignedEmail.toLowerCase().trim() === cleanEmail || 
        cleanEmail.includes(a.assignedEmail.toLowerCase().trim()) ||
        a.assignedEmail.toLowerCase().trim().includes(cleanEmail)
      )
    );

    // Deduplicate by project + assigned role + assigned email
    const uniqueMap = new Map<string, UserAssignmentNotification>();
    matching.forEach(a => {
      const key = `${a.projectId || a.projectName}_${(a.assignedRole || '').toLowerCase().trim()}_${a.assignedEmail.toLowerCase().trim()}`;
      if (!uniqueMap.has(key) || new Date(a.createdAt).getTime() > new Date(uniqueMap.get(key)!.createdAt).getTime()) {
        uniqueMap.set(key, a);
      }
    });

    return Array.from(uniqueMap.values());
  }, [userAssignments, userEmail, showViewedNotifications]);

  // Real-time notifications for the sender when a receiver accepts or declines an assignment request
  const senderResponseNotifications = useMemo(() => {
    if (!userEmail) return [];
    const cleanEmail = userEmail.toLowerCase().trim();
    return userAssignments.filter(
      a => (a.status === 'AcceptedNotification' || a.status === 'DeclinedNotification') && (showViewedNotifications || !a.isViewed) && (
        a.assignedEmail.toLowerCase().trim() === cleanEmail ||
        cleanEmail.includes(a.assignedEmail.toLowerCase().trim()) ||
        a.assignedEmail.toLowerCase().trim().includes(cleanEmail)
      )
    );
  }, [userAssignments, userEmail, showViewedNotifications]);

  // Mark all notifications for current user as viewed so bell badge counter clears
  const handleMarkAllNotificationsAsViewed = async () => {
    if (!userEmail) return;
    const cleanEmail = userEmail.toLowerCase().trim();
    const unviewed = userAssignments.filter(
      a => !a.isViewed && (
        a.assignedEmail.toLowerCase().trim() === cleanEmail ||
        cleanEmail.includes(a.assignedEmail.toLowerCase().trim()) ||
        a.assignedEmail.toLowerCase().trim().includes(cleanEmail)
      )
    );

    for (const a of unviewed) {
      await saveDocData('user_assignments', a.id, {
        ...a,
        isViewed: true,
        viewedAt: new Date().toISOString()
      });
    }
  };

  // Remove ALL previous notifications for ALL users from the system (Purge collection)
  const handleClearAllPreviousNotifications = async () => {
    if (confirm('Are you sure you want to remove ALL previous notifications for ALL users from the database? This action cannot be undone.')) {
      await clearAllUserAssignments();
      setUserAssignments([]);
      const purgeLog: DBLog = {
        id: `log_purge_${Date.now()}`,
        action: 'NOTIFICATIONS_PURGED',
        module: 'TeamPermissions',
        details: `User '${userEmail}' purged all previous notifications from the system.`,
        timestamp: new Date().toLocaleString(),
        user: userEmail,
        ip: 'Real-time Sync'
      };
      handleAddDbLog(purgeLog);
      setAssignmentToast('🧹 All previous notifications cleared for all users!');
      setTimeout(() => setAssignmentToast(null), 5000);
    }
  };

  // Completely purge all user data from Firestore database and start from brand new
  const handleResetEntireDatabase = async () => {
    if (confirm('⚠️ PERMANENT RESET: Are you sure you want to remove ALL user data from the database and start brand new? This will clear all projects, expenses, companies, categories, assignment notifications, and transaction logs.')) {
      await clearAllDatabaseData();
      setProjects([]);
      setCategories([]);
      setExpenses([]);
      setCompanies([]);
      setWorkspaceProjects([]);
      setUserAssignments([]);
      setDbLogs([]);
      setAssignmentToast('✨ Database purged! All user data removed and starting brand new.');
      setTimeout(() => setAssignmentToast(null), 5000);
    }
  };

  // Toggle notification dropdown and automatically mark unread as viewed
  const toggleNotificationDropdown = () => {
    const nextState = !isNotificationDropdownOpen;
    setIsNotificationDropdownOpen(nextState);
    if (nextState) {
      setHasNewPendingApprovalsAlert(false);
      handleMarkAllNotificationsAsViewed();
    }
  };

  // Pending expense / payment approvals
  const pendingApprovals = useMemo(() => {
    return expenses.filter(e => (e.status as any) === 'Pending' || (e.status as any) === 'Submitted' || (e.status as any) === 'Under Review');
  }, [expenses]);

  // Track arrival of new pending approvals to animate the notification bell in the header
  const prevPendingApprovalsCountRef = useRef<number>(pendingApprovals.length);
  const [hasNewPendingApprovalsAlert, setHasNewPendingApprovalsAlert] = useState<boolean>(false);

  useEffect(() => {
    const currentCount = pendingApprovals.length;
    const prevCount = prevPendingApprovalsCountRef.current;
    
    // Check if new pending approval(s) arrived in the system
    if (currentCount > prevCount) {
      setHasNewPendingApprovalsAlert(true);
      const newestPending = pendingApprovals[pendingApprovals.length - 1];
      if (newestPending) {
        setAssignmentToast(`🔔 New approval request: "${(newestPending as any).description || newestPending.notes || newestPending.title || 'Expense'}" (₹${Number(newestPending.amount).toLocaleString()}) awaiting review in Approvals!`);
        setTimeout(() => setAssignmentToast(null), 6000);
      }
    } else if (currentCount === 0) {
      setHasNewPendingApprovalsAlert(false);
    }
    prevPendingApprovalsCountRef.current = currentCount;
  }, [pendingApprovals]);

  // Clear new approval alert when user switches to 'approvals' tab
  useEffect(() => {
    if (activeTab === 'approvals') {
      setHasNewPendingApprovalsAlert(false);
    }
  }, [activeTab]);

  // Project & Role activity updates from dbLogs
  const projectUpdates = useMemo(() => {
    return dbLogs.slice(0, 15);
  }, [dbLogs]);

  // Unified stream of ALL notifications (Assignments, Approvals, Responses, Activity Logs) sorted strictly NEW to OLD
  const allNotifications = useMemo(() => {
    type UnifiedNotifItem = {
      id: string;
      type: 'assignment' | 'sender_response' | 'approval' | 'activity';
      timestamp: string;
      timestampMs: number;
      title: string;
      subtitle: string;
      tag: string;
      tagColor: 'blue' | 'amber' | 'emerald' | 'rose' | 'slate' | 'cyan';
      raw: any;
      isUnread?: boolean;
    };

    const items: UnifiedNotifItem[] = [];

    // 1. Pending Assignment Requests for current user
    pendingAssignments.forEach(asgn => {
      const parsedTime = asgn.createdAt ? new Date(asgn.createdAt).getTime() : 0;
      const tMs = isNaN(parsedTime) || parsedTime === 0 ? Date.now() : parsedTime;
      items.push({
        id: `asgn_${asgn.id}`,
        type: 'assignment',
        timestamp: asgn.createdAt || new Date().toISOString(),
        timestampMs: tMs,
        title: asgn.projectName || 'Project Assignment',
        subtitle: `${asgn.companyName || 'Company'} • Assigned Role: ${asgn.assignedRole}`,
        tag: asgn.assignedRole || 'Assignment',
        tagColor: 'blue',
        raw: asgn,
        isUnread: !asgn.isViewed
      });
    });

    // 2. Sender Response Notifications (when someone accepted or declined user's invitation)
    senderResponseNotifications.forEach(notif => {
      const isAccepted = notif.status === 'AcceptedNotification';
      const timeStr = notif.acceptedAt || notif.createdAt || new Date().toISOString();
      const parsedTime = new Date(timeStr).getTime();
      const tMs = isNaN(parsedTime) || parsedTime === 0 ? Date.now() : parsedTime;
      items.push({
        id: `sender_${notif.id}`,
        type: 'sender_response',
        timestamp: timeStr,
        timestampMs: tMs,
        title: isAccepted ? `Assignment Accepted: ${notif.assignedRole}` : `Assignment Declined: ${notif.assignedRole}`,
        subtitle: `${notif.assignedBy || 'Team Member'} for ${notif.projectName} (${notif.companyName})`,
        tag: isAccepted ? 'Accepted' : 'Declined',
        tagColor: isAccepted ? 'emerald' : 'rose',
        raw: notif,
        isUnread: !notif.isViewed
      });
    });

    // 3. Pending Approvals & Requests
    pendingApprovals.forEach(exp => {
      const timeStr = (exp as any).createdAt || exp.date || new Date().toISOString();
      const parsedTime = new Date(timeStr).getTime();
      const tMs = isNaN(parsedTime) || parsedTime === 0 ? Date.now() : parsedTime;
      items.push({
        id: `approval_${exp.id}`,
        type: 'approval',
        timestamp: timeStr,
        timestampMs: tMs,
        title: (exp as any).description || exp.notes || exp.title || 'Pending Approval Request',
        subtitle: `Vendor: ${exp.vendor || 'N/A'} • Category: ${exp.categoryId || 'General'}`,
        tag: `₹${Number(exp.amount || 0).toLocaleString()}`,
        tagColor: 'amber',
        raw: exp,
        isUnread: true
      });
    });

    // 4. Project & Role Activity updates from system logs
    projectUpdates.forEach(log => {
      const parsedTime = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      const tMs = isNaN(parsedTime) || parsedTime === 0 ? Date.now() : parsedTime;
      items.push({
        id: `log_${log.id}`,
        type: 'activity',
        timestamp: log.timestamp || new Date().toISOString(),
        timestampMs: tMs,
        title: log.action || 'System Activity',
        subtitle: `${log.details || ''} (by ${log.user || 'System'})`,
        tag: log.module || 'Activity',
        tagColor: 'slate',
        raw: log,
        isUnread: false
      });
    });

    // Sort strictly newest to oldest
    return items.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [pendingAssignments, senderResponseNotifications, pendingApprovals, projectUpdates]);

  // Relative timestamp helper for notification cards
  const formatNotificationTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = Date.now();
      const diffSec = Math.floor((now - d.getTime()) / 1000);
      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return 'Yesterday';
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Total unread notification badge count (Only UNVIEWED notifications are counted)
  const unreadAssignmentsCount = useMemo(() => {
    if (!userEmail) return 0;
    const cleanEmail = userEmail.toLowerCase().trim();
    return userAssignments.filter(
      a => (a.status === 'Pending' || a.status === 'AcceptedNotification' || a.status === 'DeclinedNotification') && !a.isViewed && (
        a.assignedEmail.toLowerCase().trim() === cleanEmail ||
        cleanEmail.includes(a.assignedEmail.toLowerCase().trim()) ||
        a.assignedEmail.toLowerCase().trim().includes(cleanEmail)
      )
    ).length;
  }, [userAssignments, userEmail]);

  const totalNotificationsCount = unreadAssignmentsCount;

  // Build unified projects combining projects and workspaceProjects (with clean ID and clean name matching)
  const unifiedProjects = useMemo(() => {
    const uniqueProjectsMap = new Map<string, Project>();
    projects.forEach(p => {
      const cleanTitle = cleanProjectTitle(p.name || '').toLowerCase().trim();
      const cleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
      const key = cleanTitle || cleanId;
      if (!uniqueProjectsMap.has(key)) {
        uniqueProjectsMap.set(key, p);
      } else {
        const existing = uniqueProjectsMap.get(key)!;
        if ((p.updatedAt || '') > (existing.updatedAt || '')) {
          uniqueProjectsMap.set(key, { ...existing, ...p });
        }
      }
    });

    const list = Array.from(uniqueProjectsMap.values());
    workspaceProjects.forEach(wp => {
      const cleanWpId = wp.id.replace(/^(wp_|p_|proj_)/, '');
      const cleanWpName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
      
      const exists = list.some(p => {
        const cleanPId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const cleanPName = cleanProjectTitle(p.name || '').toLowerCase().trim();
        
        return (
          p.id === wp.id || 
          cleanPId === cleanWpId || 
          (cleanPName && cleanWpName && cleanPName === cleanWpName)
        );
      });

      if (!exists) {
        let numBudget = 0;
        if (wp.budget) {
          const clean = wp.budget.replace(/[^0-9.]/g, '');
          const val = isNaN(parseFloat(clean)) ? 0 : parseFloat(clean);
          if (wp.budget.toLowerCase().includes('cr')) {
            numBudget = val * 10000000;
          } else if (wp.budget.toLowerCase().includes('l')) {
            numBudget = val * 100000;
          } else if (wp.budget.toLowerCase().includes('k')) {
            numBudget = val * 1000;
          } else if (wp.budget.toLowerCase().includes('m')) {
            numBudget = val * 1000000;
          } else {
            numBudget = val;
          }
        }
        list.push({
          id: wp.id,
          name: wp.name,
          description: `Studio Project - ${wp.ref || wp.id}`,
          totalBudget: numBudget,
          spent: Math.round(numBudget * ((wp.utilization || 0) / 100)),
          status: wp.status === 'On Track' ? 'Production' : 'Pre-Production',
          startDate: new Date().toISOString().substring(0, 10),
          currency: 'INR',
          companyName: 'Studio',
          projectType: 'Film'
        });
      }
    });
    return list;
  }, [projects, workspaceProjects]);

  // User Authorization & Project Access Controls
  const userAuthorizedProjects = useMemo(() => {
    if (!userEmail) return [];
    const cleanEmail = userEmail.toLowerCase().trim();

    return unifiedProjects.filter(p => {
      // 1. Project creator / owner
      if (p.createdBy && p.createdBy.toLowerCase().trim() === cleanEmail) return true;
      if ((p as any).email && (p as any).email.toLowerCase().trim() === cleanEmail) return true;
      if ((p as any).ownerEmail && (p as any).ownerEmail.toLowerCase().trim() === cleanEmail) return true;

      // 2. Assigned users array (team members assigned by creator/admin)
      if (Array.isArray(p.assignedUsers) && p.assignedUsers.some((u: any) => u.email?.toLowerCase().trim() === cleanEmail)) return true;

      // 3. Resources list
      if (Array.isArray((p as any).resources) && (p as any).resources.some((r: string) => r.toLowerCase().trim() === cleanEmail)) return true;

      // 4. User assignments in Firestore
      const hasAssignment = userAssignments.some(a =>
        a.assignedEmail.toLowerCase().trim() === cleanEmail &&
        (a.status === 'Accepted' || a.status === 'Pending') &&
        (a.projectId === p.id || (a.projectName && p.name && a.projectName.toLowerCase().trim() === p.name.toLowerCase().trim()))
      );
      if (hasAssignment) return true;

      return false;
    });
  }, [unifiedProjects, userAssignments, userEmail]);

  // Companies accessible to the logged-in user
  const userAuthorizedCompanies = useMemo(() => {
    if (!userEmail) return [];
    const cleanEmail = userEmail.toLowerCase().trim();

    const authorizedCompanyIds = new Set<string>();
    userAuthorizedProjects.forEach(p => {
      if (p.companyId) authorizedCompanyIds.add(p.companyId);
    });

    return companies.filter(c => {
      const cEmail = (c.email || '').toLowerCase().trim();
      const cCreatedBy = ((c as any).createdBy || '').toLowerCase().trim();
      const cOwnerEmail = ((c as any).ownerEmail || '').toLowerCase().trim();

      if (cEmail && cEmail === cleanEmail) return true;
      if (cCreatedBy && cCreatedBy === cleanEmail) return true;
      if (cOwnerEmail && cOwnerEmail === cleanEmail) return true;
      if (authorizedCompanyIds.has(c.id)) return true;

      const hasCompanyAssignment = userAssignments.some(a =>
        a.assignedEmail.toLowerCase().trim() === cleanEmail &&
        a.status === 'Accepted' &&
        (a.companyId === c.id || (a.companyGstin && c.gstNumber && a.companyGstin.toUpperCase() === c.gstNumber.toUpperCase()))
      );
      if (hasCompanyAssignment) return true;

      return false;
    });
  }, [companies, userAuthorizedProjects, userAssignments, userEmail]);

  const activeCompany = useMemo(() => {
    return userAuthorizedCompanies.find(c => c.id === activeCompanyId) || userAuthorizedCompanies[0] || companies[0];
  }, [companies, userAuthorizedCompanies, activeCompanyId]);

  const activeProject = findMatchingProject(userAuthorizedProjects, selectedProjectId)
    || findMatchingProject(unifiedProjects, selectedProjectId)
    || userAuthorizedProjects[0]
    || unifiedProjects[0];

  useEffect(() => {
    if (userAuthorizedProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(userAuthorizedProjects[0].id);
    }
  }, [userAuthorizedProjects, selectedProjectId]);

  // Derive and automatically sync active role to the role assigned to userEmail when opening/viewing Project Dashboard
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    
    if (!userEmail) return;
    const cleanEmail = userEmail.toLowerCase().trim();

    // Look in active selected project
    const currentProj = findMatchingProject(unifiedProjects, selectedProjectId) || unifiedProjects[0];
    let foundRoleTitle: string | undefined;

    if (currentProj && Array.isArray(currentProj.assignedUsers)) {
      const match = currentProj.assignedUsers.find(
        (u: any) => u.email?.toLowerCase().trim() === cleanEmail
      );
      if (match && match.role) {
        foundRoleTitle = match.role;
      }
    }

    if (foundRoleTitle) {
      const matchedAppRole = APP_ROLES_CATALOG.find(
        r => r.title.toLowerCase() === foundRoleTitle?.toLowerCase() || r.id.toLowerCase() === foundRoleTitle?.toLowerCase()
      );
      if (matchedAppRole && matchedAppRole.id !== currentRole) {
        setCurrentRole(matchedAppRole.id);
      }
    }
  }, [activeTab, selectedProjectId, unifiedProjects, userEmail]);

  // Handle Accept Assignment (Auto-Links Project if Company with same GSTIN exists, else creates both Company & Project)
  const handleAcceptAssignment = async (asgn: UserAssignmentNotification) => {
    try {
      const cleanAsgnProjName = cleanProjectTitle(asgn.projectName || '').toLowerCase().trim();
      const targetProjId = asgn.projectId || `proj_${Date.now()}`;
      const cleanTargetProjId = targetProjId.replace(/^(wp_|p_|proj_)/, '');

      // Prevent accepting an assignment if a different project with the exact same name already exists in workspace
      const duplicateProj = projects.find(p => {
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
        return pCleanName === cleanAsgnProjName && pCleanId !== cleanTargetProjId && p.id !== targetProjId;
      }) || workspaceProjects.find(wp => {
        const wpCleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
        const wpCleanName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
        return wpCleanName === cleanAsgnProjName && wpCleanId !== cleanTargetProjId && wp.id !== targetProjId;
      });

      if (duplicateProj) {
        alert(`Cannot accept project assignment: A project named "${asgn.projectName}" already exists in your workspace. Duplicate project names are not allowed.`);
        setAssignmentToast(`Acceptance blocked: Duplicate project name "${asgn.projectName}".`);
        setTimeout(() => setAssignmentToast(null), 5000);
        return;
      }

      const targetGstin = (asgn.companyGstin || '').trim().toUpperCase();
      const cleanEmail = (userEmail || asgn.assignedEmail).toLowerCase().trim();

      // Check if user already has a matching company by GSTIN, ID, or Name
      const existingCompany = companies.find(c => {
        const cGstin = (c.gstNumber || '').trim().toUpperCase();
        if (targetGstin && cGstin && cGstin === targetGstin) return true;
        if (asgn.companyId && c.id === asgn.companyId) return true;
        if (asgn.companyName && c.name.toLowerCase().trim() === asgn.companyName.toLowerCase().trim()) return true;
        return false;
      });

      let assignedCompanyId = '';
      let assignedCompanyName = '';
      let isExistingCompanyMatched = false;

      if (existingCompany) {
        // 1. Same company already exists! Link project automatically to this company
        isExistingCompanyMatched = true;
        assignedCompanyId = existingCompany.id;
        assignedCompanyName = existingCompany.name;

        const updatedCompany: Company = {
          ...existingCompany,
          projectCount: (existingCompany.projectCount || 0) + 1,
          lastSynced: 'Just now'
        };
        await saveCompany(updatedCompany);
      } else {
        // 2. No matching company found for GSTIN! Create both Company and Project
        assignedCompanyId = asgn.companyId || `comp_${Date.now()}`;
        assignedCompanyName = asgn.companyName || 'Assigned Company';

        const newCompany: Company = {
          id: assignedCompanyId,
          name: assignedCompanyName,
          code: asgn.companyCode || (assignedCompanyName.substring(0, 4).toUpperCase()),
          address: asgn.companyAddress || 'Corporate Registered Office',
          gstNumber: asgn.companyGstin || targetGstin || '',
          email: asgn.assignedBy,
          projectCount: 1,
          utilization: 0,
          status: 'Active',
          lastSynced: 'Just now'
        };
        await saveCompany(newCompany);
      }

      // Now create/update Project record under assignedCompanyId
      const existingProj = projects.find(p => p.id === targetProjId) || workspaceProjects.find(p => p.id === targetProjId);

      const updatedProjUsers = [
        ...(((existingProj as any)?.assignedUsers as any[]) || []),
        { email: cleanEmail, name: asgn.assignedName || cleanEmail.split('@')[0], role: asgn.assignedRole }
      ];

      const updatedProject: Project = {
        id: targetProjId,
        name: asgn.projectName,
        description: asgn.projectDescription || `Assigned project under ${assignedCompanyName}`,
        totalBudget: asgn.totalBudget || 0,
        spent: (existingProj as any)?.spent || 0,
        status: (existingProj?.status as any) || 'Production',
        startDate: asgn.startDate || new Date().toISOString().split('T')[0],
        currency: 'INR',
        companyId: assignedCompanyId,
        companyName: assignedCompanyName,
        assignedUsers: updatedProjUsers,
        createdBy: asgn.assignedBy
      };

      const updatedWp: WorkspaceProject = {
        id: targetProjId,
        companyId: assignedCompanyId,
        companyName: assignedCompanyName,
        name: asgn.projectName,
        ref: targetProjId.toUpperCase().substring(0, 8),
        status: 'On Track',
        utilization: 0,
        budget: asgn.totalBudget ? (asgn.totalBudget >= 10000000 ? `₹${(asgn.totalBudget / 10000000).toFixed(1)} Cr` : `₹${(asgn.totalBudget / 100000).toFixed(1)} Lakh`) : '₹0',
        resources: [cleanEmail],
        lastSync: 'Just now',
        imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
      };

      // Save to Firestore with real-time stream
      await saveProject(updatedProject);
      await saveWorkspaceProject(updatedWp);

      // Mark assignment as accepted in Firestore
      await saveDocData('user_assignments', asgn.id, {
        ...asgn,
        status: 'Accepted',
        acceptedAt: new Date().toISOString()
      });

      // Send real-time notification to sender (assignedBy) that receiver accepted!
      const cleanSender = (asgn.assignedBy || '').trim().toLowerCase();
      if (cleanSender) {
        const senderNotifId = `notif_accepted_${asgn.id}_${Date.now()}`;
        const senderNotif: UserAssignmentNotification = {
          id: senderNotifId,
          assignedEmail: cleanSender,
          assignedName: asgn.assignedBy,
          assignedRole: asgn.assignedRole,
          department: asgn.department,
          projectId: targetProjId,
          projectName: asgn.projectName,
          companyId: assignedCompanyId,
          companyName: assignedCompanyName,
          companyGstin: targetGstin,
          assignedBy: cleanEmail,
          createdAt: new Date().toISOString(),
          status: 'AcceptedNotification',
          acceptedAt: new Date().toISOString()
        };
        await saveDocData('user_assignments', senderNotifId, senderNotif);
      }

      // Add activity log to dbLogs for Project & Role Activity tab
      const acceptLog: DBLog = {
        id: `log_asgn_acc_${Date.now()}`,
        action: 'ASSIGNMENT_ACCEPTED',
        module: 'TeamPermissions',
        details: `Receiver '${cleanEmail}' accepted designation assignment request for role '${asgn.assignedRole}' in project '${asgn.projectName}' assigned by '${asgn.assignedBy}'.`,
        timestamp: new Date().toLocaleString(),
        user: cleanEmail,
        ip: 'Real-time Sync'
      };
      handleAddDbLog(acceptLog);

      // Switch view & show toast confirmation
      setSelectedProjectId(targetProjId);
      setActiveTab('dashboard');
      setIsNotificationDropdownOpen(false);

      const toastText = isExistingCompanyMatched
        ? `🎉 Assignment Accepted! Project '${asgn.projectName}' added automatically to your existing company '${assignedCompanyName}' (Matched GSTIN: ${targetGstin || 'N/A'}) with live data flow!`
        : `🎉 Assignment Accepted! Company '${assignedCompanyName}' and Project '${asgn.projectName}' created and linked with live data flow!`;

      setAssignmentToast(toastText);
      setTimeout(() => setAssignmentToast(null), 7000);
    } catch (err) {
      console.error('Failed to accept assignment:', err);
      alert('Error accepting assignment. Please try again.');
    }
  };

  const handleDismissSenderNotif = async (notifId: string) => {
    try {
      await deleteDocData('user_assignments', notifId);
    } catch (err) {
      console.error('Failed to dismiss sender notification:', err);
    }
  };

  const handleDeclineAssignment = async (asgn: UserAssignmentNotification) => {
    if (confirm(`Decline assignment for project "${asgn.projectName}"?`)) {
      const cleanEmail = (userEmail || asgn.assignedEmail).toLowerCase().trim();

      // Mark status as Declined
      await saveDocData('user_assignments', asgn.id, {
        ...asgn,
        status: 'Declined',
        acceptedAt: new Date().toISOString()
      });

      // Send real-time notification to sender (assignedBy) that receiver declined!
      const cleanSender = (asgn.assignedBy || '').trim().toLowerCase();
      if (cleanSender) {
        const senderNotifId = `notif_declined_${asgn.id}_${Date.now()}`;
        const senderNotif: UserAssignmentNotification = {
          id: senderNotifId,
          assignedEmail: cleanSender,
          assignedName: asgn.assignedBy,
          assignedRole: asgn.assignedRole,
          department: asgn.department,
          projectId: asgn.projectId,
          projectName: asgn.projectName,
          companyId: asgn.companyId,
          companyName: asgn.companyName,
          companyGstin: asgn.companyGstin,
          assignedBy: cleanEmail,
          createdAt: new Date().toISOString(),
          status: 'DeclinedNotification',
          acceptedAt: new Date().toISOString()
        };
        await saveDocData('user_assignments', senderNotifId, senderNotif);
      }

      setAssignmentToast(`Assignment for '${asgn.projectName}' was declined.`);
      setTimeout(() => setAssignmentToast(null), 4000);
    }
  };
  // On initialization, seed and subscribe to Firebase Firestore Server
  useEffect(() => {
    seedInitialDataIfEmpty();

    const unsubProjects = subscribeProjects((data) => {
      if (Array.isArray(data)) {
        setProjects(data);
      }
    });
    const unsubWorkspaceProjects = subscribeWorkspaceProjects((data) => {
      if (Array.isArray(data)) {
        setWorkspaceProjects(data);
      }
    });
    const unsubCompanies = subscribeCompanies((data) => {
      if (Array.isArray(data)) {
        setCompanies(data);
      }
    });
    const unsubAssignments = subscribeUserAssignments((data) => {
      if (Array.isArray(data)) {
        setUserAssignments(data);
      }
    });
    const unsubCategories = subscribeCategories((data) => {
      if (Array.isArray(data)) {
        const catMap = new Map<string, BudgetCategory>();
        data.forEach(cat => {
          if (cat.id) catMap.set(cat.id, cat);
        });
        setCategories(sortCategoriesByStandardStructure(Array.from(catMap.values())));
      }
      setIsCategoriesLoaded(true);
    });
    const unsubExpenses = subscribeExpenses((data) => {
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    });
    const unsubLogs = subscribeDbLogs((data) => {
      if (Array.isArray(data)) {
        setDbLogs(data);
      }
    });

    return () => {
      unsubProjects();
      unsubWorkspaceProjects();
      unsubCompanies();
      unsubAssignments();
      unsubCategories();
      unsubExpenses();
      unsubLogs();
    };
  }, []);

  // Ensure every project has default budget categories initialized when created empty
  useEffect(() => {
    if (!isCategoriesLoaded || unifiedProjects.length === 0) return;

    const allToSaveCats: BudgetCategory[] = [];
    const allToDeleteCatIds: string[] = [];
    const currentCats = categoriesRef.current;

    unifiedProjects.forEach(proj => {
      if (initializedProjectsRef.current.has(proj.id)) return;
      initializedProjectsRef.current.add(proj.id);

      const projCats = currentCats.filter(c => 
        c.projectId === proj.id || 
        (c.projectId && proj.id && c.projectId.replace(/^wp_/, '') === proj.id.replace(/^wp_/, ''))
      );

      // Check if project has old deprecated legacy test categories
      const deprecatedCats = projCats.filter(c => {
        const nameLower = c.name.trim().toLowerCase();
        return nameLower.includes('automation') || 
          nameLower.includes('facility') || 
          nameLower.includes('engineering') || 
          nameLower.includes('cargo fleet') || 
          nameLower.includes('data center') ||
          c.id.startsWith('c_old_') ||
          c.name === 'Revenue & Recoveries' ||
          c.name === 'picture vehicle & animals' ||
          ((c.name === 'Production' || c.name === 'Talent' || c.name === 'Post-Prod') && (!c.subCategories || c.subCategories.length === 0));
      });

      if (deprecatedCats.length > 0) {
        deprecatedCats.forEach(dc => allToDeleteCatIds.push(dc.id));
      }

      const activeProjCats = projCats.filter(c => !deprecatedCats.some(dc => dc.id === c.id));
      const pType = proj.type || proj.projectType;
      const isMismatched = isCategoryStructureMismatched(activeProjCats, pType);

      if (activeProjCats.length === 0 || deprecatedCats.length > 0 || isMismatched) {
        if (isMismatched && activeProjCats.length > 0) {
          activeProjCats.forEach(ac => {
            if (!allToDeleteCatIds.includes(ac.id)) {
              allToDeleteCatIds.push(ac.id);
            }
          });
        }
        const syncedCats = ensureStandardCategoriesForProject(proj.id, isMismatched ? [] : activeProjCats, pType);
        syncedCats.forEach(c => allToSaveCats.push(c));
      }
    });

    if (allToDeleteCatIds.length > 0) {
      deleteCategoriesBatch(allToDeleteCatIds);
      setCategories(prev => prev.filter(c => !allToDeleteCatIds.includes(c.id)));
    }

    if (allToSaveCats.length > 0) {
      setCategories(prev => {
        const map = new Map<string, BudgetCategory>();
        prev.forEach(c => { if (c.id) map.set(c.id, c); });
        allToSaveCats.forEach(c => { if (c.id) map.set(c.id, c); });
        return sortCategoriesByStandardStructure(Array.from(map.values()));
      });
      saveCategoriesBatch(allToSaveCats);
    }
  }, [isCategoriesLoaded, unifiedProjects]);

  const handleAddDbLog = (newLog: DBLog) => {
    addDbLog(newLog);
  };

  // Add Expense Handler (commits directly through Firebase Server)
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newId = `e_${Math.random().toString(36).substring(2, 9)}`;
    const newExpense: Expense = {
      id: newId,
      ...expenseData
    };

    // Save expense to Firebase
    saveExpense(newExpense);

    // Update Category Spent Amount on Firebase
    const targetCat = categories.find(c => c.id === expenseData.categoryId);
    if (targetCat) {
      saveCategory({
        ...targetCat,
        spentAmount: targetCat.spentAmount + expenseData.amount
      });
    }

    // Update Project Spent Amount on Firebase
    const targetProj = projects.find(p => p.id === expenseData.projectId);
    if (targetProj) {
      saveProject({
        ...targetProj,
        spent: targetProj.spent + expenseData.amount
      });
    }

    // Create DB transactional sql audit logs
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    addDbLog({
      id: `l_ins_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'FIREBASE_INSERT_TRANSACTION',
      sqlQuery: `INSERT INTO expenses (id, projectId, categoryId, title, amount, date, payee, status) VALUES ('${newId}', '${expenseData.projectId}', '${expenseData.categoryId}', '${expenseData.title.replace(/'/g, "''")}', ${expenseData.amount}, '${expenseData.date}', '${expenseData.payee.replace(/'/g, "''")}', '${expenseData.status}');`,
      status: 'success'
    });

    addDbLog({
      id: `l_upd_cat_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'FIREBASE_UPDATE_CATEGORY',
      sqlQuery: `UPDATE categories SET spentAmount = spentAmount + ${expenseData.amount} WHERE id = '${expenseData.categoryId}';`,
      status: 'success'
    });

    addDbLog({
      id: `l_upd_proj_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'FIREBASE_UPDATE_PROJECT',
      sqlQuery: `UPDATE projects SET spent = spent + ${expenseData.amount} WHERE id = '${expenseData.projectId}';`,
      status: 'success'
    });
  };

  // Full Expense Management Handler (Supports Save, Update & Delete)
  const handleSaveExpense = (exp: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === exp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exp;
        return next;
      }
      return [exp, ...prev];
    });

    saveExpense(exp);

    addDbLog({
      id: `l_exp_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'FIREBASE_SAVE_EXPENSE',
      sqlQuery: `UPSERT INTO expenses (id, voucherNumber, payee, amount, categoryId, status) VALUES ('${exp.id}', '${exp.bookingNo || exp.voucherNumber || ''}', '${(exp.payee || '').replace(/'/g, "''")}', ${exp.amount}, '${exp.categoryId}', '${exp.status}');`,
      status: 'success'
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    deleteExpense(expenseId);

    addDbLog({
      id: `l_del_exp_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: 'FIREBASE_DELETE_EXPENSE',
      sqlQuery: `DELETE FROM expenses WHERE id = '${expenseId}';`,
      status: 'success'
    });
  };

  // Nav to specific project on dashboard click
  const handleSelectProjectFilter = (projId: string) => {
    setSelectedProjectId(projId);
  };

  const handleProjectCreated = (newProj: Project, newCats: BudgetCategory[], mfgLog: DBLog) => {
    const cleanNewName = cleanProjectTitle(newProj.name || '').toLowerCase().trim();
    const cleanNewId = newProj.id.replace(/^(wp_|p_|proj_)/, '');

    const exists = projects.some(p => {
      const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
      const pCleanName = cleanProjectTitle(p.name || '').toLowerCase().trim();
      return pCleanName === cleanNewName && pCleanId !== cleanNewId && p.id !== newProj.id;
    }) || workspaceProjects.some(wp => {
      const wpCleanId = wp.id.replace(/^(wp_|p_|proj_)/, '');
      const wpCleanName = cleanProjectTitle(wp.name || '').toLowerCase().trim();
      return wpCleanName === cleanNewName && wpCleanId !== cleanNewId && wp.id !== newProj.id;
    });

    if (exists) {
      alert(`Cannot create project: A project named "${newProj.name}" already exists in your workspace. Duplicate project names are not allowed.`);
      return;
    }

    saveProject(newProj);
    saveCategoriesBatch(newCats);
    addDbLog(mfgLog);

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

    const newWp: WorkspaceProject = {
      id: `wp_${newProj.id.replace(/^(wp_|p_|proj_)/, '')}`,
      companyId: newProj.companyId || 'gp',
      companyName: newProj.companyName,
      name: newProj.name,
      projectType: newProj.projectType || 'Film / Feature Production',
      projectCode: newProj.projectCode,
      showFormat: newProj.showFormat,
      channelPlatform: newProj.channelPlatform,
      ref: newProj.projectCode || newProj.id.toUpperCase(),
      status: wpStatus,
      pipelineStage: pStage,
      utilization: 0,
      budget: formattedBudget,
      totalBudget: numBudget,
      compGstin: newProj.compGstin,
      compPan: newProj.compPan,
      compAddress: newProj.compAddress,
      resources: [newProj.createdBy?.substring(0, 2).toUpperCase() || 'PO'],
      lastSync: 'Just now',
      imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=150&q=80',
      rawProject: newProj
    };
    saveWorkspaceProject(newWp);

    setActiveTab('dashboard');
  };

  // Budget Version Management State
  const [budgetVersionsMap, setBudgetVersionsMap] = useState<Record<string, BudgetVersionRecord[]>>({});

  const activeProjId = selectedProjectId || (unifiedProjects[0]?.id || '');

  // Load versions whenever activeProjId changes
  useEffect(() => {
    if (!activeProjId) return;

    const projCats = categories.filter(c => 
      c.projectId === activeProjId || 
      (c.projectId && activeProjId && c.projectId.replace(/^wp_/, '') === activeProjId.replace(/^wp_/, ''))
    );

    const catSum = projCats.reduce((sum, cat) => {
      const subs = cat.subCategories || [];
      const catAlloc = subs.length > 0
        ? subs.reduce((sSum, s) => {
            const childs = s.childCategories || [];
            return sSum + (childs.length > 0 ? childs.reduce((cSum, ch) => cSum + (Number(ch.allocatedAmount) || 0), 0) : (Number(s.allocatedAmount) || 0));
          }, 0)
        : (Number(cat.allocatedAmount) || 0);
      return sum + catAlloc;
    }, 0);

    const loaded = loadProjectBudgetVersions(activeProjId, catSum);
    // If initial version V1 has a legacy hardcoded totalAmount (e.g. 1500000) while actual category sum is 0, reset V1 totalAmount to 0
    const synced = loaded.map((v, idx) => {
      if (idx === 0 && catSum === 0 && v.totalAmount > 0) {
        return { ...v, totalAmount: 0 };
      }
      return v;
    });

    setBudgetVersionsMap(prev => ({ ...prev, [activeProjId]: synced }));

    // Subscribe to real-time budget versions from Firestore
    const unsub = subscribeDoc<{ versions?: BudgetVersionRecord[] }>('budgetVersions', activeProjId, (data) => {
      if (data && Array.isArray(data.versions) && data.versions.length > 0) {
        setBudgetVersionsMap(prev => ({ ...prev, [activeProjId]: data.versions! }));
      }
    });

    return () => unsub();
  }, [activeProjId, categories]);

  const activeVersions = budgetVersionsMap[activeProjId] || loadProjectBudgetVersions(activeProjId, 0);
  const currentBudgetVersion = activeVersions[0];
  const lastApprovedBudgetVersion = activeVersions.find(v => v.status === 'Approved') || currentBudgetVersion;

  // Handler for sending approval request
  const handleSendApproval = (targetRole?: string) => {
    if (!currentBudgetVersion) return;
    const updated = updateApprovalSendStatus(currentBudgetVersion, targetRole);
    const updatedList = activeVersions.map(v => v.id === updated.id ? updated : v);
    setBudgetVersionsMap(prev => ({ ...prev, [activeProjId]: updatedList }));
    saveProjectBudgetVersions(activeProjId, updatedList);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    addDbLog({
      id: `l_appr_send_${Date.now()}`,
      timestamp: nowTimestamp,
      action: 'BUDGET_APPROVAL_REQUEST_SENT',
      sqlQuery: `UPDATE budget_versions SET status = 'PENDING' WHERE version_name = '${updated.versionName}' AND target_role = '${targetRole || 'ALL'}';`,
      status: 'info'
    });
  };

  // Handler for granting role approval
  const handleApproveRole = (roleToApprove: string) => {
    if (!currentBudgetVersion) return;
    const { updatedVersion, isNowFullyApproved } = grantRoleApproval(currentBudgetVersion, roleToApprove);
    const updatedList = activeVersions.map(v => v.id === updatedVersion.id ? updatedVersion : v);
    setBudgetVersionsMap(prev => ({ ...prev, [activeProjId]: updatedList }));
    saveProjectBudgetVersions(activeProjId, updatedList);

    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    addDbLog({
      id: `l_appr_grant_${Date.now()}`,
      timestamp: nowTimestamp,
      action: isNowFullyApproved ? 'BUDGET_VERSION_FULLY_APPROVED' : 'ROLE_APPROVAL_GRANTED',
      sqlQuery: `UPDATE budget_version_approvals SET status = 'APPROVED', approved_at = '${nowTimestamp}' WHERE version_name = '${updatedVersion.versionName}' AND role = '${roleToApprove}';`,
      status: 'success'
    });

    if (isNowFullyApproved) {
      const targetProj = projects.find(p => p.id === activeProjId);
      if (targetProj) {
        saveProject({
          ...targetProj,
          totalBudget: updatedVersion.totalAmount
        });
      }
      alert(`🎉 Budget Version ${updatedVersion.versionName} has been FULLY APPROVED by all required roles! Active Official Approved Budget is now ₹${updatedVersion.totalAmount.toLocaleString()}.`);
    }
  };

  const handleUpdateCategories = (updatedCategories: BudgetCategory[], dbLog: DBLog, targetProjectId?: string) => {
    const projId = targetProjectId || selectedProjectId || updatedCategories[0]?.projectId;

    // Immediately update local React categories state to prevent state reverting from stale props
    setCategories(prev => {
      const catMap = new Map<string, BudgetCategory>();
      prev.forEach(c => {
        if (c.id) catMap.set(c.id, c);
      });
      if (projId) {
        for (const [id, c] of Array.from(catMap.entries())) {
          const isProjMatch = c.projectId === projId ||
            (c.projectId && projId && c.projectId.replace(/^wp_/, '') === projId.replace(/^wp_/, '')) ||
            !c.projectId;
          if (isProjMatch) {
            catMap.delete(id);
          }
        }
      }
      updatedCategories.forEach(c => {
        if (c.id) catMap.set(c.id, c);
      });
      return Array.from(catMap.values());
    });

    if (projId) {
      const existingForProj = categories.filter(c => 
        c.projectId === projId || 
        (c.projectId && projId && c.projectId.replace(/^wp_/, '') === projId.replace(/^wp_/, '')) ||
        !c.projectId
      );

      const updatedIds = new Set(updatedCategories.map(u => u.id));
      const idsToDelete = existingForProj
        .filter(oldCat => !updatedIds.has(oldCat.id))
        .map(oldCat => oldCat.id);
      if (idsToDelete.length > 0) {
        deleteCategoriesBatch(idsToDelete);
      }
    }

    saveCategoriesBatch(updatedCategories);
    addDbLog(dbLog);

    // Auto-increment version code e.g. AUTO-VRSNXVBSA000002 on saved changes
    if (projId) {
      const { updatedVersions, newVersion } = createNewBudgetVersion(
        projId,
        updatedCategories,
        currentRole,
        budgetVersionsMap[projId]
      );
      setBudgetVersionsMap(prev => ({ ...prev, [projId]: updatedVersions }));

      // Sync project totalBudget
      const cleanTargetId = projId.startsWith('wp_') ? projId.substring(3) : projId;
      const targetProj = projects.find(p => p.id === projId || p.id === cleanTargetId || p.id === `wp_${cleanTargetId}`);
      if (targetProj) {
        saveProject({
          ...targetProj,
          totalBudget: newVersion.totalAmount
        });
      }
      
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      addDbLog({
        id: `l_vsn_gen_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'NEW_BUDGET_VERSION_GENERATED',
        sqlQuery: `INSERT INTO budget_versions (version_name, version_number, total_amount, creator_role, status) VALUES ('${newVersion.versionName}', ${newVersion.versionNumber}, ${newVersion.totalAmount}, '${currentRole}', '${newVersion.status}');`,
        status: 'success'
      });
    }
  };


  if (!isLoggedIn) {
    return (
      <LoginView 
        onLogin={(email) => {
          setIsLoggedIn(true);
          setUserEmail(email);
          safeRemoveStorage('session', 'erp_explicit_logout');
          safeSetStorage('session', 'erp_session_active', 'true');
          safeSetStorage('session', 'erp_user_email', email);
        }} 
      />
    );
  }

  const handleClearAuditLogs = () => {
    setDbLogs([]);
  };

  const handleResetAuditLogs = () => {
    const initialLogs: DBLog[] = [
      {
        id: 'l1',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'DB_INIT',
        sqlQuery: 'INITIALIZE Firebase Firestore Real-Time Listener [Collection: projects, categories, expenses]',
        status: 'success'
      },
      {
        id: 'l2',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'AUTH_VERIFIED',
        sqlQuery: `CONNECT Session Identity: ${userEmail} [Role: ${currentRole}]`,
        status: 'success'
      }
    ];
    setDbLogs(initialLogs);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200 antialiased font-sans">
      
      {/* Top Fixed Header Bar */}
      <header className="fixed top-0 left-0 w-full h-14 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800/80 px-3 md:px-6 flex items-center justify-between z-50 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Menu / Sidebar Toggle Button */}
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/70 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
            title="Toggle Navigation Menu"
          >
            {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center cursor-pointer py-1 group" onClick={() => setActiveTab('workspace')} title="PBT ERP - User Workspace">
            <PBTLogo className="h-7 w-auto text-white group-hover:text-blue-400 transition-colors" />
          </div>

          {/* Active Project Switcher Dropdown in Top Header (Displayed only when NOT on User Workspace page) */}
          {activeTab !== 'workspace' && userAuthorizedProjects.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 hover:border-blue-500/70 text-xs font-medium transition-all shadow-inner">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
              <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <select
                id="header-project-selector"
                value={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  if (activeTab === 'workspace') setActiveTab('dashboard');
                }}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer max-w-[220px] md:max-w-[340px] lg:max-w-[460px] truncate pr-1 hover:text-blue-300 transition-colors"
                style={{ color: '#ffffff', backgroundColor: 'transparent' }}
                title={cleanProjectTitle(activeProject?.name || 'Selected Project')}
              >
                {userAuthorizedProjects.map(p => (
                  <option 
                    key={p.id} 
                    value={p.id} 
                    className="bg-slate-900 text-white font-medium py-1"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    {cleanProjectTitle(p.name)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Active Role Base Dropdown Selector (ONLY when project dashboard is open) */}
          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-blue-900/60 text-blue-400 shadow-inner transition-all">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono font-extrabold text-blue-400 uppercase tracking-wider leading-none">
                  ACTIVE ROLE ({userEmail.split('@')[0]})
                </span>
                <select 
                  value={currentRole}
                  onChange={(e) => handleRoleChange(e.target.value as AppRole)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer p-0 m-0 border-none hover:text-blue-300 transition-colors pr-1"
                  style={{ color: '#ffffff', backgroundColor: 'transparent' }}
                  title={`Active role assigned to ${userEmail}`}
                >
                  {APP_ROLES_CATALOG.map(r => (
                    <option 
                      key={r.id} 
                      value={r.id} 
                      className="bg-slate-900 text-slate-100"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                    >
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Header System Notification Bell Button with Dropdown Style Menu */}
          <div className="relative" ref={notificationDropdownRef}>
            <button 
              onClick={toggleNotificationDropdown}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-xs group ${
                hasNewPendingApprovalsAlert
                  ? 'bg-amber-950/80 border-amber-500/90 text-amber-300 animate-approval-pulse ring-2 ring-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.6)]'
                  : pendingApprovals.length > 0
                    ? 'bg-slate-950/70 border-amber-500/60 text-amber-300 hover:border-amber-400 hover:bg-slate-900 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : totalNotificationsCount > 0
                      ? 'bg-slate-950/70 border-blue-500/60 text-blue-300 hover:bg-slate-900'
                      : isNotificationDropdownOpen
                        ? 'bg-slate-800 text-white border-blue-500/50'
                        : 'bg-slate-950/60 hover:bg-slate-800/90 text-slate-300 hover:text-white border-slate-800/90'
              }`}
              title={
                hasNewPendingApprovalsAlert
                  ? `🔔 New Pending Approval arrived! (${pendingApprovals.length} pending requests)`
                  : pendingApprovals.length > 0
                    ? `${pendingApprovals.length} Pending Approval(s) waiting • Click to review`
                    : totalNotificationsCount > 0
                      ? `${totalNotificationsCount} unread notification(s)`
                      : "Notifications & Approvals"
              }
            >
              {/* Floating Ripple Beacon for Newly Arrived Approvals */}
              {hasNewPendingApprovalsAlert && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
                  <span className="animate-beacon-ripple absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-900 shadow-md"></span>
                </span>
              )}

              {/* Animated Bell Icon */}
              <Bell 
                className={`w-4 h-4 transition-transform duration-200 ${
                  hasNewPendingApprovalsAlert
                    ? 'text-amber-300 animate-bell-urgent'
                    : pendingApprovals.length > 0
                      ? 'text-amber-400 animate-bell-swing'
                      : totalNotificationsCount > 0
                        ? 'text-blue-400 animate-bounce'
                        : 'text-slate-400 group-hover:text-white'
                }`} 
              />

              {/* High-visibility Badge */}
              {(totalNotificationsCount > 0 || pendingApprovals.length > 0) && (
                <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-black text-white ring-2 ring-slate-950 ${
                  hasNewPendingApprovalsAlert || pendingApprovals.length > 0
                    ? 'bg-amber-500 animate-pulse font-mono shadow-sm'
                    : 'bg-rose-500 animate-pulse font-mono'
                }`}>
                  {totalNotificationsCount + pendingApprovals.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu (Scrollable New to Old) */}
            {isNotificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[440px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Dropdown Header */}
                <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Notifications
                        {allNotifications.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                            {allNotifications.length}
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Newest First</span>
                    <button
                      onClick={() => setIsNotificationDropdownOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Body: Unified Scrollable Stream (New to Old) */}
                <div className="p-3 overflow-y-auto max-h-[440px] space-y-2.5 custom-scrollbar">
                  {allNotifications.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">All caught up!</p>
                      <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto">
                        No pending invitations, approvals, or recent notifications.
                      </p>
                    </div>
                  ) : (
                    allNotifications.map((item) => {
                      // 1. PENDING ASSIGNMENT REQUEST
                      if (item.type === 'assignment') {
                        const asgn = item.raw;
                        const targetGstin = (asgn.companyGstin || '').trim().toUpperCase();
                        const matchingCompany = companies.find(c => {
                          const cGstin = (c.gstNumber || '').trim().toUpperCase();
                          if (targetGstin && cGstin && cGstin === targetGstin) return true;
                          if (asgn.companyId && c.id === asgn.companyId) return true;
                          if (asgn.companyName && c.name.toLowerCase().trim() === asgn.companyName.toLowerCase().trim()) return true;
                          return false;
                        });

                        return (
                          <div 
                            key={item.id} 
                            className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 transition-all space-y-2 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold uppercase tracking-wider font-mono">
                                    {asgn.assignedRole}
                                  </span>
                                  {asgn.department && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300 text-[9px] font-medium font-mono">
                                      {asgn.department}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatNotificationTime(item.timestamp)}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-white flex items-center gap-1.5 pt-0.5 truncate">
                                  <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate">{asgn.projectName}</span>
                                </h5>

                                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                                  <span className="flex items-center gap-1 truncate text-slate-300">
                                    <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                                    <strong className="text-slate-200">{asgn.companyName}</strong>
                                  </span>
                                  {asgn.companyGstin && (
                                    <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-950 text-amber-300 rounded border border-slate-700">
                                      GSTIN: {asgn.companyGstin}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Company match status pill */}
                              {matchingCompany ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold shrink-0">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Same Co.
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold shrink-0">
                                  <Building2 className="w-2.5 h-2.5" />
                                  New Co.
                                </span>
                              )}
                            </div>

                            {asgn.projectDescription && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                                "{asgn.projectDescription}"
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-700/50">
                              <button
                                onClick={() => handleDeclineAssignment(asgn)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all border border-slate-700 cursor-pointer"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleAcceptAssignment(asgn)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // 2. SENDER RESPONSE NOTIFICATION (Accepted / Declined)
                      if (item.type === 'sender_response') {
                        const notif = item.raw;
                        const isAccepted = notif.status === 'AcceptedNotification';
                        return (
                          <div 
                            key={item.id} 
                            className={`p-3 rounded-xl border transition-all space-y-1.5 shadow-xs ${
                              isAccepted 
                                ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500' 
                                : 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 border ${
                                    isAccepted
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  }`}>
                                    {isAccepted ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <X className="w-2.5 h-2.5 text-rose-400" />}
                                    {isAccepted ? 'Accepted' : 'Declined'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatNotificationTime(item.timestamp)}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-white pt-0.5 truncate">
                                  {isAccepted ? (
                                    <>🎉 <strong className="text-emerald-300">{notif.assignedBy || 'Team Member'}</strong> accepted role <span className="text-blue-300">'{notif.assignedRole}'</span></>
                                  ) : (
                                    <>❌ <strong className="text-rose-300">{notif.assignedBy || 'Team Member'}</strong> declined role <span className="text-rose-300">'{notif.assignedRole}'</span></>
                                  )}
                                </h5>

                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                                  <Film className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{notif.projectName}</span>
                                  <span>•</span>
                                  <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                                  <span className="truncate">{notif.companyName}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDismissSenderNotif(notif.id)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium cursor-pointer transition-all border border-slate-700 shrink-0"
                                title="Dismiss"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // 3. PENDING EXPENSE / PAYMENT APPROVAL
                      if (item.type === 'approval') {
                        const exp = item.raw;
                        return (
                          <div 
                            key={item.id} 
                            className="p-3 rounded-xl bg-slate-800/80 border border-amber-500/40 hover:border-amber-400 transition-all space-y-1.5 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider font-mono">
                                    {exp.status || 'Pending'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatNotificationTime(item.timestamp)}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-white pt-0.5 truncate">
                                  {exp.description || 'Expense Request'}
                                </h5>

                                <p className="text-[11px] text-slate-400 truncate">
                                  Vendor: <span className="text-slate-200">{exp.vendor}</span> • Category: <span className="text-slate-200">{exp.categoryId}</span>
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-amber-400 font-mono block">
                                  ₹{Number(exp.amount || 0).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">Requested</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px]">
                              <span className="text-slate-400 italic">
                                Role: {currentRole}
                              </span>
                              <button
                                onClick={() => {
                                  setIsNotificationDropdownOpen(false);
                                  setActiveTab('approvals');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 font-bold border border-amber-500/40 cursor-pointer transition-all flex items-center gap-1 text-[11px]"
                              >
                                Review in Approvals →
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // 4. PROJECT / ROLE ACTIVITY LOG
                      const log = item.raw;
                      return (
                        <div 
                          key={item.id} 
                          className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 shadow-2xs hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-200 truncate">{log.action}</span>
                              <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                {formatNotificationTime(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{log.details}</p>
                            <div className="text-[9px] text-slate-500 font-mono">
                              By: <strong className="text-slate-400">{log.user || 'System'}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    Live Sync Active
                  </span>
                  <span>{allNotifications.length} Total</span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Icon & Dropdown Menu */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/90 hover:border-slate-700 text-slate-200 transition-all cursor-pointer shadow-xs group"
              title="Account Options & Profile"
            >
              {/* Avatar Photo / Initials */}
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/50 flex items-center justify-center shrink-0 shadow-xs relative">
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={userDisplayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-black text-white font-mono">
                    {userInitials}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-950"></span>
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white leading-tight max-w-[120px] truncate">
                  {userDisplayName}
                </span>
                <span className="text-[9px] font-mono text-slate-400 leading-tight">
                  {currentUserProfile?.workDesignation || (currentRole.length > 14 ? `${currentRole.substring(0, 12)}..` : currentRole)}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Account Details Banner */}
                <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-500/40 flex items-center justify-center shrink-0 shadow-inner">
                    {userPhotoUrl ? (
                      <img
                        src={userPhotoUrl}
                        alt="User Photo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-black text-white font-mono">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {userDisplayName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {userEmail}
                    </span>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider w-fit">
                      {currentUserProfile?.workDesignation || currentRole}
                    </span>
                  </div>
                </div>

                {/* Options List */}
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 transition-colors">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span>User Profile Screen</span>
                      <span className="text-[9px] text-slate-400 font-normal">Account info, security &amp; assigned projects</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsEditProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span>Quick Edit Details</span>
                      <span className="text-[9px] text-slate-400 font-normal">Upload photo &amp; update details</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveTab('admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-slate-800/90 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-amber-600/20 text-amber-400 transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span>Global App Admin</span>
                      <span className="text-[9px] text-slate-400 font-normal">System controls, projects &amp; policies</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-950/30 group-hover:bg-rose-900/50 text-rose-400 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span>Log Out</span>
                      <span className="text-[9px] text-rose-400/70 font-normal">Sign out of session</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Side Navigation Bar */}
      <DynamicSidebar 
        activeProject={activeProject}
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        currentRole={currentRole}
        userEmail={userEmail}
        pendingApprovalsCount={pendingApprovals.length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectTab={(tab, subTab) => {
          if (!selectedProjectId && activeProject) setSelectedProjectId(activeProject.id);
          setActiveTab(tab);
          if (subTab) setActiveSubTab(subTab);
        }}
        onLogout={handleLogout}
      />

      {/* Background scrim for mobile overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        ></div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-[215px] pt-13 min-h-screen flex flex-col">
        <div className="flex-1 p-3 md:p-4 flex flex-col gap-4">

          {/* Role Base Access Guard */}
          {activeTab !== 'roles' && activeTab !== 'new-project' && !isTabAllowedForRole(activeTab) ? (
            <RoleRestrictedView 
              moduleKey={activeTab}
              moduleName={activeTab.toUpperCase()}
              currentRole={currentRole}
              onSelectRole={handleRoleChange}
              onNavigateToWorkspace={() => setActiveTab('workspace')}
            />
          ) : (
            <>
              {activeTab === 'workspace' && (
                <WorkspaceView 
                  currentRole={currentRole}
                  userEmail={userEmail}
                  userAuthorizedCompanies={userAuthorizedCompanies}
                  userAuthorizedProjects={userAuthorizedProjects}
                  onSelectProject={(projId) => {
                    setSelectedProjectId(projId);
                    setActiveTab('dashboard');
                  }}
                  onAddLog={handleAddDbLog}
                  onTriggerCreateProject={() => setActiveTab('new-project')}
                />
              )}

              {userAuthorizedProjects.length === 0 && activeTab !== 'workspace' && activeTab !== 'new-project' && activeTab !== 'admin' ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 max-w-xl mx-auto my-4 text-center shadow-lg space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-white tracking-tight">No Assigned Projects Found</h3>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Logged in as <span className="text-slate-200 font-semibold">{userEmail}</span>. Create a project to start tracking or check invitations.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => setActiveTab('new-project')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Create Project</span>
                    </button>
                    <button
                      onClick={toggleNotificationDropdown}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700/60"
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-400" />
                      <span>Invitations ({totalNotificationsCount})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('workspace')}
                      className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    >
                      <span>Go to Workspace</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DynamicDashboard 
                      project={activeProject}
                      company={activeCompany}
                      projects={userAuthorizedProjects}
                      categories={categories}
                      expenses={expenses}
                      onNavigate={(tab, sub) => {
                        setActiveTab(tab);
                        if (sub) setActiveSubTab(sub);
                      }}
                      onSelectProject={setSelectedProjectId}
                    />
                  )}

                  {activeTab.startsWith('dept-') && (
                    <DepartmentWorkspaceView 
                      deptId={activeTab}
                      activeSubTab={activeSubTab}
                      project={activeProject}
                      categories={categories}
                      expenses={expenses}
                      onNavigate={(tab, sub) => {
                        setActiveTab(tab);
                        if (sub) setActiveSubTab(sub);
                      }}
                    />
                  )}

                  {(activeTab === 'project-control' || activeTab === 'project-setup' || activeTab === 'project-overview' || activeTab === 'creative-content' || activeTab === 'talent-contestants' || activeTab === 'crew-departments' || activeTab === 'studio-set' || activeTab === 'status' || activeTab === 'milestones' || activeTab === 'calendar' || activeTab === 'settings' || activeTab === 'overview') && (
                    <NonFictionProjectView 
                      project={activeProject}
                      company={activeCompany}
                      activeTab={activeTab === 'project-control' ? 'project-setup' : activeTab}
                      activeSubTab={activeSubTab}
                      onNavigateSubTab={(tab, sub) => {
                        setActiveTab(tab as TabType);
                        setActiveSubTab(sub);
                      }}
                      categories={categories}
                      expenses={expenses}
                      onAddLog={handleAddDbLog}
                    />
                  )}

                  {(activeTab === 'production' || activeTab === 'production-dsr' || activeTab === 'production-overview' || activeTab === 'schedule' || activeTab === 'units' || activeTab === 'crew-attendance' || activeTab === 'artist-attendance' || activeTab === 'equipment-usage' || activeTab === 'transport-usage' || activeTab === 'genset-fuel' || activeTab === 'vanity' || activeTab === 'food-count' || activeTab === 'call-sheet' || activeTab === 'daily-requirements' || activeTab === 'accommodations' || activeTab === 'issue-tracker') && (
                    <ProductionDSRView 
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      currentRole={currentRole}
                      companyName={activeCompany?.name || 'Follow Focus Films'}
                      activeSubTab={activeTab !== 'production' ? activeTab : activeSubTab}
                      onNavigateSubTab={(sub) => {
                        setActiveSubTab(sub);
                        if (activeTab !== 'production') {
                          setActiveTab('production');
                        }
                      }}
                    />
                  )}

                  {activeTab === 'timeline' && (
                    <TimelineView 
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onAddLog={handleAddDbLog}
                    />
                  )}

                  {(activeTab === 'ledger' || activeTab === 'budget' || activeTab === 'hierarchy' || activeTab === 'versions' || activeTab === 'dept-budget' || activeTab === 'approved-budget' || activeTab === 'committed-cost' || activeTab === 'budget-vs-actual' || activeTab === 'final-cost-report') && (
                    <LedgerView 
                      projects={userAuthorizedProjects}
                      categories={categories}
                      expenses={expenses}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onAddExpense={handleAddExpense}
                      onNavigateToCategorySetup={() => setActiveTab('categories')}
                      onUpdateCategories={(newCats) => {
                        setCategories(prev => {
                          const map = new Map<string, BudgetCategory>();
                          prev.forEach(c => { if (c.id) map.set(c.id, c); });
                          newCats.forEach(c => { if (c.id) map.set(c.id, c); });
                          return sortCategoriesByStandardStructure(Array.from(map.values()));
                        });
                      }}
                      currentVersion={currentBudgetVersion}
                      lastApprovedVersion={lastApprovedBudgetVersion}
                      activeRoleName={currentRole}
                      onSendApproval={handleSendApproval}
                      onApproveRole={handleApproveRole}
                      onSendAllApprovals={() => handleSendApproval()}
                      activeSubTab={activeTab !== 'budget' && activeTab !== 'ledger' ? activeTab : activeSubTab}
                      onNavigateSubTab={(sub) => {
                        setActiveSubTab(sub);
                        if (activeTab !== 'budget' && activeTab !== 'ledger') {
                          setActiveTab('ledger');
                        }
                      }}
                    />
                  )}

                  {(activeTab === 'expenses' || activeTab === 'all-expenses' || activeTab === 'book-expense' || activeTab === 'expense-drafts' || activeTab === 'pending-approval' || activeTab === 'approved-expenses' || activeTab === 'on-account' || activeTab === 'reimbursements' || activeTab === 'uncleared-advances' || activeTab === 'expense-reports') && (
                    <ExpenseView 
                      expenses={expenses}
                      categories={categories}
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      activeCompany={activeCompany}
                      userEmail={userEmail}
                      userRole={currentRole}
                      onSaveExpense={handleSaveExpense}
                      onDeleteExpense={handleDeleteExpense}
                      activeSubTab={activeTab !== 'expenses' ? activeTab : activeSubTab}
                      onNavigateSubTab={(sub) => {
                        setActiveSubTab(sub);
                        if (activeTab !== 'expenses') {
                          setActiveTab('expenses');
                        }
                      }}
                    />
                  )}

                  {(activeTab === 'vendors' || activeTab === 'vendor-directory' || activeTab === 'vendor-creation' || activeTab === 'vendor-verification' || activeTab === 'quotations' || activeTab === 'rate-comparison' || activeTab === 'purchase-orders' || activeTab === 'work-orders' || activeTab === 'vendor-documents' || activeTab === 'three-way-matching' || activeTab === 'po-matching' || activeTab === 'match-audit') && (
                    <VendorsView 
                      categories={categories}
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      activeSubTab={
                        activeTab === 'three-way-matching' || activeTab === 'po-matching' || activeTab === 'match-audit'
                          ? 'three-way-matching'
                          : activeTab !== 'vendors' 
                          ? activeTab 
                          : activeSubTab
                      }
                      onNavigateSubTab={(sub) => {
                        setActiveSubTab(sub);
                        if (activeTab !== 'vendors') {
                          setActiveTab('vendors');
                        }
                      }}
                    />
                  )}

                  {(activeTab === 'payments' || activeTab === 'payment-requests' || activeTab === 'payment-approval' || activeTab === 'payment-register' || activeTab === 'payment-accounts' || activeTab === 'outstanding-payments' || activeTab === 'advance-adjustments' || activeTab === 'tds-tax' || activeTab === 'payment-reports') && (
                    <PaymentsView 
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      expenses={expenses}
                      categories={categories}
                      onSaveExpense={handleSaveExpense}
                    />
                  )}

                  {(activeTab === 'approvals' || activeTab === 'pending-approvals' || activeTab === 'my-approval-requests' || activeTab === 'approved-list' || activeTab === 'rejected-list' || activeTab === 'approval-history' || activeTab === 'workflow-settings') && (
                    <ApprovalsView 
                      projects={userAuthorizedProjects}
                      categories={categories}
                      expenses={expenses}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onAddLog={handleAddDbLog}
                      onNavigateToLogs={() => setActiveTab('logs')}
                    />
                  )}

                  {(activeTab === 'documents' || activeTab === 'project-documents' || activeTab === 'agreements' || activeTab === 'permissions' || activeTab === 'department-documents' || activeTab === 'call-sheets' || activeTab === 'dsr-files' || activeTab === 'bills-invoices' || activeTab === 'payment-proof' || activeTab === 'doc-reports') && (
                    <DocumentsView />
                  )}

                  {activeTab === 'reports' && (
                    <ReportsView 
                      projects={userAuthorizedProjects}
                      categories={categories}
                      expenses={expenses}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      activeProject={activeProject}
                    />
                  )}

                  {(activeTab === 'team-permissions' || activeTab === 'team-members' || activeTab === 'invite-members' || activeTab === 'departments' || activeTab === 'designations' || activeTab === 'permission-matrix' || activeTab === 'temporary-access' || activeTab === 'activity-log') && (
                    <TeamPermissionsView 
                      activeProject={activeProject}
                      activeCompany={activeCompany}
                      currentRole={currentRole}
                      userEmail={userEmail}
                    />
                  )}

                  {activeTab === 'categories' && (
                    <CategoryConfigView 
                      projects={userAuthorizedProjects}
                      categories={categories}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onUpdateCategories={handleUpdateCategories}
                      onAddLog={handleAddDbLog}
                      currentVersion={currentBudgetVersion}
                      lastApprovedVersion={lastApprovedBudgetVersion}
                      activeRoleName={currentRole}
                      onSendApproval={handleSendApproval}
                      onApproveRole={handleApproveRole}
                      onSendAllApprovals={() => handleSendApproval()}
                      onBackToBudget={() => setActiveTab('approved-budget')}
                    />
                  )}

                  {activeTab === 'cashier' && (
                    <CashierConsoleView 
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onAddLog={handleAddDbLog}
                      onNavigateToLogs={() => setActiveTab('logs')}
                    />
                  )}

                  {activeTab === 'reimbursement' && (
                    <ReimbursementView 
                      projects={userAuthorizedProjects}
                      categories={categories}
                      expenses={expenses}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      onSelectProject={setSelectedProjectId}
                      onAddExpense={handleAddExpense}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                      onAddLog={handleAddDbLog}
                    />
                  )}

                  {(activeTab === 'audit' || activeTab === 'complete-audit-log' || activeTab === 'financial-audit' || activeTab === 'data-change-history' || activeTab === 'user-activity' || activeTab === 'approval-audit' || activeTab === 'document-audit' || activeTab === 'download-audit-report') && (
                    <AuditView 
                      logs={dbLogs}
                      onClearLogs={() => setDbLogs([])}
                      onResetLogs={handleResetEntireDatabase}
                      expenses={expenses}
                      categories={categories}
                      projects={userAuthorizedProjects}
                      selectedProjectId={selectedProjectId || userAuthorizedProjects[0]?.id || ''}
                      activeSubTab={activeTab !== 'audit' ? activeTab : activeSubTab}
                      onNavigateSubTab={(sub) => {
                        setActiveSubTab(sub);
                      }}
                    />
                  )}

                  {activeTab === 'video-studio' && (
                    <AIVideoStudioView 
                      activeProject={activeProject}
                      initialImage={videoTransferImage}
                      initialPrompt={videoTransferPrompt}
                      onClearInitialImage={() => {
                        setVideoTransferImage(null);
                        setVideoTransferPrompt('');
                      }}
                    />
                  )}

                  {activeTab === 'image-studio' && (
                    <AIImageStudioView 
                      activeProject={activeProject}
                      onSendToVideo={(imageUrl, promptText) => {
                        setVideoTransferImage(imageUrl);
                        setVideoTransferPrompt(promptText ? `Cinematic atmospheric motion: ${promptText}` : 'Cinematic subtle camera push-in and atmospheric lighting');
                        setActiveTab('video-studio');
                      }}
                    />
                  )}

                  {activeTab === 'maps-location' && (
                    <AIMapsLocationView 
                      activeProject={activeProject}
                    />
                  )}

                  {activeTab === 'search-intelligence' && (
                    <AISearchIntelligenceView 
                      activeProject={activeProject}
                    />
                  )}

                  {(activeTab === 'profile' || activeTab === 'user-profile') && (
                    <UserProfileView 
                      userProfile={currentUserProfile}
                      userEmail={userEmail}
                      currentRole={currentRole}
                      userAuthorizedProjects={userAuthorizedProjects}
                      onSaveProfile={handleSaveUserProfile}
                      onLogout={handleLogout}
                      onNavigateToTab={(tab) => setActiveTab(tab as TabType)}
                    />
                  )}

                  {/* Fallback for all specialized project-type modules and unhandled sub-tabs */}
                  {![
                    'dashboard', 'workspace', 'project-control', 'project-setup', 'project-overview', 'creative-content',
                    'talent-contestants', 'crew-departments', 'studio-set', 'status', 'milestones', 'calendar', 'settings',
                    'overview', 'production', 'production-dsr', 'production-overview', 'schedule', 'units', 'crew-attendance',
                    'artist-attendance', 'equipment-usage', 'transport-usage', 'genset-fuel', 'vanity', 'food-count',
                    'timeline', 'ledger', 'budget', 'hierarchy', 'versions', 'dept-budget', 'approved-budget', 'committed-cost',
                    'budget-vs-actual', 'final-cost-report', 'expenses', 'all-expenses', 'book-expense', 'expense-drafts',
                    'pending-approval', 'approved-expenses', 'on-account', 'reimbursements', 'uncleared-advances', 'expense-reports',
                    'vendors', 'vendor-directory', 'vendor-creation', 'vendor-verification', 'quotations', 'rate-comparison',
                    'purchase-orders', 'work-orders', 'vendor-documents', 'payments', 'payment-requests', 'payment-approval',
                    'payment-register', 'payment-accounts', 'outstanding-payments', 'advance-adjustments', 'tds-tax', 'payment-reports',
                    'approvals', 'pending-approvals', 'my-approval-requests', 'approved-list', 'rejected-list', 'approval-history',
                    'workflow-settings', 'documents', 'project-documents', 'agreements', 'permissions', 'department-documents',
                    'call-sheets', 'dsr-files', 'bills-invoices', 'payment-proof', 'doc-reports', 'reports', 'team-permissions',
                    'team-members', 'invite-members', 'departments', 'designations', 'permission-matrix', 'temporary-access',
                    'activity-log', 'categories', 'cashier', 'reimbursement', 'audit', 'complete-audit-log', 'financial-audit',
                    'data-change-history', 'user-activity', 'approval-audit', 'document-audit', 'download-audit-report',
                    'resources', 'logs', 'roles', 'new-project', 'admin', 'profile', 'user-profile',
                    'video-studio', 'image-studio', 'maps-location', 'search-intelligence'
                  ].includes(activeTab) && !activeTab.startsWith('dept-') && (
                    <ProjectTypeModuleView 
                      moduleId={activeTab}
                      subTabId={activeSubTab}
                      project={activeProject}
                      onNavigate={(tab, sub) => {
                        setActiveTab(tab);
                        if (sub) setActiveSubTab(sub);
                      }}
                    />
                  )}
                </>
              )}

              {activeTab === 'resources' && (
                <ResourceMap />
              )}

              {activeTab === 'logs' && (
                <LogViewer 
                  logs={dbLogs}
                  onClearLogs={() => setDbLogs([])}
                  onResetLogs={handleResetEntireDatabase}
                />
              )}

              {activeTab === 'roles' && (
                <RoleBaseManager 
                  currentRole={currentRole}
                  onSelectRole={handleRoleChange}
                  onAddLog={handleAddDbLog}
                />
              )}

              {activeTab === 'new-project' && (
                <CreateProjectWizard 
                  onProjectCreated={handleProjectCreated}
                  onCancel={() => setActiveTab('workspace')}
                  userEmail={userEmail}
                />
              )}

              {activeTab === 'admin' && (
                <AdminView 
                  onAddLog={handleAddDbLog}
                  onPurgeDatabase={handleResetEntireDatabase}
                  unifiedProjects={unifiedProjects}
                  companies={companies}
                  userEmail={userEmail}
                  dbLogs={dbLogs}
                  onSelectProject={(projId) => {
                    setSelectedProjectId(projId);
                    setActiveTab('dashboard');
                  }}
                  onDeleteProject={async (deletedId) => {
                    const cleanId = deletedId.startsWith('wp_') ? deletedId.substring(3) : (deletedId.startsWith('p_') ? deletedId.substring(2) : deletedId);
                    await deleteDocData('projects', `p_${cleanId}`);
                    await deleteDocData('workspace_projects', `wp_${cleanId}`);
                    setProjects(prev => prev.filter(p => p.id !== deletedId && p.id !== `p_${cleanId}` && p.id !== `wp_${cleanId}`));
                    setWorkspaceProjects(prev => prev.filter(p => p.id !== deletedId && p.id !== `wp_${cleanId}` && p.id !== `p_${cleanId}`));
                  }}
                />
              )}
            </>
          )}

        </div>

        {/* Footer System info */}
        <footer className="bg-white border-t border-[#E2E8F0] px-6 py-4 text-center text-[10px] text-[#45464d] font-mono mt-auto flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10">
          <span>&copy; 2026 Production Budget ERP. Firebase Firestore Real-Time Cloud Synchronization.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#191c1e]">
              <Sparkles className="w-3.5 h-3.5 text-[#0058be] animate-spin" style={{ animationDuration: '6s' }} />
              Firebase Firestore Real-Time Synchronizer Active
            </span>
            <span className="text-[#eceef0]">|</span>
            <span>Cloud Project: Active</span>
          </div>
        </footer>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        userProfile={currentUserProfile}
        userEmail={userEmail}
        onSaveProfile={handleSaveUserProfile}
      />

      {/* Floating Toast Alert Banner */}
      {assignmentToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-lg p-4 rounded-xl bg-slate-900 border border-emerald-500/50 text-slate-100 shadow-2xl flex items-start gap-3 animate-slide-up">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">Assignment Live Sync</h4>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">{assignmentToast}</p>
          </div>
          <button 
            onClick={() => setAssignmentToast(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
