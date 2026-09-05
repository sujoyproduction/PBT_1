import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Building2, 
  CreditCard, 
  FileText, 
  Check, 
  X, 
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import { Vendor } from '../../types';

interface VendorVerificationTabProps {
  vendors: Vendor[];
  onUpdateVendorStatus: (vendor: Vendor, newStatus: 'Approved' | 'Pending Verification' | 'Blocked') => void;
}

export const VendorVerificationTab: React.FC<VendorVerificationTabProps> = ({
  vendors,
  onUpdateVendorStatus
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [search, setSearch] = useState('');

  // GSTIN & PAN Validator helper
  const checkGstinValidity = (gstin?: string) => {
    if (!gstin) return { valid: false, reason: 'Missing GSTIN' };
    const clean = gstin.trim().toUpperCase();
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(clean)) {
      return { valid: false, reason: 'Invalid GSTIN format (must be 15 chars)' };
    }
    return { valid: true, stateCode: clean.slice(0, 2), pan: clean.slice(2, 12) };
  };

  const checkPanValidity = (pan?: string) => {
    if (!pan) return { valid: false, reason: 'Missing PAN' };
    const clean = pan.trim().toUpperCase();
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!regex.test(clean)) {
      return { valid: false, reason: 'Invalid PAN format (must be 10 chars)' };
    }
    return { valid: true, entityType: clean[3] };
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = 
        !search ||
        v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        (v.gstin && v.gstin.toLowerCase().includes(search.toLowerCase())) ||
        (v.pan && v.pan.toLowerCase().includes(search.toLowerCase()));

      let matchFilter = true;
      if (filter === 'PENDING') matchFilter = v.status === 'Pending Verification';
      if (filter === 'APPROVED') matchFilter = v.status === 'Approved' || v.status === 'Active';
      if (filter === 'BLOCKED') matchFilter = v.status === 'Blocked';

      return matchSearch && matchFilter;
    });
  }, [vendors, search, filter]);

  const verifiedCount = vendors.filter(v => v.status === 'Approved' || v.status === 'Active').length;
  const pendingCount = vendors.filter(v => v.status === 'Pending Verification').length;
  const blockedCount = vendors.filter(v => v.status === 'Blocked').length;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Vendor KYC & Statutory Compliance Verification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit GSTIN validity, PAN linkage, Bank account IFSC codes, and anti-fraud status before releasing payment vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({vendors.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('BLOCKED')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filter === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter vendors by name, GSTIN, PAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Verification Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredVendors.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="text-sm font-medium text-slate-400">No vendors matching current verification filter</p>
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const gstinCheck = checkGstinValidity(vendor.gstin);
            const panCheck = checkPanValidity(vendor.pan || vendor.panNumber);
            const hasBank = Boolean(vendor.bankName && vendor.accountNumber && vendor.ifscCode);
            const isApproved = vendor.status === 'Approved' || vendor.status === 'Active';
            const isBlocked = vendor.status === 'Blocked';

            return (
              <div
                key={vendor.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                  isBlocked
                    ? 'border-rose-900/50 bg-rose-950/10'
                    : isApproved
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-amber-900/40 bg-amber-950/5'
                }`}
              >
                {/* Top Vendor Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{vendor.vendorName}</span>
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {vendor.category} {vendor.subCategory ? `• ${vendor.subCategory}` : ''}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    isBlocked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isApproved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {vendor.status || 'Pending Verification'}
                  </span>
                </div>

                {/* Audit Checkpoints */}
                <div className="mt-3.5 space-y-2 text-xs">
                  {/* GSTIN Checkpoint */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {gstinCheck.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">GSTIN Format</div>
                        <div className="font-mono text-[11px] text-white">
                          {vendor.gstin || 'Not Provided'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      gstinCheck.valid
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {gstinCheck.valid ? 'Valid GSTIN' : gstinCheck.reason}
                    </span>
                  </div>

                  {/* PAN Checkpoint */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {panCheck.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">PAN Card Verification</div>
                        <div className="font-mono text-[11px] text-white">
                          {vendor.pan || vendor.panNumber || 'Not Provided'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      panCheck.valid
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {panCheck.valid ? 'Verified Format' : panCheck.reason}
                    </span>
                  </div>

                  {/* Bank & IFSC Checkpoint */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {hasBank ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Bank Account & IFSC</div>
                        <div className="font-mono text-[11px] text-white">
                          {vendor.bankName ? `${vendor.bankName} (${vendor.ifscCode})` : 'Missing Banking Data'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      hasBank
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {hasBank ? 'Ready for RTGS/NEFT' : 'Action Required'}
                    </span>
                  </div>
                </div>

                {/* Verification Control Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  {isBlocked ? (
                    <button
                      onClick={() => onUpdateVendorStatus(vendor, 'Approved')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Unlock className="w-3 h-3 text-emerald-400" />
                      <span>Unblock Vendor</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onUpdateVendorStatus(vendor, 'Blocked')}
                        className="px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Block Vendor from receiving purchase orders or payments"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Block</span>
                      </button>

                      {!isApproved ? (
                        <button
                          onClick={() => onUpdateVendorStatus(vendor, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify & Approve Vendor</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateVendorStatus(vendor, 'Pending Verification')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Flag for Re-Audit</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorVerificationTab;
