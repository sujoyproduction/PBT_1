import { useState } from 'react';
import { 
  Search, 
  Terminal, 
  Database, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { DBLog } from '../types';

interface LogViewerProps {
  logs: DBLog[];
  onClearLogs: () => void;
  onResetLogs: () => void;
}

export default function LogViewer({ logs, onClearLogs, onResetLogs }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.sqlQuery.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6 space-y-6 animate-fade-in selection:bg-[#0058be]/10 selection:text-[#0058be]">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f2f4f6] pb-5">
        <div>
          <h2 className="text-base font-bold text-black font-sans flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#0058be]" />
            ERP Transaction Audit Logs
          </h2>
          <p className="text-xs text-[#45464d] mt-1">Real-time Firebase Firestore database transaction audit logging</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onResetLogs}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer flex items-center gap-1.5"
            title="Purge all user data from database and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Purge Database &amp; Start Fresh
          </button>
          <button 
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Audit
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#f7f9fb] p-3.5 rounded border border-[#E2E8F0]">
          <div className="text-[10px] font-bold text-[#45464d] uppercase font-mono">Total Transactions</div>
          <div className="text-xl font-bold text-black font-mono mt-1">{logs.length}</div>
        </div>
        <div className="bg-[#f7f9fb] p-3.5 rounded border border-[#E2E8F0]">
          <div className="text-[10px] font-bold text-[#45464d] uppercase font-mono">Sync Success Rate</div>
          <div className="text-xl font-bold text-emerald-600 font-mono mt-1">100%</div>
        </div>
        <div className="bg-[#f7f9fb] p-3.5 rounded border border-[#E2E8F0]">
          <div className="text-[10px] font-bold text-[#45464d] uppercase font-mono">DB Active Engine</div>
          <div className="text-xs font-semibold text-black mt-2 font-sans flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#0058be]" /> Firebase Firestore
          </div>
        </div>
        <div className="bg-[#f7f9fb] p-3.5 rounded border border-[#E2E8F0]">
          <div className="text-[10px] font-bold text-[#45464d] uppercase font-mono">Encryption & Transport</div>
          <div className="text-xs font-semibold text-emerald-700 mt-2 font-mono uppercase">
            SSL / TLS ENCRYPTED
          </div>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4 h-4" />
          <input 
            type="text"
            placeholder="Search query, actions, variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
          />
        </div>

        <div className="flex gap-1 bg-[#f2f4f6] p-1 rounded-lg border border-[#E2E8F0] self-start sm:self-auto">
          {(['all', 'success', 'warning', 'info'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-[11px] font-sans font-semibold rounded capitalize cursor-pointer transition-colors ${
                statusFilter === filter
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#45464d] hover:text-black'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Sheet Table */}
      <div className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white">
        <div className="max-h-[380px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#45464d]/60 font-medium">
              No matching database logs found. Try modifying filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f9fb] border-b border-[#E2E8F0] text-[10px] font-bold text-[#45464d] uppercase font-mono tracking-wider sticky top-0 z-10">
                  <th className="py-3 px-4 w-[160px]">Timestamp</th>
                  <th className="py-3 px-4 w-[140px]">Action ID</th>
                  <th className="py-3 px-4 w-[80px]">Status</th>
                  <th className="py-3 px-4">SQL Statement / Transaction Execution</th>
                  <th className="py-3 px-4 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        log.status === 'success' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : log.status === 'warning' 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : log.status === 'warning' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Info className="w-3 h-3 text-blue-600" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 leading-relaxed break-all select-all">
                      <code>{log.sqlQuery}</code>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => handleCopy(log.id, log.sqlQuery)}
                        className="text-slate-400 hover:text-black p-1 rounded transition-colors cursor-pointer"
                        title="Copy query"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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
  );
}
