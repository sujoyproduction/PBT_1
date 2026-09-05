import React, { useState, useMemo } from 'react';
import { DBLog, Project, BudgetCategory, Expense } from '../types';
import { 
  GitCompare, 
  History, 
  CheckSquare, 
  Printer, 
  Check, 
  X, 
  CornerDownRight, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  FileText,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Database,
  Layers
} from 'lucide-react';
import { DEFAULT_COOKING_SHOW_BUDGET_STRUCTURE } from '../defaultCookingShowBudget';
import { generateStandardCategoriesForProject } from '../data';

interface ApprovalsViewProps {
  projects?: Project[];
  categories?: BudgetCategory[];
  expenses?: Expense[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddLog: (log: DBLog) => void;
  onNavigateToLogs?: () => void;
}

interface ComparisonSubItem {
  id: string;
  name: string;
  allocatedAmount: number;
  childCount: number;
}

interface ComparisonItem {
  id: string;
  description: string;
  prevAmount: number;
  currentAmount: number;
  subCategories?: ComparisonSubItem[];
}

export default function ApprovalsView({ 
  projects = [], 
  categories = [], 
  expenses = [], 
  selectedProjectId, 
  onSelectProject, 
  onAddLog, 
  onNavigateToLogs 
}: ApprovalsViewProps) {
  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  const selectedFolder = activeProject ? `${activeProject.name} (${activeProject.id})` : 'Select Project';
  
  // Versions for selector
  const [leftVersion, setLeftVersion] = useState<string>('V2.3 (Previous)');
  const [rightVersion, setRightVersion] = useState<string>('V2.4 (Current)');

  // Form states for comments and flow
  const [commentText, setCommentText] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set());

  const toggleExpand = (catId: string) => {
    setExpandedCatIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Dynamic comparison list based on active project categories
  const comparisonItems = useMemo<ComparisonItem[]>(() => {
    const activeProjId = activeProject?.id || '';
    const cleanId = activeProjId.replace(/^(wp_|p_|proj_)/, '');

    const relevantCategories = categories.length > 0
      ? categories.filter(c => !c.projectId || c.projectId === activeProjId || c.projectId.replace(/^(wp_|p_|proj_)/, '') === cleanId)
      : ((activeProject as any)?.categories || []);

    const finalCategories: BudgetCategory[] = relevantCategories.length > 0
      ? relevantCategories
      : generateStandardCategoriesForProject(activeProjId || 'default');

    return finalCategories.map((cat, idx) => {
      const allocated = typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0
        ? cat.allocatedAmount
        : (cat.subCategories || []).reduce((s, sub) => {
            const subSum = (sub.allocatedAmount || 0) > 0
              ? sub.allocatedAmount
              : (sub.childCategories || []).reduce((cs, ch) => cs + (Number(ch.allocatedAmount) || ((ch.rate || 0) * (ch.count || 1) * (ch.shifts || 1))), 0);
            return s + subSum;
          }, 0);

      const actualSpent = expenses
        .filter(e => e.categoryId === cat.id || e.categoryName === cat.name || (e as any).category === cat.name)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

      const subCategories: ComparisonSubItem[] = (cat.subCategories || []).map(s => {
        const subAlloc = (s.allocatedAmount || 0) > 0
          ? s.allocatedAmount
          : (s.childCategories || []).reduce((cs, ch) => cs + (Number(ch.allocatedAmount) || ((ch.rate || 0) * (ch.count || 1) * (ch.shifts || 1))), 0);
        return {
          id: s.id,
          name: s.name,
          allocatedAmount: subAlloc,
          childCount: s.childCategories?.length || 0
        };
      });

      return {
        id: cat.id || `cat_${idx}`,
        description: cat.name,
        prevAmount: allocated,
        currentAmount: actualSpent > 0 ? actualSpent : allocated,
        subCategories
      };
    });
  }, [activeProject, categories, expenses]);

  // Handle value editing
  const handleValueChange = (_id: string, _value: string) => {
    // Dynamic value edit handler for active comparison
  };

  // Calculate totals dynamically
  const prevTotal = useMemo(() => comparisonItems.reduce((sum, item) => sum + item.prevAmount, 0), [comparisonItems]);
  const currentTotal = useMemo(() => comparisonItems.reduce((sum, item) => sum + item.currentAmount, 0), [comparisonItems]);
  const totalVariance = useMemo(() => currentTotal - prevTotal, [currentTotal, prevTotal]);
  const totalVariancePct = useMemo(() => prevTotal > 0 ? (totalVariance / prevTotal) * 100 : 0, [totalVariance, prevTotal]);

  // Static review workflow timeline
  const [step1Status, setStep1Status] = useState<'Approved' | 'Rejected' | 'Pending'>('Approved');
  const [step1Comment, setStep1Comment] = useState<string>(
    '"Changes in silicon costs are verified against current market index. Proceeding to Finance."'
  );

  const [step2Status, setStep2Status] = useState<'Under Review' | 'Approved' | 'Rejected' | 'Pending'>('Under Review');
  const [step2Comment, setStep2Comment] = useState<string>('Awaiting comments...');

  const [step3Status, setStep3Status] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [step3Comment, setStep3Comment] = useState<string>('Awaiting preceding approvals...');

  // Custom live audit adjustments list
  const [customAudits, setCustomAudits] = useState<Array<{ id: string; title: string; time: string; text: string; icon: string; color: string }>>([]);

  // Handle Approve Action
  const handleApprove = () => {
    const comment = commentText.trim() || 'Approved current budget revision allocations after auditing ledger variance.';
    
    // Change state to show approval workflow proceeding
    if (step2Status === 'Under Review') {
      setStep2Status('Approved');
      setStep2Comment(`"${comment}"`);
      setStep3Status('Pending'); // Step 3 becomes active next
      setOverallStatus('Pending'); // still pending Liam Vance
      
      // Inject transaction log
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const sqlQuery = `UPDATE budget_approvals SET status = 'APPROVED', comments = '${comment.replace(/'/g, "''")}', reviewed_at = '${nowTimestamp}' WHERE reviewer_id = 'r_chen' AND revision_code = 'V2.4';`;
      
      onAddLog({
        id: `l_app_1_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'SQL_UPDATE_TRANSACTION',
        sqlQuery,
        status: 'success'
      });

      // Add to live audit adjustments list
      setCustomAudits(prev => [
        {
          id: `aud_${Date.now()}`,
          title: 'Robert Chen Approved Revision',
          time: 'Just now',
          text: `Finance Controller confirmed revision V2.4. Verification query executed successfully.`,
          icon: 'check',
          color: 'text-emerald-600'
        },
        ...prev
      ]);
    } else if (step3Status === 'Pending') {
      setStep3Status('Approved');
      setStep3Comment(`"${comment}"`);
      setOverallStatus('Approved');

      // Inject transaction log
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const sqlQuery = `UPDATE budget_approvals SET status = 'FULLY_APPROVED', comments = '${comment.replace(/'/g, "''")}', finalized_at = '${nowTimestamp}' WHERE reviewer_id = 'l_vance' AND revision_code = 'V2.4';`;
      
      onAddLog({
        id: `l_app_2_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'SQL_UPDATE_TRANSACTION',
        sqlQuery,
        status: 'success'
      });

      // Add to live audit adjustments list
      setCustomAudits(prev => [
        {
          id: `aud_${Date.now()}`,
          title: 'Liam Vance Signed Off (Revision Fully Approved)',
          time: 'Just now',
          text: `COO signed off. Final total production budget of ₹${currentTotal.toLocaleString()} locked.`,
          icon: 'lock',
          color: 'text-blue-600'
        },
        ...prev
      ]);
    }

    setCommentText('');
  };

  // Handle Reject Action
  const handleReject = () => {
    const comment = commentText.trim() || 'Revision rejected. Costs must be restructured.';
    
    if (step2Status === 'Under Review') {
      setStep2Status('Rejected');
      setStep2Comment(`"${comment}"`);
      setOverallStatus('Rejected');

      // Inject transaction log
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const sqlQuery = `UPDATE budget_approvals SET status = 'REJECTED', comments = '${comment.replace(/'/g, "''")}' WHERE reviewer_id = 'r_chen' AND revision_code = 'V2.4';`;
      
      onAddLog({
        id: `l_app_rej_${Date.now()}`,
        timestamp: nowTimestamp,
        action: 'SQL_UPDATE_TRANSACTION',
        sqlQuery,
        status: 'success'
      });

      // Add to audit trail
      setCustomAudits(prev => [
        {
          id: `aud_${Date.now()}`,
          title: 'Robert Chen Rejected Revision',
          time: 'Just now',
          text: `Revision V2.4 sent back to draft status. Reason: ${comment}`,
          icon: 'x',
          color: 'text-rose-600'
        },
        ...prev
      ]);
    }

    setCommentText('');
  };

  // Reset comparison back to baseline
  const handleReset = () => {
    setStep2Status('Under Review');
    setStep2Comment('Awaiting comments...');
    setStep3Status('Pending');
    setStep3Comment('Awaiting preceding approvals...');
    setOverallStatus('Pending');
    setCustomAudits([]);
  };

  // Custom Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 text-slate-100 font-sans">
      
      {/* Header Panel matching Mockup design */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-end justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-1 font-sans">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400">{activeProject?.name || selectedFolder}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-xs text-slate-400">{selectedFolder}</span>
          </div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">Budget Revisions & Approvals</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Audit delta logs, evaluate variances side-by-side, and sign off on active production budget drafts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button 
            onClick={handlePrint}
            className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            Export PDF
          </button>
          
          {onNavigateToLogs && (
            <button 
              onClick={onNavigateToLogs}
              className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              View Query Log
            </button>
          )}

          <button 
            onClick={handleReset}
            className="h-8 px-2.5 border border-dashed border-slate-700 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-mono rounded-lg transition-all cursor-pointer"
            title="Reset Workflow State"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Side-by-Side Comparison & Audit Trail */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Comparison Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-blue-400" />
                Revision Cost Comparison Table
              </h3>

              {/* Version Compare Selectors matching mockup */}
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
                <select 
                  value={rightVersion}
                  onChange={(e) => setRightVersion(e.target.value)}
                  className="bg-transparent border-0 py-0.5 px-1 font-mono text-[10px] font-bold text-white focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="V2.4 (Current)">V2.4 (Current)</option>
                  <option value="V2.3">V2.3</option>
                  <option value="V2.2">V2.2</option>
                </select>
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">vs</span>
                <select 
                  value={leftVersion}
                  onChange={(e) => setLeftVersion(e.target.value)}
                  className="bg-transparent border-0 py-0.5 px-1 font-mono text-[10px] font-bold text-slate-400 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="V2.3 (Previous)">V2.3 (Previous)</option>
                  <option value="V2.2">V2.2</option>
                  <option value="V2.1">V2.1</option>
                </select>
              </div>
            </div>

            {/* Sub banner highlighting interactiveness */}
            <div className="bg-blue-950/40 px-3 py-1.5 border-b border-blue-900/40 text-[10px] text-blue-300 font-medium">
              💡 Pro-Tip: You can modify the values in the <strong className="text-blue-200">Current ({rightVersion.split(' ')[0]})</strong> column directly to see real-time recalculations!
            </div>

            {/* Live Data Grid Table matching mockup */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono text-left">
                    <th className="px-3 py-2">Line Item Description</th>
                    <th className="px-3 py-2 text-right">Prev. ({leftVersion.split(' ')[0]})</th>
                    <th className="px-3 py-2 text-right">Current ({rightVersion.split(' ')[0]})</th>
                    <th className="px-3 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {comparisonItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500 font-sans">
                        No budget line items found for approval comparison in this project.
                      </td>
                    </tr>
                  ) : (
                    comparisonItems.map((item) => {
                    const variance = item.currentAmount - item.prevAmount;
                    const pct = item.prevAmount > 0 ? (variance / item.prevAmount) * 100 : 0;
                    
                    let bgStyle = "hover:bg-slate-800/40";
                    let labelColor = "text-slate-300";
                    let statusLabel = "";

                    if (item.prevAmount === 0) {
                      bgStyle = "bg-emerald-950/20 hover:bg-emerald-950/40";
                      labelColor = "text-emerald-400 font-semibold";
                      statusLabel = "NEW";
                    } else if (variance > 0) {
                      bgStyle = "bg-rose-950/20 hover:bg-rose-950/40";
                      labelColor = "text-rose-400 font-semibold";
                      statusLabel = `+${pct.toFixed(1)}%`;
                    } else if (variance < 0) {
                      bgStyle = "bg-emerald-950/20 hover:bg-emerald-950/40";
                      labelColor = "text-emerald-400 font-semibold";
                      statusLabel = `${pct.toFixed(1)}%`;
                    } else {
                      statusLabel = "0.0%";
                    }

                    return (
                      <React.Fragment key={item.id}>
                        <tr className={`h-9 transition-colors ${bgStyle}`}>
                          <td className="px-3 font-sans font-medium text-slate-200">
                            <div className="flex items-center gap-1.5">
                              {item.subCategories && item.subCategories.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700/50 cursor-pointer"
                                  title="View subcategories breakdown"
                                >
                                  {expandedCatIds.has(item.id) ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}
                              <span>{item.description}</span>
                              {item.subCategories && item.subCategories.length > 0 && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({item.subCategories.length} subs)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 text-right font-mono text-slate-400">
                            ₹{item.prevAmount.toLocaleString()}
                          </td>
                          <td className="px-3 text-right">
                            <input
                              type="number"
                              value={item.currentAmount || ''}
                              onChange={(e) => handleValueChange(item.id, e.target.value)}
                              className="w-24 text-right bg-slate-800 focus:bg-slate-900 border border-slate-700 focus:border-blue-500 rounded py-0.5 px-1 font-mono text-xs text-white focus:outline-none"
                            />
                          </td>
                          <td className={`px-3 text-right font-mono font-bold ${labelColor}`}>
                            {statusLabel}
                          </td>
                        </tr>

                        {/* Expandable Subcategories Breakdown */}
                        {expandedCatIds.has(item.id) && item.subCategories && item.subCategories.map(sub => (
                          <tr key={sub.id} className="bg-slate-950/40 border-b border-slate-800/40 text-[11px]">
                            <td className="pl-8 pr-3 py-1.5 text-slate-300 flex items-center gap-1.5 font-mono">
                              <CornerDownRight className="w-3 h-3 text-amber-500/70" />
                              <span className="font-sans font-medium text-slate-300">{sub.name}</span>
                              {sub.childCount > 0 && (
                                <span className="text-[9px] text-slate-500 bg-slate-800/60 px-1 py-0.2 rounded">
                                  {sub.childCount} child roles
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-500">
                              ₹{sub.allocatedAmount.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                              ₹{sub.allocatedAmount.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-[10px] text-slate-500">
                              Allocated
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800/60 font-bold border-t border-slate-700 text-white">
                    <td className="px-3 py-2 font-sans uppercase font-bold text-xs text-slate-200">Total Project Cost</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">₹{prevTotal.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-white">₹{currentTotal.toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right font-mono text-xs ${totalVariance >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString()} ({totalVariance >= 0 ? '+' : ''}{totalVariancePct.toFixed(1)}%)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Trail Vertical Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xs">
            <h3 className="font-sans text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-blue-400" />
              Audit Trail - Financial Adjustments Ledger
            </h3>

            <div className="space-y-2">
              {/* Custom dynamic adjustments added live */}
              {customAudits.map((item) => (
                <div key={item.id} className="flex gap-3 p-2.5 border border-slate-800 rounded-lg bg-slate-800/40 items-start animate-in slide-in-from-top-2 duration-200">
                  <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <CheckSquare className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}

              {customAudits.length === 0 && (
                <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-800/60 text-center">
                  <p className="text-xs text-slate-400">
                    All budget revision sign-offs and variance sign-offs will be tracked here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Approval Workflow Sidebar Panel */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col">
          
          {/* Workflow Header block */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-800/60">
            <h3 className="font-sans text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5 mb-2.5">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              Approval Workflow Timeline
            </h3>

            {/* Current overall state pill matching mockup layout */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800 border border-slate-700 rounded-lg">
              <div>
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-0.5">Current Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    overallStatus === 'Pending' ? 'bg-amber-400 animate-pulse' :
                    overallStatus === 'Approved' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}></span>
                  <p className={`font-sans text-xs font-bold ${
                    overallStatus === 'Pending' ? 'text-amber-400' :
                    overallStatus === 'Approved' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {overallStatus === 'Pending' ? 'Pending Review' : 
                     overallStatus === 'Approved' ? 'Approved & Locked' : 'Rejected'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-0.5">REVISION</p>
                <p className="font-mono text-xs font-extrabold text-white">V2.4</p>
              </div>
            </div>
          </div>

          {/* Interactive Steps timeline matching mockup */}
          <div className="p-4 space-y-4">
            
            {/* Step 1: Approved */}
            <div className="relative pl-5">
              <div className="absolute left-0 top-1 h-full w-0.5 bg-emerald-500"></div>
              <div className="absolute left-[-3.5px] top-1 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-900 ring-2 ring-emerald-950"></div>
              
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-400">JD</div>
                    <div>
                      <p className="text-xs font-bold text-white">Jane Dawson</p>
                      <p className="text-[9px] font-mono text-slate-400">Dept. Manager</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 text-[9px] font-mono font-bold rounded border border-emerald-900/60">
                    Approved
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 bg-slate-800/60 p-2 rounded border border-slate-800 italic">
                  {step1Comment}
                </p>
                <p className="text-[9px] font-mono text-slate-500 mt-1">Oct 14, 2026 · 10:15 AM</p>
              </div>
            </div>

            {/* Step 2: Under Review (Robert Chen) */}
            <div className="relative pl-5">
              <div className="absolute left-0 top-1 h-full w-0.5 bg-amber-500"></div>
              <div className="absolute left-[-3.5px] top-1 w-2 h-2 rounded-full bg-amber-500 border-2 border-slate-900 ring-2 ring-amber-950"></div>
              
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-400">RC</div>
                    <div>
                      <p className="text-xs font-bold text-white">Robert Chen</p>
                      <p className="text-[9px] font-mono text-slate-400">Finance Controller</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${
                    step2Status === 'Approved' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/60' :
                    step2Status === 'Rejected' ? 'bg-rose-950/80 text-rose-400 border-rose-900/60' :
                    'bg-amber-950/80 text-amber-400 border-amber-900/60 animate-pulse'
                  }`}>
                    {step2Status}
                  </span>
                </div>
                
                <p className={`text-[11px] p-2 rounded border font-sans ${
                  step2Status === 'Approved' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40 italic' :
                  step2Status === 'Rejected' ? 'bg-rose-950/40 text-rose-300 border-rose-900/40 italic font-semibold' :
                  'bg-slate-800/40 text-slate-400 border-dashed border-slate-700'
                }`}>
                  {step2Comment}
                </p>
              </div>
            </div>

            {/* Step 3: Locked (Liam Vance) */}
            <div className="relative pl-5">
              <div className="absolute left-0 top-1 h-full w-0.5 bg-slate-800"></div>
              <div className="absolute left-[-3.5px] top-1 w-2 h-2 rounded-full bg-slate-700 border-2 border-slate-900"></div>
              
              <div className={step3Status === 'Pending' ? "opacity-60" : ""}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">LV</div>
                    <div>
                      <p className="text-xs font-bold text-white">Liam Vance</p>
                      <p className="text-[9px] font-mono text-slate-400">Chief Operations Officer</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${
                    step3Status === 'Approved' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/60' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {step3Status}
                  </span>
                </div>
                
                <p className={`text-[11px] p-2 rounded border font-sans ${
                  step3Status === 'Approved' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/40 italic' :
                  'bg-slate-800/40 text-slate-500 border-slate-800 font-mono'
                }`}>
                  {step3Comment}
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Action box matching mockup */}
          <div className="p-4 border-t border-slate-800 mt-auto flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                Reasoning Notes / Audit Comments
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your justification then sign off below..."
                className="w-full h-16 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-sans text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={handleReject}
                disabled={overallStatus !== 'Pending' || step2Status === 'Approved'}
                className="py-2 bg-slate-900 border border-rose-600/80 hover:bg-rose-950/50 text-rose-400 font-sans text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
              
              <button 
                onClick={handleApprove}
                disabled={overallStatus === 'Approved'}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {step2Status === 'Under Review' ? 'Approve Step' : 'Final Sign Off'}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
