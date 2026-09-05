import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Check, 
  Calendar, 
  Filter, 
  Sparkles, 
  X, 
  Building2, 
  Wallet, 
  Receipt, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  TableProperties,
  ArrowDownToLine,
  SlidersHorizontal
} from 'lucide-react';
import { Project, BudgetCategory, Expense, Company } from '../types';
import { 
  exportProductionWorkbookXlsx, 
  exportExecutivePdfReport, 
  exportCsvFile,
  computeDepartmentSummaries,
  computeVendorSummaries,
  computeGstSummaries
} from '../services/exportEngine';

export interface ExportEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  activeProject?: Project;
  selectedProjectId?: string;
  categories?: BudgetCategory[];
  expenses?: Expense[];
  activeCompany?: Company | { name: string; id?: string };
  defaultReportType?: 'full_workbook' | 'master_cost' | 'expense_journal' | 'vendor_ledger' | 'gst_tax' | 'on_account';
  defaultFormat?: 'xlsx' | 'pdf' | 'csv';
}

export type ReportType = 
  | 'full_workbook' 
  | 'master_cost' 
  | 'expense_journal' 
  | 'vendor_ledger' 
  | 'gst_tax' 
  | 'on_account';

export type ExportFormat = 'xlsx' | 'pdf' | 'csv';

export const ExportEngineModal: React.FC<ExportEngineModalProps> = ({
  isOpen,
  onClose,
  projects = [],
  activeProject,
  selectedProjectId = '',
  categories = [],
  expenses = [],
  activeCompany,
  defaultReportType = 'full_workbook',
  defaultFormat = 'xlsx'
}) => {
  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(defaultFormat);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [includeSignatureBlocks, setIncludeSignatureBlocks] = useState<boolean>(true);

  // Current project resolution
  const currentProject = useMemo(() => {
    if (activeProject) return activeProject;
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [activeProject, projects, selectedProjectId]);

  const activeProjId = currentProject?.id || '';
  const cleanProjId = activeProjId.replace(/^(wp_|p_|proj_)/, '');

  // Filter Categories for this project
  const projectCategories = useMemo(() => {
    if (!activeProjId) return categories;
    return categories.filter(c => 
      !c.projectId || 
      c.projectId === activeProjId || 
      c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanProjId
    );
  }, [categories, activeProjId, cleanProjId]);

  // Filter Expenses for this project
  const projectExpenses = useMemo(() => {
    if (!activeProjId) return expenses;
    return expenses.filter(e => 
      !e.projectId || 
      e.projectId === activeProjId || 
      e.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanProjId
    );
  }, [expenses, activeProjId, cleanProjId]);

  // Apply Granular Modal Filters to Expenses
  const filteredExpenses = useMemo(() => {
    let result = [...projectExpenses];

    // Department / Category filter
    if (selectedDeptId !== 'all') {
      result = result.filter(e => e.categoryId === selectedDeptId || e.categoryName === selectedDeptId);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(e => (e.status || e.paymentStatus || 'Paid').toLowerCase() === statusFilter.toLowerCase());
    }

    // Date range filter
    if (dateFilter === 'this_month') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${yr}-${mo}`;
      result = result.filter(e => (e.date || '').startsWith(prefix));
    } else if (dateFilter === 'last_30_days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      result = result.filter(e => (e.date || '') >= cutoffStr);
    } else if (dateFilter === 'custom') {
      if (customStartDate) {
        result = result.filter(e => (e.date || '') >= customStartDate);
      }
      if (customEndDate) {
        result = result.filter(e => (e.date || '') <= customEndDate);
      }
    }

    return result;
  }, [projectExpenses, selectedDeptId, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Compute metrics
  const deptSummaries = useMemo(() => {
    return computeDepartmentSummaries(projectCategories, filteredExpenses);
  }, [projectCategories, filteredExpenses]);

  const vendorSummaries = useMemo(() => {
    return computeVendorSummaries(filteredExpenses);
  }, [filteredExpenses]);

  const gstSummaries = useMemo(() => {
    return computeGstSummaries(filteredExpenses);
  }, [filteredExpenses]);

  const totalSanctionedBudget = useMemo(() => {
    return deptSummaries.reduce((sum, d) => sum + d.allocated, 0);
  }, [deptSummaries]);

  const totalActualSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalVariance = totalSanctionedBudget - totalActualSpent;
  const burnPct = totalSanctionedBudget > 0 ? (totalActualSpent / totalSanctionedBudget) * 100 : 0;

  if (!isOpen) return null;

  // Handle Export Action
  const handleExecuteExport = async () => {
    setIsExporting(true);
    setSuccessToast(null);

    try {
      const exportOptions = {
        project: currentProject,
        company: activeCompany || { name: 'Production Company' },
        categories: projectCategories,
        expenses: filteredExpenses,
        generatedBy: 'AI Studio Production Controller'
      };

      const projPrefix = (currentProject?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().substring(0, 10);

      // Execute based on format and report type
      if (exportFormat === 'xlsx') {
        if (reportType === 'full_workbook' || reportType === 'master_cost') {
          exportProductionWorkbookXlsx(exportOptions);
        } else if (reportType === 'expense_journal') {
          // Export specific expenses sheet
          const headers = [
            'Voucher No', 'Date', 'Payee', 'Designation', 'Category', 'Subcategory', 
            'Payment Mode', 'Base Amount', 'GST Tax', 'TDS Deduction', 'Total Amount', 'Status', 'Invoice No', 'Notes'
          ];
          const rows = filteredExpenses.map(e => [
            e.bookingNo || e.voucherNumber || e.id,
            e.date || '',
            e.payee || '',
            e.designation || '',
            e.categoryName || '',
            e.subCategoryName || '',
            e.paymentMode || 'Bank Transfer',
            Number(e.baseAmount) || Number(e.amount) || 0,
            Number(e.gstAmount) || 0,
            Number(e.tdsAmount) || 0,
            Number(e.amount) || 0,
            e.status || e.paymentStatus || 'Paid',
            e.invoiceNumber || '',
            e.notes || e.title || ''
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_Expense_Journal_${dateStr}.csv`);
        } else if (reportType === 'vendor_ledger') {
          const headers = ['Vendor Name', 'GSTIN', 'PAN', 'Invoices Count', 'Taxable Base (INR)', 'GST Tax (INR)', 'Total Amount (INR)', 'Paid (INR)', 'Outstanding (INR)', 'Last Invoice Date'];
          const rows = vendorSummaries.map(v => [
            v.vendorName, v.gstin || 'Unregistered', v.pan || 'N/A', v.invoiceCount, v.totalBaseAmount, v.totalGstAmount, v.totalAmount, v.paidAmount, v.outstandingAmount, v.lastInvoiceDate || ''
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_Vendor_Ledger_${dateStr}.csv`);
        } else if (reportType === 'gst_tax') {
          const headers = ['GST Rate Slab', 'Rate Description', 'Bills Count', 'Taxable Value (INR)', 'CGST (INR)', 'SGST (INR)', 'IGST (INR)', 'Total GST ITC (INR)', 'Total Gross (INR)'];
          const rows = gstSummaries.map(g => [
            `${g.rate}%`, g.rateLabel, g.transactionCount, g.taxableBase, g.cgstAmount, g.sgstAmount, g.igstAmount, g.totalTax, g.totalGross
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_GST_Tax_Report_${dateStr}.csv`);
        } else if (reportType === 'on_account') {
          const onAccountList = filteredExpenses.filter(e => e.paymentType === 'On Account' || e.paymentType === 'Advance' || e.onAccountDetails);
          const headers = ['Voucher No', 'Date', 'Float Holder', 'Category', 'Advance Given (INR)', 'Adjusted (INR)', 'Returnable Balance (INR)', 'Due Date', 'Status', 'Purpose'];
          const rows = onAccountList.map(e => {
            const given = Number(e.amount) || 0;
            const adjusted = e.onAccountDetails?.adjustedAmount || 0;
            const outstanding = e.onAccountDetails?.outstandingAmount ?? (given - adjusted);
            return [
              e.bookingNo || e.voucherNumber || e.id,
              e.onAccountDetails?.givenDate || e.date || '',
              e.onAccountDetails?.holderName || e.payee,
              e.categoryName || 'Advance Float',
              given,
              adjusted,
              outstanding,
              e.onAccountDetails?.settlementDueDate || 'Within 7 Days',
              e.onAccountDetails?.settlementStatus || (outstanding <= 0 ? 'Settled' : 'Open'),
              e.onAccountDetails?.purpose || e.notes || e.title
            ];
          });
          exportCsvFile(headers, rows, `${projPrefix}_Advance_Floats_${dateStr}.csv`);
        }
        setSuccessToast(`Successfully generated and downloaded Excel Workbook for ${currentProject?.name || 'Project'}!`);
      } else if (exportFormat === 'pdf') {
        await exportExecutivePdfReport(exportOptions);
        setSuccessToast(`Successfully generated Executive PDF Cost Statement!`);
      } else if (exportFormat === 'csv') {
        if (reportType === 'master_cost' || reportType === 'full_workbook') {
          const headers = ['Category Code', 'Department / Budget Head', 'Sanctioned Budget (INR)', 'Actual Expenses (INR)', 'Variance (INR)', 'Burn %'];
          const rows = deptSummaries.map(d => [
            d.code || '', d.name, d.allocated, d.spent, d.variance, `${d.pctUsed.toFixed(1)}%`
          ]);
          rows.push(['TOTAL', 'GRAND TOTAL ALL DEPARTMENTS', totalSanctionedBudget, totalActualSpent, totalVariance, `${burnPct.toFixed(1)}%`]);
          exportCsvFile(headers, rows, `${projPrefix}_Master_Cost_Report_${dateStr}.csv`);
        } else if (reportType === 'vendor_ledger') {
          const headers = ['Vendor Name', 'GSTIN', 'PAN', 'Invoices Count', 'Taxable Base (INR)', 'GST Tax (INR)', 'Total Amount (INR)', 'Paid (INR)', 'Outstanding (INR)', 'Last Invoice Date'];
          const rows = vendorSummaries.map(v => [
            v.vendorName, v.gstin || 'Unregistered', v.pan || 'N/A', v.invoiceCount, v.totalBaseAmount, v.totalGstAmount, v.totalAmount, v.paidAmount, v.outstandingAmount, v.lastInvoiceDate || ''
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_Vendor_Ledger_${dateStr}.csv`);
        } else if (reportType === 'gst_tax') {
          const headers = ['GST Rate Slab', 'Rate Description', 'Bills Count', 'Taxable Value (INR)', 'CGST (INR)', 'SGST (INR)', 'IGST (INR)', 'Total GST ITC (INR)', 'Total Gross (INR)'];
          const rows = gstSummaries.map(g => [
            `${g.rate}%`, g.rateLabel, g.transactionCount, g.taxableBase, g.cgstAmount, g.sgstAmount, g.igstAmount, g.totalTax, g.totalGross
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_GST_Tax_Report_${dateStr}.csv`);
        } else {
          // Standard Expenses CSV
          const headers = [
            'Voucher No', 'Date', 'Payee', 'Designation', 'Category', 'Subcategory', 
            'Payment Mode', 'Base Amount', 'GST Rate', 'GST Tax', 'TDS Deduction', 'Total Gross', 'Status', 'Invoice Number', 'Notes'
          ];
          const rows = filteredExpenses.map(e => [
            e.bookingNo || e.voucherNumber || e.id,
            e.date || '',
            e.payee || '',
            e.designation || '',
            e.categoryName || '',
            e.subCategoryName || '',
            e.paymentMode || 'Bank Transfer',
            Number(e.baseAmount) || Number(e.amount) || 0,
            Number(e.gstRate) || 0,
            Number(e.gstAmount) || 0,
            Number(e.tdsAmount) || 0,
            Number(e.amount) || 0,
            e.status || e.paymentStatus || 'Paid',
            e.invoiceNumber || '',
            e.notes || e.title || ''
          ]);
          exportCsvFile(headers, rows, `${projPrefix}_Expenses_${dateStr}.csv`);
        }
        setSuccessToast(`CSV Data file successfully downloaded!`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Error generating export: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const REPORT_OPTIONS: { id: ReportType; title: string; desc: string; icon: any; recommended: boolean; badge?: string }[] = [
    {
      id: 'full_workbook',
      title: 'Full Production Excel Workbook (.xlsx)',
      desc: 'All 6 modules in one tabbed file: Executive Summary, Master Cost Sheet, Detailed Expenses, Vendor Ledger, GST ITC & On-Account Floats.',
      icon: FileSpreadsheet,
      recommended: true,
      badge: 'RECOMMENDED • MULTI-SHEET'
    },
    {
      id: 'master_cost',
      title: 'Master Cost Report (MCR) & Variance',
      desc: 'Hierarchical department breakdown showing Sanctioned Budget, Actual Costs Incurred, Committed POs, Variance, and % Burn.',
      icon: TableProperties,
      recommended: false,
      badge: 'FINANCIAL AUDIT'
    },
    {
      id: 'expense_journal',
      title: 'Detailed Expense Journal & Voucher Register',
      desc: 'Line-by-line transactions with Voucher #, Payee, Category, Base Amount, GST rate, TDS deductions, Invoice details, and approvals.',
      icon: Receipt,
      recommended: false
    },
    {
      id: 'vendor_ledger',
      title: 'Vendor & Payee Reconciliation Statement',
      desc: 'Aggregated vendor balances, invoice volumes, total disbursements, outstanding payables, and GSTIN/PAN registrations.',
      icon: Building2,
      recommended: false
    },
    {
      id: 'gst_tax',
      title: 'GST Input Tax Credit (ITC) & Tax Splits',
      desc: 'Government tax compliance schedule with 0%, 5%, 12%, 18%, 28% brackets, CGST/SGST/IGST breakdown, and B2B vendor bills.',
      icon: Wallet,
      recommended: false
    },
    {
      id: 'on_account',
      title: 'On-Account Advance Float & Settlements',
      desc: 'Cash float tracking for line producers, department heads, and crew with advances given, bill adjustments, and pending returns.',
      icon: Layers,
      recommended: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md shadow-emerald-900/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">Production Export &amp; Reporting Engine</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  XLSX • PDF • CSV
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate production workbooks, executive cost reports, tax schedules &amp; vendor statements for <strong>{currentProject?.name || 'Project'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TOAST SUCCESS NOTIFICATION */}
          {successToast && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-xl flex items-center gap-3 text-emerald-200 shadow-md animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1 text-xs font-semibold">{successToast}</div>
              <button 
                onClick={() => setSuccessToast(null)}
                className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. REPORT TYPE SELECTOR */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Select Report or Workbook Module
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = reportType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setReportType(opt.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-950/50' 
                        : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white leading-snug">{opt.title}</span>
                        </div>
                        {opt.badge && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-8">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-800/60">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. FORMAT SELECTOR */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Target Export Format
            </label>

            <div className="grid grid-cols-3 gap-3">
              {/* XLSX */}
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  exportFormat === 'xlsx'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${exportFormat === 'xlsx' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Excel Workbook
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">.XLSX</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Multi-tab with formulas &amp; widths</div>
                </div>
              </button>

              {/* PDF */}
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  exportFormat === 'pdf'
                    ? 'bg-rose-950/60 border-rose-500 text-white shadow-md'
                    : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${exportFormat === 'pdf' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Executive PDF
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">.PDF</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Print-ready with sign-off blocks</div>
                </div>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                    : 'bg-slate-850/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${exportFormat === 'csv' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'}`}>
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Spreadsheet CSV
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">.CSV</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Raw UTF-8 with BOM data dump</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. GRANULAR FILTERS */}
          <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                Filter Scope &amp; Scope Customization
              </span>
              <span className="text-[11px] text-slate-400">
                Matches: <strong className="text-white">{filteredExpenses.length}</strong> transactions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date Scope */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Time Period</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="all">All Transactions (Full Production)</option>
                  <option value="this_month">Current Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Department / Budget Head</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="all">All Departments ({projectCategories.length})</option>
                  {projectCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Paid">Paid &amp; Cleared</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending Approval</option>
                  <option value="Draft">Drafts</option>
                </select>
              </div>
            </div>

            {/* Custom Date Inputs if selected */}
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. LIVE SNAPSHOT STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">Sanctioned Budget</span>
              <span className="text-sm font-extrabold text-blue-300">₹{totalSanctionedBudget.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">Filtered Incurred Spend</span>
              <span className="text-sm font-extrabold text-white">₹{totalActualSpent.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">Net Variance</span>
              <span className={`text-sm font-extrabold ${totalVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-slate-850/60 border border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">Active Vendors</span>
              <span className="text-sm font-extrabold text-purple-300">{vendorSummaries.length} Registered</span>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling Export...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download {exportFormat.toUpperCase()} File</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExportEngineModal;
