import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Phone, 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  ExternalLink, 
  MapPin,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Filter
} from 'lucide-react';
import { Vendor } from '../../types';

interface VendorDirectoryTabProps {
  vendors: Vendor[];
  search: string;
  onSearchChange: (val: string) => void;
  onOpenAddModal: () => void;
  onEditVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string, name: string) => void;
  onQuickVerifyVendor: (vendor: Vendor) => void;
}

export const VendorDirectoryTab: React.FC<VendorDirectoryTabProps> = ({
  vendors,
  search,
  onSearchChange,
  onOpenAddModal,
  onEditVendor,
  onDeleteVendor,
  onQuickVerifyVendor
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list extracted from vendors
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    vendors.forEach(v => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = 
        !search ||
        v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase()) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(search.toLowerCase())) ||
        (v.childCategory && v.childCategory.toLowerCase().includes(search.toLowerCase())) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (v.gstin && v.gstin.toLowerCase().includes(search.toLowerCase())) ||
        (v.pan && v.pan.toLowerCase().includes(search.toLowerCase())) ||
        (v.phone && v.phone.includes(search));

      const matchStatus = selectedStatus === 'ALL' || v.status === selectedStatus;
      const matchCategory = selectedCategory === 'ALL' || v.category === selectedCategory;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [vendors, search, selectedStatus, selectedCategory]);

  const totalPaidSum = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.totalPaid || 0), 0);
  }, [vendors]);

  const verifiedCount = useMemo(() => {
    return vendors.filter(v => v.status === 'Approved' || v.status === 'Active').length;
  }, [vendors]);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Vendors</div>
          <div className="text-xl font-bold text-white mt-1">{vendors.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Procurement Master</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Approved & Verified</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">KYC & Compliance Cleared</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending Verification</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {vendors.filter(v => v.status === 'Pending Verification').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Awaiting PAN / GSTIN audit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Total Disbursed</div>
          <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
            ₹{(totalPaidSum / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Accounts</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor by name, category, GSTIN, PAN, phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Blocked">Blocked</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 max-w-[160px] truncate"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={onOpenAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Vendor & Identity</th>
                <th className="py-3 px-4">Budget Category Hierarchy</th>
                <th className="py-3 px-4">Tax & Compliance (GST/PAN)</th>
                <th className="py-3 px-4">Banking & Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-400">No vendors found</p>
                    <p className="text-xs text-slate-600 mt-1">Try adjusting search or filter parameters</p>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const isApproved = vendor.status === 'Approved' || vendor.status === 'Active';
                  return (
                    <tr key={vendor.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Vendor & Identity */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-xs">{vendor.vendorName}</div>
                        {vendor.contactPerson && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{vendor.contactPerson}</span>
                          </div>
                        )}
                        {vendor.address && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-600" />
                            <span className="truncate">{vendor.address}</span>
                          </div>
                        )}
                      </td>

                      {/* Budget Category Hierarchy */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 font-medium text-[10px]">
                            {vendor.category || 'General'}
                          </span>
                          {vendor.subCategory && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                              <span className="truncate max-w-[140px]">{vendor.subCategory}</span>
                            </div>
                          )}
                          {vendor.childCategory && (
                            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                              <ChevronRight className="w-2 h-2 text-slate-700 shrink-0" />
                              <span className="truncate max-w-[140px]">{vendor.childCategory}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tax & Compliance */}
                      <td className="py-3 px-4 font-mono">
                        <div className="space-y-1">
                          {vendor.gstin ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-300">
                              <span className="text-[9px] text-slate-500 uppercase">GST:</span>
                              <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{vendor.gstin}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-500/80 italic">No GSTIN</div>
                          )}
                          {(vendor.pan || vendor.panNumber) && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span className="text-[9px] text-slate-600 uppercase">PAN:</span>
                              <span>{vendor.pan || vendor.panNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Banking & Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {vendor.bankName && (
                            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{vendor.bankName}</span>
                            </div>
                          )}
                          {vendor.accountNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              A/C: •••• {vendor.accountNumber.slice(-4)} | {vendor.ifscCode}
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : vendor.status === 'Blocked'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isApproved ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : vendor.status === 'Blocked' ? (
                            <ShieldAlert className="w-2.5 h-2.5" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5" />
                          )}
                          {vendor.status || 'Pending Verification'}
                        </span>
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 text-right font-mono text-white font-medium">
                        ₹{(vendor.totalPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isApproved && (
                            <button
                              onClick={() => onQuickVerifyVendor(vendor)}
                              title="Approve & Verify Vendor"
                              className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditVendor(vendor)}
                            title="Edit Vendor Details"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteVendor(vendor.id, vendor.vendorName)}
                            title="Delete Vendor"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
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
      </div>
    </div>
  );
};

export default VendorDirectoryTab;
