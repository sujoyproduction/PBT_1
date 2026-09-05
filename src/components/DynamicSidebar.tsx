import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Sliders, 
  Wallet, 
  Receipt, 
  Film, 
  Building2, 
  Coins, 
  HardDrive, 
  CheckSquare, 
  UserCheck, 
  ShieldCheck, 
  Layers, 
  Briefcase, 
  FolderTree, 
  Terminal, 
  Shield, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Tv, 
  Utensils, 
  FileText, 
  Clock, 
  Crown, 
  Sparkles, 
  Tag, 
  Video, 
  Home, 
  Package, 
  Music, 
  MapPin, 
  Users, 
  Wrench, 
  Hammer, 
  Palette, 
  Truck, 
  Flame, 
  Eye, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2 
} from 'lucide-react';
import { Project } from '../types';
import { 
  getTemplateForProjectType, 
  COMMON_CORE_NAV, 
  STANDARD_DEPARTMENT_WORKSPACES, 
  ProjectTypeModule 
} from '../data/projectTypeTemplates';

interface DynamicSidebarProps {
  activeProject?: Project;
  activeTab: string;
  activeSubTab?: string;
  currentRole?: string;
  userEmail?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTab: (tab: string, subTab?: string) => void;
  onLogout: () => void;
  pendingApprovalsCount?: number;
}

// Icon mapper helper
const renderNavIcon = (iconName?: string) => {
  switch (iconName) {
    case 'BarChart': return <BarChart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'Sliders': return <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'Wallet': return <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'Receipt': return <Receipt className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'Film': return <Film className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'Building2': return <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    case 'Coins': return <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    case 'HardDrive': return <HardDrive className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'CheckSquare': return <CheckSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />;
    case 'UserCheck': return <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    case 'Layers': return <Layers className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'Tv': return <Tv className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'Utensils': return <Utensils className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'FileText': return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'Clock': return <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    case 'Crown': return <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />;
    case 'Tag': return <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
    case 'Video': return <Video className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    case 'Home': return <Home className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    case 'Package': return <Package className="w-3.5 h-3.5 text-lime-400 shrink-0" />;
    case 'Music': return <Music className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />;
    case 'MapPin': return <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'Users': return <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'FileCheck2': return <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    default: return <Film className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
};

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  activeProject,
  activeTab,
  activeSubTab = 'overview',
  currentRole = 'producer',
  userEmail,
  isMobileOpen,
  onCloseMobile,
  onSelectTab,
  onLogout,
  pendingApprovalsCount = 0
}) => {
  // Get active template configuration based on projectType
  const template = getTemplateForProjectType(activeProject?.projectType);

  // Expanded menu section states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'project-control': true,
    'budget': true,
    'production': true,
    'department-workspaces': true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isRoleAdmin = currentRole?.toLowerCase().includes('producer') || 
                      currentRole?.toLowerCase().includes('admin') || 
                      currentRole?.toLowerCase().includes('manager');

  return (
    <aside className={`fixed left-0 top-13 bottom-0 w-[230px] flex flex-col py-2 z-40 bg-slate-900/95 backdrop-blur-xl text-slate-200 border-r border-slate-800/80 shadow-xl transition-transform duration-300 md:translate-x-0 ${
      isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    }`}>
      <nav className="flex-1 px-2.5 space-y-3.5 overflow-y-auto custom-scrollbar pt-1">

        {/* 1. Global Navigation Section */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Workspace</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60"></span>
          </div>

          <button
            onClick={() => {
              onSelectTab('workspace');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
              activeTab === 'workspace'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <div className={`p-1 rounded-lg ${activeTab === 'workspace' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20'} transition-colors`}>
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span className="tracking-tight">User Workspace</span>
            </span>
          </button>
        </div>

        {/* 2. Active Project Context & Dynamic Project-Type Navigation */}
        {activeProject && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
            {/* A. Common Core Navigation */}
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Core Operations
              </div>

              {COMMON_CORE_NAV.map((navItem) => {
                const isNavActive = (navId: string, tab: string) => {
                  if (tab === navId) return true;
                  if (navId === 'budget' && ['ledger', 'hierarchy', 'versions', 'dept-budget', 'approved-budget', 'committed-cost', 'budget-vs-actual', 'final-cost-report'].includes(tab)) return true;
                  if (navId === 'expenses' && ['all-expenses', 'book-expense', 'expense-drafts', 'pending-approval', 'approved-expenses', 'on-account', 'reimbursements', 'uncleared-advances', 'expense-reports'].includes(tab)) return true;
                  if (navId === 'production' && ['production-overview', 'schedule', 'production-dsr', 'units', 'crew-attendance', 'artist-attendance', 'equipment-usage', 'transport-usage', 'genset-fuel', 'vanity', 'food-count'].includes(tab)) return true;
                  if (navId === 'vendors' && ['vendor-directory', 'vendor-creation', 'vendor-verification', 'quotations', 'rate-comparison', 'purchase-orders', 'work-orders', 'vendor-documents'].includes(tab)) return true;
                  if (navId === 'three-way-matching' && ['three-way-matching', 'po-matching', 'match-audit'].includes(tab)) return true;
                  if (navId === 'payments' && ['payment-requests', 'payment-approval', 'payment-register', 'payment-accounts', 'outstanding-payments', 'advance-adjustments', 'tds-tax', 'payment-reports'].includes(tab)) return true;
                  if (navId === 'documents' && ['project-documents', 'agreements', 'permissions', 'department-documents', 'call-sheets', 'dsr-files', 'bills-invoices', 'payment-proof', 'doc-reports'].includes(tab)) return true;
                  if (navId === 'approvals' && ['pending-approvals', 'my-approval-requests', 'approved-list', 'rejected-list', 'approval-history', 'workflow-settings'].includes(tab)) return true;
                  if (navId === 'team-permissions' && ['team-members', 'invite-members', 'departments', 'designations', 'roles', 'custom-role', 'permission-matrix', 'temporary-access', 'activity-log'].includes(tab)) return true;
                  if (navId === 'audit' && ['complete-audit-log', 'financial-audit', 'data-change-history', 'user-activity', 'approval-audit', 'document-audit', 'download-audit-report'].includes(tab)) return true;
                  if (navId === 'project-control' && ['project-setup', 'project-overview', 'creative-content', 'talent-contestants', 'crew-departments', 'studio-set', 'status', 'milestones', 'calendar', 'settings', 'overview'].includes(tab)) return true;
                  return false;
                };

                const isActive = isNavActive(navItem.id, activeTab);

                return (
                  <button
                    key={navItem.id}
                    onClick={() => {
                      onSelectTab(navItem.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-white' : ''}>
                        {renderNavIcon(navItem.icon)}
                      </span>
                      <span className="truncate">{navItem.name}</span>
                    </span>
                    {navItem.id === 'approvals' && pendingApprovalsCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        isActive 
                          ? 'bg-white text-blue-700' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      }`}>
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* B. Project-Type Specific Modules */}
            {template.modules && template.modules.length > 0 && (
              <div className="space-y-1 pt-2.5 border-t border-slate-800/60">
                <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-between">
                  <span>{template.displayName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                </div>

                {template.modules.map((mod: ProjectTypeModule) => {
                  const isActive = activeTab === mod.id;

                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        onSelectTab(mod.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-amber-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-white' : ''}>
                          {renderNavIcon(mod.icon)}
                        </span>
                        <span className="truncate">{mod.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* C. Department Workspaces Section */}
            <div className="space-y-1 pt-2.5 border-t border-slate-800/60">
              <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                Department Workspaces
              </div>

              <div className="space-y-0.5 pt-0.5">
                {STANDARD_DEPARTMENT_WORKSPACES.map((dept) => {
                  const isActive = activeTab === dept.id;

                  return (
                    <button
                      key={dept.id}
                      onClick={() => {
                        onSelectTab(dept.id, dept.items[0].id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-cyan-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Users className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'} shrink-0`} />
                        <span className="truncate">{dept.name.replace(' Workspace', '')}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI Production Suite Section */}
        <div className="space-y-1 pt-2.5 border-t border-slate-800/60">
          <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center justify-between">
            <span>AI Production Suite</span>
            <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">Gemini &amp; Veo</span>
          </div>

          <button
            onClick={() => { onSelectTab('video-studio'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'video-studio' ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/70 hover:text-purple-300'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Veo 3 Video Studio</span>
          </button>

          <button
            onClick={() => { onSelectTab('image-studio'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'image-studio' ? 'bg-purple-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/70 hover:text-purple-300'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Concept Art Studio</span>
          </button>

          <button
            onClick={() => { onSelectTab('maps-location'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'maps-location' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/70 hover:text-emerald-300'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Location Scouting</span>
          </button>

          <button
            onClick={() => { onSelectTab('search-intelligence'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'search-intelligence' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/70 hover:text-blue-300'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Market Intelligence</span>
          </button>
        </div>

        {/* 3. System Tools & Operations */}
        <div className="space-y-1 pt-2.5 border-t border-slate-800/60">
          <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            System Admin
          </div>

          <button
            onClick={() => { onSelectTab('categories'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-slate-400" />
            <span>Budget Structure</span>
          </button>

          <button
            onClick={() => { onSelectTab('roles'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'roles' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Roles &amp; Permissions</span>
          </button>

          <button
            onClick={() => { onSelectTab('profile'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>User Profile</span>
          </button>

          <button
            onClick={() => { onSelectTab('logs'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => { onSelectTab('admin'); onCloseMobile(); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'admin' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-amber-400 hover:bg-slate-800/70 hover:text-amber-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Global App Admin</span>
          </button>
        </div>

      </nav>

      {/* Sidebar Footer & Sign Out */}
      <div className="px-2.5 pt-2 pb-1 border-t border-slate-800/80 space-y-1">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all rounded-xl text-xs font-bold cursor-pointer border border-rose-500/20 shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
