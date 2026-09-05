import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Project, BudgetCategory, Expense, Company } from '../types';

export interface ExportEngineOptions {
  project?: Project;
  company?: Company | { name: string; id?: string };
  categories: BudgetCategory[];
  expenses: Expense[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  filterCategories?: string[];
  filterStatus?: string[];
  filterPaymentMode?: string[];
  reportTitle?: string;
  includeAuditTrail?: boolean;
  generatedBy?: string;
}

export interface DepartmentSummaryItem {
  id: string;
  code?: string;
  name: string;
  allocated: number;
  spent: number;
  variance: number;
  pctUsed: number;
  subCategoryCount?: number;
}

export interface VendorSummaryItem {
  vendorName: string;
  gstin?: string;
  pan?: string;
  invoiceCount: number;
  totalBaseAmount: number;
  totalGstAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  lastInvoiceDate?: string;
}

export interface GstSummaryItem {
  rate: number;
  rateLabel: string;
  transactionCount: number;
  taxableBase: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalGross: number;
}

// -------------------------------------------------------------
// HELPER CALCULATORS
// -------------------------------------------------------------

export function computeDepartmentSummaries(
  categories: BudgetCategory[],
  expenses: Expense[]
): DepartmentSummaryItem[] {
  return categories.map(cat => {
    let catAllocated = 0;
    if (typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0) {
      catAllocated = cat.allocatedAmount;
    } else {
      catAllocated = (cat.subCategories || []).reduce((sum, sub) => {
        if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) {
          return sum + sub.allocatedAmount;
        }
        return sum + (sub.childCategories || []).reduce((cSum, child) => {
          return cSum + ((child.count || 0) * (child.rate || 0) * (child.shifts || 1));
        }, 0);
      }, 0);
    }

    const catSpent = expenses
      .filter(e => e.categoryId === cat.id || e.categoryName === cat.name || (e as any).category === cat.name)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const variance = catAllocated - catSpent;
    const pctUsed = catAllocated > 0 ? (catSpent / catAllocated) * 100 : 0;

    return {
      id: cat.id,
      code: cat.code || '',
      name: cat.name,
      allocated: catAllocated,
      spent: catSpent,
      variance: variance,
      pctUsed: pctUsed,
      subCategoryCount: cat.subCategories?.length || 0
    };
  });
}

export function computeVendorSummaries(expenses: Expense[]): VendorSummaryItem[] {
  const vendorMap = new Map<string, VendorSummaryItem>();

  expenses.forEach(e => {
    const rawName = (e.payee || (e as any).vendor || 'Unspecified Vendor').trim();
    if (!rawName) return;

    const amt = Number(e.amount) || 0;
    const base = Number(e.baseAmount) || amt;
    const gst = Number(e.gstAmount) || 0;
    const isPaid = e.paymentStatus === 'Paid' || e.status === 'Paid' || e.status === 'Approved';

    if (!vendorMap.has(rawName)) {
      vendorMap.set(rawName, {
        vendorName: rawName,
        gstin: e.gstin || '',
        pan: e.panNumber || '',
        invoiceCount: 0,
        totalBaseAmount: 0,
        totalGstAmount: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        lastInvoiceDate: e.invoiceDate || e.date
      });
    }

    const v = vendorMap.get(rawName)!;
    v.invoiceCount += 1;
    v.totalBaseAmount += base;
    v.totalGstAmount += gst;
    v.totalAmount += amt;
    if (isPaid) {
      v.paidAmount += amt;
    } else {
      v.outstandingAmount += amt;
    }
    if (e.gstin && !v.gstin) v.gstin = e.gstin;
    if (e.panNumber && !v.pan) v.pan = e.panNumber;
    if (e.date && (!v.lastInvoiceDate || e.date > v.lastInvoiceDate)) {
      v.lastInvoiceDate = e.date;
    }
  });

  return Array.from(vendorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function computeGstSummaries(expenses: Expense[]): GstSummaryItem[] {
  const rateBuckets: Record<number, GstSummaryItem> = {
    0: { rate: 0, rateLabel: '0% (Exempt/Nil)', transactionCount: 0, taxableBase: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0, totalGross: 0 },
    5: { rate: 5, rateLabel: '5% (Catering/Transport)', transactionCount: 0, taxableBase: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0, totalGross: 0 },
    12: { rate: 12, rateLabel: '12% (Job Work/Print)', transactionCount: 0, taxableBase: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0, totalGross: 0 },
    18: { rate: 18, rateLabel: '18% (Standard Services/Equip)', transactionCount: 0, taxableBase: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0, totalGross: 0 },
    28: { rate: 28, rateLabel: '28% (Luxury/Special)', transactionCount: 0, taxableBase: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0, totalGross: 0 }
  };

  expenses.forEach(e => {
    const rawRate = typeof e.gstRate === 'number' ? e.gstRate : 0;
    const rate = [0, 5, 12, 18, 28].includes(rawRate) ? rawRate : (rawRate > 0 ? 18 : 0);
    const amt = Number(e.amount) || 0;
    const base = Number(e.baseAmount) || (amt / (1 + rate / 100));
    const tax = Number(e.gstAmount) || (amt - base);
    const isIgst = e.gstType === 'IGST' || (!e.gstType && false);

    const bucket = rateBuckets[rate] || rateBuckets[0];
    bucket.transactionCount += 1;
    bucket.taxableBase += base;
    bucket.totalTax += tax;
    bucket.totalGross += amt;

    if (isIgst) {
      bucket.igstAmount += tax;
    } else {
      bucket.cgstAmount += tax / 2;
      bucket.sgstAmount += tax / 2;
    }
  });

  return Object.values(rateBuckets).filter(b => b.transactionCount > 0 || b.rate === 0 || b.rate === 18);
}

// -------------------------------------------------------------
// 1. EXCEL (.XLSX) MULTI-TAB WORKBOOK EXPORTER
// -------------------------------------------------------------

export function exportProductionWorkbookXlsx({
  project,
  company,
  categories,
  expenses,
  generatedBy = 'Production ERP Controller'
}: ExportEngineOptions): void {
  const wb = XLSX.utils.book_new();
  const projectName = project?.name || 'Production_Project';
  const companyName = company?.name || 'Film Production Company';
  const timestamp = new Date().toISOString().substring(0, 10);

  const deptSummaries = computeDepartmentSummaries(categories, expenses);
  const vendorSummaries = computeVendorSummaries(expenses);
  const gstSummaries = computeGstSummaries(expenses);

  const totalSanctioned = deptSummaries.reduce((sum, d) => sum + d.allocated, 0);
  const totalActual = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalVariance = totalSanctioned - totalActual;
  const burnPct = totalSanctioned > 0 ? (totalActual / totalSanctioned) * 100 : 0;

  // ---------------- SHEET 1: EXECUTIVE SUMMARY ----------------
  const summaryData = [
    ['PRODUCTION FINANCIAL REPORT & EXECUTIVE COST SUMMARY'],
    ['Generated via AI Studio Production ERP Engine', ''],
    ['Date & Time:', new Date().toLocaleString()],
    ['Generated By:', generatedBy],
    [''],
    ['PROJECT METADATA', ''],
    ['Project Title:', projectName],
    ['Project Code:', project?.projectCode || (project as any)?.code || 'PROJ-001'],
    ['Production Company:', companyName],
    ['Project Type / Format:', project?.projectType?.toUpperCase() || 'FEATURE FILM'],
    ['Production Status:', project?.status || 'Active Production'],
    [''],
    ['OVERALL FINANCIAL KPIS', 'AMOUNT (INR)', 'METRIC %'],
    ['Sanctioned Budget Allocation:', totalSanctioned, '100.0%'],
    ['Actual Incurred / Paid Costs:', totalActual, `${burnPct.toFixed(2)}%`],
    ['Net Budget Variance (+Surplus / -Overrun):', totalVariance, `${(100 - burnPct).toFixed(2)}%`],
    ['Budget Health Status:', burnPct > 100 ? 'OVERRUN (Alert)' : burnPct > 85 ? 'WATCHLIST (Tight)' : 'HEALTHY (<85%)', ''],
    ['Total Recorded Expense Vouchers:', expenses.length, ''],
    ['Total Registered Vendors / Payees:', vendorSummaries.length, ''],
    ['Total Department Budget Heads:', categories.length, ''],
    [''],
    ['DEPARTMENT BUDGET SUMMARY SNAPSHOT', 'ALLOCATED (INR)', 'ACTUAL SPENT (INR)', 'VARIANCE (INR)', 'BURN %']
  ];

  deptSummaries.forEach(d => {
    summaryData.push([d.name, d.allocated as any, d.spent as any, d.variance as any, `${d.pctUsed.toFixed(1)}%`]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // ---------------- SHEET 2: MASTER COST REPORT (MCR) ----------------
  const mcrData = [
    ['MASTER PRODUCTION COST REPORT (MCR) - HIERARCHICAL BREAKDOWN'],
    [`Project: ${projectName}`, `Company: ${companyName}`, `Timestamp: ${new Date().toISOString()}`],
    [''],
    ['Code', 'Department / Category', 'Subcategory / Item', 'Sanctioned Budget (₹)', 'Actual Expenses (₹)', 'Committed (₹)', 'Variance (₹)', 'Burn %', 'Status']
  ];

  categories.forEach(cat => {
    const catSpent = expenses
      .filter(e => e.categoryId === cat.id || e.categoryName === cat.name)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const catAlloc = cat.allocatedAmount || (cat.subCategories || []).reduce((s, sub) => s + (sub.allocatedAmount || 0), 0);
    const catVar = catAlloc - catSpent;
    const catBurn = catAlloc > 0 ? (catSpent / catAlloc) * 100 : 0;
    const catStatus = catBurn > 100 ? 'Overrun' : catBurn >= 90 ? 'Warning' : 'On Track';

    mcrData.push([
      cat.code || '',
      cat.name.toUpperCase(),
      `[${cat.subCategories?.length || 0} Subcategories]`,
      catAlloc as any,
      catSpent as any,
      catSpent as any,
      catVar as any,
      `${catBurn.toFixed(1)}%`,
      catStatus
    ]);

    // Subcategories breakdown
    (cat.subCategories || []).forEach(sub => {
      const subSpent = expenses
        .filter(e => (e.subCategoryId === sub.id || e.subCategoryName === sub.name) && (e.categoryId === cat.id || e.categoryName === cat.name))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const subAlloc = sub.allocatedAmount || (sub.childCategories || []).reduce((c, ch) => c + ((ch.count || 0) * (ch.rate || 0) * (ch.shifts || 1)), 0);
      const subVar = subAlloc - subSpent;
      const subBurn = subAlloc > 0 ? (subSpent / subAlloc) * 100 : 0;

      mcrData.push([
        sub.code || '',
        `  ↳ ${cat.name}`,
        sub.name,
        subAlloc as any,
        subSpent as any,
        subSpent as any,
        subVar as any,
        `${subBurn.toFixed(1)}%`,
        subBurn > 100 ? 'Overrun' : 'Normal'
      ]);
    });
  });

  // MCR Totals Row
  mcrData.push(['']);
  mcrData.push([
    'TOTAL',
    'ALL PRODUCTION DEPARTMENTS',
    'GRAND TOTAL',
    totalSanctioned as any,
    totalActual as any,
    totalActual as any,
    totalVariance as any,
    `${burnPct.toFixed(1)}%`,
    burnPct > 100 ? 'OVERRUN' : 'APPROVED'
  ]);

  const wsMcr = XLSX.utils.aoa_to_sheet(mcrData);
  wsMcr['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMcr, 'Master Cost Report');

  // ---------------- SHEET 3: DETAILED EXPENSE JOURNAL ----------------
  const expenseHeaders = [
    'Voucher No',
    'Date',
    'Payee / Vendor',
    'Designation / Role',
    'Category',
    'Subcategory',
    'Budget Item',
    'Payment Type',
    'Payment Mode',
    'Base Amount (₹)',
    'GST Rate (%)',
    'GST Type',
    'GST Tax (₹)',
    'TDS Section',
    'TDS Rate (%)',
    'TDS Deduction (₹)',
    'Total Gross (₹)',
    'Payment Status',
    'Approval Status',
    'Invoice Number',
    'Invoice Date',
    'Vendor GSTIN',
    'Vendor PAN',
    'Created By',
    'Approved By',
    'Notes / Purpose'
  ];

  const expenseRows = expenses.map(e => [
    e.bookingNo || e.voucherNumber || e.id,
    e.date || '',
    e.payee || (e as any).vendor || '',
    e.designation || '',
    e.categoryName || '',
    e.subCategoryName || '',
    e.budgetItemName || '',
    e.paymentType || 'Purchase',
    e.paymentMode || 'Bank Transfer',
    Number(e.baseAmount) || Number(e.amount) || 0,
    Number(e.gstRate) || 0,
    e.gstType || 'CGST_SGST',
    Number(e.gstAmount) || 0,
    e.tdsSection || 'NONE',
    Number(e.tdsRate) || 0,
    Number(e.tdsAmount) || 0,
    Number(e.amount) || 0,
    e.paymentStatus || e.status || 'Paid',
    e.approvalStatus || 'Approved',
    e.invoiceNumber || '',
    e.invoiceDate || '',
    e.gstin || '',
    e.panNumber || '',
    e.createdBy || '',
    e.approvedBy || '',
    e.notes || e.title || ''
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet([
    ['PRODUCTION EXPENSES JOURNAL & TRANSACTION REGISTER'],
    [`Project: ${projectName}`, `Total Records: ${expenses.length}`, `Total Value: ₹${totalActual.toLocaleString('en-IN')}`],
    [''],
    expenseHeaders,
    ...expenseRows
  ]);

  wsExpenses['!cols'] = [
    { wch: 16 }, // Voucher
    { wch: 13 }, // Date
    { wch: 28 }, // Payee
    { wch: 20 }, // Designation
    { wch: 24 }, // Category
    { wch: 24 }, // Subcategory
    { wch: 20 }, // Item
    { wch: 14 }, // Payment Type
    { wch: 14 }, // Mode
    { wch: 16 }, // Base
    { wch: 12 }, // GST %
    { wch: 12 }, // GST Type
    { wch: 14 }, // GST Tax
    { wch: 12 }, // TDS Sec
    { wch: 10 }, // TDS %
    { wch: 14 }, // TDS Deduct
    { wch: 18 }, // Total Gross
    { wch: 14 }, // Payment Status
    { wch: 14 }, // Approval Status
    { wch: 18 }, // Invoice No
    { wch: 13 }, // Invoice Date
    { wch: 18 }, // GSTIN
    { wch: 14 }, // PAN
    { wch: 22 }, // Created By
    { wch: 22 }, // Approved By
    { wch: 35 }  // Notes
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Journal');

  // ---------------- SHEET 4: VENDOR & PAYEE LEDGER ----------------
  const vendorHeaders = [
    'Vendor / Payee Name',
    'GSTIN',
    'PAN Number',
    'Vouchers Count',
    'Taxable Base (₹)',
    'Total GST (₹)',
    'Total Invoiced (₹)',
    'Total Paid (₹)',
    'Outstanding Balance (₹)',
    'Last Transaction Date'
  ];

  const vendorRows = vendorSummaries.map(v => [
    v.vendorName,
    v.gstin || 'Unregistered',
    v.pan || 'N/A',
    v.invoiceCount,
    v.totalBaseAmount,
    v.totalGstAmount,
    v.totalAmount,
    v.paidAmount,
    v.outstandingAmount,
    v.lastInvoiceDate || ''
  ]);

  const wsVendors = XLSX.utils.aoa_to_sheet([
    ['VENDOR & PAYEE SUMMARY LEDGER'],
    [`Project: ${projectName}`, `Active Vendors: ${vendorSummaries.length}`],
    [''],
    vendorHeaders,
    ...vendorRows
  ]);

  wsVendors['!cols'] = [
    { wch: 32 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendor Ledger');

  // ---------------- SHEET 5: GST INPUT TAX CREDIT (ITC) ----------------
  const gstHeaders = [
    'GST Rate Slab',
    'Rate Classification',
    'Bills Count',
    'Taxable Value (₹)',
    'CGST Input (₹)',
    'SGST Input (₹)',
    'IGST Input (₹)',
    'Total GST ITC (₹)',
    'Total Gross Value (₹)'
  ];

  const gstRows = gstSummaries.map(g => [
    `${g.rate}%`,
    g.rateLabel,
    g.transactionCount,
    g.taxableBase,
    g.cgstAmount,
    g.sgstAmount,
    g.igstAmount,
    g.totalTax,
    g.totalGross
  ]);

  const totalGstBase = gstSummaries.reduce((s, g) => s + g.taxableBase, 0);
  const totalGstTax = gstSummaries.reduce((s, g) => s + g.totalTax, 0);
  const totalGstGross = gstSummaries.reduce((s, g) => s + g.totalGross, 0);

  gstRows.push([
    'TOTAL',
    'ALL GST TAX BRACKETS',
    gstSummaries.reduce((s, g) => s + g.transactionCount, 0),
    totalGstBase,
    gstSummaries.reduce((s, g) => s + g.cgstAmount, 0),
    gstSummaries.reduce((s, g) => s + g.sgstAmount, 0),
    gstSummaries.reduce((s, g) => s + g.igstAmount, 0),
    totalGstTax,
    totalGstGross
  ]);

  const wsGst = XLSX.utils.aoa_to_sheet([
    ['GST INPUT TAX CREDIT (ITC) & TAX BREAKDOWN STATEMENT'],
    [`Project: ${projectName}`, `Tax Period: FY ${new Date().getFullYear()}`],
    [''],
    gstHeaders,
    ...gstRows
  ]);

  wsGst['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGst, 'GST & Tax ITC');

  // ---------------- SHEET 6: ON-ACCOUNT & ADVANCES REGISTER ----------------
  const onAccountExpenses = expenses.filter(e => e.paymentType === 'On Account' || e.paymentType === 'Advance' || e.onAccountDetails);
  const onAccountHeaders = [
    'Voucher No',
    'Date Given',
    'Float Holder / Payee',
    'Category',
    'Advance Given (₹)',
    'Adjusted To Date (₹)',
    'Returnable Balance (₹)',
    'Due Date',
    'Settlement Status',
    'Purpose / Description'
  ];

  const onAccountRows = onAccountExpenses.map(e => {
    const given = Number(e.amount) || 0;
    const adjusted = e.onAccountDetails?.adjustedAmount || 0;
    const returned = e.onAccountDetails?.returnedAmount || 0;
    const outstanding = e.onAccountDetails?.outstandingAmount ?? (given - adjusted - returned);
    return [
      e.bookingNo || e.voucherNumber || e.id,
      e.onAccountDetails?.givenDate || e.date || '',
      e.onAccountDetails?.holderName || e.payee,
      e.categoryName || 'Production Float',
      given,
      adjusted,
      outstanding,
      e.onAccountDetails?.settlementDueDate || 'Within 7 Days',
      e.onAccountDetails?.settlementStatus || (outstanding <= 0 ? 'Settled' : 'Open'),
      e.onAccountDetails?.purpose || e.notes || e.title
    ];
  });

  const wsOnAccount = XLSX.utils.aoa_to_sheet([
    ['ON-ACCOUNT ADVANCE FLOAT & SETTLEMENT REGISTER'],
    [`Project: ${projectName}`, `Active Floats: ${onAccountExpenses.length}`],
    [''],
    onAccountHeaders,
    ...onAccountRows
  ]);

  wsOnAccount['!cols'] = [
    { wch: 16 },
    { wch: 13 },
    { wch: 26 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOnAccount, 'On-Account Floats');

  // Trigger File Download
  const sanitizedTitle = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedTitle}_Production_Financial_Workbook_${timestamp}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// -------------------------------------------------------------
// 2. CSV EXPORT UTILITY (UTF-8 WITH BOM)
// -------------------------------------------------------------

export function exportCsvFile(
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  // UTF-8 BOM prefix (\uFEFF) ensures Excel correctly displays Indian Rupees & unicode
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 3. EXECUTIVE PRODUCTION COST REPORT PDF (MULTI-PAGE)
// -------------------------------------------------------------

export async function exportExecutivePdfReport({
  project,
  company,
  categories,
  expenses,
  generatedBy = 'Production Accountant / ERP Controller'
}: ExportEngineOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const projectName = project?.name || 'Production Master';
  const companyName = company?.name || 'Film Production Company';
  const deptSummaries = computeDepartmentSummaries(categories, expenses);
  const totalSanctioned = deptSummaries.reduce((sum, d) => sum + d.allocated, 0);
  const totalActual = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalVariance = totalSanctioned - totalActual;
  const burnPct = totalSanctioned > 0 ? (totalActual / totalSanctioned) * 100 : 0;

  const formatINR = (val: number) => {
    return 'Rs. ' + Math.round(val).toLocaleString('en-IN');
  };

  const formatLakhs = (val: number) => {
    return 'Rs. ' + (val / 100000).toFixed(2) + ' Lakhs';
  };

  // Helper to add new page if needed
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 15) {
      addPageFooter();
      pdf.addPage();
      currentY = margin;
      addPageHeader(false);
    }
  };

  // Header Banner
  const addPageHeader = (isFirstPage: boolean) => {
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, isFirstPage ? 30 : 16, 'F');
    pdf.setFillColor(59, 130, 246); // blue-500 line
    pdf.rect(0, isFirstPage ? 30 : 16, pageWidth, 1.2, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(isFirstPage ? 14 : 9);
    pdf.text(isFirstPage ? 'PRODUCTION COST & VARIANCE STATEMENT' : `${projectName.toUpperCase()} — COST REPORT`, margin, isFirstPage ? 13 : 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184); // slate-400
    if (isFirstPage) {
      pdf.text(`${companyName} | Sanctioned vs. Actual Expenditure Audit`, margin, 20);
    }

    // Right header info
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    pdf.setFontSize(7);
    pdf.setTextColor(203, 213, 225);
    pdf.text(`Date: ${dateStr}`, pageWidth - margin, isFirstPage ? 12 : 9, { align: 'right' });
    pdf.text(`Doc Ref: FIN-${Date.now().toString().slice(-6)}`, pageWidth - margin, isFirstPage ? 18 : 13, { align: 'right' });

    currentY = isFirstPage ? 36 : 22;
  };

  // Footer with page numbering
  const addPageFooter = () => {
    const totalPages = (pdf.internal as any).getNumberOfPages();
    const curPage = totalPages; // current active page
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated by: ${generatedBy} | Confidential Production Document`, margin, pageHeight - 6);
    pdf.text(`Page ${curPage}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  // START PAGE 1
  addPageHeader(true);

  // Project Info Card
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(projectName, margin + 4, currentY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  const codeStr = project?.projectCode || (project as any)?.code || 'PROJ-001';
  const typeStr = project?.projectType?.toUpperCase() || 'FEATURE FILM';
  pdf.text(`Code: ${codeStr} | Format: ${typeStr} | Status: ${project?.status || 'Active'}`, margin + 4, currentY + 11.5);

  // Status Badge
  const isHealthy = burnPct < 85 && totalVariance >= 0;
  const isWatch = burnPct >= 85 && burnPct <= 100;
  if (isHealthy) {
    pdf.setFillColor(220, 252, 231);
    pdf.setTextColor(22, 101, 52);
    pdf.roundedRect(pageWidth - margin - 35, currentY + 3.5, 31, 9, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('HEALTHY (<85%)', pageWidth - margin - 19.5, currentY + 9.5, { align: 'center' });
  } else if (isWatch) {
    pdf.setFillColor(254, 243, 199);
    pdf.setTextColor(146, 64, 14);
    pdf.roundedRect(pageWidth - margin - 35, currentY + 3.5, 31, 9, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('WATCHLIST (85-100%)', pageWidth - margin - 19.5, currentY + 9.5, { align: 'center' });
  } else {
    pdf.setFillColor(254, 226, 226);
    pdf.setTextColor(153, 27, 27);
    pdf.roundedRect(pageWidth - margin - 35, currentY + 3.5, 31, 9, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('OVERRUN (>100%)', pageWidth - margin - 19.5, currentY + 9.5, { align: 'center' });
  }

  currentY += 21;

  // 4 Top KPI Cards
  const kpiW = (contentWidth - 6) / 4;
  const kpiH = 15;

  const kpis = [
    { title: 'SANCTIONED BUDGET', val: formatLakhs(totalSanctioned), sub: formatINR(totalSanctioned), color: [30, 64, 175] },
    { title: 'ACTUAL SPENT', val: formatLakhs(totalActual), sub: `${burnPct.toFixed(1)}% of Budget`, color: [15, 23, 42] },
    { title: 'NET VARIANCE', val: formatLakhs(Math.abs(totalVariance)), sub: totalVariance >= 0 ? 'Surplus Balance' : 'Overrun Amount', color: totalVariance >= 0 ? [5, 150, 105] : [225, 29, 72] },
    { title: 'EXPENSE VOUCHERS', val: `${expenses.length} Records`, sub: `${categories.length} Departments`, color: [109, 40, 217] }
  ];

  kpis.forEach((k, idx) => {
    const kX = margin + idx * (kpiW + 2);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(kX, currentY, kpiW, kpiH, 1, 1, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(k.title, kX + 2.5, currentY + 4);

    pdf.setFontSize(8.5);
    pdf.setTextColor(k.color[0], k.color[1], k.color[2]);
    pdf.text(k.val, kX + 2.5, currentY + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(k.sub, kX + 2.5, currentY + 13);
  });

  currentY += 20;

  // Department Variance Table Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('DEPARTMENT-WISE COST ALLOCATION & VARIANCE', margin, currentY);
  currentY += 4.5;

  // Table Headers
  const colX = {
    code: margin,
    name: margin + 14,
    alloc: margin + 80,
    spent: margin + 115,
    var: margin + 145,
    burn: margin + 172
  };

  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, currentY, contentWidth, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(51, 65, 85);

  pdf.text('CODE', colX.code + 2, currentY + 4.2);
  pdf.text('DEPARTMENT / CATEGORY', colX.name, currentY + 4.2);
  pdf.text('BUDGET (INR)', colX.alloc + 24, currentY + 4.2, { align: 'right' });
  pdf.text('ACTUAL (INR)', colX.spent + 24, currentY + 4.2, { align: 'right' });
  pdf.text('VARIANCE (INR)', colX.var + 22, currentY + 4.2, { align: 'right' });
  pdf.text('BURN %', colX.burn + 12, currentY + 4.2, { align: 'right' });

  currentY += 7;

  // Table Rows
  deptSummaries.forEach((d, idx) => {
    ensureSpace(6);

    const isEven = idx % 2 === 0;
    if (isEven) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, currentY - 1, contentWidth, 5.5, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(d.code || `D${idx + 1}`, colX.code + 2, currentY + 3);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    const truncName = d.name.length > 36 ? d.name.substring(0, 34) + '..' : d.name;
    pdf.text(truncName, colX.name, currentY + 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(formatINR(d.allocated), colX.alloc + 24, currentY + 3, { align: 'right' });
    pdf.text(formatINR(d.spent), colX.spent + 24, currentY + 3, { align: 'right' });

    if (d.variance >= 0) {
      pdf.setTextColor(22, 101, 52);
      pdf.text('+' + formatINR(d.variance), colX.var + 22, currentY + 3, { align: 'right' });
    } else {
      pdf.setTextColor(190, 18, 60);
      pdf.text('-' + formatINR(Math.abs(d.variance)), colX.var + 22, currentY + 3, { align: 'right' });
    }

    pdf.setFont('helvetica', 'bold');
    if (d.pctUsed > 100) {
      pdf.setTextColor(190, 18, 60);
    } else if (d.pctUsed >= 85) {
      pdf.setTextColor(180, 83, 9);
    } else {
      pdf.setTextColor(30, 64, 175);
    }
    pdf.text(`${d.pctUsed.toFixed(1)}%`, colX.burn + 12, currentY + 3, { align: 'right' });

    currentY += 5.5;
  });

  // Table Grand Total Row
  ensureSpace(8);
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, currentY, contentWidth, 6.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(15, 23, 42);
  pdf.text('GRAND TOTAL', colX.name, currentY + 4.5);
  pdf.text(formatINR(totalSanctioned), colX.alloc + 24, currentY + 4.5, { align: 'right' });
  pdf.text(formatINR(totalActual), colX.spent + 24, currentY + 4.5, { align: 'right' });
  
  if (totalVariance >= 0) {
    pdf.setTextColor(22, 101, 52);
    pdf.text('+' + formatINR(totalVariance), colX.var + 22, currentY + 4.5, { align: 'right' });
  } else {
    pdf.setTextColor(190, 18, 60);
    pdf.text('-' + formatINR(Math.abs(totalVariance)), colX.var + 22, currentY + 4.5, { align: 'right' });
  }

  pdf.setTextColor(15, 23, 42);
  pdf.text(`${burnPct.toFixed(1)}%`, colX.burn + 12, currentY + 4.5, { align: 'right' });

  currentY += 12;

  // TOP VENDORS SUMMARY ON NEXT SECTION / PAGE
  ensureSpace(35);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TOP VENDOR DISBURSEMENTS & GST ITC SUMMARY', margin, currentY);
  currentY += 4.5;

  const vendorSummaries = computeVendorSummaries(expenses).slice(0, 5);
  const gstSummaries = computeGstSummaries(expenses);

  // 2 Side-by-Side Summary Boxes
  const boxW = (contentWidth - 4) / 2;
  const boxH = 28;

  // Box 1: Top Vendors
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, currentY, boxW, boxH, 1, 1, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('TOP 5 VENDORS BY VALUE', margin + 3, currentY + 4);

  let vY = currentY + 8;
  vendorSummaries.forEach((v, idx) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(30, 41, 59);
    const vName = `${idx + 1}. ${v.vendorName.substring(0, 24)}`;
    pdf.text(vName, margin + 3, vY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatINR(v.totalAmount), margin + boxW - 3, vY, { align: 'right' });
    vY += 4.2;
  });

  // Box 2: GST Summary
  const box2X = margin + boxW + 4;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(box2X, currentY, boxW, boxH, 1, 1, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('GST INPUT TAX CREDIT (ITC) BREAKDOWN', box2X + 3, currentY + 4);

  let gY = currentY + 8;
  gstSummaries.forEach(g => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`GST @ ${g.rate}% (${g.transactionCount} bills)`, box2X + 3, gY);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Tax: ${formatINR(g.totalTax)}`, box2X + boxW - 3, gY, { align: 'right' });
    gY += 4.2;
  });

  currentY += boxH + 8;

  // Signatures Section
  ensureSpace(28);
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('AUTHORIZATION & AUDIT SIGN-OFFS', margin, currentY);
  currentY += 6;

  const sigW = (contentWidth - 6) / 3;
  const roles = [
    { title: 'PRODUCTION ACCOUNTANT', sub: 'Verified Invoices & Tax Splits' },
    { title: 'LINE PRODUCER / PM', sub: 'Operational Budget Sign-off' },
    { title: 'EXECUTIVE PRODUCER', sub: 'Commercial Sanction Approved' }
  ];

  roles.forEach((r, idx) => {
    const sX = margin + idx * (sigW + 3);
    pdf.setDrawColor(148, 163, 184);
    pdf.line(sX, currentY + 9, sX + sigW, currentY + 9);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(r.title, sX, currentY + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(r.sub, sX, currentY + 16.5);
  });

  // Apply footer to all pages
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated by: ${generatedBy} | Confidential Production Document`, margin, pageHeight - 6);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Trigger Download
  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Cost_Report_${new Date().toISOString().substring(0, 10)}.pdf`;
  pdf.save(filename);
}

// -------------------------------------------------------------
// 4. PRINTABLE PRODUCTION PAYMENT VOUCHER PDF
// -------------------------------------------------------------

export function exportSingleVoucherPdf(
  expense: Expense,
  project?: Project,
  company?: Company | { name: string }
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const vNo = expense.bookingNo || expense.voucherNumber || expense.id;
  const projName = project?.name || 'Production Master';
  const compName = company?.name || 'Production Company';

  const formatINR = (val: number) => 'Rs. ' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // Border frame
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, margin, contentWidth, 267);

  // Inner decorative border
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.2);
  pdf.rect(margin + 2, margin + 2, contentWidth - 4, 263);

  // Top Header Banner
  pdf.setFillColor(15, 23, 42);
  pdf.rect(margin + 2, margin + 2, contentWidth - 4, 22, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('PRODUCTION DISBURSEMENT & EXPENSE VOUCHER', pageWidth / 2, margin + 11, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`${compName.toUpperCase()} • ${projName.toUpperCase()}`, pageWidth / 2, margin + 18, { align: 'center' });

  currentY = margin + 30;

  // Voucher Meta Grid
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin + 5, currentY, contentWidth - 10, 22, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('VOUCHER NO:', margin + 8, currentY + 6);
  pdf.setFontSize(10);
  pdf.setTextColor(30, 64, 175);
  pdf.text(vNo, margin + 34, currentY + 6);

  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('DATE:', margin + 110, currentY + 6);
  pdf.setTextColor(15, 23, 42);
  pdf.text(expense.date || new Date().toISOString().substring(0, 10), margin + 124, currentY + 6);

  pdf.setTextColor(71, 85, 105);
  pdf.text('PAYMENT TYPE:', margin + 8, currentY + 14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(expense.paymentType || 'Purchase', margin + 36, currentY + 14);

  pdf.setTextColor(71, 85, 105);
  pdf.text('PAYMENT MODE:', margin + 110, currentY + 14);
  pdf.setTextColor(15, 23, 42);
  pdf.text(expense.paymentMode || 'Bank Transfer', margin + 140, currentY + 14);

  currentY += 28;

  // Payee & Classification Details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('PAYEE / VENDOR & ACCOUNTING CLASSIFICATION', margin + 5, currentY);
  currentY += 4;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin + 5, currentY, contentWidth - 10, 36, 'FD');

  const fields = [
    { label: 'Payee / Vendor Name:', val: expense.payee || 'Unspecified', x: margin + 8, y: currentY + 6 },
    { label: 'Designation / Role:', val: expense.designation || 'Vendor / Contractor', x: margin + 105, y: currentY + 6 },
    { label: 'Budget Department:', val: expense.categoryName || 'General Production', x: margin + 8, y: currentY + 14 },
    { label: 'Subcategory / Item:', val: expense.subCategoryName || 'Line Item', x: margin + 105, y: currentY + 14 },
    { label: 'Vendor GSTIN:', val: expense.gstin || 'Unregistered', x: margin + 8, y: currentY + 22 },
    { label: 'Vendor PAN:', val: expense.panNumber || 'N/A', x: margin + 105, y: currentY + 22 },
    { label: 'Invoice Reference:', val: expense.invoiceNumber ? `${expense.invoiceNumber} (Dated: ${expense.invoiceDate || 'N/A'})` : 'Cash Receipt / Voucher', x: margin + 8, y: currentY + 30 }
  ];

  fields.forEach(f => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(f.label, f.x, f.y);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(f.val, f.x + 36, f.y);
  });

  currentY += 42;

  // Financial Breakdown Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('FINANCIAL TAX SPLIT & NET PAYABLE', margin + 5, currentY);
  currentY += 4;

  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin + 5, currentY, contentWidth - 10, 6, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(51, 65, 85);
  pdf.text('PARTICULARS / ACCOUNT HEAD', margin + 8, currentY + 4.2);
  pdf.text('RATE / BASIS', margin + 110, currentY + 4.2);
  pdf.text('AMOUNT (INR)', margin + contentWidth - 12, currentY + 4.2, { align: 'right' });

  currentY += 7;

  const baseAmt = Number(expense.baseAmount) || Number(expense.amount) || 0;
  const gstRate = Number(expense.gstRate) || 0;
  const gstAmt = Number(expense.gstAmount) || 0;
  const tdsAmt = Number(expense.tdsAmount) || 0;
  const grossAmt = Number(expense.amount) || (baseAmt + gstAmt);
  const netPay = grossAmt - tdsAmt;

  const finRows = [
    { name: `Taxable Base Amount (${expense.title || expense.categoryName || 'Service/Material'})`, basis: 'Direct Cost', amt: formatINR(baseAmt) },
    { name: `Goods & Services Tax (GST - ${expense.gstType || 'CGST+SGST'})`, basis: `${gstRate}% GST Rate`, amt: formatINR(gstAmt) },
    { name: 'Total Gross Invoiced Amount', basis: 'Base + GST', amt: formatINR(grossAmt) },
    { name: `TDS Deduction (Sec ${expense.tdsSection || 'NONE'})`, basis: `${expense.tdsRate || 0}% TDS Rate`, amt: `-${formatINR(tdsAmt)}` }
  ];

  finRows.forEach(r => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text(r.name, margin + 8, currentY + 4);
    pdf.text(r.basis, margin + 110, currentY + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.text(r.amt, margin + contentWidth - 12, currentY + 4, { align: 'right' });
    currentY += 6;
  });

  // Net Total Box
  pdf.setFillColor(240, 253, 244); // emerald-50
  pdf.setDrawColor(34, 197, 94); // emerald-500
  pdf.rect(margin + 5, currentY, contentWidth - 10, 8, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(22, 101, 52);
  pdf.text('NET DISBURSEMENT AMOUNT:', margin + 8, currentY + 5.5);
  pdf.setFontSize(10);
  pdf.text(formatINR(netPay), margin + contentWidth - 12, currentY + 5.5, { align: 'right' });

  currentY += 14;

  // Notes & Purpose Box
  if (expense.notes || expense.title) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin + 5, currentY, contentWidth - 10, 16, 1, 1, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text('PURPOSE / NARRATION:', margin + 8, currentY + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    const noteLines = pdf.splitTextToSize(expense.notes || expense.title || '', contentWidth - 16);
    pdf.text(noteLines, margin + 8, currentY + 9);

    currentY += 21;
  }

  // Signatures Section (3 Roles)
  currentY = margin + 225;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin + 5, currentY, margin + contentWidth - 5, currentY);
  currentY += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('AUTHORIZATION & PAYMENT RECEIPT SIGNATURES', margin + 5, currentY);
  currentY += 16;

  const sigColW = (contentWidth - 20) / 3;
  const sigBlocks = [
    { title: 'CASHIER / PREPARED BY', sub: expense.createdBy || 'Accountant' },
    { title: 'APPROVED BY PM / EP', sub: expense.approvedBy || 'Production Controller' },
    { title: 'RECEIVED BY (PAYEE SIGN)', sub: expense.payee }
  ];

  sigBlocks.forEach((b, idx) => {
    const sX = margin + 5 + idx * (sigColW + 5);
    pdf.setDrawColor(148, 163, 184);
    pdf.line(sX, currentY, sX + sigColW, currentY);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(15, 23, 42);
    pdf.text(b.title, sX, currentY + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text(b.sub, sX, currentY + 7.5);
  });

  // Footer Note
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`System Generated Voucher: ${vNo} | Timestamp: ${new Date().toISOString()}`, pageWidth / 2, margin + 262, { align: 'center' });

  pdf.save(`Voucher_${vNo}_${expense.payee.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
