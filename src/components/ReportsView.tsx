import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  FileText, 
  CheckCircle2, 
  Printer, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  Receipt, 
  Wallet, 
  PieChart, 
  ArrowUpRight,
  Layers,
  FileDown,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  TableProperties,
  Flame
} from 'lucide-react';
import { Project, BudgetCategory, Expense, Company } from '../types';
import BudgetVsActualChart from './BudgetVsActualChart';
import { exportProductionWorkbookXlsx, exportExecutivePdfReport, exportCsvFile } from '../services/exportEngine';
import ExportEngineModal from './ExportEngineModal';

interface ReportsViewProps {
  projects?: Project[];
  categories?: BudgetCategory[];
  expenses?: Expense[];
  selectedProjectId?: string;
  activeProject?: Project;
  activeCompany?: Company | { name: string; id?: string };
}

export default function ReportsView({
  projects = [],
  categories = [],
  expenses = [],
  selectedProjectId = '',
  activeProject,
  activeCompany
}: ReportsViewProps) {
  const [selectedReportType, setSelectedReportType] = useState<'master' | 'burnrate' | 'department' | 'vendor' | 'audit'>('master');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Filter project categories and expenses
  const currentProject = useMemo(() => {
    if (activeProject) return activeProject;
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId, activeProject]);

  const activeProjId = currentProject?.id || '';
  const cleanProjId = activeProjId.replace(/^(wp_|p_|proj_)/, '');

  const projectCategories = useMemo(() => {
    if (!activeProjId) return categories;
    return categories.filter(c => 
      !c.projectId || 
      c.projectId === activeProjId || 
      c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanProjId
    );
  }, [categories, activeProjId, cleanProjId]);

  const projectExpenses = useMemo(() => {
    if (!activeProjId) return expenses;
    return expenses.filter(e => 
      !e.projectId || 
      e.projectId === activeProjId || 
      e.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanProjId
    );
  }, [expenses, activeProjId, cleanProjId]);

  // Aggregate Metrics
  const totalApprovedBudget = useMemo(() => {
    return projectCategories.reduce((sum, c) => {
      if (typeof c.allocatedAmount === 'number' && c.allocatedAmount > 0) return sum + c.allocatedAmount;
      return sum + (c.subCategories || []).reduce((sAcc, sub) => {
        if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) return sAcc + sub.allocatedAmount;
        return sAcc + (sub.childCategories || []).reduce((cAcc, child) => {
          return cAcc + ((child.count || 0) * (child.rate || 0) * (child.shifts || 1));
        }, 0);
      }, 0);
    }, 0);
  }, [projectCategories]);

  const totalActualSpent = useMemo(() => {
    return projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [projectExpenses]);

  const remainingVariance = totalApprovedBudget - totalActualSpent;
  const burnRatePct = totalApprovedBudget > 0 ? (totalActualSpent / totalApprovedBudget) * 100 : 0;

  // Department breakdown
  const departmentBreakdowns = useMemo(() => {
    return projectCategories.map(cat => {
      const catAllocated = typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0 
        ? cat.allocatedAmount 
        : (cat.subCategories || []).reduce((s, sub) => s + (sub.allocatedAmount || 0), 0);
      
      const catSpent = projectExpenses
        .filter(e => e.categoryId === cat.id || e.categoryName === cat.name || (e as any).category === cat.name)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      const varAmt = catAllocated - catSpent;
      const pctUsed = catAllocated > 0 ? (catSpent / catAllocated) * 100 : 0;

      return {
        id: cat.id,
        name: cat.name,
        allocated: catAllocated,
        spent: catSpent,
        variance: varAmt,
        pctUsed: pctUsed
      };
    });
  }, [projectCategories, projectExpenses]);

  // Daily cumulative burn rate ledger for the selected project
  const dailyBurnLedger = useMemo(() => {
    const validExpenses = projectExpenses
      .filter(e => e.date && !isNaN(new Date(e.date).getTime()) && Number(e.amount) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dateMap: { [date: string]: { total: number; count: number; items: string[] } } = {};
    validExpenses.forEach(exp => {
      const dateKey = exp.date.substring(0, 10);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, count: 0, items: [] };
      }
      dateMap[dateKey].total += Number(exp.amount) || 0;
      dateMap[dateKey].count += 1;
      const title = exp.title || (exp as any).description || (exp as any).lineItem || 'Expense';
      if (dateMap[dateKey].items.length < 3) {
        dateMap[dateKey].items.push(title);
      }
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    return sortedDates.map((dateKey, idx) => {
      const item = dateMap[dateKey];
      cumulative += item.total;
      const variance = totalApprovedBudget - cumulative;
      const burnPct = totalApprovedBudget > 0 ? (cumulative / totalApprovedBudget) * 100 : 0;
      return {
        date: dateKey,
        dayNumber: idx + 1,
        dailySpend: item.total,
        cumulativeExpenses: cumulative,
        budgetedTotal: totalApprovedBudget,
        variance,
        burnPct,
        count: item.count,
        summary: item.items.join(', ')
      };
    });
  }, [projectExpenses, totalApprovedBudget]);

  // Instant Full Excel Workbook (.xlsx) Exporter
  const handleDownloadExcel = () => {
    try {
      setIsGeneratingExcel(true);
      exportProductionWorkbookXlsx({
        project: currentProject,
        company: activeCompany || { name: 'Production Company' },
        categories: projectCategories,
        expenses: projectExpenses,
        generatedBy: 'AI Studio Production Controller'
      });
      setPdfSuccessMessage('Multi-tab Excel Production Workbook (.xlsx) generated and downloaded successfully!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to export Excel:', err);
      alert(`Failed to export Excel: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  // Instant Executive PDF Exporter
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage(null);
      
      await exportExecutivePdfReport({
        project: currentProject,
        company: activeCompany || { name: 'Production Company' },
        categories: projectCategories,
        expenses: projectExpenses,
        generatedBy: 'AI Studio Production Controller'
      });

      setPdfSuccessMessage('Executive Production Cost Report (PDF) generated and downloaded successfully!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = (reportName: string) => {
    const projPrefix = (currentProject?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().substring(0, 10);
    
    if (selectedReportType === 'burnrate') {
      const headers = ['Date', 'Day Index', 'Daily Incurred Spend (INR)', 'Cumulative Expenses (INR)', 'Budgeted Total (INR)', 'Remaining Buffer (INR)', '% Budget Consumed', 'Status'];
      const rows = dailyBurnLedger.map(d => [
        d.date,
        `Day ${d.dayNumber}`,
        d.dailySpend,
        d.cumulativeExpenses,
        d.budgetedTotal,
        d.variance,
        `${d.burnPct.toFixed(1)}%`,
        d.cumulativeExpenses > d.budgetedTotal ? 'Over Budget' : d.burnPct > 80 ? 'Warning (>80%)' : 'On Track'
      ]);
      rows.push(['TOTALS / SUMMARY', '-', totalActualSpent, totalActualSpent, totalApprovedBudget, remainingVariance, `${burnRatePct.toFixed(1)}%`, remainingVariance < 0 ? 'Overrun' : 'Within Cap']);
      exportCsvFile(headers, rows, `${projPrefix}_Burn_Rate_Telemetry_${dateStr}.csv`);
    } else if (selectedReportType === 'master' || selectedReportType === 'department') {
      const headers = ['Department', 'Allocated Budget (INR)', 'Actual Spent (INR)', 'Variance (INR)', '% Utilized'];
      const rows = departmentBreakdowns.map(d => [
        d.name, d.allocated, d.spent, d.variance, `${d.pctUsed.toFixed(1)}%`
      ]);
      rows.push(['TOTAL', totalApprovedBudget, totalActualSpent, remainingVariance, `${burnRatePct.toFixed(1)}%`]);
      exportCsvFile(headers, rows, `${projPrefix}_${reportName}_${dateStr}.csv`);
    } else {
      const headers = ['Expense ID', 'Description', 'Category', 'Vendor', 'Amount (INR)', 'Date', 'Status', 'Payment Mode'];
      const rows = projectExpenses.map(e => [
        e.bookingNo || e.voucherNumber || e.id,
        e.title || (e as any).description || '',
        e.categoryName || (e as any).category || '',
        e.payee || (e as any).vendor || '',
        Number(e.amount) || 0,
        e.date || '',
        e.status || '',
        e.paymentMode || ''
      ]);
      exportCsvFile(headers, rows, `${projPrefix}_${reportName}_${dateStr}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100 animate-in fade-in duration-200">
      
      {/* Header Panel */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-900/60">
              {currentProject?.projectType || 'Show Workspace'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {currentProject?.name || 'All Active Projects'}
            </span>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            REPORTS &amp; FINANCIAL ANALYTICS ENGINE
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time multi-dimensional reports, department expense ledgers, burn rate analytics &amp; tax audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Tab Excel Workbook Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={isGeneratingExcel}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 border border-emerald-500/50"
            title="Download Complete Multi-Tab Production Excel Workbook (.xlsx)"
          >
            {isGeneratingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Excel Workbook (.xlsx)</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isGeneratingPdf
                ? 'bg-rose-800 text-slate-300 cursor-not-allowed opacity-80'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 border border-rose-500/50'
            }`}
            title="Download Executive Production Cost Statement (A4 PDF)"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-rose-200" />
                <span>Executive PDF</span>
              </>
            )}
          </button>

          {/* Open Full Export Engine Hub Modal */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
            title="Configure Custom Export Filters, Formats & Date Scopes"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-200" />
            <span>Export Hub</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {pdfSuccessMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Approved Budget</span>
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base md:text-lg font-black text-white font-mono">
            ₹{(totalApprovedBudget / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {projectCategories.length} Categories Allocated
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Actual Spend</span>
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base md:text-lg font-black text-rose-400 font-mono">
            ₹{(totalActualSpent / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {burnRatePct.toFixed(1)}% of Budget Consumed
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Remaining Buffer</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-base md:text-lg font-black font-mono ${remainingVariance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            ₹{(remainingVariance / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {remainingVariance >= 0 ? 'Within Allocation' : 'Budget Overrun Detected'}
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Logged Expenses</span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base md:text-lg font-black text-white font-mono">
            {projectExpenses.length} Records
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {projectExpenses.filter(e => e.status === 'Paid').length} Settled / {projectExpenses.filter(e => e.status === 'Pending').length} Pending
          </div>
        </div>
      </div>

      {/* Visual Telemetry: Recharts Budget vs Actual Spending Over Time */}
      <BudgetVsActualChart
        project={currentProject}
        totalBudget={totalApprovedBudget}
        expenses={projectExpenses}
        categories={projectCategories}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setSelectedReportType('master')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedReportType === 'master'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Project Master Summary</span>
        </button>

        <button
          onClick={() => setSelectedReportType('burnrate')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedReportType === 'burnrate'
              ? 'bg-rose-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Burn Rate &amp; Velocity</span>
        </button>

        <button
          onClick={() => setSelectedReportType('department')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedReportType === 'department'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Department Expense Breakdown</span>
        </button>

        <button
          onClick={() => setSelectedReportType('vendor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedReportType === 'vendor'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Vendor &amp; Payment Ledger</span>
        </button>

        <button
          onClick={() => setSelectedReportType('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedReportType === 'audit'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit &amp; Compliance Trail</span>
        </button>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Master Summary / Department View */}
        {(selectedReportType === 'master' || selectedReportType === 'department') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Department / Category</th>
                  <th className="py-2.5 px-3 text-right">Allocated Budget</th>
                  <th className="py-2.5 px-3 text-right">Actual Spent</th>
                  <th className="py-2.5 px-3 text-right">Remaining Variance</th>
                  <th className="py-2.5 px-3 text-center">Utilization</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {departmentBreakdowns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No budget categories found for this project. Add budget allocations in Budget Setup.
                    </td>
                  </tr>
                ) : (
                  departmentBreakdowns.map((dept) => {
                    const isOver = dept.variance < 0;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {dept.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          ₹{dept.allocated.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          ₹{dept.spent.toLocaleString('en-IN')}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${isOver ? 'text-rose-500' : 'text-emerald-400'}`}>
                          ₹{dept.variance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, dept.pctUsed)}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-300 w-10 text-right">
                              {dept.pctUsed.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                            isOver 
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-900/60' 
                              : dept.allocated > 0 
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60' 
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isOver ? 'Over Budget' : dept.allocated > 0 ? 'On Track' : 'Unallocated'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {departmentBreakdowns.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-800/90 border-t border-slate-700 text-xs font-black text-white">
                    <td className="py-3 px-3">TOTAL PRODUCTION SUMMARY</td>
                    <td className="py-3 px-3 text-right font-mono text-blue-400">
                      ₹{totalApprovedBudget.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      ₹{totalActualSpent.toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono ${remainingVariance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      ₹{remainingVariance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {burnRatePct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[9px] font-mono font-bold uppercase">
                        Active Master
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Burn Rate & Daily Cumulative Expenses View */}
        {selectedReportType === 'burnrate' && (
          <div className="flex flex-col">
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>Daily Cumulative Expense &amp; Burn Rate Ledger</span>
                    <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 bg-rose-950/60 rounded border border-rose-900/50">
                      {burnRatePct.toFixed(1)}% Consumed
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Detailed daily progression tracking cumulative expenses against the ₹{(totalApprovedBudget / 100000).toFixed(2)}L budget cap for {currentProject?.name || 'project'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleExportCSV('burn_rate_ledger')}
                className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
                title="Download CSV of Daily Burn Rate & Cumulative Totals"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Export Burn CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Timeline Date</th>
                    <th className="py-2.5 px-3 text-right">Daily Incurred</th>
                    <th className="py-2.5 px-3 text-right font-bold text-rose-400">Cumulative Expenses</th>
                    <th className="py-2.5 px-3 text-right font-bold text-blue-400">Budgeted Total</th>
                    <th className="py-2.5 px-3 text-right">Remaining Buffer</th>
                    <th className="py-2.5 px-3 text-center">% Consumed</th>
                    <th className="py-2.5 px-3 text-center">Pacing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dailyBurnLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No dated expense transactions found for this project yet.
                      </td>
                    </tr>
                  ) : (
                    dailyBurnLedger.map((day) => {
                      const isOver = day.cumulativeExpenses > day.budgetedTotal && day.budgetedTotal > 0;
                      const isHigh = day.burnPct > 80;
                      return (
                        <tr key={day.date} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span className="font-bold">{day.date}</span>
                              <span className="text-[10px] text-slate-500">Day {day.dayNumber}</span>
                            </div>
                            {day.summary && (
                              <div className="text-[10px] text-slate-500 truncate max-w-xs pl-3.5">
                                {day.count} voucher{day.count > 1 ? 's' : ''}: {day.summary}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-semibold">
                            ₹{day.dailySpend.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                            ₹{day.cumulativeExpenses.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-400">
                            ₹{day.budgetedTotal.toLocaleString('en-IN')}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${day.variance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {day.variance >= 0 ? `₹${day.variance.toLocaleString('en-IN')}` : `-₹${Math.abs(day.variance).toLocaleString('en-IN')}`}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(100, day.burnPct)}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-300 w-12 text-right">
                                {day.burnPct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              isOver 
                                ? 'bg-rose-950/80 text-rose-400 border border-rose-900/60' 
                                : isHigh 
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-900/60'
                                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60'
                            }`}>
                              {isOver ? 'Over Budget' : isHigh ? 'High Burn' : 'On Track'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {dailyBurnLedger.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-800/90 border-t border-slate-700 text-xs font-black text-white">
                      <td className="py-3 px-3">TOTAL PROJECT CUMULATIVE</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300">
                        ₹{totalActualSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">
                        ₹{totalActualSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-400">
                        ₹{totalApprovedBudget.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono ${remainingVariance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        ₹{remainingVariance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {burnRatePct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          remainingVariance >= 0 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {remainingVariance >= 0 ? 'Within Cap' : 'Budget Deficit'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
        {selectedReportType === 'vendor' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payee / Vendor</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {projectExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No expense records logged yet for this project.
                    </td>
                  </tr>
                ) : (
                  projectExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">{exp.date || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{exp.payee || (exp as any).vendor || (exp as any).paidTo || 'Direct Expense'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{exp.title || (exp as any).description || (exp as any).lineItem}</td>
                      <td className="py-2.5 px-3 text-slate-400">{exp.categoryName || (exp as any).category}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">{exp.paymentMode || 'Bank Transfer'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          exp.status === 'Paid' 
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60' 
                            : 'bg-amber-950/80 text-amber-400 border border-amber-900/60'
                        }`}>
                          {exp.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit & Compliance Trail */}
        {selectedReportType === 'audit' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Project Financial Audit Snapshot</span>
              <span className="text-[10px] font-mono text-slate-400">Sync: Live Firestore Cloud Storage</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Tax &amp; TDS Provision</div>
                <div className="text-sm font-bold text-white font-mono">10% Professional / 2% Contractor</div>
                <p className="text-[10px] text-slate-400">Calculated automatically on eligible vendor invoices.</p>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">3-Way PO Compliance</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">Active (PO + GRN + Invoice)</div>
                <p className="text-[10px] text-slate-400">Strict line-item verification required before disbursements.</p>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase font-mono">Audit Log Retention</div>
                <div className="text-sm font-bold text-blue-400 font-mono">Indefinite Immutable Logs</div>
                <p className="text-[10px] text-slate-400">Every voucher edit, approval, and override is recorded with timestamps.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* EXPORT ENGINE MODAL */}
      <ExportEngineModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projects={projects}
        activeProject={currentProject}
        selectedProjectId={activeProjId}
        categories={projectCategories}
        expenses={projectExpenses}
        activeCompany={activeCompany}
        defaultReportType={
          selectedReportType === 'master' ? 'master_cost' :
          selectedReportType === 'vendor' ? 'vendor_ledger' :
          selectedReportType === 'department' ? 'master_cost' : 'full_workbook'
        }
      />
    </div>
  );
}
