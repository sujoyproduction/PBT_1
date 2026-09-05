import { useState, useMemo, useRef, useEffect, MouseEvent, TouchEvent, KeyboardEvent, FormEvent } from 'react';
import { saveDocData, subscribeDoc } from '../services/firebaseService';
import { DBLog, Expense, Project } from '../types';
import { 
  DollarSign, 
  Search, 
  PlusCircle, 
  Info, 
  History, 
  CheckCircle, 
  CreditCard, 
  BookOpen, 
  Key, 
  PenTool, 
  Printer, 
  Sparkles,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  Check,
  Database,
  X
} from 'lucide-react';

interface CashierConsoleViewProps {
  projects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onAddLog: (log: DBLog) => void;
  onNavigateToLogs?: () => void;
}

interface LocalVoucher {
  id: string;
  code: string;
  title: string;
  amount: number;
  dept: string;
  payee: string;
  status: 'Pending' | 'Paid';
  priority: 'High' | 'Normal';
  date: string;
  taxId: string;
  reference: string;
  description: string;
  approvedBy: string[];
}

export default function CashierConsoleView({ 
  projects = [], 
  selectedProjectId, 
  onSelectProject, 
  onAddLog, 
  onNavigateToLogs 
}: CashierConsoleViewProps) {
  const activeProject = useMemo(() => {
    return projects.find(p => 
      p.id === selectedProjectId || 
      p.id.replace(/^wp_/, '') === (selectedProjectId || '').replace(/^wp_/, '') || 
      p.id.toLowerCase() === (selectedProjectId || '').toLowerCase()
    ) || projects[0];
  }, [projects, selectedProjectId]);

  // Cashier balance state
  const [cashBalance, setCashBalance] = useState<number>(0);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local vouchers queue list
  const [vouchers, setVouchers] = useState<LocalVoucher[]>([]);

  // Subscribe to Cashier Data from Firestore Server
  useEffect(() => {
    const unsub = subscribeDoc<any>('settings', 'cashier_data', (data) => {
      if (data) {
        if (typeof data.cashBalance === 'number') setCashBalance(data.cashBalance);
        if (Array.isArray(data.vouchers)) setVouchers(data.vouchers);
      }
    });
    return () => unsub();
  }, []);

  // Selected voucher ID
  const [selectedId, setSelectedId] = useState<string>('');

  // Find currently selected voucher
  const selectedVoucher = useMemo(() => {
    return vouchers.find(v => v.id === selectedId) || vouchers.find(v => v.status === 'Pending') || null;
  }, [vouchers, selectedId]);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'ACH' | 'PettyCash' | 'Credit'>('PettyCash');

  // PIN Input values (4 boxes)
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Signature Canvas drawing states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSigned, setHasSigned] = useState<boolean>(false);

  // Modal / overlay success states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<boolean>(false);
  const [justDisbursedVoucher, setJustDisbursedVoucher] = useState<LocalVoucher | null>(null);

  // New manual entry form states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDept, setNewDept] = useState<string>('Manufacturing');
  const [newPayee, setNewPayee] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'High' | 'Normal'>('Normal');

  // Filtered Vouchers queue
  const filteredVouchers = useMemo(() => {
    if (!searchQuery.trim()) return vouchers;
    return vouchers.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.dept.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vouchers, searchQuery]);

  // Setup Canvas context on render or select
  useEffect(() => {
    if (selectedVoucher) {
      clearSignature();
    }
  }, [selectedId]);

  // Auto-focus PIN boxes
  const handlePinChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.substring(val.length - 1);
    }
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);

    // auto focus next
    if (val && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      pinRefs[index - 1].current?.focus();
    }
  };

  // Canvas Drawing Handlers (mouse & touch)
  const getCoordinates = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if it's touch or mouse event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#0058be';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // Fund Petty Cash account
  const handleFundPettyCash = () => {
    const amt = prompt('Enter the amount in INR to fund petty cash account:', '50000');
    if (amt) {
      const parsed = parseFloat(amt);
      if (!isNaN(parsed) && parsed > 0) {
        const newBal = cashBalance + parsed;
        setCashBalance(newBal);
        saveDocData('settings', 'cashier_data', { cashBalance: newBal, vouchers });
        
        // Add log
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        onAddLog({
          id: `l_fund_cash_${Date.now()}`,
          timestamp,
          action: 'SQL_PETTY_CASH_FUNDING',
          sqlQuery: `INSERT INTO petty_cash_ledger (disbursement_type, amount, updated_by, status) VALUES ('FUNDING', ${parsed}, 'CASHIER_MANAGER', 'COMPLETED');`,
          status: 'success'
        });
      }
    }
  };

  // Disburse action handler
  const handleConfirmDisbursement = () => {
    if (!selectedVoucher) return;

    // PIN check
    const enteredPin = pin.join('');
    if (enteredPin.length < 4) {
      alert('Verification Error: Please enter your 4-digit cashier authorization PIN.');
      return;
    }

    // Verify signature drawn
    if (!hasSigned) {
      alert('Verification Error: Payee electronic signature is required on the tablet before disbursement.');
      return;
    }

    // Balance check if petty cash is chosen
    if (paymentMethod === 'PettyCash' && cashBalance < selectedVoucher.amount) {
      alert(`Insufficient Petty Cash funds: The voucher amount (₹${selectedVoucher.amount.toLocaleString()}) exceeds your current register balance (₹${cashBalance.toLocaleString()}). Please fund the account or choose another payment method.`);
      return;
    }

    // Perform balance deduction if using petty cash
    const newBal = paymentMethod === 'PettyCash' ? cashBalance - selectedVoucher.amount : cashBalance;
    if (paymentMethod === 'PettyCash') {
      setCashBalance(newBal);
    }

    // Update local status
    const updatedVouchers = vouchers.map(v => {
      if (v.id === selectedVoucher.id) {
        return { ...v, status: 'Paid' as const };
      }
      return v;
    });
    setVouchers(updatedVouchers);
    setJustDisbursedVoucher(selectedVoucher);

    saveDocData('settings', 'cashier_data', { cashBalance: newBal, vouchers: updatedVouchers });

    // Create database audit log
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sqlQuery = `BEGIN TRANSACTION;
UPDATE petty_cash_ledger SET cash_balance = cash_balance - ${selectedVoucher.amount} WHERE account_id = 'register_402';
UPDATE expenses SET status = 'Paid', disburse_method = '${paymentMethod}', transaction_hash = 'sha256_${Math.random().toString(36).substring(2, 10)}' WHERE voucher_code = '${selectedVoucher.code}';
INSERT INTO ledger_audit (voucher_code, amount, disburse_method, cashier_id, signed_hash) VALUES ('${selectedVoucher.code}', ${selectedVoucher.amount}, '${paymentMethod}', 'cashier_402', 'sig_v24_verified');
COMMIT;`;

    onAddLog({
      id: `l_disb_${Date.now()}`,
      timestamp,
      action: 'SQL_DISBURSE_FUNDS_TRANSACTION',
      sqlQuery,
      status: 'success'
    });

    // Clear PIN fields
    setPin(['', '', '', '']);

    // Show Success Modal
    setShowSuccessOverlay(true);
  };

  // Create custom voucher form submit
  const handleCreateVoucher = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPayee.trim() || !newAmount) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newVou: LocalVoucher = {
      id: `vou_${Date.now()}`,
      code: `VOU-${randomNum}-${newDept === 'Manufacturing' ? 'PRD' : newDept === 'Operations' ? 'OPS' : 'ADM'}`,
      title: newTitle.trim(),
      amount: parseFloat(newAmount) || 0,
      dept: newDept,
      payee: newPayee.trim(),
      status: 'Pending',
      priority: newPriority,
      date: new Date().toLocaleString(),
      taxId: `TAX-ID-${Math.floor(10000 + Math.random() * 90000)}-Z`,
      reference: `INV-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      description: newDesc.trim() || 'Custom cashier console disbursement voucher approved for immediate petty cash release.',
      approvedBy: ['Sarah Jenkins (Finance Controller)']
    };

    setVouchers(prev => [newVou, ...prev]);
    setSelectedId(newVou.id);
    setShowCreateModal(false);

    // Reset inputs
    setNewTitle('');
    setNewAmount('');
    setNewPayee('');
    setNewDesc('');
    setNewPriority('Normal');

    // Audit log
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    onAddLog({
      id: `l_vou_create_${Date.now()}`,
      timestamp,
      action: 'SQL_CREATE_VOUCHER_ENTRY',
      sqlQuery: `INSERT INTO expenses (id, title, amount, payee, status, voucher_code) VALUES ('${newVou.id}', '${newVou.title.replace(/'/g, "''")}', ${newVou.amount}, '${newVou.payee.replace(/'/g, "''")}', 'Pending', '${newVou.code}');`,
      status: 'info'
    });
  };

  // Quick reset vouchers queue state
  const handleResetVouchers = () => {
    setVouchers([]);
    setCashBalance(0);
    saveDocData('settings', 'cashier_data', { cashBalance: 0, vouchers: [] });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300 text-slate-100 font-sans">
      
      {/* Top Stat Dashboard Subheader Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 mb-0.5 font-sans">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">{activeProject?.name || 'SECURE DISBURSEMENT VM'}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">SECURE DISBURSEMENT VM</span>
          </div>
          <h2 className="text-base font-bold font-sans text-white tracking-tight">Production Cashier Console</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Evaluate, verify credentials, obtain signatures and release petty cash funds for approved logistics vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cash balance display block */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-lg">
            <div className="text-right">
              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Cash Register 402</span>
              <span className="text-base font-extrabold font-mono text-emerald-400 block leading-tight">
                ₹{cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <button 
                onClick={handleFundPettyCash}
                className="h-6 px-2 bg-blue-600 hover:bg-blue-500 text-white font-sans text-[10px] font-bold rounded flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <DollarSign className="w-3 h-3" />
                Fund Register
              </button>
              <button 
                onClick={handleResetVouchers}
                className="text-[9px] font-mono text-slate-400 hover:text-rose-400 text-right underline cursor-pointer"
              >
                Reset Queue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual Pane Layout matching production mockup */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        
        {/* Left Side: Vouchers list queue */}
        <div className="w-full md:w-[340px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-0 shadow-2xs">
          
          {/* Header & Filter */}
          <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Approved Voucher Queue</h3>
              <span className="bg-amber-950/80 text-amber-400 border border-amber-900/60 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                {vouchers.filter(v => v.status === 'Pending').length} Active
              </span>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-1 hover:bg-slate-700 text-blue-400 rounded transition-colors"
              title="Add Manual Entry Voucher"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Search Voucher Bar */}
          <div className="p-2 border-b border-slate-800 bg-slate-900">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search payees, vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scrolling queue list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5 custom-scrollbar">
            {filteredVouchers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-sans text-xs">
                No matching vouchers found in register queue.
              </div>
            ) : (
              filteredVouchers.map((vou) => {
                const isActive = selectedVoucher?.id === vou.id;
                const isPaid = vou.status === 'Paid';

                return (
                  <div 
                    key={vou.id}
                    onClick={() => { if (!isPaid) setSelectedId(vou.id); }}
                    className={`p-2.5 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isPaid 
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-50 cursor-not-allowed'
                        : isActive 
                        ? 'bg-blue-950/40 border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                        : 'hover:bg-slate-800/50 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-mono text-[9px] font-extrabold ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                        #{vou.code}
                      </span>
                      {isPaid ? (
                        <span className="text-[8px] font-mono font-bold bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/60 uppercase">
                          Paid & Signed
                        </span>
                      ) : (
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          vou.priority === 'High' 
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-900/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {vou.priority} Priority
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white font-sans mb-1 truncate">{vou.title}</h4>
                    
                    <div className="flex justify-between items-end text-xs">
                      <div className="text-[10px] text-slate-400 space-y-0.5 min-w-0 flex-1 pr-2">
                        <p className="truncate">Payee: {vou.payee}</p>
                        <p>Dept: {vou.dept}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold font-mono text-white">
                          ₹{vou.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">INR</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Voucher detailed specification & release controller */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0 shadow-2xs">
          
          {selectedVoucher ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
              
              {/* Detailed Header block */}
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-950/80 border border-blue-900/60 text-blue-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      #{selectedVoucher.code}
                    </span>
                    <span className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Created: {selectedVoucher.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold font-sans text-white leading-snug">
                    {selectedVoucher.title} disbursement
                  </h3>
                </div>

                <div className="text-right bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 shrink-0">
                  <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Disbursement Amount Due</span>
                  <span className="text-lg font-extrabold font-mono text-white block leading-none">
                    ₹{selectedVoucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Layout Content Specifications split */}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                
                {/* Specs and flows */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  
                  {/* Voucher Spec sheet */}
                  <div className="border border-slate-800 p-3.5 rounded-xl bg-slate-800/30">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      Specification Ledger
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-3 text-xs font-sans">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Payee Legal Name</span>
                        <span className="font-semibold text-slate-200">{selectedVoucher.payee}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Production Department</span>
                        <span className="font-semibold text-slate-200">{selectedVoucher.dept}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Tax Registration ID</span>
                        <span className="font-mono font-semibold text-slate-200">{selectedVoucher.taxId}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block uppercase">Bill Reference No.</span>
                        <span className="font-mono font-semibold text-slate-200">{selectedVoucher.reference}</span>
                      </div>

                      <div className="sm:col-span-2 pt-2 border-t border-slate-800 mt-1">
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-0.5">Disbursement Description</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {selectedVoucher.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Flow of Approvals timeline */}
                  <div className="border border-slate-800 p-3.5 rounded-xl bg-slate-800/20">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      Approved Workflow Trace
                    </h4>

                    <div className="space-y-2 font-sans">
                      {selectedVoucher.approvedBy.map((appPerson, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="w-4 h-4 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/60 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">Approval Confirmed</p>
                            <p className="text-[10px] text-slate-400">Sign-off received from: {appPerson}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Disbursement payment execution panel */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  
                  {/* Select Payment Method */}
                  <div className="border border-slate-800 p-3 rounded-xl bg-slate-800/40">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Disbursement Protocol
                    </h4>

                    <div className="space-y-1.5">
                      <label className={`flex items-center gap-2.5 p-2 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'PettyCash' ? 'border-blue-500 bg-blue-950/40' : 'border-slate-800 hover:border-slate-700'
                      }`}>
                        <input 
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'PettyCash'}
                          onChange={() => setPaymentMethod('PettyCash')}
                          className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-semibold text-white">Petty Cash</span>
                          <span className="text-[9px] text-slate-400">In-Hand Cashier Fund Release</span>
                        </div>
                        <DollarSign className="w-4 h-4 text-emerald-400 ml-auto" />
                      </label>

                      <label className={`flex items-center gap-2.5 p-2 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'ACH' ? 'border-blue-500 bg-blue-950/40' : 'border-slate-800 hover:border-slate-700'
                      }`}>
                        <input 
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'ACH'}
                          onChange={() => setPaymentMethod('ACH')}
                          className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-semibold text-white">Bank Transfer</span>
                          <span className="text-[9px] text-slate-400">Direct ACH / Wired Wire</span>
                        </div>
                        <CreditCard className="w-4 h-4 text-slate-400 ml-auto" />
                      </label>

                      <label className={`flex items-center gap-2.5 p-2 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'Credit' ? 'border-blue-500 bg-blue-950/40' : 'border-slate-800 hover:border-slate-700'
                      }`}>
                        <input 
                          type="radio"
                          name="pay_method"
                          checked={paymentMethod === 'Credit'}
                          onChange={() => setPaymentMethod('Credit')}
                          className="w-3.5 h-3.5 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex flex-col text-xs leading-tight">
                          <span className="font-semibold text-white">Corporate Line of Credit</span>
                          <span className="text-[9px] text-slate-400">Lock on Corporate Card account</span>
                        </div>
                        <Key className="w-4 h-4 text-slate-400 ml-auto" />
                      </label>
                    </div>
                  </div>

                  {/* Cashier Verification PIN & drawing board signature */}
                  <div className="border border-slate-800 p-3.5 rounded-xl bg-slate-800/40 space-y-3">
                    
                    {/* Security PIN code */}
                    <div>
                      <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Cashier Release authorization PIN
                      </span>
                      <div className="flex items-center gap-2">
                        {pin.map((digit, i) => (
                          <input 
                            key={i}
                            ref={pinRefs[i]}
                            type="password"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePinChange(i, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(i, e)}
                            placeholder="•"
                            className="w-7 h-8 text-center bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ))}
                        <span className="text-[9px] font-mono text-slate-400 ml-1">Default: 1234</span>
                      </div>
                    </div>

                    {/* Interactive Electronic Signature Pad */}
                    <div>
                      <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Payee Legal signature confirmation tablet
                      </span>
                      <div className="relative border border-slate-700 rounded-lg bg-slate-800 overflow-hidden shadow-inner h-20 group">
                        
                        {!hasSigned && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-slate-400 italic font-mono select-none">
                            Drag or draw signature here
                          </div>
                        )}

                        <canvas 
                          ref={canvasRef}
                          width={240}
                          height={80}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[8px] text-slate-400 font-mono">Confirmed via touch/mouse</p>
                        <button 
                          type="button"
                          onClick={clearSignature}
                          className="text-[9px] font-mono text-rose-400 hover:underline cursor-pointer"
                        >
                          Clear Signature
                        </button>
                      </div>
                    </div>

                    {/* Disburse confirmation submit */}
                    <button 
                      onClick={handleConfirmDisbursement}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Disburse Approved Funds
                    </button>

                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 font-sans text-xs flex flex-col items-center justify-center h-full">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="font-semibold text-white">No Active Pending Vouchers</p>
              <p className="max-w-xs mt-1 text-slate-400">All approved expenditure vouchers have been finalized or disbursed.</p>
            </div>
          )}

        </div>

      </div>

      {/* SUCCESS OVERLAY POPUP */}
      {showSuccessOverlay && justDisbursedVoucher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-center text-slate-100">
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-900/60 shadow-2xs">
              <Check className="w-5 h-5" />
            </div>

            <h3 className="font-sans text-sm font-bold text-white">Disbursement Successful</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Voucher <strong className="font-mono text-white">#{justDisbursedVoucher.code}</strong> for <strong className="text-white">₹{justDisbursedVoucher.amount.toLocaleString()}</strong> has been finalized.
            </p>

            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 my-3 text-left font-mono text-[10px] text-slate-400 max-h-24 overflow-y-auto">
              <p className="text-white font-bold uppercase mb-0.5">Receipt Hash Key Generated</p>
              <p className="break-all font-mono">0x{Math.random().toString(36).substring(2, 15)}{Math.random().toString(36).substring(2, 15)}</p>
            </div>

            <button 
              onClick={() => {
                setShowSuccessOverlay(false);
                setJustDisbursedVoucher(null);
              }}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
            >
              Back to Queue
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ENTRY CREATION MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleCreateVoucher}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100"
          >
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Authorize Manual Petty Cash Voucher
              </h3>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-left text-xs">
              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Voucher Subject / Item Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Snack craft catering line B"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Disbursing Amount (₹)</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 3500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full h-8 px-3 bg-slate-800 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Production Department</label>
                  <select 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 text-xs text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option>Manufacturing</option>
                    <option>Operations</option>
                    <option>Administration</option>
                    <option>Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Legal Payee Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Smith Supplies Corp"
                  value={newPayee}
                  onChange={(e) => setNewPayee(e.target.value)}
                  className="w-full h-8 px-3 bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold font-mono text-slate-300 uppercase mb-1 block">Payment Specifications & Notes</label>
                <textarea 
                  placeholder="Describe justification or billing breakdown details for immediate in-hand release..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-16 p-2 bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-lg focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <span className="text-[10px] font-bold font-mono text-slate-300 uppercase">Voucher Priority</span>
                <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-200">
                  <input 
                    type="radio" 
                    name="new_priority" 
                    checked={newPriority === 'Normal'} 
                    onChange={() => setNewPriority('Normal')} 
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-200">
                  <input 
                    type="radio" 
                    name="new_priority" 
                    checked={newPriority === 'High'} 
                    onChange={() => setNewPriority('High')} 
                  />
                  <span className="text-rose-400 font-bold">High</span>
                </label>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-800/60 border-t border-slate-800 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                Create Voucher
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
