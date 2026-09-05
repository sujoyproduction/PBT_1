import React, { useState, useEffect } from 'react';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import { 
  ShieldCheck, 
  Users, 
  CheckSquare, 
  Lock, 
  Unlock, 
  Sliders, 
  Briefcase, 
  UserCheck, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Save, 
  RotateCcw, 
  Eye, 
  Film, 
  Star, 
  Scale, 
  Clipboard, 
  FileText, 
  CreditCard, 
  Wrench, 
  Check, 
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { DBLog } from '../types';

export type AppRole = 
  | 'Producer' 
  | 'Executive Producer' 
  | 'Creative Producer' 
  | 'Commercial Head' 
  | 'Line Producer' 
  | 'Production Manager' 
  | 'Direction Team' 
  | 'Accounts Team' 
  | 'Admin';

export interface AppRoleConfig {
  id: AppRole;
  title: string;
  category: 'Executive' | 'Management' | 'Operations' | 'Specialized';
  clearance: string;
  description: string;
  allowedTabs: string[];
  permissionsCount: number;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const APP_ROLES_CATALOG: AppRoleConfig[] = [
  {
    id: 'Producer',
    title: 'Producer',
    category: 'Executive',
    clearance: 'Level 10 - Full Unrestricted Access',
    description: 'Project owner and ultimate financial & operational authority across all departments and database pipelines.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'emerald',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800'
  },
  {
    id: 'Executive Producer',
    title: 'Executive Producer',
    category: 'Executive',
    clearance: 'Level 9 - Executive Oversight',
    description: 'Strategic and financial supervisor. Full access to budgets, approvals, timeline, and reporting modules.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'blue',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-800'
  },
  {
    id: 'Creative Producer',
    title: 'Creative Producer',
    category: 'Executive',
    clearance: 'Level 8 - Creative & Editorial Control',
    description: 'Manages artistic vision, scripts, scene breakdown, scheduling, and creative approvals.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'purple',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800'
  },
  {
    id: 'Commercial Head',
    title: 'Commercial Head',
    category: 'Management',
    clearance: 'Level 8 - Commercial & Financial Audit',
    description: 'Commercial verification, vendor contracts, petty cash audits, category configurations, and financial ledgers.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'amber',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800'
  },
  {
    id: 'Line Producer',
    title: 'Line Producer',
    category: 'Operations',
    clearance: 'Level 7 - On-Ground Field Execution',
    description: 'Controls day-to-day production logistics, call sheets, DPR, on-ground vendors, and team disbursements.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'indigo',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-800'
  },
  {
    id: 'Production Manager',
    title: 'Production Manager',
    category: 'Operations',
    clearance: 'Level 6 - Field Site Operations',
    description: 'Field management of schedules, petty cash distributions, reimbursement claims, and resource tracking.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'teal',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-800'
  },
  {
    id: 'Direction Team',
    title: 'Direction Team',
    category: 'Specialized',
    clearance: 'Level 5 - Creative Staging Access',
    description: 'Script management, timeline scheduling, scene breakdown, and creative revision workflows.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'rose',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-800'
  },
  {
    id: 'Accounts Team',
    title: 'Accounts Team',
    category: 'Management',
    clearance: 'Level 7 - Fiscal Processing & Ledger',
    description: 'Processing expenses, cashier distributions, reimbursements, category ledgers, and transaction audit logs.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'cyan',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-800'
  },
  {
    id: 'Admin',
    title: 'Admin',
    category: 'Executive',
    clearance: 'Level 10 - System & Policy Administrator',
    description: 'Global system configuration, user role assignments, audit log clearing, and database restoration.',
    allowedTabs: ['workspace', 'dashboard', 'production-dsr', 'timeline', 'ledger', 'expenses', 'vendors', 'payments', 'approvals', 'documents', 'reports', 'categories', 'cashier', 'reimbursement', 'team-permissions', 'logs', 'resources', 'admin', 'new-project'],
    permissionsCount: 19,
    color: 'slate',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-900'
  }
];

export const ALL_MODULE_DEFS = [
  { key: 'workspace', name: 'Workspace', desc: 'Organization Projects & Workspace Overview' },
  { key: 'dashboard', name: 'Dashboard', desc: 'Executive Analytics & KPI Summary' },
  { key: 'production-dsr', name: 'Production DSR', desc: 'Daily Shooting Report, Footage, Crew, Fuel & Meal Log' },
  { key: 'timeline', name: 'Production Timeline', desc: 'Schedule, Shooting Phases & Milestones' },
  { key: 'ledger', name: 'Budget', desc: 'Line Item Allocations & Expense Records' },
  { key: 'expenses', name: 'Expenses Management', desc: 'Expense Bookings, On Account Advances & Reimbursements' },
  { key: 'approvals', name: 'Revisions & Approvals', desc: 'Financial & Operational Approval Queues' },
  { key: 'categories', name: 'Category Config', desc: 'Budget Department & Sub-Category Rules' },
  { key: 'cashier', name: 'Cashier Console', desc: 'Petty Cash Advances & Vault Ledger' },
  { key: 'reimbursement', name: 'Expense Reimbursements', desc: 'Crew Claims & Payment Processing' },
  { key: 'restoration', name: 'Restoration Pipeline', desc: 'Database Restoration & Synchronization Engine' },
  { key: 'logs', name: 'Log Viewer', desc: 'System Audit Logs & Transaction History' },
  { key: 'resources', name: 'Resource Map', desc: 'Global Crew & Equipment Allocations' },
  { key: 'admin', name: 'System Admin', desc: 'Global ERP Settings & Role Base Matrix' }
];

interface RoleBaseManagerProps {
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  onAddLog: (log: DBLog) => void;
}

export default function RoleBaseManager({ currentRole, onSelectRole, onAddLog }: RoleBaseManagerProps) {
  const [roleConfigs, setRoleConfigs] = useState<AppRoleConfig[]>(APP_ROLES_CATALOG);

  // Subscribe to Role Configs from Firestore Server
  useEffect(() => {
    const unsub = subscribeDoc<any>('settings', 'role_configs', (data) => {
      if (data && Array.isArray(data.roleConfigs) && data.roleConfigs.length > 0) {
        setRoleConfigs(data.roleConfigs);
      }
    });
    return () => unsub();
  }, []);

  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<AppRole>(currentRole);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState(false);

  const activeRoleObj = roleConfigs.find(r => r.id === selectedRoleForEdit) || roleConfigs[0];

  const handleToggleModuleAccess = (roleId: AppRole, moduleKey: string) => {
    setRoleConfigs(prev => prev.map(r => {
      if (r.id === roleId) {
        const hasAccess = r.allowedTabs.includes(moduleKey);
        const newTabs = hasAccess 
          ? r.allowedTabs.filter(t => t !== moduleKey) 
          : [...r.allowedTabs, moduleKey];
        return {
          ...r,
          allowedTabs: newTabs,
          permissionsCount: newTabs.length
        };
      }
      return r;
    }));
  };

  const handleSaveRoleMatrix = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveDocData('settings', 'role_configs', { roleConfigs });
      setIsSaving(false);
      setSaveNotification(true);

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_role_matrix_${Date.now()}`,
        timestamp: nowStr,
        action: 'SYS_ROLE_MATRIX_UPDATE',
        sqlQuery: `UPDATE sys_app_roles SET updated_at='${nowStr}', config_hash='${Math.random().toString(36).substring(2, 10)}';`,
        status: 'success'
      });

      setTimeout(() => setSaveNotification(false), 3000);
    }, 600);
  };

  const handleResetToDefault = () => {
    setRoleConfigs(APP_ROLES_CATALOG);
    saveDocData('settings', 'role_configs', { roleConfigs: APP_ROLES_CATALOG });
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_role_reset_${Date.now()}`,
      timestamp: nowStr,
      action: 'SYS_ROLE_MATRIX_RESET',
      sqlQuery: `TRUNCATE TABLE sys_app_roles; RE-INSERT DEFAULT ROLE MATRIX DEFS;`,
      status: 'info'
    });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden max-w-[1200px] mx-auto animate-fade-in space-y-6 p-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0058be] text-white rounded-lg shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black font-sans flex items-center gap-2">
              App Role Base Structure &amp; Access Control Matrix
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Define departmental role clearance, module permissions, and active authorization tiers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset matrix to default factory permissions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRoleMatrix}
            disabled={isSaving}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Matrix...' : 'Save Role Matrix'}</span>
          </button>
        </div>
      </div>

      {saveNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>App Role Base Structure permissions successfully saved to local-first database log!</span>
        </div>
      )}

      {/* Active Role Selector Simulator Banner */}
      <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CURRENT ACTIVE APP ROLE</span>
            <span className="text-sm font-bold font-sans text-black">{currentRole}</span>
            <span className="text-xs text-slate-500 ml-2">({roleConfigs.find(r => r.id === currentRole)?.clearance})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">Switch Active Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onSelectRole(e.target.value as AppRole)}
            className="h-9 px-3 bg-white border border-[#0058be] rounded-lg text-xs font-bold text-[#0058be] outline-none cursor-pointer focus:ring-1 focus:ring-[#0058be] shadow-2xs"
          >
            {roleConfigs.map(r => (
              <option key={r.id} value={r.id}>{r.title} ({r.permissionsCount} Modules)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Cards Catalog Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-[#0058be]" />
          App Roles &amp; Designation Hierarchy ({roleConfigs.length} Roles Defined)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roleConfigs.map((role) => {
            const isCurrent = currentRole === role.id;
            const isEditing = selectedRoleForEdit === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRoleForEdit(role.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isEditing 
                    ? 'bg-white border-[#0058be] ring-2 ring-[#0058be]/20 shadow-md' 
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${role.badgeBg} ${role.badgeText}`}>
                    {role.category}
                  </span>
                  
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                      ACTIVE USER
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-black font-sans">{role.title}</h4>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{role.clearance}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">{role.description}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Accessible Modules: <strong className="text-black">{role.permissionsCount} / {ALL_MODULE_DEFS.length}</strong>
                  </span>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRole(role.id);
                    }}
                    className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${
                      isCurrent 
                        ? 'text-emerald-700 bg-emerald-100 cursor-default' 
                        : 'text-[#0058be] hover:bg-blue-50'
                    }`}
                  >
                    {isCurrent ? 'Current Role' : 'Select Role →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Permission Matrix Table for Selected Role */}
      <div className="border border-[#E2E8F0] rounded-xl bg-white shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-black" />
            <div>
              <h3 className="text-sm font-bold text-black font-sans">
                Module Access Permissions for: <span className="text-[#0058be]">{activeRoleObj.title}</span>
              </h3>
              <p className="text-xs text-slate-500">{activeRoleObj.clearance}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const allKeys = ALL_MODULE_DEFS.map(m => m.key);
                setRoleConfigs(prev => prev.map(r => r.id === selectedRoleForEdit ? { ...r, allowedTabs: allKeys, permissionsCount: allKeys.length } : r));
              }}
              className="text-xs font-bold text-[#0058be] hover:underline px-2 py-1"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                setRoleConfigs(prev => prev.map(r => r.id === selectedRoleForEdit ? { ...r, allowedTabs: ['workspace'], permissionsCount: 1 } : r));
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Clear Optional
            </button>
          </div>
        </div>

        {/* Matrix List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_MODULE_DEFS.map((mod) => {
            const isAllowed = activeRoleObj.allowedTabs.includes(mod.key);

            return (
              <div
                key={mod.key}
                onClick={() => handleToggleModuleAccess(activeRoleObj.id, mod.key)}
                className={`p-3.5 rounded-lg border flex items-start gap-3 transition-all cursor-pointer ${
                  isAllowed 
                    ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/70' 
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60 opacity-70'
                }`}
              >
                <div className={`mt-0.5 p-1 rounded ${isAllowed ? 'bg-[#0058be] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {isAllowed ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Lock className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-black font-sans">{mod.name}</h5>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isAllowed ? 'GRANTED' : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{mod.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Footer for Role Matrix */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="h-9 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Cancel &amp; Reset Matrix</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRoleMatrix}
            disabled={isSaving}
            className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Role Matrix'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
