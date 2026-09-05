import { useState, useEffect, useMemo, FormEvent, Fragment } from 'react';
import { Project, BudgetCategory, Expense } from '../types';
import { generateStandardCategoriesForProject, sortCategoriesByStandardStructure, isCategoryStructureMismatched } from '../data';
import BudgetApprovalWidget, { BudgetVersionRecord } from './BudgetApprovalWidget';
import BudgetVsActualChart from './BudgetVsActualChart';
import { exportProductionWorkbookXlsx, exportCsvFile } from '../services/exportEngine';
import ExportEngineModal from './ExportEngineModal';
import { 
  Plus, 
  Search, 
  History, 
  Download, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Filter, 
  SlidersHorizontal, 
  ChevronUp, 
  FileSpreadsheet, 
  ChevronsUpDown, 
  CornerDownRight, 
  AlertCircle, 
  HelpCircle, 
  Users, 
  Video, 
  Award, 
  Wallet, 
  Settings, 
  Edit3, 
  Layers, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Clock, 
  PieChart, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  LayoutDashboard, 
  CheckCircle2, 
  Lock, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { saveCategoriesBatch } from '../services/firebaseService';

interface LedgerViewProps {
  projects: Project[];
  categories: BudgetCategory[];
  expenses: Expense[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onNavigateToCategorySetup?: () => void;
  onUpdateCategories?: (cats: BudgetCategory[]) => void;
  currentVersion?: BudgetVersionRecord;
  lastApprovedVersion?: BudgetVersionRecord;
  activeRoleName?: string;
  onSendApproval?: (targetRole?: string) => void;
  onApproveRole?: (targetRole: string) => void;
  onSendAllApprovals?: () => void;
  activeSubTab?: string;
  onNavigateSubTab?: (subTab: string) => void;
}

const BUDGET_SUB_TABS = [
  { id: 'ledger', name: 'Budget Dashboard', icon: LayoutDashboard },
  { id: 'hierarchy', name: 'Budget Hierarchy', icon: Layers },
  { id: 'versions', name: 'Budget Versions', icon: History },
  { id: 'dept-budget', name: 'Department Budget', icon: Building2 },
  { id: 'approved-budget', name: 'Approved Budget', icon: CheckCircle2 },
  { id: 'committed-cost', name: 'Committed Cost', icon: Lock },
  { id: 'budget-vs-actual', name: 'Budget vs Actual', icon: BarChart3 },
  { id: 'final-cost-report', name: 'Final Cost Report', icon: Award }
];

export default function LedgerView({ 
  projects, 
  categories, 
  expenses, 
  selectedProjectId: externalProjectId,
  onSelectProject,
  onAddExpense,
  onNavigateToCategorySetup,
  currentVersion,
  lastApprovedVersion,
  activeRoleName = 'Production Manager',
  onSendApproval,
  onApproveRole,
  onSendAllApprovals,
  onUpdateCategories,
  activeSubTab: externalSubTab,
  onNavigateSubTab
}: LedgerViewProps) {
  const isTabValid = (tab?: string) => Boolean(tab && BUDGET_SUB_TABS.some(t => t.id === tab));
  const [internalSubTab, setInternalSubTab] = useState<string>(() => {
    if (isTabValid(externalSubTab)) return externalSubTab!;
    return 'ledger';
  });

  useEffect(() => {
    if (isTabValid(externalSubTab)) {
      setInternalSubTab(externalSubTab!);
    }
  }, [externalSubTab]);

  const currentSubTab = internalSubTab;

  const handleSubTabChange = (tabId: string) => {
    setInternalSubTab(tabId);
    if (onNavigateSubTab) {
      onNavigateSubTab(tabId);
    }
  };
  const [internalProjectId, setInternalProjectId] = useState<string>('');

  const selectedProjectId = externalProjectId || internalProjectId || projects[0]?.id || '';

  const handleSelectProject = (id: string) => {
    setInternalProjectId(id);
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  // Active sub-navigation tabs (Mockup)
  const [activeSubTab, setActiveSubTab] = useState<'drafts' | 'revisions' | 'approved'>('approved');
  const [activeVersion, setActiveVersion] = useState<string>('v1.2 Draft');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  
  // Search and Expand states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Create New Line Item Form State
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formSubCategoryId, setFormSubCategoryId] = useState<string>('');
  const [formChildCategoryId, setFormChildCategoryId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formQty, setFormQty] = useState<number>(1);
  const [formUnit, setFormUnit] = useState<string>('Flat');
  const [formUnitCost, setFormUnitCost] = useState<string>('');
  const [formPayee, setFormPayee] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Pending' | 'Paid' | 'Disputed'>('Paid');
  const [formError, setFormError] = useState<string | null>(null);

  // Notification status
  const [showFlowBanner, setShowFlowBanner] = useState<boolean>(false);
  const [lastLoggedExpense, setLastLoggedExpense] = useState<any>(null);

  // Get active project info
  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  // Set form category id automatically when project changes or form opens
  const projectCategories = useMemo(() => {
    const catMap = new Map<string, BudgetCategory>();
    const projId = selectedProjectId || activeProject?.id;
    categories.forEach(c => {
      const isMatch = c.projectId && projId && (
        c.projectId === projId ||
        c.projectId.replace(/^wp_/, '') === projId.replace(/^wp_/, '')
      );
      if (isMatch && c.id && !catMap.has(c.id)) {
        catMap.set(c.id, c);
      }
    });
    let cats = Array.from(catMap.values());
    const pType = activeProject?.type || activeProject?.projectType;
    const isMismatched = isCategoryStructureMismatched(cats, pType);

    if ((cats.length === 0 || isMismatched) && projId) {
      cats = generateStandardCategoriesForProject(projId, pType);
    } else {
      cats = sortCategoriesByStandardStructure(cats, pType);
    }
    return cats;
  }, [selectedProjectId, categories, activeProject]);

  useEffect(() => {
    if (projectCategories.length > 0 && (!formCategoryId || !projectCategories.some(c => c.id === formCategoryId))) {
      setFormCategoryId(projectCategories[0].id);
    }
  }, [projectCategories, formCategoryId]);

  const [isSyncingHierarchy, setIsSyncingHierarchy] = useState(false);
  const [hierarchySuccessMsg, setHierarchySuccessMsg] = useState<string | null>(null);

  const handleSync3TierHierarchy = async () => {
    const projId = selectedProjectId || activeProject?.id;
    if (!projId) return;
    setIsSyncingHierarchy(true);
    const isCooking = ((activeProject?.type || activeProject?.projectType || activeProject?.name || '')).toLowerCase().includes('cook');
    const standardCats = generateStandardCategoriesForProject(projId, isCooking ? 'Cooking Show' : (activeProject?.type || activeProject?.projectType));

    try {
      await saveCategoriesBatch(standardCats);
      if (onUpdateCategories) {
        onUpdateCategories(standardCats);
      }
      handleExpandAll();
      setHierarchySuccessMsg(`3-Tier Hierarchy synced successfully (${standardCats.length} Categories, Sub-Categories & Child Items)!`);
      setTimeout(() => setHierarchySuccessMsg(null), 4500);
    } catch (e) {
      console.error('Error syncing 3-tier hierarchy:', e);
    } finally {
      setIsSyncingHierarchy(false);
    }
  };

  // Available Sub-Categories for selected Category in form
  const availableFormSubCategories = useMemo(() => {
    const cat = projectCategories.find(c => c.id === formCategoryId);
    return cat?.subCategories || [];
  }, [projectCategories, formCategoryId]);

  // Available Child-Categories for selected Sub-Category in form
  const availableFormChildCategories = useMemo(() => {
    const sub = availableFormSubCategories.find(s => s.id === formSubCategoryId);
    return sub?.childCategories || [];
  }, [availableFormSubCategories, formSubCategoryId]);

  // Helpers to calculate allocated budget for dropdown tags and options
  const getChildBudgetVal = (child: any): number => {
    if (!child) return 0;
    if (typeof child.allocatedAmount === 'number' && child.allocatedAmount > 0) return child.allocatedAmount;
    return ((child.count || 0) * (child.rate || 0) * (child.shifts || 1)) || 0;
  };

  const getSubBudgetVal = (sub: any): number => {
    if (!sub) return 0;
    if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) return sub.allocatedAmount;
    return (sub.childCategories || []).reduce((acc: number, ch: any) => acc + getChildBudgetVal(ch), 0);
  };

  const getCatBudgetVal = (cat: any): number => {
    if (!cat) return 0;
    if (typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0) return cat.allocatedAmount;
    return (cat.subCategories || []).reduce((acc: number, sub: any) => acc + getSubBudgetVal(sub), 0);
  };

  // Expand / Collapse node helper
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const isNodeExpanded = (nodeId: string) => {
    if (searchTerm.trim()) return true;
    return !!expandedNodes[nodeId];
  };

  // Expand / Collapse all handlers
  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    projectCategories.forEach(cat => {
      next[cat.id] = true;
      (cat.subCategories || []).forEach(sub => {
        next[sub.id] = true;
        (sub.childCategories || []).forEach(child => {
          next[child.id] = true;
        });
      });
    });
    setExpandedNodes(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    projectCategories.forEach(cat => {
      next[cat.id] = false;
      (cat.subCategories || []).forEach(sub => {
        next[sub.id] = false;
        (sub.childCategories || []).forEach(child => {
          next[child.id] = false;
        });
      });
    });
    setExpandedNodes(next);
  };

  // Filtered and grouped expenses for selected project
  const projectExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.projectId === selectedProjectId || 
      e.projectId === activeProject?.id ||
      (e.projectId && activeProject?.id && e.projectId.replace(/^wp_/, '') === activeProject.id.replace(/^wp_/, ''))
    );
  }, [expenses, selectedProjectId, activeProject]);

  // Filtered categories based on search term
  const searchedExpenses = useMemo(() => {
    return projectExpenses.filter(e => {
      const titleMatch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const notesMatch = e.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const payeeMatch = e.payee.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = e.code?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      return titleMatch || notesMatch || payeeMatch || codeMatch;
    });
  }, [projectExpenses, searchTerm]);

  // Calculate project metrics
  const totalProjectBudget = useMemo(() => {
    if (projectCategories && projectCategories.length > 0) {
      return projectCategories.reduce((sum, cat) => sum + (Number(cat.allocatedAmount) || 0), 0);
    }
    return activeProject?.totalBudget || 0;
  }, [activeProject, projectCategories]);

  const totalCalculatedAllocated = useMemo(() => {
    return projectCategories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  }, [projectCategories]);

  const totalCalculatedSpent = useMemo(() => {
    return projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [projectExpenses]);

  // Variance formula: Budget allocation variance
  const varianceAmount = useMemo(() => {
    return totalProjectBudget - totalCalculatedSpent;
  }, [totalProjectBudget, totalCalculatedSpent]);

  // Submit new line item (expense)
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Line item description is required.');
      return;
    }

    const unitCostNum = parseFloat(formUnitCost);
    if (isNaN(unitCostNum) || unitCostNum < 0) {
      setFormError('Please enter a valid unit cost.');
      return;
    }

    if (!formCategoryId) {
      setFormError('Please select a budget category.');
      return;
    }

    const calculatedAmount = formQty * unitCostNum;
    const category = categories.find(c => c.id === formCategoryId);
    const catCode = category?.code || '500';

    // Find next code for sub-item
    const siblings = expenses.filter(exp => exp.categoryId === formCategoryId);
    const nextSubCode = siblings.length + 1;
    const itemCode = `${catCode.replace(/\D/g, '')}${nextSubCode}`;

    const newExpense = {
      projectId: selectedProjectId,
      categoryId: formCategoryId,
      subCategoryId: formSubCategoryId || undefined,
      childCategoryId: formChildCategoryId || undefined,
      title: formTitle.trim(),
      amount: calculatedAmount,
      qty: formQty,
      unit: formUnit,
      unitCost: unitCostNum,
      date: new Date().toISOString().split('T')[0],
      payee: formPayee.trim() || 'TBD',
      notes: formNotes.trim() || undefined,
      status: formStatus,
      code: itemCode
    };

    onAddExpense(newExpense);

    // Dispatch event for real-time tracking
    window.dispatchEvent(new CustomEvent('erp-transaction-logged', {
      detail: {
        title: newExpense.title,
        amount: newExpense.amount,
        timestamp: Date.now()
      }
    }));

    setLastLoggedExpense(newExpense);
    setShowFlowBanner(true);

    // Reset Form
    setFormTitle('');
    setFormQty(1);
    setFormUnit('Flat');
    setFormUnitCost('');
    setFormPayee('');
    setFormNotes('');
    setIsAdding(false);

    // Auto-dismiss banner after 8s
    setTimeout(() => {
      setShowFlowBanner(false);
    }, 8000);
  };

  // Custom Revision Log based on local changes
  const localRevisions = useMemo(() => {
    const baseRevisions: any[] = [];

    if (lastLoggedExpense) {
      return [
        {
          version: 'v1.2 Draft+',
          details: `Added "${lastLoggedExpense.title}" (code ${lastLoggedExpense.code}) to ${categories.find(c => c.id === lastLoggedExpense.categoryId)?.name || 'budget'}`,
          time: 'Just now',
          current: true,
          bg: 'border-emerald-500'
        },
        ...baseRevisions.map(r => ({ ...r, current: false }))
      ];
    }

    return baseRevisions;
  }, [lastLoggedExpense, categories]);

  // Top spending categories analytics
  const spendingBreakdown = useMemo(() => {
    if (selectedProjectId === 'p_nike') {
      return [
        { label: 'Cast & Talent', amount: 120000, percentage: 27, color: 'bg-blue-500', text: 'text-blue-600', icon: 'users' },
        { label: 'Producer Dept', amount: 85500, percentage: 19, color: 'bg-purple-500', text: 'text-purple-600', icon: 'award' },
        { label: 'Story Rights', amount: 45000, percentage: 10, color: 'bg-emerald-500', text: 'text-emerald-600', icon: 'file' },
        { label: 'Others (16)', amount: 199700, percentage: 44, color: 'bg-amber-500', text: 'text-amber-600', icon: 'video' }
      ];
    } else {
      // Dynamic calculation based on project expenses
      if (projectCategories.length === 0) {
        return [];
      }
      const sorted = projectCategories.map(cat => {
        const spent = projectExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
        return {
          label: cat.name,
          amount: spent || cat.allocatedAmount,
          id: cat.id
        };
      }).sort((a, b) => b.amount - a.amount);

      const total = sorted.reduce((sum, item) => sum + item.amount, 0) || 1;
      
      const top3 = sorted.slice(0, 3).map((item, idx) => {
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500'];
        const textColors = ['text-blue-600', 'text-purple-600', 'text-emerald-600'];
        const icons = ['users', 'award', 'file'];
        const pct = Math.round((item.amount / total) * 100);
        return {
          label: item.label,
          amount: item.amount,
          percentage: pct,
          color: colors[idx] || 'bg-slate-400',
          text: textColors[idx] || 'text-slate-500',
          icon: icons[idx] || 'video'
        };
      });

      const remainingAmount = sorted.slice(3).reduce((sum, item) => sum + item.amount, 0);
      if (remainingAmount > 0) {
        top3.push({
          label: 'Others',
          amount: remainingAmount,
          percentage: Math.round((remainingAmount / total) * 100),
          color: 'bg-amber-500',
          text: 'text-amber-600',
          icon: 'video'
        });
      }
      return top3;
    }
  }, [selectedProjectId, projectCategories, projectExpenses]);

  // Export Production Workbook XLSX
  const handleExportExcel = () => {
    try {
      exportProductionWorkbookXlsx({
        project: activeProject,
        categories: projectCategories,
        expenses: projectExpenses,
        generatedBy: 'AI Studio Production Controller'
      });
    } catch (err: any) {
      console.error('Failed to export Excel:', err);
      alert(`Excel export failed: ${err.message || 'Unknown error'}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Category Code', 'Description / Item Name', 'Qty', 'Unit', 'Unit Cost (INR)', 'Total Budgeted (INR)', 'Notes'];
    const rows: (string | number)[][] = [];

    projectCategories.forEach(cat => {
      rows.push([cat.code || '', cat.name, '', '', '', cat.allocatedAmount || 0, 'Department Budget Head']);
      const catExpenses = searchedExpenses.filter(e => e.categoryId === cat.id);
      catExpenses.forEach(item => {
        rows.push([
          item.code || '',
          item.title || (item as any).name || item.notes || '',
          item.qty || 1,
          item.unit || 'Flat',
          item.unitCost || item.amount || 0,
          item.amount || 0,
          item.notes || ''
        ]);
      });
    });

    const projSlug = (activeProject?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateSlug = new Date().toISOString().substring(0, 10);
    exportCsvFile(headers, rows, `Budget_Report_${projSlug}_${dateSlug}.csv`);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* Dynamic Firestore Commit Notification Banner */}
      {showFlowBanner && lastLoggedExpense && (
        <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-xl flex items-start gap-3 text-emerald-200 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-1.5 bg-emerald-900/80 rounded-lg border border-emerald-700 text-emerald-300 flex-shrink-0 animate-bounce">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-emerald-100">Line Item Committed (Firestore DB Sync)</h4>
              <button onClick={() => setShowFlowBanner(false)} className="text-slate-400 hover:text-white text-xs font-semibold">Dismiss</button>
            </div>
            <p className="text-xs text-emerald-300 mt-1 leading-relaxed">
              Successfully committed line item <strong>"{lastLoggedExpense.title}"</strong> (Code {lastLoggedExpense.code}) totaling <strong>₹{lastLoggedExpense.amount.toLocaleString()}</strong> to database.
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumbs, Target Total Budget Card & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold font-mono text-slate-400 mb-1">
            <span>Projects</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300 max-w-[200px] truncate">{activeProject?.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-blue-400">Budget Planning</span>
          </div>
          <h3 className="text-xl font-bold font-sans text-white tracking-tight">Budget</h3>
        </div>

        {/* Dynamic Widget Metrics & Edit Budget Button */}
        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shadow-xs">
            <div className="text-center">
              <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">TOTAL BUDGET</p>
              <p className="font-sans text-sm font-bold text-white">₹{totalProjectBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNavigateToCategorySetup) {
                onNavigateToCategorySetup();
              }
            }}
            className="h-8 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Budget
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {hierarchySuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-300 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{hierarchySuccessMsg}</span>
        </div>
      )}

      {/* Sub-Tab: Budget vs Actual Visual Analytics */}
      {currentSubTab === 'budget-vs-actual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Budget vs Actual Spending Variance Analysis
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Real-time pacing and budget burn across all active categories in {activeProject?.name}</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              Total Budget: ₹{totalProjectBudget.toLocaleString()}
            </span>
          </div>

          <BudgetVsActualChart 
            project={activeProject} 
            totalBudget={totalProjectBudget} 
            expenses={projectExpenses} 
            categories={projectCategories} 
          />
        </div>
      )}

      {/* Sub-Tab: Hierarchy Interactive Tree */}
      {currentSubTab === 'hierarchy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                3-Level Budget Hierarchy Architecture
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Category (Level 1) → Sub-Category (Level 2) → Child Items (Level 3)</p>
            </div>
            <button
              onClick={() => onNavigateToCategorySetup && onNavigateToCategorySetup()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Configure Hierarchy
            </button>
          </div>

          <div className="space-y-3">
            {projectCategories.map((cat, catIdx) => {
              const catSerial = String(catIdx + 1);
              const subs = cat.subCategories || [];
              const catPct = totalProjectBudget > 0 ? ((cat.allocatedAmount / totalProjectBudget) * 100).toFixed(1) : '0';

              return (
                <div key={cat.id || catIdx} className="border border-slate-800 bg-slate-950/60 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold flex items-center justify-center">
                        {catSerial}
                      </span>
                      <span className="font-bold text-xs text-white uppercase tracking-wide">{cat.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">({subs.length} sub-categories)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-emerald-400">₹{cat.allocatedAmount.toLocaleString()}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{catPct}%</span>
                    </div>
                  </div>

                  {subs.length > 0 && (
                    <div className="pl-6 border-l-2 border-slate-800 ml-3 space-y-2 mt-1">
                      {subs.map((sub, sIdx) => {
                        const subSerial = `${catSerial}.${sIdx + 1}`;
                        const children = sub.childCategories || [];

                        return (
                          <div key={sub.id || sIdx} className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-blue-400 font-bold">{subSerial}</span>
                                <span className="text-xs font-medium text-slate-200">{sub.name}</span>
                                {children.length > 0 && (
                                  <span className="text-[9px] font-mono text-slate-500">({children.length} items)</span>
                                )}
                              </div>
                              <span className="text-xs font-mono text-slate-300">₹{sub.allocatedAmount.toLocaleString()}</span>
                            </div>

                            {children.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-800/60 pl-2">
                                {children.map((ch, chIdx) => {
                                  const childSerial = `${subSerial}.${chIdx + 1}`;
                                  return (
                                    <div key={ch.id || chIdx} className="flex items-center justify-between text-[10px] font-mono bg-slate-950/40 p-1.5 rounded border border-slate-800/40">
                                      <span className="text-slate-400 truncate">{childSerial} {ch.name}</span>
                                      <span className="text-slate-300 font-semibold ml-1">₹{ch.allocatedAmount.toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab: Budget Versions */}
      {currentSubTab === 'versions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Budget Versions & Audit Trail
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Sequential version tracking with baseline comparisons and approval stamps</p>
            </div>
            {currentVersion && (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                Active: {currentVersion.versionName || currentVersion.id}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {localRevisions.map((rev, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                rev.current ? 'bg-blue-950/20 border-blue-800/80 ring-1 ring-blue-500/20' : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${rev.current ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white font-mono">{rev.version}</span>
                      {rev.current && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          CURRENT BASELINE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{rev.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-500">{rev.time}</p>
                    <p className="text-xs font-mono font-bold text-white">₹{totalProjectBudget.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab: Department Budget Overview */}
      {currentSubTab === 'dept-budget' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Department Cost Centers & Allocated Quotas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Summary of financial allocations by production department head</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-lg">
              {projectCategories.length} Departments
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projectCategories.map((cat, idx) => {
              const spent = projectExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
              const remaining = cat.allocatedAmount - spent;
              const burnPct = cat.allocatedAmount > 0 ? Math.min(100, Math.round((spent / cat.allocatedAmount) * 100)) : 0;

              return (
                <div key={cat.id || idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400">DEPT #{idx + 1}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        burnPct > 90 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {burnPct}% Burn
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-white uppercase tracking-wide">{cat.name}</h5>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${burnPct > 90 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                        style={{ width: `${burnPct}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Alloc: ₹{cat.allocatedAmount.toLocaleString()}</span>
                      <span className="text-slate-300">Spent: ₹{spent.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
                      <span className="text-slate-500">Remaining:</span>
                      <span className={`font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab: Approved Budget Baseline */}
      {currentSubTab === 'approved-budget' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Officially Approved Budget Baseline
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Signed-off financial caps locked for executive compliance</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
              <Check className="w-3 h-3" /> Baseline Locked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Department Category</th>
                  <th className="py-2.5 px-3 text-right">Approved Cap (₹)</th>
                  <th className="py-2.5 px-3 text-right">Actual Spent (₹)</th>
                  <th className="py-2.5 px-3 text-right">Variance (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projectCategories.map((cat, idx) => {
                  const spent = projectExpenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
                  const variance = cat.allocatedAmount - spent;
                  const isWithin = variance >= 0;

                  return (
                    <tr key={cat.id || idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">{cat.name}</td>
                      <td className="py-2 px-3 text-right text-white font-bold">₹{cat.allocatedAmount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">₹{spent.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-bold ${isWithin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWithin ? `+₹${variance.toLocaleString()}` : `-₹${Math.abs(variance).toLocaleString()}`}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isWithin ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {isWithin ? 'On Target' : 'Overrun'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab: Committed Cost & Purchase Orders */}
      {currentSubTab === 'committed-cost' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                Committed Costs vs Uncommitted Buffer
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">PO contracts, vendor obligations, and uncommitted margin balance</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Total Committed:</span>
              <span className="text-purple-400 font-bold">₹{projectExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Allocated Budget</p>
              <p className="text-lg font-bold font-sans text-white mt-1">₹{totalProjectBudget.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-purple-900/60 rounded-xl">
              <p className="text-[10px] font-mono font-bold text-purple-400 uppercase">Committed Spending</p>
              <p className="text-lg font-bold font-sans text-purple-300 mt-1">₹{projectExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-950/60 border border-emerald-900/60 rounded-xl">
              <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Uncommitted Reserve</p>
              <p className="text-lg font-bold font-sans text-emerald-300 mt-1">
                ₹{Math.max(0, totalProjectBudget - projectExpenses.reduce((s, e) => s + e.amount, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab: Final Cost Report */}
      {currentSubTab === 'final-cost-report' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Production Final Cost Report (ATL / BTL / Post)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit breakdown of major film tier expenditures</p>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Report (.xlsx)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Above the Line */}
            {(() => {
              const atlNames = ['story and other rights', 'pre production expenses', 'artist wages', 'cast', 'talent', 'director', 'producer'];
              const atlCats = projectCategories.filter(c => atlNames.some(n => c.name.toLowerCase().includes(n)));
              const atlAlloc = atlCats.reduce((s, c) => s + c.allocatedAmount, 0);
              const atlSpent = projectExpenses.filter(e => atlCats.some(c => c.id === e.categoryId)).reduce((s, e) => s + e.amount, 0);

              return (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">TIER 1</span>
                    <h5 className="font-bold text-sm text-white mt-0.5">Above The Line (ATL)</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Story rights, director, principal talent & producer costs</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400"><span>Budget:</span><span className="text-white font-bold">₹{atlAlloc.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Spent:</span><span className="text-slate-300">₹{atlSpent.toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })()}

            {/* Below the Line */}
            {(() => {
              const btlNames = ['crew wages', 'equipments', 'location expenses', 'art expenses', 'wardrobe expenses', 'transport expenses', 'fuel expense', 'food expenses', 'caterer expense'];
              const btlCats = projectCategories.filter(c => btlNames.some(n => c.name.toLowerCase().includes(n)));
              const btlAlloc = btlCats.reduce((s, c) => s + c.allocatedAmount, 0);
              const btlSpent = projectExpenses.filter(e => btlCats.some(c => c.id === e.categoryId)).reduce((s, e) => s + e.amount, 0);

              return (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">TIER 2</span>
                    <h5 className="font-bold text-sm text-white mt-0.5">Below The Line (BTL)</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Crew, equipment, location, art, wardrobe & logistics</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400"><span>Budget:</span><span className="text-white font-bold">₹{btlAlloc.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Spent:</span><span className="text-slate-300">₹{btlSpent.toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })()}

            {/* Post Production & Other */}
            {(() => {
              const postNames = ['post production expenses', 'vfx', 'music', 'sound', 'editing', 'publicity and marketing expense', 'insurance and office expenses', 'miscellaneous expenses', 'contingency and other expenses'];
              const postCats = projectCategories.filter(c => postNames.some(n => c.name.toLowerCase().includes(n)));
              const postAlloc = postCats.reduce((s, c) => s + c.allocatedAmount, 0);
              const postSpent = projectExpenses.filter(e => postCats.some(c => c.id === e.categoryId)).reduce((s, e) => s + e.amount, 0);

              return (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">TIER 3</span>
                    <h5 className="font-bold text-sm text-white mt-0.5">Post & Contingency</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Post-production, VFX, marketing, insurance & reserve</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400"><span>Budget:</span><span className="text-white font-bold">₹{postAlloc.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Spent:</span><span className="text-slate-300">₹{postSpent.toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Line Item Drawer form block */}
      {isAdding && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h4 className="font-bold text-sm text-white">Log Dynamic Line Item (Pre-populated Code Index)</h4>
            <button onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-white font-semibold">Cancel</button>
          </div>

          {formError && (
            <div className="mb-3 bg-rose-950/80 border border-rose-800 p-3 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold font-mono text-slate-400 flex items-center justify-between">
                  <span>Category (Level 1) *</span>
                  {formCategoryId && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      Budget: ₹{getCatBudgetVal(projectCategories.find(c => c.id === formCategoryId)).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => {
                    setFormCategoryId(e.target.value);
                    setFormSubCategoryId('');
                    setFormChildCategoryId('');
                  }}
                  className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                >
                  {projectCategories.map((c, idx) => {
                    const catSerial = String(idx + 1);
                    const bVal = getCatBudgetVal(c);
                    return <option key={c.id} value={c.id}>{catSerial}. {c.name} — ₹{bVal.toLocaleString('en-IN')}</option>;
                  })}
                </select>
              </div>

              {availableFormSubCategories.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold font-mono text-blue-400 flex items-center justify-between">
                    <span>Sub Category (Level 2)</span>
                    {formSubCategoryId && (
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                        Budget: ₹{getSubBudgetVal(availableFormSubCategories.find(s => s.id === formSubCategoryId)).toLocaleString('en-IN')}
                      </span>
                    )}
                  </label>
                  <select
                    value={formSubCategoryId}
                    onChange={(e) => {
                      setFormSubCategoryId(e.target.value);
                      setFormChildCategoryId('');
                    }}
                    className="h-8 bg-slate-800 border border-blue-900/60 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">-- Select Sub Category (Optional) --</option>
                    {availableFormSubCategories.map((s, sIdx) => {
                      const parentCat = projectCategories.find(c => c.id === formCategoryId);
                      const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                      const parentSerial = String(parentIdx + 1);
                      const subSerial = `${parentSerial}.${sIdx + 1}`;
                      const bVal = getSubBudgetVal(s);
                      return <option key={s.id} value={s.id}>{subSerial}. {s.name} — ₹{bVal.toLocaleString('en-IN')}</option>;
                    })}
                  </select>
                </div>
              )}

              {availableFormChildCategories.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold font-mono text-purple-400 flex items-center justify-between">
                    <span>Child Category (Level 3)</span>
                    {formChildCategoryId && (
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                        Budget: ₹{getChildBudgetVal(availableFormChildCategories.find(ch => ch.id === formChildCategoryId)).toLocaleString('en-IN')}
                      </span>
                    )}
                  </label>
                  <select
                    value={formChildCategoryId}
                    onChange={(e) => setFormChildCategoryId(e.target.value)}
                    className="h-8 bg-slate-800 border border-purple-900/60 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="">-- Select Child Category (Optional) --</option>
                    {availableFormChildCategories.map((ch, chIdx) => {
                      const parentSub = availableFormSubCategories.find(s => s.id === formSubCategoryId);
                      const subIdx = parentSub ? availableFormSubCategories.indexOf(parentSub) : 0;
                      const parentCat = projectCategories.find(c => c.id === formCategoryId);
                      const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                      const parentSerial = String(parentIdx + 1);
                      const subSerial = `${parentSerial}.${subIdx + 1}`;
                      const childSerial = `${subSerial}.${chIdx + 1}`;
                      const bVal = getChildBudgetVal(ch);
                      return <option key={ch.id} value={ch.id}>{childSerial}. {ch.name} — ₹{bVal.toLocaleString('en-IN')}</option>;
                    })}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Line Item Title/Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Writer fee, Camera track rental"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={formQty}
                    onChange={(e) => setFormQty(parseInt(e.target.value) || 1)}
                    className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-white py-1.5 px-3 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Flat">Flat</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Days">Days</option>
                    <option value="Run">Run</option>
                    <option value="Frames">Frames</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Unit Cost ($)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(e.target.value)}
                    className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Estimated Total</label>
                <div className="h-8 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 py-1.5 px-3 flex items-center">
                  ₹{((formQty || 1) * (parseFloat(formUnitCost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Creditor / Payee Agency</label>
                <input
                  type="text"
                  placeholder="e.g. SAG Agency, Panavision Inc"
                  value={formPayee}
                  onChange={(e) => setFormPayee(e.target.value)}
                  className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold font-mono text-slate-400">Explanatory Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Signed contract v1.2"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="h-8 bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 border-t border-slate-800 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-8 px-3.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Insert Line Item Row
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Budget Grid Table (Full Width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          
          {/* Table Tools */}
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search line items */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search line items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Expand / Collapse buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExpandAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Expand All
                </button>
                <span className="text-slate-700">|</span>
                <button
                  onClick={handleCollapseAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Collapse All
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportExcel}
                title="Download Complete Production Excel Workbook (.xlsx)"
                className="h-7 px-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-emerald-500/40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                title="Open Export Engine Hub"
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Hub</span>
              </button>
            </div>
          </div>

          {/* Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                  <th className="py-2.5 px-2 w-14 text-center">Qty</th>
                  <th className="py-2.5 px-2 w-16">Unit</th>
                  <th className="py-2.5 px-3 w-24 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total Budgeted</th>
                  <th className="py-2.5 px-3 min-w-[120px]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {projectCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 italic font-mono">
                      No budget categories established for this project. Use "New Project" wizard or click Admin setup.
                    </td>
                  </tr>
                ) : (
                  projectCategories.map((cat, idx) => {
                    const catCode = String(idx + 1);
                    const subCategories = cat.subCategories || [];
                    
                    // Sum sub-category allocated amounts (or category allocatedAmount if no subs)
                    const catAllocated = subCategories.length > 0
                      ? subCategories.reduce((sSum, sub) => {
                          const childs = sub.childCategories || [];
                          return sSum + (childs.length > 0 ? childs.reduce((cSum, ch) => cSum + ch.allocatedAmount, 0) : sub.allocatedAmount);
                        }, 0)
                      : cat.allocatedAmount;

                    // All expenses belonging to this category
                    const catAllExpenses = searchedExpenses.filter(exp => exp.categoryId === cat.id);
                    const catSpent = catAllExpenses.reduce((sum, item) => sum + item.amount, 0);
                    const isCatExpanded = isNodeExpanded(cat.id);
                    
                    // Line items mapped directly to cat level (when no sub categories exist or specified)
                    const catDirectItems = catAllExpenses.filter(e => !e.subCategoryId && !e.childCategoryId);

                    return (
                      <Fragment key={cat.id}>
                        {/* Level 1: Category Row Header */}
                        <tr 
                          onClick={() => toggleNode(cat.id)}
                          className="bg-slate-800/70 font-bold text-white border-y border-slate-800 hover:bg-slate-800/90 transition-colors cursor-pointer select-none"
                        >
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                            {catCode}
                          </td>
                          <td className="py-2 px-3 font-sans uppercase tracking-tight font-bold flex items-center gap-2">
                            {isCatExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>{cat.name}</span>
                            {subCategories.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 bg-slate-700/80 text-slate-300 text-[9px] font-mono rounded font-normal">
                                {subCategories.length} Sub-Cat
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2"></td>
                          <td className="py-2 px-2"></td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400 text-xs">
                            Spent: ₹{catSpent.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs font-bold text-white">
                            ₹{catAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px] font-normal">
                            {catAllExpenses.length} line item(s)
                          </td>
                        </tr>

                        {/* Level 1 Expanded View */}
                        {isCatExpanded && (
                          subCategories.length > 0 ? (
                            subCategories.map((sub, sIdx) => {
                              const subCode = `${catCode}.${sIdx + 1}`;
                              const childCategories = sub.childCategories || [];
                              const subAllocated = childCategories.length > 0
                                ? childCategories.reduce((cSum, ch) => cSum + ch.allocatedAmount, 0)
                                : sub.allocatedAmount;

                              const subAllExpenses = searchedExpenses.filter(e => e.subCategoryId === sub.id || (e.categoryId === cat.id && !e.subCategoryId));
                              const subDirectExpenses = searchedExpenses.filter(e => e.subCategoryId === sub.id);
                              const subSpent = subDirectExpenses.reduce((sum, item) => sum + item.amount, 0);
                              const isSubExpanded = isNodeExpanded(sub.id);

                              return (
                                <Fragment key={sub.id}>
                                  {/* Level 2: Sub-Category Row */}
                                  <tr 
                                    onClick={() => toggleNode(sub.id)}
                                    className="bg-slate-900/80 font-semibold text-slate-200 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
                                  >
                                    <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                                      {subCode}
                                    </td>
                                    <td className="py-2 px-3 pl-7 font-sans font-semibold text-slate-300 flex items-center gap-2">
                                      {isSubExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                      )}
                                      <span className="px-1.5 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 text-[9px] font-mono font-bold rounded">SUB</span>
                                      <span>{sub.name}</span>
                                    </td>
                                    <td className="py-2 px-2"></td>
                                    <td className="py-2 px-2"></td>
                                    <td className="py-2 px-3 text-right font-mono text-slate-400 text-xs">
                                      Spent: ₹{subSpent.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-xs font-bold text-slate-200">
                                      ₹{subAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">
                                      {childCategories.length > 0 ? `${childCategories.length} Child-Cat` : `${subDirectExpenses.length} item(s)`}
                                    </td>
                                  </tr>

                                  {/* Level 2 Expanded View */}
                                  {isSubExpanded && (
                                    childCategories.length > 0 ? (
                                      childCategories.map((child, chIdx) => {
                                        const childCode = `${subCode}.${chIdx + 1}`;
                                        const childAllocated = child.allocatedAmount;
                                        const childItems = searchedExpenses.filter(e => e.childCategoryId === child.id);
                                        const childSpent = childItems.reduce((sum, item) => sum + item.amount, 0);
                                        const isChildExpanded = isNodeExpanded(child.id);

                                        return (
                                          <Fragment key={child.id}>
                                            {/* Level 3: Child Category Row */}
                                            <tr 
                                              onClick={() => toggleNode(child.id)}
                                              className="bg-purple-950/20 font-medium text-slate-300 border-b border-purple-900/30 hover:bg-purple-950/40 transition-colors cursor-pointer select-none"
                                            >
                                              <td className="py-1.5 px-3 text-center font-mono text-slate-500 text-[10px]">
                                                {childCode}
                                              </td>
                                              <td className="py-1.5 px-3 pl-12 font-sans font-medium text-purple-200 flex items-center gap-2">
                                                {isChildExpanded ? (
                                                  <ChevronDown className="w-3 h-3 text-purple-400" />
                                                ) : (
                                                  <ChevronRight className="w-3 h-3 text-purple-400" />
                                                )}
                                                <span className="px-1.5 py-0.5 bg-purple-900/60 text-purple-300 border border-purple-700/60 text-[9px] font-mono font-bold rounded">CHILD</span>
                                                <span>{child.name}</span>
                                              </td>
                                              <td className="py-1.5 px-2"></td>
                                              <td className="py-1.5 px-2"></td>
                                              <td className="py-1.5 px-3 text-right font-mono text-slate-400 text-xs">
                                                Spent: ₹{childSpent.toLocaleString()}
                                              </td>
                                              <td className="py-1.5 px-3 text-right font-mono text-xs font-bold text-purple-200">
                                                ₹{childAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="py-1.5 px-3 text-slate-500 font-mono text-[10px]">
                                                {childItems.length} item(s)
                                              </td>
                                            </tr>

                                            {/* Level 3 Line Items */}
                                            {isChildExpanded && (
                                              childItems.length === 0 ? (
                                                <tr className="hover:bg-slate-800/30 transition-colors">
                                                  <td className="py-2 px-3"></td>
                                                  <td colSpan={6} className="py-2 px-3 pl-16 italic text-slate-500 font-mono text-[11px]">
                                                    <div className="flex items-center gap-1.5">
                                                      <CornerDownRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                                                      No line items committed yet under "{child.name}".
                                                    </div>
                                                  </td>
                                                </tr>
                                              ) : (
                                                childItems.map((item) => (
                                                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                                                    <td className="py-2 px-3 text-center font-mono text-slate-500 text-[10px]">
                                                      {item.code || ''}
                                                    </td>
                                                    <td className="py-2 px-3 font-medium text-slate-200">
                                                      <div className="flex items-center gap-1.5 pl-16">
                                                        <CornerDownRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                        <span>{item.title}</span>
                                                        {item.status === 'Disputed' && (
                                                          <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[8px] font-bold uppercase tracking-wider border border-rose-800">
                                                            Disputed
                                                          </span>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-center font-mono text-slate-400">
                                                      {item.qty || 1}
                                                    </td>
                                                    <td className="py-2 px-2 font-mono text-slate-400">
                                                      {item.unit || 'Flat'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono text-slate-400">
                                                      ₹{(item.unitCost || item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                                      ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-2 px-3 text-slate-400 italic max-w-[180px] truncate" title={item.notes}>
                                                      {item.notes || '—'}
                                                    </td>
                                                  </tr>
                                                ))
                                              )
                                            )}
                                          </Fragment>
                                        );
                                      })
                                    ) : (
                                      /* Sub-Category with Direct Items */
                                      subDirectExpenses.length === 0 ? (
                                        <tr className="hover:bg-slate-800/30 transition-colors">
                                          <td className="py-2 px-3"></td>
                                          <td colSpan={6} className="py-2 px-3 pl-12 italic text-slate-500 font-mono text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                              <CornerDownRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                                              No line items committed yet under "{sub.name}".
                                            </div>
                                          </td>
                                        </tr>
                                      ) : (
                                        subDirectExpenses.map((item) => (
                                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                                            <td className="py-2 px-3 text-center font-mono text-slate-500 text-[10px]">
                                              {item.code || ''}
                                            </td>
                                            <td className="py-2 px-3 font-medium text-slate-200">
                                              <div className="flex items-center gap-1.5 pl-12">
                                                <CornerDownRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                <span>{item.title}</span>
                                                {item.status === 'Disputed' && (
                                                  <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[8px] font-bold uppercase tracking-wider border border-rose-800">
                                                    Disputed
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-2 px-2 text-center font-mono text-slate-400">
                                              {item.qty || 1}
                                            </td>
                                            <td className="py-2 px-2 font-mono text-slate-400">
                                              {item.unit || 'Flat'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                                              ₹{(item.unitCost || item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                              ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-3 text-slate-400 italic max-w-[180px] truncate" title={item.notes}>
                                              {item.notes || '—'}
                                            </td>
                                          </tr>
                                        ))
                                      )
                                    )
                                  )}
                                </Fragment>
                              );
                            })
                          ) : (
                            /* Category Direct Line Items (When no sub-categories exist) */
                            catDirectItems.length === 0 ? (
                              <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-2 px-3"></td>
                                <td colSpan={6} className="py-2 px-3 italic text-slate-500 font-mono text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <CornerDownRight className="w-3.5 h-3.5 text-slate-600" />
                                    No line items committed yet. Click "Edit Budget" to add records.
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              catDirectItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                                  <td className="py-2 px-3 text-center font-mono text-slate-500 text-[10px]">
                                    {item.code || ''}
                                  </td>
                                  <td className="py-2 px-3 font-medium text-slate-200">
                                    <div className="flex items-center gap-1.5 pl-2">
                                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                      <span>{item.title}</span>
                                      {item.status === 'Disputed' && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[8px] font-bold uppercase tracking-wider border border-rose-800">
                                          Disputed
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono text-slate-400">
                                    {item.qty || 1}
                                  </td>
                                  <td className="py-2 px-2 font-mono text-slate-400">
                                    {item.unit || 'Flat'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-400">
                                    ₹{(item.unitCost || item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-white">
                                    ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 italic max-w-[180px] truncate" title={item.notes}>
                                    {item.notes || '—'}
                                  </td>
                                </tr>
                              ))
                            )
                          )
                        )}
                      </Fragment>
                    );
                  })
                )}

                {/* Main Dynamic Total row */}
                {(() => {
                  const grandTotalAllocated = projectCategories.reduce((acc, cat) => {
                    const subs = cat.subCategories || [];
                    return acc + (subs.length > 0
                      ? subs.reduce((sSum, s) => {
                          const childs = s.childCategories || [];
                          return sSum + (childs.length > 0 ? childs.reduce((cSum, ch) => cSum + ch.allocatedAmount, 0) : s.allocatedAmount);
                        }, 0)
                      : cat.allocatedAmount);
                  }, 0);

                  return (
                    <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-700">
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 font-sans uppercase font-bold text-xs tracking-tight" colSpan={3}>
                        TOTAL PRODUCTION BUDGET
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-400 font-normal">
                        Spent: <span className="text-emerald-400 font-bold">₹{totalCalculatedSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm font-extrabold text-white">
                        ₹{grandTotalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                        {searchedExpenses.length} Total Expense(s)
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Sticky Pagination */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between font-mono text-[10px] text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span>Showing <span className="font-bold text-white">{projectCategories.length}</span> of <span className="font-bold text-white">{categories.length}</span> categories globally</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500 italic">Last saved moments ago</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="mr-2 text-slate-400">Page 1 of 1</span>
              <button disabled className="p-1 px-2 rounded border border-slate-800 bg-slate-800/40 text-slate-600 cursor-not-allowed text-[10px]">Prev</button>
              <button disabled className="p-1 px-2 rounded border border-slate-800 bg-slate-800/40 text-slate-600 cursor-not-allowed text-[10px]">Next</button>
            </div>
          </div>
      </div>

      {/* Budget Approval Send & Status Section - Placed below budget */}
      {currentVersion && (
        <BudgetApprovalWidget
          currentVersion={currentVersion}
          lastApprovedVersion={lastApprovedVersion}
          activeRoleName={activeRoleName}
          onSendApproval={onSendApproval || (() => {})}
          onApproveRole={onApproveRole || (() => {})}
          onSendAllApprovals={onSendAllApprovals || (() => {})}
        />
      )}

      {/* Analytics & Audit Cards - Placed below budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revision History vertical timeline card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h4 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-400" />
              Revision History
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">Audit Active</span>
          </div>

          <div className="space-y-3">
            {localRevisions.map((rev, idx) => (
              <div key={idx} className="relative pl-5 pb-2 border-l-2 border-slate-800 last:border-0">
                {/* Timeline dot */}
                <div className={`absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full border-2 bg-slate-900 ${
                  rev.current ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'
                }`}></div>
                
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold font-mono text-white">
                    {rev.version}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{rev.time}</span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  {rev.details}
                </p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => alert("Revisions are linked directly to your local ERP memory stream and logged to the SQL query trace logs.")}
            className="w-full mt-2 text-center py-1.5 text-blue-400 hover:text-blue-300 font-sans text-xs font-bold transition-all hover:underline cursor-pointer"
          >
            View Full Audit Logs
          </button>
        </div>

        {/* Visual Breakdown Pie/Stacked Bar Chart Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              Top Spending Allocation
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              Active Project
            </span>
          </div>

          {/* Spending stats cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {spendingBreakdown.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                  <span className="font-mono text-[10px] font-bold text-slate-300">{item.percentage}%</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium truncate" title={item.label}>{item.label}</p>
                  <p className="font-sans text-xs font-bold text-white">₹{Math.round(item.amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Small Horizontal Stacked Bar Chart */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="h-2 w-full rounded-full overflow-hidden bg-slate-800 flex">
              {spendingBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  style={{ width: `${item.percentage}%` }}
                  className={`${item.color} h-full`}
                  title={`${item.label}: ${item.percentage}%`}
                ></div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-y-1 font-mono text-[9px] text-slate-400 mt-0.5">
              {spendingBreakdown.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1 font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                  {item.label.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* EXPORT ENGINE MODAL */}
      <ExportEngineModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projects={projects}
        activeProject={activeProject}
        selectedProjectId={selectedProjectId}
        categories={projectCategories}
        expenses={projectExpenses}
        defaultReportType="master_cost"
      />
    </div>
  );
}
