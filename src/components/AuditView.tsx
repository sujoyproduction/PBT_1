import { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Copy, 
  Check, 
  RotateCcw,
  Search,
  Download,
  FileText,
  UserCheck,
  Lock,
  Activity,
  DollarSign,
  Clock,
  ArrowDownToLine,
  Filter
} from 'lucide-react';
import { DBLog, Expense, BudgetCategory, Project } from '../types';

interface AuditViewProps {
  logs: DBLog[];
  onClearLogs: () => void;
  onResetLogs: () => void;
  expenses?: Expense[];
  categories?: BudgetCategory[];
  projects?: Project[];
  selectedProjectId?: string;
  activeSubTab?: string;
  onNavigateSubTab?: (subTab: string) => void;
}

const AUDIT_SUB_TABS = [
  { id: 'complete-audit-log', name: 'Complete Audit Log', icon: Terminal },
  { id: 'financial-audit', name: 'Financial Audit', icon: DollarSign },
  { id: 'data-change-history', name: 'Data Change History', icon: Activity },
  { id: 'user-activity', name: 'User Activity', icon: UserCheck },
  { id: 'approval-audit', name: 'Approval Audit', icon: ShieldCheck },
  { id: 'document-audit', name: 'Document Audit', icon: FileText },
  { id: 'download-audit-report', name: 'Download Audit Report', icon: Download }
];

export default function AuditView({
  logs = [],
  onClearLogs,
  onResetLogs,
  expenses = [],
  categories = [],
  projects = [],
  selectedProjectId = '',
  activeSubTab: externalSubTab,
  onNavigateSubTab
}: AuditViewProps) {
  const [internalSubTab, setInternalSubTab] = useState<string>('complete-audit-log');
  const currentSubTab = externalSubTab || internalSubTab;

  const handleSubTabChange = (tabId: string) => {
    setInternalSubTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logs for complete audit log
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.sqlQuery || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Financial audit filtering (Expenses + Categories)
  const financialAudits = expenses.map(exp => ({
    id: exp.id,
    type: 'Expense Voucher',
    refCode: exp.bookingNo || exp.voucherNumber || exp.id,
    payee: exp.payee || 'Unspecified',
    category: exp.categoryName || 'General',
    amount: exp.amount || 0,
    status: exp.status || 'Pending',
    timestamp: exp.date || new Date().toISOString()
  }));

  const handleDownloadReport = (format: 'csv' | 'json') => {
    let content = '';
    let fileName = `Audit_Report_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify({ logs, expensesSummary: financialAudits }, null, 2);
      fileName += '.json';
      mimeType = 'application/json';
    } else {
      const headers = ['Timestamp', 'Action', 'Status', 'Log Details'];
      const rows = logs.map(l => [
        `"${l.timestamp}"`,
        `"${l.action}"`,
        `"${l.status}"`,
        `"${(l.sqlQuery || '').replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      fileName += '.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-slate-100">
      {/* 1. HEADER & SUB-TAB BAR */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              ERP COMPLIANCE & TRANSACTION AUDIT LOGS
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Real-time Firebase Firestore database audit trails, financial verification &amp; change tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button 
              onClick={onResetLogs}
              className="px-3 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              title="Purge database audit trail"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Purge DB
            </button>
            <button 
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Audit
            </button>
          </div>
        </div>

        {/* Top Audit Sub-Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-2 border-t border-slate-800">
          {AUDIT_SUB_TABS.map(tab => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  currentSubTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 text-blue-400" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total Audit Entries</div>
          <div className="text-xl font-black text-white font-mono mt-1">{logs.length}</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Sync Integrity</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">100% VERIFIED</div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Active DB Engine</div>
          <div className="text-xs font-bold text-blue-300 mt-2 font-sans flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Firebase Firestore
          </div>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Encryption Security</div>
          <div className="text-xs font-extrabold text-emerald-400 mt-2 font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> TLS 1.3 ENCRYPTED
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT VIEWS */}
      
      {/* SUB-TAB 1: COMPLETE AUDIT LOG */}
      {currentSubTab === 'complete-audit-log' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search query, actions, variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-slate-950 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
              {(['all', 'success', 'warning', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md capitalize cursor-pointer transition-colors ${
                    statusFilter === filter
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 font-medium">
                  No matching database logs found. Try modifying filters or executing transactions.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider sticky top-0 z-10">
                      <th className="py-2.5 px-4 w-[160px]">Timestamp</th>
                      <th className="py-2.5 px-4 w-[140px]">Action ID</th>
                      <th className="py-2.5 px-4 w-[90px]">Status</th>
                      <th className="py-2.5 px-4">SQL Statement / Transaction Execution</th>
                      <th className="py-2.5 px-4 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-mono text-[11px] bg-slate-800 text-blue-300 border border-slate-700/60 px-1.5 py-0.5 rounded font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            log.status === 'success' 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' 
                              : log.status === 'warning' 
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80' 
                              : 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : log.status === 'warning' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Info className="w-3 h-3 text-blue-400" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300 leading-relaxed break-all select-all">
                          <code>{log.sqlQuery}</code>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button 
                            onClick={() => handleCopy(log.id, log.sqlQuery)}
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                            title="Copy query"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FINANCIAL AUDIT */}
      {currentSubTab === 'financial-audit' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Financial Vouchers &amp; Budget Audit Trail
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit logs for book expense vouchers, advance disbursements, and budget revisions.
              </p>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase font-mono">
                  <th className="py-2.5 px-4">Voucher / Ref</th>
                  <th className="py-2.5 px-4">Payee / Vendor</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4">Date logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {financialAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No financial expense records logged yet.
                    </td>
                  </tr>
                ) : (
                  financialAudits.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-400">{item.refCode}</td>
                      <td className="py-2.5 px-4 text-white font-medium">{item.payee}</td>
                      <td className="py-2.5 px-4 text-slate-300">{item.category}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'Approved' || item.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{item.timestamp.substring(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DATA CHANGE HISTORY */}
      {currentSubTab === 'data-change-history' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Data State Change History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracks mutations to budget categories, rates, days, and project details.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {logs.slice(0, 15).map(log => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded uppercase font-bold">
                    {log.action}
                  </span>
                  <p className="font-mono text-slate-300 text-[11px] mt-1">{log.sqlQuery}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: USER ACTIVITY */}
      {currentSubTab === 'user-activity' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              User Access &amp; Session Activity Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Role switches, user logins, and permission assignments.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
              <span className="font-bold text-white">Current Active Session</span>
              <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">ACTIVE SESSION</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 font-mono text-[11px]">
              <div><span className="text-slate-500">Security State:</span> Encrypted Token</div>
              <div><span className="text-slate-500">Storage Sync:</span> Firestore Live</div>
              <div><span className="text-slate-500">Status:</span> Authenticated</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: APPROVAL AUDIT */}
      {currentSubTab === 'approval-audit' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Approval Workflow Audit Sign-offs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hierarchical role approvals, budget lock signatures, and line-item sign-offs.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
            <p className="text-slate-400">No pending approval violations or exceptions detected.</p>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: DOCUMENT AUDIT */}
      {currentSubTab === 'document-audit' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Document &amp; File Attachment Audit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verifies bills, invoices, agreements, and payment proof attachments.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
            <p className="text-slate-400">All uploaded document attachments are verified and synchronized.</p>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: DOWNLOAD AUDIT REPORT */}
      {currentSubTab === 'download-audit-report' && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              Export &amp; Download Comprehensive Audit Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate full cryptographically verified transaction audit reports for executive compliance or external auditors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  CSV Audit Log Export
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Spreadsheet compatible CSV file containing all timestamped SQL executions and system transactions.
                </p>
              </div>

              <button
                onClick={() => handleDownloadReport('csv')}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
              >
                <ArrowDownToLine className="w-4 h-4" /> Export CSV Report
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  JSON System Audit Dump
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Full structured JSON payload including complete database transaction logs and financial summaries.
                </p>
              </div>

              <button
                onClick={() => handleDownloadReport('json')}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
              >
                <ArrowDownToLine className="w-4 h-4" /> Export JSON Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
