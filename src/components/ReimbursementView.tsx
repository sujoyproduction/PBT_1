import { useState, useEffect, useMemo, useRef, FormEvent, DragEvent, ChangeEvent } from 'react';
import { Project, BudgetCategory, Expense, DBLog } from '../types';
import { 
  Briefcase, 
  Layers, 
  DollarSign, 
  CreditCard, 
  Coins, 
  FileText, 
  CloudUpload, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Trash2, 
  Check,
  Receipt, 
  Info, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Database,
  Calendar,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';

interface ReimbursementViewProps {
  projects: Project[];
  categories: BudgetCategory[];
  expenses: Expense[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onNavigateToTab?: (tab: 'workspace' | 'dashboard' | 'timeline' | 'ledger' | 'approvals' | 'categories' | 'cashier' | 'restoration' | 'logs' | 'resources' | 'admin' | 'new-project') => void;
  onAddLog?: (log: DBLog) => void;
}

export default function ReimbursementView({ 
  projects, 
  categories, 
  expenses, 
  selectedProjectId: externalProjectId,
  onSelectProject,
  onAddExpense, 
  onNavigateToTab,
  onAddLog 
}: ReimbursementViewProps) {
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(externalProjectId || projects[0]?.id || '');

  useEffect(() => {
    if (externalProjectId) {
      setSelectedProjectId(externalProjectId);
    }
  }, [externalProjectId]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  // Auto-generated Booking No. & Date
  const [bookingNo, setBookingNo] = useState<string>(() => `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Payee / Requester Details
  const [payeeName, setPayeeName] = useState<string>('');
  const [payeeDesignation, setPayeeDesignation] = useState<string>('');

  // 3-Level Category Selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [selectedChildCategoryId, setSelectedChildCategoryId] = useState<string>('');

  // Payment Details
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Cheque' | 'Draft Transfer' | 'Net Banking' | 'Card'>('UPI');
  const [paidBy, setPaidBy] = useState<string>('Production Cashier');
  const [amount, setAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Attachment files
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string; url?: string }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected project object
  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  // Categories for active project
  const projectCategories = useMemo(() => {
    return categories.filter(c => 
      c.projectId === selectedProjectId || 
      c.projectId === activeProject?.id ||
      (c.projectId && activeProject?.id && c.projectId.replace(/^wp_/, '') === activeProject.id.replace(/^wp_/, ''))
    );
  }, [categories, selectedProjectId, activeProject]);

  // Selected Category Object
  const selectedCategoryObj = useMemo(() => {
    return projectCategories.find(c => c.id === selectedCategoryId);
  }, [projectCategories, selectedCategoryId]);

  // Available Sub-Categories for selected Category
  const availableSubCategories = useMemo(() => {
    return selectedCategoryObj?.subCategories || [];
  }, [selectedCategoryObj]);

  // Selected Sub-Category Object
  const selectedSubCategoryObj = useMemo(() => {
    return availableSubCategories.find(s => s.id === selectedSubCategoryId);
  }, [availableSubCategories, selectedSubCategoryId]);

  // Available Child-Categories for selected Sub-Category
  const availableChildCategories = useMemo(() => {
    return selectedSubCategoryObj?.childCategories || [];
  }, [selectedSubCategoryObj]);

  // Selected Child-Category Object
  const selectedChildCategoryObj = useMemo(() => {
    return availableChildCategories.find(ch => ch.id === selectedChildCategoryId);
  }, [availableChildCategories, selectedChildCategoryId]);

  // Helpers to calculate allocated budget at each hierarchy level
  const getChildBudget = (child: any): number => {
    if (!child) return 0;
    if (typeof child.allocatedAmount === 'number' && child.allocatedAmount > 0) {
      return child.allocatedAmount;
    }
    return ((child.count || 0) * (child.rate || 0) * (child.shifts || 1)) || 0;
  };

  const getSubCategoryBudget = (sub: any): number => {
    if (!sub) return 0;
    if (typeof sub.allocatedAmount === 'number' && sub.allocatedAmount > 0) {
      return sub.allocatedAmount;
    }
    return (sub.childCategories || []).reduce((acc: number, ch: any) => acc + getChildBudget(ch), 0);
  };

  const getCategoryBudget = (cat: any): number => {
    if (!cat) return 0;
    if (typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0) {
      return cat.allocatedAmount;
    }
    return (cat.subCategories || []).reduce((acc: number, sub: any) => acc + getSubCategoryBudget(sub), 0);
  };

  // Helpers to calculate actual spent from expenses
  const getCategorySpent = (catId: string): number => {
    if (!catId || !expenses) return 0;
    return expenses
      .filter(e => e.categoryId === catId)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  };

  const getSubCategorySpent = (subId: string): number => {
    if (!subId || !expenses) return 0;
    return expenses
      .filter(e => e.subCategoryId === subId)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  };

  const getChildSpent = (childId: string): number => {
    if (!childId || !expenses) return 0;
    return expenses
      .filter(e => e.childCategoryId === childId)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  };

  // Handle Category Change -> Reset Sub and Child
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSubCategoryId('');
    setSelectedChildCategoryId('');
  };

  // Handle Sub-Category Change -> Reset Child
  const handleSubCategoryChange = (subId: string) => {
    setSelectedSubCategoryId(subId);
    setSelectedChildCategoryId('');
  };

  // Safe parsed amount
  const parsedAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [amount]);

  // File Upload Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFile(e.target.files[0]);
    }
  };

  const addFile = (file: File) => {
    const fileSizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setAttachments(prev => [
      ...prev, 
      { name: file.name, size: fileSizeFormatted, type: file.type }
    ]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Expense Booking Form
  const handleSubmitBooking = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProjectId) {
      setErrorMessage("Please select an active project.");
      return;
    }
    if (!payeeName.trim()) {
      setErrorMessage("Please enter the payee/requester name.");
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage("Please select a Category.");
      return;
    }

    // REQUIRE SUB-CATEGORY IF CATEGORY HAS SUB-CATEGORIES
    if (availableSubCategories.length > 0 && !selectedSubCategoryId) {
      setErrorMessage(`The selected category "${selectedCategoryObj?.name}" has sub-categories. Please select a Sub Category.`);
      return;
    }

    // REQUIRE CHILD-CATEGORY IF SUB-CATEGORY HAS CHILD-CATEGORIES
    if (availableChildCategories.length > 0 && !selectedChildCategoryId) {
      setErrorMessage(`The selected sub-category "${selectedSubCategoryObj?.name}" has child categories. Please select a Child Category.`);
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMessage("Please enter a valid expense amount greater than ₹0.");
      return;
    }

    // Construct title
    const selectedChildObj = availableChildCategories.find(ch => ch.id === selectedChildCategoryId);
    const categoryPath = [
      selectedCategoryObj?.name,
      selectedSubCategoryObj?.name,
      selectedChildObj?.name
    ].filter(Boolean).join(' > ');

    const newExpense: Omit<Expense, 'id'> = {
      bookingNo: bookingNo.trim() || `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: selectedProjectId,
      categoryId: selectedCategoryId,
      subCategoryId: selectedSubCategoryId || undefined,
      childCategoryId: selectedChildCategoryId || undefined,
      title: paymentNote.trim() ? `${paymentNote} (${categoryPath})` : `Expense Booking (${categoryPath})`,
      amount: parsedAmount,
      date: expenseDate || new Date().toISOString().split('T')[0],
      payee: payeeName.trim(),
      designation: payeeDesignation.trim() || undefined,
      paymentMode: paymentMode,
      paidBy: paidBy.trim() || undefined,
      notes: paymentNote.trim() || undefined,
      attachments: attachments.map(a => a.name),
      status: 'Pending'
    };

    onAddExpense(newExpense);

    setSuccessMessage(`Expense Booking ${newExpense.bookingNo} created successfully! Logged under ${categoryPath}.`);

    // Reset Form
    setBookingNo(`EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPayeeName('');
    setPayeeDesignation('');
    setSelectedCategoryId('');
    setSelectedSubCategoryId('');
    setSelectedChildCategoryId('');
    setAmount('');
    setPaymentNote('');
    setAttachments([]);

    if (onAddLog) {
      onAddLog({
        id: `l_exp_book_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'SQL_INSERT_EXPENSE_BOOKING',
        sqlQuery: `INSERT INTO expenses (bookingNo, projectId, categoryId, subCategoryId, childCategoryId, payee, designation, amount, paymentMode, paidBy, date) VALUES ('${newExpense.bookingNo}', '${selectedProjectId}', '${selectedCategoryId}', '${selectedSubCategoryId || ''}', '${selectedChildCategoryId || ''}', '${newExpense.payee}', '${newExpense.designation || ''}', ${newExpense.amount}, '${paymentMode}', '${newExpense.paidBy || ''}', '${newExpense.date}');`,
        status: 'success'
      });
    }

    setTimeout(() => {
      setSuccessMessage(null);
      if (onNavigateToTab) {
        onNavigateToTab('ledger');
      }
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 text-slate-100 font-sans">
      
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-500 max-w-md animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <div className="text-xs font-semibold font-sans leading-snug">{successMessage}</div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 mb-0.5 font-sans">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">Expense Management System</span>
          </div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">Expense Booking Form</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Record operational production expenses with cascading 3-level categories, payee details, and file attachments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-blue-950/80 text-blue-400 text-[11px] font-mono font-bold rounded-lg border border-blue-900/60">
            Auto Booking ID: {bookingNo}
          </span>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        
        <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-sans text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Expense Booking Entry Details
          </h3>
          <span className="text-[10px] font-mono text-slate-400">* Required Fields</span>
        </div>

        {errorMessage && (
          <div className="m-4 p-2.5 bg-rose-950/60 text-rose-300 border border-rose-900/60 rounded-lg text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitBooking} className="p-4 space-y-4">
          
          {/* SECTION 1: BOOKING META & PAYEE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 border-b border-slate-800">
            
            {/* Expense Booking No */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Expense Booking No. *</label>
              <input 
                type="text"
                required
                value={bookingNo}
                onChange={(e) => setBookingNo(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[9px] text-slate-500 mt-0.5">Auto-generated, editable</p>
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Date *</label>
              <input 
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[9px] text-slate-500 mt-0.5">Auto-selected today, editable</p>
            </div>

            {/* Payee Name */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Payee / Recipient Name *</label>
              <input 
                type="text"
                required
                placeholder="e.g. Rahul Sharma, Vision Camera Rentals"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Designation</label>
              <input 
                type="text"
                placeholder="e.g. Director of Photography"
                value={payeeDesignation}
                onChange={(e) => setPayeeDesignation(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

          </div>

          {/* SECTION 2: CASCADING CATEGORY SELECTION */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <h4 className="text-xs font-bold font-sans text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Cascading Category Classification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Level 1: Category */}
              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>1. Category *</span>
                  {selectedCategoryObj && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      Budget: ₹{getCategoryBudget(selectedCategoryObj).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select 
                  required
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="">— Select Category —</option>
                  {projectCategories.map((c, idx) => {
                    const catSerial = String(idx + 1);
                    const bVal = getCategoryBudget(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {catSerial}. {c.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
                {selectedCategoryObj && (
                  <div className="mt-1 flex items-center justify-between text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-400">
                    <span>Allocated: <strong className="text-amber-300">₹{getCategoryBudget(selectedCategoryObj).toLocaleString('en-IN')}</strong></span>
                    <span>Remaining: <strong className="text-emerald-400">₹{Math.max(0, getCategoryBudget(selectedCategoryObj) - getCategorySpent(selectedCategoryObj.id)).toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
              </div>

              {/* Level 2: Sub Category (Shown if Category has Sub-Categories) */}
              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>2. Sub Category</span>
                    {availableSubCategories.length > 0 && (
                      <span className="text-rose-400 font-bold">* Required</span>
                    )}
                  </span>
                  {selectedSubCategoryObj && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                      Budget: ₹{getSubCategoryBudget(selectedSubCategoryObj).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select 
                  disabled={!selectedCategoryId || availableSubCategories.length === 0}
                  value={selectedSubCategoryId}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <option value="">
                    {availableSubCategories.length === 0 ? "— No Sub Categories —" : "— Select Sub Category —"}
                  </option>
                  {availableSubCategories.map((s, sIdx) => {
                    const parentCat = projectCategories.find(c => c.id === selectedCategoryId);
                    const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                    const parentSerial = String(parentIdx + 1);
                    const subSerial = `${parentSerial}.${sIdx + 1}`;
                    const bVal = getSubCategoryBudget(s);
                    return (
                      <option key={s.id} value={s.id}>
                        {subSerial}. {s.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
                {selectedSubCategoryObj && (
                  <div className="mt-1 flex items-center justify-between text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-400">
                    <span>Allocated: <strong className="text-blue-300">₹{getSubCategoryBudget(selectedSubCategoryObj).toLocaleString('en-IN')}</strong></span>
                    <span>Remaining: <strong className="text-emerald-400">₹{Math.max(0, getSubCategoryBudget(selectedSubCategoryObj) - getSubCategorySpent(selectedSubCategoryObj.id)).toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
              </div>

              {/* Level 3: Child Category (Shown if Sub Category has Child Categories) */}
              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>3. Child Category</span>
                    {availableChildCategories.length > 0 && (
                      <span className="text-rose-400 font-bold">* Required</span>
                    )}
                  </span>
                  {selectedChildCategoryObj && (
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                      Budget: ₹{getChildBudget(selectedChildCategoryObj).toLocaleString('en-IN')}
                    </span>
                  )}
                </label>
                <select 
                  disabled={!selectedSubCategoryId || availableChildCategories.length === 0}
                  value={selectedChildCategoryId}
                  onChange={(e) => setSelectedChildCategoryId(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <option value="">
                    {availableChildCategories.length === 0 ? "— No Child Categories —" : "— Select Child Category —"}
                  </option>
                  {availableChildCategories.map((ch, chIdx) => {
                    const parentSub = availableSubCategories.find(s => s.id === selectedSubCategoryId);
                    const subIdx = parentSub ? availableSubCategories.indexOf(parentSub) : 0;
                    const parentCat = projectCategories.find(c => c.id === selectedCategoryId);
                    const parentIdx = parentCat ? projectCategories.indexOf(parentCat) : 0;
                    const parentSerial = String(parentIdx + 1);
                    const subSerial = `${parentSerial}.${subIdx + 1}`;
                    const childSerial = `${subSerial}.${chIdx + 1}`;
                    const bVal = getChildBudget(ch);
                    return (
                      <option key={ch.id} value={ch.id}>
                        {childSerial}. {ch.name} — ₹{bVal.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
                {selectedChildCategoryObj && (
                  <div className="mt-1 flex items-center justify-between text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-400">
                    <span>Allocated: <strong className="text-purple-300">₹{getChildBudget(selectedChildCategoryObj).toLocaleString('en-IN')}</strong></span>
                    <span>Remaining: <strong className="text-emerald-400">₹{Math.max(0, getChildBudget(selectedChildCategoryObj) - getChildSpent(selectedChildCategoryObj.id)).toLocaleString('en-IN')}</strong></span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* SECTION 3: PAYMENT DETAILS & AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-800">
            
            {/* Payment Mode */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Payment Mode *</label>
              <select 
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Draft Transfer">Draft Transfer</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Paid By */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Paid By *</label>
              <input 
                type="text"
                required
                placeholder="e.g. Production Cashier, Line Producer"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">₹</span>
                <input 
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-8 pl-6 pr-2.5 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

          </div>

          {/* SECTION 4: PAYMENT NOTE & ATTACHMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Payment Note */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Payment Note / Description</label>
              <textarea 
                rows={3}
                placeholder="Enter detailed payment purpose or notes..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Attachment Section */}
            <div>
              <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Attachment Section</label>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging ? 'border-blue-500 bg-blue-950/40' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.heic"
                  className="hidden"
                />
                <CloudUpload className="w-5 h-5 text-slate-400 mb-0.5" />
                <p className="text-xs font-bold text-white">Click or Drag & Drop Attachment</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Attach bills, receipts, or cheques (PDF, JPG, PNG)</p>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="p-2 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200 truncate">{file.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({file.size})</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Form Submit Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button 
              type="submit"
              className="h-8 px-5 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Submit Expense Booking
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
