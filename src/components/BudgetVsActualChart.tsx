import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Project, BudgetCategory, Expense } from '../types';

export interface BurnRateDataPoint {
  date: string;
  displayDate: string;
  dailySpend: number;
  cumulativeExpenses: number;
  budgetedTotal: number;
  plannedPacing: number;
  variance: number;
  burnPct: number;
  itemCount: number;
  sampleItems: string;
}

interface BudgetVsActualChartProps {
  project?: Project;
  totalBudget: number;
  expenses: Expense[];
  categories: BudgetCategory[];
  showTitle?: boolean;
}

export default function BudgetVsActualChart({
  project,
  totalBudget,
  expenses = [],
  categories = [],
  showTitle = true
}: BudgetVsActualChartProps) {
  const [viewMode, setViewMode] = useState<'line' | 'area' | 'monthly' | 'department'>('line');

  // Process and sort expenses chronologically
  const timelineData = useMemo<BurnRateDataPoint[]>(() => {
    // Collect all valid dated expenses
    const validExpenses = expenses
      .filter(e => e.date && !isNaN(new Date(e.date).getTime()) && Number(e.amount) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (validExpenses.length === 0) {
      // Return a 5-point baseline progression for visualization if no dated expenses yet
      const today = new Date();
      const points: BurnRateDataPoint[] = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i * 7);
        const dateStr = d.toISOString().substring(0, 10);
        points.push({
          date: dateStr,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dailySpend: 0,
          cumulativeExpenses: 0,
          budgetedTotal: totalBudget,
          plannedPacing: totalBudget > 0 ? Math.round((totalBudget / 5) * (5 - i)) : 0,
          variance: totalBudget,
          burnPct: 0,
          itemCount: 0,
          sampleItems: 'No recorded expenses'
        });
      }
      return points;
    }

    // Group expenses by date (YYYY-MM-DD)
    const dateMap: { [date: string]: { total: number; count: number; items: string[] } } = {};
    
    validExpenses.forEach(exp => {
      const dateKey = exp.date.substring(0, 10);
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, count: 0, items: [] };
      }
      dateMap[dateKey].total += Number(exp.amount) || 0;
      dateMap[dateKey].count += 1;
      const title = exp.title || (exp as any).description || (exp as any).lineItem || 'Expense';
      if (dateMap[dateKey].items.length < 3) {
        dateMap[dateKey].items.push(title);
      }
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    let runningCumulative = 0;
    const totalPoints = sortedDates.length;

    return sortedDates.map((dateKey, index) => {
      const dayData = dateMap[dateKey];
      runningCumulative += dayData.total;
      
      // Calculate linear target pacing line up to total approved budget
      const pacing = totalBudget > 0 
        ? Math.min(totalBudget, (totalBudget / Math.max(1, totalPoints)) * (index + 1))
        : 0;

      const dateObj = new Date(dateKey);
      const displayDate = isNaN(dateObj.getTime()) 
        ? dateKey 
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const burnPct = totalBudget > 0 ? (runningCumulative / totalBudget) * 100 : 0;

      return {
        date: dateKey,
        displayDate,
        dailySpend: dayData.total,
        cumulativeExpenses: runningCumulative,
        budgetedTotal: totalBudget,
        plannedPacing: Math.round(pacing),
        variance: totalBudget - runningCumulative,
        burnPct: Math.round(burnPct * 10) / 10,
        itemCount: dayData.count,
        sampleItems: dayData.items.join(', ')
      };
    });
  }, [expenses, totalBudget]);

  // Department comparative data for department view
  const departmentChartData = useMemo(() => {
    return categories.map(cat => {
      const catAllocated = typeof cat.allocatedAmount === 'number' && cat.allocatedAmount > 0
        ? cat.allocatedAmount
        : (cat.subCategories || []).reduce((s, sub) => s + (sub.allocatedAmount || 0), 0);

      const catSpent = expenses
        .filter(e => e.categoryId === cat.id || e.categoryName === cat.name || (e as any).category === cat.name)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        name: cat.name.length > 14 ? cat.name.substring(0, 12) + '…' : cat.name,
        fullName: cat.name,
        budget: catAllocated,
        actual: catSpent,
        variance: catAllocated - catSpent
      };
    });
  }, [categories, expenses]);

  // Current summary statistics
  const currentCumulativeSpent = timelineData.length > 0 
    ? timelineData[timelineData.length - 1].cumulativeExpenses 
    : 0;
  
  const burnPercentage = totalBudget > 0 ? (currentCumulativeSpent / totalBudget) * 100 : 0;
  const isOverBudget = currentCumulativeSpent > totalBudget && totalBudget > 0;
  const remainingBudget = totalBudget - currentCumulativeSpent;

  // Velocity Metrics
  const activeDaysCount = timelineData.filter(d => d.dailySpend > 0).length || 1;
  const averageDailyBurn = currentCumulativeSpent > 0 ? Math.round(currentCumulativeSpent / activeDaysCount) : 0;
  const estimatedDaysRemaining = (averageDailyBurn > 0 && remainingBudget > 0)
    ? Math.round(remainingBudget / averageDailyBurn)
    : null;

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: BurnRateDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400 font-mono text-[11px]">
            <span className="font-semibold text-slate-200">{data.displayDate || label}</span>
            <span className="text-[10px] text-blue-400 font-bold px-1.5 py-0.5 bg-blue-950/60 rounded border border-blue-900/50">
              {project?.name || 'Project Burn'}
            </span>
          </div>

          {(viewMode === 'line' || viewMode === 'area') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50"></span>
                  Daily Cumulative:
                </span>
                <span className="font-mono font-bold text-white">
                  ₹{(data.cumulativeExpenses || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Budgeted Total:
                </span>
                <span className="font-mono font-bold text-blue-400">
                  ₹{(data.budgetedTotal || totalBudget).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  Target Trajectory:
                </span>
                <span className="font-mono text-sky-300">
                  ₹{(data.plannedPacing || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {data.dailySpend > 0 && (
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-amber-400"></span>
                    Day's Incurred Spend:
                  </span>
                  <span className="font-mono font-semibold text-amber-300">
                    ₹{(data.dailySpend || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Burn Ratio:</span>
                <span className={`font-mono font-bold ${data.burnPct > 100 ? 'text-rose-400' : data.burnPct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {data.burnPct}% Consumed
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Remaining Variance:</span>
                <span className={`font-mono font-bold ${data.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{(data.variance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {data.itemCount > 0 && (
                <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-900">
                  {data.itemCount} voucher{data.itemCount > 1 ? 's' : ''}: {data.sampleItems}
                </div>
              )}
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Daily Outflow:
                </span>
                <span className="font-mono font-bold text-amber-400">
                  ₹{(data.dailySpend || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Vouchers Logged:</span>
                <span className="font-mono text-white">{data.itemCount || 0} records</span>
              </div>
            </div>
          )}

          {viewMode === 'department' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Allocated:
                </span>
                <span className="font-mono font-bold text-blue-400">
                  ₹{(data as any).budget ? (data as any).budget.toLocaleString('en-IN') : 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Actual Spent:
                </span>
                <span className="font-mono font-bold text-rose-400">
                  ₹{(data as any).actual ? (data as any).actual.toLocaleString('en-IN') : 0}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Net Balance:</span>
                <span className={`font-mono font-bold ${(data as any).variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{((data as any).variance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="burn-rate-recharts-card" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xs space-y-4">
      {/* Chart Header with Controls */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Burn Rate &amp; Cumulative Expense Trajectory</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-900/60">
                    Recharts Line Chart
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Comparing daily cumulative expenses against the budgeted totals for {project?.name || 'the selected project'}
                </p>
              </div>
            </div>
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('line')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'line'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Recharts Line Chart: Daily Cumulative Expenses vs Budgeted Total"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Burn Rate Lines</span>
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'area'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Area Gradient + Daily Vouchers"
            >
              Area &amp; Flow
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Daily Incurred Outflow"
            >
              Daily Outflow
            </button>
            <button
              onClick={() => setViewMode('department')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'department'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Department Allocations vs Spent"
            >
              Dept Variance
            </button>
          </div>
        </div>
      )}

      {/* Burn Rate Velocity Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Budgeted Total</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
            ₹{(totalBudget / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            Project Baseline
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Cumulative Expenses</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
            ₹{(currentCumulativeSpent / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {burnPercentage.toFixed(1)}% of Budget
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Daily Burn Velocity</span>
            <Flame className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
            ₹{averageDailyBurn.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">/day</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {activeDaysCount} Active Expense Days
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Runway &amp; Buffer</span>
            {isOverBudget ? (
              <AlertTriangle className="w-3 h-3 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
          </div>
          <div className={`text-sm font-bold font-mono mt-0.5 ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {remainingBudget >= 0 ? `+₹${(remainingBudget / 100000).toFixed(2)} L` : `-₹${(Math.abs(remainingBudget) / 100000).toFixed(2)} L`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {isOverBudget 
              ? 'Budget Exceeded' 
              : estimatedDaysRemaining !== null 
                ? `~${estimatedDaysRemaining} days at current burn` 
                : 'Pacing on track'}
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="h-[290px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'line' ? (
            /* Dedicated Pure Recharts Line Chart for Burn Rate Comparison */
            <LineChart data={timelineData} margin={{ top: 12, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
              />

              {/* Budget Total Reference Line */}
              {totalBudget > 0 && (
                <ReferenceLine
                  y={totalBudget}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Budget Cap ₹${(totalBudget / 100000).toFixed(1)}L`,
                    fill: '#60a5fa',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Line 1: Daily Cumulative Expenses (Solid Vibrant Rose) */}
              <Line
                type="monotone"
                dataKey="cumulativeExpenses"
                name="Daily Cumulative Expenses"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Line 2: Budgeted Total (Step/Flat Line showing Budgeted Total across time) */}
              <Line
                type="monotone"
                dataKey="budgetedTotal"
                name="Budgeted Total"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Line 3: Planned Linear Trajectory / Target Pace */}
              <Line
                type="monotone"
                dataKey="plannedPacing"
                name="Planned Target Pace"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          ) : viewMode === 'area' ? (
            /* Composed Chart: Area Gradient + Bars */
            <ComposedChart data={timelineData} margin={{ top: 12, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="actualSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={35}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
              />

              {totalBudget > 0 && (
                <ReferenceLine
                  y={totalBudget}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Budget Cap: ₹${(totalBudget / 100000).toFixed(1)}L`,
                    fill: '#60a5fa',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="cumulativeExpenses"
                name="Daily Cumulative Expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actualSpendGradient)"
              />

              <Line
                type="monotone"
                dataKey="plannedPacing"
                name="Planned Target Pace"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />

              <Bar
                dataKey="dailySpend"
                name="Daily Incurred Spend"
                fill="#f59e0b"
                opacity={0.65}
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
            </ComposedChart>
          ) : viewMode === 'monthly' ? (
            /* Daily Outflow Bar Chart */
            <ComposedChart data={timelineData} margin={{ top: 12, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={35}
                wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
              />
              <Bar
                dataKey="dailySpend"
                name="Daily Outflow (₹)"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </ComposedChart>
          ) : (
            /* Department Comparison Bar Chart */
            <ComposedChart data={departmentChartData} margin={{ top: 12, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={35}
                wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
              />
              <Bar
                dataKey="budget"
                name="Allocated Budget"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="actual"
                name="Actual Spent"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Velocity Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded"></span>
            <span className="text-slate-300">Daily Cumulative Expenses</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded border-b border-dashed border-blue-400"></span>
            <span className="text-slate-300">Budgeted Total</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 rounded"></span>
            <span className="text-slate-400">Target Pace</span>
          </span>
        </div>
        <div className="text-slate-400">
          {timelineData.length} timeline points analyzed
        </div>
      </div>
    </div>
  );
}
