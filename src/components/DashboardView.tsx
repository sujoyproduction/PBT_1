import React, { useState, useEffect, useMemo } from 'react';
import { Project, BudgetCategory, Expense, DBLog } from '../types';
import BudgetThresholdWarning from './BudgetThresholdWarning';
import { 
  Film, 
  IndianRupee, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  PieChart, 
  BarChart,
  Wallet,
  Clock,
  Users,
  MapPin,
  Cloud,
  Download,
  Sliders,
  Check,
  Building2,
  Truck,
  FileSpreadsheet,
  Settings,
  Flame,
  Info,
  SlidersHorizontal,
  FileText,
  Badge,
  User,
  Sparkles,
  AlertCircle,
  Plus,
  Undo2,
  ListFilter,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  Briefcase,
  FileDown,
  CheckCircle2,
  X,
  Search,
  Filter,
  Layers,
  Receipt,
  Coins,
  CheckSquare,
  Network,
  FolderTree,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  categories: BudgetCategory[];
  expenses: Expense[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onAddLog?: (log: DBLog) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardView({ projects, categories, expenses, selectedProjectId, onSelectProject, onAddLog, onNavigateTab }: DashboardViewProps) {
  // Navigation tabs for Dashboard Themes (Now with "budget" as default!)
  const [dashboardTheme, setDashboardTheme] = useState<'budget' | 'manufacturing' | 'creative'>('budget');
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>(() => selectedProjectId || projects[0]?.id || '');

  useEffect(() => {
    if (selectedProjectId) {
      setSelectedProjFilter(selectedProjectId);
    } else if (projects.length > 0 && (!selectedProjFilter || selectedProjFilter === 'all')) {
      setSelectedProjFilter(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  // ----------------------------------------------------
  // BUDGET OVERVIEW STATE & UTILS
  // ----------------------------------------------------
  const [budgetVersions, setBudgetVersions] = useState<any[]>([]);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVerTag, setNewVerTag] = useState('v2.5_Draft');
  const [newVerDesc, setNewVerDesc] = useState('Q3 Production Cost Adjustment Proposal');
  const [newVerAuthor, setNewVerAuthor] = useState('S. Production');

  // Trigger Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastOpen(true);
    setTimeout(() => {
      setIsToastOpen(false);
    }, 4000);
  };

  // Handler: Restore a previous budget version (simulates DB rollback)
  const handleRestoreVersion = (verId: string, verTag: string, verAmount: number) => {
    // Log transaction event
    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_bgt_restore_${Date.now()}`,
        timestamp: nowStr,
        action: 'RESTORE_BUDGET_VERSION',
        sqlQuery: `UPDATE sys_budget_meta SET active_state = 0 WHERE active_state = 1; UPDATE sys_budget_meta SET active_state = 1 WHERE version_id = '${verId}'; -- Restored ${verTag} with baseline ₹${verAmount.toLocaleString()}`,
        status: 'success'
      });
    }

    // Update status labels in state to show the restored one is Approved, others are Archived
    setBudgetVersions(prev => prev.map(v => ({
      ...v,
      status: v.id === verId ? 'Approved' : v.status === 'Approved' ? 'Archived' : v.status
    })));

    triggerToast(`Successfully restored budget baseline version ${verTag}! Database baseline has been synchronized.`);
  };

  // Handler: Create custom new draft version
  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerTag.trim()) return;

    const currentTotalBudget = selectedProjFilter === 'all' 
      ? projects.reduce((acc, p) => acc + p.totalBudget, 0)
      : (projects.find(p => p.id === selectedProjFilter)?.totalBudget || 0);

    const newVer = {
      id: `v_${Date.now()}`,
      version: newVerTag,
      status: 'Draft' as const,
      date: new Date().toISOString().substring(0, 10),
      amount: currentTotalBudget,
      author: newVerAuthor,
      description: newVerDesc
    };

    setBudgetVersions([newVer, ...budgetVersions]);
    setIsNewVersionModalOpen(false);

    // Log to DB Logs
    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_bgt_create_ver_${Date.now()}`,
        timestamp: nowStr,
        action: 'CREATE_BUDGET_VERSION_BASELINE',
        sqlQuery: `INSERT INTO sys_budget_meta (version_id, tag, status, baseline_amount, compiler_id, description) VALUES ('${newVer.id}', '${newVer.version}', 'Draft', ${newVer.amount}, '${newVer.author}', '${newVer.description}');`,
        status: 'success'
      });
    }

    triggerToast(`New baseline version ${newVerTag} registered in the system.`);
  };

  // Handler: Download baseline JSON schema
  const handleDownloadVersion = (ver: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ver, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `budget_schema_version_${ver.version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_bgt_dl_${Date.now()}`,
        timestamp: nowStr,
        action: 'DOWNLOAD_BUDGET_JSON_SCHEMA',
        sqlQuery: `SELECT generate_version_json_export('${ver.id}'); -- Success: Client-side compiled secure schema download`,
        status: 'success'
      });
    }
    triggerToast(`Budget Schema JSON structure for ${ver.version} generated.`);
  };


  // ----------------------------------------------------
  // INDUSTRIAL MANUFACTURING (OMEGA-7) STATE & UTILS
  // ----------------------------------------------------
  const [mBudgetAllocated, setMBudgetAllocated] = useState<number>(0);
  const [mBudgetSpent, setMBudgetSpent] = useState<number>(0);
  const [mPhase, setMPhase] = useState<number>(3);
  const [mTotalPhases, setMTotalPhases] = useState<number>(5);
  const [mDaysBehind, setMDaysBehind] = useState<number>(2);
  const [mWorkforce, setMWorkforce] = useState<number>(128);
  const [mShiftsActive, setMShiftsActive] = useState<number>(3);
  
  // Overall Yield, Cycle, and Downtime metrics
  const [mAverageYield, setMAverageYield] = useState<number>(94.2);
  const [mCycleTime, setMCycleTime] = useState<number>(42.5);
  const [mDowntime, setMDowntime] = useState<number>(2.1);

  // Daily yield graph state
  const [mDailyEfficiency, setMDailyEfficiency] = useState<Record<string, number>>({
    MON: 65,
    TUE: 78,
    WED: 82,
    THU: 74,
    FRI: 91,
    SAT: 45,
    SUN: 30
  });

  // Milestones state
  const [mMilestones, setMMilestones] = useState<any[]>([]);

  // Recent activity logs state for Mfg
  const [mActivities, setMActivities] = useState<any[]>([]);

  // Logistics Tab overlay selection
  const [activeLogisticsTab, setActiveLogisticsTab] = useState<'none' | 'inventory' | 'shipment' | 'invoicing' | 'analytics'>('none');

  // Edit Parameters Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Hovered state for chart day bars
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Calculations
  const mBudgetRatio = mBudgetAllocated > 0 ? (mBudgetSpent / mBudgetAllocated) * 100 : 0;
  const mBudgetDiff = mBudgetAllocated - mBudgetSpent;
  const mBudgetDiffPercent = (mBudgetDiff / mBudgetAllocated) * 100;

  // Handler: Modify manufacturing parameters
  const handleSaveParameters = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const allocated = Number(formData.get('allocated') || mBudgetAllocated);
    const spent = Number(formData.get('spent') || mBudgetSpent);
    const phase = Number(formData.get('phase') || mPhase);
    const totalPhases = Number(formData.get('totalPhases') || mTotalPhases);
    const behind = Number(formData.get('behind') || mDaysBehind);
    const workforce = Number(formData.get('workforce') || mWorkforce);
    const shifts = Number(formData.get('shifts') || mShiftsActive);
    const yieldVal = Number(formData.get('yield') || mAverageYield);
    const cycle = Number(formData.get('cycle') || mCycleTime);
    const down = Number(formData.get('down') || mDowntime);

    setMBudgetAllocated(allocated);
    setMBudgetSpent(spent);
    setMPhase(phase);
    setMTotalPhases(totalPhases);
    setMDaysBehind(behind);
    setMWorkforce(workforce);
    setMShiftsActive(shifts);
    setMAverageYield(yieldVal);
    setMCycleTime(cycle);
    setMDowntime(down);

    // Update Daily chart bar values
    setMDailyEfficiency({
      MON: Number(formData.get('eff_MON') || mDailyEfficiency.MON),
      TUE: Number(formData.get('eff_TUE') || mDailyEfficiency.TUE),
      WED: Number(formData.get('eff_WED') || mDailyEfficiency.WED),
      THU: Number(formData.get('eff_THU') || mDailyEfficiency.THU),
      FRI: Number(formData.get('eff_FRI') || mDailyEfficiency.FRI),
      SAT: Number(formData.get('eff_SAT') || mDailyEfficiency.SAT),
      SUN: Number(formData.get('eff_SUN') || mDailyEfficiency.SUN),
    });

    setIsEditModalOpen(false);

    // Generate Transactional Database Entry
    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_mfg_param_${Date.now()}`,
        timestamp: nowStr,
        action: 'UPDATE_MANUFACTURING_PARAMETERS',
        sqlQuery: `UPDATE sys_industrial_config SET allocated_budget = ${allocated}, current_spent = ${spent}, current_phase = ${phase}, days_behind = ${behind}, active_personnel = ${workforce} WHERE cycle_id = 4829;`,
        status: 'success'
      });
    }
  };

  // Handler: Export Manufacturing Report
  const handleExportReport = () => {
    const reportData = {
      facility: "Facility 04 (Doha, Qatar)",
      cycle: "#4829",
      timestamp: new Date().toISOString(),
      budget: {
        allocated: mBudgetAllocated,
        spent: mBudgetSpent,
        utilizationPercent: mBudgetRatio.toFixed(1)
      },
      schedule: {
        phase: `Phase ${mPhase} of ${mTotalPhases}`,
        daysBehind: mDaysBehind
      },
      workforce: {
        totalPersonnel: mWorkforce,
        activeShifts: mShiftsActive
      },
      metrics: {
        averageYield: `${mAverageYield}%`,
        cycleTime: `${mCycleTime} hrs`,
        downtime: `${mDowntime}%`
      },
      milestones: mMilestones,
      dailyEfficiency: mDailyEfficiency
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `manufacturing_report_cycle_4829_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_mfg_export_${Date.now()}`,
        timestamp: nowStr,
        action: 'MANUFACTURING_REPORT_EXPORT',
        sqlQuery: `SELECT export_facility_analytics(4829); -- Success: Downloaded JSON report with ${mMilestones.length} active checkpoints`,
        status: 'success'
      });
    }
  };

  // Toggle milestone status cycle
  const handleCycleMilestoneStatus = (milestoneId: string) => {
    const statuses = ['On Track', 'At Risk', 'Delayed', 'Pending', 'Completed'];
    setMMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const nextIdx = (statuses.indexOf(m.status) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];
        let nextProg = m.progress;
        if (nextStatus === 'Completed') nextProg = 100;
        if (nextStatus === 'Pending') nextProg = 0;
        return {
          ...m,
          status: nextStatus,
          progress: nextProg
        };
      }
      return m;
    }));

    if (onAddLog) {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      onAddLog({
        id: `l_mfg_milestone_${Date.now()}`,
        timestamp: nowStr,
        action: 'CYCLE_MILESTONE_STATUS',
        sqlQuery: `UPDATE sys_industrial_milestones SET status = 'cycled', progress_index = progress_index + 15 WHERE id = '${milestoneId}';`,
        status: 'success'
      });
    }
  };


  // ----------------------------------------------------
  // CREATIVE PRODUCTION (FILM) AGGREGATE CALCULATIONS
  // ----------------------------------------------------
  // Resolve current active project object with multi-format ID matching
  const currentSelectedProject = projects.find(p => 
    p.id === selectedProjFilter || 
    `wp_${p.id}` === selectedProjFilter || 
    p.id.replace(/^wp_/, '') === selectedProjFilter.replace(/^wp_/, '') ||
    (p.name && selectedProjFilter && (
      p.name.toLowerCase().includes(selectedProjFilter.toLowerCase()) || 
      selectedProjFilter.toLowerCase().includes(p.name.toLowerCase())
    ))
  );

  const activeProjId = currentSelectedProject ? currentSelectedProject.id : selectedProjFilter;

  const filteredProjects = selectedProjFilter === 'all' 
    ? projects 
    : projects.filter(p => 
        p.id === activeProjId || 
        p.id === selectedProjFilter || 
        `wp_${p.id}` === selectedProjFilter ||
        p.id.replace(/^wp_/, '') === selectedProjFilter.replace(/^wp_/, '')
      );

  const totalERPPudget = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalERPSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const burnRate = totalERPPudget > 0 ? (totalERPSpent / totalERPPudget) * 100 : 0;

  const highRiskCategories = useMemo(() => {
    const map = new Map<string, BudgetCategory>();
    categories.forEach(cat => {
      const matchingProject = projects.find(p => p.id === cat.projectId);
      if (!matchingProject) return;
      const ratio = cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0;
      if (ratio >= 90 && cat.id && !map.has(cat.id)) {
        map.set(cat.id, cat);
      }
    });
    return Array.from(map.values());
  }, [categories, projects]);

  // ----------------------------------------------------
  // DYNAMIC BUDGET METRICS (For New Core Budget Tab)
  // ----------------------------------------------------
  // Aggregate categories for the filtered subset (strictly isolated by project ID)
  const currentCategories = selectedProjFilter === 'all'
    ? categories
    : categories.filter(c => 
        c.projectId === activeProjId || 
        c.projectId === selectedProjFilter || 
        c.projectId.replace(/^wp_/, '') === selectedProjFilter.replace(/^wp_/, '')
      );

  const categoriesAllocatedTotal = currentCategories.reduce((acc, c) => acc + (c.allocatedAmount || 0), 0);

  // Calculate project total budget: strictly use sum of active category allocations
  const currentTotalBudget = categoriesAllocatedTotal;
  
  // Calculate expenses for the filtered subset (strictly isolated by project ID)
  const currentExpenses = selectedProjFilter === 'all' 
    ? expenses 
    : expenses.filter(e => 
        e.projectId === activeProjId || 
        e.projectId === selectedProjFilter || 
        e.projectId.replace(/^wp_/, '') === selectedProjFilter.replace(/^wp_/, '')
      );
  const currentSpent = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  const currentVariance = currentTotalBudget - currentSpent;
  const currentPercentSpent = currentTotalBudget > 0 ? (currentSpent / currentTotalBudget) * 100 : 0;

  // Group and sum categories by name to show beautiful aggregated breakdown
  const categoryAggregations = currentCategories.reduce((acc, cat) => {
    const existing = acc.find(c => c.id === cat.id || c.name.toLowerCase() === cat.name.toLowerCase());
    if (existing) {
      existing.allocatedAmount += cat.allocatedAmount;
      existing.spentAmount += cat.spentAmount;
    } else {
      acc.push({
        id: cat.id,
        name: cat.name,
        allocatedAmount: cat.allocatedAmount,
        spentAmount: cat.spentAmount,
        projectId: cat.projectId
      });
    }
    return acc;
  }, [] as BudgetCategory[]);

  // Filter categories by search query
  const filteredCategoryBreakdown = categoryAggregations.filter(cat => 
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  return (
    <div id="erp-master-dashboard-view" className="flex flex-col gap-6 animate-fade-in select-none">
      
      {/* Toast Notification */}
      {isToastOpen && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in max-w-md">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100">Action Complete</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed truncate">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setIsToastOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* ----------------------------------------------------
          THEME 0: HIGH-FIDELITY BUDGET OVERVIEW DASHBOARD
         ---------------------------------------------------- */}
      {dashboardTheme === 'budget' && (
        <div className="space-y-6">
          
          {/* Budget Threshold Warning System */}
          <BudgetThresholdWarning
            project={currentSelectedProject}
            projects={projects}
            categories={categories}
            expenses={expenses}
            onNavigate={(tab) => onNavigateTab && onNavigateTab(tab)}
            onSelectProject={onSelectProject}
          />

          {/* Quick Metrics KPI cards (Three Top Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* KPI 1: Total Budgeted */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Total Budgeted</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white font-sans mt-0.5">₹{currentTotalBudget.toLocaleString()}</h3>
                  <span className="text-[10px] text-emerald-400 font-sans flex items-center gap-1 font-semibold mt-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 
                    <span>+4.2% authorized limit variance</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* KPI 2: Actual Spend */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 w-full pr-3">
                  <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Actual Spend</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white font-sans mt-0.5">₹{currentSpent.toLocaleString()}</h3>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold mt-1.5">
                    <span>Utilization Rate</span>
                    <span className="text-slate-200">{currentPercentSpent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700/60">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        currentPercentSpent >= 95 ? 'bg-rose-500' : currentPercentSpent >= 80 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(currentPercentSpent, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* KPI 3: Budget Variance */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Budget Variance</span>
                  <h3 className={`text-2xl md:text-3xl font-black font-sans mt-0.5 ${currentVariance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currentVariance < 0 ? '-' : ''}₹{Math.abs(currentVariance).toLocaleString()}
                  </h3>
                  <div className="mt-1">
                    {currentVariance < 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800 text-[9px] font-bold text-rose-300 font-mono uppercase">
                        Overdraft Detected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-[9px] font-bold text-emerald-300 font-mono uppercase">
                        Within Authorized Baseline
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg shrink-0 border ${currentVariance < 0 ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'}`}>
                  {currentVariance < 0 ? <AlertTriangle className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </div>
              </div>
            </div>

          </div>

          {/* Primary Bento Grids: Spending breakdown, Activity log, and Versions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Main Dashboard Area (8-cols width) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Category Breakdown & Comparison Bar Charts */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white uppercase font-mono text-xs tracking-wider">Spending Categories Breakdown</h3>
                  </div>

                  {/* Search categories search bar */}
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-3 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-sans text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredCategoryBreakdown.length === 0 ? (
                    <div className="text-center py-6 bg-slate-800/40 border border-dashed border-slate-700/60 rounded-xl text-xs text-slate-400 font-sans">
                      No categories found matching your query or selected project filter.
                    </div>
                  ) : (
                    filteredCategoryBreakdown.map((cat) => {
                      const ratio = cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0;
                      return (
                        <div key={cat.id} className="space-y-1.5 border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 font-sans">{cat.name}</span>
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 font-semibold uppercase border border-slate-700/50">
                                {projects.find(p => p.id === cat.projectId)?.name.split(':')[0] || 'Unallocated'}
                              </span>
                            </div>
                            <span className="font-mono text-slate-400 text-[10px] font-bold">
                              ₹{cat.spentAmount.toLocaleString()} spent / <span className="text-slate-500">₹{cat.allocatedAmount.toLocaleString()} allocated</span>
                            </span>
                          </div>
                          
                          {/* Dual Bar chart comparison */}
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-11 relative h-5 bg-slate-800 border border-slate-700/80 rounded-md overflow-hidden flex items-center shadow-inner">
                              {/* Allocated Budget Base Block */}
                              <div className="absolute inset-0 bg-blue-500/5" />
                              
                              {/* Real spent bar */}
                              <div 
                                className={`h-full rounded-r transition-all duration-500 ${
                                  ratio >= 100 ? 'bg-rose-500' : ratio >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(ratio, 100)}%` }}
                              />
                              
                              <span className="absolute left-2 text-[9px] font-mono font-black text-slate-200 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                                CONSUMED: {ratio.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="col-span-1 flex justify-end">
                              {ratio >= 100 ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[9px] font-bold font-mono">OVER</span>
                              ) : ratio >= 90 ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[9px] font-bold font-mono">≥90%</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[9px] font-bold font-mono text-center">OK</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent Budget Versions (Authorized control list) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white uppercase font-mono text-xs tracking-wider">Baseline Budget Versions</h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">Real-time sync active</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                        <th className="py-2 font-bold">Version tag</th>
                        <th className="py-2 font-bold">Status</th>
                        <th className="py-2 font-bold">Baseline Capital</th>
                        <th className="py-2 font-bold">Release date</th>
                        <th className="py-2 font-bold">Author</th>
                        <th className="py-2 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-sans">
                      {budgetVersions.map((v) => {
                        const isApproved = v.status === 'Approved';
                        const isDraft = v.status === 'Draft';
                        const isArchived = v.status === 'Archived';
                        
                        return (
                          <tr key={v.id} className="hover:bg-slate-800/50 transition-colors group">
                            <td className="py-2.5 font-bold text-slate-100 font-mono">
                              <span className="flex flex-col">
                                <span>{v.version}</span>
                                <span className="text-[9px] text-slate-400 font-sans font-normal max-w-[160px] truncate">{v.description}</span>
                              </span>
                            </td>
                            <td className="py-2.5">
                              {isApproved && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono text-[9px] font-bold">APPROVED</span>
                              )}
                              {isDraft && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono text-[9px] font-bold">DRAFT</span>
                              )}
                              {isArchived && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[9px] font-bold">ARCHIVED</span>
                              )}
                            </td>
                            <td className="py-2.5 font-mono font-bold text-slate-200">₹{v.amount.toLocaleString()}</td>
                            <td className="py-2.5 text-slate-400 font-mono text-[10px]">{v.date}</td>
                            <td className="py-2.5 text-slate-300 font-medium">{v.author}</td>
                            <td className="py-2.5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleDownloadVersion(v)}
                                  title="Export schema JSON"
                                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                
                                {!isApproved && (
                                  <button
                                    onClick={() => handleRestoreVersion(v.id, v.version, v.amount)}
                                    title="Restore this version baseline"
                                    className="px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-800 rounded cursor-pointer transition-colors"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Panel: Recent activity stream and DB diagnostics (4-cols width) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Dynamic activity stream */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">Transactional Activities</span>
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-indigo-400 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    <span>Real-time</span>
                  </div>
                </div>

                {currentExpenses.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/40 border border-dashed border-slate-700/60 rounded-xl text-xs text-slate-400 font-sans">
                    No transaction entries recorded.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-800 pl-3.5 space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {currentExpenses.slice(0, 5).map((exp) => {
                      const isOverdraft = exp.amount > 50000;
                      return (
                        <div key={exp.id} className="relative group">
                          {/* Node marker */}
                          <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border border-slate-900 transition-transform group-hover:scale-125 ${
                            isOverdraft ? 'bg-amber-500' : 'bg-indigo-500'
                          }`} />

                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="text-xs font-bold text-slate-100 font-sans leading-tight pr-3">
                                {exp.title}
                              </h5>
                              <span className="font-mono text-[10px] font-black text-white shrink-0">
                                ₹{exp.amount.toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="text-[9px] text-slate-400 font-mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                              <span>Payee: {exp.payee}</span>
                              <span>•</span>
                              <span>{exp.date}</span>
                            </div>

                            {isOverdraft && (
                              <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-[8px] font-bold text-amber-300 font-mono uppercase inline-block">
                                High-Value Transaction
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-[10px] text-slate-400 leading-normal font-mono flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Firestore connected. Changes update dynamically across sessions.</span>
                </div>
              </div>

              {/* Database Analytics */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">Firestore Sync Status</span>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-lg">
                    <span className="text-[9px] uppercase font-mono font-semibold text-slate-400">Total logs</span>
                    <p className="text-base font-black text-slate-100 font-sans mt-0.5">14</p>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-lg">
                    <span className="text-[9px] uppercase font-mono font-semibold text-slate-400">Health index</span>
                    <p className="text-base font-black text-emerald-400 font-sans mt-0.5">100%</p>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Synchronizer thread</span>
                    <span className="text-emerald-400 font-bold">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-400">Database Engine</span>
                    <span className="font-bold text-slate-200">FIRESTORE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compiled baselines</span>
                    <span className="font-bold text-slate-200">{budgetVersions.length} loaded</span>
                  </div>
                </div>

                <button 
                  onClick={() => triggerToast("Successfully synchronized real-time indices with cloud server!")}
                  className="w-full h-8 border border-slate-700 hover:bg-slate-800 transition-colors text-[10px] font-bold text-blue-400 rounded-lg uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Sync Cloud Indices</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          THEME 1: INDUSTRIAL MANUFACTURING (OMEGA-7)
         ---------------------------------------------------- */}
      {dashboardTheme === 'manufacturing' && (
        <div className="space-y-6">
          
          {/* Header Controls Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <nav className="flex text-[10px] text-slate-400 mb-1 gap-1 items-center font-mono uppercase tracking-wider">
                <span>Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-bold">Production Omega-7</span>
              </nav>
              <h2 className="text-2xl font-black tracking-tight text-black font-sans uppercase">Production Omega-7 Summary</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">Live tracking for heavy manufacturing cycle #4829</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 px-4 bg-[#0058be] hover:bg-[#0058be]/95 text-white text-xs font-black font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Configure cycle parameters</span>
              </button>
              
              <button 
                onClick={handleExportReport}
                className="h-9 px-3.5 border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                title="Download JSON Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aggregate Row stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* 1. Cycle Budget allocated */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Cycle Budget</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">₹{mBudgetAllocated.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-sans">
                  Total project allocation limit
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-[#0058be]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Current cost spent */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Capital Expended</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">₹{mBudgetSpent.toLocaleString()}</h3>
                <div className="flex items-center gap-1 text-[10px] font-mono mt-1 font-bold text-slate-700">
                  <span className={`${mBudgetDiffPercent < 15 ? 'text-[#F59E0B]' : 'text-emerald-600'}`}>
                    {mBudgetRatio.toFixed(0)}% consumed
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 font-normal">Diff: ₹{mBudgetDiff.toLocaleString()}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${mBudgetRatio >= 90 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Cycle Phase progress */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1 w-full pr-4">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Cycle Phase Tracking</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">Phase {mPhase} / {mTotalPhases}</h3>
                
                {/* Horizontal Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5 border border-slate-200">
                  <div 
                    className="h-full bg-[#0058be] transition-all duration-500" 
                    style={{ width: `${(mPhase / mTotalPhases) * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* 4. Workforce telemetry */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Active Personnel</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">{mWorkforce} Techs</h3>
                <span className="text-[10px] text-emerald-600 font-sans flex items-center gap-1 font-semibold">
                  <span>● {mShiftsActive} active shift rotations</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Multi-unit layout: Charts & Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Yield Bar Chart Column (7-span) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-[#0058be]" />
                  <h3 className="font-bold text-black uppercase font-mono text-xs tracking-wider">Daily Processing Yield</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">7-Day Cycle Overview</span>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex flex-col justify-between h-80 relative">
                
                {/* Chart Header Info */}
                <div className="flex justify-between items-start z-10">
                  <div>
                    <h4 className="text-sm font-black text-black font-sans">94.2% Average Yield</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Calculated cycle throughput metrics across sensor arrays</p>
                  </div>
                  
                  {hoveredBar && (
                    <div className="bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-1 rounded shadow-md border border-slate-800 animate-fade-in">
                      {hoveredBar}: <span className="text-emerald-400">{mDailyEfficiency[hoveredBar]}%</span> Yield
                    </div>
                  )}
                </div>

                {/* Simulated Custom Bar Chart Component */}
                <div className="flex justify-between items-end h-44 px-2 pt-6 relative border-b border-slate-100">
                  
                  {/* Grid Lines Representation */}
                  <div className="absolute inset-x-0 top-6 border-t border-slate-100 text-[8px] text-slate-300 font-mono text-right pr-2">100% LIMIT</div>
                  <div className="absolute inset-x-0 top-1/2 border-t border-slate-100 text-[8px] text-slate-300 font-mono text-right pr-2">50% PASS</div>

                  {Object.keys(mDailyEfficiency).map((day) => {
                    const value = mDailyEfficiency[day];
                    const heightPercent = Math.min(value, 100);
                    const isHigh = value >= 80;
                    const isLow = value < 50;

                    return (
                      <div 
                        key={day} 
                        className="flex flex-col items-center gap-2 flex-1 group"
                        onMouseEnter={() => setHoveredBar(day)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="w-8 sm:w-10 bg-slate-50 border border-slate-100 rounded-t-lg h-36 flex items-end overflow-hidden relative shadow-2xs">
                          <div 
                            className={`w-full rounded-t-md transition-all duration-500 ease-out cursor-pointer ${
                              isLow ? 'bg-rose-500' : isHigh ? 'bg-emerald-500' : 'bg-[#0058be]'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">{day}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 font-mono font-semibold uppercase pt-2">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal Yield (&ge;80%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0058be]" /> Stable Run (50-79%)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Calibration Warning (&lt;50%)</span>
                </div>
              </div>
            </div>

            {/* Right Industrial Milestones Column (5-span) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0058be]" />
                <h3 className="font-bold text-black uppercase font-mono text-xs tracking-wider">Facility Milestones</h3>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex flex-col justify-between h-80">
                <div className="space-y-4">
                  {mMilestones.map((mil) => {
                    const isCompleted = mil.status === 'Completed';
                    const isDelayed = mil.status === 'Delayed';
                    const isAtRisk = mil.status === 'At Risk';
                    const isPending = mil.status === 'Pending';
                    const isCycledTrack = mil.status === 'On Track';

                    const getStatusColor = () => {
                      if (isCompleted) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (isDelayed) return 'bg-rose-50 text-rose-700 border-rose-200';
                      if (isAtRisk) return 'bg-amber-50 text-amber-700 border-amber-200';
                      if (isCycledTrack) return 'bg-sky-50 text-sky-700 border-sky-200';
                      return 'bg-slate-50 text-slate-500 border-slate-200';
                    };

                    return (
                      <div 
                        key={mil.id} 
                        onClick={() => handleCycleMilestoneStatus(mil.id)}
                        className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0 cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-black font-sans leading-tight group-hover:text-[#0058be] transition-colors">{mil.name}</h4>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center gap-2">
                            <span>Target: {mil.deadline}</span>
                            <span>•</span>
                            <span className="font-semibold uppercase text-slate-600">Owner: {mil.owner}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase font-mono border ${getStatusColor()}`}>
                            {mil.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-[9px] text-slate-400 leading-normal font-mono">
                  <span className="text-[#0058be] font-bold uppercase block mb-0.5">Interaction hint:</span>
                  Click on any milestone status to cycle its real-time tracking metrics and sync state.
                </div>
              </div>
            </div>

          </div>

          {/* Lower Section: Logistics Overlays & Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Logistics Controller Tabs (7-span) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#0058be]" />
                  <h3 className="font-bold text-black uppercase font-mono text-xs tracking-wider">Facility Logistics</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">External Data Probes</span>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setActiveLogisticsTab(activeLogisticsTab === 'inventory' ? 'none' : 'inventory')}
                    className={`h-11 px-3 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeLogisticsTab === 'inventory' 
                        ? 'bg-[#0058be] text-white border-[#0058be]' 
                        : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Raw Inventory</span>
                  </button>

                  <button
                    onClick={() => setActiveLogisticsTab(activeLogisticsTab === 'shipment' ? 'none' : 'shipment')}
                    className={`h-11 px-3 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeLogisticsTab === 'shipment' 
                        ? 'bg-[#0058be] text-white border-[#0058be]' 
                        : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Freight dispatches</span>
                  </button>

                  <button
                    onClick={() => setActiveLogisticsTab(activeLogisticsTab === 'invoicing' ? 'none' : 'invoicing')}
                    className={`h-11 px-3 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeLogisticsTab === 'invoicing' 
                        ? 'bg-[#0058be] text-white border-[#0058be]' 
                        : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Billing Ledger</span>
                  </button>

                  <button
                    onClick={() => setActiveLogisticsTab(activeLogisticsTab === 'analytics' ? 'none' : 'analytics')}
                    className={`h-11 px-3 border rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeLogisticsTab === 'analytics' 
                        ? 'bg-[#0058be] text-white border-[#0058be]' 
                        : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Live telemetry</span>
                  </button>
                </div>

                {/* Simulated database log query block overlay */}
                {activeLogisticsTab !== 'none' && (
                  <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3 font-mono text-[11px] text-slate-600 animate-fade-in">
                    {activeLogisticsTab === 'inventory' && (
                      <>
                        <div className="font-bold text-[#0058be] uppercase text-[10px] border-b border-slate-200 pb-1 flex justify-between">
                          <span>FACILITY RAW INVENTORY</span>
                          <span>QTY</span>
                        </div>
                        <div className="flex justify-between"><span>Structural Steel Sheets</span><span className="font-bold">410 tons</span></div>
                        <div className="flex justify-between"><span>High-Grade Copper Coils</span><span className="font-bold">12,400 m</span></div>
                        <div className="flex justify-between"><span>Machined Bracket Units</span><span className="font-bold">814 units</span></div>
                        <div className="flex justify-between"><span>Raw Polymer Resin</span><span className="font-bold">5.8 tons</span></div>
                      </>
                    )}

                    {activeLogisticsTab === 'shipment' && (
                      <>
                        <div className="font-bold text-[#0058be] uppercase text-[10px] border-b border-slate-200 pb-1 flex justify-between">
                          <span>FREIGHT DISPATCH LIST</span>
                          <span>STATUS</span>
                        </div>
                        <div className="flex justify-between"><span>FR-4029 To Rotterdam</span><span className="text-emerald-600 font-bold">TRANSIT</span></div>
                        <div className="flex justify-between"><span>FR-4031 To Singapore</span><span className="text-amber-600 font-bold">DISPATCH</span></div>
                        <div className="flex justify-between"><span>FR-4032 To Antwerp</span><span className="text-slate-400 font-bold">PENDING</span></div>
                      </>
                    )}

                    {activeLogisticsTab === 'invoicing' && (
                      <>
                        <div className="font-bold text-[#0058be] uppercase text-[10px] border-b border-slate-200 pb-1 flex justify-between">
                          <span>BILLING LEDGER OUTSTANDING</span>
                          <span>FISCAL</span>
                        </div>
                        <div className="flex justify-between"><span>Doha Heavy Industries</span><span className="font-bold">$420,000</span></div>
                        <div className="flex justify-between"><span>Qatar Alloy Castings</span><span className="font-bold">$112,500</span></div>
                        <div className="flex justify-between"><span>EuroPort Terminal B</span><span className="font-bold">$18,400</span></div>
                      </>
                    )}

                    {activeLogisticsTab === 'analytics' && (
                      <>
                        <div className="font-bold text-[#0058be] uppercase text-[10px] border-b border-slate-200 pb-1 flex justify-between">
                          <span>REAL-TIME TELEMETRY PROBES</span>
                          <span>VALUE</span>
                        </div>
                        <div className="flex justify-between"><span>Thermal Probe 12</span><span className="font-bold text-amber-600">82.1°C</span></div>
                        <div className="flex justify-between"><span>Hydraulic Pressure P4</span><span className="font-bold text-emerald-600">142 Bar</span></div>
                        <div className="flex justify-between"><span>Rotor Vibration Coeff</span><span className="font-bold text-emerald-600">0.04 mm/s</span></div>
                        <div className="flex justify-between"><span>Static Load Bearing Index</span><span className="font-bold">94.2%</span></div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Activity Timeline Card */}
              <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs space-y-4">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block">Recent Activity</span>
                
                <div className="relative border-l-2 border-slate-100 pl-4 space-y-5">
                  {mActivities.map((act) => {
                    const isWarning = act.type === 'warning';
                    const isSuccess = act.type === 'success';
                    return (
                      <div key={act.id} className="relative">
                        
                        {/* Dot indicator */}
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-white ${
                          isWarning ? 'bg-[#F59E0B]' : isSuccess ? 'bg-[#10B981]' : 'bg-[#0058be]'
                        }`} />

                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-black font-sans leading-tight">{act.title}</h5>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>{act.time}</span>
                            <span>•</span>
                            <span className="uppercase">{act.unit}</span>
                          </div>

                          {act.details && (
                            <div className="mt-1.5 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-sans text-rose-800 leading-normal">
                              {act.details}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => triggerToast(`Audit log synced for project ${selectedProjFilter}`)}
                  className="w-full h-8 border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-[10px] font-bold text-slate-600 rounded-lg uppercase tracking-wider font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  View Full Audit Log
                </button>
              </div>

            </div>

            {/* Right Column: Production Site Location Map Card (5-span) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Production Site: Facility 04</span>
                  <MapPin className="w-4 h-4 text-[#0058be]" />
                </div>

                <div className="h-44 bg-slate-900 relative">
                  {/* Styled Map Background Representation */}
                  <div 
                    className="absolute inset-0 grayscale contrast-125 opacity-30" 
                    style={{ 
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAvZpTBZ7Bcp8bTPdlOLK3P2VkFFVPgWQF1FvtUqvl2LNbJbFeDMSIKHo_jfVasYpjAc4eNnvUEIxECd68AZnSiDblGvkhgI6jykDdiuw_aipYYJ0Rd6s81jokuigVrUoPR9NBd34nEt4N6_efeO6Ja1IqEBLCbMtS9iHxlMKvkTh6r_c2-PD-OtJWbLJY9Tng7vY_mEnr8OIVTJ_hmHghDE31jGhSappTu4QBdbd4lTclmjV5VykgvvpTokPtK1sKNXGGI_YqVns')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} 
                  />
                  
                  {/* Styled Map HUD Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute"></span>
                    <MapPin className="w-8 h-8 text-red-500 relative z-10" />
                    <div className="bg-black/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-lg mt-1 border border-slate-800 tracking-wider">
                      S-SITE 04
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-slate-600">Doha, Qatar</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Cloud className="w-3.5 h-3.5" /> 32°C Clear
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          THEME 2: FILM & CREATIVE MEDIA DASHBOARD
         ---------------------------------------------------- */}
      {dashboardTheme === 'creative' && (
        <div className="space-y-6">
          
          {/* Header Controls Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <nav className="flex text-[10px] text-slate-400 mb-1 gap-1 items-center font-mono uppercase tracking-wider">
                <span>Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-bold">Creative Media Divisions</span>
              </nav>
              <h2 className="text-2xl font-black tracking-tight text-black font-sans uppercase">
                {selectedProjFilter === 'all' ? 'Film Production Aggregate' : currentSelectedProject?.name || 'Project Dashboard'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {selectedProjFilter === 'all' 
                  ? 'Strategic overview of multi-unit cinematic and commercial ventures' 
                  : `Isolated project dashboard and financial analytics for ${currentSelectedProject?.name || 'selected project'}`}
              </p>
            </div>
          </div>

          {/* Aggregate warning banner */}
          {highRiskCategories.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 shadow-sm animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-xs uppercase tracking-wider font-sans text-amber-900">ERP Budget Overrun Warnings Detected</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed font-sans">
                  The following production departments have depleted <strong>&ge; 90%</strong> of their allocated capital. Immediate financial reallocation is recommended:
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {highRiskCategories.map(cat => {
                    const projName = projects.find(p => p.id === cat.projectId)?.name || 'Project';
                    const percent = Math.round((cat.spentAmount / cat.allocatedAmount) * 100);
                    return (
                      <span key={cat.id} className="text-[10px] bg-white border border-amber-200 px-2.5 py-1 rounded-md font-mono text-amber-800 font-bold">
                        {projName.split(':')[0]} &rarr; {cat.name} ({percent}%)
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aggregate Row stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Capital Under Management */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Capital Under Management</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">₹{totalERPPudget.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Authorized production limits
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-[#0058be]">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Aggregate Costs spent */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">Aggregate Direct Costs</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">₹{totalERPSpent.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} /> Synchronized with Firebase Firestore
                </span>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* 3. ERP Cash Burn ratio */}
            <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex flex-col gap-1.5 w-full pr-4">
                <span className="text-[10px] uppercase font-bold font-mono text-slate-400 tracking-wider">ERP Cash Burn Ratio</span>
                <h3 className="text-2xl font-black text-black font-sans mt-0.5">{burnRate.toFixed(1)}%</h3>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-200">
                  <div 
                    className="h-full bg-[#0058be] transition-all duration-500" 
                    style={{ width: `${Math.min(burnRate, 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Active Units list and Cost distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Film Projects List (7-span) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#0058be]" />
                <h3 className="font-bold text-black uppercase font-mono text-xs tracking-wider">Active Projects ({filteredProjects.length})</h3>
              </div>

              <div className="flex flex-col gap-4">
                {filteredProjects.map((p) => {
                  const projExpenses = expenses.filter(e => e.projectId === p.id);
                  const pSpent = projExpenses.reduce((acc, e) => acc + e.amount, 0);
                  const pRatio = p.totalBudget > 0 ? (pSpent / p.totalBudget) * 100 : 0;
                  
                  const getStatusTag = (status: string) => {
                    switch (status) {
                      case 'Pre-Production': return 'bg-amber-50 text-amber-700 border border-amber-200';
                      case 'Production': return 'bg-sky-50 text-sky-700 border border-sky-200';
                      case 'Post-Production': return 'bg-blue-50 text-blue-700 border border-blue-200';
                      case 'Released': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
                    }
                  };

                  return (
                    <div 
                      key={p.id} 
                      onClick={() => onSelectProject(p.id)}
                      className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#0058be] hover:shadow-sm transition-all duration-300 cursor-pointer flex flex-col gap-3 group relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 h-full w-1 bg-transparent group-hover:bg-[#0058be] transition-colors" />
                      
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase font-mono ${getStatusTag(p.status)}`}>
                            {p.status}
                          </span>
                          <h4 className="font-black text-black text-sm mt-2.5 group-hover:text-[#0058be] transition-colors font-sans">{p.name}</h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-[#0058be]" />
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2 pr-4">
                        {p.description}
                      </p>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                          <span className="text-slate-500">Spent: ₹{pSpent.toLocaleString()}</span>
                          <span className="text-slate-800">₹{p.totalBudget.toLocaleString()} Total</span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              pRatio >= 95 ? 'bg-rose-500' : pRatio >= 80 ? 'bg-amber-500' : 'bg-[#0058be]'
                            }`}
                            style={{ width: `${Math.min(pRatio, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono font-semibold uppercase mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Commenced: {p.startDate}
                          </span>
                          <span>{pRatio.toFixed(1)}% Consumed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Cost Distribution Matrix (5-span) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-[#0058be]" />
                <h3 className="font-bold text-black uppercase font-mono text-xs tracking-wider">Cost Distribution Matrix</h3>
              </div>

              <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-2xs flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    Direct cost allocations per film department compared with real-time transaction logs:
                  </p>

                  <div className="space-y-4 pt-1">
                    {categories
                      .filter(cat => selectedProjFilter === 'all' || cat.projectId === selectedProjFilter)
                      .reduce((acc, current) => {
                        const existing = acc.find(c => c.name === current.name);
                        if (existing) {
                          existing.allocatedAmount += current.allocatedAmount;
                          existing.spentAmount += current.spentAmount;
                        } else {
                          acc.push({ ...current });
                        }
                        return acc;
                      }, [] as BudgetCategory[])
                      .map((cat) => {
                        const ratio = cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0;
                        return (
                          <div key={cat.id} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-800 font-sans">{cat.name}</span>
                              <span className="font-mono text-slate-500 text-[10px] font-bold">
                                ₹{cat.spentAmount.toLocaleString()} / <span className="text-slate-300">₹{cat.allocatedAmount.toLocaleString()}</span>
                              </span>
                            </div>
                            
                            <div className="w-full h-4.5 bg-slate-100 border border-slate-200 rounded-md overflow-hidden relative flex items-center">
                              <div 
                                className={`h-full rounded-r transition-all duration-500 ${
                                  ratio >= 90 ? 'bg-rose-500' : ratio >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(ratio, 100)}%` }}
                              />
                              <span className="absolute right-2.5 text-[9px] font-mono font-bold text-slate-600 font-black">
                                {ratio.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-normal font-mono">
                  <span className="text-[#0058be] font-bold uppercase block mb-1">Firebase Real-Time Persistence:</span>
                  Transaction inputs logged in the ledger commit directly to Firebase Firestore, syncing seamlessly across connected sessions.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          OVERLAY MODAL: CREATE NEW VERSION DIALOG
         ---------------------------------------------------- */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full shadow-2xl animate-fade-in">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-black uppercase font-mono flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#0058be]" />
                  Create Budget Version
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Capture active system configurations into a baseline snapshot</p>
              </div>
              <button 
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-400 hover:text-black cursor-pointer text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewVersion} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Version Tag</label>
                <input 
                  type="text" 
                  value={newVerTag}
                  onChange={(e) => setNewVerTag(e.target.value)}
                  placeholder="e.g. v2.5_Draft"
                  className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Description</label>
                <textarea 
                  value={newVerDesc}
                  onChange={(e) => setNewVerDesc(e.target.value)}
                  placeholder="What changes does this version represent?"
                  className="w-full min-h-[70px] py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-sans px-3 focus:outline-none focus:border-[#0058be] resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Compiler/Author Name</label>
                <input 
                  type="text" 
                  value={newVerAuthor}
                  onChange={(e) => setNewVerAuthor(e.target.value)}
                  placeholder="Name"
                  className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 leading-normal font-mono">
                The snapshot will compile with the active total budget of: <strong className="text-black">₹{currentTotalBudget.toLocaleString()}</strong>.
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#0058be] hover:bg-[#004395] text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
                >
                  Confirm Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          OVERLAY MODAL: MODIFY MANUFACTURING PARAMETERS DIALOG
         ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-black uppercase font-mono flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#0058be]" />
                  Modify Industrial Parameters
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Configure live simulation metrics for Facility 04 heavy cycle #4829</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-black cursor-pointer text-xs font-mono font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <form onSubmit={handleSaveParameters} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Allocated Budget */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Allocated Budget ($)</label>
                  <input 
                    type="number" 
                    name="allocated" 
                    defaultValue={mBudgetAllocated} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 2. Spent Budget */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Current Spent ($)</label>
                  <input 
                    type="number" 
                    name="spent" 
                    defaultValue={mBudgetSpent} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 3. Current Phase */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Current Phase</label>
                  <input 
                    type="number" 
                    name="phase" 
                    defaultValue={mPhase} 
                    min={1} 
                    max={mTotalPhases}
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 4. Total Phases */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Total Cycle Phases</label>
                  <input 
                    type="number" 
                    name="totalPhases" 
                    defaultValue={mTotalPhases} 
                    min={1}
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 5. Days Behind */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Days Behind Schedule</label>
                  <input 
                    type="number" 
                    name="behind" 
                    defaultValue={mDaysBehind} 
                    min={0}
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 6. Active Personnel */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Personnel Count</label>
                  <input 
                    type="number" 
                    name="workforce" 
                    defaultValue={mWorkforce} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 7. Active Shifts */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Active Shifts</label>
                  <input 
                    type="number" 
                    name="shifts" 
                    defaultValue={mShiftsActive} 
                    min={1} 
                    max={4}
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 8. Average Yield */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Average Yield (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="yield" 
                    defaultValue={mAverageYield} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 9. Cycle Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Cycle Time (Hrs)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="cycle" 
                    defaultValue={mCycleTime} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

                {/* 10. Downtime */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase">Downtime (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="down" 
                    defaultValue={mDowntime} 
                    className="w-full h-9 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold px-3 focus:outline-none focus:border-[#0058be]" 
                  />
                </div>

              </div>

              {/* Daily Efficiency percentages sliders */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Daily Yield Percentages (%)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.keys(mDailyEfficiency).map((day) => (
                    <div key={day} className="space-y-1 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500">
                        <span>{day}</span>
                        <span>{mDailyEfficiency[day]}%</span>
                      </div>
                      <input 
                        type="range" 
                        name={`eff_${day}`} 
                        min="10" 
                        max="100" 
                        defaultValue={mDailyEfficiency[day]} 
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0058be]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-bold text-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#0058be] hover:bg-[#0058be]/95 text-white text-xs font-black rounded-lg cursor-pointer shadow-md"
                >
                  Apply Settings &amp; Log transaction
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
