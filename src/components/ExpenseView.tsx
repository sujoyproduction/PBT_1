import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  BudgetCategory, 
  Expense, 
  Company, 
  ExpenseAttachment,
  OnAccountEntry,
  Vendor,
  PurchaseOrder
} from '../types';
import { subscribeDSRs, subscribeVendors, subscribePurchaseOrders } from '../services/firebaseService';
import { AIReceiptOCRModal } from './AIReceiptOCRModal';
import { ExtractedReceiptData } from '../services/receiptOcrService';
import { exportProductionWorkbookXlsx, exportSingleVoucherPdf, exportCsvFile } from '../services/exportEngine';
import ExportEngineModal from './ExportEngineModal';
import { generateNextSerialInvoiceNumber } from '../utils/invoiceUtils';
import { generateStandardCategoriesForProject } from '../data';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Paperclip, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  User, 
  Briefcase, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Check, 
  UploadCloud, 
  ArrowRight,
  RotateCcw,
  Building,
  ShieldAlert,
  Info,
  Percent,
  Receipt,
  Film,
  Fuel,
  Utensils,
  Truck,
  Sparkles,
  Zap,
  FileSpreadsheet,
  FileDown,
  Loader2,
  Wallet,
  Coins,
  BarChart3,
  FileCheck,
  Building2
} from 'lucide-react';

interface ExpenseViewProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  projects: Project[];
  selectedProjectId: string;
  activeCompany?: Company;
  userEmail: string;
  userRole?: string;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  activeSubTab?: string;
  onNavigateSubTab?: (subTab: string) => void;
  vendors?: Vendor[];
  purchaseOrders?: PurchaseOrder[];
}

const EXPENSE_SUB_TABS = [
  { id: 'all-expenses', name: 'All Expenses', icon: Receipt },
  { id: 'book-expense', name: 'Book Expense', icon: Plus },
  { id: 'tds-tax', name: 'TDS & Tax Register', icon: Percent },
  { id: 'expense-drafts', name: 'Expense Drafts', icon: FileText },
  { id: 'pending-approval', name: 'Pending Approval', icon: Clock },
  { id: 'approved-expenses', name: 'Approved Expenses', icon: CheckCircle },
  { id: 'on-account', name: 'On Account', icon: Wallet },
  { id: 'reimbursements', name: 'Reimbursements', icon: Coins },
  { id: 'uncleared-advances', name: 'Uncleared Advances', icon: AlertTriangle },
  { id: 'expense-reports', name: 'Expense Reports', icon: BarChart3 }
];

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  categories,
  projects,
  selectedProjectId,
  activeCompany,
  userEmail,
  userRole = 'Producer',
  onSaveExpense,
  onDeleteExpense,
  activeSubTab: externalSubTab,
  onNavigateSubTab,
  vendors: propVendors,
  purchaseOrders: propPurchaseOrders
}) => {
  // Live Vendor and PO sync
  const [liveVendors, setLiveVendors] = useState<Vendor[]>(propVendors || []);
  const [livePurchaseOrders, setLivePurchaseOrders] = useState<PurchaseOrder[]>(propPurchaseOrders || []);

  useEffect(() => {
    const unsubVendors = subscribeVendors((vList) => {
      if (Array.isArray(vList)) setLiveVendors(vList);
    });
    const unsubPOs = subscribePurchaseOrders((poList) => {
      if (Array.isArray(poList)) setLivePurchaseOrders(poList);
    });
    return () => {
      unsubVendors();
      unsubPOs();
    };
  }, []);

  const allVendors = useMemo(() => {
    return propVendors && propVendors.length > 0 ? propVendors : liveVendors;
  }, [propVendors, liveVendors]);

  const allPurchaseOrders = useMemo(() => {
    return propPurchaseOrders && propPurchaseOrders.length > 0 ? propPurchaseOrders : livePurchaseOrders;
  }, [propPurchaseOrders, livePurchaseOrders]);

  const isTabValid = (tab?: string) => Boolean(tab && EXPENSE_SUB_TABS.some(t => t.id === tab));
  const [internalSubTab, setInternalSubTab] = useState<string>(() => {
    if (isTabValid(externalSubTab)) return externalSubTab!;
    return 'all-expenses';
  });

  useEffect(() => {
    if (isTabValid(externalSubTab)) {
      setInternalSubTab(externalSubTab!);
    }
  }, [externalSubTab]);

  const currentSubTab = internalSubTab;

  const handleExpenseSubTabClick = (tabId: string) => {
    setInternalSubTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
    if (tabId === 'book-expense') {
      openNewBookDrawer();
    } else if (tabId === 'tds-tax') {
      setActiveTab('tds_tax');
      setFilterApprovalStatus('');
    } else if (tabId === 'expense-drafts') {
      setActiveTab('all');
      setFilterApprovalStatus('Draft');
    } else if (tabId === 'pending-approval') {
      setActiveTab('all');
      setFilterApprovalStatus('Pending Approval');
    } else if (tabId === 'approved-expenses') {
      setActiveTab('all');
      setFilterApprovalStatus('Approved');
    } else if (tabId === 'on-account') {
      setActiveTab('on_account');
    } else if (tabId === 'reimbursements') {
      setActiveTab('reimbursement');
    } else if (tabId === 'uncleared-advances') {
      setActiveTab('uncleared_advances');
    } else if (tabId === 'expense-reports') {
      setActiveTab('reports');
    } else if (tabId === 'all-expenses') {
      setActiveTab('all');
      setFilterApprovalStatus('');
    }
  };

  // Helper for resilient project ID matching across prefix conventions
  const matchesProjectId = (entityProjId?: string, targetProjId?: string) => {
    if (!targetProjId) return true;
    if (!entityProjId) return false;
    if (entityProjId === targetProjId) return true;
    const cleanEntity = entityProjId.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase();
    const cleanTarget = targetProjId.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase();
    return cleanEntity === cleanTarget;
  };

  // Current active project
  const currentProject = useMemo(() => {
    if (!selectedProjectId) return projects[0];
    return projects.find(p => matchesProjectId(p.id, selectedProjectId)) || projects[0];
  }, [projects, selectedProjectId]);

  // Active company name
  const companyName = activeCompany?.companyName || currentProject?.companyName || 'SVF Entertainment Pvt. Ltd.';
  const projectName = currentProject?.name || 'All Projects';

  // Filter project-specific categories (with dynamic 20-category Cooking Show fallback)
  const projectCategories = useMemo(() => {
    if (!selectedProjectId) {
      if (categories && categories.length > 0) return categories;
      return generateStandardCategoriesForProject('p_cooking_show', 'Cooking Show');
    }
    const filtered = (categories || []).filter(c => matchesProjectId(c.projectId, selectedProjectId));
    if (filtered.length > 0) return filtered;
    return generateStandardCategoriesForProject(selectedProjectId, currentProject?.name || 'Cooking Show');
  }, [categories, selectedProjectId, currentProject]);

  // Filter project-specific POs
  const projectPurchaseOrders = useMemo(() => {
    if (!selectedProjectId) return allPurchaseOrders;
    return allPurchaseOrders.filter(p => matchesProjectId(p.projectId, selectedProjectId));
  }, [allPurchaseOrders, selectedProjectId]);

  // Filter project-specific expenses
  const projectExpenses = useMemo(() => {
    if (!selectedProjectId) return expenses;
    return expenses.filter(e => matchesProjectId(e.projectId, selectedProjectId));
  }, [expenses, selectedProjectId]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'on_account' | 'reimbursement' | 'uncleared_advances' | 'tds_tax' | 'dsr_expenses' | 'reports'>('all');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterBudgetItem, setFilterBudgetItem] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('');
  const [filterPaymentAccount, setFilterPaymentAccount] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Drawer & Modal States
  const [isBookDrawerOpen, setIsBookDrawerOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDownloadingVoucherPdf, setIsDownloadingVoucherPdf] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [printingVoucherExpense, setPrintingVoucherExpense] = useState<Expense | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Expense | null>(null);

  // Uncleared On Account Modal/Warning trigger
  const [unclearedPayeeModal, setUnclearedPayeeModal] = useState<{ payee: string; totalUnadjusted: number } | null>(null);

  // Expense Form State
  const [formVoucherNo, setFormVoucherNo] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formPayee, setFormPayee] = useState('');
  const [formPayeePhone, setFormPayeePhone] = useState('');
  const [formPayeeEmail, setFormPayeeEmail] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubCategoryId, setFormSubCategoryId] = useState('');
  const [formChildCategoryId, setFormChildCategoryId] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<Expense['paymentMode']>('Cash');
  const [formPaymentType, setFormPaymentType] = useState<Expense['paymentType']>('Purchase');
  const [formPaymentAccount, setFormPaymentAccount] = useState('Production Cash');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formChequeNo, setFormChequeNo] = useState('');
  const [formChequeDate, setFormChequeDate] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formUtrNumber, setFormUtrNumber] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formAttachments, setFormAttachments] = useState<ExpenseAttachment[]>([]);

  // DSR & Source Module Integration States
  const [projectDsrs, setProjectDsrs] = useState<any[]>([]);
  const [formSourceModule, setFormSourceModule] = useState<'Direct' | 'DSR' | 'PO'>('Direct');
  const [formDsrId, setFormDsrId] = useState('');
  const [formDsrDay, setFormDsrDay] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [formItemDescription, setFormItemDescription] = useState('');

  // Subscribe to live DSRs for the current project
  useEffect(() => {
    const unsub = subscribeDSRs((dsrs) => {
      const cleanProjId = (selectedProjectId || '').replace(/^wp_/, '');
      const filtered = (dsrs || []).filter(d => {
        if (!selectedProjectId) return true;
        const dProjId = (d.projectId || '').replace(/^wp_/, '');
        return dProjId === cleanProjId || d.projectId === selectedProjectId;
      });
      setProjectDsrs(filtered);
    });
    return () => unsub();
  }, [selectedProjectId]);

  // Invoicing, GST & TDS States
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState('');
  const [formPanNumber, setFormPanNumber] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formBaseAmount, setFormBaseAmount] = useState('');
  const [formGstRate, setFormGstRate] = useState<number>(0);
  const [formGstType, setFormGstType] = useState<'CGST_SGST' | 'IGST' | 'EXEMPT'>('CGST_SGST');
  const [formIsRcm, setFormIsRcm] = useState(false);
  const [formTdsSection, setFormTdsSection] = useState<'NONE' | '194C_INDIV' | '194C_OTHERS' | '194J_TECH' | '194J_PROF' | '194I_BUILDING' | '194I_PLANT' | '194Q' | '194H' | '194A'>('NONE');
  const [formTdsRate, setFormTdsRate] = useState<number>(0);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  // Helper to re-calculate Tax, GST and Net Payable amounts
  const handleTaxRecalculate = (
    baseValStr: string, 
    gstRateVal: number, 
    tdsSec: string, 
    customTdsRate?: number
  ) => {
    const baseVal = parseFloat(baseValStr) || 0;
    let tRate = 0;
    if (tdsSec === '194C_INDIV') tRate = 1;
    else if (tdsSec === '194C_OTHERS') tRate = 2;
    else if (tdsSec === '194J_TECH') tRate = 2;
    else if (tdsSec === '194J_PROF') tRate = 10;
    else if (tdsSec === '194I_BUILDING') tRate = 10;
    else if (tdsSec === '194I_PLANT') tRate = 2;
    else if (tdsSec === '194H') tRate = 5;
    else if (tdsSec === '194Q') tRate = 0.1;
    else if (tdsSec === '194A') tRate = 10;
    else if (typeof customTdsRate === 'number') tRate = customTdsRate;

    setFormTdsRate(tRate);

    if (baseVal > 0) {
      const gstAmt = (baseVal * gstRateVal) / 100;
      const grossAmt = baseVal + gstAmt;
      setFormAmount(grossAmt.toFixed(2));
    }
  };

  // Helper to select DSR and sync metadata
  const handleSelectDsrDay = (dsrIdVal: string) => {
    setFormDsrId(dsrIdVal);
    const dsr = projectDsrs.find(d => d.id === dsrIdVal);
    if (dsr) {
      setFormDsrDay(dsr.dayCode || '');
      if (dsr.shootingDate) {
        setFormDate(dsr.shootingDate);
      }
    }
  };

  // Helper to auto-fill DSR templates
  const handleApplyDSRTemplate = (templateType: 'fuel' | 'catering' | 'transport' | 'crew_batta' | 'all') => {
    const dsr = projectDsrs.find(d => d.id === formDsrId) || projectDsrs[0];
    if (!dsr) {
      alert('Please select a DSR Shoot Day first');
      return;
    }

    setFormSourceModule('DSR');
    setFormDsrId(dsr.id);
    setFormDsrDay(dsr.dayCode || 'Day 01');
    if (dsr.shootingDate) setFormDate(dsr.shootingDate);

    if (templateType === 'fuel') {
      const cat = projectCategories.find(c => /transport|lighting|camera|production|generator|fuel/i.test(c.name)) || projectCategories[0];
      if (cat) setFormCategoryId(cat.id);
      setFormPayee(dsr.fuelVendor || 'Location Fuel Station / Diesel Supplier');
      setFormDesignation('Fuel & Genset Supplier');
      const fuelLiters = Number(dsr.actualFuelTotal) || 120;
      const rate = 95;
      const amt = fuelLiters * rate;
      setFormAmount(String(amt));
      setFormBaseAmount(String(amt));
      setFormNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Generator & Fleet Diesel (${fuelLiters} Liters @ ₹${rate}/L)`);
      setFormPaymentMode('Cash');
      setFormPaymentType('Purchase');
    } else if (templateType === 'catering') {
      const cat = projectCategories.find(c => /cater|food|mess|hospitality|production/i.test(c.name)) || projectCategories[0];
      if (cat) setFormCategoryId(cat.id);
      setFormPayee(dsr.catererName || 'Unit Catering & Food Vendor');
      setFormDesignation('Catering Contractor');
      const mealsTotal = (Number(dsr.breakfastCount) || 0) + (Number(dsr.lunchCount) || 0) + (Number(dsr.snacksCount) || 0) + (Number(dsr.dinnerCount) || 0) || 180;
      const estFoodCost = mealsTotal * 120;
      setFormAmount(String(estFoodCost));
      setFormBaseAmount(String(estFoodCost));
      setFormNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Unit Catering & Crew Meals (${mealsTotal} head count)`);
      setFormPaymentMode('Bank Transfer');
      setFormPaymentType('Purchase');
    } else if (templateType === 'transport') {
      const cat = projectCategories.find(c => /transport|vehicle|travel|conveyance|logistics/i.test(c.name)) || projectCategories[0];
      if (cat) setFormCategoryId(cat.id);
      setFormPayee(dsr.transporterName || 'Fleet Transport Operator');
      setFormDesignation('Logistics & Transport Provider');
      const vehicleQty = dsr.transportEntries?.length || 8;
      const estTransCost = vehicleQty * 2500;
      setFormAmount(String(estTransCost));
      setFormBaseAmount(String(estTransCost));
      setFormNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Location Vehicles & Transport Fleet (${vehicleQty} Vehicles)`);
      setFormPaymentMode('Bank Transfer');
      setFormPaymentType('Purchase');
    } else if (templateType === 'crew_batta') {
      const cat = projectCategories.find(c => /crew|artist|talent|direction|production/i.test(c.name)) || projectCategories[0];
      if (cat) setFormCategoryId(cat.id);
      setFormPayee('Junior Artists & Daily Crew');
      setFormDesignation('Daily Wages / Batta');
      const crewCount = dsr.crewEntries?.length || 25;
      const estBatta = crewCount * 800;
      setFormAmount(String(estBatta));
      setFormBaseAmount(String(estBatta));
      setFormNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Daily Crew Allowances & Junior Artist Batta (${crewCount} pax)`);
      setFormPaymentMode('Cash');
      setFormPaymentType('Wages');
    } else {
      const cat = projectCategories.find(c => /production|operations|general/i.test(c.name)) || projectCategories[0];
      if (cat) setFormCategoryId(cat.id);
      setFormPayee('Production Executive / Line Producer');
      setFormDesignation('Production Department');
      setFormNotes(`DSR ${dsr.dayCode} (${dsr.shootingDate}) - Consolidated Daily Shoot Operating Disbursals (${dsr.unitName || 'Main Unit'})`);
      setFormPaymentMode('Petty Cash');
      setFormPaymentType('Purchase');
    }
  };

  const handleSelectPo = (poId: string) => {
    setFormPoId(poId);
    const targetPo = allPurchaseOrders.find(p => p.id === poId);
    if (!targetPo) return;
    setFormPayee(targetPo.vendorName || '');
    if (targetPo.vendorGstin) setFormGstin(targetPo.vendorGstin);
    if (targetPo.vendorPan) setFormPanNumber(targetPo.vendorPan);
    if (targetPo.vendorId) setSelectedVendorId(targetPo.vendorId);
    if (targetPo.items && targetPo.items.length > 0) {
      const firstItem = targetPo.items[0];
      const matchCat = projectCategories.find(c => 
        c.id === firstItem.categoryId || 
        c.name.toLowerCase().trim() === (firstItem.categoryName || '').toLowerCase().trim()
      );
      if (matchCat) {
        setFormCategoryId(matchCat.id);
        const matchSub = matchCat.subCategories?.find(s => 
          s.id === firstItem.subCategoryId || 
          s.name.toLowerCase().trim() === (firstItem.subCategoryName || '').toLowerCase().trim()
        );
        if (matchSub) {
          setFormSubCategoryId(matchSub.id);
          const matchChild = matchSub.childCategories?.find(ch => 
            ch.id === firstItem.childCategoryId || 
            ch.name.toLowerCase().trim() === (firstItem.childCategoryName || '').toLowerCase().trim()
          );
          if (matchChild) {
            setFormChildCategoryId(matchChild.id);
          }
        }
      }
      const unbilled = (firstItem.totalAmount || 0) - (firstItem.invoicedAmount || 0);
      const chosenAmt = unbilled > 0 ? unbilled : (firstItem.totalAmount || 0);
      setFormAmount(String(chosenAmt));
      setFormBaseAmount(String(firstItem.totalBase || chosenAmt));
      setFormGstRate(firstItem.gstRate || 0);
      setFormItemDescription(firstItem.itemDescription || '');
    }
    setFormInvoiceNumber(targetPo.poNumber ? `BILL-${targetPo.poNumber}` : '');
    setFormNotes(`Linked to Purchase Order ${targetPo.poNumber} (${targetPo.department || 'Production'}). 3-Way PO Matching verified against budget.`);
  };

  const handleSelectVendor = (vendorNameOrId: string) => {
    setSelectedVendorId(vendorNameOrId);
    const v = allVendors.find(v => v.id === vendorNameOrId || v.vendorName.toLowerCase().trim() === vendorNameOrId.toLowerCase().trim());
    if (!v) return;
    setFormPayee(v.vendorName);
    if (v.phone) setFormPayeePhone(v.phone);
    if (v.email) setFormPayeeEmail(v.email);
    if (v.pan) setFormPanNumber(v.pan);
    if (v.gstin) setFormGstin(v.gstin);
    if (v.designation) setFormDesignation(v.designation);

    // Auto-map vendor category, subcategory and child category
    if (v.category) {
      const matchCat = projectCategories.find(c => 
        c.name.toLowerCase().trim() === v.category!.toLowerCase().trim() ||
        c.id === v.category
      );
      if (matchCat) {
        setFormCategoryId(matchCat.id);
        if (v.subCategory) {
          const matchSub = matchCat.subCategories?.find(s => 
            s.name.toLowerCase().trim() === v.subCategory!.toLowerCase().trim() ||
            s.id === v.subCategory
          );
          if (matchSub) {
            setFormSubCategoryId(matchSub.id);
            if (v.childCategory) {
              const matchChild = matchSub.childCategories?.find(ch => 
                ch.name.toLowerCase().trim() === v.childCategory!.toLowerCase().trim() ||
                ch.id === v.childCategory
              );
              if (matchChild) {
                setFormChildCategoryId(matchChild.id);
              }
            }
          }
        }
      }
    }
  };

  // On Account specific form states
  const [formOnAccountHolder, setFormOnAccountHolder] = useState('');
  const [formOnAccountPurpose, setFormOnAccountPurpose] = useState('');
  const [formSettlementDueDate, setFormSettlementDueDate] = useState('');

  // Reimbursement specific form states
  const [formReimbursementType, setFormReimbursementType] = useState<'Against On Account' | 'Simple Reimbursement'>('Simple Reimbursement');
  const [formRelatedOnAccountVoucher, setFormRelatedOnAccountVoucher] = useState('');

  // Approved Budget calculation: derived directly from real category allocations for this project
  const approvedBudgetTotal = useMemo(() => {
    if (projectCategories.length > 0) {
      const catSum = projectCategories.reduce((sum, cat) => {
        let catTotal = Number(cat.allocatedAmount) || 0;
        if (cat.subCategories && cat.subCategories.length > 0) {
          catTotal = cat.subCategories.reduce((subSum, sub) => {
            let subTotal = Number(sub.allocatedAmount) || 0;
            if (sub.childCategories && sub.childCategories.length > 0) {
              subTotal = sub.childCategories.reduce((chSum, ch) => chSum + (Number(ch.allocatedAmount) || 0), 0);
            }
            return subSum + subTotal;
          }, 0);
        }
        return sum + catTotal;
      }, 0);

      // Return real calculated category sum (including ₹0.00 when no items have been allocated yet)
      return catSum;
    }

    // Only fallback if no project categories are loaded at all
    return Number(currentProject?.totalBudget) || 0;
  }, [projectCategories, currentProject]);

  // Financial Metrics Calculations
  const metrics = useMemo(() => {
    let totalExpenses = 0;
    let pendingApprovalAmount = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOnAccount = 0;
    let unadjustedOnAccount = 0;
    let totalReimbursement = 0;

    projectExpenses.forEach(exp => {
      const isApprovedOrPaid = exp.status === 'Approved' || exp.status === 'Paid' || exp.approvalStatus === 'Approved';
      const amt = Number(exp.amount) || 0;

      if (isApprovedOrPaid) {
        totalExpenses += amt;
      }

      if (exp.status === 'Pending' || exp.approvalStatus === 'Submitted' || exp.approvalStatus === 'Pending Approval' || exp.approvalStatus === 'Pending Verification') {
        pendingApprovalAmount += amt;
      }

      if ((exp.status as any) === 'Paid' || exp.paymentStatus === 'Paid') {
        totalPaid += amt;
      } else if (exp.paymentStatus === 'Unpaid' || (!exp.paymentStatus && (exp.status as any) !== 'Paid')) {
        totalUnpaid += amt;
      }

      if (exp.paymentType === 'On Account') {
        totalOnAccount += amt;
        const adj = exp.onAccountDetails?.adjustedAmount || 0;
        const ret = exp.onAccountDetails?.returnedAmount || 0;
        unadjustedOnAccount += Math.max(0, amt - adj - ret);
      }

      if (exp.paymentType === 'Reimbursement') {
        totalReimbursement += amt;
      }
    });

    const remainingBudget = approvedBudgetTotal - totalExpenses;
    const isOverBudget = remainingBudget < 0;
    const utilizationPercent = approvedBudgetTotal > 0 ? (totalExpenses / approvedBudgetTotal) * 100 : 0;

    return {
      approvedBudgetTotal,
      totalExpenses,
      remainingBudget: Math.abs(remainingBudget),
      isOverBudget,
      utilizationPercent,
      pendingApprovalAmount,
      totalPaid,
      totalUnpaid,
      totalOnAccount,
      unadjustedOnAccount,
      totalReimbursement,
      totalActualSpend: totalExpenses,
      totalDirectPaid: totalPaid
    };
  }, [projectExpenses, approvedBudgetTotal]);

  // TDS & Tax Withholding Summary
  const tdsSummary = useMemo(() => {
    let totalBase = 0;
    let totalGst = 0;
    let totalTds = 0;
    let totalNet = 0;
    let sec194CCount = 0;
    let sec194JCount = 0;
    let sec194ICount = 0;
    let otherSecCount = 0;

    projectExpenses.forEach(e => {
      const base = Number(e.baseAmount) || Number(e.amount) || 0;
      const gst = Number(e.gstAmount) || 0;
      const tds = Number(e.tdsAmount) || 0;
      const net = Number(e.netPayable) || (Number(e.amount) - tds);

      if (tds > 0 || gst > 0 || (e.tdsSection && e.tdsSection !== 'NONE')) {
        totalBase += base;
        totalGst += gst;
        totalTds += tds;
        totalNet += net;

        if (e.tdsSection?.startsWith('194C')) sec194CCount++;
        else if (e.tdsSection?.startsWith('194J')) sec194JCount++;
        else if (e.tdsSection?.startsWith('194I')) sec194ICount++;
        else if (e.tdsSection && e.tdsSection !== 'NONE') otherSecCount++;
      }
    });

    return {
      totalBase,
      totalGst,
      totalTds,
      totalNet,
      sec194CCount,
      sec194JCount,
      sec194ICount,
      otherSecCount
    };
  }, [projectExpenses]);

  // Open open/uncleared On Account vouchers for reimbursement matching
  const openOnAccountVouchers = useMemo(() => {
    return projectExpenses.filter(e => {
      if (e.paymentType !== 'On Account') return false;
      const amt = Number(e.amount) || 0;
      const adj = e.onAccountDetails?.adjustedAmount || 0;
      const ret = e.onAccountDetails?.returnedAmount || 0;
      return (amt - adj - ret) > 0;
    });
  }, [projectExpenses]);

  // Calculate Payee's Uncleared On Account total
  const getPayeeUnclearedAdvance = (payeeName: string) => {
    if (!payeeName.trim()) return 0;
    return openOnAccountVouchers
      .filter(e => (e.payee || e.onAccountDetails?.holderName || '').toLowerCase().trim() === payeeName.toLowerCase().trim())
      .reduce((sum, e) => {
        const amt = Number(e.amount) || 0;
        const adj = e.onAccountDetails?.adjustedAmount || 0;
        const ret = e.onAccountDetails?.returnedAmount || 0;
        return sum + Math.max(0, amt - adj - ret);
      }, 0);
  };

  // Generate Voucher Number
  const generateVoucherNumber = () => {
    const year = new Date().getFullYear();
    const projPrefix = currentProject?.projectCode ? currentProject.projectCode.toUpperCase() : 'MM';
    const count = projectExpenses.length + 1;
    const pad = String(count).padStart(6, '0');
    return `${projPrefix}-EXP-${year}-${pad}`;
  };

  // Helpers to calculate allocated budget for dropdown tags and options
  const getChildBudget = (child: any): number => {
    if (!child) return 0;
    if (typeof child.allocatedAmount === 'number' && child.allocatedAmount > 0) return child.allocatedAmount;
    const calc = ((child.count || 0) * (child.rate || 0) * (child.shifts || 1));
    return calc || 0;
  };

  const getSubCategoryBudget = (sub: any): number => {
    if (!sub) return 0;
    if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) return sub.allocatedAmount;
    if (Array.isArray(sub.childCategories) && sub.childCategories.length > 0) {
      const sum = sub.childCategories.reduce((acc: number, ch: any) => acc + getChildBudget(ch), 0);
      if (sum > 0) return sum;
    }
    const calc = ((sub.count || 0) * (sub.rate || 0) * (sub.shifts || 1));
    return calc || 0;
  };

  const getCategoryBudget = (cat: any): number => {
    if (!cat) return 0;
    if (typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0) return cat.allocatedAmount;
    if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
      return cat.subCategories.reduce((acc: number, sub: any) => acc + getSubCategoryBudget(sub), 0);
    }
    return 0;
  };

  // Form subcategories & child categories lists
  const availableSubCategories = useMemo(() => {
    if (!formCategoryId) return [];
    const cat = projectCategories.find(c => c.id === formCategoryId);
    return cat?.subCategories || [];
  }, [formCategoryId, projectCategories]);

  const availableChildCategories = useMemo(() => {
    if (!formSubCategoryId) return [];
    const sub = availableSubCategories.find(s => s.id === formSubCategoryId);
    return sub?.childCategories || [];
  }, [formSubCategoryId, availableSubCategories]);

  // Selected Budget Head Budget Information
  const selectedBudgetInfo = useMemo(() => {
    if (!formCategoryId) return null;
    let itemBudget = 0;
    let itemName = '';

    const cat = projectCategories.find(c => c.id === formCategoryId);
    if (cat) {
      itemBudget = getCategoryBudget(cat);
      itemName = cat.name;
    }

    if (formSubCategoryId) {
      const sub = cat?.subCategories?.find(s => s.id === formSubCategoryId);
      if (sub) {
        itemBudget = getSubCategoryBudget(sub);
        itemName = sub.name;
      }

      if (formChildCategoryId) {
        const ch = sub?.childCategories?.find(c => c.id === formChildCategoryId);
        if (ch) {
          itemBudget = getChildBudget(ch);
          itemName = ch.name;
        }
      }
    }

    // Previous expenses booked under this budget head
    const previousSpent = projectExpenses
      .filter(e => {
        if (editingExpense && e.id === editingExpense.id) return false;
        if (formChildCategoryId) return e.childCategoryId === formChildCategoryId;
        if (formSubCategoryId) return e.subCategoryId === formSubCategoryId;
        return e.categoryId === formCategoryId;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const currentEntered = Number(formAmount) || 0;
    const available = itemBudget - previousSpent;
    const balanceAfterBooking = available - currentEntered;
    const isOver = balanceAfterBooking < 0;

    return {
      itemName,
      itemBudget,
      previousSpent,
      currentEntered,
      available,
      balanceAfterBooking,
      isOver,
      overAmount: Math.abs(balanceAfterBooking)
    };
  }, [formCategoryId, formSubCategoryId, formChildCategoryId, formAmount, projectCategories, projectExpenses, editingExpense]);

  // Apply Search & Filters
  const filteredExpenses = useMemo(() => {
    return projectExpenses.filter(e => {
      // Tab Filtering
      if (activeTab === 'on_account' && e.paymentType !== 'On Account') return false;
      if (activeTab === 'reimbursement' && e.paymentType !== 'Reimbursement') return false;
      if (activeTab === 'dsr_expenses' && e.sourceModule !== 'DSR' && !e.dsrDay && !e.dsrId) return false;
      if (activeTab === 'tds_tax') {
        const hasTds = (e.tdsAmount && e.tdsAmount > 0) || (e.tdsRate && e.tdsRate > 0) || (e.tdsSection && e.tdsSection !== 'NONE');
        const hasGst = (e.gstAmount && e.gstAmount > 0) || (e.gstRate && e.gstRate > 0);
        const hasInvoice = !!e.invoiceNumber || !!e.panNumber || !!e.gstin;
        if (!hasTds && !hasGst && !hasInvoice) return false;
      }
      if (activeTab === 'uncleared_advances') {
        if (e.paymentType !== 'On Account') return false;
        const amt = Number(e.amount) || 0;
        const adj = e.onAccountDetails?.adjustedAmount || 0;
        const ret = e.onAccountDetails?.returnedAmount || 0;
        if ((amt - adj - ret) <= 0) return false;
      }

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const vNo = (e.bookingNo || e.voucherNumber || '').toLowerCase();
        const payee = (e.payee || '').toLowerCase();
        const desig = (e.designation || '').toLowerCase();
        const catName = (e.categoryName || '').toLowerCase();
        const subCatName = (e.subCategoryName || '').toLowerCase();
        const bItem = (e.budgetItemName || '').toLowerCase();
        const account = (e.paymentAccount || '').toLowerCase();
        const mode = (e.paymentMode || '').toLowerCase();
        const type = (e.paymentType || '').toLowerCase();
        const note = (e.notes || e.title || '').toLowerCase();
        const amtStr = String(e.amount);

        const match = vNo.includes(term) || payee.includes(term) || desig.includes(term) || 
                      catName.includes(term) || subCatName.includes(term) || bItem.includes(term) ||
                      account.includes(term) || mode.includes(term) || type.includes(term) || 
                      note.includes(term) || amtStr.includes(term);
        if (!match) return false;
      }

      // Filter Bar inputs
      if (filterDateFrom && e.date < filterDateFrom) return false;
      if (filterDateTo && e.date > filterDateTo) return false;
      if (filterCategory && e.categoryId !== filterCategory) return false;
      if (filterSubCategory && e.subCategoryId !== filterSubCategory) return false;
      if (filterBudgetItem && e.childCategoryId !== filterBudgetItem) return false;
      if (filterPaymentMode && e.paymentMode !== filterPaymentMode) return false;
      if (filterPaymentType && e.paymentType !== filterPaymentType) return false;
      if (filterPaymentAccount && e.paymentAccount !== filterPaymentAccount) return false;
      if (filterApprovalStatus && (e.approvalStatus || e.status) !== filterApprovalStatus) return false;
      if (filterPaymentStatus && (e.paymentStatus || e.status) !== filterPaymentStatus) return false;
      if (filterMinAmount && Number(e.amount) < Number(filterMinAmount)) return false;
      if (filterMaxAmount && Number(e.amount) > Number(filterMaxAmount)) return false;

      return true;
    });
  }, [
    projectExpenses, 
    activeTab, 
    searchTerm, 
    filterDateFrom, 
    filterDateTo, 
    filterCategory, 
    filterSubCategory, 
    filterBudgetItem, 
    filterPaymentMode, 
    filterPaymentType, 
    filterPaymentAccount, 
    filterApprovalStatus, 
    filterPaymentStatus, 
    filterMinAmount, 
    filterMaxAmount
  ]);

  // Paginated List
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCategory('');
    setFilterSubCategory('');
    setFilterBudgetItem('');
    setFilterPaymentMode('');
    setFilterPaymentType('');
    setFilterPaymentAccount('');
    setFilterApprovalStatus('');
    setFilterPaymentStatus('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setSearchTerm('');
  };

  // Open Book Drawer
  const openNewBookDrawer = () => {
    setEditingExpense(null);
    setFormVoucherNo(generateVoucherNumber());
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormPayee('');
    setFormPayeePhone('');
    setFormPayeeEmail('');
    setFormDesignation('');
    setFormCategoryId(projectCategories[0]?.id || '');
    setFormSubCategoryId('');
    setFormChildCategoryId('');
    setFormPaymentMode('Cash');
    setFormPaymentType('Purchase');
    setFormPaymentAccount('Production Cash');
    setFormAmount('');
    setFormNotes('');
    setFormChequeNo('');
    setFormChequeDate('');
    setFormBankName('');
    setFormUtrNumber('');
    setFormUpiId('');
    setFormAttachments([]);
    setFormOnAccountHolder('');
    setFormOnAccountPurpose('');
    setFormSettlementDueDate('');
    setFormReimbursementType('Simple Reimbursement');
    setFormRelatedOnAccountVoucher('');
    setFormSourceModule('Direct');
    setFormDsrId('');
    setFormDsrDay('');
    setFormPoId('');
    setSelectedVendorId('');
    setFormItemDescription('');
    setFormInvoiceNumber('');
    setFormInvoiceDate('');
    setFormPanNumber('');
    setFormGstin('');
    setFormBaseAmount('');
    setFormGstRate(0);
    setFormGstType('CGST_SGST');
    setFormIsRcm(false);
    setFormTdsSection('NONE');
    setFormTdsRate(0);
    setShowTaxBreakdown(false);
    setIsBookDrawerOpen(true);
  };

  // Edit Expense
  const openEditBookDrawer = (exp: Expense) => {
    setEditingExpense(exp);
    setFormVoucherNo(exp.bookingNo || exp.voucherNumber || generateVoucherNumber());
    setFormDate(exp.date || new Date().toISOString().substring(0, 10));
    setFormPayee(exp.payee || '');
    setFormPayeePhone(exp.payeePhone || '');
    setFormPayeeEmail(exp.payeeEmail || '');
    setFormDesignation(exp.designation || '');
    setFormCategoryId(exp.categoryId || '');
    setFormSubCategoryId(exp.subCategoryId || '');
    setFormChildCategoryId(exp.childCategoryId || '');
    setFormPaymentMode(exp.paymentMode || 'Cash');
    setFormPaymentType(exp.paymentType || 'Purchase');
    setFormPaymentAccount(exp.paymentAccount || 'Production Cash');
    setFormAmount(String(exp.amount || ''));
    setFormNotes(exp.notes || exp.title || '');
    setFormChequeNo(exp.chequeNo || '');
    setFormChequeDate(exp.chequeDate || '');
    setFormBankName(exp.bankName || '');
    setFormUtrNumber(exp.utrNumber || '');
    setFormUpiId(exp.upiId || '');

    // DSR & Source Module
    setFormSourceModule((exp.sourceModule as any) || (exp.dsrDay ? 'DSR' : (exp.poId ? 'PO' : 'Direct')));
    setFormDsrId(exp.dsrId || '');
    setFormDsrDay(String(exp.dsrDay || ''));
    setFormPoId(exp.poId || '');
    setSelectedVendorId(exp.vendorId || '');
    setFormItemDescription(exp.budgetItemName || '');

    // Invoicing & Tax
    setFormInvoiceNumber(exp.invoiceNumber || '');
    setFormInvoiceDate(exp.invoiceDate || '');
    setFormPanNumber(exp.panNumber || '');
    setFormGstin(exp.gstin || '');
    setFormBaseAmount(exp.baseAmount ? String(exp.baseAmount) : String(exp.amount || ''));
    setFormGstRate(exp.gstRate || 0);
    setFormGstType(exp.gstType || 'CGST_SGST');
    setFormIsRcm(exp.isRcm || false);
    setFormTdsSection((exp.tdsSection as any) || 'NONE');
    setFormTdsRate(exp.tdsRate || 0);
    setShowTaxBreakdown(Boolean((exp.gstRate && exp.gstRate > 0) || (exp.tdsRate && exp.tdsRate > 0) || exp.invoiceNumber));
    
    if (Array.isArray(exp.attachments)) {
      const formatted: ExpenseAttachment[] = exp.attachments.map((att: any, idx: number) => {
        if (typeof att === 'string') {
          return { id: `att_${idx}`, fileName: `Document_${idx + 1}.pdf`, fileType: 'application/pdf', fileSize: 102400, storageUrl: att };
        }
        return att;
      });
      setFormAttachments(formatted);
    } else {
      setFormAttachments([]);
    }

    if (exp.onAccountDetails) {
      setFormOnAccountHolder(exp.onAccountDetails.holderName || exp.payee || '');
      setFormOnAccountPurpose(exp.onAccountDetails.purpose || '');
      setFormSettlementDueDate(exp.onAccountDetails.settlementDueDate || '');
    }

    if (exp.reimbursementDetails) {
      setFormReimbursementType(exp.reimbursementDetails.reimbursementType || 'Simple Reimbursement');
      setFormRelatedOnAccountVoucher(exp.reimbursementDetails.onAccountVoucherNo || '');
    }

    setIsBookDrawerOpen(true);
  };

  // Duplicate Expense
  const handleDuplicateExpense = (exp: Expense) => {
    const dup: Expense = {
      ...exp,
      id: `exp_${Date.now()}`,
      bookingNo: generateVoucherNumber(),
      voucherNumber: generateVoucherNumber(),
      date: new Date().toISOString().substring(0, 10),
      status: 'Pending',
      approvalStatus: 'Draft',
      paymentStatus: 'Unpaid',
      createdBy: userEmail
    };
    onSaveExpense(dup);
  };

  // Handle Payee Change with Uncleared Advance Check
  const handlePayeeChange = (val: string) => {
    setFormPayee(val);
    if (!formOnAccountHolder) {
      setFormOnAccountHolder(val);
    }
    const unadj = getPayeeUnclearedAdvance(val);
    if (unadj > 0) {
      setUnclearedPayeeModal({ payee: val, totalUnadjusted: unadj });
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const newAttachments: ExpenseAttachment[] = files.slice(0, 10 - formAttachments.length).map((file, idx) => {
      const url = URL.createObjectURL(file);
      return {
        id: `att_${Date.now()}_${idx}`,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        storageUrl: url,
        uploadedBy: userEmail,
        createdAt: new Date().toISOString()
      };
    });
    setFormAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setFormAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Apply data extracted by Gemini OCR into the form
  const handleApplyOcrData = (data: ExtractedReceiptData, attachment?: ExpenseAttachment) => {
    setEditingExpense(null);
    setFormVoucherNo(generateVoucherNumber());
    if (data.invoiceDate) setFormDate(data.invoiceDate);
    if (data.vendorName) setFormPayee(data.vendorName);
    if (data.invoiceNumber) setFormInvoiceNumber(data.invoiceNumber);
    if (data.invoiceDate) setFormInvoiceDate(data.invoiceDate);
    if (data.gstin) setFormGstin(data.gstin);
    if (data.pan) setFormPanNumber(data.pan);
    if (data.totalAmount) setFormAmount(String(data.totalAmount));
    if (data.baseAmount) setFormBaseAmount(String(data.baseAmount));
    if (data.gstRate !== undefined) setFormGstRate(data.gstRate);
    if (data.igstAmount && data.igstAmount > 0) {
      setFormGstType('IGST');
    } else {
      setFormGstType('CGST_SGST');
    }
    if (data.paymentMode) {
      setFormPaymentMode(data.paymentMode as any);
    }
    if (data.suggestedPaymentType) {
      setFormPaymentType(data.suggestedPaymentType as any);
    }
    
    // Category mapping
    if (data.suggestedCategoryId) {
      setFormCategoryId(data.suggestedCategoryId);
    } else if (projectCategories.length > 0) {
      setFormCategoryId(projectCategories[0].id);
    }

    // Build notes from line items and summary
    let noteContent = '';
    if (data.summary) {
      noteContent += data.summary + '\n';
    }
    if (data.lineItems && data.lineItems.length > 0) {
      noteContent += 'Itemized: ' + data.lineItems.map(it => `${it.description} (${it.quantity}x @ ₹${it.unitPrice})`).join(', ');
    }
    if (noteContent) {
      setFormNotes(noteContent.trim());
    }

    // Show tax breakdown if tax info is present
    if ((data.gstRate && data.gstRate > 0) || data.gstin) {
      setShowTaxBreakdown(true);
    }

    // Attach receipt image if available
    if (attachment) {
      setFormAttachments(prev => [...prev, attachment]);
    }

    setIsBookDrawerOpen(true);
  };

  // Direct book expense with receipt attached from Gemini OCR
  const handleDirectBookFromOcr = (data: ExtractedReceiptData, attachment?: ExpenseAttachment) => {
    const vNo = generateVoucherNumber();
    const catId = data.suggestedCategoryId || projectCategories[0]?.id || '';
    const catObj = projectCategories.find(c => c.id === catId);
    const numAmt = data.totalAmount || 0;
    const baseAmt = data.baseAmount || numAmt;
    const calcGstAmt = data.taxAmount || ((baseAmt * (data.gstRate || 0)) / 100);

    const directExp: Expense = {
      id: `exp_ocr_${Date.now()}`,
      projectId: selectedProjectId || currentProject?.id || 'proj_default',
      companyId: activeCompany?.id || currentProject?.companyId || 'comp_default',
      bookingNo: vNo,
      voucherNumber: vNo,
      date: data.invoiceDate || new Date().toISOString().substring(0, 10),
      payee: data.vendorName || 'Vendor (OCR Scanned)',
      designation: 'Vendor / Service Provider',
      categoryId: catId,
      categoryName: catObj?.name || data.suggestedCategoryName || 'Production Expense',
      title: data.summary || `${catObj?.name || 'Expense'} - ${data.vendorName || 'Scanned Receipt'}`,
      amount: numAmt,
      baseAmount: baseAmt,
      gstRate: data.gstRate || 0,
      gstType: (data.igstAmount && data.igstAmount > 0) ? 'IGST' : 'CGST_SGST',
      gstAmount: calcGstAmt,
      isRcm: false,
      tdsSection: 'NONE',
      tdsRate: 0,
      tdsAmount: 0,
      netPayable: numAmt,
      panNumber: data.pan || undefined,
      gstin: data.gstin || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      invoiceDate: data.invoiceDate || undefined,
      paymentMode: (data.paymentMode as any) || 'Bank Transfer',
      paymentType: (data.suggestedPaymentType as any) || 'Purchase',
      paymentAccount: 'Production Cash',
      notes: data.summary || `Extracted via Gemini AI OCR from ${data.receiptFileName || 'receipt image'}.`,
      attachments: attachment ? [attachment] : [],
      status: 'Paid',
      approvalStatus: 'Approved',
      paymentStatus: 'Paid',
      createdBy: userEmail,
      updatedBy: userEmail,
      approvedBy: userEmail
    };

    onSaveExpense(directExp);
  };

  // Save / Submit Expense Form
  const handleFormSubmit = (actionType: 'draft' | 'submit' | 'approve') => {
    if (!formPayee.trim()) {
      alert('Please enter Payee / Vendor Name');
      return;
    }
    if (!formCategoryId) {
      alert('Please select a Category');
      return;
    }
    const numAmt = Number(formAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Please enter a valid Amount greater than 0');
      return;
    }

    const catObj = projectCategories.find(c => c.id === formCategoryId);
    const subObj = availableSubCategories.find(s => s.id === formSubCategoryId);
    const childObj = availableChildCategories.find(ch => ch.id === formChildCategoryId);

    let statusVal: Expense['status'] = 'Pending';
    let approvalVal: Expense['approvalStatus'] = 'Submitted';
    let paymentVal: Expense['paymentStatus'] = 'Unpaid';

    if (actionType === 'draft') {
      statusVal = 'Pending';
      approvalVal = 'Draft';
    } else if (actionType === 'approve') {
      statusVal = 'Paid';
      approvalVal = 'Approved';
      paymentVal = 'Paid';
    }

    const parsedBase = parseFloat(formBaseAmount) || numAmt;
    const calcGstAmt = (parsedBase * (formGstRate || 0)) / 100;
    const calcTdsAmt = (parsedBase * (formTdsRate || 0)) / 100;
    const calcNetPay = (parsedBase + calcGstAmt) - calcTdsAmt;

    const savedExp: Expense = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      projectId: selectedProjectId || currentProject?.id || 'proj_default',
      companyId: activeCompany?.id || currentProject?.companyId || 'comp_default',
      bookingNo: formVoucherNo,
      voucherNumber: formVoucherNo,
      date: formDate,
      payee: formPayee,
      payeePhone: formPayeePhone.trim() || undefined,
      payeeEmail: formPayeeEmail.trim() || undefined,
      designation: formDesignation,
      categoryId: formCategoryId,
      categoryName: catObj?.name || '',
      subCategoryId: formSubCategoryId || undefined,
      subCategoryName: subObj?.name || '',
      childCategoryId: formChildCategoryId || undefined,
      budgetItemName: childObj?.name || subObj?.name || catObj?.name || '',
      title: formNotes.trim() || `${catObj?.name || 'Expense'} for ${formPayee}`,
      amount: numAmt,
      baseAmount: parsedBase,
      gstRate: formGstRate || 0,
      gstType: formGstType,
      gstAmount: calcGstAmt,
      isRcm: formIsRcm,
      tdsSection: formTdsSection,
      tdsRate: formTdsRate || 0,
      tdsAmount: calcTdsAmt,
      netPayable: calcNetPay,
      panNumber: formPanNumber.trim() || undefined,
      gstin: formGstin.trim() || undefined,
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      invoiceDate: formInvoiceDate || undefined,
      sourceModule: formSourceModule || undefined,
      dsrDay: formDsrDay || undefined,
      dsrId: formDsrId || undefined,
      poId: formSourceModule === 'PO' ? formPoId : (editingExpense?.poId || undefined),
      vendorId: selectedVendorId || (editingExpense?.vendorId || undefined),
      approvedAmount: actionType === 'approve' ? numAmt : undefined,
      paymentMode: formPaymentMode,
      paymentType: formPaymentType,
      paymentAccount: formPaymentAccount,
      chequeNo: formChequeNo || undefined,
      chequeDate: formChequeDate || undefined,
      bankName: formBankName || undefined,
      utrNumber: formUtrNumber || undefined,
      upiId: formUpiId || undefined,
      notes: formNotes,
      attachments: formAttachments,
      status: statusVal,
      approvalStatus: approvalVal,
      paymentStatus: paymentVal,
      createdBy: editingExpense ? editingExpense.createdBy || userEmail : userEmail,
      updatedBy: userEmail,
      approvedBy: actionType === 'approve' ? userEmail : undefined
    };

    // On Account details if On Account
    if (formPaymentType === 'On Account') {
      savedExp.onAccountDetails = {
        id: `oa_${Date.now()}`,
        voucherNumber: formVoucherNo,
        holderName: formOnAccountHolder || formPayee,
        purpose: formOnAccountPurpose || formNotes,
        givenAmount: numAmt,
        adjustedAmount: editingExpense?.onAccountDetails?.adjustedAmount || 0,
        returnedAmount: editingExpense?.onAccountDetails?.returnedAmount || 0,
        additionalPayable: 0,
        outstandingAmount: numAmt - (editingExpense?.onAccountDetails?.adjustedAmount || 0),
        givenDate: formDate,
        settlementDueDate: formSettlementDueDate,
        settlementStatus: 'Open',
        createdBy: userEmail,
        createdAt: new Date().toISOString()
      };
    }

    // Reimbursement details if Reimbursement
    if (formPaymentType === 'Reimbursement') {
      let adjAmt = 0;
      let retAmt = 0;
      let addPay = numAmt;

      if (formReimbursementType === 'Against On Account' && formRelatedOnAccountVoucher) {
        const relatedOa = openOnAccountVouchers.find(v => (v.bookingNo || v.voucherNumber) === formRelatedOnAccountVoucher);
        if (relatedOa) {
          const oaGiven = Number(relatedOa.amount) || 0;
          const prevAdj = relatedOa.onAccountDetails?.adjustedAmount || 0;
          const openBal = oaGiven - prevAdj;

          if (numAmt <= openBal) {
            adjAmt = numAmt;
            retAmt = openBal - numAmt;
            addPay = 0;
          } else {
            adjAmt = openBal;
            retAmt = 0;
            addPay = numAmt - openBal;
          }

          // Update the related On Account voucher's adjustment
          const updatedRelatedOa: Expense = {
            ...relatedOa,
            onAccountDetails: {
              ...relatedOa.onAccountDetails!,
              adjustedAmount: prevAdj + adjAmt,
              outstandingAmount: Math.max(0, openBal - adjAmt),
              settlementStatus: (openBal - adjAmt) <= 0 ? 'Fully Adjusted' : 'Partially Adjusted'
            }
          };
          onSaveExpense(updatedRelatedOa);
        }
      }

      savedExp.reimbursementDetails = {
        id: `reimb_${Date.now()}`,
        expenseId: savedExp.id,
        reimbursementType: formReimbursementType,
        onAccountVoucherNo: formRelatedOnAccountVoucher || undefined,
        claimedAmount: numAmt,
        approvedAmount: numAmt,
        adjustedAmount: adjAmt,
        returnableAmount: retAmt,
        additionalPayable: addPay,
        settlementStatus: addPay > 0 ? 'Reimbursement Due' : 'Cleared',
        createdBy: userEmail,
        createdAt: new Date().toISOString()
      };
    }

    onSaveExpense(savedExp);
    setIsBookDrawerOpen(false);
  };

  // Export Complete Multi-Tab Production Excel Workbook (.xlsx)
  const handleExportExcel = () => {
    try {
      exportProductionWorkbookXlsx({
        project: currentProject,
        company: activeCompany || { name: companyName },
        categories: projectCategories,
        expenses: filteredExpenses,
        generatedBy: userEmail || 'AI Studio Controller'
      });
    } catch (err: any) {
      console.error('Failed to export Excel workbook:', err);
      alert(`Export Failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Export Filtered Expenses to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Voucher No',
      'Date',
      'Payee',
      'Designation',
      'Category',
      'Subcategory',
      'Budget Item',
      'Payment Type',
      'Payment Mode',
      'Payment Account',
      'Base Taxable Amount',
      'GST Tax Amount',
      'TDS Deduction',
      'Total Disbursed Amount',
      'Status',
      'Invoice Number',
      'Created By',
      'Notes'
    ];

    const rows = filteredExpenses.map(e => [
      e.bookingNo || e.voucherNumber || e.id,
      e.date || '',
      e.payee || '',
      e.designation || '',
      e.categoryName || '',
      e.subCategoryName || '',
      e.budgetItemName || '',
      e.paymentType || 'Direct Expense',
      e.paymentMode || 'Bank Transfer',
      e.paymentAccount || '',
      Number(e.baseAmount) || Number(e.amount) || 0,
      Number(e.gstAmount) || 0,
      Number(e.tdsAmount) || 0,
      Number(e.amount) || 0,
      e.status || e.paymentStatus || 'Paid',
      e.invoiceNumber || '',
      e.createdBy || '',
      e.notes || e.title || ''
    ]);

    const projSlug = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateSlug = new Date().toISOString().substring(0, 10);
    exportCsvFile(headers, rows, `Expenses_${projSlug}_${dateSlug}.csv`);
  };

  // Download Single Formatted Voucher PDF
  const handleDownloadVoucherPdf = (expense: Expense) => {
    try {
      setIsDownloadingVoucherPdf(true);
      exportSingleVoucherPdf(
        expense, 
        currentProject, 
        activeCompany || { name: companyName }
      );
    } catch (err: any) {
      console.error('Failed to export Voucher PDF:', err);
      alert(`Voucher PDF export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingVoucherPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-3 md:p-4 space-y-4 text-slate-100">
      {/* 1. EXPENSE PAGE HEADER */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Company: <strong className="text-white">{companyName}</strong></span>
              <span className="text-slate-600">•</span>
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>Project: <strong className="text-white">{projectName}</strong></span>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Expenses Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              Total Records: <strong className="text-white">{projectExpenses.length}</strong>
            </span>
          </div>
        </div>

        {/* 2. SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Approved Budget */}
          <div className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xs flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase shrink-0">
                APPROVED BUDGET
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate hidden lg:inline">
                • Total allocated
              </span>
            </div>
            <div className="text-sm md:text-base font-black text-white tracking-tight shrink-0 whitespace-nowrap">
              ₹{metrics.approvedBudgetTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="px-3.5 py-2.5 rounded-xl border border-blue-900/50 bg-slate-900/90 shadow-2xs flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold font-mono tracking-wider text-blue-400 uppercase shrink-0">
                TOTAL EXPENSES
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate hidden lg:inline">
                • {metrics.utilizationPercent.toFixed(1)}% utilized
              </span>
            </div>
            <div className="text-sm md:text-base font-black text-blue-300 tracking-tight shrink-0 whitespace-nowrap">
              ₹{metrics.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Card 3: Remaining / Over Budget */}
          <div className={`px-3.5 py-2.5 rounded-xl border shadow-2xs bg-slate-900/90 flex items-center justify-between gap-2 overflow-hidden ${
            metrics.isOverBudget 
              ? 'border-rose-900/80' 
              : metrics.utilizationPercent >= 80 
                ? 'border-amber-900/80' 
                : 'border-emerald-900/80'
          }`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[10px] font-bold font-mono tracking-wider uppercase shrink-0 ${
                metrics.isOverBudget ? 'text-rose-400' : metrics.utilizationPercent >= 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {metrics.isOverBudget ? 'OVER BUDGET' : 'REMAINING BUDGET'}
              </span>
              <span className={`text-[10px] font-medium truncate hidden lg:inline ${
                metrics.isOverBudget ? 'text-rose-400/80' : metrics.utilizationPercent >= 80 ? 'text-amber-400/80' : 'text-emerald-400/80'
              }`}>
                • {metrics.isOverBudget ? 'Exceeded' : 'Available'}
              </span>
            </div>
            <div className={`text-sm md:text-base font-black tracking-tight shrink-0 whitespace-nowrap ${
              metrics.isOverBudget ? 'text-rose-300' : metrics.utilizationPercent >= 80 ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              ₹{metrics.remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* STATS BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800">
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-amber-400 uppercase block">Pending Approval</span>
            <span className="text-xs font-extrabold text-amber-200">₹{metrics.pendingApprovalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-emerald-400 uppercase block">Total Paid</span>
            <span className="text-xs font-extrabold text-emerald-200">₹{metrics.totalPaid.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-slate-400 uppercase block">Total Unpaid</span>
            <span className="text-xs font-extrabold text-white">₹{metrics.totalUnpaid.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-indigo-400 uppercase block">Total On Account</span>
            <span className="text-xs font-extrabold text-indigo-200">₹{metrics.totalOnAccount.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-purple-950/40 border border-purple-900/50 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-purple-400 uppercase block">Unadjusted Advance</span>
            <span className="text-xs font-extrabold text-purple-200">₹{metrics.unadjustedOnAccount.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-2 text-center">
            <span className="text-[8px] font-bold font-mono text-blue-400 uppercase block">Total Reimbursement</span>
            <span className="text-xs font-extrabold text-blue-200">₹{metrics.totalReimbursement.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* EXPENSE PAGE SUB-TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-2 border-t border-slate-800">
          {EXPENSE_SUB_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            let count: number | null = null;
            if (tab.id === 'expense-drafts') {
              count = projectExpenses.filter(e => e.approvalStatus === 'Draft').length;
            } else if (tab.id === 'pending-approval') {
              count = projectExpenses.filter(e => e.approvalStatus === 'Pending Approval').length;
            } else if (tab.id === 'approved-expenses') {
              count = projectExpenses.filter(e => e.approvalStatus === 'Approved').length;
            } else if (tab.id === 'on-account') {
              count = projectExpenses.filter(e => e.paymentType === 'On Account').length;
            } else if (tab.id === 'reimbursements') {
              count = projectExpenses.filter(e => e.paymentType === 'Reimbursement').length;
            } else if (tab.id === 'uncleared-advances') {
              count = openOnAccountVouchers.length;
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleExpenseSubTabClick(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold border border-blue-500 ring-1 ring-blue-400/30'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                <span>{tab.name}</span>
                {count !== null && count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN TOOLBAR */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Voucher No, Payee, Category, Subcategory, Budget Item, Amount, Note..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsOcrModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-lg shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Upload invoice photo or PDF to extract vendor, amounts, GST, and budget mapping using Gemini 3.7 Flash OCR"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
              <span>Scan Receipt (Gemini OCR)</span>
            </button>

            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showFilterPanel 
                  ? 'bg-blue-950/80 border-blue-500 text-blue-400' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            <button 
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 border border-emerald-500/50"
              title="Download Complete Multi-Tab Production Excel Workbook (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel Workbook</span>
            </button>

            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Configure Custom Export Filters, Formats & Modules"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Hub</span>
            </button>

            <button 
              onClick={openNewBookDrawer}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Expense</span>
            </button>
          </div>
        </div>

        {/* 4. EXPANDABLE FILTER PANEL */}
        {showFilterPanel && (
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                Advanced Filters
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Date From</label>
                <input 
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Date To</label>
                <input 
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterSubCategory('');
                    setFilterBudgetItem('');
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Categories</option>
                  {projectCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Subcategory</label>
                <select 
                  value={filterSubCategory}
                  onChange={(e) => {
                    setFilterSubCategory(e.target.value);
                    setFilterBudgetItem('');
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Subcategories</option>
                  {projectCategories
                    .filter(c => !filterCategory || c.id === filterCategory)
                    .flatMap(c => c.subCategories || [])
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Child Category / Budget Item</label>
                <select 
                  value={filterBudgetItem}
                  onChange={(e) => setFilterBudgetItem(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Child Categories</option>
                  {projectCategories
                    .filter(c => !filterCategory || c.id === filterCategory)
                    .flatMap(c => c.subCategories || [])
                    .filter(s => !filterSubCategory || s.id === filterSubCategory)
                    .flatMap(s => s.childCategories || [])
                    .map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Payment Mode</label>
                <select 
                  value={filterPaymentMode}
                  onChange={(e) => setFilterPaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Petty Cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Payment Type</label>
                <select 
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Types</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Wages">Wages</option>
                  <option value="Rent">Rent</option>
                  <option value="On Account">On Account</option>
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Professional Fee">Professional Fee</option>
                  <option value="Advance">Advance</option>
                  <option value="Security Deposit">Security Deposit</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Approval Status</label>
                <select 
                  value={filterApprovalStatus}
                  onChange={(e) => setFilterApprovalStatus(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Payment Status</label>
                <select 
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TABS HEADER */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pt-1">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Expenses ({projectExpenses.length})
          </button>

          <button
            onClick={() => { setActiveTab('on_account'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'on_account'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            On Account Advances ({projectExpenses.filter(e => e.paymentType === 'On Account').length})
          </button>

          <button
            onClick={() => { setActiveTab('reimbursement'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reimbursement'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reimbursements ({projectExpenses.filter(e => e.paymentType === 'Reimbursement').length})
          </button>

          <button
            onClick={() => { setActiveTab('tds_tax'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tds_tax'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            TDS & Tax Register ({projectExpenses.filter(e => (e.tdsAmount && e.tdsAmount > 0) || (e.gstAmount && e.gstAmount > 0) || (e.tdsSection && e.tdsSection !== 'NONE')).length})
          </button>

          <button
            onClick={() => { setActiveTab('dsr_expenses'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'dsr_expenses'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3 h-3" />
            DSR Shoot Expenses ({projectExpenses.filter(e => e.sourceModule === 'DSR' || e.dsrDay || e.dsrId).length})
          </button>

          <button
            onClick={() => { setActiveTab('uncleared_advances'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'uncleared_advances'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Uncleared Advances ({openOnAccountVouchers.length})
          </button>
        </div>
      </div>

      {/* TDS & Tax Withholding Summary Card when on TDS Tab */}
      {activeTab === 'tds_tax' && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">TDS & Income Tax Withholding Register</h3>
                <p className="text-[11px] text-slate-400">Statutory deductions under Section 194C, 194J, 194I & GST compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                Quarterly Challan 281 Filing Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Taxable / Base Value</div>
              <div className="text-sm font-black text-white mt-0.5">
                ₹{tdsSummary.totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div className="text-[9px] font-bold text-blue-400 uppercase">Input GST</div>
              <div className="text-sm font-black text-blue-300 mt-0.5">
                ₹{tdsSummary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-rose-900/60 rounded-lg bg-rose-950/20">
              <div className="text-[9px] font-bold text-rose-400 uppercase">TDS Deducted (Liability)</div>
              <div className="text-sm font-black text-rose-300 mt-0.5">
                ₹{tdsSummary.totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-emerald-900/60 rounded-lg bg-emerald-950/20">
              <div className="text-[9px] font-bold text-emerald-400 uppercase">Net Payee Disbursements</div>
              <div className="text-sm font-black text-emerald-300 mt-0.5">
                ₹{tdsSummary.totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reimbursement Claims Summary Card (Sub-tab 8) */}
      {activeTab === 'reimbursement' && (
        <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">Reimbursement Claims & Disbursements Register</h3>
                <p className="text-[11px] text-slate-400">Crew and departmental claims submitted for personal out-of-pocket expenses</p>
              </div>
            </div>
            <button
              onClick={() => openNewBookDrawer()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Reimbursement Claim</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Total Claims ({projectExpenses.filter(e => e.paymentType === 'Reimbursement').length})</div>
              <div className="text-sm font-black text-white mt-0.5">
                ₹{projectExpenses.filter(e => e.paymentType === 'Reimbursement').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-amber-900/60 rounded-lg bg-amber-950/20">
              <div className="text-[9px] font-bold text-amber-400 uppercase">Pending Approval ({projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.approvalStatus === 'Pending Approval').length})</div>
              <div className="text-sm font-black text-amber-300 mt-0.5">
                ₹{projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.approvalStatus === 'Pending Approval').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-emerald-900/60 rounded-lg bg-emerald-950/20">
              <div className="text-[9px] font-bold text-emerald-400 uppercase">Approved ({projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.approvalStatus === 'Approved').length})</div>
              <div className="text-sm font-black text-emerald-300 mt-0.5">
                ₹{projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.approvalStatus === 'Approved').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-blue-900/60 rounded-lg bg-blue-950/20">
              <div className="text-[9px] font-bold text-blue-400 uppercase">Settled / Paid ({projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.paymentStatus === 'Paid').length})</div>
              <div className="text-sm font-black text-blue-300 mt-0.5">
                ₹{projectExpenses.filter(e => e.paymentType === 'Reimbursement' && e.paymentStatus === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Reports & Category Analytics Card */}
      {activeTab === 'reports' && (
        <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">Expense Analytics & Breakdown Report</h3>
                <p className="text-[11px] text-slate-400">Distribution of spending across payment types, approvals, and budget heads</p>
              </div>
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Expense Ledger</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Total Spend Vouchers</div>
              <div className="text-sm font-black text-white mt-0.5">
                ₹{metrics.totalActualSpend.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-indigo-900/50 rounded-lg">
              <div className="text-[9px] font-bold text-indigo-400 uppercase">Direct Cash / Bank</div>
              <div className="text-sm font-black text-indigo-300 mt-0.5">
                ₹{metrics.totalDirectPaid.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-purple-900/50 rounded-lg">
              <div className="text-[9px] font-bold text-purple-400 uppercase">On Account Advances</div>
              <div className="text-sm font-black text-purple-300 mt-0.5">
                ₹{metrics.totalOnAccount.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/80 border border-emerald-900/50 rounded-lg">
              <div className="text-[9px] font-bold text-emerald-400 uppercase">Input Tax Credit (GST)</div>
              <div className="text-sm font-black text-emerald-300 mt-0.5">
                ₹{tdsSummary.totalGst.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPENSE LIST TABLE */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredExpenses.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</strong> of <strong className="text-white">{filteredExpenses.length}</strong> Expenses
          </span>
          <span className="font-mono text-[10px]">Page {currentPage} of {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                {activeTab === 'tds_tax' ? (
                  <>
                    <th className="py-2.5 px-3">Voucher / Inv No.</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payee & PAN</th>
                    <th className="py-2.5 px-3">Head</th>
                    <th className="py-2.5 px-3 text-right">Taxable Base</th>
                    <th className="py-2.5 px-3 text-right">GST</th>
                    <th className="py-2.5 px-3 text-center">TDS Sec & Rate</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">TDS Deducted</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400">Net Payable</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3">Voucher No.</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Category / Head</th>
                    <th className="py-2.5 px-3">Type / Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200 font-sans">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'tds_tax' ? 10 : 8} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-sm text-slate-300">No expenses found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting search or filters, or click "Book Expense" to add one.</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => {
                  const isApproved = exp.status === 'Approved' || exp.approvalStatus === 'Approved' || exp.status === 'Paid';
                  const isPending = exp.status === 'Pending' || exp.approvalStatus === 'Submitted' || exp.approvalStatus === 'Draft';
                  const isRejected = exp.status === 'Rejected' || exp.approvalStatus === 'Rejected';

                  const baseVal = Number(exp.baseAmount) || Number(exp.amount) || 0;
                  const gstVal = Number(exp.gstAmount) || 0;
                  const tdsVal = Number(exp.tdsAmount) || 0;
                  const netVal = Number(exp.netPayable) || (Number(exp.amount) - tdsVal);

                  if (activeTab === 'tds_tax') {
                    return (
                      <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors font-mono">
                        <td className="py-2 px-3">
                          <div className="font-bold text-white">{exp.bookingNo || exp.voucherNumber}</div>
                          {exp.invoiceNumber && (
                            <div className="text-[10px] text-slate-400">Inv: {exp.invoiceNumber}</div>
                          )}
                        </td>

                        <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {exp.date}
                        </td>

                        <td className="py-2 px-3 font-sans">
                          <div className="font-bold text-white">{exp.payee}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {exp.panNumber ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                                PAN: {exp.panNumber}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/60">
                                No PAN (20% rule)
                              </span>
                            )}
                            {exp.gstin && (
                              <span className="text-[9px] font-mono text-slate-400">
                                GSTIN: {exp.gstin}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3 font-sans">
                          <div className="font-semibold text-slate-200 text-xs">{exp.categoryName || 'General'}</div>
                          <div className="text-[10px] text-amber-300/90 font-medium truncate max-w-[170px]">
                            {exp.subCategoryName ? `${exp.subCategoryName} › ` : ''}
                            <span className="text-slate-300 font-semibold">{exp.budgetItemName || exp.title}</span>
                          </div>
                          {exp.sourceModule === 'PO' && (
                            <span className="mt-0.5 inline-block text-[9px] font-semibold text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                              PO Linked
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right text-slate-300 font-bold">
                          ₹{baseVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-2 px-3 text-right text-blue-300">
                          {gstVal > 0 ? (
                            <>
                              <div>₹{gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                              <div className="text-[9px] text-blue-400">({exp.gstRate || 0}%)</div>
                            </>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-center">
                          {exp.tdsSection && exp.tdsSection !== 'NONE' ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-bold">
                                {exp.tdsSection.replace('_', ' ')}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{exp.tdsRate || 0}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Nil (0%)</span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right font-bold text-rose-400">
                          {tdsVal > 0 ? (
                            `₹${tdsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-slate-500">₹0.00</span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right font-black text-emerald-400">
                          ₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-2 px-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewingExpense(exp)}
                              className="p-1 text-slate-400 hover:text-blue-400 rounded cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditBookDrawer(exp)}
                              className="p-1 text-slate-400 hover:text-emerald-400 rounded cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{exp.bookingNo || exp.voucherNumber || 'EXP-000000'}</span>
                        </div>
                        {(exp.sourceModule === 'DSR' || exp.dsrDay) && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-sans">
                              <Film className="w-2.5 h-2.5 text-indigo-400" />
                              {exp.dsrDay || 'DSR'}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {exp.date}
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-bold text-white">{exp.payee}</div>
                        {exp.designation && <div className="text-[10px] text-slate-400">{exp.designation}</div>}
                      </td>

                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-200">{exp.categoryName || 'General'}</div>
                        <div className="text-[10px] text-amber-300/90 font-medium truncate max-w-[180px]">
                          {exp.subCategoryName ? `${exp.subCategoryName} › ` : ''}
                          <span className="text-slate-300 font-semibold">{exp.budgetItemName || exp.title}</span>
                        </div>
                        {exp.sourceModule === 'PO' && (
                          <span className="mt-0.5 inline-block text-[9px] font-semibold text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                            PO Linked
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <div className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700/60">
                          {exp.paymentType || 'Purchase'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {exp.paymentMode || 'Cash'} • {exp.paymentAccount || 'Default Account'}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right font-black font-mono text-white">
                        ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isApproved 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' 
                            : isPending 
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' 
                              : isRejected 
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/80' 
                                : 'bg-slate-800 text-slate-300'
                        }`}>
                          {exp.status || exp.approvalStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingExpense(exp)}
                            className="p-1 text-slate-400 hover:text-blue-400 rounded cursor-pointer"
                            title="View Expense Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPrintingVoucherExpense(exp)}
                            className="p-1 text-slate-400 hover:text-purple-400 rounded cursor-pointer"
                            title="Print Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditBookDrawer(exp)}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicateExpense(exp)}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded cursor-pointer"
                            title="Duplicate Expense"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmTarget(exp)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="px-3.5 py-2.5 bg-slate-800/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-700 flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous 50
          </button>

          <span className="text-xs font-mono font-bold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-700 flex items-center gap-1"
          >
            Next 50
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. BOOK EXPENSE DRAWER / MODAL */}
      {isBookDrawerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden text-slate-100 border-l border-slate-800">
            {/* Drawer Header */}
            <div className="shrink-0 px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider block">
                  {editingExpense ? 'Edit Expense Record' : 'Book New Expense'}
                </span>
                <h2 className="text-base font-extrabold">{formVoucherNo}</h2>
              </div>
              <button 
                onClick={() => setIsBookDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick Gemini OCR Banner */}
              <div className="p-3.5 bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-slate-900 border border-blue-800/60 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/40">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Gemini AI Receipt OCR Scanner</h4>
                    <p className="text-[10px] text-slate-300">Upload a bill photo or PDF to auto-fill vendor, amounts, GST &amp; budget mapping</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Scan Receipt
                </button>
              </div>

              {/* DSR / Shoot Report Source Link Header */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-extrabold text-white">Source Module & DSR Auto-Fill</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px]">Source:</span>
                    <select
                      value={formSourceModule}
                      onChange={(e) => setFormSourceModule(e.target.value as any)}
                      className="bg-transparent text-indigo-300 font-bold outline-none cursor-pointer text-xs"
                    >
                      <option value="Direct" className="bg-slate-900 text-white">Direct Manual Booking</option>
                      <option value="DSR" className="bg-slate-900 text-indigo-300">Linked to DSR Shoot Report</option>
                      <option value="PO" className="bg-slate-900 text-amber-300">Purchase Order / Work Order</option>
                    </select>
                  </div>
                </div>

                {formSourceModule === 'DSR' && (
                  <div className="space-y-2.5 pt-1 border-t border-indigo-900/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-indigo-300 uppercase block mb-1">
                          Select Shoot Day Report
                        </label>
                        <select
                          value={formDsrId}
                          onChange={(e) => handleSelectDsrDay(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-indigo-700/80 rounded text-xs text-white font-mono"
                        >
                          <option value="">-- Choose Shooting Day --</option>
                          {projectDsrs.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.dayCode} ({d.shootingDate}) - {d.unitName || 'Main Unit'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-indigo-300 uppercase block mb-1">
                          Shoot Day Code
                        </label>
                        <input
                          type="text"
                          value={formDsrDay}
                          onChange={(e) => setFormDsrDay(e.target.value)}
                          placeholder="e.g. Day 01, Day 02"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-indigo-700/80 rounded text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">⚡ Quick Auto-Fill DSR Expense Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyDSRTemplate('fuel')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-800/80 text-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Fuel className="w-3 h-3 text-amber-400" /> Fuel & Genset
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDSRTemplate('catering')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-emerald-800/80 text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Utensils className="w-3 h-3 text-emerald-400" /> Unit Catering
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDSRTemplate('transport')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-blue-800/80 text-blue-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Truck className="w-3 h-3 text-blue-400" /> Fleet Transport
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDSRTemplate('crew_batta')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-purple-800/80 text-purple-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Zap className="w-3 h-3 text-purple-400" /> Daily Crew Batta
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDSRTemplate('all')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-indigo-800/80 text-indigo-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" /> All Shoot Disbursals
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {formSourceModule === 'PO' && (
                  <div className="space-y-2.5 pt-1 border-t border-amber-900/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                        Select Purchase Order (3-Way Matching Connected)
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {projectPurchaseOrders.length} available POs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-amber-300 uppercase block mb-1">
                          Select Purchase Order *
                        </label>
                        <select
                          value={formPoId}
                          onChange={(e) => handleSelectPo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-700/80 rounded text-xs text-white font-mono"
                        >
                          <option value="">-- Choose Purchase Order --</option>
                          {projectPurchaseOrders.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.poNumber} — {p.vendorName} (₹{Number(p.grandTotal || 0).toLocaleString('en-IN')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {formPoId && (() => {
                        const targetPo = allPurchaseOrders.find(p => p.id === formPoId);
                        if (!targetPo) return null;
                        const firstItem = targetPo.items?.[0];
                        return (
                          <div className="p-2 bg-amber-950/40 border border-amber-800/80 rounded text-[11px] text-slate-200">
                            <div className="font-bold text-amber-300 flex items-center justify-between">
                              <span>{targetPo.vendorName}</span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                ₹{Number(targetPo.grandTotal || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Dept: {targetPo.department}</span>
                              <span>•</span>
                              <span>PO Date: {targetPo.orderDate}</span>
                            </div>
                            {firstItem && (
                              <div className="mt-1 text-[10px] text-amber-200/90 font-medium bg-amber-900/30 px-1.5 py-0.5 rounded">
                                Budget Head: {firstItem.categoryName} › {firstItem.subCategoryName} › {firstItem.childCategoryName}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    1. Basic Information
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      Auto-fill Vendor:
                    </span>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => handleSelectVendor(e.target.value)}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-blue-300 font-bold max-w-[220px] cursor-pointer"
                    >
                      <option value="">-- Choose Registered Vendor --</option>
                      {allVendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.vendorName} ({v.category || 'Vendor'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Expense Voucher No.</label>
                    <input 
                      type="text" 
                      value={formVoucherNo}
                      readOnly
                      className="w-full px-2.5 py-1.5 bg-slate-800/50 border border-slate-700/60 rounded text-xs font-mono font-bold text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date *</label>
                    <input 
                      type="date" 
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payee / Person / Vendor Name *</label>
                    <input 
                      type="text" 
                      value={formPayee}
                      onChange={(e) => handlePayeeChange(e.target.value)}
                      placeholder="e.g. Rajesh Kumar, Manoj Das, ABC Transport"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Designation</label>
                    <input 
                      type="text" 
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Production Assistant, Art Director, Driver"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formPayeePhone}
                      onChange={(e) => setFormPayeePhone(e.target.value)}
                      placeholder="e.g. 9830123537"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">E-Mail Address</label>
                    <input 
                      type="email" 
                      value={formPayeeEmail}
                      onChange={(e) => setFormPayeeEmail(e.target.value)}
                      placeholder="e.g. payee@productionmail.com"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Budget Mapping Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  2. Budget Mapping
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span>Category *</span>
                      {formCategoryId && (() => {
                        const selectedCat = projectCategories.find(c => c.id === formCategoryId);
                        return selectedCat ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 lowercase font-normal">
                            ₹{getCategoryBudget(selectedCat).toLocaleString('en-IN')}
                          </span>
                        ) : null;
                      })()}
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        setFormCategoryId(e.target.value);
                        setFormSubCategoryId('');
                        setFormChildCategoryId('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    >
                      <option value="">Select Category</option>
                      {projectCategories.map((c, idx) => (
                        <option key={c.id} value={c.id}>
                          {idx + 1}. {c.name} — ₹{getCategoryBudget(c).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span>Subcategory</span>
                      {formSubCategoryId && (() => {
                        const selectedSub = availableSubCategories.find(s => s.id === formSubCategoryId);
                        return selectedSub ? (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 lowercase font-normal">
                            ₹{getSubCategoryBudget(selectedSub).toLocaleString('en-IN')}
                          </span>
                        ) : null;
                      })()}
                    </label>
                    <select
                      value={formSubCategoryId}
                      onChange={(e) => {
                        setFormSubCategoryId(e.target.value);
                        setFormChildCategoryId('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    >
                      <option value="">Select Subcategory</option>
                      {availableSubCategories.map((s, sIdx) => {
                        const parentCat = projectCategories.find(c => c.id === formCategoryId);
                        const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                        const serial = `${parentIdx + 1}.${sIdx + 1}`;
                        return (
                          <option key={s.id} value={s.id}>
                            {serial}. {s.name} — ₹{getSubCategoryBudget(s).toLocaleString('en-IN')}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span>Budget Item / Head</span>
                      {formChildCategoryId && (() => {
                        const selectedChild = availableChildCategories.find(ch => ch.id === formChildCategoryId);
                        return selectedChild ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 lowercase font-normal">
                            ₹{getChildBudget(selectedChild).toLocaleString('en-IN')}
                          </span>
                        ) : null;
                      })()}
                    </label>
                    <select
                      value={formChildCategoryId}
                      onChange={(e) => setFormChildCategoryId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                    >
                      <option value="">Select Budget Item</option>
                      {availableChildCategories.map((ch, chIdx) => {
                        const parentCat = projectCategories.find(c => c.id === formCategoryId);
                        const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                        const sub = availableSubCategories.find(s => s.id === formSubCategoryId);
                        const subIdx = sub ? availableSubCategories.indexOf(sub) : 0;
                        const serial = `${parentIdx + 1}.${subIdx + 1}.${chIdx + 1}`;
                        return (
                          <option key={ch.id} value={ch.id}>
                            {serial}. {ch.name} — ₹{getChildBudget(ch).toLocaleString('en-IN')}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Budget Preview Card */}
                {selectedBudgetInfo && (
                  <div className={`p-3 rounded-xl border space-y-2 ${
                    selectedBudgetInfo.isOver ? 'bg-rose-950/40 border-rose-900/60' : 'bg-slate-800/50 border-slate-700/60'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-700/60 pb-1.5">
                      <span>Budget Preview: <strong className="text-blue-400">{selectedBudgetInfo.itemName}</strong></span>
                      {selectedBudgetInfo.isOver && (
                        <span className="text-[9px] font-black uppercase text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                          Over Budget Warning
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-1">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Approved Budget</span>
                        <span className="font-extrabold text-white">₹{selectedBudgetInfo.itemBudget.toLocaleString('en-IN')}</span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Previous Spent</span>
                        <span className="font-extrabold text-white">₹{selectedBudgetInfo.previousSpent.toLocaleString('en-IN')}</span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Available</span>
                        <span className="font-extrabold text-emerald-400">₹{selectedBudgetInfo.available.toLocaleString('en-IN')}</span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Balance After</span>
                        <span className={`font-black ${selectedBudgetInfo.isOver ? 'text-rose-400' : 'text-blue-400'}`}>
                          ₹{selectedBudgetInfo.balanceAfterBooking.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  3. Payment Information & Amount
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Mode</label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Type</label>
                    <select
                      value={formPaymentType}
                      onChange={(e) => setFormPaymentType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    >
                      <option value="Purchase">Purchase</option>
                      <option value="Wages">Wages</option>
                      <option value="Rent">Rent</option>
                      <option value="On Account">On Account (Advance)</option>
                      <option value="Reimbursement">Reimbursement</option>
                      <option value="Professional Fee">Professional Fee</option>
                      <option value="Advance">Advance</option>
                      <option value="Security Deposit">Security Deposit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Account</label>
                    <select
                      value={formPaymentAccount}
                      onChange={(e) => setFormPaymentAccount(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                    >
                      <option value="Production Cash">Production Cash</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="Location Cash">Location Cash</option>
                      <option value="HDFC Current Account">HDFC Current Account</option>
                      <option value="ICICI Production Account">ICICI Production Account</option>
                      <option value="Company UPI">Company UPI</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Payment Mode Fields */}
                {formPaymentMode === 'Cheque' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-lg">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Cheque Number</label>
                      <input 
                        type="text"
                        value={formChequeNo}
                        onChange={(e) => setFormChequeNo(e.target.value)}
                        placeholder="e.g. 000124"
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Cheque Date</label>
                      <input 
                        type="date"
                        value={formChequeDate}
                        onChange={(e) => setFormChequeDate(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Bank Name</label>
                      <input 
                        type="text"
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {formPaymentMode === 'Bank Transfer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-lg">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">UTR / Ref Number</label>
                      <input 
                        type="text"
                        value={formUtrNumber}
                        onChange={(e) => setFormUtrNumber(e.target.value)}
                        placeholder="e.g. UTR123456789"
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Bank Name</label>
                      <input 
                        type="text"
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        placeholder="e.g. ICICI Bank"
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {formPaymentMode === 'UPI' && (
                  <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-lg">
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">UPI ID / Txn ID</label>
                    <input 
                      type="text"
                      value={formUpiId}
                      onChange={(e) => setFormUpiId(e.target.value)}
                      placeholder="e.g. 9830000000@paytm"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                )}

                {/* Amount Field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Amount (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-base font-black font-mono text-white"
                  />
                </div>
              </div>

              {/* On Account Form Extra Fields */}
              {formPaymentType === 'On Account' && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-2.5">
                  <h4 className="text-xs font-extrabold text-indigo-300 uppercase">On Account Advance Details</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-indigo-300 uppercase mb-1 block">On Account Holder</label>
                      <input 
                        type="text"
                        value={formOnAccountHolder}
                        onChange={(e) => setFormOnAccountHolder(e.target.value)}
                        placeholder="Person or Dept receiving advance"
                        className="w-full px-2.5 py-1 bg-slate-900 border border-indigo-900/60 rounded text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-indigo-300 uppercase mb-1 block">Settlement Due Date</label>
                      <input 
                        type="date"
                        value={formSettlementDueDate}
                        onChange={(e) => setFormSettlementDueDate(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-indigo-900/60 rounded text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-indigo-300 uppercase mb-1 block">Purpose of Advance</label>
                    <input 
                      type="text"
                      value={formOnAccountPurpose}
                      onChange={(e) => setFormOnAccountPurpose(e.target.value)}
                      placeholder="e.g. Daily production expenses, set construction labour advance"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-indigo-900/60 rounded text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Reimbursement Form Extra Fields */}
              {formPaymentType === 'Reimbursement' && (
                <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl space-y-2.5">
                  <h4 className="text-xs font-extrabold text-blue-300 uppercase">Reimbursement Details</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-blue-300 uppercase mb-1 block">Reimbursement Type</label>
                      <select
                        value={formReimbursementType}
                        onChange={(e) => setFormReimbursementType(e.target.value as any)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-blue-900/60 rounded text-xs text-white font-semibold"
                      >
                        <option value="Simple Reimbursement">Simple Reimbursement</option>
                        <option value="Against On Account">Against On Account Advance</option>
                      </select>
                    </div>

                    {formReimbursementType === 'Against On Account' && (
                      <div>
                        <label className="text-[9px] font-bold text-blue-300 uppercase mb-1 block">Related On Account Voucher</label>
                        <select
                          value={formRelatedOnAccountVoucher}
                          onChange={(e) => setFormRelatedOnAccountVoucher(e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-blue-900/60 rounded text-xs text-white"
                        >
                          <option value="">Select Open Advance Voucher</option>
                          {openOnAccountVouchers.map(v => (
                            <option key={v.id} value={v.bookingNo || v.voucherNumber}>
                              {v.bookingNo || v.voucherNumber} - {v.payee} (₹{v.amount})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Invoicing, GST & TDS Withholding Section */}
              <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      4. Invoicing, GST & TDS Withholding (Optional)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    {showTaxBreakdown ? 'Hide Tax Breakdown' : 'Expand Tax Breakdown'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Invoice / Bill Number</label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextNum = generateNextSerialInvoiceNumber([], expenses);
                          setFormInvoiceNumber(nextNum);
                          if (!formInvoiceDate) {
                            setFormInvoiceDate(formDate || new Date().toISOString().substring(0, 10));
                          }
                        }}
                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5 cursor-pointer"
                        title="Auto-generate sequential serial invoice number"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> Auto Next Serial
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV/2026/089"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Invoice Date</label>
                    <input 
                      type="date"
                      value={formInvoiceDate}
                      onChange={(e) => setFormInvoiceDate(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Vendor PAN Number</label>
                    <input 
                      type="text"
                      maxLength={10}
                      value={formPanNumber}
                      onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs uppercase font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Vendor GSTIN</label>
                    <input 
                      type="text"
                      maxLength={15}
                      value={formGstin}
                      onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 19ABCDE1234F1Z5"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs uppercase font-mono text-white"
                    />
                  </div>
                </div>

                {showTaxBreakdown && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-emerald-400 uppercase mb-1 block">Taxable / Base Amount (₹)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={formBaseAmount}
                          onChange={(e) => {
                            setFormBaseAmount(e.target.value);
                            handleTaxRecalculate(e.target.value, formGstRate, formTdsSection, formTdsRate);
                          }}
                          placeholder={formAmount || "0.00"}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-emerald-300"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">GST Rate</label>
                        <select
                          value={formGstRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormGstRate(val);
                            handleTaxRecalculate(formBaseAmount || formAmount, val, formTdsSection, formTdsRate);
                          }}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value="0">0% (Nil / Exempt)</option>
                          <option value="5">5% (Catering / Transport)</option>
                          <option value="12">12% (Job work / Printing)</option>
                          <option value="18">18% (Standard Services / Equipment)</option>
                          <option value="28">28% (Luxury / Vehicles)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">TDS Section (Income Tax)</label>
                        <select
                          value={formTdsSection}
                          onChange={(e) => {
                            const sec = e.target.value as any;
                            setFormTdsSection(sec);
                            handleTaxRecalculate(formBaseAmount || formAmount, formGstRate, sec);
                          }}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value="NONE">No TDS (0%)</option>
                          <option value="194C_INDIV">194C (1%) - Contractor / Transporter (Indiv/HUF)</option>
                          <option value="194C_OTHERS">194C (2%) - Contractor / Catering (Company)</option>
                          <option value="194J_TECH">194J (2%) - Technical Fee / Royalty</option>
                          <option value="194J_PROF">194J (10%) - Professional / Artist / Director</option>
                          <option value="194I_BUILDING">194I (10%) - Rent: Land / Studio / Set</option>
                          <option value="194I_PLANT">194I (2%) - Rent: Equipment / Camera / Genset</option>
                          <option value="194H">194H (5%) - Commission / Brokerage</option>
                          <option value="194Q">194Q (0.1%) - Purchase of Goods</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Tax Calculation Breakdown */}
                    {(() => {
                      const base = parseFloat(formBaseAmount) || parseFloat(formAmount) || 0;
                      const gstVal = (base * formGstRate) / 100;
                      const gross = base + gstVal;
                      const tdsVal = (base * formTdsRate) / 100;
                      const net = gross - tdsVal;

                      return (
                        <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs space-y-1.5 font-mono">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Base / Taxable Value:</span>
                            <span>₹{base.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {formGstRate > 0 && (
                            <div className="flex justify-between text-blue-400 text-[11px]">
                              <span>GST ({formGstRate}%):</span>
                              <span>+₹{gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-white font-bold text-[11px] border-t border-slate-800 pt-1">
                            <span>Gross Invoiced Amount:</span>
                            <span>₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {formTdsRate > 0 && (
                            <div className="flex justify-between text-rose-400 text-[11px]">
                              <span>Less: TDS Deducted ({formTdsRate}%):</span>
                              <span>-₹{tdsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-emerald-400 font-extrabold text-xs border-t border-slate-800 pt-1">
                            <span>Net Payable to Payee / Vendor:</span>
                            <span>₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Notes & Attachments */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  5. Note & Attachments
                </h3>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Expense Note / Details</label>
                  <textarea 
                    rows={2}
                    maxLength={1000}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Enter detailed description, invoice reference, or payment purpose..."
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                  />
                  <div className="text-[9px] text-slate-500 text-right">{formNotes.length}/1000 chars</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Attachments (Invoices / Bills / Proofs)</label>
                    <button
                      type="button"
                      onClick={() => setIsOcrModalOpen(true)}
                      className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-200" />
                      Scan Receipt with Gemini AI
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-700/80 rounded-xl p-3 text-center hover:border-blue-500 transition-colors bg-slate-800/30 relative">
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-300">Click to upload or drag & drop files</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Supports .jpg, .jpeg, .png, .webp, .pdf (Max 10MB per file, up to 10 files)</p>
                    <input 
                      type="file" 
                      multiple 
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {formAttachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formAttachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-1.5 bg-slate-800/80 rounded border border-slate-700 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-semibold text-slate-200 truncate">{att.fileName}</span>
                            <span className="text-[9px] text-slate-400">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="text-slate-400 hover:text-rose-400 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Buttons */}
            <div className="shrink-0 p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBookDrawerOpen(false)}
                className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleFormSubmit('draft')}
                className="px-3 py-1.5 border border-slate-700 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleFormSubmit('submit')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-lg shadow-xs cursor-pointer"
              >
                Submit Expense
              </button>

              {['Producer', 'Admin', 'Accountant'].includes(userRole) && (
                <button
                  type="button"
                  onClick={() => handleFormSubmit('approve')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg shadow-xs cursor-pointer"
                >
                  Save & Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. UNCLEARED PAYEE WARNING MODAL */}
      {unclearedPayeeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl animate-in fade-in zoom-in-95 text-slate-100">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-sm">Uncleared Advance Alert</h3>
                <p className="text-[11px] text-slate-400">Payee has outstanding advance balance</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">{unclearedPayeeModal.payee}</strong> has an uncleared On Account balance of{' '}
              <strong className="text-rose-400">₹{unclearedPayeeModal.totalUnadjusted.toLocaleString('en-IN')}</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('uncleared_advances');
                  setUnclearedPayeeModal(null);
                  setIsBookDrawerOpen(false);
                }}
                className="px-3 py-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                View Previous Advances
              </button>

              <button
                onClick={() => setUnclearedPayeeModal(null)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PRINTABLE VOUCHER MODAL */}
      {printingVoucherExpense && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8 text-slate-100 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-black text-white">{companyName}</h2>
                <p className="text-xs text-slate-400">{projectName} • Payment Voucher</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-blue-400 block">{printingVoucherExpense.bookingNo || printingVoucherExpense.voucherNumber}</span>
                <span className="text-[10px] font-mono text-slate-400">{printingVoucherExpense.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Paid To</span>
                <strong className="text-white text-sm block">{printingVoucherExpense.payee}</strong>
                <span className="text-slate-400">{printingVoucherExpense.designation || 'Vendor / Crew'}</span>
                {(printingVoucherExpense.payeePhone || printingVoucherExpense.payeeEmail) && (
                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                    {printingVoucherExpense.payeePhone && <div>Ph: {printingVoucherExpense.payeePhone}</div>}
                    {printingVoucherExpense.payeeEmail && <div>Email: {printingVoucherExpense.payeeEmail}</div>}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Budget Head</span>
                <strong className="text-white block">{printingVoucherExpense.categoryName}</strong>
                <span className="text-slate-400">{printingVoucherExpense.budgetItemName || printingVoucherExpense.subCategoryName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                <span className="text-xs font-bold text-slate-400">Payment Mode & Account</span>
                <span className="text-xs font-bold text-white">{printingVoucherExpense.paymentMode} ({printingVoucherExpense.paymentAccount})</span>
              </div>

              {((printingVoucherExpense.gstAmount && printingVoucherExpense.gstAmount > 0) || (printingVoucherExpense.tdsAmount && printingVoucherExpense.tdsAmount > 0)) && (
                <div className="py-1 border-b border-slate-700/60 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Base Value:</span>
                    <span>₹{(Number(printingVoucherExpense.baseAmount) || Number(printingVoucherExpense.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {printingVoucherExpense.gstAmount && printingVoucherExpense.gstAmount > 0 && (
                    <div className="flex justify-between text-blue-400">
                      <span>Add GST ({printingVoucherExpense.gstRate || 0}%):</span>
                      <span>+₹{Number(printingVoucherExpense.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {printingVoucherExpense.tdsAmount && printingVoucherExpense.tdsAmount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Less TDS Sec {printingVoucherExpense.tdsSection} ({printingVoucherExpense.tdsRate || 0}%):</span>
                      <span>-₹{Number(printingVoucherExpense.tdsAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {printingVoucherExpense.panNumber && (
                    <div className="text-[10px] text-slate-400">
                      PAN: {printingVoucherExpense.panNumber} {printingVoucherExpense.gstin ? `| GSTIN: ${printingVoucherExpense.gstin}` : ''}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black text-white pt-1">
                <span>{printingVoucherExpense.netPayable ? 'Net Amount Paid / Disbursed:' : 'Total Amount Paid:'}</span>
                <span className="text-lg text-blue-400">
                  ₹{Number(printingVoucherExpense.netPayable || printingVoucherExpense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {printingVoucherExpense.notes && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Remarks / Notes</span>
                <p className="text-xs text-slate-300 mt-1 p-2 bg-slate-800/80 rounded border border-slate-700">{printingVoucherExpense.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-8 border-t border-slate-800 text-center text-xs">
              <div>
                <div className="border-b border-slate-700 pb-1 text-slate-500 font-mono text-[9px]">{printingVoucherExpense.createdBy || 'Prepared'}</div>
                <span className="font-bold text-slate-300 block mt-1">Prepared By</span>
              </div>

              <div>
                <div className="border-b border-slate-700 pb-1 text-slate-500 font-mono text-[9px]">Verified</div>
                <span className="font-bold text-slate-300 block mt-1">Checked By</span>
              </div>

              <div>
                <div className="border-b border-slate-700 pb-1 text-slate-500 font-mono text-[9px]">Approved</div>
                <span className="font-bold text-slate-300 block mt-1">Authorized Signatory</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPrintingVoucherExpense(null)}
                className="px-3.5 py-1.5 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => handleDownloadVoucherPdf(printingVoucherExpense)}
                disabled={isDownloadingVoucherPdf}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingVoucherPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Download PDF Voucher</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. VIEW EXPENSE DETAILS MODAL */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-3.5 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Expense Record</span>
                <h3 className="text-base font-extrabold text-white">{viewingExpense.bookingNo || viewingExpense.voucherNumber}</h3>
              </div>
              <button 
                onClick={() => setViewingExpense(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Payee</span>
                  <span className="font-bold text-white">{viewingExpense.payee}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Amount</span>
                  <span className="font-black text-blue-400 text-sm">₹{Number(viewingExpense.amount).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Category</span>
                  <span className="font-semibold text-slate-200">{viewingExpense.categoryName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Date</span>
                  <span className="font-mono text-slate-200">{viewingExpense.date}</span>
                </div>
              </div>

              {viewingExpense.notes && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Notes</span>
                  <p className="text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700 mt-0.5">{viewingExpense.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setViewingExpense(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-slate-100">
            <h3 className="font-extrabold text-white text-sm">Delete Expense Record?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete expense <strong className="text-white">{deleteConfirmTarget.bookingNo || deleteConfirmTarget.voucherNumber}</strong> for ₹{deleteConfirmTarget.amount}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  onDeleteExpense(deleteConfirmTarget.id);
                  setDeleteConfirmTarget(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 11. GEMINI AI RECEIPT OCR MODAL */}
      <AIReceiptOCRModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        categories={projectCategories}
        onApplyExtractedData={handleApplyOcrData}
        onDirectBookExpense={handleDirectBookFromOcr}
      />

      {/* 12. EXPORT ENGINE MODAL */}
      <ExportEngineModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projects={projects}
        activeProject={currentProject}
        selectedProjectId={selectedProjectId}
        categories={projectCategories}
        expenses={projectExpenses}
        activeCompany={activeCompany || { name: companyName }}
        defaultReportType="expense_journal"
      />
    </div>
  );
};
