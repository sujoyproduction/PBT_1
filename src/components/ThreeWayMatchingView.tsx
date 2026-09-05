import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Truck,
  Receipt,
  Download,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw,
  Send,
  HelpCircle,
  Info,
  DollarSign,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, VendorInvoice, BudgetCategory, Project, Expense, Vendor } from '../types';
import { subscribePurchaseOrders, savePurchaseOrder, deletePurchaseOrder, saveExpense, addDbLog } from '../services/firebaseService';
import InvoiceGeneratorModal from './InvoiceGeneratorModal';
import { generateNextSerialInvoiceNumber } from '../utils/invoiceUtils';
import { DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE } from '../defaultCookingShowBudget';
import { generateStandardCategoriesForProject } from '../data';

export interface ThreeWayMatchingViewProps {
  categories?: BudgetCategory[];
  projects?: Project[];
  vendors?: Vendor[];
  selectedProjectId?: string;
  userRole?: string;
  onNavigateToExpenses?: () => void;
  initialTab?: 'matrix' | 'pos' | 'grns' | 'invoices' | 'disputes';
  compactMode?: boolean;
  hideHeaderBanner?: boolean;
  hideSubNavTabs?: boolean;
  openCreatePoSignal?: number;
  openRecordGrnSignal?: number;
  openRecordInvoiceSignal?: number;
  openDebitNoteSignal?: number;
  onTabChange?: (tab: 'matrix' | 'pos' | 'grns' | 'invoices' | 'disputes') => void;
}

export default function ThreeWayMatchingView({
  categories = [],
  projects = [],
  vendors = [],
  selectedProjectId = '',
  userRole = 'Line Producer',
  onNavigateToExpenses,
  initialTab = 'matrix',
  compactMode = false,
  hideHeaderBanner = false,
  hideSubNavTabs = false,
  openCreatePoSignal = 0,
  openRecordGrnSignal = 0,
  openRecordInvoiceSignal = 0,
  openDebitNoteSignal = 0,
  onTabChange
}: ThreeWayMatchingViewProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'pos' | 'grns' | 'invoices' | 'disputes'>(initialTab || 'matrix');
  const [search, setSearch] = useState('');
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<string>('ALL');

  // Active 20-category budget structure for Cooking Show
  const activeBudgetCategories = useMemo<BudgetCategory[]>(() => {
    if (categories && categories.length > 0) {
      const projCats = categories.filter(c => 
        !c.projectId || 
        c.projectId === selectedProjectId || 
        c.projectId.replace(/^(wp_|p_|proj_)/, '') === selectedProjectId?.replace(/^(wp_|p_|proj_)/, '')
      );
      if (projCats.length > 0) return projCats;
    }
    return generateStandardCategoriesForProject(selectedProjectId || 'p_cooking_show', 'Cooking Show');
  }, [categories, selectedProjectId]);

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

  // Inspector & Modal States
  const [inspectingPo, setInspectingPo] = useState<PurchaseOrder | null>(null);
  const [inspectingInvoice, setInspectingInvoice] = useState<VendorInvoice | null>(null);
  const [viewingInvoiceSheet, setViewingInvoiceSheet] = useState<VendorInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<VendorInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ po: PurchaseOrder; invoice: VendorInvoice } | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);
  const [isRecordGrnModalOpen, setIsRecordGrnModalOpen] = useState(false);
  const [isRecordInvoiceModalOpen, setIsRecordInvoiceModalOpen] = useState(false);
  const [isDebitNoteModalOpen, setIsDebitNoteModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Target PO for sub-actions
  const [targetPoId, setTargetPoId] = useState<string>('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (openCreatePoSignal && openCreatePoSignal > 0) {
      setIsCreatePoModalOpen(true);
    }
  }, [openCreatePoSignal]);

  useEffect(() => {
    if (openRecordGrnSignal && openRecordGrnSignal > 0) {
      if (!targetPoId && purchaseOrders.length > 0) {
        setTargetPoId(purchaseOrders[0].id);
      }
      setIsRecordGrnModalOpen(true);
    }
  }, [openRecordGrnSignal, purchaseOrders, targetPoId]);

  useEffect(() => {
    if (openRecordInvoiceSignal && openRecordInvoiceSignal > 0) {
      if (!targetPoId && purchaseOrders.length > 0) {
        setTargetPoId(purchaseOrders[0].id);
      }
      setIsRecordInvoiceModalOpen(true);
    }
  }, [openRecordInvoiceSignal, purchaseOrders, targetPoId]);

  useEffect(() => {
    if (openDebitNoteSignal && openDebitNoteSignal > 0) {
      const poWithDispute = purchaseOrders.find(p => p.invoices && p.invoices.some(inv => inv.matchStatus === 'PRICE_MISMATCH' || inv.matchStatus === 'QTY_MISMATCH' || (inv.varianceAmount && inv.varianceAmount > 0))) || purchaseOrders[0];
      if (poWithDispute) {
        setInspectingPo(poWithDispute);
        const inv = poWithDispute.invoices?.find(i => i.matchStatus === 'PRICE_MISMATCH' || i.matchStatus === 'QTY_MISMATCH' || (i.varianceAmount && i.varianceAmount > 0)) || poWithDispute.invoices?.[0];
        setInspectingInvoice(inv || null);
        setTargetPoId(poWithDispute.id);
      }
      setIsDebitNoteModalOpen(true);
    }
  }, [openDebitNoteSignal, purchaseOrders]);

  // Form States for PO Creation
  const [poVendorName, setPoVendorName] = useState('');
  const [poVendorGstin, setPoVendorGstin] = useState('');
  const [poVendorPan, setPoVendorPan] = useState('');
  const [poDepartment, setPoDepartment] = useState('Camera & Optics');
  const [poPaymentTerms, setPoPaymentTerms] = useState('50% Advance, 50% Post-Shoot Net 15');
  const [poOrderDate, setPoOrderDate] = useState(new Date().toISOString().substring(0, 10));
  const [poDeliveryDate, setPoDeliveryDate] = useState(new Date().toISOString().substring(0, 10));
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{
    description: string;
    qty: number;
    unit: string;
    unitRate: number;
    gstRate: number;
    categoryId?: string;
    categoryName?: string;
    subCategoryId?: string;
    subCategoryName?: string;
    childCategoryId?: string;
    childCategoryName?: string;
  }>>([
    { description: '', qty: 1, unit: 'Units', unitRate: 0, gstRate: 18 }
  ]);

  // Form States for GRN
  const [grnChallanNo, setGrnChallanNo] = useState('');
  const [grnChallanDate, setGrnChallanDate] = useState(new Date().toISOString().substring(0, 10));
  const [grnReceivedBy, setGrnReceivedBy] = useState('Assistant Director / Camera 1st AC');
  const [grnDsrDay, setGrnDsrDay] = useState('Day 01');
  const [grnItemRecQties, setGrnItemRecQties] = useState<Record<string, number>>({});
  const [grnNotes, setGrnNotes] = useState('');

  // Form States for Invoice
  const [invNumber, setInvNumber] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().substring(0, 10));
  const [invDueDate, setInvDueDate] = useState('');
  const [invTdsSection, setInvTdsSection] = useState('194C_OTHERS');
  const [invItemBilledQties, setInvItemBilledQties] = useState<Record<string, { qty: number; rate: number }>>({});

  // Toast / Confirmation feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Subscribe to Firestore purchase_orders
  useEffect(() => {
    const unsub = subscribePurchaseOrders((data) => {
      if (Array.isArray(data)) {
        setPurchaseOrders(data);
      } else {
        setPurchaseOrders([]);
      }
    });
    return () => unsub();
  }, []);

  // Compute metrics
  const metrics = useMemo(() => {
    let totalPoCommitted = 0;
    let totalInvoicedAmount = 0;
    let perfectMatchesCount = 0;
    let priceMismatchesCount = 0;
    let qtyMismatchesCount = 0;
    let totalVarianceAmount = 0;

    purchaseOrders.forEach((po) => {
      totalPoCommitted += po.grandTotal || 0;
      (po.invoices || []).forEach((inv) => {
        totalInvoicedAmount += inv.netPayable || inv.baseAmount || 0;
        if (inv.matchStatus === 'MATCHED' || inv.approvalStatus === 'Approved') {
          perfectMatchesCount++;
        } else if (inv.matchStatus === 'PRICE_MISMATCH') {
          priceMismatchesCount++;
          totalVarianceAmount += inv.varianceAmount || 0;
        } else if (inv.matchStatus === 'QTY_MISMATCH') {
          qtyMismatchesCount++;
          totalVarianceAmount += inv.varianceAmount || 0;
        }
      });
    });

    return {
      totalPoCommitted,
      totalInvoicedAmount,
      perfectMatchesCount,
      priceMismatchesCount,
      qtyMismatchesCount,
      totalVarianceAmount,
      totalPosCount: purchaseOrders.length
    };
  }, [purchaseOrders]);

  // Flatten all Invoices across POs with parent context
  const allInvoices = useMemo(() => {
    const list: Array<{ po: PurchaseOrder; invoice: VendorInvoice }> = [];
    purchaseOrders.forEach((po) => {
      (po.invoices || []).forEach((inv) => {
        list.push({ po, invoice: inv });
      });
    });
    return list;
  }, [purchaseOrders]);

  // Flatten all GRNs across POs
  const allGrns = useMemo(() => {
    const list: Array<{ po: PurchaseOrder; grn: GoodsReceiptNote }> = [];
    purchaseOrders.forEach((po) => {
      (po.grns || []).forEach((grn) => {
        list.push({ po, grn });
      });
    });
    return list;
  }, [purchaseOrders]);

  // Filtered PO list
  const filteredPos = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = search.toLowerCase();
      const matchSearch =
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        po.department.toLowerCase().includes(q) ||
        po.items.some((i) => i.itemDescription.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (selectedFilterStatus === 'ALL') return true;
      if (selectedFilterStatus === 'MATCHED') {
        return (po.invoices || []).some((inv) => inv.matchStatus === 'MATCHED');
      }
      if (selectedFilterStatus === 'DISPUTED') {
        return (po.invoices || []).some(
          (inv) => inv.matchStatus === 'PRICE_MISMATCH' || inv.matchStatus === 'QTY_MISMATCH'
        );
      }
      return true;
    });
  }, [purchaseOrders, search, selectedFilterStatus]);

  // Action: One-click Approve & Book Expense from Verified 3-Way Match
  const handleApproveAndBookExpense = async (po: PurchaseOrder, invoice: VendorInvoice) => {
    try {
      const projId = selectedProjectId || po.projectId || 'p_default';
      const voucherNum = `EXP-PO-${Date.now().toString().slice(-6)}`;
      const amt = invoice.netPayable || invoice.baseAmount + invoice.gstAmount;

      // Extract category hierarchy from matched PO item
      const matchedItem = (po.items || []).find(it => it.categoryId) || po.items?.[0];
      const catId = matchedItem?.categoryId || '';
      const catName = matchedItem?.categoryName || po.department || 'Production';
      const subCatId = matchedItem?.subCategoryId || '';
      const subCatName = matchedItem?.subCategoryName || '';
      const childCatId = matchedItem?.childCategoryId || '';
      const childCatName = matchedItem?.childCategoryName || '';
      const budgetHead = childCatName || subCatName || matchedItem?.itemDescription || catName;

      const newExpense: Partial<Expense> = {
        id: `exp_po_${Date.now()}`,
        projectId: projId,
        voucherNumber: voucherNum,
        bookingNo: voucherNum,
        date: invoice.invoiceDate || new Date().toISOString().substring(0, 10),
        payee: invoice.vendorName || po.vendorName,
        categoryId: catId,
        categoryName: catName,
        subCategoryId: subCatId || undefined,
        subCategoryName: subCatName || '',
        childCategoryId: childCatId || undefined,
        budgetItemName: budgetHead,
        amount: amt,
        baseAmount: invoice.baseAmount,
        gstRate: invoice.gstRate,
        gstAmount: invoice.gstAmount,
        tdsSection: invoice.tdsSection as any,
        tdsRate: invoice.tdsRate,
        tdsAmount: invoice.tdsAmount,
        netPayable: amt - (invoice.tdsAmount || 0),
        paymentMode: 'Bank Transfer',
        paymentType: 'Purchase',
        status: 'Approved',
        approvalStatus: 'Approved',
        paymentStatus: 'Unpaid',
        sourceModule: 'PO',
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        gstin: invoice.vendorGstin || po.vendorGstin,
        title: `${po.poNumber} Settlement - ${invoice.vendorName} (${invoice.invoiceNumber}) [${budgetHead}]`,
        notes: `3-Way Match Verified. Linked to Purchase Order ${po.poNumber} (${catName} › ${subCatName || ''} › ${childCatName || ''}) and GRN. Payment released under standard terms.`,
        createdAt: new Date().toISOString()
      };

      await saveExpense(newExpense as Expense);

      // Update invoice status in PO
      const updatedInvoices = (po.invoices || []).map((inv) => {
        if (inv.id === invoice.id) {
          return {
            ...inv,
            approvalStatus: 'Approved' as const,
            linkedExpenseId: newExpense.id
          };
        }
        return inv;
      });

      const updatedPo = {
        ...po,
        invoices: updatedInvoices,
        status: 'Fulfilled' as const
      };

      await savePurchaseOrder(updatedPo);

      addDbLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: '3_WAY_MATCH_EXPENSE_BOOKED',
        details: `3-Way Match verified and Expense Voucher ${voucherNum} booked for ${po.poNumber} (${catName} › ${subCatName || ''} › ${childCatName || ''}, ₹${amt.toLocaleString()})`,
        user: userRole
      });

      setSuccessToast(`Successfully verified 3-Way Match & created Expense Voucher ${voucherNum} for ₹${amt.toLocaleString('en-IN')} under ${budgetHead}!`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error('Failed to approve 3-way match expense:', err);
      alert('Error booking expense. Please retry.');
    }
  };

  // Action: Line Producer Override
  const handleConfirmOverride = async (justification: string) => {
    if (!inspectingPo || !inspectingInvoice) return;
    try {
      const updatedInvoices = (inspectingPo.invoices || []).map((inv) => {
        if (inv.id === inspectingInvoice.id) {
          return {
            ...inv,
            matchStatus: 'RECONCILED' as const,
            approvalStatus: 'Approved' as const,
            discrepancyNote: `LP OVERRIDE APPROVED by ${userRole}: ${justification}`
          };
        }
        return inv;
      });

      const updatedPo = {
        ...inspectingPo,
        invoices: updatedInvoices
      };

      await savePurchaseOrder(updatedPo);
      setInspectingPo(updatedPo);
      setInspectingInvoice({
        ...inspectingInvoice,
        matchStatus: 'RECONCILED',
        approvalStatus: 'Approved',
        discrepancyNote: `LP OVERRIDE APPROVED by ${userRole}: ${justification}`
      });

      addDbLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: '3_WAY_MATCH_LP_OVERRIDE',
        details: `Line Producer override approved for ${inspectingPo.poNumber} (${inspectingInvoice.invoiceNumber}): ${justification}`,
        user: userRole
      });

      setIsOverrideModalOpen(false);
      setSuccessToast(`Line Producer Override recorded for invoice ${inspectingInvoice.invoiceNumber}`);
      setTimeout(() => setSuccessToast(null), 4500);
    } catch (err) {
      console.error('Error recording LP override:', err);
    }
  };

  // Action: Create PO Handler
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendorName.trim()) return;

    let baseTot = 0;
    let gstTot = 0;

    const formattedItems: PurchaseOrderItem[] = poItems.map((item, idx) => {
      const base = item.qty * item.unitRate;
      const gst = (base * item.gstRate) / 100;
      baseTot += base;
      gstTot += gst;

      return {
        id: `poi_${Date.now()}_${idx}`,
        itemDescription: item.description,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subCategoryId: item.subCategoryId,
        subCategoryName: item.subCategoryName,
        childCategoryId: item.childCategoryId,
        childCategoryName: item.childCategoryName,
        budgetItemName: item.childCategoryName || item.subCategoryName || item.description,
        orderQty: item.qty,
        unit: item.unit,
        unitRate: item.unitRate,
        gstRate: item.gstRate,
        totalBase: base,
        gstAmount: gst,
        totalAmount: base + gst,
        receivedQty: 0,
        invoicedQty: 0,
        invoicedAmount: 0,
        status: 'Pending'
      };
    });

    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: selectedProjectId || 'p_default',
      vendorName: poVendorName,
      vendorGstin: poVendorGstin ? poVendorGstin.trim().toUpperCase() : '',
      vendorPan: poVendorPan ? poVendorPan.trim().toUpperCase() : '',
      orderDate: poOrderDate,
      deliveryDate: poDeliveryDate,
      department: poDepartment,
      paymentTerms: poPaymentTerms,
      items: formattedItems,
      totalBaseAmount: baseTot,
      totalGstAmount: gstTot,
      grandTotal: baseTot + gstTot,
      grns: [],
      invoices: [],
      notes: poNotes,
      status: 'Issued',
      createdBy: userRole,
      createdAt: new Date().toISOString()
    };

    const nextList = [newPo, ...purchaseOrders];
    setPurchaseOrders(nextList);
    await savePurchaseOrder(newPo);

    addDbLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PURCHASE_ORDER_ISSUED',
      details: `Issued Purchase Order ${newPo.poNumber} to ${newPo.vendorName} (₹${newPo.grandTotal.toLocaleString()})`,
      user: userRole
    });

    setIsCreatePoModalOpen(false);
    setPoVendorName('');
    setPoVendorGstin('');
    setPoVendorPan('');
    setPoNotes('');
    setSuccessToast(`Purchase Order ${newPo.poNumber} issued successfully!`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // Action: Record GRN (Delivery Challan)
  const handleRecordGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find((p) => p.id === targetPoId);
    if (!po) return;

    const grnItems = po.items.map((it) => {
      const rec = grnItemRecQties[it.id] !== undefined ? grnItemRecQties[it.id] : it.orderQty;
      return {
        itemId: it.id,
        itemDescription: it.itemDescription,
        receivedQty: rec,
        acceptedQty: rec,
        rejectedQty: 0,
        remarks: 'Received and inspected on location.'
      };
    });

    const newGrn: GoodsReceiptNote = {
      id: `grn_${Date.now()}`,
      grnNumber: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      deliveryChallanNo: grnChallanNo || `DC-${Date.now().toString().slice(-4)}`,
      challanDate: grnChallanDate,
      receivedDate: grnChallanDate,
      receivedBy: grnReceivedBy,
      dsrShootDay: grnDsrDay,
      items: grnItems,
      notes: grnNotes,
      createdAt: new Date().toISOString()
    };

    // Update PO item received quantities
    const updatedItems = po.items.map((it) => {
      const rec = grnItemRecQties[it.id] !== undefined ? grnItemRecQties[it.id] : it.orderQty;
      return {
        ...it,
        receivedQty: (it.receivedQty || 0) + rec,
        status: (it.receivedQty || 0) + rec >= it.orderQty ? ('Fully Received' as const) : ('Partially Received' as const)
      };
    });

    const updatedPo: PurchaseOrder = {
      ...po,
      items: updatedItems,
      grns: [...(po.grns || []), newGrn],
      status: 'Partially Fulfilled'
    };

    await savePurchaseOrder(updatedPo);
    setIsRecordGrnModalOpen(false);
    setGrnChallanNo('');
    setGrnNotes('');
    setSuccessToast(`Goods Receipt Note ${newGrn.grnNumber} recorded against ${po.poNumber}`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // Action: Record Vendor Invoice and run 3-Way Match Algorithm
  const handleRecordInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find((p) => p.id === targetPoId);
    if (!po) return;

    let baseTot = 0;
    let gstTot = 0;
    let hasPriceMismatch = false;
    let hasQtyMismatch = false;
    let varianceAmt = 0;
    const discrepancyNotes: string[] = [];

    const invItems = po.items.map((it) => {
      const billed = invItemBilledQties[it.id] || { qty: it.orderQty, rate: it.unitRate };
      const itemBase = billed.qty * billed.rate;
      const itemGst = (itemBase * it.gstRate) / 100;
      baseTot += itemBase;
      gstTot += itemGst;

      // Compare Rate
      if (billed.rate > it.unitRate) {
        hasPriceMismatch = true;
        const diff = (billed.rate - it.unitRate) * billed.qty;
        varianceAmt += diff + (diff * it.gstRate) / 100;
        discrepancyNotes.push(
          `Price Escalation on ${it.itemDescription}: Billed @ ₹${billed.rate}/unit (PO Approved Rate is ₹${it.unitRate})`
        );
      }

      // Compare Quantity against GRN received
      const totalRec = it.receivedQty || 0;
      if (billed.qty > totalRec) {
        hasQtyMismatch = true;
        const excessQty = billed.qty - totalRec;
        const excessVal = excessQty * it.unitRate;
        varianceAmt += excessVal + (excessVal * it.gstRate) / 100;
        discrepancyNotes.push(
          `Quantity Overbill on ${it.itemDescription}: Billed ${billed.qty} units (Only ${totalRec} received on GRN/DSR)`
        );
      }

      return {
        itemId: it.id,
        itemDescription: it.itemDescription,
        invoicedQty: billed.qty,
        unitRate: billed.rate,
        totalAmount: itemBase + itemGst,
        hsnSacCode: '997312'
      };
    });

    let matchStatus: VendorInvoice['matchStatus'] = 'MATCHED';
    let approvalStatus: VendorInvoice['approvalStatus'] = 'Pending';

    if (po.grns?.length === 0) {
      matchStatus = 'NO_GRN';
      discrepancyNotes.push('No Goods Receipt Note (GRN) or DSR delivery recorded yet.');
    } else if (hasQtyMismatch) {
      matchStatus = 'QTY_MISMATCH';
      approvalStatus = 'Disputed';
    } else if (hasPriceMismatch) {
      matchStatus = 'PRICE_MISMATCH';
      approvalStatus = 'Disputed';
    } else {
      matchStatus = 'MATCHED';
      approvalStatus = 'Approved';
    }

    const tdsAmt = (baseTot * 2) / 100; // 2% TDS standard

    const newInvoice: VendorInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invNumber || generateNextSerialInvoiceNumber(purchaseOrders),
      invoiceDate: invDate,
      dueDate: invDueDate || invDate,
      poId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      vendorGstin: po.vendorGstin,
      items: invItems,
      baseAmount: baseTot,
      gstRate: 18,
      gstAmount: gstTot,
      tdsSection: invTdsSection,
      tdsRate: 2,
      tdsAmount: tdsAmt,
      netPayable: baseTot + gstTot - tdsAmt,
      matchStatus,
      varianceAmount: varianceAmt,
      discrepancyNote:
        discrepancyNotes.length > 0
          ? discrepancyNotes.join(' | ')
          : 'Exact 3-Way Match verified between PO, Goods Receipt, and Invoice.',
      approvalStatus,
      createdAt: new Date().toISOString()
    };

    const updatedPo: PurchaseOrder = {
      ...po,
      invoices: [...(po.invoices || []), newInvoice],
      status: matchStatus === 'MATCHED' ? 'Fulfilled' : 'Under Audit'
    };

    await savePurchaseOrder(updatedPo);
    setIsRecordInvoiceModalOpen(false);
    setInvNumber('');
    setSuccessToast(
      matchStatus === 'MATCHED'
        ? `Invoice recorded! 3-Way Match PERFECT MATCH confirmed.`
        : `Invoice recorded! 3-Way Engine flagged ${matchStatus.replace('_', ' ')} (Variance ₹${varianceAmt.toLocaleString()}).`
    );
    setTimeout(() => setSuccessToast(null), 5500);
  };

  // Action: Confirm and permanently delete an invoice
  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    const { po, invoice } = invoiceToDelete;
    setIsDeletingInvoice(true);

    try {
      const updatedPOs = purchaseOrders.map((p) => {
        const hasInvoice = p.invoices?.some((i) => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
        if (!hasInvoice) return p;

        const remainingInvoices = (p.invoices || []).filter(
          (i) => i.id !== invoice.id && i.invoiceNumber !== invoice.invoiceNumber
        );
        let newStatus: PurchaseOrder['status'] = p.status;
        if (remainingInvoices.length === 0) {
          newStatus = p.grns && p.grns.length > 0 ? 'Partially Fulfilled' : 'Issued';
        } else if (remainingInvoices.some((i) => i.matchStatus === 'PRICE_MISMATCH' || i.matchStatus === 'QTY_MISMATCH')) {
          newStatus = 'Under Audit';
        } else if (remainingInvoices.every((i) => i.matchStatus === 'MATCHED')) {
          newStatus = 'Fulfilled';
        }

        return {
          ...p,
          invoices: remainingInvoices,
          status: newStatus
        };
      });

      for (const updatedP of updatedPOs) {
        const originalP = purchaseOrders.find((orig) => orig.id === updatedP.id);
        if (originalP && originalP.invoices?.length !== updatedP.invoices?.length) {
          await savePurchaseOrder(updatedP);
        }
      }

      setPurchaseOrders(updatedPOs);

      addDbLog({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'VENDOR_INVOICE_DELETED',
        details: `Deleted invoice ${invoice.invoiceNumber} (₹${(invoice.netPayable || invoice.totalAmount || 0).toLocaleString()}) for vendor ${invoice.vendorName} against PO ${po.poNumber}`,
        user: userRole
      });

      setSuccessToast(`Invoice ${invoice.invoiceNumber} deleted successfully.`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err) {
      console.error('Error deleting invoice:', err);
    } finally {
      setIsDeletingInvoice(false);
      setInvoiceToDelete(null);
    }
  };

  // Action: Save Generated Invoice from Budget Hierarchy Form into Records (Create or Edit)
  const handleSaveGeneratedInvoice = async (newInvoice: VendorInvoice, linkedPoId: string) => {
    let targetPo = purchaseOrders.find((p) => p.id === linkedPoId);

    // If no PO matched or direct bill:
    if (!targetPo) {
      if (purchaseOrders.length > 0) {
        targetPo = purchaseOrders[0];
      } else {
        const directPo: PurchaseOrder = {
          id: `po_dir_${Date.now()}`,
          poNumber: `PO-DIR-${newInvoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '') || 'INV'}`,
          projectId: selectedProjectId || projects[0]?.id || 'p_default',
          vendorName: newInvoice.vendorName,
          vendorGstin: newInvoice.vendorGstin,
          vendorPan: newInvoice.vendorPan,
          orderDate: newInvoice.invoiceDate,
          department: newInvoice.items[0]?.categoryName || 'Production Services',
          paymentTerms: 'Net 15',
          items: newInvoice.items.map((it, idx) => ({
            id: it.itemId || `poi_${Date.now()}_${idx}`,
            itemDescription: it.itemDescription,
            orderQty: it.invoicedQty,
            unit: it.unit || 'Days',
            unitRate: it.unitRate,
            gstRate: newInvoice.gstRate,
            totalBase: it.totalAmount,
            gstAmount: (it.totalAmount * (newInvoice.gstRate || 0)) / 100,
            totalAmount: it.totalAmount + (it.totalAmount * (newInvoice.gstRate || 0)) / 100,
            receivedQty: it.invoicedQty,
            invoicedQty: it.invoicedQty,
            invoicedAmount: it.totalAmount,
            status: 'Billed'
          })),
          totalBaseAmount: newInvoice.baseAmount,
          totalGstAmount: newInvoice.gstAmount,
          grandTotal: newInvoice.totalAmount || newInvoice.baseAmount + newInvoice.gstAmount,
          grns: [
            {
              id: `grn_auto_${Date.now()}`,
              grnNumber: `GRN-AUTO-${newInvoice.invoiceNumber}`,
              poId: `po_dir_${Date.now()}`,
              poNumber: `PO-DIR-${newInvoice.invoiceNumber}`,
              vendorName: newInvoice.vendorName,
              deliveryChallanNo: `DC-${newInvoice.invoiceNumber}`,
              challanDate: newInvoice.invoiceDate,
              receivedDate: newInvoice.invoiceDate,
              receivedBy: 'Production Desk',
              items: newInvoice.items.map((it) => ({
                itemId: it.itemId,
                itemDescription: it.itemDescription,
                receivedQty: it.invoicedQty,
                acceptedQty: it.invoicedQty,
                rejectedQty: 0
              })),
              createdAt: new Date().toISOString()
            }
          ],
          invoices: [newInvoice],
          status: 'Fulfilled',
          createdBy: userRole,
          createdAt: new Date().toISOString()
        };

        await savePurchaseOrder(directPo);
        setPurchaseOrders([directPo, ...purchaseOrders]);
        setSuccessToast(`Invoice ${newInvoice.invoiceNumber} recorded and added to system records!`);
        setTimeout(() => setSuccessToast(null), 5000);
        return;
      }
    }

    // Remove invoice from any other PO if previously attached
    const otherUpdatedPos: PurchaseOrder[] = [];
    const cleanedPos = purchaseOrders.map((p) => {
      if (p.id !== targetPo.id && p.invoices?.some((i) => i.id === newInvoice.id)) {
        const remainingInvoices = (p.invoices || []).filter((i) => i.id !== newInvoice.id);
        const modP: PurchaseOrder = {
          ...p,
          invoices: remainingInvoices
        };
        otherUpdatedPos.push(modP);
        return modP;
      }
      return p;
    });

    for (const op of otherUpdatedPos) {
      await savePurchaseOrder(op);
    }

    const currentPoInvoices = targetPo.invoices || [];
    const isEdit = currentPoInvoices.some((i) => i.id === newInvoice.id);

    const updatedPo: PurchaseOrder = {
      ...targetPo,
      invoices: [...currentPoInvoices.filter((i) => i.id !== newInvoice.id), newInvoice],
      status: newInvoice.matchStatus === 'MATCHED' ? 'Fulfilled' : 'Under Audit'
    };

    await savePurchaseOrder(updatedPo);
    setPurchaseOrders(cleanedPos.map((p) => (p.id === updatedPo.id ? updatedPo : p)));

    addDbLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isEdit ? 'VENDOR_INVOICE_UPDATED' : 'VENDOR_INVOICE_GENERATED',
      details: `Invoice ${newInvoice.invoiceNumber} (₹${(newInvoice.totalAmount || newInvoice.netPayable).toLocaleString()}) ${isEdit ? 'updated' : 'generated & recorded'} for ${newInvoice.vendorName} against ${targetPo.poNumber}`,
      user: userRole
    });

    setSuccessToast(
      `Invoice ${newInvoice.invoiceNumber} (₹${(newInvoice.totalAmount || newInvoice.netPayable).toLocaleString()}) ${isEdit ? 'updated successfully' : 'recorded'}! Status: ${newInvoice.matchStatus}`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleTabClick = (tabId: 'matrix' | 'pos' | 'grns' | 'invoices' | 'disputes') => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-100">
      {/* 1. Header Banner & Metrics */}
      {!hideHeaderBanner ? (
        <div className="bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-800 shadow-2xs flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>PURCHASE ORDER (PO) TO INVOICE 3-WAY MATCHING</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Automated reconciliation between Approved PO, On-Set Goods Delivery (GRN/DSR) &amp; Vendor Tax Invoices.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setIsCreatePoModalOpen(true)}
                className="h-7.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Purchase Order
              </button>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
            <div className="bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total PO Committed</div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                  ₹{metrics.totalPoCommitted.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-400 text-[10px] font-bold">
                {metrics.totalPosCount} POs
              </div>
            </div>

            <div className="bg-slate-950/70 px-3 py-2 rounded-lg border border-emerald-900/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">3-Way Reconciled</div>
                <div className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono">
                  {metrics.perfectMatchesCount} Invoices
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="bg-slate-950/70 px-3 py-2 rounded-lg border border-rose-900/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Price / Qty Flagged</div>
                <div className="text-xs sm:text-sm font-extrabold text-rose-300 font-mono">
                  {metrics.priceMismatchesCount + metrics.qtyMismatchesCount} Flags
                </div>
              </div>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>

            <div className="bg-slate-950/70 px-3 py-2 rounded-lg border border-amber-900/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Variance In Audit</div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono">
                  ₹{metrics.totalVarianceAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          {!hideSubNavTabs && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
              {[
                { id: 'matrix', label: '3-Way Reconciliation Matrix', icon: FileCheck2 },
                { id: 'pos', label: 'Purchase Orders Register', icon: FileText },
                { id: 'grns', label: 'Goods Receipts & DSR Challans', icon: Truck },
                { id: 'invoices', label: 'Vendor Tax Invoices', icon: Receipt },
                { id: 'disputes', label: 'Disputes & Debit Notes', icon: AlertTriangle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as any)}
                    className={`px-2.5 py-1.2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                      isSel
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Compact Metrics Bar (Low Space Needed) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total POs:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-mono">₹{metrics.totalPoCommitted.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-900">{metrics.totalPosCount}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-emerald-900/40 flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400">3-Way Matched:</span>
            <span className="text-xs font-bold text-emerald-300 font-mono">{metrics.perfectMatchesCount} Invoices</span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-rose-900/40 flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400">Discrepancy Flags:</span>
            <span className="text-xs font-bold text-rose-300 font-mono">{metrics.priceMismatchesCount + metrics.qtyMismatchesCount}</span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-amber-900/40 flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400">Audit Variance:</span>
            <span className="text-xs font-bold text-amber-300 font-mono">₹{metrics.totalVarianceAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Controls */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO Number, Vendor, Gear description, Delivery Challan or Invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setSelectedFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                selectedFilterStatus === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilterStatus('MATCHED')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                selectedFilterStatus === 'MATCHED'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Matched
            </button>
            <button
              onClick={() => setSelectedFilterStatus('DISPUTED')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                selectedFilterStatus === 'DISPUTED'
                  ? 'bg-rose-700 text-white font-bold'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Discrepancies
            </button>
          </div>
        </div>
      </div>

      {/* 5. MAIN TAB CONTENTS */}

      {/* TAB 1: 3-WAY RECONCILIATION MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-3">
          {filteredPos.map((po) => {
            const hasInvoices = (po.invoices || []).length > 0;
            const hasGrns = (po.grns || []).length > 0;
            const firstInv = po.invoices?.[0];

            let statusBadge = (
              <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                PO Issued / Awaiting Invoice
              </span>
            );

            if (firstInv) {
              if (firstInv.matchStatus === 'MATCHED' || firstInv.approvalStatus === 'Approved') {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 3-WAY MATCH VERIFIED
                  </span>
                );
              } else if (firstInv.matchStatus === 'PRICE_MISMATCH') {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> PRICE ESCALATION (₹{firstInv.varianceAmount?.toLocaleString()})
                  </span>
                );
              } else if (firstInv.matchStatus === 'QTY_MISMATCH') {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" /> QUANTITY OVERBILL (₹{firstInv.varianceAmount?.toLocaleString()})
                  </span>
                );
              } else if (firstInv.matchStatus === 'NO_GRN') {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" /> MISSING GOODS RECEIPT (GRN)
                  </span>
                );
              }
            }

            return (
              <div
                key={po.id}
                className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                {/* PO Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-xs">
                      {po.poNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{po.vendorName}</span>
                        {po.vendorGstin && (
                          <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                            GSTIN: {po.vendorGstin}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Dept: <strong className="text-slate-300">{po.department}</strong></span>
                        <span>•</span>
                        <span>Order Date: <strong className="text-slate-300">{po.orderDate}</strong></span>
                        <span>•</span>
                        <span>Terms: <strong className="text-slate-300">{po.paymentTerms}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {statusBadge}
                    <button
                      onClick={() => {
                        setInspectingPo(po);
                        setInspectingInvoice(firstInv || null);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> Inspect 3-Way
                    </button>
                  </div>
                </div>

                {/* 3-Way Side-by-Side Tri-Column Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* PILLAR 1: APPROVED PO */}
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-blue-900/40 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px] uppercase">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> 1. Approved PO
                      </div>
                      <span className="font-mono text-white font-bold text-xs">
                        ₹{po.grandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      {po.items.map((it) => (
                        <div key={it.id} className="p-1.5 bg-slate-900 rounded border border-slate-800/80">
                          {(it.categoryName || it.subCategoryName || it.childCategoryName) && (
                            <div className="flex items-center gap-1 text-[9px] text-amber-400 font-mono mb-0.5 truncate">
                              <span className="truncate">{it.categoryName}</span>
                              {it.subCategoryName && <span className="truncate">› {it.subCategoryName}</span>}
                              {it.childCategoryName && <span className="text-white font-bold truncate">› {it.childCategoryName}</span>}
                            </div>
                          )}
                          <div className="font-medium text-slate-200 line-clamp-1">{it.itemDescription}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                            <span>Order Qty: <strong className="text-white">{it.orderQty} {it.unit}</strong></span>
                            <span>Rate: <strong className="text-blue-300">₹{it.unitRate.toLocaleString()}/unit</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PILLAR 2: GOODS RECEIPT (GRN / DSR) */}
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" /> 2. Delivery Receipt (GRN)
                      </div>
                      {hasGrns ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          {po.grns[0]?.grnNumber}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetPoId(po.id);
                            setIsRecordGrnModalOpen(true);
                          }}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> Log GRN
                        </button>
                      )}
                    </div>

                    {hasGrns ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="text-[10px] text-slate-400">
                          Challan: <strong className="text-slate-200">{po.grns[0]?.deliveryChallanNo}</strong> • By: <strong className="text-slate-200">{po.grns[0]?.receivedBy}</strong>
                        </div>
                        {po.items.map((it) => (
                          <div key={it.id} className="p-1.5 bg-slate-900 rounded border border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300 truncate">{it.itemDescription}</span>
                              <span className="font-mono font-bold text-emerald-300">
                                {it.receivedQty || 0} / {it.orderQty} Received
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 pt-0.5">
                              {it.receivedQty && it.receivedQty >= it.orderQty ? (
                                <span className="text-emerald-400">✓ Full Quantity Received on Set</span>
                              ) : (
                                <span className="text-amber-400">⚠ Partial receipt logged in DSR</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-500 italic text-[11px]">
                        No goods receipt recorded. Click &quot;Log GRN&quot; to log physical delivery challan or link DSR equipment.
                      </div>
                    )}
                  </div>

                  {/* PILLAR 3: VENDOR TAX INVOICE */}
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-purple-900/40 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px] uppercase">
                        <Receipt className="w-3.5 h-3.5 text-purple-400" /> 3. Vendor Tax Invoice
                      </div>
                      {hasInvoices ? (
                        <span className="font-mono text-white font-bold text-xs">
                          ₹{firstInv?.netPayable?.toLocaleString('en-IN') || po.grandTotal.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetPoId(po.id);
                            setIsRecordInvoiceModalOpen(true);
                          }}
                          className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" /> Record Bill
                        </button>
                      )}
                    </div>

                    {hasInvoices ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span>Inv: <strong className="text-slate-200 font-mono">{firstInv?.invoiceNumber}</strong></span>
                            {firstInv && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingInvoiceSheet(firstInv)}
                                  className="p-0.5 hover:bg-purple-900/60 text-purple-300 rounded cursor-pointer transition-colors"
                                  title="View Printable Invoice Sheet"
                                >
                                  <FileText className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingInvoice(firstInv)}
                                  className="p-0.5 hover:bg-blue-900/60 text-blue-300 rounded cursor-pointer transition-colors"
                                  title="Edit Invoice"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInvoiceToDelete({ po, invoice: firstInv })}
                                  className="p-0.5 hover:bg-rose-900/60 text-rose-300 rounded cursor-pointer transition-colors"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span>Date: <strong className="text-slate-200">{firstInv?.invoiceDate}</strong></span>
                        </div>

                        {firstInv?.items.map((it, idx) => {
                          const poItem = po.items[idx];
                          const isPriceHigh = poItem && it.unitRate > poItem.unitRate;
                          const isQtyHigh = poItem && it.invoicedQty > (poItem.receivedQty || 0);

                          return (
                            <div
                              key={it.itemId || idx}
                              className={`p-1.5 rounded border ${
                                isPriceHigh || isQtyHigh
                                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                                  : 'bg-slate-900 border-slate-800/80 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{it.itemDescription}</span>
                                <span className="font-mono font-bold">
                                  {it.invoicedQty} x ₹{it.unitRate.toLocaleString()}
                                </span>
                              </div>
                              {(isPriceHigh || isQtyHigh) && (
                                <div className="text-[10px] text-rose-400 font-bold pt-0.5 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {isPriceHigh && `Price Escalated from ₹${poItem?.unitRate.toLocaleString()}`}
                                  {isQtyHigh && ` Overbilled by ${it.invoicedQty - (poItem?.receivedQty || 0)} units`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-500 italic text-[11px]">
                        Vendor bill not received yet. Click &quot;Record Bill&quot; to log invoice and run 3-way matching.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-[11px] text-slate-400 italic">
                    {firstInv?.discrepancyNote || 'PO Active and ready for Goods Receipt & Invoice logging.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {!hasGrns && (
                      <button
                        onClick={() => {
                          setTargetPoId(po.id);
                          setIsRecordGrnModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        + Log GRN
                      </button>
                    )}

                    {!hasInvoices && (
                      <button
                        onClick={() => {
                          setTargetPoId(po.id);
                          setIsRecordInvoiceModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 rounded text-xs font-semibold border border-purple-800 cursor-pointer"
                      >
                        + Record Bill
                      </button>
                    )}

                    {firstInv && (firstInv.matchStatus === 'PRICE_MISMATCH' || firstInv.matchStatus === 'QTY_MISMATCH') && (
                      <>
                        <button
                          onClick={() => {
                            setInspectingPo(po);
                            setInspectingInvoice(firstInv);
                            setIsDebitNoteModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs font-bold border border-rose-800 cursor-pointer flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" /> Issue Debit Note
                        </button>

                        <button
                          onClick={() => {
                            setInspectingPo(po);
                            setInspectingInvoice(firstInv);
                            setIsOverrideModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded text-xs font-bold border border-amber-800 cursor-pointer"
                        >
                          LP Override
                        </button>
                      </>
                    )}

                    {firstInv && (firstInv.matchStatus === 'MATCHED' || firstInv.approvalStatus === 'Approved') && (
                      <button
                        onClick={() => handleApproveAndBookExpense(po, firstInv)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" /> Book Approved Expense Voucher
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS REGISTER */}
      {activeTab === 'pos' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Order Date</th>
                  <th className="py-2.5 px-3">Committed Base</th>
                  <th className="py-2.5 px-3">GST &amp; Grand Total</th>
                  <th className="py-2.5 px-3">Fulfillment</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{po.poNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-200">{po.vendorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{po.vendorGstin || 'No GSTIN'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{po.department}</td>
                    <td className="py-2.5 px-3 text-slate-400">{po.orderDate}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">₹{po.totalBaseAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">₹{po.grandTotal.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-950/80 text-blue-300 border border-blue-800">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setInspectingPo(po);
                          setInspectingInvoice(po.invoices?.[0] || null);
                        }}
                        className="p-1 hover:bg-slate-800 text-blue-400 rounded cursor-pointer"
                        title="View PO Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GOODS RECEIPTS (GRN) */}
      {activeTab === 'grns' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">GRN Number</th>
                  <th className="py-2.5 px-3">Linked PO</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Delivery Challan</th>
                  <th className="py-2.5 px-3">Received Date</th>
                  <th className="py-2.5 px-3">Received By (HOD/AC)</th>
                  <th className="py-2.5 px-3">DSR Shoot Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {allGrns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No Goods Receipts logged yet. Click &quot;Log GRN&quot; on any PO to record delivery challans.
                    </td>
                  </tr>
                ) : (
                  allGrns.map(({ po, grn }) => (
                    <tr key={grn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{grn.grnNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">{grn.poNumber}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{grn.vendorName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{grn.deliveryChallanNo}</td>
                      <td className="py-2.5 px-3 text-slate-400">{grn.receivedDate}</td>
                      <td className="py-2.5 px-3 text-slate-300">{grn.receivedBy}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">{grn.dsrShootDay || 'Shoot Day'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VENDOR TAX INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">PO Reference</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Invoice Date</th>
                  <th className="py-2.5 px-3">Base &amp; GST</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">3-Way Match Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {allInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      No vendor invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  allInvoices.map(({ po, invoice }) => (
                    <tr key={invoice.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{invoice.invoiceNumber}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{invoice.poNumber}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{invoice.vendorName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{invoice.invoiceDate}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        ₹{invoice.baseAmount.toLocaleString()} + ₹{invoice.gstAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        ₹{invoice.netPayable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                            invoice.matchStatus === 'MATCHED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {invoice.matchStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingInvoiceSheet(invoice)}
                            className="px-2 py-1 bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-800/60 rounded text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="View & Print Formatted Invoice Sheet"
                          >
                            <FileText className="w-3 h-3 text-purple-400" />
                            <span>View Sheet</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingInvoice(invoice)}
                            className="px-2 py-1 bg-blue-950/70 hover:bg-blue-900 text-blue-200 border border-blue-800/60 rounded text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Edit Invoice Details & Line Items"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete({ po, invoice })}
                            className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/60 rounded text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Delete Invoice from Records"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingPo(po);
                              setInspectingInvoice(invoice);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
                            title="Audit 3-Way Matching"
                          >
                            Audit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DISPUTES & DEBIT NOTES */}
      {activeTab === 'disputes' && (
        <div className="space-y-3">
          {allInvoices.filter(i => i.invoice.matchStatus === 'PRICE_MISMATCH' || i.invoice.matchStatus === 'QTY_MISMATCH').length === 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Active Discrepancies or Disputes</h3>
              <p className="text-xs text-slate-400">All recorded vendor invoices match purchase orders and delivery logs.</p>
            </div>
          ) : (
            allInvoices
              .filter((i) => i.invoice.matchStatus === 'PRICE_MISMATCH' || i.invoice.matchStatus === 'QTY_MISMATCH')
              .map(({ po, invoice }) => (
                <div key={invoice.id} className="bg-slate-900 border border-rose-900/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Discrepancy on {invoice.invoiceNumber} ({invoice.vendorName})
                        </h4>
                        <p className="text-xs text-slate-400">Linked PO: {po.poNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Variance Amount</div>
                      <div className="text-base font-extrabold text-rose-400 font-mono">
                        ₹{invoice.varianceAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-950/30 rounded-lg border border-rose-900/40 text-xs text-rose-200">
                    <strong>Root Cause Flagged by 3-Way Matching Engine:</strong>
                    <p className="mt-1">{invoice.discrepancyNote}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setInspectingPo(po);
                        setInspectingInvoice(invoice);
                        setIsDebitNoteModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Issue Vendor Debit Note (₹{invoice.varianceAmount?.toLocaleString()})
                    </button>
                    <button
                      onClick={() => {
                        setInspectingPo(po);
                        setInspectingInvoice(invoice);
                        setIsOverrideModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      LP Override with Justification
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INTERACTIVE 3-WAY MATCHING INSPECTOR (SIDE-BY-SIDE LEDGER)       */}
      {/* ========================================================================= */}
      {inspectingPo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col text-slate-100 animate-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    3-WAY MATCH AUDIT: {inspectingPo.poNumber} • {inspectingPo.vendorName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comparing Approved PO Items vs. Physical GRN Deliveries vs. Vendor Billed Invoice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingPo(null);
                  setInspectingInvoice(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  inspectingInvoice?.matchStatus === 'MATCHED' || inspectingInvoice?.approvalStatus === 'Approved'
                    ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                    : inspectingInvoice?.matchStatus === 'PRICE_MISMATCH' || inspectingInvoice?.matchStatus === 'QTY_MISMATCH'
                    ? 'bg-rose-950/40 border-rose-700 text-rose-200'
                    : 'bg-blue-950/40 border-blue-700 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {inspectingInvoice?.matchStatus === 'MATCHED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  )}
                  <div>
                    <div className="font-bold uppercase tracking-wider text-[11px]">
                      Match Verdict: {inspectingInvoice?.matchStatus?.replace('_', ' ') || 'PO ISSUED'}
                    </div>
                    <div className="text-[10px] opacity-90">{inspectingInvoice?.discrepancyNote}</div>
                  </div>
                </div>
                {inspectingInvoice?.varianceAmount && inspectingInvoice.varianceAmount > 0 ? (
                  <div className="text-right font-mono font-extrabold text-rose-300">
                    Variance: +₹{inspectingInvoice.varianceAmount.toLocaleString()}
                  </div>
                ) : null}
              </div>

              {/* Tri-Column Comparison Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-[10px] font-extrabold text-slate-300 uppercase">
                      <th className="p-2 border-r border-slate-700 w-1/3">1. Approved PO Line Item</th>
                      <th className="p-2 border-r border-slate-700 w-1/3">2. Received on Set (GRN/DSR)</th>
                      <th className="p-2 w-1/3">3. Invoiced by Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {inspectingPo.items.map((it, idx) => {
                      const invIt = inspectingInvoice?.items[idx];
                      const isRateMismatched = invIt && invIt.unitRate > it.unitRate;
                      const isQtyMismatched = invIt && invIt.invoicedQty > (it.receivedQty || 0);

                      return (
                        <tr key={it.id} className="hover:bg-slate-800/30">
                          {/* Col 1: PO */}
                          <td className="p-2.5 border-r border-slate-800 align-top">
                            {(it.categoryName || it.subCategoryName || it.childCategoryName) && (
                              <div className="flex items-center gap-1 text-[9px] text-amber-400 font-mono mb-1 truncate">
                                <span>{it.categoryName}</span>
                                {it.subCategoryName && <span>› {it.subCategoryName}</span>}
                                {it.childCategoryName && <span className="text-white font-bold">› {it.childCategoryName}</span>}
                              </div>
                            )}
                            <div className="font-bold text-white">{it.itemDescription}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              <div>Approved Qty: <span className="text-white">{it.orderQty} {it.unit}</span></div>
                              <div>Rate: <span className="text-blue-300">₹{it.unitRate.toLocaleString()}/unit</span></div>
                              <div>Base Total: <span className="text-slate-200">₹{it.totalBase.toLocaleString()}</span></div>
                            </div>
                          </td>

                          {/* Col 2: GRN */}
                          <td className="p-2.5 border-r border-slate-800 align-top bg-slate-950/30">
                            <div className="font-bold text-emerald-300">
                              {it.receivedQty || 0} {it.unit} Accepted
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              <div>Challan: {inspectingPo.grns?.[0]?.deliveryChallanNo || 'N/A'}</div>
                              <div>DSR Day: {inspectingPo.grns?.[0]?.dsrShootDay || 'Shoot Day 01'}</div>
                              <div>Inspected By: {inspectingPo.grns?.[0]?.receivedBy || 'HOD / 1st AC'}</div>
                            </div>
                          </td>

                          {/* Col 3: Invoice */}
                          <td className={`p-2.5 align-top ${isRateMismatched || isQtyMismatched ? 'bg-rose-950/20' : ''}`}>
                            {invIt ? (
                              <div>
                                <div className="font-bold text-purple-300">
                                  Billed: {invIt.invoicedQty} {it.unit} @ ₹{invIt.unitRate.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  <div>Billed Total: ₹{invIt.totalAmount.toLocaleString()}</div>
                                  {isRateMismatched && (
                                    <div className="text-rose-400 font-bold">
                                      ⚠ Rate +₹{(invIt.unitRate - it.unitRate).toLocaleString()} excess/unit
                                    </div>
                                  )}
                                  {isQtyMismatched && (
                                    <div className="text-rose-400 font-bold">
                                      ⚠ Overbilled by {invIt.invoicedQty - (it.receivedQty || 0)} units
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 italic">No bill recorded yet</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  setInspectingPo(null);
                  setInspectingInvoice(null);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
              >
                Close Audit
              </button>

              <div className="flex items-center gap-2">
                {inspectingInvoice && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const inv = inspectingInvoice;
                        setInspectingPo(null);
                        setInspectingInvoice(null);
                        setEditingInvoice(inv);
                      }}
                      className="px-3 py-1.5 bg-blue-950/70 hover:bg-blue-900 text-blue-200 border border-blue-800/60 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                      title="Edit Invoice Details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const po = inspectingPo;
                        const inv = inspectingInvoice;
                        setInspectingPo(null);
                        setInspectingInvoice(null);
                        if (po && inv) {
                          setInvoiceToDelete({ po, invoice: inv });
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/60 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Invoice</span>
                    </button>
                  </>
                )}
                {inspectingInvoice && (inspectingInvoice.matchStatus === 'MATCHED' || inspectingInvoice.approvalStatus === 'Approved') && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveAndBookExpense(inspectingPo, inspectingInvoice);
                      setInspectingPo(null);
                      setInspectingInvoice(null);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Book Expense Voucher
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ISSUE PURCHASE ORDER MODAL                                       */}
      {/* ========================================================================= */}
      {isCreatePoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col text-slate-100 animate-in zoom-in-95 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Create &amp; Issue Purchase Order (PO)
              </h3>
              <button onClick={() => setIsCreatePoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs custom-scrollbar">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    list="po-vendor-suggestions"
                    placeholder="e.g. ASMITA ROY / Prime Focus"
                    value={poVendorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPoVendorName(val);
                      const matched = vendors.find(v => v.vendorName.toLowerCase().trim() === val.toLowerCase().trim());
                      if (matched) {
                        if (matched.gstin) setPoVendorGstin(matched.gstin);
                        if (matched.pan || matched.panNumber) setPoVendorPan(matched.pan || matched.panNumber || '');
                        if (matched.category) setPoDepartment(matched.category);

                        // Auto-link vendor's 3-tier category to PO line item 0
                        if (matched.categoryId || matched.category) {
                          const targetCat = activeBudgetCategories.find(c =>
                            (matched.categoryId && c.id === matched.categoryId) ||
                            c.name.trim().toLowerCase() === (matched.category || '').trim().toLowerCase()
                          );
                          if (targetCat) {
                            const targetSub = targetCat.subCategories?.find(s =>
                              (matched.subCategoryId && s.id === matched.subCategoryId) ||
                              s.name.trim().toLowerCase() === (matched.subCategory || '').trim().toLowerCase()
                            );
                            const targetChild = targetSub?.childCategories?.find(ch =>
                              (matched.childCategoryId && ch.id === matched.childCategoryId) ||
                              ch.name.trim().toLowerCase() === (matched.childCategory || '').trim().toLowerCase()
                            );

                            setPoItems(prev => {
                              const next = [...prev];
                              next[0] = {
                                ...next[0],
                                categoryId: targetCat.id,
                                categoryName: targetCat.name,
                                subCategoryId: targetSub?.id || '',
                                subCategoryName: targetSub?.name || '',
                                childCategoryId: targetChild?.id || '',
                                childCategoryName: targetChild?.name || '',
                                description: next[0].description || targetChild?.name || targetSub?.name || targetCat.name,
                                unitRate: next[0].unitRate || targetChild?.rate || next[0].unitRate
                              };
                              return next;
                            });
                          }
                        }
                      }
                    }}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                  <datalist id="po-vendor-suggestions">
                    {vendors.map(v => (
                      <option key={v.id} value={v.vendorName}>
                        {v.category ? `${v.category}${v.subCategory ? ` › ${v.subCategory}` : ''}` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vendor GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAACP1234F1Z8"
                    value={poVendorGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setPoVendorGstin(val);
                      if (val.length >= 12 && !poVendorPan) {
                        const derivedPan = val.substring(2, 12);
                        if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(derivedPan)) {
                          setPoVendorPan(derivedPan);
                        }
                      }
                    }}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vendor PAN</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    value={poVendorPan}
                    onChange={(e) => setPoVendorPan(e.target.value.toUpperCase())}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
                  <select
                    value={poDepartment}
                    onChange={(e) => setPoDepartment(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="Camera & Optics">Camera & Optics</option>
                    <option value="Grip & Lighting">Grip & Lighting</option>
                    <option value="Sound & Sync">Sound & Sync</option>
                    <option value="Genset & Power">Genset & Power</option>
                    <option value="Art & Production Design">Art & Production Design</option>
                    <option value="Costumes & Wardrobe">Costumes & Wardrobe</option>
                    <option value="Location & Fleet">Location & Fleet</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Order Date</label>
                  <input
                    type="date"
                    value={poOrderDate}
                    onChange={(e) => setPoOrderDate(e.target.value)}
                    className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={poPaymentTerms}
                    onChange={(e) => setPoPaymentTerms(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items</span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstCat = activeBudgetCategories[0];
                      const firstSub = firstCat?.subCategories?.[0];
                      const firstChild = firstSub?.childCategories?.[0];
                      setPoItems([
                        ...poItems,
                        {
                          description: firstChild?.name || `Item ${poItems.length + 1}`,
                          qty: 1,
                          unit: 'Days',
                          unitRate: firstChild?.rate || 10000,
                          gstRate: 18,
                          categoryId: firstCat?.id,
                          categoryName: firstCat?.name,
                          subCategoryId: firstSub?.id,
                          subCategoryName: firstSub?.name,
                          childCategoryId: firstChild?.id,
                          childCategoryName: firstChild?.name
                        }
                      ]);
                    }}
                    className="text-[11px] text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
                    {/* 3-Tier Category Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-900/90 p-2 rounded-md border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                            Category (Cooking Show ERP)
                          </label>
                          {item.categoryId && (() => {
                            const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                            return curCat ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 lowercase font-normal">
                                ₹{getCategoryBudget(curCat).toLocaleString('en-IN')}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <select
                          value={item.categoryId || ''}
                          onChange={(e) => {
                            const catId = e.target.value;
                            const targetCat = activeBudgetCategories.find(c => c.id === catId);
                            const updated = [...poItems];
                            updated[idx] = {
                              ...updated[idx],
                              categoryId: catId,
                              categoryName: targetCat?.name || '',
                              subCategoryId: '',
                              subCategoryName: '',
                              childCategoryId: '',
                              childCategoryName: ''
                            };
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value="">-- Select Category --</option>
                          {activeBudgetCategories.map((cat, cIdx) => (
                            <option key={cat.id} value={cat.id}>
                              {cIdx + 1}. {cat.name} — ₹{getCategoryBudget(cat).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                            Sub Category
                          </label>
                          {item.subCategoryId && (() => {
                            const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                            const curSub = curCat?.subCategories?.find(s => s.id === item.subCategoryId);
                            return curSub ? (
                              <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 lowercase font-normal">
                                ₹{getSubCategoryBudget(curSub).toLocaleString('en-IN')}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <select
                          disabled={!item.categoryId}
                          value={item.subCategoryId || ''}
                          onChange={(e) => {
                            const subId = e.target.value;
                            const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                            const targetSub = curCat?.subCategories?.find(s => s.id === subId);
                            const updated = [...poItems];
                            updated[idx] = {
                              ...updated[idx],
                              subCategoryId: subId,
                              subCategoryName: targetSub?.name || '',
                              childCategoryId: '',
                              childCategoryName: '',
                              description: updated[idx].description || targetSub?.name || ''
                            };
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white disabled:opacity-50"
                        >
                          <option value="">-- Select Subcategory --</option>
                          {item.categoryId && (
                            activeBudgetCategories
                              .find(c => c.id === item.categoryId)
                              ?.subCategories?.map((sub, sIdx) => {
                                const parentCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                                const parentIdx = parentCat ? activeBudgetCategories.indexOf(parentCat) : 0;
                                const serial = `${parentIdx + 1}.${sIdx + 1}`;
                                return (
                                  <option key={sub.id} value={sub.id}>
                                    {serial}. {sub.name} — ₹{getSubCategoryBudget(sub).toLocaleString('en-IN')}
                                  </option>
                                );
                              })
                          )}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                            Child Category / Role / Item
                          </label>
                          {item.childCategoryId && (() => {
                            const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                            const curSub = curCat?.subCategories?.find(s => s.id === item.subCategoryId);
                            const curChild = curSub?.childCategories?.find(ch => ch.id === item.childCategoryId);
                            return curChild ? (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 lowercase font-normal">
                                ₹{getChildBudget(curChild).toLocaleString('en-IN')}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <select
                          disabled={!item.subCategoryId}
                          value={item.childCategoryId || ''}
                          onChange={(e) => {
                            const childId = e.target.value;
                            const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                            const curSub = curCat?.subCategories?.find(s => s.id === item.subCategoryId);
                            const targetChild = curSub?.childCategories?.find(ch => ch.id === childId);
                            const updated = [...poItems];

                            let suggestedUnit = updated[idx].unit || 'Units';
                            if (targetChild?.paymentTerms === 'PER DAY' || targetChild?.paymentTerms === 'PER SHIFT') suggestedUnit = 'Shifts';
                            else if (targetChild?.paymentTerms === 'PER EPISODE') suggestedUnit = 'Episodes';
                            else if (targetChild?.paymentTerms === 'PACKAGE') suggestedUnit = 'Package';
                            else if (targetChild?.paymentTerms === 'FLAT') suggestedUnit = 'Lump Sum';

                            updated[idx] = {
                              ...updated[idx],
                              childCategoryId: childId,
                              childCategoryName: targetChild?.name || '',
                              description: targetChild?.name || curSub?.name || updated[idx].description,
                              unit: suggestedUnit,
                              unitRate: targetChild?.rate && targetChild.rate > 0 ? targetChild.rate : updated[idx].unitRate
                            };
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white disabled:opacity-50"
                        >
                          <option value="">-- Select Child Category --</option>
                          {item.categoryId && item.subCategoryId && (
                            activeBudgetCategories
                              .find(c => c.id === item.categoryId)
                              ?.subCategories?.find(s => s.id === item.subCategoryId)
                              ?.childCategories?.map((ch, chIdx) => {
                                const parentCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                                const parentIdx = parentCat ? activeBudgetCategories.indexOf(parentCat) : 0;
                                const subObj = parentCat?.subCategories?.find(s => s.id === item.subCategoryId);
                                const subIdx = subObj && parentCat?.subCategories ? parentCat.subCategories.indexOf(subObj) : 0;
                                const serial = `${parentIdx + 1}.${subIdx + 1}.${chIdx + 1}`;
                                return (
                                  <option key={ch.id} value={ch.id}>
                                    {serial}. {ch.name} — ₹{getChildBudget(ch).toLocaleString('en-IN')}
                                  </option>
                                );
                              })
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Active Budget Link Pill */}
                    {item.categoryId && (() => {
                      const curCat = activeBudgetCategories.find(c => c.id === item.categoryId);
                      const curSub = curCat?.subCategories?.find(s => s.id === item.subCategoryId);
                      const curChild = curSub?.childCategories?.find(ch => ch.id === item.childCategoryId);
                      const budgetDisplay = curChild ? getChildBudget(curChild) : curSub ? getSubCategoryBudget(curSub) : curCat ? getCategoryBudget(curCat) : 0;

                      return (
                        <div className="flex items-center justify-between px-2 py-1 bg-amber-950/30 border border-amber-800/30 rounded text-[10px] text-amber-300 font-mono">
                          <div className="flex items-center gap-1 truncate">
                            <span className="font-bold uppercase text-[9px] text-amber-400">Budget Head:</span>
                            <span className="truncate">{item.categoryName}</span>
                            {item.subCategoryName && <span>› {item.subCategoryName}</span>}
                            {item.childCategoryName && <span className="font-bold text-white">› {item.childCategoryName}</span>}
                            <span className="text-amber-400/90 font-bold ml-1">(Budget: ₹{budgetDisplay.toLocaleString('en-IN')})</span>
                          </div>
                          <span className="text-slate-400 shrink-0 font-sans">Line Total: ₹{((item.qty || 0) * (item.unitRate || 0)).toLocaleString()}</span>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Item Description / Specific Deliverable"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].description = e.target.value;
                          setPoItems(updated);
                        }}
                        className="flex-1 h-8 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                      />
                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Quantity</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].qty = Number(e.target.value) || 1;
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].unit = e.target.value;
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Unit Rate (₹)</label>
                        <input
                          type="number"
                          value={item.unitRate}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].unitRate = Number(e.target.value) || 0;
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-2 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].gstRate = Number(e.target.value);
                            setPoItems(updated);
                          }}
                          className="w-full h-7 px-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value="0">0% (Exempt)</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Special instructions for shoot location delivery..."
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePoModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD GOODS RECEIPT (GRN)                                       */}
      {/* ========================================================================= */}
      {isRecordGrnModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-5 space-y-3.5 text-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" /> Log Goods Receipt Note (GRN) / Delivery Challan
              </h3>
              <button onClick={() => setIsRecordGrnModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordGrn} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Purchase Order *</label>
                <select
                  value={targetPoId}
                  onChange={(e) => setTargetPoId(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                >
                  {purchaseOrders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} — {p.vendorName} ({p.department}, ₹{p.grandTotal.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Delivery Challan #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-9982"
                    value={grnChallanNo}
                    onChange={(e) => setGrnChallanNo(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={grnChallanDate}
                    onChange={(e) => setGrnChallanDate(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Received By (HOD / AC)</label>
                  <input
                    type="text"
                    value={grnReceivedBy}
                    onChange={(e) => setGrnReceivedBy(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DSR Shoot Day</label>
                  <input
                    type="text"
                    value={grnDsrDay}
                    onChange={(e) => setGrnDsrDay(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspection Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  placeholder="Verified on set with no cosmetic or operational damage..."
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordGrnModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                >
                  Save Goods Receipt (GRN)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD VENDOR INVOICE (BUDGET HIERARCHY & PRINTABLE INVOICE)     */}
      {/* ========================================================================= */}
      <InvoiceGeneratorModal
        isOpen={isRecordInvoiceModalOpen}
        onClose={() => setIsRecordInvoiceModalOpen(false)}
        purchaseOrders={purchaseOrders}
        vendors={vendors}
        targetPoId={targetPoId}
        categories={categories || []}
        projects={projects || []}
        selectedProjectId={selectedProjectId}
        onSaveInvoice={handleSaveGeneratedInvoice}
      />

      {/* ========================================================================= */}
      {/* MODAL 4B: INVOICE SHEET VIEWER & PRINT DIALOG                             */}
      {/* ========================================================================= */}
      <InvoiceGeneratorModal
        isOpen={!!viewingInvoiceSheet}
        onClose={() => setViewingInvoiceSheet(null)}
        purchaseOrders={purchaseOrders}
        vendors={vendors}
        targetPoId={viewingInvoiceSheet?.poId || ''}
        categories={categories || []}
        projects={projects || []}
        selectedProjectId={selectedProjectId}
        initialInvoice={viewingInvoiceSheet}
        isReadOnly={true}
        onSaveInvoice={() => {}}
        onDeleteInvoice={(inv, pId) => {
          const matchedPo = purchaseOrders.find(p => p.id === pId || p.invoices?.some(i => i.id === inv.id));
          if (matchedPo) {
            setInvoiceToDelete({ po: matchedPo, invoice: inv });
          }
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 4C: EDIT VENDOR INVOICE MODAL                                       */}
      {/* ========================================================================= */}
      {editingInvoice && (
        <InvoiceGeneratorModal
          isOpen={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          purchaseOrders={purchaseOrders}
          vendors={vendors}
          targetPoId={editingInvoice.poId || ''}
          categories={categories || []}
          projects={projects || []}
          selectedProjectId={selectedProjectId}
          initialInvoice={editingInvoice}
          isReadOnly={false}
          onDeleteInvoice={(inv, pId) => {
            const matchedPo = purchaseOrders.find(p => p.id === pId || p.invoices?.some(i => i.id === inv.id));
            if (matchedPo) {
              setInvoiceToDelete({ po: matchedPo, invoice: inv });
            }
          }}
          onSaveInvoice={async (updatedInv, linkedPoId) => {
            await handleSaveGeneratedInvoice(updatedInv, linkedPoId);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE INVOICE CONFIRMATION                                         */}
      {/* ========================================================================= */}
      {invoiceToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Invoice</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to permanently delete this invoice? This will remove it from all records and reset the PO 3-way matching status.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono font-bold text-white">{invoiceToDelete.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vendor:</span>
                <span className="font-semibold text-slate-200">{invoiceToDelete.invoice.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Payable:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{invoiceToDelete.invoice.netPayable?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Linked PO:</span>
                <span className="font-mono text-slate-300">{invoiceToDelete.po.poNumber}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                disabled={isDeletingInvoice}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInvoice}
                disabled={isDeletingInvoice}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isDeletingInvoice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ISSUE DEBIT NOTE & DISPUTE LETTER                                */}
      {/* ========================================================================= */}
      {isDebitNoteModalOpen && inspectingInvoice && inspectingPo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-5 space-y-3.5 text-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Issue Debit Note / Rate Dispute
              </h3>
              <button onClick={() => setIsDebitNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-900/60 space-y-1.5">
                <div className="font-bold text-rose-300">Debit Note Reference: DN-{Date.now().toString().slice(-6)}</div>
                <div className="text-slate-300">Vendor: <strong>{inspectingPo.vendorName}</strong></div>
                <div className="text-slate-300">Against Invoice: <strong>{inspectingInvoice.invoiceNumber}</strong></div>
                <div className="text-rose-400 font-extrabold text-sm font-mono">
                  Deduction Amount: ₹{inspectingInvoice.varianceAmount?.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Generated Vendor Letter Draft</label>
                <textarea
                  rows={4}
                  readOnly
                  value={`Dear Accounts Department (${inspectingPo.vendorName}),\n\nWith reference to your invoice ${inspectingInvoice.invoiceNumber} against PO ${inspectingPo.poNumber}, our 3-way matching audit detected a discrepancy: ${inspectingInvoice.discrepancyNote}.\n\nAccordingly, a Debit Note of ₹${inspectingInvoice.varianceAmount?.toLocaleString()} has been applied before releasing payment.`}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDebitNoteModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Debit Note DN-${Date.now().toString().slice(-6)} generated and emailed to vendor accounts.`);
                  setIsDebitNoteModalOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
              >
                Send Debit Note to Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LINE PRODUCER OVERRIDE JUSTIFICATION                             */}
      {/* ========================================================================= */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-3.5 text-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Line Producer Justification Override
              </h3>
              <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                Provide an executive operational justification to override the flagged price or quantity variance and authorize payment release.
              </p>
              <textarea
                id="lp-override-reason"
                rows={3}
                placeholder="e.g. Director requested emergency additional 2 hours night overtime approved on set..."
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = (document.getElementById('lp-override-reason') as HTMLTextAreaElement)?.value || 'Authorized by Line Producer';
                  handleConfirmOverride(val);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
              >
                Authorize &amp; Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold">{successToast}</div>
        </div>
      )}
    </div>
  );
}
