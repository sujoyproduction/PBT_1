import React, { useState } from 'react';
import {
  Share2,
  Mail,
  Copy,
  Check,
  Send,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Users,
  Utensils,
  Sun,
  ShieldAlert,
  Download,
  Printer,
  ExternalLink,
  MessageSquare,
  Building,
  Film,
  Camera
} from 'lucide-react';
import { Project } from '../types';

export interface CallSheetDsrDispatcherProps {
  project?: Project;
  dsrData?: any;
  callSheetData?: any;
  onClose?: () => void;
}

export default function CallSheetDsrDispatcher({
  project,
  dsrData,
  callSheetData,
  onClose
}: CallSheetDsrDispatcherProps) {
  const [dispatchMode, setDispatchMode] = useState<'call_sheet' | 'dsr'>('call_sheet');
  const [targetChannel, setTargetChannel] = useState<'whatsapp' | 'email' | 'clipboard' | 'print'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Default Call Sheet Content
  const shootDay = callSheetData?.shootDay || dsrData?.dayNumber || 'Day 01';
  const shootDate = callSheetData?.date || dsrData?.date || new Date().toISOString().substring(0, 10);
  const projectTitle = project?.name || 'PRODUCTION WORKSPACE';
  const callTime = callSheetData?.generalCall || '07:00 AM';
  const breakfastTime = callSheetData?.breakfastTime || '07:15 AM';
  const firstShotTime = callSheetData?.firstShotTime || '08:00 AM';
  const locationName = callSheetData?.location || (project as any)?.location || 'Main Stage / Set';
  const locationMapLink = callSheetData?.mapLink || '';
  const weather = callSheetData?.weather || 'Clear';
  const hospital = callSheetData?.nearestHospital || 'Emergency: 108 / Local Medical Center';

  // Build WhatsApp formatted Call Sheet message
  const generateCallSheetWhatsApp = () => {
    return `🎬 *${projectTitle.toUpperCase()}*
📋 *DAILY CALL SHEET — ${shootDay.toUpperCase()}*
🗓️ *Date:* ${shootDate}

━━━━━━━━━━━━━━━━━━━━
⏰ *UNIT TIMINGS*
• Unit Call: *${callTime}*
• Breakfast: *${breakfastTime}*
• First Shot: *${firstShotTime}*
• Lunch: *01:30 PM (45 Mins)*
• Pack-up Target: *${callSheetData?.estimatedWrap || '07:00 PM'}*

📍 *LOCATION & DIRECTIONS*
• Location: *${locationName}*
${locationMapLink ? `• Google Maps: ${locationMapLink}\n` : ''}
🌤️ *WEATHER & SET CONDITIONS*
• ${weather}

🚨 *EMERGENCY & SAFETY*
• Nearest Medical Facility: ${hospital}
• Production Contact: ${(project as any)?.leadProducer || (project as any)?.directorName || 'Production Desk'}

${customNotes ? `📌 *SPECIAL INSTRUCTIONS:*\n${customNotes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
_Generated via Production Budget & Ledger Hub_`;
  };

  // Build WhatsApp formatted DSR message
  const generateDsrWhatsApp = () => {
    const scenesDone = dsrData?.scenesCompleted || '0';
    const totalSetUps = dsrData?.totalSetups || '0 Setups';
    const rawFootage = dsrData?.rawFootageDuration || '0 Mins';
    const cateringCount = dsrData?.totalCateringCount || '0 Meals';
    const dayOutflow = typeof dsrData?.totalDayExpense === 'number' 
      ? `₹${dsrData.totalDayExpense.toLocaleString('en-IN')}` 
      : dsrData?.dayCost 
        ? `₹${Number(dsrData.dayCost).toLocaleString('en-IN')}` 
        : '₹0';

    return `🎬 *${projectTitle.toUpperCase()}*
📊 *DAILY SHOOTING REPORT (DSR) — ${shootDay.toUpperCase()}*
🗓️ *Date:* ${shootDate}

━━━━━━━━━━━━━━━━━━━━
⏱️ *SCHEDULE & PROGRESS*
• Unit Call: *${dsrData?.unitCall || '07:00 AM'}*
• First Shot: *${dsrData?.firstShot || '08:00 AM'}*
• Wrap Time: *${dsrData?.wrapTime || '07:00 PM'}*
• Scenes Shot: *${scenesDone}*
• Setups Completed: *${totalSetUps}*
• Raw Footage: *${rawFootage}*

👥 *CREW & CATERING*
• Headcount / Meals: *${cateringCount}*

💰 *DAILY EXPENSE SUMMARY*
• Total Day Outflow: *${dayOutflow}*

${dsrData?.notes ? `📝 *PRODUCTION NOTES*\n• ${dsrData.notes}\n` : ''}
${customNotes ? `• ${customNotes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
_Production Control Desk • Confidential DSR_`;
  };

  const currentMessage = dispatchMode === 'call_sheet' ? generateCallSheetWhatsApp() : generateDsrWhatsApp();

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(currentMessage);
    const url = whatsappPhone 
      ? `https://api.whatsapp.com/send?phone=${whatsappPhone.replace(/[^0-9]/g, '')}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[${projectTitle}] ${dispatchMode === 'call_sheet' ? 'CALL SHEET' : 'DAILY SHOOTING REPORT'} - ${shootDay} (${shootDate})`);
    const body = encodeURIComponent(currentMessage);
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden font-sans text-slate-100 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              CALL SHEET &amp; DSR DISPATCHER
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                WhatsApp &amp; Email Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              One-click instant formatted distribution for HODs, Cast, Crew and Executive Producers.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setDispatchMode('call_sheet')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dispatchMode === 'call_sheet'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Call Sheet Dispatch
          </button>
          <button
            onClick={() => setDispatchMode('dsr')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              dispatchMode === 'dsr'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> DSR Summary Dispatch
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Left Column: Config & Action Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Send className="w-4 h-4 text-emerald-400" /> Dispatch Channels
            </div>

            {/* Channel Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTargetChannel('whatsapp')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                  targetChannel === 'whatsapp'
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold">WhatsApp</div>
                  <div className="text-[10px] text-slate-400">Direct / Group Share</div>
                </div>
              </button>

              <button
                onClick={() => setTargetChannel('email')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                  targetChannel === 'email'
                    ? 'bg-blue-950/80 border-blue-700 text-blue-300 ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-bold">Email Blast</div>
                  <div className="text-[10px] text-slate-400">Formatted mailto</div>
                </div>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 text-left flex items-center gap-2 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <div>
                  <div className="text-xs font-bold">{copied ? 'Copied!' : 'Copy Text'}</div>
                  <div className="text-[10px] text-slate-400">Copy to Clipboard</div>
                </div>
              </button>

              <button
                onClick={handlePrint}
                className="p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 text-left flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-bold">Print / PDF</div>
                  <div className="text-[10px] text-slate-400">Standard layout</div>
                </div>
              </button>
            </div>

            {/* Target Channel Specific Inputs */}
            {targetChannel === 'whatsapp' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Target Phone Number (Optional - leave empty for WhatsApp Web/App picker)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98200 12345 or HOD Group"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch via WhatsApp
                </button>
              </div>
            )}

            {targetChannel === 'email' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Recipient Emails (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="director@studio.com, dop@production.com, ep@film.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={handleSendEmail}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" /> Open Email Client
                </button>
              </div>
            )}

            {/* Custom Notes Injector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400">
                Add Special Instructions / Director Note
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Please bring wet-weather gear. Sound dept requested absolute silence at 07:30 AM."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Formatted Preview */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Live Formatted Message Preview
            </div>
            <button
              onClick={handleCopyClipboard}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar border-l-4 border-l-emerald-500">
            {currentMessage}
          </div>
        </div>
      </div>
    </div>
  );
}
