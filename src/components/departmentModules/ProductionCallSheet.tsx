import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Clock, 
  MapPin, 
  Phone, 
  Send, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle,
  Sun,
  ShieldCheck,
  Sparkles,
  Share2
} from 'lucide-react';
import { Project } from '../../types';
import { subscribeDoc, saveDocData } from '../../services/firebaseService';

interface ProductionCallSheetProps {
  project?: Project;
}

export interface CallSheetData {
  callSheetNo: string;
  shootDate: string;
  shootDayNo: number;
  totalDays: number;
  unit: string;
  projectName: string;
  producer: string;
  director: string;
  firstAD: string;
  productionManager: string;
  
  generalCrewCall: string;
  breakfastCall: string;
  readyToShoot: string;
  estWrap: string;
  
  weather: string;
  sunrise: string;
  sunset: string;
  
  shootLocation: string;
  stageName: string;
  parkingLocation: string;
  baseCamp: string;
  
  nearestHospital: {
    name: string;
    address: string;
    phone: string;
    medicName: string;
  };
  
  castCalls: Array<{
    id: string;
    castNo: string;
    characterName: string;
    actorName: string;
    pickupTime: string;
    makeupCall: string;
    onSetCall: string;
    scenes: string;
    notes: string;
  }>;
  
  deptCalls: Array<{
    department: string;
    callTime: string;
    headCount: number;
    specialInstructions: string;
  }>;
  
  advanceSchedule: string;
  safetyNotes: string;
}

const DEFAULT_CALL_SHEET: CallSheetData = {
  callSheetNo: 'CS-012',
  shootDate: new Date().toISOString().substring(0, 10),
  shootDayNo: 12,
  totalDays: 35,
  unit: 'Main Unit',
  projectName: 'Master Chef - Bengali Kitchen Live',
  producer: 'Roy & Mitra Motion Pictures',
  director: 'Sujoy Ghosh',
  firstAD: 'Ananya Roy (+91-98300-11223)',
  productionManager: 'Subhashish Das (+91-98311-44556)',
  
  generalCrewCall: '06:30 AM',
  breakfastCall: '06:45 AM',
  readyToShoot: '08:00 AM',
  estWrap: '07:30 PM',
  
  weather: 'Sunny & Clear (Max 31°C / Min 22°C)',
  sunrise: '05:42 AM',
  sunset: '06:18 PM',
  
  shootLocation: 'Technicians Studio 2, Tollygunge, Kolkata',
  stageName: 'Floor 3 (Grand Arena)',
  parkingLocation: 'Gate 2 Rear Parking Lot for Unit Vehicles & Vanity Vans',
  baseCamp: 'Gate 2 Lawn Tent',
  
  nearestHospital: {
    name: 'AMRI Hospitals / M.R. Bangur Super Speciality',
    address: 'Deshapran Sasmal Rd, Tollygunge, Kolkata - 700033',
    phone: '+91-33-2422-0000 / Emergency 108',
    medicName: 'Dr. A. Banerjee, On-Set Paramedic (+91-98765-12345)'
  },
  
  castCalls: [
    {
      id: 'c1',
      castNo: '1',
      characterName: 'Grand Host / Anchor',
      actorName: 'Parambrata Chatterjee',
      pickupTime: '06:00 AM',
      makeupCall: '06:45 AM',
      onSetCall: '07:45 AM',
      scenes: 'SC-42, SC-44',
      notes: 'Custom Navy Blue Tuxedo (Costume Dept #1)'
    },
    {
      id: 'c2',
      castNo: '2',
      characterName: 'Master Judge #1',
      actorName: 'Chef Sanjeev / Special Guest',
      pickupTime: '06:30 AM',
      makeupCall: '07:15 AM',
      onSetCall: '08:15 AM',
      scenes: 'SC-42, SC-43A, SC-44',
      notes: 'Black Chef Coat with Monogram'
    },
    {
      id: 'c3',
      castNo: '3',
      characterName: 'Master Judge #2',
      actorName: 'Chef Manjit Gill',
      pickupTime: '06:30 AM',
      makeupCall: '07:30 AM',
      onSetCall: '08:15 AM',
      scenes: 'SC-42, SC-43A, SC-44',
      notes: 'Beige Kurta with Embroidered Waistcoat'
    },
    {
      id: 'c4',
      castNo: '4-7',
      characterName: 'Top 4 Finalists',
      actorName: 'Contestants (Rimi, Anirban, Suman, Priya)',
      pickupTime: '06:15 AM',
      makeupCall: '07:00 AM',
      onSetCall: '08:00 AM',
      scenes: 'SC-42, SC-43A, SC-44',
      notes: 'Aprons with Name Badges ready'
    }
  ],
  
  deptCalls: [
    { department: 'Camera & DIT', callTime: '06:15 AM', headCount: 14, specialInstructions: '5 Cameras calibrated for 4K Broadcast multi-cam sync.' },
    { department: 'Lighting & Grip', callTime: '05:45 AM', headCount: 18, specialInstructions: 'Pre-light cooking counters & overhead softboxes.' },
    { department: 'Sound / Audio', callTime: '06:30 AM', headCount: 8, specialInstructions: '12 Wireless lapels sanitized and frequency checked.' },
    { department: 'Art & Setting', callTime: '05:30 AM', headCount: 12, specialInstructions: 'Live ingredients, gas cylinders & stove safety check.' },
    { department: 'Costume & Makeup', callTime: '06:00 AM', headCount: 10, specialInstructions: 'Touch-up kits stationed in wings for all contestants.' },
    { department: 'Production & Catering', callTime: '05:30 AM', headCount: 22, specialInstructions: 'Hot breakfast buffet ready from 06:30 AM.' }
  ],
  
  advanceSchedule: 'TOMORROW (Day 13): Shoot SC-48 (Grand Finale Winner Celebration) on Stage 3. General Crew Call 07:00 AM.',
  safetyNotes: 'Mandatory Safety: Live flames in kitchen sets. No open footwear on floor. Smoking strictly in designated outdoor bays.'
};

export const ProductionCallSheet: React.FC<ProductionCallSheetProps> = ({ project }) => {
  const projectId = project?.id || 'proj_default';
  const [data, setData] = useState<CallSheetData>(DEFAULT_CALL_SHEET);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to Firebase
  useEffect(() => {
    const unsub = subscribeDoc<CallSheetData>('production_call_sheets', projectId, (docData) => {
      if (docData && docData.castCalls) {
        setData(docData);
      }
    });
    return () => unsub();
  }, [projectId]);

  const handleSave = () => {
    saveDocData('production_call_sheets', projectId, data);
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `*CALL SHEET - DAY ${data.shootDayNo}*\nProject: ${data.projectName}\nDate: ${data.shootDate}\nCrew Call: ${data.generalCrewCall} | Ready to Shoot: ${data.readyToShoot}\nLocation: ${data.shootLocation}\nEmergency Contact: ${data.nearestHospital.phone}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Daily Production Call Sheet ({data.callSheetNo})</h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Day {data.shootDayNo} of {data.totalDays} • {data.shootDate} • {data.unit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {isEditing ? 'View Mode' : 'Edit Call Sheet'}
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Copy WhatsApp / SMS summary"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copiedLink ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Call Sheet</span>
          </button>
        </div>
      </div>

      {/* CALL SHEET DOCUMENT CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl text-slate-200">
        
        {/* Header Block */}
        <div className="border-b-2 border-slate-700 pb-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-widest text-cyan-400 font-extrabold block">
                OFFICIAL PRODUCTION CALL SHEET
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">{data.projectName}</h1>
              <p className="text-xs text-slate-400">{data.producer}</p>
            </div>

            <div className="text-left md:text-right bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-sm font-extrabold text-white">SHOOT DAY {data.shootDayNo} OF {data.totalDays}</div>
              <div className="text-xs text-cyan-300 font-mono">{data.shootDate}</div>
              <div className="text-[11px] text-slate-400 font-mono">{data.unit}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono border-t border-slate-800">
            <div><span className="text-slate-500 block">Director:</span><span className="font-bold text-slate-200">{data.director}</span></div>
            <div><span className="text-slate-500 block">1st AD:</span><span className="font-bold text-slate-200">{data.firstAD}</span></div>
            <div><span className="text-slate-500 block">Production Mgr:</span><span className="font-bold text-slate-200">{data.productionManager}</span></div>
            <div><span className="text-slate-500 block">Call Sheet Ref:</span><span className="font-bold text-cyan-400">{data.callSheetNo}</span></div>
          </div>
        </div>

        {/* Master Call Timings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">General Crew Call</span>
            <span className="text-base font-black text-amber-400">{data.generalCrewCall}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Breakfast Ready</span>
            <span className="text-base font-black text-slate-200">{data.breakfastCall}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Ready to Shoot / First Shot</span>
            <span className="text-base font-black text-emerald-400">{data.readyToShoot}</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Est. Camera Wrap</span>
            <span className="text-base font-black text-cyan-400">{data.estWrap}</span>
          </div>
        </div>

        {/* Location & Hospital Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Shooting Location &amp; Base Camp</span>
            </h4>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">{data.shootLocation}</p>
              <p className="text-slate-400"><strong className="text-slate-300">Set/Stage:</strong> {data.stageName}</p>
              <p className="text-slate-400"><strong className="text-slate-300">Parking &amp; Vanity:</strong> {data.parkingLocation}</p>
            </div>
            <div className="flex gap-4 pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-850">
              <span>Weather: {data.weather}</span>
              <span>Sunrise: {data.sunrise} | Sunset: {data.sunset}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-rose-900/40 space-y-2">
            <h4 className="text-xs font-mono uppercase font-bold text-rose-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nearest Hospital &amp; Medical Emergency</span>
            </h4>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">{data.nearestHospital.name}</p>
              <p className="text-slate-400">{data.nearestHospital.address}</p>
              <p className="font-mono font-bold text-rose-300">Emergency Phone: {data.nearestHospital.phone}</p>
              <p className="text-[11px] text-slate-400">{data.nearestHospital.medicName}</p>
            </div>
          </div>
        </div>

        {/* Cast & Talent Call Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
            Talent, Host &amp; Contestant Calls
          </h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Character / Role</th>
                  <th className="px-3 py-2.5">Artist Name</th>
                  <th className="px-3 py-2.5">Pickup</th>
                  <th className="px-3 py-2.5">M/Up Call</th>
                  <th className="px-3 py-2.5">On Set</th>
                  <th className="px-3 py-2.5">Scenes</th>
                  <th className="px-3 py-2.5">Costume / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.castCalls.map(c => (
                  <tr key={c.id} className="hover:bg-slate-850/40">
                    <td className="px-3 py-2.5 font-mono text-slate-500 font-bold">{c.castNo}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{c.characterName}</td>
                    <td className="px-3 py-2.5 text-slate-300">{c.actorName}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{c.pickupTime}</td>
                    <td className="px-3 py-2.5 font-mono text-amber-400 font-bold">{c.makeupCall}</td>
                    <td className="px-3 py-2.5 font-mono text-emerald-400 font-bold">{c.onSetCall}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-300">{c.scenes}</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-400">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Specific Calls Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
            Department Crew Call Times &amp; Instructions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.deptCalls.map((dept, i) => (
              <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{dept.department}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                    {dept.callTime}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{dept.specialInstructions}</p>
                <span className="text-[10px] text-slate-500 font-mono block pt-1">Muster: {dept.headCount} Pax</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advance & Safety Footers */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block shrink-0 mt-0.5">Advance:</span>
            <p className="text-slate-300">{data.advanceSchedule}</p>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-slate-850">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block shrink-0 mt-0.5">Safety:</span>
            <p className="text-slate-400">{data.safetyNotes}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
