import React, { useState, useMemo } from 'react';
import { 
  Tag, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Download, 
  Check, 
  X, 
  DollarSign, 
  Filter, 
  Building2,
  Paperclip
} from 'lucide-react';
import { VendorQuotation, Vendor } from '../../types';

interface VendorQuotationsTabProps {
  quotations: VendorQuotation[];
  vendors: Vendor[];
  onAddQuotation: (quote: Omit<VendorQuotation, 'id'>) => void;
  onUpdateQuoteStatus: (id: string, status: VendorQuotation['status']) => void;
  onConvertToPo?: (quote: VendorQuotation) => void;
  openAddModalSignal?: number;
}

export const VendorQuotationsTab: React.FC<VendorQuotationsTabProps> = ({
  quotations,
  vendors,
  onAddQuotation,
  onUpdateQuoteStatus,
  onConvertToPo,
  openAddModalSignal
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (openAddModalSignal && openAddModalSignal > 0) {
      setIsModalOpen(true);
    }
  }, [openAddModalSignal]);

  // Form State
  const [quoteNumber, setQuoteNumber] = useState(`QT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [department, setDepartment] = useState('Camera');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [quotedAmount, setQuotedAmount] = useState<number>(0);
  const [taxTerms, setTaxTerms] = useState('18% GST Extra');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const departmentsList = useMemo(() => {
    const list = new Set<string>();
    quotations.forEach(q => list.add(q.department));
    return Array.from(list);
  }, [quotations]);

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch = 
        !search ||
        q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        q.scopeOfWork.toLowerCase().includes(search.toLowerCase()) ||
        q.department.toLowerCase().includes(search.toLowerCase());

      const matchDept = deptFilter === 'ALL' || q.department === deptFilter;
      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [quotations, search, deptFilter, statusFilter]);

  const totalQuotedValue = useMemo(() => {
    return quotations.reduce((sum, q) => sum + (q.quotedAmount || 0), 0);
  }, [quotations]);

  const acceptedValue = useMemo(() => {
    return quotations
      .filter(q => q.status === 'Accepted')
      .reduce((sum, q) => sum + (q.quotedAmount || 0), 0);
  }, [quotations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor || !scopeOfWork || quotedAmount <= 0) return;

    onAddQuotation({
      quoteNumber,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      department,
      scopeOfWork,
      quotedAmount: Number(quotedAmount),
      taxTerms,
      dateReceived: new Date().toISOString().split('T')[0],
      validUntil,
      status: 'Under Review',
      remarks,
      attachmentName: `${vendor.vendorName.replace(/\s+/g, '_')}_Quotation.pdf`
    });

    setIsModalOpen(false);
    setScopeOfWork('');
    setQuotedAmount(0);
    setRemarks('');
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total RFQ Bids</div>
          <div className="text-xl font-bold text-white mt-1">{quotations.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Submitted by vendors</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Accepted Quotes</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {quotations.filter(q => q.status === 'Accepted').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">₹{(acceptedValue / 100000).toFixed(2)}L Value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Under Evaluation</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {quotations.filter(q => q.status === 'Under Review' || q.status === 'Shortlisted').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending approval</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">Total Quoted Pipeline</div>
          <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
            ₹{(totalQuotedValue / 100000).toFixed(2)}L
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across All Departments</div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotations by quote #, vendor name, equipment/scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={() => {
              setQuoteNumber(`QT-2026-${Math.floor(100 + Math.random() * 900)}`);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quotation / RFQ</span>
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Quote Ref #</th>
                <th className="py-3 px-4">Vendor & Department</th>
                <th className="py-3 px-4">Scope of Work / Equipment</th>
                <th className="py-3 px-4 text-right">Quoted Amount</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Evaluation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-400">No quotations found</p>
                    <p className="text-xs text-slate-600 mt-1">Click "Add Quotation / RFQ" to record a vendor bid</p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {quote.quoteNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{quote.vendorName}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 rounded text-[10px]">
                        {quote.department}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-300 line-clamp-2">{quote.scopeOfWork}</div>
                      {quote.remarks && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">{quote.remarks}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-white text-sm">
                        ₹{quote.quotedAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">{quote.taxTerms}</div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      <div>Rec: {quote.dateReceived}</div>
                      <div className="text-slate-500 text-[10px]">Till: {quote.validUntil}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        quote.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : quote.status === 'Shortlisted'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : quote.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {quote.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {quote.status !== 'Accepted' && (
                          <button
                            onClick={() => onUpdateQuoteStatus(quote.id, 'Accepted')}
                            title="Accept Quotation"
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {quote.status !== 'Rejected' && (
                          <button
                            onClick={() => onUpdateQuoteStatus(quote.id, 'Rejected')}
                            title="Reject Quotation"
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {quote.status === 'Accepted' && onConvertToPo && (
                          <button
                            onClick={() => onConvertToPo(quote)}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Generate PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Quotation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                Record Vendor Quotation / RFQ
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Quote Reference #</label>
                  <input
                    type="text"
                    required
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Camera">Camera & Optics</option>
                    <option value="Lighting">Lighting & Grip</option>
                    <option value="Art & Set">Art & Production Design</option>
                    <option value="Costume & Vanity">Costume & Vanity</option>
                    <option value="Catering">Unit Catering</option>
                    <option value="Transport">Travel & Transport</option>
                    <option value="Technical">Technical & Power</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Vendor</label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendorName} ({v.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Scope of Work / Equipment Description</label>
                <textarea
                  required
                  rows={2}
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  placeholder="e.g. ARRI Alexa 35 camera kit with Master Anamorphic lenses for 10 shoot days..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Quoted Base Amount (INR)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={quotedAmount || ''}
                    onChange={(e) => setQuotedAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tax & Payment Terms</label>
                  <input
                    type="text"
                    value={taxTerms}
                    onChange={(e) => setTaxTerms(e.target.value)}
                    placeholder="18% GST Extra"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Quote Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Remarks / Note</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Approved by DOP..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorQuotationsTab;
