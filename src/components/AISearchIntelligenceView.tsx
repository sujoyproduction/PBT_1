import React, { useState } from 'react';
import { 
  Search, 
  DollarSign, 
  ExternalLink, 
  FileSpreadsheet, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Film, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Globe,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { Project } from '../types';

interface AISearchIntelligenceViewProps {
  activeProject?: Project;
}

interface GroundedWebSource {
  title: string;
  uri: string;
}

interface RateSearchResult {
  text: string;
  sources: GroundedWebSource[];
  timestamp: string;
}

export default function AISearchIntelligenceView({ activeProject }: AISearchIntelligenceViewProps) {
  const [category, setCategory] = useState('Camera & Lighting Rental Packages');
  const [marketRegion, setMarketRegion] = useState('Mumbai / India (Global Benchmarks)');
  const [searchQuery, setSearchQuery] = useState(
    'Current 2026 daily rental rates for Arri Alexa 35 and Sony Venice 2 camera packages including Master Prime and Cooke Anamorphic lens kits'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<RateSearchResult | null>(null);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  // Curated queries for production controllers and line producers
  const ratePresets = [
    {
      title: 'Cinema Camera & Lens Day Rates',
      category: 'Camera & Optics',
      query: 'What are current daily and weekly equipment rental rates for Arri Alexa 35, Sony Venice 2, RED V-Raptor, and Cooke/Arri Signature Prime lens packages in 2026?'
    },
    {
      title: 'Union Crew Wage Scales (IATSE / FWICE)',
      category: 'Crew & Labor Wages',
      query: 'Current standard union minimum wage scales, daily 12-hour turnaround rates, and overtime rules for Cinematographers, Gaffers, Sound Recordists, and 1st ADs in 2026.'
    },
    {
      title: 'Grip, Generator & Vanity Van Rentals',
      category: 'Transport & Generators',
      query: 'Average daily rental rates for 125kVA soundproof mobile generator vans, 4-room celebrity vanity vans, and 5-ton grip trucks with lighting packages.'
    },
    {
      title: 'State & International Film Tax Incentives',
      category: 'Rebates & Subsidies',
      query: 'Latest 2026 state and international cash rebate percentages, minimum local spend thresholds, and qualification guidelines for feature film productions.'
    }
  ];

  const handleRunSearch = async (customQuery?: string, customCategory?: string) => {
    const activeQuery = customQuery || searchQuery;
    const activeCat = customCategory || category;

    if (!activeQuery.trim()) {
      setErrorMsg('Please specify the equipment or crew rate query.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activeQuery.trim(),
          category: activeCat,
          region: marketRegion
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to retrieve live rate intelligence from Google Search');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Search Grounding Error:', err);
      setErrorMsg(err.message || 'Error querying Google Search Grounding service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedUri(uri);
    setTimeout(() => setCopiedUri(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Production Rate &amp; Market Intelligence</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Google Search Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify live industry rental rates, union wage scales, vendor price benchmarks, and film tax incentives grounded with live web sources.
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>Project: <strong className="text-white">{activeProject.name}</strong></span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search Form */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Market Query Setup
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Budget Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Camera & Lighting Rental Packages">Camera &amp; Lighting Rental Packages</option>
              <option value="Crew & Labor Wages">Crew &amp; Labor Wages (Union / Non-Union)</option>
              <option value="Transport & Generators">Transport, Genset &amp; Vanity Vans</option>
              <option value="Post-Production & VFX">VFX, Sound Mixing &amp; Color Grading (DI)</option>
              <option value="Locations & Studios">Studio Hire &amp; Location Permits</option>
              <option value="Tax Rebates & Incentives">Tax Rebates &amp; Co-production Incentives</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Geographical Market</label>
            <input
              type="text"
              value={marketRegion}
              onChange={(e) => setMarketRegion(e.target.value)}
              placeholder="e.g. Mumbai / India, Hollywood / USA, UK, Canada"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Rate Query / Pricing Verification *</label>
            <textarea
              rows={4}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter exact equipment models, crew roles, or tax rebate jurisdictions..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Quick Rate Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry Rate Presets</span>
            <div className="flex flex-col gap-1.5">
              {ratePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCategory(preset.category);
                    setSearchQuery(preset.query);
                    handleRunSearch(preset.query, preset.category);
                  }}
                  className="p-2.5 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] text-slate-700 transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{preset.title}</span>
                    <span className="text-[9px] text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded font-mono">{preset.category}</span>
                  </div>
                  <span className="text-slate-500 line-clamp-1">{preset.query}</span>
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
            onClick={() => handleRunSearch()}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching Live Industry Databases...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Live Rates via Google Search</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Grounded Search Citations & Intelligence Report */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {result ? (
            <>
              {/* Web Sources & Grounding Links */}
              {result.sources && result.sources.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Live Verified Web Sources ({result.sources.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-800 truncate" title={src.title}>
                            {src.title || 'Industry Pricing Source'}
                          </span>
                        </div>

                        {src.uri && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(src.uri)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Copy Link"
                            >
                              {copiedUri === src.uri ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <span>Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate Intelligence Report Body */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Industry Rate Analysis &amp; Benchmarks</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Grounding Timestamp: {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="prose prose-sm text-xs text-slate-700 leading-relaxed max-w-none whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>
            </>
          ) : isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Grounding Rate Intelligence with Google Search</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Querying live rental rate catalogs, union wage agreements, and production cost standards...
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center gap-3 text-slate-400">
              <Search className="w-12 h-12 text-slate-300" />
              <div>
                <h4 className="text-sm font-bold text-slate-700">No Rate Search Initiated</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select an industry preset or enter specific equipment/crew models to retrieve verified real-time rates via Google Search Grounding.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
