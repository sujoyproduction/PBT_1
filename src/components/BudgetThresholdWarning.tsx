import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ShieldAlert, 
  Wallet, 
  Receipt, 
  Layers, 
  ExternalLink,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Project, BudgetCategory, Expense } from '../types';

export interface BudgetThresholdWarningProps {
  project?: Project;
  projects?: Project[];
  categories: BudgetCategory[];
  expenses: Expense[];
  onNavigate?: (tab: string, subTab?: string) => void;
  onSelectProject?: (projectId: string) => void;
  className?: string;
  compact?: boolean;
}

export interface ThresholdItem {
  id: string;
  name: string;
  type: 'category' | 'project';
  projectId?: string;
  projectName?: string;
  department?: string;
  allocatedAmount: number;
  spentAmount: number;
  percentage: number;
  variance: number;
  isOverrun: boolean; // >= 100%
  isWarning: boolean; // >= 90% && < 100%
}

export const BudgetThresholdWarning: React.FC<BudgetThresholdWarningProps> = ({
  project,
  projects = [],
  categories = [],
  expenses = [],
  onNavigate,
  onSelectProject,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning'>('all');

  const activeProjId = project?.id || '';
  const cleanActiveProjId = activeProjId.replace(/^(wp_|p_|proj_)/, '');

  // 1. Current Project Categories Analysis
  const currentProjectCategories = useMemo(() => {
    if (!activeProjId) return categories;
    return categories.filter(c => 
      !c.projectId ||
      c.projectId === activeProjId || 
      c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanActiveProjId
    );
  }, [categories, activeProjId, cleanActiveProjId]);

  const currentProjectExpenses = useMemo(() => {
    if (!activeProjId) return expenses;
    return expenses.filter(e => 
      !e.projectId ||
      e.projectId === activeProjId || 
      e.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanActiveProjId
    );
  }, [expenses, activeProjId, cleanActiveProjId]);

  // Compute category-level threshold breaches
  const categoryThresholdItems: ThresholdItem[] = useMemo(() => {
    return currentProjectCategories.map(cat => {
      const allocated = typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0
        ? cat.allocatedAmount
        : (cat.subCategories || []).reduce((s, sub) => s + (sub.allocatedAmount || 0), 0);

      const spent = currentProjectExpenses
        .filter(e => e.categoryId === cat.id || e.categoryName === cat.name || (e as any).category === cat.name)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
      const isOverrun = percentage >= 100;
      const isWarning = percentage >= 90 && percentage < 100;
      const variance = allocated - spent;

      return {
        id: cat.id,
        name: cat.name,
        type: 'category' as const,
        projectId: cat.projectId || activeProjId,
        projectName: project?.name || 'Current Project',
        allocatedAmount: allocated,
        spentAmount: spent,
        percentage,
        variance,
        isOverrun,
        isWarning
      };
    }).filter(item => item.allocatedAmount > 0 && (item.percentage >= 90));
  }, [currentProjectCategories, currentProjectExpenses, activeProjId, project]);

  // Compute active project threshold breach
  const currentProjectTotalBudget = useMemo(() => {
    return currentProjectCategories.reduce((sum, c) => {
      if (typeof c.allocatedAmount === 'number' && c.allocatedAmount > 0) return sum + c.allocatedAmount;
      return sum + (c.subCategories || []).reduce((sAcc, sub) => sAcc + (sub.allocatedAmount || 0), 0);
    }, 0);
  }, [currentProjectCategories]);

  const currentProjectTotalSpent = useMemo(() => {
    return currentProjectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [currentProjectExpenses]);

  const currentProjectPercentage = currentProjectTotalBudget > 0 
    ? (currentProjectTotalSpent / currentProjectTotalBudget) * 100 
    : 0;

  const currentProjectItem: ThresholdItem | null = useMemo(() => {
    if (currentProjectTotalBudget <= 0 || currentProjectPercentage < 90) return null;
    return {
      id: project?.id || 'curr-proj',
      name: project?.name || 'Active Production Project',
      type: 'project' as const,
      projectId: project?.id,
      projectName: project?.name,
      allocatedAmount: currentProjectTotalBudget,
      spentAmount: currentProjectTotalSpent,
      percentage: currentProjectPercentage,
      variance: currentProjectTotalBudget - currentProjectTotalSpent,
      isOverrun: currentProjectPercentage >= 100,
      isWarning: currentProjectPercentage >= 90 && currentProjectPercentage < 100
    };
  }, [project, currentProjectTotalBudget, currentProjectTotalSpent, currentProjectPercentage]);

  // Compute other authorized projects if provided
  const otherProjectsThresholdItems: ThresholdItem[] = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects
      .filter(p => p.id !== activeProjId && p.id.replace(/^(wp_|p_|proj_)/, '') !== cleanActiveProjId)
      .map(p => {
        const pCleanId = p.id.replace(/^(wp_|p_|proj_)/, '');
        const pCats = categories.filter(c => 
          !c.projectId || c.projectId === p.id || c.projectId.replace(/^(wp_|p_|proj_)/, '') === pCleanId
        );
        const pAllocated = pCats.reduce((sum, c) => {
          if (typeof c.allocatedAmount === 'number' && c.allocatedAmount > 0) return sum + c.allocatedAmount;
          return sum + (c.subCategories || []).reduce((sAcc, sub) => sAcc + (sub.allocatedAmount || 0), 0);
        }, 0);
        const pExpenses = expenses.filter(e =>
          !e.projectId || e.projectId === p.id || e.projectId.replace(/^(wp_|p_|proj_)/, '') === pCleanId
        );
        const pSpent = pExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const pPct = pAllocated > 0 ? (pSpent / pAllocated) * 100 : 0;

        return {
          id: p.id,
          name: p.name,
          type: 'project' as const,
          projectId: p.id,
          projectName: p.name,
          allocatedAmount: pAllocated,
          spentAmount: pSpent,
          percentage: pPct,
          variance: pAllocated - pSpent,
          isOverrun: pPct >= 100,
          isWarning: pPct >= 90 && pPct < 100
        };
      })
      .filter(item => item.allocatedAmount > 0 && item.percentage >= 90);
  }, [projects, categories, expenses, activeProjId, cleanActiveProjId]);

  // All combined flagged items
  const allFlaggedItems = useMemo(() => {
    const list: ThresholdItem[] = [];
    if (currentProjectItem) list.push(currentProjectItem);
    categoryThresholdItems.forEach(c => list.push(c));
    otherProjectsThresholdItems.forEach(p => list.push(p));
    return list.sort((a, b) => b.percentage - a.percentage);
  }, [currentProjectItem, categoryThresholdItems, otherProjectsThresholdItems]);

  const filteredItems = useMemo(() => {
    if (filterType === 'critical') return allFlaggedItems.filter(i => i.isOverrun);
    if (filterType === 'warning') return allFlaggedItems.filter(i => i.isWarning);
    return allFlaggedItems;
  }, [allFlaggedItems, filterType]);

  const totalOverruns = allFlaggedItems.filter(i => i.isOverrun).length;
  const totalWarnings = allFlaggedItems.filter(i => i.isWarning).length;

  // If no thresholds are breached, render a serene all-clear badge if not compact
  if (allFlaggedItems.length === 0) {
    if (compact) return null;
    return (
      <div className={`p-3.5 rounded-xl bg-slate-900/60 border border-emerald-900/40 text-xs flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200">Budget Threshold System: Healthy</span>
            <p className="text-[11px] text-slate-400">All project categories are operating safely below the 90% allocation threshold.</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
          0 BREACHES
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 border shadow-xl ${
      totalOverruns > 0 
        ? 'bg-gradient-to-b from-rose-950/40 via-slate-900/90 to-slate-900 border-rose-800/80' 
        : 'bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900 border-amber-700/80'
    } ${className}`}>
      
      {/* Alert Header Banner */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center border animate-pulse ${
            totalOverruns > 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-950/50'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-950/50'
          }`}>
            {totalOverruns > 0 ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider border ${
                totalOverruns > 0
                  ? 'bg-rose-950/90 text-rose-300 border-rose-700'
                  : 'bg-amber-950/90 text-amber-300 border-amber-700'
              }`}>
                {totalOverruns > 0 ? 'CRITICAL BUDGET OVERRUN' : 'BUDGET THRESHOLD WARNING (≥90%)'}
              </span>

              {currentProjectItem && (
                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                  Active Project: {currentProjectPercentage.toFixed(1)}% Consumed
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>{allFlaggedItems.length} Budget Items Exceed 90% Threshold</span>
            </h3>
            <p className="text-xs text-slate-300/90 mt-0.5 max-w-2xl leading-relaxed">
              {totalOverruns > 0 
                ? `${totalOverruns} item(s) have completely exhausted authorized allocations (≥100%), and ${totalWarnings} item(s) are near exhaustion (≥90%). Immediate approval control advised.`
                : `${totalWarnings} department categories or projects have crossed the 90% expenditure safety threshold.`}
            </p>
          </div>
        </div>

        {/* Action and Expand Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {onNavigate && (
            <button
              onClick={() => onNavigate('ledger')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Review Ledger</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            title={isExpanded ? 'Collapse Alert Drawer' : 'Expand Alert Details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Table / Cards */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 bg-slate-950/60">
          
          {/* Quick Filter Pill Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Filter Flags:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({allFlaggedItems.length})
              </button>
              {totalOverruns > 0 && (
                <button
                  onClick={() => setFilterType('critical')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    filterType === 'critical'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-400 hover:bg-rose-950/40'
                  }`}
                >
                  Overrun ≥100% ({totalOverruns})
                </button>
              )}
              {totalWarnings > 0 && (
                <button
                  onClick={() => setFilterType('warning')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    filterType === 'warning'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-400 hover:bg-amber-950/40'
                  }`}
                >
                  At Risk 90-99% ({totalWarnings})
                </button>
              )}
            </div>

            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Real-time Indian Rupee (₹) Conversion
            </span>
          </div>

          {/* Cards Grid of Flagged Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map(item => (
              <div 
                key={`${item.type}-${item.id}`}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                  item.isOverrun
                    ? 'bg-rose-950/30 border-rose-800/80 hover:border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-amber-950/30 border-amber-800/70 hover:border-amber-600 shadow-md shadow-amber-950/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                          item.type === 'project' 
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}>
                          {item.type === 'project' ? 'Project Total' : 'Department Category'}
                        </span>
                        
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase ${
                          item.isOverrun 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-amber-500 text-slate-950'
                        }`}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-white line-clamp-1">{item.name}</h4>
                      {item.projectName && item.type === 'category' && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Project: {item.projectName}</p>
                      )}
                    </div>

                    <div className={`p-1.5 rounded-lg shrink-0 ${item.isOverrun ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {item.isOverrun ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Spent: ₹{item.spentAmount.toLocaleString('en-IN')}</span>
                      <span className="text-slate-300 font-bold">Cap: ₹{item.allocatedAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          item.isOverrun ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Variance & Action Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {item.variance >= 0 ? 'Remaining Buffer' : 'Deficit Overdraft'}
                    </span>
                    <div className={`font-mono font-black text-xs ${item.variance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.variance >= 0 ? `+₹${item.variance.toLocaleString('en-IN')}` : `-₹${Math.abs(item.variance).toLocaleString('en-IN')}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.type === 'project' && onSelectProject && item.projectId && (
                      <button
                        onClick={() => onSelectProject(item.projectId!)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Switch Project
                      </button>
                    )}
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('expenses')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700/60"
                        title="Audit itemized vouchers"
                      >
                        <Receipt className="w-3 h-3 text-amber-400" />
                        <span>Audit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 font-mono gap-2">
            <span className="flex items-center gap-1.5 text-amber-300/90">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Budget Threshold Policy: 90% Pre-warning Flag &amp; 100% Hard Overdraft Lockdown
            </span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('approvals')}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Check Pending Approvals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetThresholdWarning;
