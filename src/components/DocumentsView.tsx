import React, { useState, useEffect } from 'react';
import { FileText, Search, Upload, Folder, Download, Trash2, Eye, Share2, Plus, X } from 'lucide-react';
import { subscribeDocuments, saveDocument, deleteDocument } from '../services/firebaseService';

export interface ProjectDoc {
  id: string;
  docName: string;
  category: string;
  uploadedBy: string;
  fileSize: string;
  date: string;
}

const INITIAL_DOCS: ProjectDoc[] = [];

export default function DocumentsView() {
  const [docs, setDocs] = useState<ProjectDoc[]>(INITIAL_DOCS);

  useEffect(() => {
    const unsub = subscribeDocuments((data) => {
      setDocs(Array.isArray(data) ? data : []);
    });
    return () => unsub();
  }, []);

  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Modal form state
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState('Budget & Financials');
  const [uploadedBy, setUploadedBy] = useState('Sujay Kotal');

  const filteredDocs = docs.filter(d =>
    d.docName.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase()) ||
    d.uploadedBy.toLowerCase().includes(search.toLowerCase())
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    const newDoc: ProjectDoc = {
      id: `doc_${Date.now()}`,
      docName: docName.endsWith('.pdf') || docName.endsWith('.docx') ? docName : `${docName}.pdf`,
      category,
      uploadedBy,
      fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      date: new Date().toISOString().substring(0, 10)
    };

    setDocs([newDoc, ...docs]);
    await saveDocument(newDoc);
    setIsUploadOpen(false);
    setDocName('');
    alert(`Document "${newDoc.docName}" uploaded and saved to server archive!`);
  };

  const handleDeleteDoc = async (id: string) => {
    setDocs(docs.filter(d => d.id !== id));
    await deleteDocument(id);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100">
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            PROJECT DOCUMENTS ARCHIVE
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Centralized document vault for budget PDFs, vendor contracts, location agreements & legal filings.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-4 h-4" /> + Upload Document
        </button>
      </div>

      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document name, category or uploader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Document Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Uploaded By</th>
              <th className="py-2.5 px-3">File Size</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-medium">
            {filteredDocs.map(d => (
              <tr key={d.id} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  {d.docName}
                </td>
                <td className="py-2.5 px-3 text-slate-300 font-semibold">{d.category}</td>
                <td className="py-2.5 px-3 text-slate-400">{d.uploadedBy}</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">{d.fileSize}</td>
                <td className="py-2.5 px-3 text-slate-400">{d.date}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => alert(`Downloading ${d.docName}...`)} className="p-1 text-blue-400 hover:bg-slate-800 rounded-md cursor-pointer" title="Download"><Download className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteDoc(d.id)} className="p-1 text-rose-400 hover:bg-slate-800 rounded-md cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Upload Project Document</h3>
              <button onClick={() => setIsUploadOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Document Name *</label>
                <input type="text" placeholder="e.g. Production_Contract_Vendor.pdf" value={docName} onChange={e => setDocName(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Document Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="Budget & Financials">Budget & Financials</option>
                  <option value="Contracts & Legal">Contracts & Legal</option>
                  <option value="Vendor Agreements">Vendor Agreements</option>
                  <option value="Location Approvals">Location Approvals</option>
                  <option value="Tax & GST Filings">Tax & GST Filings</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Uploaded By</label>
                <input type="text" value={uploadedBy} onChange={e => setUploadedBy(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500" required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold cursor-pointer">Upload & Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

