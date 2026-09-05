import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  FileCheck2, 
  Plus, 
  ArrowRight,
  Printer,
  Sparkles,
  Receipt
} from 'lucide-react';
import { subscribePayments, savePayment } from '../services/firebaseService';
import ThreeWayMatchingView from './ThreeWayMatchingView';
import { Project, Expense, BudgetCategory } from '../types';
import { DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE } from '../defaultCookingShowBudget';
import { generateStandardCategoriesForProject } from '../data';

export interface PaymentRecord {
  id: string;
  projectId?: string;
  voucherNo: string;
  payee: string;
  category: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryId?: string;
  childCategory?: string;
  childCategoryId?: string;
  amount: number;
  paymentMode: string;
  bankName: string;
  utrNo: string;
  date: string;
  status: 'Released' | 'Pending Release' | 'Processing';
  approvedBy: string;
}

interface PaymentsViewProps {
  projects?: Project[];
  selectedProjectId?: string;
  expenses?: Expense[];
  categories?: BudgetCategory[];
  onSaveExpense?: (expense: Expense) => void;
}

export default function PaymentsView({
  projects = [],
  selectedProjectId = '',
  expenses = [],
  categories = [],
  onSaveExpense
}: PaymentsViewProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'disbursements' | 'three-way-matching'>('disbursements');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active 20-category budget structure for Cooking Show
  const activeCategories = useMemo<BudgetCategory[]>(() => {
    if (categories && categories.length > 0) return categories;
    return generateStandardCategoriesForProject(selectedProjectId || 'default');
  }, [categories, selectedProjectId]);

  // New Voucher Form
  const [payee, setPayee] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('RTGS / NEFT');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [approvedBy, setApprovedBy] = useState('Production Controller');

  // Auto initialize modal category hierarchy
  useEffect(() => {
    if (activeCategories.length > 0 && !selectedCatId) {
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
  }, [activeCategories, selectedCatId]);

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

  useEffect(() => {
    const unsub = subscribePayments((data) => {
      setPayments(Array.isArray(data) ? data : []);
    });
    return () => unsub();
  }, []);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        p.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
        p.payee.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(search.toLowerCase())) ||
        (p.childCategory && p.childCategory.toLowerCase().includes(search.toLowerCase())) ||
        p.utrNo.toLowerCase().includes(search.toLowerCase());
      
      if (!selectedProjectId) return matchesSearch;
      if (!p.projectId) return matchesSearch;
      return matchesSearch && (
        p.projectId === selectedProjectId || 
        p.projectId.replace(/^(wp_|p_|proj_)/, '') === selectedProjectId.replace(/^(wp_|p_|proj_)/, '')
      );
    });
  }, [payments, search, selectedProjectId]);

  // Handle Release Payment
  const handleReleasePayment = async (id: string) => {
    const utr = prompt('Enter Bank UTR / Transaction Reference Number (e.g. HDFC1092837482):');
    if (!utr) return;

    const updated = payments.map(p => {
      if (p.id === id) {
        const releasedP: PaymentRecord = {
          ...p,
          status: 'Released' as const,
          utrNo: utr
        };
        savePayment(releasedP);
        return releasedP;
      }
      return p;
    });
    setPayments(updated);
    alert('Payment released and synced to cloud ledger with UTR reference!');
  };

  // Handle New Disbursement Creation
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount) return;

    const targetCat = activeCategories.find(c => c.id === selectedCatId) || activeCategories[0];
    const targetSub = targetCat?.subCategories?.find(s => s.id === selectedSubId);
    const targetChild = targetSub?.childCategories?.find(ch => ch.id === selectedChildId);

    const catName = targetCat?.name || 'Production';
    const subName = targetSub?.name || '';
    const childName = targetChild?.name || '';

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      projectId: selectedProjectId || activeProject?.id,
      voucherNo: `PV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      payee,
      category: catName,
      categoryId: targetCat?.id || selectedCatId,
      subCategory: subName,
      subCategoryId: targetSub?.id || selectedSubId,
      childCategory: childName,
      childCategoryId: targetChild?.id || selectedChildId,
      amount: Number(amount) || 0,
      paymentMode,
      bankName,
      utrNo: 'PENDING_DISBURSEMENT',
      date: new Date().toISOString().substring(0, 10),
      status: 'Pending Release',
      approvedBy
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    await savePayment(newPayment);
    setIsCreateModalOpen(false);
    setPayee('');
    setAmount('');
    alert(`Payment Voucher ${newPayment.voucherNo} created for ₹${newPayment.amount.toLocaleString('en-IN')} under ${catName}${subName ? ` › ${subName}` : ''}!`);
  };

  const totalDisbursed = filteredPayments
    .filter(p => p.status === 'Released')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === 'Pending Release' || p.status === 'Processing')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-400 border border-blue-900/60">
                {activeProject?.name || 'All Projects'}
              </span>
            </div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              PAYMENTS &amp; DISBURSEMENT HUB
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Verified voucher payments, 3-Way PO audit verification, RTGS/NEFT releases &amp; UTR tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Payment Voucher</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'three-way-matching' ? 'disbursements' : 'three-way-matching')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'three-way-matching'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-300 border border-emerald-800/60 hover:bg-slate-700'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{activeTab === 'three-way-matching' ? 'View Payment Queue' : '3-Way PO Matching Audit'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('disbursements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'disbursements'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Disbursements Queue ({filteredPayments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('three-way-matching')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'three-way-matching'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PO to Invoice 3-Way Matching</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      {activeTab === 'disbursements' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Disbursed (Settled)</div>
            <div className="text-base md:text-lg font-black text-emerald-400 font-mono">
              ₹{totalDisbursed.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {filteredPayments.filter(p => p.status === 'Released').length} Vouchers Released
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Pending Release</div>
            <div className="text-base md:text-lg font-black text-amber-400 font-mono">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {filteredPayments.filter(p => p.status !== 'Released').length} Vouchers Awaiting UTR
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs col-span-2 md:col-span-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Audit Compliance</div>
            <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict 3-Way Verified</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tax &amp; TDS deductions logged</div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      {activeTab === 'three-way-matching' ? (
        <ThreeWayMatchingView 
          categories={categories}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onNavigateToExpenses={() => setActiveTab('disbursements')} 
        />
      ) : (
        <>
          {/* Search bar */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search payee name, voucher number, UTR reference or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Records Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Voucher No</th>
                    <th className="py-2.5 px-3">Payee Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Mode &amp; Bank</th>
                    <th className="py-2.5 px-3">UTR Reference</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                        <div className="max-w-md mx-auto space-y-2">
                          <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="font-bold text-slate-300">No payment vouchers found</p>
                          <p className="text-[11px] text-slate-500">
                            Create a payment voucher or process approved expenses through 3-Way Matching.
                          </p>
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create First Voucher
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{p.voucherNo}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-200">{p.payee}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200">{p.category}</div>
                          {(p.subCategory || p.childCategory) && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                              {p.subCategory && <span>{p.subCategory}</span>}
                              {p.childCategory && <span className="text-slate-300 font-sans">› {p.childCategory}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-200">{p.paymentMode}</div>
                          <div className="text-[10px] text-slate-400">{p.bankName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{p.utrNo}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                            p.status === 'Released' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60' : 'bg-amber-950/60 text-amber-400 border border-amber-900/60'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.status === 'Pending Release' ? (
                            <button
                              onClick={() => handleReleasePayment(p.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            >
                              Release &amp; UTR
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Disbursed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: New Payment Voucher */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Generate Payment Voucher
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payee Name / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Light Craft Studios Pvt Ltd"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 3-Tier Category Allocation */}
              <div className="space-y-2 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>BUDGET ALLOCATION (COOKING SHOW ERP)</span>
                  <span className="text-[10px] text-amber-400 font-mono">20 Standard Heads</span>
                </div>

                <div>
                  <label className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <span>1. Main Category</span>
                    {selectedCatId && (() => {
                      const catObj = activeCategories.find(c => c.id === selectedCatId);
                      return catObj ? (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-normal">
                          Budget: ₹{getCategoryBudget(catObj).toLocaleString('en-IN')}
                        </span>
                      ) : null;
                    })()}
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setSelectedCatId(newCatId);
                      const catObj = activeCategories.find(c => c.id === newCatId);
                      const firstSub = catObj?.subCategories?.[0];
                      setSelectedSubId(firstSub?.id || '');
                      setSelectedChildId(firstSub?.childCategories?.[0]?.id || '');
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {activeCategories.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {idx + 1}. {c.name} — ₹{getCategoryBudget(c).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                      <span>2. Subcategory</span>
                      {selectedSubId && (() => {
                        const catObj = activeCategories.find(c => c.id === selectedCatId);
                        const subObj = catObj?.subCategories?.find(s => s.id === selectedSubId);
                        return subObj ? (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-normal">
                            ₹{getSubCategoryBudget(subObj).toLocaleString('en-IN')}
                          </span>
                        ) : null;
                      })()}
                    </label>
                    <select
                      value={selectedSubId}
                      onChange={(e) => {
                        const newSubId = e.target.value;
                        setSelectedSubId(newSubId);
                        const catObj = activeCategories.find(c => c.id === selectedCatId);
                        const subObj = catObj?.subCategories?.find(s => s.id === newSubId);
                        setSelectedChildId(subObj?.childCategories?.[0]?.id || '');
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {activeCategories
                        .find(c => c.id === selectedCatId)
                        ?.subCategories?.map((s, sIdx) => {
                          const parentCat = activeCategories.find(c => c.id === selectedCatId);
                          const parentIdx = parentCat ? activeCategories.indexOf(parentCat) : 0;
                          const serial = `${parentIdx + 1}.${sIdx + 1}`;
                          return (
                            <option key={s.id} value={s.id}>
                              {serial}. {s.name} — ₹{getSubCategoryBudget(s).toLocaleString('en-IN')}
                            </option>
                          );
                        }) || <option value="">No subcategories</option>}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                      <span>3. Child Category</span>
                      {selectedChildId && (() => {
                        const catObj = activeCategories.find(c => c.id === selectedCatId);
                        const subObj = catObj?.subCategories?.find(s => s.id === selectedSubId);
                        const chObj = subObj?.childCategories?.find(ch => ch.id === selectedChildId);
                        return chObj ? (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-normal">
                            ₹{getChildBudget(chObj).toLocaleString('en-IN')}
                          </span>
                        ) : null;
                      })()}
                    </label>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {activeCategories
                        .find(c => c.id === selectedCatId)
                        ?.subCategories?.find(s => s.id === selectedSubId)
                        ?.childCategories?.map((ch, chIdx) => {
                          const parentCat = activeCategories.find(c => c.id === selectedCatId);
                          const parentIdx = parentCat ? activeCategories.indexOf(parentCat) : 0;
                          const subObj = parentCat?.subCategories?.find(s => s.id === selectedSubId);
                          const subIdx = subObj && parentCat?.subCategories ? parentCat.subCategories.indexOf(subObj) : 0;
                          const serial = `${parentIdx + 1}.${subIdx + 1}.${chIdx + 1}`;
                          return (
                            <option key={ch.id} value={ch.id}>
                              {serial}. {ch.name} — ₹{getChildBudget(ch).toLocaleString('en-IN')}
                            </option>
                          );
                        }) || <option value="">Standard Line Item</option>}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Disbursement Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 75000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="RTGS / NEFT">RTGS / NEFT</option>
                    <option value="IMPS Immediate">IMPS Immediate</option>
                    <option value="Corporate Card">Corporate Card</option>
                    <option value="UPI Transfer">UPI Transfer</option>
                    <option value="Cheque Disbursement">Cheque Disbursement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Generate Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
