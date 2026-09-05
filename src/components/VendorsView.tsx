import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Check, 
  ExternalLink,
  Layers,
  FolderTree,
  Tag,
  ChevronRight,
  Link2,
  FileCheck2,
  Edit2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Download,
  CreditCard,
  X,
  RefreshCw,
  Sparkles,
  Truck,
  Receipt,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';
import { subscribeVendors, saveVendor, deleteVendor } from '../services/firebaseService';
import { BudgetCategory, Project, Vendor } from '../types';
import { generateStandardCategoriesForProject } from '../data';
import ThreeWayMatchingView from './ThreeWayMatchingView';
import VendorDirectoryTab from './vendors/VendorDirectoryTab';
import VendorVerificationTab from './vendors/VendorVerificationTab';
import VendorQuotationsTab from './vendors/VendorQuotationsTab';
import VendorRateComparisonTab from './vendors/VendorRateComparisonTab';
import VendorDocumentsTab from './vendors/VendorDocumentsTab';
import VendorCreationTab from './vendors/VendorCreationTab';
import { 
  VendorQuotation,
  RateBenchmarkItem,
  VendorDocumentItem
} from '../types';

export interface VendorsViewProps {
  categories?: BudgetCategory[];
  projects?: Project[];
  selectedProjectId?: string;
  activeSubTab?: string;
  onNavigateSubTab?: (subTab: string) => void;
}

export const VENDOR_SUB_TABS = [
  { id: 'three-way-matching', name: '3-Way PO Matching', icon: FileCheck2 },
  { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
  { id: 'goods-receipts', name: 'Goods Receipts (GRN)', icon: Truck },
  { id: 'vendor-invoices', name: 'Vendor Invoices', icon: Receipt },
  { id: 'disputes', name: 'Disputes & Deductions', icon: AlertTriangle },
  { id: 'vendor-directory', name: 'Vendor Directory', icon: Building2 },
  { id: 'vendor-verification', name: 'Verification & KYC', icon: CheckCircle2 },
  { id: 'quotations', name: 'Quotations & Bids', icon: Tag },
  { id: 'rate-comparison', name: 'Rate Comparison', icon: Layers },
  { id: 'vendor-documents', name: 'Vendor Documents', icon: FolderTree }
];

export default function VendorsView({
  categories = [],
  projects = [],
  selectedProjectId = '',
  activeSubTab: externalSubTab,
  onNavigateSubTab
}: VendorsViewProps) {
  const resolveTab = (tab?: string) => {
    if (!tab) return 'three-way-matching';
    if (tab === 'vendor-creation') return 'vendor-directory';
    if (tab === 'po-matching' || tab === 'match-audit') return 'three-way-matching';
    if (tab === 'work-orders') return 'purchase-orders';
    if (tab === 'grns') return 'goods-receipts';
    if (tab === 'invoices') return 'vendor-invoices';
    if (tab === 'disputes-notes') return 'disputes';
    if (VENDOR_SUB_TABS.some(t => t.id === tab)) return tab;
    return 'three-way-matching';
  };

  // Sync internal subtab with external props
  const [internalSubTab, setInternalSubTab] = useState<string>(() => resolveTab(externalSubTab));
  const [openPoModalSignal, setOpenPoModalSignal] = useState<number>(0);
  const [openGrnModalSignal, setOpenGrnModalSignal] = useState<number>(0);
  const [openInvoiceModalSignal, setOpenInvoiceModalSignal] = useState<number>(0);
  const [openDisputeModalSignal, setOpenDisputeModalSignal] = useState<number>(0);
  const [openQuoteModalSignal, setOpenQuoteModalSignal] = useState<number>(0);
  const [openBenchmarkModalSignal, setOpenBenchmarkModalSignal] = useState<number>(0);
  const [openUploadDocModalSignal, setOpenUploadDocModalSignal] = useState<number>(0);

  useEffect(() => {
    if (externalSubTab === 'vendor-creation') {
      setInternalSubTab('vendor-directory');
      setIsAddModalOpen(true);
    } else if (externalSubTab) {
      setInternalSubTab(resolveTab(externalSubTab));
    }
  }, [externalSubTab]);

  const currentSubTab = internalSubTab;

  const handleVendorSubTabChange = (tabId: string) => {
    setInternalSubTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
  };

  const handleIssuePoClick = () => {
    if (currentSubTab !== 'three-way-matching' && currentSubTab !== 'purchase-orders') {
      handleVendorSubTabChange('purchase-orders');
    }
    setOpenPoModalSignal(prev => prev + 1);
  };

  // Vendors state
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const unsub = subscribeVendors((data) => {
      if (Array.isArray(data)) {
        setVendors(data);
      } else {
        setVendors([]);
      }
    });
    return () => unsub();
  }, []);

  // Procurement state
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [benchmarks, setBenchmarks] = useState<RateBenchmarkItem[]>([]);
  const [documents, setDocuments] = useState<VendorDocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeProject = useMemo(() => {
    const projId = selectedProjectId || (projects[0]?.id) || 'p_default';
    return projects.find(p => 
      p.id === projId || 
      p.id.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase() === projId.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  // Active project categories or standard fallback
  const activeCategories = useMemo(() => {
    const projId = selectedProjectId || (projects[0]?.id) || 'p_default';
    if (categories && categories.length > 0) {
      const filtered = categories.filter(c => {
        if (!selectedProjectId) return true;
        if (!c.projectId) return false;
        return c.projectId === selectedProjectId || 
          c.projectId.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase() === selectedProjectId.replace(/^(wp_|p_|proj_)/, '').trim().toLowerCase();
      });
      if (filtered.length > 0) return filtered;
    }
    return generateStandardCategoriesForProject(projId, activeProject?.type || activeProject?.projectType);
  }, [categories, selectedProjectId, activeProject]);

  // Modal / Quick Edit State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Auto initialize modal category hierarchy
  useEffect(() => {
    if (activeCategories.length > 0 && !selectedCatId && !editingVendorId) {
      const firstCat = activeCategories[0];
      setSelectedCatId(firstCat.id);
      const firstSub = firstCat.subCategories?.[0];
      if (firstSub) {
        setSelectedSubId(firstSub.id);
        const firstChild = firstSub.childCategories?.[0];
        if (firstChild) {
          setSelectedChildId(firstChild.id);
        }
      }
    }
  }, [activeCategories, isAddModalOpen, editingVendorId, selectedCatId]);

  const selectedCatObj = useMemo(() => {
    let cat = activeCategories.find(c => c.id === selectedCatId);
    if (!cat && selectedCatId) {
      cat = activeCategories.find(c => c.name.trim().toLowerCase() === selectedCatId.trim().toLowerCase());
    }
    return cat || activeCategories[0];
  }, [activeCategories, selectedCatId]);

  const availableSubCategories = useMemo(() => {
    return selectedCatObj?.subCategories || [];
  }, [selectedCatObj]);

  const selectedSubObj = useMemo(() => {
    let sub = availableSubCategories.find(s => s.id === selectedSubId);
    if (!sub && selectedSubId) {
      sub = availableSubCategories.find(s => s.name.trim().toLowerCase() === selectedSubId.trim().toLowerCase());
    }
    return sub || availableSubCategories[0];
  }, [availableSubCategories, selectedSubId]);

  const availableChildCategories = useMemo(() => {
    return selectedSubObj?.childCategories || [];
  }, [selectedSubObj]);

  const selectedChildObj = useMemo(() => {
    let child = availableChildCategories.find(ch => ch.id === selectedChildId);
    if (!child && selectedChildId) {
      child = availableChildCategories.find(ch => ch.name.trim().toLowerCase() === selectedChildId.trim().toLowerCase());
    }
    return child || availableChildCategories[0];
  }, [availableChildCategories, selectedChildId]);

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

  const handleOpenAddModal = () => {
    setEditingVendorId(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
    setPan('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    if (activeCategories.length > 0) {
      const firstCat = activeCategories[0];
      setSelectedCatId(firstCat.id);
      const firstSub = firstCat.subCategories?.[0];
      if (firstSub) {
        setSelectedSubId(firstSub.id);
        const firstChild = firstSub.childCategories?.[0];
        setSelectedChildId(firstChild ? firstChild.id : '');
      } else {
        setSelectedSubId('');
        setSelectedChildId('');
      }
    }
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setName(vendor.vendorName || '');
    setContactPerson(vendor.contactPerson || '');
    setPhone(vendor.phone || '');
    setEmail(vendor.email || '');
    setAddress(vendor.address || '');
    setGstin(vendor.gstin || '');
    setPan(vendor.pan || vendor.panNumber || '');
    setBankName(vendor.bankName || '');
    setAccountNumber(vendor.accountNumber || '');
    setIfscCode(vendor.ifscCode || '');

    // Robust 3-tier category mapping: match by ID first, then fallback to Name (case-insensitive)
    let matchedCat = activeCategories.find(c => 
      (vendor.categoryId && c.id === vendor.categoryId) ||
      (vendor.category && c.name.trim().toLowerCase() === vendor.category.trim().toLowerCase())
    );
    if (!matchedCat && activeCategories.length > 0) {
      matchedCat = activeCategories[0];
    }

    if (matchedCat) {
      setSelectedCatId(matchedCat.id);
      const subs = matchedCat.subCategories || [];
      let matchedSub = subs.find(s => 
        (vendor.subCategoryId && s.id === vendor.subCategoryId) ||
        (vendor.subCategory && s.name.trim().toLowerCase() === vendor.subCategory.trim().toLowerCase())
      );
      if (!matchedSub && subs.length > 0) {
        matchedSub = subs[0];
      }

      if (matchedSub) {
        setSelectedSubId(matchedSub.id);
        const childs = matchedSub.childCategories || [];
        let matchedChild = childs.find(ch => 
          (vendor.childCategoryId && ch.id === vendor.childCategoryId) ||
          (vendor.childCategory && ch.name.trim().toLowerCase() === vendor.childCategory.trim().toLowerCase())
        );
        if (!matchedChild && childs.length > 0) {
          matchedChild = childs[0];
        }
        setSelectedChildId(matchedChild ? matchedChild.id : '');
      } else {
        setSelectedSubId('');
        setSelectedChildId('');
      }
    } else {
      setSelectedCatId('');
      setSelectedSubId('');
      setSelectedChildId('');
    }

    setIsAddModalOpen(true);
  };

  const handleAddOrUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const catName = selectedCatObj?.name || 'General Expense';
    const subName = selectedSubObj?.name || '';
    const childName = selectedChildObj?.name || '';
    const catId = selectedCatObj?.id || selectedCatId;
    const subId = selectedSubObj?.id || selectedSubId;
    const childId = selectedChildObj?.id || selectedChildId;
    const formattedPan = pan ? pan.trim().toUpperCase() : '';

    if (editingVendorId) {
      const existing = vendors.find(v => v.id === editingVendorId);
      const updatedV: Vendor = {
        id: editingVendorId,
        vendorName: name.trim(),
        categoryId: catId,
        category: catName,
        subCategoryId: subId,
        subCategory: subName,
        childCategoryId: childId,
        childCategory: childName,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address ? address.trim() : (existing?.address || ''),
        gstin: gstin ? gstin.trim().toUpperCase() : '',
        pan: formattedPan,
        panNumber: formattedPan,
        bankName: bankName || existing?.bankName || 'HDFC Bank',
        accountNumber: accountNumber || existing?.accountNumber || '9876543210',
        ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : (existing?.ifscCode || 'HDFC0001234'),
        status: existing?.status || 'Approved',
        totalPaid: existing?.totalPaid || 0
      };

      setVendors(vendors.map(v => v.id === editingVendorId ? updatedV : v));
      await saveVendor(updatedV);
      showToast(`Updated vendor: ${updatedV.vendorName}`);
    } else {
      const newV: Vendor = {
        id: `v_${Date.now()}`,
        vendorName: name.trim(),
        categoryId: catId,
        category: catName,
        subCategoryId: subId,
        subCategory: subName,
        childCategoryId: childId,
        childCategory: childName,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address ? address.trim() : '',
        gstin: gstin ? gstin.trim().toUpperCase() : '',
        pan: formattedPan,
        panNumber: formattedPan,
        bankName: bankName || 'HDFC Bank',
        accountNumber: accountNumber || '9876543210',
        ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : 'HDFC0001234',
        status: 'Approved',
        totalPaid: 0
      };

      setVendors([newV, ...vendors]);
      await saveVendor(newV);
      showToast(`Registered new vendor: ${newV.vendorName}`);
    }

    setIsAddModalOpen(false);
    setEditingVendorId(null);
  };

  const handleDeleteVendor = async (id: string, vendorName: string) => {
    if (confirm(`Are you sure you want to remove "${vendorName}" from the vendor directory?`)) {
      setVendors(vendors.filter(v => v.id !== id));
      await deleteVendor(id);
      showToast(`Removed vendor: ${vendorName}`);
    }
  };

  const handleUpdateVendorStatus = async (vendor: Vendor, newStatus: 'Approved' | 'Pending Verification' | 'Blocked') => {
    const updated: Vendor = { ...vendor, status: newStatus };
    setVendors(vendors.map(v => v.id === vendor.id ? updated : v));
    await saveVendor(updated);
    showToast(`${vendor.vendorName} status updated to: ${newStatus}`);
  };

  // Dedicated creation tab save
  const handleSaveFromCreationTab = async (newVendorData: Omit<Vendor, 'id' | 'totalPaid'>) => {
    const newV: Vendor = {
      ...newVendorData,
      id: `v_${Date.now()}`,
      totalPaid: 0
    };
    setVendors([newV, ...vendors]);
    await saveVendor(newV);
    showToast(`Registered: ${newV.vendorName}`);
  };

  // Contextual Header Actions based on currentSubTab
  const renderHeaderActionButtons = () => {
    switch (currentSubTab) {
      case 'three-way-matching':
        return (
          <>
            <button
              onClick={() => setOpenPoModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue PO</span>
            </button>
            <button
              onClick={() => setOpenGrnModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-emerald-300 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log GRN</span>
            </button>
            <button
              onClick={() => setOpenInvoiceModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-purple-300 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span>Record Bill</span>
            </button>
          </>
        );
      case 'purchase-orders':
        return (
          <>
            <button
              onClick={() => setOpenPoModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue PO</span>
            </button>
            <button
              id="btn-register-vendor-action"
              onClick={handleOpenAddModal}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Vendor</span>
            </button>
          </>
        );
      case 'goods-receipts':
        return (
          <>
            <button
              onClick={() => setOpenGrnModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log GRN / Challan</span>
            </button>
            <button
              onClick={() => setOpenPoModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue PO</span>
            </button>
          </>
        );
      case 'vendor-invoices':
        return (
          <>
            <button
              onClick={() => setOpenInvoiceModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Record &amp; Generate Invoice</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('three-way-matching')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-emerald-300 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit 3-Way</span>
            </button>
          </>
        );
      case 'disputes':
        return (
          <>
            <button
              onClick={() => setOpenDisputeModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue Debit Note</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('vendor-invoices')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span>Invoices</span>
            </button>
          </>
        );
      case 'vendor-directory':
        return (
          <>
            <button
              id="btn-register-vendor-action"
              onClick={handleOpenAddModal}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Vendor</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('vendor-verification')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>KYC Verification</span>
            </button>
          </>
        );
      case 'vendor-verification':
        return (
          <>
            <button
              id="btn-register-vendor-action"
              onClick={handleOpenAddModal}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Vendor</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('vendor-directory')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Directory</span>
            </button>
          </>
        );
      case 'quotations':
        return (
          <>
            <button
              onClick={() => setOpenQuoteModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Quote</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('rate-comparison')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare Rates</span>
            </button>
          </>
        );
      case 'rate-comparison':
        return (
          <>
            <button
              onClick={() => setOpenBenchmarkModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Benchmark</span>
            </button>
            <button
              onClick={() => handleVendorSubTabChange('quotations')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Quotations</span>
            </button>
          </>
        );
      case 'vendor-documents':
        return (
          <>
            <button
              onClick={() => setOpenUploadDocModalSignal(prev => prev + 1)}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Upload Document</span>
            </button>
            <button
              id="btn-register-vendor-action"
              onClick={handleOpenAddModal}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Vendor</span>
            </button>
          </>
        );
      case 'vendor-creation':
        return (
          <>
            <button
              onClick={() => handleVendorSubTabChange('vendor-directory')}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Back to Directory</span>
            </button>
          </>
        );
      default:
        return (
          <>
            <button
              onClick={handleIssuePoClick}
              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue PO</span>
            </button>
            <button
              id="btn-register-vendor-action"
              onClick={handleOpenAddModal}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Vendor</span>
            </button>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-100 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card (Ultra-Compact for Low Space Needed) */}
      <div className="bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800 shadow-2xs flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Brand / Title / Active Project / Live Counters */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Vendors &amp; Procurement Hub
              </h1>
              <span className="hidden sm:inline-flex items-center text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-[200px]">
                {activeProject?.name || (activeProject as any)?.title || 'Production'}
              </span>
              <span className="hidden md:inline-flex text-[11px] text-slate-400 font-medium">
                • {vendors.length} Vendors • {quotations.length} Quotes
              </span>
            </div>
          </div>

          {/* Right: Dynamic Contextual Action Buttons as per Tab Click */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap justify-end">
            {renderHeaderActionButtons()}
          </div>
        </div>

        {/* Unified Horizontal Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 border-t border-slate-800/70">
          {VENDOR_SUB_TABS.map(tab => {
            const Icon = tab.icon || Building2;
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleVendorSubTabChange(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? tab.id === 'three-way-matching' 
                      ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                      : 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB CONTENT RENDERERS */}

      {/* 1. 3-WAY PO MATCHING */}
      {currentSubTab === 'three-way-matching' && (
        <ThreeWayMatchingView
          categories={activeCategories}
          projects={projects}
          vendors={vendors}
          selectedProjectId={selectedProjectId}
          initialTab="matrix"
          compactMode={true}
          hideHeaderBanner={true}
          hideSubNavTabs={true}
          openCreatePoSignal={openPoModalSignal}
          openRecordGrnSignal={openGrnModalSignal}
          openRecordInvoiceSignal={openInvoiceModalSignal}
          openDebitNoteSignal={openDisputeModalSignal}
          onTabChange={(t) => {
            if (t === 'pos') handleVendorSubTabChange('purchase-orders');
            else if (t === 'grns') handleVendorSubTabChange('goods-receipts');
            else if (t === 'invoices') handleVendorSubTabChange('vendor-invoices');
            else if (t === 'disputes') handleVendorSubTabChange('disputes');
          }}
        />
      )}

      {/* 2. PURCHASE ORDERS REGISTER */}
      {currentSubTab === 'purchase-orders' && (
        <ThreeWayMatchingView
          categories={activeCategories}
          projects={projects}
          vendors={vendors}
          selectedProjectId={selectedProjectId}
          initialTab="pos"
          compactMode={true}
          hideHeaderBanner={true}
          hideSubNavTabs={true}
          openCreatePoSignal={openPoModalSignal}
          openRecordGrnSignal={openGrnModalSignal}
          openRecordInvoiceSignal={openInvoiceModalSignal}
          openDebitNoteSignal={openDisputeModalSignal}
          onTabChange={(t) => {
            if (t === 'matrix') handleVendorSubTabChange('three-way-matching');
            else if (t === 'grns') handleVendorSubTabChange('goods-receipts');
            else if (t === 'invoices') handleVendorSubTabChange('vendor-invoices');
            else if (t === 'disputes') handleVendorSubTabChange('disputes');
          }}
        />
      )}

      {/* 3. GOODS RECEIPTS & CHALLANS (GRN) */}
      {currentSubTab === 'goods-receipts' && (
        <ThreeWayMatchingView
          categories={activeCategories}
          projects={projects}
          vendors={vendors}
          selectedProjectId={selectedProjectId}
          initialTab="grns"
          compactMode={true}
          hideHeaderBanner={true}
          hideSubNavTabs={true}
          openCreatePoSignal={openPoModalSignal}
          openRecordGrnSignal={openGrnModalSignal}
          openRecordInvoiceSignal={openInvoiceModalSignal}
          openDebitNoteSignal={openDisputeModalSignal}
          onTabChange={(t) => {
            if (t === 'matrix') handleVendorSubTabChange('three-way-matching');
            else if (t === 'pos') handleVendorSubTabChange('purchase-orders');
            else if (t === 'invoices') handleVendorSubTabChange('vendor-invoices');
            else if (t === 'disputes') handleVendorSubTabChange('disputes');
          }}
        />
      )}

      {/* 4. VENDOR TAX INVOICES */}
      {currentSubTab === 'vendor-invoices' && (
        <ThreeWayMatchingView
          categories={activeCategories}
          projects={projects}
          vendors={vendors}
          selectedProjectId={selectedProjectId}
          initialTab="invoices"
          compactMode={true}
          hideHeaderBanner={true}
          hideSubNavTabs={true}
          openCreatePoSignal={openPoModalSignal}
          openRecordGrnSignal={openGrnModalSignal}
          openRecordInvoiceSignal={openInvoiceModalSignal}
          openDebitNoteSignal={openDisputeModalSignal}
          onTabChange={(t) => {
            if (t === 'matrix') handleVendorSubTabChange('three-way-matching');
            else if (t === 'pos') handleVendorSubTabChange('purchase-orders');
            else if (t === 'grns') handleVendorSubTabChange('goods-receipts');
            else if (t === 'disputes') handleVendorSubTabChange('disputes');
          }}
        />
      )}

      {/* 5. DISPUTES & DEBIT NOTES */}
      {currentSubTab === 'disputes' && (
        <ThreeWayMatchingView
          categories={activeCategories}
          projects={projects}
          vendors={vendors}
          selectedProjectId={selectedProjectId}
          initialTab="disputes"
          compactMode={true}
          hideHeaderBanner={true}
          hideSubNavTabs={true}
          openCreatePoSignal={openPoModalSignal}
          openRecordGrnSignal={openGrnModalSignal}
          openRecordInvoiceSignal={openInvoiceModalSignal}
          openDebitNoteSignal={openDisputeModalSignal}
          onTabChange={(t) => {
            if (t === 'matrix') handleVendorSubTabChange('three-way-matching');
            else if (t === 'pos') handleVendorSubTabChange('purchase-orders');
            else if (t === 'grns') handleVendorSubTabChange('goods-receipts');
            else if (t === 'invoices') handleVendorSubTabChange('vendor-invoices');
          }}
        />
      )}

      {/* 6. VENDOR DIRECTORY */}
      {currentSubTab === 'vendor-directory' && (
        <VendorDirectoryTab
          vendors={vendors}
          search={search}
          onSearchChange={setSearch}
          onOpenAddModal={handleOpenAddModal}
          onEditVendor={handleOpenEditModal}
          onDeleteVendor={handleDeleteVendor}
          onQuickVerifyVendor={(v) => handleUpdateVendorStatus(v, 'Approved')}
        />
      )}

      {/* 4. VENDOR REGISTRATION FORM */}
      {currentSubTab === 'vendor-creation' && (
        <VendorCreationTab
          categories={activeCategories}
          onSaveVendor={handleSaveFromCreationTab}
          onCancel={() => handleVendorSubTabChange('vendor-directory')}
        />
      )}

      {/* 5. VENDOR VERIFICATION & KYC */}
      {currentSubTab === 'vendor-verification' && (
        <VendorVerificationTab
          vendors={vendors}
          onUpdateVendorStatus={handleUpdateVendorStatus}
        />
      )}

      {/* 6. QUOTATIONS & BIDS REGISTER */}
      {currentSubTab === 'quotations' && (
        <VendorQuotationsTab
          quotations={quotations}
          vendors={vendors}
          openAddModalSignal={openQuoteModalSignal}
          onAddQuotation={(newQ) => {
            const added: VendorQuotation = { ...newQ, id: `q_${Date.now()}` };
            setQuotations([added, ...quotations]);
            showToast(`Quotation ${added.quoteNumber} recorded.`);
          }}
          onUpdateQuoteStatus={(id, status) => {
            setQuotations(quotations.map(q => q.id === id ? { ...q, status } : q));
            showToast(`Quotation status updated to ${status}.`);
          }}
          onConvertToPo={(quote) => {
            showToast(`Generating PO for accepted quote ${quote.quoteNumber}...`);
            handleVendorSubTabChange('purchase-orders');
          }}
        />
      )}

      {/* 7. RATE COMPARISON MATRIX */}
      {currentSubTab === 'rate-comparison' && (
        <VendorRateComparisonTab
          benchmarks={benchmarks}
          openAddBenchmarkSignal={openBenchmarkModalSignal}
          onAddBenchmark={(item) => {
            setBenchmarks([item, ...benchmarks]);
            showToast(`Added rate comparison: ${item.itemName}`);
          }}
        />
      )}

      {/* 8. VENDOR LEGAL & STATUTORY DOCUMENTS */}
      {currentSubTab === 'vendor-documents' && (
        <VendorDocumentsTab
          documents={documents}
          vendors={vendors}
          openUploadDocSignal={openUploadDocModalSignal}
          onUploadDocument={(doc) => {
            const added: VendorDocumentItem = { ...doc, id: `doc_${Date.now()}` };
            setDocuments([added, ...documents]);
            showToast(`Document filed: ${added.fileName}`);
          }}
        />
      )}

      {/* QUICK ADD & EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                {editingVendorId ? 'Edit Vendor Details' : 'Register New Vendor'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vendor Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prime Focus Limited"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium"
                />
              </div>

              {/* 3-Tier Budget Mapping */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                    <span>Budget Category Mapping (3-Tier)</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Linked to Budget Engine
                  </span>
                </div>

                {/* Active Link Path Indicator */}
                <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto">
                  <span className="text-slate-500 text-[9px] font-sans uppercase font-bold tracking-wider shrink-0">Active Link:</span>
                  <span className="text-blue-400 font-bold shrink-0">
                    {selectedCatObj?.name || 'Category'}
                    {selectedCatObj && ` (₹${getCategoryBudget(selectedCatObj).toLocaleString('en-IN')})`}
                  </span>
                  {selectedSubObj?.name && (
                    <>
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-amber-300 font-medium shrink-0">
                        {selectedSubObj.name} (₹{getSubCategoryBudget(selectedSubObj).toLocaleString('en-IN')})
                      </span>
                    </>
                  )}
                  {selectedChildObj?.name && (
                    <>
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="text-emerald-400 font-semibold shrink-0">
                        {selectedChildObj.name} (₹{getChildBudget(selectedChildObj).toLocaleString('en-IN')})
                      </span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
                      <span className="font-semibold">1. Main Category</span>
                      {selectedCatObj && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Budget: ₹{getCategoryBudget(selectedCatObj).toLocaleString('en-IN')}
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedCatObj?.id || selectedCatId}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        setSelectedCatId(newCatId);
                        const cat = activeCategories.find(c => c.id === newCatId);
                        const firstSub = cat?.subCategories?.[0];
                        setSelectedSubId(firstSub?.id || '');
                        setSelectedChildId(firstSub?.childCategories?.[0]?.id || '');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {activeCategories.map((c, idx) => {
                        const bVal = getCategoryBudget(c);
                        return (
                          <option key={c.id} value={c.id}>
                            {idx + 1}. {c.name} — ₹{bVal.toLocaleString('en-IN')}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
                      <span className="font-semibold">2. Sub Category</span>
                      {selectedSubObj && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          Budget: ₹{getSubCategoryBudget(selectedSubObj).toLocaleString('en-IN')}
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedSubObj?.id || selectedSubId}
                      onChange={(e) => {
                        const newSubId = e.target.value;
                        setSelectedSubId(newSubId);
                        const sub = availableSubCategories.find(s => s.id === newSubId);
                        setSelectedChildId(sub?.childCategories?.[0]?.id || '');
                      }}
                      disabled={availableSubCategories.length === 0}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs disabled:opacity-50 focus:border-blue-500 focus:outline-none"
                    >
                      {availableSubCategories.length === 0 ? (
                        <option value="">No sub-categories available</option>
                      ) : (
                        availableSubCategories.map((s, sIdx) => {
                          const parentCat = activeCategories.find(c => c.id === (selectedCatObj?.id || selectedCatId));
                          const parentIdx = parentCat ? activeCategories.indexOf(parentCat) : 0;
                          const serial = `${parentIdx + 1}.${sIdx + 1}`;
                          const bVal = getSubCategoryBudget(s);
                          return (
                            <option key={s.id} value={s.id}>
                              {serial}. {s.name} — ₹{bVal.toLocaleString('en-IN')}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
                      <span className="font-semibold">3. Child Category / Account Head</span>
                      {selectedChildObj && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Budget: ₹{getChildBudget(selectedChildObj).toLocaleString('en-IN')}
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedChildObj?.id || selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      disabled={availableChildCategories.length === 0}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs disabled:opacity-50 focus:border-blue-500 focus:outline-none"
                    >
                      {availableChildCategories.length === 0 ? (
                        <option value="">No child account heads available</option>
                      ) : (
                        availableChildCategories.map((ch, chIdx) => {
                          const parentCat = activeCategories.find(c => c.id === (selectedCatObj?.id || selectedCatId));
                          const parentIdx = parentCat ? activeCategories.indexOf(parentCat) : 0;
                          const subIdx = selectedSubObj ? availableSubCategories.indexOf(selectedSubObj) : 0;
                          const serial = `${parentIdx + 1}.${subIdx + 1}.${chIdx + 1}`;
                          const bVal = getChildBudget(ch);
                          return (
                            <option key={ch.id} value={ch.id}>
                              {serial}. {ch.name} — ₹{bVal.toLocaleString('en-IN')}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val.length === 15 && !pan) {
                        setPan(val.slice(2, 12));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HDFC Bank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Account No.</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingVendorId ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
