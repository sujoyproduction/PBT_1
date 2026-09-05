import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  TrendingDown, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  X,
  Award
} from 'lucide-react';
import { RateBenchmarkItem } from '../../types';

interface VendorRateComparisonTabProps {
  benchmarks: RateBenchmarkItem[];
  onAddBenchmark: (item: RateBenchmarkItem) => void;
  openAddBenchmarkSignal?: number;
}

export const VendorRateComparisonTab: React.FC<VendorRateComparisonTabProps> = ({
  benchmarks,
  onAddBenchmark,
  openAddBenchmarkSignal
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (openAddBenchmarkSignal && openAddBenchmarkSignal > 0) {
      setIsModalOpen(true);
    }
  }, [openAddBenchmarkSignal]);

  // New benchmark form state
  const [itemName, setItemName] = useState('');
  const [department, setDepartment] = useState('Camera');
  const [unit, setUnit] = useState('Per Shoot Day');
  const [budgetRate, setBudgetRate] = useState<number>(0);
  const [v1Name, setV1Name] = useState('');
  const [v1Rate, setV1Rate] = useState<number>(0);
  const [v2Name, setV2Name] = useState('');
  const [v2Rate, setV2Rate] = useState<number>(0);

  const departmentsList = useMemo(() => {
    const list = new Set<string>();
    benchmarks.forEach(b => list.add(b.department));
    return Array.from(list);
  }, [benchmarks]);

  const filteredBenchmarks = useMemo(() => {
    return benchmarks.filter(b => {
      const matchSearch = 
        !search ||
        b.itemName.toLowerCase().includes(search.toLowerCase()) ||
        b.department.toLowerCase().includes(search.toLowerCase()) ||
        b.recommendedVendor.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === 'ALL' || b.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [benchmarks, search, selectedDept]);

  // Calculate total estimated savings
  const totalSavings = useMemo(() => {
    return benchmarks.reduce((sum, item) => {
      const minRate = Math.min(...item.quotes.map(q => q.rate));
      if (minRate < item.budgetRate) {
        return sum + (item.budgetRate - minRate);
      }
      return sum;
    }, 0);
  }, [benchmarks]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || budgetRate <= 0) return;

    const quotes = [];
    if (v1Name && v1Rate > 0) quotes.push({ vendorName: v1Name, rate: v1Rate });
    if (v2Name && v2Rate > 0) quotes.push({ vendorName: v2Name, rate: v2Rate });

    let recommended = v1Name;
    if (quotes.length > 0) {
      quotes.sort((a, b) => a.rate - b.rate);
      recommended = quotes[0].vendorName;
    }

    onAddBenchmark({
      id: `rb_${Date.now()}`,
      itemName,
      department,
      unit,
      budgetRate,
      quotes,
      recommendedVendor: recommended || 'TBD'
    });

    setIsModalOpen(false);
    setItemName('');
    setBudgetRate(0);
    setV1Name('');
    setV1Rate(0);
    setV2Name('');
    setV2Rate(0);
  };

  return (
    <div className="space-y-4">
      {/* Header Metric */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Equipment & Services Rate Comparison Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmark market supplier quotes against standard approved production budgets to identify savings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-300">Unit Savings Identified</div>
              <div className="text-sm font-black text-white font-mono">
                ₹{totalSavings.toLocaleString('en-IN')} / shift
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rate Benchmark</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment, service, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rate Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Equipment / Service Item</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Standard Budget</th>
                <th className="py-3 px-4">Vendor Quotes Comparison</th>
                <th className="py-3 px-4">Lowest Recommended Bid</th>
                <th className="py-3 px-4 text-right">Variance / Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBenchmarks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-400">No rate comparisons found</p>
                  </td>
                </tr>
              ) : (
                filteredBenchmarks.map((item) => {
                  const sortedQuotes = [...item.quotes].sort((a, b) => a.rate - b.rate);
                  const lowestQuote = sortedQuotes[0];
                  const savings = lowestQuote ? item.budgetRate - lowestQuote.rate : 0;
                  const savingsPct = lowestQuote ? ((savings / item.budgetRate) * 100).toFixed(1) : '0';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Item */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.itemName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.unit}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 rounded text-[10px]">
                          {item.department}
                        </span>
                      </td>

                      {/* Standard Budget */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-300">
                        ₹{item.budgetRate.toLocaleString('en-IN')}
                      </td>

                      {/* Quotes */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {sortedQuotes.map((q, idx) => {
                            const isLowest = idx === 0;
                            return (
                              <div
                                key={q.vendorName}
                                className={`text-[11px] flex items-center justify-between px-2 py-0.5 rounded ${
                                  isLowest
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                <span className="truncate max-w-[150px]">{q.vendorName}</span>
                                <span className="font-mono ml-2">₹{q.rate.toLocaleString('en-IN')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Recommended Vendor */}
                      <td className="py-3 px-4">
                        {lowestQuote ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>{lowestQuote.vendorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">TBD</span>
                        )}
                      </td>

                      {/* Savings */}
                      <td className="py-3 px-4 text-right font-mono">
                        {savings > 0 ? (
                          <div className="text-emerald-400 font-bold">
                            +₹{savings.toLocaleString('en-IN')}
                            <span className="text-[10px] text-emerald-500/80 block font-normal">
                              ({savingsPct}% below budget)
                            </span>
                          </div>
                        ) : savings < 0 ? (
                          <div className="text-rose-400 font-bold">
                            -₹{Math.abs(savings).toLocaleString('en-IN')}
                            <span className="text-[10px] text-rose-500/80 block font-normal">
                              (Above budget)
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-400">At Budget</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Benchmark Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Add Rate Comparison Benchmark
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Equipment or Service Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Sony FX9 Cinema Kit (Camera Body + Zoom Lens)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Camera">Camera</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Technical">Technical & Power</option>
                    <option value="Costume & Vanity">Costume & Vanity</option>
                    <option value="Catering">Catering</option>
                    <option value="Transport">Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit Rate Basis</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Per Shoot Day"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved Standard Budget Rate (INR)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={budgetRate || ''}
                  onChange={(e) => setBudgetRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-300">Supplier Quotes for Comparison</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Vendor A Name"
                    value={v1Name}
                    onChange={(e) => setV1Name(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Vendor A Rate"
                    value={v1Rate || ''}
                    onChange={(e) => setV1Rate(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Vendor B Name"
                    value={v2Name}
                    onChange={(e) => setV2Name(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Vendor B Rate"
                    value={v2Rate || ''}
                    onChange={(e) => setV2Rate(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRateComparisonTab;
