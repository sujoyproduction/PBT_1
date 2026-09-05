import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  File, 
  X,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { VendorDocumentItem, Vendor } from '../../types';

interface VendorDocumentsTabProps {
  documents: VendorDocumentItem[];
  vendors: Vendor[];
  onUploadDocument: (doc: Omit<VendorDocumentItem, 'id'>) => void;
  openUploadDocSignal?: number;
}

export const VendorDocumentsTab: React.FC<VendorDocumentsTabProps> = ({
  documents,
  vendors,
  onUploadDocument,
  openUploadDocSignal
}) => {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<VendorDocumentItem | null>(null);

  React.useEffect(() => {
    if (openUploadDocSignal && openUploadDocSignal > 0) {
      setIsUploadOpen(true);
    }
  }, [openUploadDocSignal]);

  // Upload Form State
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [docType, setDocType] = useState<VendorDocumentItem['docType']>('Master Service Agreement');
  const [fileName, setFileName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const docTypesList = [
    'Master Service Agreement',
    'GST Registration',
    'Cancelled Cheque',
    'MSME Udyam',
    'PAN Card',
    'Rate Card',
    'NDA'
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = 
        !search ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        doc.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        doc.docType.toLowerCase().includes(search.toLowerCase());

      const matchVendor = vendorFilter === 'ALL' || doc.vendorId === vendorFilter;
      const matchType = typeFilter === 'ALL' || doc.docType === typeFilter;

      return matchSearch && matchVendor && matchType;
    });
  }, [documents, search, vendorFilter, typeFilter]);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor || !fileName) return;

    onUploadDocument({
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      docType,
      fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || undefined,
      status: 'Verified'
    });

    setIsUploadOpen(false);
    setFileName('');
    setExpiryDate('');
  };

  return (
    <div className="space-y-4">
      {/* Header Metric */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-purple-400" />
            Vendor Statutory & Legal Document Vault
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain digital records of vendor Master Service Agreements (MSAs), GST certificates, bank cancelled cheques, and NDAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Vendor Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document name, vendor, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 max-w-[160px] truncate"
          >
            <option value="ALL">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.vendorName}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Document Types</option>
            {docTypesList.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="text-sm font-medium text-slate-400">No documents found</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 text-[10px] font-medium">
                    {doc.docType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    doc.status === 'Verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="truncate flex-1">
                    <div className="font-semibold text-white text-xs truncate" title={doc.fileName}>
                      {doc.fileName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {doc.vendorName}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-600 block">Uploaded:</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">File Size:</span>
                    <span>{doc.fileSize}</span>
                  </div>
                  {doc.expiryDate && (
                    <div className="col-span-2 pt-1 border-t border-slate-900 text-amber-400">
                      <span>Expires: {doc.expiryDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setViewingDoc(doc)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => alert(`Downloading verified copy of: ${doc.fileName}`)}
                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                Upload Vendor Compliance Document
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Vendor</label>
                <select
                  required
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendorName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {docTypesList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Document File Name / Title</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Master_Services_Agreement_2026.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Validity / Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Save & File Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-sm">
                  {viewingDoc.fileName}
                </h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
              <FileText className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
              <div>
                <div className="text-sm font-bold text-white">{viewingDoc.docType}</div>
                <div className="text-xs text-slate-400 mt-0.5">{viewingDoc.vendorName}</div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Statutory Compliance Verified</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDocumentsTab;
