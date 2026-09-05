import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  UserCheck,
  Check,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export interface RoleApprovalItem {
  role: string;
  status: 'SEND' | 'PENDING' | 'WAITING' | 'APPROVED' | 'CREATOR' | '';
  approvedBy?: string;
  approvedAt?: string;
}

export interface BudgetVersionRecord {
  id: string;
  versionName: string; // e.g. "AUTO-VRSNXVBSA000001"
  versionNumber: number;
  projectId: string;
  creatorRole: string; // e.g. "Production Manager" or "Executive Producer"
  creatorName: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved';
  totalAmount: number;
  approvals: RoleApprovalItem[];
  createdAt: string;
  approvedAt?: string;
}

// Standard ordered list of budget approval roles as shown in requirements
export const STANDARD_APPROVAL_ROLES = [
  'PRODUCER',
  'ASSOCIATE PRODUCER',
  'EXECUTIVE PRODUCER',
  'COMMERCIAL HEAD',
  'HEAD ACCOUNTANT',
  'PRODUCTION CONTROLLER',
  'PRODUCTION MANAGER'
];

interface BudgetApprovalWidgetProps {
  currentVersion: BudgetVersionRecord;
  lastApprovedVersion?: BudgetVersionRecord;
  activeRoleName?: string;
  onSendApproval: (targetRole?: string) => void;
  onApproveRole: (targetRole: string) => void;
  onSendAllApprovals: () => void;
}

export default function BudgetApprovalWidget({
  currentVersion,
  lastApprovedVersion,
  activeRoleName = 'Production Manager',
  onSendApproval,
  onApproveRole,
  onSendAllApprovals
}: BudgetApprovalWidgetProps) {
  const [selectedRoleToSimulate, setSelectedRoleToSimulate] = useState<string>('');

  const isFullyApproved = currentVersion.status === 'Approved' || 
    (currentVersion.approvals.length > 0 && 
     currentVersion.approvals.filter(a => a.status === 'SEND' || a.status === 'PENDING' || a.status === 'WAITING').length === 0 &&
     currentVersion.approvals.some(a => a.status === 'APPROVED'));

  const pendingCount = currentVersion.approvals.filter(a => a.status === 'PENDING' || a.status === 'WAITING').length;
  const sendCount = currentVersion.approvals.filter(a => a.status === 'SEND').length;
  const approvedCount = currentVersion.approvals.filter(a => a.status === 'APPROVED').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-col gap-3 animate-in fade-in duration-200">
      
      {/* Widget Header & Active Version Badge */}
      <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h4 className="font-sans text-xs font-extrabold uppercase tracking-tight text-white">
              Budget Approval & Status
            </h4>
          </div>
          {isFullyApproved ? (
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono text-[9px] font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              APPROVED
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/80 font-mono text-[9px] font-bold rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              PENDING REVIEW
            </span>
          )}
        </div>

        {/* Version Code Display */}
        <div className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono font-bold uppercase text-slate-400">ACTIVE VERSION CODE</p>
            <p className="font-mono text-xs font-bold text-white tracking-wide">
              {currentVersion.versionName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono font-bold uppercase text-slate-400">PROPOSED TOTAL</p>
            <p className="font-mono text-xs font-bold text-blue-400">
              ₹{currentVersion.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Created By: <strong className="text-slate-200">{currentVersion.creatorRole}</strong></span>
          <span>{currentVersion.createdAt}</span>
        </div>
      </div>

      {/* Quick Action Bar to Send All */}
      {sendCount > 0 && !isFullyApproved && (
        <button
          onClick={onSendAllApprovals}
          className="w-full h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-sans rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <Send className="w-3.5 h-3.5" />
          Send For Approval To All Roles ({sendCount})
        </button>
      )}

      {/* Role Approval Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-800 font-extrabold text-slate-300 font-mono text-[10px] uppercase">
              <th className="py-2 px-3 border-r border-slate-800 w-2/3">ROLE</th>
              <th className="py-2 px-3 w-1/3 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-semibold text-white">
            {currentVersion.approvals.map((item, idx) => {
              const isCreator = item.status === 'CREATOR' || item.role.toLowerCase() === currentVersion.creatorRole.toLowerCase();

              return (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  {/* ROLE COLUMN */}
                  <td className="py-2 px-3 border-r border-slate-800 font-bold uppercase tracking-tight text-[10px] text-slate-200">
                    {item.role}
                    {isCreator && (
                      <span className="ml-1.5 text-[8px] font-mono font-normal text-slate-400">
                        (CREATOR)
                      </span>
                    )}
                  </td>

                  {/* STATUS COLUMN */}
                  <td className="py-2 px-2 text-center align-middle">
                    {item.status === 'SEND' ? (
                      <button
                        onClick={() => onSendApproval(item.role)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-extrabold uppercase rounded shadow-xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer active:scale-95"
                        title={`Send notification to ${item.role}`}
                      >
                        <Send className="w-2.5 h-2.5" />
                        SEND
                      </button>
                    ) : (item.status === 'PENDING' || item.status === 'WAITING') ? (
                      <button
                        onClick={() => onApproveRole(item.role)}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-emerald-600 text-white text-[9px] font-extrabold uppercase rounded shadow-xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer active:scale-95 group"
                        title={`Click to grant approval as ${item.role}`}
                      >
                        <Clock className="w-2.5 h-2.5 group-hover:hidden" />
                        <Check className="w-2.5 h-2.5 hidden group-hover:inline-block" />
                        <span className="group-hover:hidden">PENDING</span>
                        <span className="hidden group-hover:inline-block">APPROVE?</span>
                      </button>
                    ) : item.status === 'APPROVED' ? (
                      <span className="px-2 py-0.5 text-emerald-400 font-extrabold font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        APPROVED
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-[10px]">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Switcher / Simulator */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-2 flex flex-col gap-1.5 text-[11px]">
        <div className="flex items-center justify-between text-slate-400 font-mono font-bold text-[9px]">
          <span>SIMULATE APPROVER ROLE</span>
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={selectedRoleToSimulate}
            onChange={(e) => setSelectedRoleToSimulate(e.target.value)}
            className="flex-1 h-7 bg-slate-900 border border-slate-700 rounded px-2 text-[10px] font-semibold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">-- Select Approver Role --</option>
            {currentVersion.approvals
              .filter(a => a.status === 'PENDING' || a.status === 'WAITING')
              .map((a, i) => (
                <option key={i} value={a.role}>
                  Approve as {a.role}
                </option>
              ))}
          </select>
          <button
            disabled={!selectedRoleToSimulate}
            onClick={() => {
              if (selectedRoleToSimulate) {
                onApproveRole(selectedRoleToSimulate);
                setSelectedRoleToSimulate('');
              }
            }}
            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-[9px] uppercase rounded transition-all cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Approve
          </button>
        </div>
      </div>

      {/* Approved Baseline Note */}
      {lastApprovedVersion && (
        <div className="bg-emerald-950/80 border border-emerald-800/80 p-2.5 rounded-lg flex flex-col gap-1 text-[11px]">
          <p className="text-[10px] font-mono font-bold text-emerald-300 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Active Approved Budget Baseline
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="font-bold text-emerald-100">{lastApprovedVersion.versionName}</span>
            <span className="font-extrabold text-emerald-400">₹{lastApprovedVersion.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

    </div>
  );
}
