import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  ExternalLink, 
  Navigation, 
  Building, 
  Truck, 
  Sparkles, 
  RefreshCw, 
  Film, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Copy,
  Check,
  Compass
} from 'lucide-react';
import { Project } from '../types';

interface AIMapsLocationViewProps {
  activeProject?: Project;
}

interface GroundedPlaceSource {
  title?: string;
  uri?: string;
}

interface LocationSearchResult {
  text: string;
  sources: GroundedPlaceSource[];
  timestamp: string;
}

export default function AIMapsLocationView({ activeProject }: AIMapsLocationViewProps) {
  const [targetRegion, setTargetRegion] = useState('Mumbai, Maharashtra, India');
  const [projectType, setProjectType] = useState(activeProject?.projectType || 'Feature Film');
  const [scoutPrompt, setScoutPrompt] = useState(
    'Find premier film sound stages, post-production studio lots, and scenic heritage outdoor shooting locations with large vehicle and generator parking access'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<LocationSearchResult | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Curated location scouting presets for production teams
  const scoutPresets = [
    {
      title: 'Sound Stages & Studio Lots',
      region: 'Mumbai, India',
      prompt: 'Search for major film studios, sound stages with green screen and chroma facilities (e.g. Film City Goregaon, Yash Raj Studios, Mehboob Studio, ND Studios Karjat) with estimated floor sizes and logistics access'
    },
    {
      title: 'Scenic Heritage & Outdoor Sets',
      region: 'Rajasthan / Jaipur, India',
      prompt: 'Scout historical palaces, desert forts, and heritage hotels available for commercial film shoots with proximity to transport hubs and crew accommodation'
    },
    {
      title: 'London & UK Studio Hubs',
      region: 'Greater London / Berkshire, UK',
      prompt: 'Find major sound stages and studio complexes near London (Pinewood, Shepperton, Leavesden, Elstree) including transit distances from central London'
    },
    {
      title: 'Industrial & Port Backdrops',
      region: 'Kolkata / Haldia, West Bengal, India',
      prompt: 'Search for vintage docks, historic colonial industrial warehouses, and riverbanks suitable for period action films with heavy equipment access'
    }
  ];

  const handleSearchLocations = async (customPrompt?: string, customRegion?: string) => {
    const activePrompt = customPrompt || scoutPrompt;
    const activeRegion = customRegion || targetRegion;

    if (!activePrompt.trim()) {
      setErrorMsg('Please specify what locations or sound stages you need to scout.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt.trim(),
          location: activeRegion.trim(),
          projectType
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to retrieve location intelligence from Google Maps');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Maps Grounding Error:', err);
      setErrorMsg(err.message || 'Error querying Google Maps Grounding service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(uri);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-inner">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Shoot Location Scouting &amp; Logistics</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Google Maps Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Scout verified filming spots, sound stages, warehouse sets, and analyze transit logistics with direct Google Maps links.
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            <span>Project: <strong className="text-white">{activeProject.name}</strong></span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Filters */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            Location Parameters
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Target Shooting Region / City *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                type="text"
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra, India or London, UK"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Project Medium</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="Feature Film">Feature Film (High-Budget Theatrical)</option>
              <option value="OTT Web Series">OTT Web Series / Episodic</option>
              <option value="Commercial & Ad Film">Commercial &amp; TVC Ad Film</option>
              <option value="Music Video">Music Video Production</option>
              <option value="Documentary">Documentary / Non-Fiction</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Location Scouting Requirements *</label>
            <textarea
              rows={4}
              value={scoutPrompt}
              onChange={(e) => setScoutPrompt(e.target.value)}
              placeholder="Describe desired aesthetic, sound stage size, power/generator requirements, outdoor environment, etc..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scouting Presets</span>
            <div className="flex flex-col gap-1.5">
              {scoutPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTargetRegion(preset.region);
                    setScoutPrompt(preset.prompt);
                    handleSearchLocations(preset.prompt, preset.region);
                  }}
                  className="p-2.5 text-left bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] text-slate-700 transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{preset.title}</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded font-mono">{preset.region}</span>
                  </div>
                  <span className="text-slate-500 line-clamp-1">{preset.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSearchLocations()}
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Grounding with Google Maps Data...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Scout Verified Locations via Maps</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Grounded Intelligence & Map Places */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {result ? (
            <>
              {/* Places & Maps Citations */}
              {result.sources && result.sources.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Google Maps Verified Places &amp; Landmarks ({result.sources.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                            <Navigation className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800 truncate" title={src.title}>
                            {src.title || 'Location Map Link'}
                          </span>
                        </div>

                        {src.uri && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopyLink(src.uri!)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedLink === src.uri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <span>View Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounded Report & Logistics Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Location Scouting &amp; Transit Assessment</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="prose prose-sm text-xs text-slate-700 leading-relaxed max-w-none whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>
            </>
          ) : isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Scouting Locations on Google Maps</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Retrieving geographic coordinates, stage dimensions, access roads, and filming logistics benchmarks...
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3 text-slate-400">
              <MapPin className="w-12 h-12 text-slate-300" />
              <div>
                <h4 className="text-sm font-bold text-slate-700">No Location Search Initiated</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select a preset on the left or enter custom parameters to query verified filming studios and locations via Google Maps Grounding.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
