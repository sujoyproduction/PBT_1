import React from 'react';
import { ShieldAlert, Lock, ArrowRight, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppRole, APP_ROLES_CATALOG } from './RoleBaseManager';

interface RoleRestrictedViewProps {
  moduleKey: string;
  moduleName: string;
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  onNavigateToWorkspace: () => void;
}

export default function RoleRestrictedView({
  moduleKey,
  moduleName,
  currentRole,
  onSelectRole,
  onNavigateToWorkspace
}: RoleRestrictedViewProps) {
  // Find which roles DO have clearance for this module
  const authorizedRoles = APP_ROLES_CATALOG.filter(r => r.allowedTabs.includes(moduleKey));
  const currentRoleObj = APP_ROLES_CATALOG.find(r => r.id === currentRole) || APP_ROLES_CATALOG[0];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 max-w-2xl mx-auto my-12 shadow-sm text-center space-y-6 animate-fade-in">
      <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-2xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-full font-mono uppercase tracking-wider inline-flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-rose-600" />
          Access Restricted by App Role Base Structure
        </span>
        <h2 className="text-xl font-extrabold text-black font-sans">
          Module Clearance Required: {moduleName}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Your current active role <strong className="text-black font-bold">{currentRole}</strong> ({currentRoleObj.clearance}) does not have active clearance for the <strong>{moduleName}</strong> module.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
        <h4 className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0058be]" />
          Roles with Active Clearance for {moduleName}:
        </h4>
        <div className="flex flex-wrap gap-2">
          {authorizedRoles.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRole(r.id)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#0058be] hover:bg-blue-50 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
            >
              <span>{r.title}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-[#0058be] group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onNavigateToWorkspace}
          className="w-full sm:w-auto h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Return to Workspace
        </button>

        {authorizedRoles.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectRole(authorizedRoles[0].id)}
            className="w-full sm:w-auto h-10 px-5 bg-[#0058be] hover:bg-[#0058be]/90 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Switch Role to {authorizedRoles[0].title}</span>
          </button>
        )}
      </div>
    </div>
  );
}
