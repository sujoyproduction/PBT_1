import React, { useState, useMemo, useEffect } from 'react';
import { isProjectAdminRole } from '../data';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  UserX,
  Sliders,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  X,
  ShieldAlert,
  Key,
  Lock,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Send,
  RotateCcw,
  RefreshCw,
  Check,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Award,
  Activity,
  Download,
  Info
} from 'lucide-react';
import { Project, UserAssignmentNotification } from '../types';
import { Company } from './WorkspaceView';
import { AppRole, APP_ROLES_CATALOG } from './RoleBaseManager';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  projectRole: string;
  accessLevel: 'Full Admin' | 'Approver' | 'Editor' | 'Contributor' | 'Viewer' | 'Auditor';
  assignedModules: string[];
  status: 'Active' | 'Pending' | 'Suspended' | 'Removed' | 'Access Expired';
  lastActive: string;
  assignedBy: string;
  joinedAt: string;
  accessStartDate: string;
  accessEndDate?: string;
  photoUrl?: string;
  pendingTasksCount?: number;
  expensesCreatedCount?: number;
  paymentsApprovedCount?: number;
}

export interface CustomRoleDef {
  id: string;
  roleName: string;
  roleCode: string;
  description: string;
  roleScope: 'Company' | 'Project';
  accessLevel: string;
  baseRole?: string;
  departmentScope: 'All' | 'Selected' | 'Own Assigned';
  departmentIds?: string[];
  categoryScope: 'All' | 'Selected' | 'Department Categories Only';
  categoryIds?: string[];
  financialVisibility: 'View Full Amount' | 'View Own Department Amount' | 'View Assigned Category Amount' | 'View Summary Only' | 'Hide Financial Amount';
  recordViewScope: string;
  recordEditScope: string;
  approvalScope: string;
  approvalLimit?: number;
  isSystemRole: boolean;
  isActive: boolean;
  assignedMembersCount: number;
  createdBy: string;
  createdAt: string;
  permissions: Record<string, 'ALLOW' | 'DENY' | 'NOT_SET'>;
}

export interface MemberInvitation {
  id: string;
  email: string;
  phone: string;
  name: string;
  designation: string;
  department: string;
  projectRole: string;
  accessType: 'Full Access' | 'Custom Access' | 'View Only';
  accessStartDate: string;
  accessEndDate?: string;
  invitationMessage?: string;
  status: 'Draft' | 'Pending' | 'Sent' | 'Opened' | 'Accepted' | 'Rejected' | 'Expired' | 'Cancelled';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface AccessRequestTicket {
  id: string;
  requestedBy: string;
  userEmail: string;
  requestedRoleOrPermission: string;
  moduleName: string;
  reason: string;
  requiredUntil?: string;
  status: 'Pending' | 'Approved' | 'Temporarily Approved' | 'Rejected';
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface TeamActivityLog {
  id: string;
  performedBy: string;
  targetUser?: string;
  actionType: string;
  roleIdOrName?: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

const DEFAULT_DEPARTMENTS = [
  'Production',
  'Direction',
  'Camera',
  'Art',
  'Costume',
  'Makeup',
  'Hair',
  'Sound',
  'Light',
  'Grip',
  'Location',
  'Transport',
  'Accounts',
  'Commercial',
  'Post-Production',
  'Marketing',
  'Legal',
  'Audit'
];

const MODULE_LIST = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'budget', label: 'Budget' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'payments', label: 'Payments' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'documents', label: 'Documents' },
  { key: 'reports', label: 'Reports' },
  { key: 'team', label: 'Team & Permissions' },
  { key: 'settings', label: 'Project Settings' }
];

const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' }
];

const INITIAL_MEMBERS: TeamMember[] = [];
const INITIAL_CUSTOM_ROLES: CustomRoleDef[] = [];
const INITIAL_INVITATIONS: MemberInvitation[] = [];
const INITIAL_ACCESS_REQUESTS: AccessRequestTicket[] = [];
const INITIAL_ACTIVITY_LOGS: TeamActivityLog[] = [];

interface TeamPermissionsViewProps {
  activeProject?: Project;
  activeCompany?: Company;
  currentRole: AppRole;
  userEmail: string;
}

export default function TeamPermissionsView({
  activeProject,
  activeCompany,
  currentRole,
  userEmail
}: TeamPermissionsViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'matrix' | 'invitations' | 'requests' | 'logs'>('members');

  // Master Data State (Synced with Firestore Server)
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [customRoles, setCustomRoles] = useState<CustomRoleDef[]>(INITIAL_CUSTOM_ROLES);
  const [invitations, setInvitations] = useState<MemberInvitation[]>(INITIAL_INVITATIONS);
  const [accessRequests, setAccessRequests] = useState<AccessRequestTicket[]>(INITIAL_ACCESS_REQUESTS);
  const [activityLogs, setActivityLogs] = useState<TeamActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Subscribe to Team Permissions Data from Firestore Server
  useEffect(() => {
    const unsub = subscribeDoc<any>('settings', 'team_permissions', (data) => {
      if (data) {
        if (Array.isArray(data.members)) setMembers(data.members);
        if (Array.isArray(data.customRoles)) setCustomRoles(data.customRoles);
        if (Array.isArray(data.invitations)) setInvitations(data.invitations);
        if (Array.isArray(data.accessRequests)) setAccessRequests(data.accessRequests);
        if (Array.isArray(data.activityLogs)) setActivityLogs(data.activityLogs);
      }
    });
    return () => unsub();
  }, []);

  // Save Persistence to Firestore Server
  const saveMembers = (data: TeamMember[]) => {
    setMembers(data);
    saveDocData('settings', 'team_permissions', { members: data });
  };

  const saveCustomRoles = (data: CustomRoleDef[]) => {
    setCustomRoles(data);
    saveDocData('settings', 'team_permissions', { customRoles: data });
  };

  const saveInvitations = (data: MemberInvitation[]) => {
    setInvitations(data);
    saveDocData('settings', 'team_permissions', { invitations: data });
  };

  const saveAccessRequests = (data: AccessRequestTicket[]) => {
    setAccessRequests(data);
    saveDocData('settings', 'team_permissions', { accessRequests: data });
  };

  const addActivityLog = (actionType: string, details: string, targetUser?: string, roleIdOrName?: string) => {
    const newLog: TeamActivityLog = {
      id: `tlog_${Date.now()}`,
      performedBy: userEmail || 'Current User',
      targetUser,
      actionType,
      roleIdOrName,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: '103.21.124.5'
    };
    const updated = [newLog, ...activityLogs];
    setActivityLogs(updated);
    saveDocData('settings', 'team_permissions', { activityLogs: updated });
  };

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawer States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isOwnershipModalOpen, setIsOwnershipModalOpen] = useState(false);
  const [selectedMemberForDrawer, setSelectedMemberForDrawer] = useState<TeamMember | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('Production');
  const [inviteRole, setInviteRole] = useState('Production Manager');
  const [inviteAccessType, setInviteAccessType] = useState<'Full Access' | 'Custom Access' | 'View Only'>('Custom Access');
  const [inviteStartDate, setInviteStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [inviteEndDate, setInviteEndDate] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Role Creation Wizard State
  const [newRoleStep, setNewRoleStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleScope, setRoleScope] = useState<'Company' | 'Project'>('Project');
  const [baseRole, setBaseRole] = useState('Production Manager');
  const [roleAccessLevel, setRoleAccessLevel] = useState('Approver');
  const [roleDeptScope, setRoleDeptScope] = useState<'All' | 'Selected' | 'Own Assigned'>('Selected');
  const [roleSelectedDepts, setRoleSelectedDepts] = useState<string[]>(['Art']);
  const [roleFinVisibility, setRoleFinVisibility] = useState<'View Full Amount' | 'View Own Department Amount' | 'View Assigned Category Amount' | 'View Summary Only' | 'Hide Financial Amount'>('View Own Department Amount');
  const [roleApprovalLimit, setRoleApprovalLimit] = useState<number>(200000);
  const [rolePermissions, setRolePermissions] = useState<Record<string, 'ALLOW' | 'DENY' | 'NOT_SET'>>({
    'budget.view': 'ALLOW',
    'expense.view': 'ALLOW',
    'expense.create': 'ALLOW',
    'expense.edit': 'ALLOW',
    'expense.approve': 'ALLOW'
  });



  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q) || m.department.toLowerCase().includes(q) || m.projectRole.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || m.projectRole === roleFilter;
      const matchesDept = departmentFilter === 'ALL' || m.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, departmentFilter, statusFilter]);

  // Handle Send Invitation
  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail && !invitePhone) {
      alert('Please enter an Email Address or Mobile Number.');
      return;
    }

    const newInv: MemberInvitation = {
      id: `inv_${Date.now()}`,
      email: inviteEmail,
      phone: invitePhone,
      name: inviteName || inviteEmail.split('@')[0],
      designation: inviteDesignation || 'Team Member',
      department: inviteDepartment,
      projectRole: inviteRole,
      accessType: inviteAccessType,
      accessStartDate: inviteStartDate,
      accessEndDate: inviteEndDate || undefined,
      invitationMessage: inviteMessage,
      status: 'Sent',
      invitedBy: userEmail || 'Project Admin',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
    };

    saveInvitations([newInv, ...invitations]);

    // Add corresponding pending member
    const newMember: TeamMember = {
      id: `mem_${Date.now()}`,
      name: newInv.name,
      email: newInv.email || 'pending@user.com',
      phone: newInv.phone || '',
      designation: newInv.designation,
      department: newInv.department,
      projectRole: newInv.projectRole,
      accessLevel: newInv.accessType === 'Full Access' ? 'Full Admin' : newInv.accessType === 'View Only' ? 'Viewer' : 'Editor',
      assignedModules: ['Dashboard', 'Expenses', 'Budget'],
      status: 'Pending',
      lastActive: 'Never',
      assignedBy: userEmail || 'Project Admin',
      joinedAt: new Date().toISOString().split('T')[0],
      accessStartDate: newInv.accessStartDate,
      accessEndDate: newInv.accessEndDate
    };

    saveMembers([...members, newMember]);
    addActivityLog('MEMBER_INVITED', `Invited ${newInv.name} (${newInv.email}) as ${newInv.projectRole}`, newInv.name, newInv.projectRole);

    // Create real-time user assignment notification for header bell notification (deterministic ID ensures single request per receiver/role)
    if (newInv.email) {
      const cleanTargetEmail = newInv.email.trim().toLowerCase();
      const cleanRoleKey = (newInv.projectRole || 'Member').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanEmailKey = cleanTargetEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const targetProjId = activeProject?.id || 'p_default';
      const asgnId = `asgn_${targetProjId}_${cleanEmailKey}_${cleanRoleKey}`;
      const newAssignment: UserAssignmentNotification = {
        id: asgnId,
        assignedEmail: cleanTargetEmail,
        assignedName: newInv.name,
        assignedRole: newInv.projectRole,
        department: newInv.department,
        accessType: newInv.accessType,
        projectId: targetProjId,
        projectName: activeProject?.name || 'Main Production Film',
        projectDescription: activeProject?.description || '',
        totalBudget: activeProject?.totalBudget || 0,
        companyId: activeCompany?.id || activeProject?.companyId || 'comp_default',
        companyName: activeCompany?.name || activeProject?.companyName || 'Follow Focus Films',
        companyGstin: activeCompany?.gstNumber || '19AABCF1234F1Z5',
        companyAddress: activeCompany?.address || 'Corporate Office',
        assignedBy: userEmail || 'Project Admin',
        createdAt: new Date().toISOString(),
        status: 'Pending'
      };
      saveDocData('user_assignments', asgnId, newAssignment);
    }

    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInvitePhone('');
    setInviteName('');
    setInviteMessage('');
    alert(`Invitation sent to ${newInv.email || newInv.phone}! Token valid for 7 days.`);
  };

  // Handle Save Custom Role
  const handleSaveCustomRole = () => {
    if (!roleName) {
      alert('Please enter a Role Name.');
      return;
    }

    const generatedCode = roleCode || roleName.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const newRole: CustomRoleDef = {
      id: `crole_${Date.now()}`,
      roleName,
      roleCode: generatedCode,
      description: roleDescription || 'Custom project role',
      roleScope,
      accessLevel: roleAccessLevel,
      baseRole,
      departmentScope: roleDeptScope,
      departmentIds: roleSelectedDepts,
      categoryScope: 'Selected',
      financialVisibility: roleFinVisibility,
      recordViewScope: 'Department',
      recordEditScope: 'Department',
      approvalScope: 'Amount-Based',
      approvalLimit: roleApprovalLimit,
      isSystemRole: false,
      isActive: true,
      assignedMembersCount: 0,
      createdBy: userEmail || 'Project Admin',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: rolePermissions
    };

    saveCustomRoles([...customRoles, newRole]);
    addActivityLog('CUSTOM_ROLE_CREATED', `Created custom role "${newRole.roleName}" (${newRole.roleCode})`, undefined, newRole.roleName);

    setIsCreateRoleModalOpen(false);
    setRoleName('');
    setRoleCode('');
    setRoleDescription('');
    setNewRoleStep(1);
    alert(`Custom Role "${newRole.roleName}" created successfully!`);
  };

  // Member Action Handlers
  const handleSuspendMember = (member: TeamMember) => {
    if (member.projectRole === 'Project Owner') {
      alert('Cannot suspend Project Owner. Ownership must be transferred first.');
      return;
    }
    const updated = members.map(m => m.id === member.id ? { ...m, status: (m.status === 'Suspended' ? 'Active' : 'Suspended') as any } : m);
    saveMembers(updated);
    addActivityLog(member.status === 'Suspended' ? 'MEMBER_ACTIVATED' : 'MEMBER_SUSPENDED', `${member.status === 'Suspended' ? 'Activated' : 'Suspended'} team member ${member.name}`, member.name, member.projectRole);
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.projectRole === 'Project Owner') {
      return;
    }
    const updated = members.filter(m => m.id !== member.id);
    saveMembers(updated);
    addActivityLog('MEMBER_REMOVED', `Removed team member ${member.name} from project`, member.name, member.projectRole);
    if (selectedMemberForDrawer?.id === member.id) setSelectedMemberForDrawer(null);
  };

  // Stats Counters
  const totalMembersCount = members.length;
  const activeMembersCount = members.filter(m => m.status === 'Active').length;
  const pendingInvitationsCount = invitations.filter(i => i.status === 'Pending' || i.status === 'Sent').length;
  const suspendedCount = members.filter(m => m.status === 'Suspended').length;
  const projectAdminsCount = members.filter(m => m.accessLevel === 'Full Admin').length;
  const customRolesCount = customRoles.length;

  return (
    <div className="flex flex-col gap-4 font-sans pb-12 text-slate-100">
      
      {/* Top Company & Project Context Header */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              Company: <span className="text-white font-bold">{activeCompany?.name || 'Follow Focus Films'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Project: <span className="text-white font-bold">{activeProject?.name || 'Mahisasur Mardini'}</span>
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            TEAM & PERMISSION MANAGEMENT
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isProjectAdminRole(currentRole)) {
                alert("Access Denied: Only a Project Admin or Project Owner can transfer project ownership.");
                return;
              }
              setIsOwnershipModalOpen(true);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" /> Transfer Ownership
          </button>
          <button
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-700 text-indigo-300 hover:bg-indigo-900/60 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> + Create Custom Role
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Invite Member
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">{totalMembersCount}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-emerald-400">{activeMembersCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Invitations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-400">{pendingInvitationsCount}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suspended</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-400">{suspendedCount}</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Admins</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-indigo-400">{projectAdminsCount}</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Roles</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-400">{customRolesCount}</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name, email, phone, role or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Roles</option>
              <option value="Project Owner" className="bg-slate-800 text-white">Project Owner</option>
              <option value="Executive Producer" className="bg-slate-800 text-white">Executive Producer</option>
              <option value="Production Manager" className="bg-slate-800 text-white">Production Manager</option>
              <option value="Accountant" className="bg-slate-800 text-white">Accountant</option>
              <option value="Art Expense Approver" className="bg-slate-800 text-white">Art Expense Approver</option>
              <option value="Auditor" className="bg-slate-800 text-white">Auditor</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Departments</option>
              {DEFAULT_DEPARTMENTS.map(d => (
                <option key={d} value={d} className="bg-slate-800 text-white">{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All Statuses</option>
              <option value="Active" className="bg-slate-800 text-white">Active</option>
              <option value="Pending" className="bg-slate-800 text-white">Pending</option>
              <option value="Suspended" className="bg-slate-800 text-white">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Team Members ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'roles'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Roles ({APP_ROLES_CATALOG.length + customRoles.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'invitations'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Invitations ({invitations.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'requests'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Access Requests ({accessRequests.filter(r => r.status === 'Pending').length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Activity Log
        </button>
      </div>

      {/* TAB 1: TEAM MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">User</th>
                  <th className="py-2.5 px-3.5">Project Role</th>
                  <th className="py-2.5 px-3.5">Department</th>
                  <th className="py-2.5 px-3.5">Access Level</th>
                  <th className="py-2.5 px-3.5">Assigned Modules</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Last Active</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <button
                            onClick={() => setSelectedMemberForDrawer(member)}
                            className="font-bold text-slate-100 hover:text-blue-400 transition-colors text-left cursor-pointer"
                          >
                            {member.name}
                          </button>
                          <span className="text-[10px] text-slate-400">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className="font-semibold text-slate-200 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {member.projectRole}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className="font-medium text-slate-300">{member.department}</span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        member.accessLevel === 'Full Admin'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                          : member.accessLevel === 'Approver'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                          : member.accessLevel === 'Editor'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {member.accessLevel}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {member.assignedModules.slice(0, 3).map((mod, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                            {mod}
                          </span>
                        ))}
                        {member.assignedModules.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{member.assignedModules.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.status === 'Active'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : member.status === 'Pending'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-emerald-400' : member.status === 'Pending' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {member.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-slate-400 text-[10px]">
                      {member.lastActive}
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedMemberForDrawer(member)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="View Profile & Access"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSuspendMember(member)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            member.status === 'Suspended' ? 'text-emerald-400 hover:bg-emerald-950/50' : 'text-amber-400 hover:bg-amber-950/50'
                          }`}
                          title={member.status === 'Suspended' ? 'Activate Member' : 'Suspend Member'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="p-1 text-rose-400 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                          title="Remove Member"
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

      {/* TAB 2: ROLES & CUSTOM ROLES */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-6">
          {/* Custom Roles Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Custom Project Roles ({customRoles.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Manually created roles with department, category & approval limit restrictions.
                </p>
              </div>

              <button
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Create Custom Role
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customRoles.map((role) => (
                <div key={role.id} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{role.roleName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                        {role.roleCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <div><span className="font-bold text-slate-800">Scope:</span> {role.roleScope}</div>
                    <div><span className="font-bold text-slate-800">Access:</span> {role.accessLevel}</div>
                    <div><span className="font-bold text-slate-800">Approval Limit:</span> ₹{role.approvalLimit?.toLocaleString()}</div>
                    <div><span className="font-bold text-slate-800">Members:</span> {role.assignedMembersCount} assigned</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <span className="text-[10px] text-slate-400">Created by {role.createdBy} on {role.createdAt}</span>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Edit</button>
                      <button className="text-xs font-bold text-slate-500 hover:underline cursor-pointer">Duplicate</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Predefined Roles Catalog */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col gap-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                System Predefined Roles ({APP_ROLES_CATALOG.length})
              </h3>
              <p className="text-xs text-slate-500">
                Core system roles with standardized access clearances across all project modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {APP_ROLES_CATALOG.map((sysRole) => (
                <div key={sysRole.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{sysRole.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sysRole.badgeBg} ${sysRole.badgeText}`}>
                        {sysRole.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mb-2">{sysRole.clearance}</span>
                    <p className="text-xs text-slate-600">{sysRole.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{sysRole.allowedTabs.length} Modules Permitted</span>
                    <span className="text-[#0058be] font-bold">System Protected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Module-Wise Permission Matrix</h3>
              <p className="text-xs text-slate-500">Configure exact granular action rights per module for selected roles.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold">Legend:</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                <Check className="w-3.5 h-3.5" /> Allowed
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                <X className="w-3.5 h-3.5" /> Denied
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                  <th className="py-3 px-4">Module Name</th>
                  {PERMISSION_ACTIONS.map(act => (
                    <th key={act.key} className="py-3 px-4 text-center">{act.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {MODULE_LIST.map((mod) => (
                  <tr key={mod.key} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{mod.label}</td>
                    {PERMISSION_ACTIONS.map(act => {
                      const isAllowed = mod.key !== 'team' || act.key === 'view';
                      return (
                        <td key={act.key} className="py-3.5 px-4 text-center">
                          <button
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                              isAllowed
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Project Invitations Queue</h3>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-2 bg-[#0058be] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> + Invite Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Role & Dept</th>
                  <th className="py-3.5 px-4">Access Type</th>
                  <th className="py-3.5 px-4">Sent Date</th>
                  <th className="py-3.5 px-4">Expires At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{inv.name}</span>
                        <span className="text-[11px] text-slate-500">{inv.email || inv.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{inv.projectRole}</span>
                      <span className="text-slate-400 block text-[11px]">{inv.department}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-indigo-700">{inv.accessType}</td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{inv.createdAt}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">{inv.expiresAt}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Resend</button>
                        <button className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ACCESS REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Access Upgrade Requests</h3>
            <p className="text-xs text-slate-500">Review requests from team members for temporary or elevated permissions.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {accessRequests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{req.requestedBy}</span>
                    <span className="text-xs text-slate-400">({req.userEmail})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700">Requested: {req.requestedRoleOrPermission}</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">{req.reason}</p>
                </div>

                {req.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const updated = accessRequests.map(r => r.id === req.id ? { ...r, status: 'Approved' as any } : r);
                        saveAccessRequests(updated);
                        alert('Request approved!');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const updated = accessRequests.map(r => r.id === req.id ? { ...r, status: 'Rejected' as any } : r);
                        saveAccessRequests(updated);
                        alert('Request rejected.');
                      }}
                      className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY LOG */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Team & Permission Audit Trail</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.performedBy}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{log.targetUser || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{log.details}</td>
                    <td className="py-3 px-4 text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: INVITE MEMBER */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0058be]" /> Invite Team Member
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="flex flex-col gap-4 text-xs font-medium text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-800">Email Address *</label>
                <input
                  type="email"
                  placeholder="enter.email@domain.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98300 00000"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Department *</label>
                  <select
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold"
                  >
                    {DEFAULT_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Project Role *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold"
                  >
                    <option value="Production Manager">Production Manager</option>
                    <option value="Executive Producer">Executive Producer</option>
                    <option value="Line Producer">Line Producer</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Art Expense Approver">Art Expense Approver</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-800">Access Clearance Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Full Access', 'Custom Access', 'View Only'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setInviteAccessType(type)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        inviteAccessType === type
                          ? 'bg-[#0058be] text-white border-[#0058be]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Access Start Date</label>
                  <input
                    type="date"
                    value={inviteStartDate}
                    onChange={(e) => setInviteStartDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Access End Date (Optional)</label>
                  <input
                    type="date"
                    value={inviteEndDate}
                    onChange={(e) => setInviteEndDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-800">Invitation Note</label>
                <textarea
                  rows={2}
                  placeholder="Optional invitation note..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0058be] text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL ROLE CREATION SYSTEM */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" /> Manual Role Creation Wizard
                </h3>
                <span className="text-xs text-slate-500 font-semibold">Step {newRoleStep} of 5</span>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps Content */}
            {newRoleStep === 1 && (
              <div className="flex flex-col gap-4 text-xs font-medium text-slate-700">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Role Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Art Department Expense Approver"
                    value={roleName}
                    onChange={(e) => {
                      setRoleName(e.target.value);
                      setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                    }}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-800">Role Code</label>
                    <input
                      type="text"
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-800">Role Scope *</label>
                    <select
                      value={roleScope}
                      onChange={(e) => setRoleScope(e.target.value as any)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Project">Project Level Only</option>
                      <option value="Company">Company Multi-Project Level</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe responsibilities and limits of this role..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-800">Base Role Template</label>
                    <select
                      value={baseRole}
                      onChange={(e) => setBaseRole(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Production Manager">Production Manager</option>
                      <option value="Executive Producer">Executive Producer</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Department Head">Department Head</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-800">General Access Level</label>
                    <select
                      value={roleAccessLevel}
                      onChange={(e) => setRoleAccessLevel(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Admin">Full Admin</option>
                      <option value="Approver">Approver</option>
                      <option value="Editor">Editor</option>
                      <option value="Contributor">Contributor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {newRoleStep === 2 && (
              <div className="flex flex-col gap-4 text-xs font-medium text-slate-700">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Department & Category Scope Restrictions</h4>
                
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-800">Department Access Rule</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['All', 'Selected', 'Own Assigned'] as const).map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRoleDeptScope(s)}
                        className={`p-2.5 rounded-xl border font-bold text-xs cursor-pointer ${
                          roleDeptScope === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {s} Departments
                      </button>
                    ))}
                  </div>
                </div>

                {roleDeptScope === 'Selected' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-slate-800">Select Permitted Departments:</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                      {DEFAULT_DEPARTMENTS.map(d => (
                        <label key={d} className="flex items-center gap-2 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={roleSelectedDepts.includes(d)}
                            onChange={(e) => {
                              if (e.target.checked) setRoleSelectedDepts([...roleSelectedDepts, d]);
                              else setRoleSelectedDepts(roleSelectedDepts.filter(item => item !== d));
                            }}
                          />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {newRoleStep === 3 && (
              <div className="flex flex-col gap-3 text-xs font-medium text-slate-700">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Module Action Rights</h4>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {MODULE_LIST.map((mod) => (
                    <div key={mod.key} className="py-2.5 flex items-center justify-between">
                      <span className="font-bold text-slate-900">{mod.label}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePermissions[`${mod.key}.view`] === 'ALLOW'}
                            onChange={(e) => {
                              setRolePermissions({
                                ...rolePermissions,
                                [`${mod.key}.view`]: e.target.checked ? 'ALLOW' : 'DENY'
                              });
                            }}
                          />
                          View
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePermissions[`${mod.key}.create`] === 'ALLOW'}
                            onChange={(e) => {
                              setRolePermissions({
                                ...rolePermissions,
                                [`${mod.key}.create`]: e.target.checked ? 'ALLOW' : 'DENY'
                              });
                            }}
                          />
                          Create
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rolePermissions[`${mod.key}.approve`] === 'ALLOW'}
                            onChange={(e) => {
                              setRolePermissions({
                                ...rolePermissions,
                                [`${mod.key}.approve`]: e.target.checked ? 'ALLOW' : 'DENY'
                              });
                            }}
                          />
                          Approve
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newRoleStep === 4 && (
              <div className="flex flex-col gap-4 text-xs font-medium text-slate-700">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Financial Visibility & Approval Limits</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Financial Visibility Access</label>
                  <select
                    value={roleFinVisibility}
                    onChange={(e) => setRoleFinVisibility(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    <option value="View Full Amount">View Full Amount</option>
                    <option value="View Own Department Amount">View Own Department Amount Only</option>
                    <option value="View Assigned Category Amount">View Assigned Category Amount Only</option>
                    <option value="View Summary Only">View Summary Totals Only</option>
                    <option value="Hide Financial Amount">Hide All Financial Amounts</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-800">Maximum Approval Limit (₹)</label>
                  <input
                    type="number"
                    value={roleApprovalLimit}
                    onChange={(e) => setRoleApprovalLimit(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Transactions exceeding ₹{roleApprovalLimit.toLocaleString()} require higher executive escalation.</span>
                </div>
              </div>
            )}

            {newRoleStep === 5 && (
              <div className="flex flex-col gap-3 text-xs font-medium text-slate-700">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Custom Role Summary Preview</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                  <div className="flex justify-between font-bold text-sm text-slate-900">
                    <span>{roleName || 'Untitled Role'}</span>
                    <span className="text-indigo-600 font-mono">{roleCode}</span>
                  </div>
                  <p className="text-slate-600">{roleDescription || 'No description provided.'}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-800">
                    <div><strong>Department Scope:</strong> {roleDeptScope}</div>
                    <div><strong>Financial Visibility:</strong> {roleFinVisibility}</div>
                    <div><strong>Approval Ceiling:</strong> ₹{roleApprovalLimit.toLocaleString()}</div>
                    <div><strong>Access Clearance:</strong> {roleAccessLevel}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={newRoleStep === 1}
                onClick={() => setNewRoleStep((newRoleStep - 1) as any)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Back
              </button>

              {newRoleStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setNewRoleStep((newRoleStep + 1) as any)}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveCustomRole}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Role & Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MEMBER PROFILE SIDE DRAWER */}
      {selectedMemberForDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Member Access Drawer</h3>
                <button
                  onClick={() => setSelectedMemberForDrawer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0058be] font-black text-xl flex items-center justify-center border-2 border-blue-200">
                  {selectedMemberForDrawer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="flex flex-col">
                  <h4 className="text-lg font-black text-slate-900">{selectedMemberForDrawer.name}</h4>
                  <span className="text-xs text-slate-500 font-semibold">{selectedMemberForDrawer.designation}</span>
                  <span className="text-xs font-mono text-slate-400">{selectedMemberForDrawer.email}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Project Role:</span>
                  <span className="font-black text-slate-900">{selectedMemberForDrawer.projectRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Department:</span>
                  <span className="font-black text-slate-900">{selectedMemberForDrawer.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Access Level:</span>
                  <span className="font-black text-indigo-600">{selectedMemberForDrawer.accessLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedMemberForDrawer.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Joined At:</span>
                  <span className="font-medium text-slate-700">{selectedMemberForDrawer.joinedAt}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Permitted Modules</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMemberForDrawer.assignedModules.map((m, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-100">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Activity Metrics</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-500 block">Expenses Booked</span>
                    <span className="text-lg font-black text-slate-900">{selectedMemberForDrawer.expensesCreatedCount || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <span className="text-slate-500 block">Payments Approved</span>
                    <span className="text-lg font-black text-slate-900">{selectedMemberForDrawer.paymentsApprovedCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleSuspendMember(selectedMemberForDrawer)}
                className="w-full py-2.5 bg-amber-50 text-amber-800 font-bold text-xs rounded-xl hover:bg-amber-100 cursor-pointer border border-amber-200"
              >
                {selectedMemberForDrawer.status === 'Suspended' ? 'Re-Activate Member' : 'Suspend Member Access'}
              </button>
              <button
                onClick={() => handleRemoveMember(selectedMemberForDrawer)}
                className="w-full py-2.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 cursor-pointer border border-rose-200"
              >
                Remove From Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OWNERSHIP TRANSFER */}
      {isOwnershipModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" /> Transfer Project Ownership
              </h3>
              <button
                onClick={() => setIsOwnershipModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Transferring ownership gives full project admin authority to the selected member. You will become Executive Producer.
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs font-medium text-slate-700">
              <div>
                <span className="font-bold text-slate-800 block">Current Project Owner:</span>
                <span className="font-bold text-slate-900">Sujay Kotal ({userEmail})</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-800">Select New Project Owner *</label>
                <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer">
                  {members.filter(m => m.projectRole !== 'Project Owner').map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.projectRole} - {m.department})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-800">Reason for Transfer</label>
                <textarea rows={2} placeholder="Reason for ownership transfer..." className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsOwnershipModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!isProjectAdminRole(currentRole)) {
                    alert("Access Denied: Only a Project Admin or Project Owner can transfer project ownership.");
                    setIsOwnershipModalOpen(false);
                    return;
                  }
                  alert('Ownership Transfer OTP sent to your registered email. Verification required.');
                  setIsOwnershipModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 cursor-pointer shadow-xs"
              >
                Send OTP & Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
