import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ChevronRight, 
  Link2, 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { BudgetCategory, SubCategory, ChildCategory, Vendor } from '../../types';

interface VendorCreationTabProps {
  categories: BudgetCategory[];
  onSaveVendor: (vendor: Omit<Vendor, 'id' | 'totalPaid'>) => void;
  onCancel?: () => void;
}

export const VendorCreationTab: React.FC<VendorCreationTabProps> = ({
  categories,
  onSaveVendor,
  onCancel
}) => {
  const [vendorName, setVendorName] = useState('');
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
  const [status, setStatus] = useState<'Approved' | 'Pending Verification' | 'Active'>('Pending Verification');
  const [successMessage, setSuccessMessage] = useState(false);

  // Initialize category cascade
  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
      const firstSub = categories[0].subCategories?.[0];
      if (firstSub) {
        setSelectedSubId(firstSub.id);
        const firstChild = firstSub.childCategories?.[0];
        if (firstChild) setSelectedChildId(firstChild.id);
      }
    }
  }, [categories, selectedCatId]);

  const activeCategory = categories.find(c => c.id === selectedCatId);
  const activeSubCategory = activeCategory?.subCategories?.find(s => s.id === selectedSubId);
  const activeChildCategory = activeSubCategory?.childCategories?.find(ch => ch.id === selectedChildId);

  // Helpers to calculate allocated budget for dropdown tags and options
  const getChildBudget = (child: any): number => {
    if (!child) return 0;
    if (typeof child.allocatedAmount === 'number' && child.allocatedAmount > 0) return child.allocatedAmount;
    const calc = ((child.count || 0) * (child.rate || 0) * (child.shifts || 1));
    return calc || 0;
  };

  const getSubBudget = (sub: any): number => {
    if (!sub) return 0;
    if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) return sub.allocatedAmount;
    if (Array.isArray(sub.childCategories) && sub.childCategories.length > 0) {
      const sum = sub.childCategories.reduce((acc: number, ch: any) => acc + getChildBudget(ch), 0);
      if (sum > 0) return sum;
    }
    const calc = ((sub.count || 0) * (sub.rate || 0) * (sub.shifts || 1));
    return calc || 0;
  };

  const getCatBudget = (cat: any): number => {
    if (!cat) return 0;
    if (typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0) return cat.allocatedAmount;
    if (Array.isArray(cat.subCategories) && cat.subCategories.length > 0) {
      return cat.subCategories.reduce((acc: number, sub: any) => acc + getSubBudget(sub), 0);
    }
    return 0;
  };

  // Auto extract PAN from GSTIN if 15 chars
  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase();
    setGstin(upper);
    if (upper.length === 15 && !pan) {
      const extractedPan = upper.slice(2, 12);
      setPan(extractedPan);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    onSaveVendor({
      vendorName: vendorName.trim(),
      categoryId: activeCategory?.id,
      category: activeCategory?.name || 'General',
      subCategoryId: activeSubCategory?.id,
      subCategory: activeSubCategory?.name || '',
      childCategoryId: activeChildCategory?.id,
      childCategory: activeChildCategory?.name || '',
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      panNumber: pan.trim().toUpperCase(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      status
    });

    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      setVendorName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      setPan('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Vendor Onboarding & Registration Form
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Register new equipment rental houses, catering suppliers, camera crews, and service contractors.
          </p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Vendor Registered Successfully!</span>
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* 1. Basic Vendor Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              1. Vendor Company Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Vendor / Business Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prime Focus Limited / Light N Light"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Compliance Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Pending Verification">Pending Verification (Audit GST/PAN/Bank)</option>
                  <option value="Approved">Approved & KYC Verified</option>
                  <option value="Active">Active Supplier</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. 3-Tier Budget Category Mapping */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              2. Budget Category Linkage (3-Level Cascade)
            </h3>

            {/* Breadcrumb Preview */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-[11px] text-slate-300 font-mono overflow-x-auto">
              <span className="text-slate-500 font-sans">Active Link:</span>
              <span className="text-blue-400 font-bold">
                {activeCategory?.name || 'Top Category'}
                {activeCategory && ` (₹${getCatBudget(activeCategory).toLocaleString('en-IN')})`}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-amber-300 font-medium">
                {activeSubCategory?.name || 'Sub Category'}
                {activeSubCategory && ` (₹${getSubBudget(activeSubCategory).toLocaleString('en-IN')})`}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-emerald-400 font-semibold">
                {activeChildCategory?.name || 'Line Item / Account Head'}
                {activeChildCategory && ` (₹${getChildBudget(activeChildCategory).toLocaleString('en-IN')})`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="flex items-center justify-between text-slate-400 mb-1 font-semibold text-xs">
                  <span>1. Main Category</span>
                  {activeCategory && (
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Budget: ₹{getCatBudget(activeCategory).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setSelectedCatId(newCatId);
                    const cat = categories.find(c => c.id === newCatId);
                    const firstSub = cat?.subCategories?.[0];
                    setSelectedSubId(firstSub?.id || '');
                    setSelectedChildId(firstSub?.childCategories?.[0]?.id || '');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                >
                  {categories.map((c, idx) => {
                    const bVal = getCatBudget(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {idx + 1}. {c.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-slate-400 mb-1 font-semibold text-xs">
                  <span>2. Sub Category</span>
                  {activeSubCategory && (
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Budget: ₹{getSubBudget(activeSubCategory).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => {
                    const newSubId = e.target.value;
                    setSelectedSubId(newSubId);
                    const sub = activeCategory?.subCategories?.find(s => s.id === newSubId);
                    setSelectedChildId(sub?.childCategories?.[0]?.id || '');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                >
                  {activeCategory?.subCategories?.map((s, sIdx) => {
                    const parentCat = categories.find(c => c.id === selectedCatId);
                    const parentIdx = parentCat ? categories.indexOf(parentCat) : 0;
                    const serial = `${parentIdx + 1}.${sIdx + 1}`;
                    const bVal = getSubBudget(s);
                    return (
                      <option key={s.id} value={s.id}>
                        {serial}. {s.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-slate-400 mb-1 font-semibold text-xs">
                  <span>3. Child Account Head</span>
                  {activeChildCategory && (
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Budget: ₹{getChildBudget(activeChildCategory).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                >
                  {activeSubCategory?.childCategories?.map((ch, chIdx) => {
                    const parentCat = categories.find(c => c.id === selectedCatId);
                    const parentIdx = parentCat ? categories.indexOf(parentCat) : 0;
                    const subIdx = activeSubCategory ? (activeCategory?.subCategories || []).indexOf(activeSubCategory) : 0;
                    const serial = `${parentIdx + 1}.${subIdx + 1}.${chIdx + 1}`;
                    const bVal = getChildBudget(ch);
                    return (
                      <option key={ch.id} value={ch.id}>
                        {serial}. {ch.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Contact & Address */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Phone className="w-3.5 h-3.5 text-green-400" />
              3. Contact & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Key Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile / Telephone</label>
                <input
                  type="text"
                  placeholder="+91 98200 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Email Address</label>
                <input
                  type="email"
                  placeholder="rentals@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Studio / Registered Office Address</label>
              <input
                type="text"
                placeholder="Plot 45, Royal Palms Estate, Goregaon East, Mumbai 400065"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* 4. Tax Identification (GSTIN & PAN) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              4. Tax Identification (GSTIN & PAN)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  GSTIN (15-digit GST Number)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="27AABCP1234F1Z8"
                  value={gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  PAN will be automatically extracted from characters 3 to 12.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  PAN Number (10-digit Permanent Account Number)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="AABCP1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* 5. Banking & Payout Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              5. Banking & Payout Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="50200012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IFSC Code (11-digit)</label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="HDFC0000060"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save & Register Vendor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorCreationTab;
