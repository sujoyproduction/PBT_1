import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Wallet, 
  Receipt, 
  Film, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Utensils, 
  Home, 
  FileText, 
  Tv, 
  Music, 
  Crown, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  ChevronRight, 
  Send, 
  ShieldCheck, 
  Plus,
  FolderPlus,
  Tag,
  AlertTriangle,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { Project, BudgetCategory, Expense } from '../types';
import { getTemplateForProjectType } from '../data/projectTypeTemplates';
import BudgetThresholdWarning from './BudgetThresholdWarning';

interface DynamicDashboardProps {
  project?: Project;
  company?: any;
  projects?: Project[];
  categories: BudgetCategory[];
  expenses: Expense[];
  onNavigate: (tab: string, subTab?: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  project,
  company,
  projects = [],
  categories = [],
  expenses = [],
  onNavigate,
  onSelectProject
}) => {
  const template = getTemplateForProjectType(project?.projectType);

  // Financial calculations strictly derived from user's active project & logged expenses/categories
  const activeProjId = project?.id || '';
  const cleanActiveProjId = activeProjId.replace(/^(wp_|p_|proj_)/, '');

  const projectCategories = useMemo(() => {
    if (!activeProjId) return categories;
    return categories.filter(c => 
      !c.projectId ||
      c.projectId === activeProjId || 
      c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanActiveProjId
    );
  }, [categories, activeProjId, cleanActiveProjId]);

  const totalCategoryBudget = useMemo(() => {
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

  // Approved budget strictly equals total budget allocated in categories (0 if no budget is allocated)
  const totalApprovedBudget = totalCategoryBudget;

  const projectExpenses = useMemo(() => {
    if (!activeProjId) return expenses;
    return expenses.filter(e => 
      !e.projectId ||
      e.projectId === activeProjId || 
      e.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanActiveProjId
    );
  }, [expenses, activeProjId, cleanActiveProjId]);

  const actualExpensesTotal = projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remainingBudget = totalApprovedBudget - actualExpensesTotal;
  const burnRate = totalApprovedBudget > 0 ? (actualExpensesTotal / totalApprovedBudget) * 100 : 0;
  const isThresholdExceeded = burnRate >= 90;
  const isBudgetOverrun = burnRate >= 100;
  
  // Committed Amount: sum of approved POs/expenses or contracts
  const committedCost = projectExpenses
    .filter(e => e.status === 'Approved' || e.status === 'Paid' || (e as any).isCommitted)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const paidExpenses = projectExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const unpaidExpenses = actualExpensesTotal - paidExpenses;
  const pendingApprovalsCount = projectExpenses.filter(e => e.status === 'Pending').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Project Identity - Compact Low-Space Layout */}
      <div id="dynamic-dashboard-project-header" className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/80 px-4 py-3 md:px-5 md:py-3 border border-slate-800 shadow-md">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Left: Project Title & Identity Badges */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight truncate">
                {project?.name || 'PBT Project Dashboard'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[9.5px] font-mono font-semibold uppercase tracking-wide">
                {template.displayName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-mono font-semibold uppercase tracking-wide">
                {project?.status || 'In Production'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                • {company?.name || 'Follow Focus Films'}
              </span>
            </div>

            {/* Compact Telemetry Meta Strip */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 md:gap-2 text-[11px]">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Platform:</span>
                <span className="font-semibold text-emerald-400 truncate max-w-[120px]">{project?.channelPlatform || 'Television / OTT'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Format:</span>
                <span className="font-semibold text-indigo-300 truncate max-w-[130px]">{project?.showFormat || 'Prime Time'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Season:</span>
                <span className="font-semibold text-cyan-300">{project?.seasonCode || project?.seasonName || 'S01'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Episodes:</span>
                <span className="font-semibold text-amber-300">{project?.expectedEpisodes || 26} Eps • {project?.episodeDuration || '45m'}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Shoot:</span>
                <span className="font-semibold text-blue-300">{project?.expectedShootDays || 15}d</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/80 text-slate-300">
                <span className="text-[9.5px] font-mono text-slate-500 uppercase">Telecast:</span>
                <span className="font-semibold text-rose-300">{project?.telecastStartDate || 'TBD'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              id="header-action-dsr-btn"
              onClick={() => onNavigate('production-dsr')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Production DSR</span>
            </button>
            <button
              id="header-action-ledger-btn"
              onClick={() => onNavigate('ledger')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Budget Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Threshold Warning System (Flags categories & projects exceeding 90% budget) */}
      <BudgetThresholdWarning
        project={project}
        projects={projects}
        categories={categories}
        expenses={expenses}
        onNavigate={onNavigate}
        onSelectProject={onSelectProject}
      />

      {/* 1. Common Financial Core Metric Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Common Core Financial Telemetry</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Real-time Currency: INR (₹)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Approved Budget */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Approved Budget</span>
            <div className="text-base md:text-lg font-black text-white font-mono">
              ₹{(totalApprovedBudget / 100000).toFixed(2)} L
            </div>
            <div className={`text-[10px] flex items-center gap-1 ${totalApprovedBudget > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{totalApprovedBudget > 0 ? '100% Sanctioned' : 'Pending Allocation'}</span>
            </div>
          </div>

          {/* Actual Expenses - With Dynamic Threshold Warning Badge */}
          <div className={`bg-slate-900/90 border rounded-xl p-3.5 space-y-1 relative overflow-hidden transition-all ${
            isBudgetOverrun 
              ? 'border-rose-700 bg-gradient-to-b from-rose-950/20 to-slate-900 shadow-md shadow-rose-950/30' 
              : isThresholdExceeded 
              ? 'border-amber-600 bg-gradient-to-b from-amber-950/20 to-slate-900 shadow-md shadow-amber-950/30' 
              : 'border-slate-800/90'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Actual Expenses</span>
              {isThresholdExceeded && (
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-extrabold uppercase ${
                  isBudgetOverrun ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                }`}>
                  {isBudgetOverrun ? 'OVERRUN' : '≥90% CAP'}
                </span>
              )}
            </div>
            <div className="text-base md:text-lg font-black text-rose-400 font-mono">
              ₹{(actualExpensesTotal / 100000).toFixed(2)} L
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              {isThresholdExceeded && (
                <AlertTriangle className={`w-3 h-3 ${isBudgetOverrun ? 'text-rose-400' : 'text-amber-400'}`} />
              )}
              <span>{totalApprovedBudget > 0 ? `${burnRate.toFixed(1)}% of Budget` : '0.0% of Budget'}</span>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className={`bg-slate-900/90 border rounded-xl p-3.5 space-y-1 ${
            remainingBudget < 0 ? 'border-rose-800/80 bg-rose-950/10' : 'border-slate-800/90'
          }`}>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Remaining Budget</span>
            <div className={`text-base md:text-lg font-black font-mono ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ₹{(remainingBudget / 100000).toFixed(2)} L
            </div>
            <div className={`text-[10px] flex items-center gap-1 ${remainingBudget < 0 ? 'text-rose-400' : totalApprovedBudget > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <TrendingUp className="w-3 h-3" />
              <span>{remainingBudget < 0 ? 'Deficit Overdraft' : totalApprovedBudget > 0 ? 'Safe Buffer' : '₹0.00 Net'}</span>
            </div>
          </div>

          {/* Committed Amount */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Committed Amount</span>
            <div className="text-base md:text-lg font-black text-amber-400 font-mono">
              ₹{(committedCost / 100000).toFixed(2)} L
            </div>
            <div className="text-[10px] text-slate-400">POs &amp; Contracts</div>
          </div>

          {/* Paid / Unpaid */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Paid vs Unpaid</span>
            <div className="text-xs font-black text-white font-mono flex items-center justify-between">
              <span className="text-emerald-400">₹{(paidExpenses / 100000).toFixed(1)}L Paid</span>
              <span className="text-amber-400">₹{(unpaidExpenses / 100000).toFixed(1)}L Due</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex mt-1">
              <div className="bg-emerald-500 h-full" style={{ width: `${actualExpensesTotal ? (paidExpenses / actualExpensesTotal) * 100 : 0}%` }}></div>
              <div className="bg-amber-500 h-full" style={{ width: `${actualExpensesTotal ? (unpaidExpenses / actualExpensesTotal) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Pending Approvals</span>
            <div className="text-base md:text-lg font-black text-blue-400 font-mono">
              {pendingApprovalsCount} Items
            </div>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View Inbox</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Project-Type Operational Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{template.displayName} Operational Telemetry</span>
          </h2>
          <span className="text-[10px] text-amber-300/80 font-mono">Tailored to {template.typeKey} Template</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {template.dashboardCards.map((card, idx) => (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">{card.title}</span>
                {card.badge && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="text-xl font-black text-white tracking-tight">{card.value}</div>
              <p className="text-[11px] text-slate-400">{card.subtext}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Direct Access & Department Workspaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Quick Module Actions */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>{template.displayName} Specialized Modules</span>
              </h3>
              <p className="text-[11px] text-slate-400">Directly jump to active project-type control centers</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase bg-blue-950/60 px-2 py-1 rounded border border-blue-900/50">
              {template.modules.length} Modules Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {template.modules.map((mod) => (
              <div key={mod.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-800 text-amber-400">
                      <Film className="w-3.5 h-3.5" />
                    </span>
                    {mod.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{mod.subItems?.length || 0} Tools</span>
                </div>
                {mod.subItems && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mod.subItems.slice(0, 4).map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onNavigate(mod.id, sub.id)}
                        className="px-2 py-1 rounded bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-300 text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Department Workspaces Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Department Workspaces</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/50">
                8 Teams
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Context-aware workspaces with daily planning, call sheets, DSR &amp; department expense trackers.
            </p>

            <div className="space-y-2 mt-4">
              {[
                { id: 'dept-production', name: 'Production Team', color: 'text-blue-400' },
                { id: 'dept-director', name: 'Director / Creative Team', color: 'text-amber-400' },
                { id: 'dept-art', name: 'Art & Set Team', color: 'text-emerald-400' },
                { id: 'dept-look', name: 'Look Management (Costume & Makeup)', color: 'text-rose-400' },
                { id: 'dept-camera', name: 'Camera Team', color: 'text-sky-400' },
                { id: 'dept-lighting', name: 'Lighting & Grip Team', color: 'text-yellow-400' },
                { id: 'dept-accounts', name: 'Accounts Team', color: 'text-green-400' },
                { id: 'dept-audit', name: 'Audit Team', color: 'text-indigo-400' }
              ].map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => onNavigate(dept.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-current ${dept.color}`}></span>
                    <span>{dept.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
