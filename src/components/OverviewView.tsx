import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  Activity,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { RecoveryCase } from '../types';
import { formatINR, formatCaseTimeAgo } from '../utils/formatters';
import { normalizeFailureCode } from '../utils/aiDiagnosisEngine';
import { Cpu, UserCheck } from 'lucide-react';

interface OverviewViewProps {
  cases: RecoveryCase[];
  trendData: Array<{ date: string; revenueAtRisk: number; recovered: number; remaining: number }>;
  totalAtRisk: number;
  totalRecovered: number;
  recoveryRate: number;
  activeCasesCount: number;
  casesAnalyzed: number;
  actionsExecuted: number;
  onOpenCase: (caseItem: RecoveryCase) => void;
  onViewActivity: () => void;
  onViewAllCases: () => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  cases,
  trendData,
  totalAtRisk,
  totalRecovered,
  recoveryRate,
  activeCasesCount,
  casesAnalyzed,
  actionsExecuted,
  onOpenCase,
  onViewActivity,
  onViewAllCases,
  onExecuteAction
}) => {
  const getCaseExpectedRecovery = (c: RecoveryCase): number => {
    if (c.expectedRecoveryValue !== undefined) return c.expectedRecoveryValue;
    const prob = c.recoveryProbability || 75;
    return Math.round(c.amount * (prob / 100));
  };

  // Top critical cases prioritized by expected recoverable revenue
  const displayCases = [...cases]
    .sort((a, b) => {
      if (a.status === 'Recovered' && b.status !== 'Recovered') return 1;
      if (a.status !== 'Recovered' && b.status === 'Recovered') return -1;
      return getCaseExpectedRecovery(b) - getCaseExpectedRecovery(a);
    })
    .slice(0, 6);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="overview-content">
      {/* 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-section">
        {/* KPI 1: Revenue at Risk */}
        <div 
          id="kpi-revenue-at-risk"
          className="bg-white border border-[#E7E7E7] rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
            <span>Revenue at Risk</span>
            <span className="text-[11px] font-mono text-neutral-500">Gross</span>
          </div>
          <div className="text-2xl font-bold text-[#171717] tracking-tight font-mono">
            {formatINR(totalAtRisk)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-[#737373]">{activeCasesCount} active cases</span>
            <span className="text-amber-700 font-medium font-mono text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Needs action
            </span>
          </div>
        </div>

        {/* KPI 2: Recovered */}
        <div 
          id="kpi-recovered"
          className="bg-white border border-[#E7E7E7] rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
            <span>Recovered</span>
            <span className="text-emerald-700 font-medium font-mono flex items-center text-[11px]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +18.4%
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-800 tracking-tight font-mono">
            {formatINR(totalRecovered)}
          </div>
          <div className="mt-3 text-xs text-[#737373]">
            vs previous 7-day period
          </div>
        </div>

        {/* KPI 3: Recovery Rate */}
        <div 
          id="kpi-recovery-rate"
          className="bg-white border border-[#E7E7E7] rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
            <span>Recovery Rate</span>
            <span className="text-emerald-700 font-medium font-mono flex items-center text-[11px]">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +4.2%
            </span>
          </div>
          <div className="text-2xl font-bold text-[#171717] tracking-tight font-mono">
            {recoveryRate.toFixed(1)}%
          </div>
          <div className="mt-3 text-xs text-[#737373]">
            Autonomous resolution efficiency
          </div>
        </div>

        {/* KPI 4: Active Cases */}
        <div 
          id="kpi-active-cases"
          className="bg-white border border-[#E7E7E7] rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2 font-medium">
            <span>Active Cases</span>
            <span className="text-[11px] font-mono text-neutral-500">Live queue</span>
          </div>
          <div className="text-2xl font-bold text-[#171717] tracking-tight font-mono">
            {activeCasesCount}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#737373]">
            <span>19 auto-eligible</span>
            <span className="text-neutral-600 font-mono">5 review</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Section: Trend Chart & AI Agent Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-agent-status">
        {/* Left (2 cols): Revenue Recovery Trend Chart */}
        <div 
          id="revenue-trend-card"
          className="lg:col-span-2 bg-white border border-[#E7E7E7] rounded-xl p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#171717]">Revenue recovered</h3>
                <p className="text-xs text-[#737373]">Daily recovery velocity vs total revenue at risk</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-neutral-300"></span>
                  <span className="text-neutral-600">At Risk</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                  <span className="text-emerald-900 font-medium">Recovered</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="atRiskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#737373" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#737373" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#737373' }} 
                    axisLine={{ stroke: '#E7E7E7' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#737373' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const recEntry = payload.find(p => p.dataKey === 'recovered');
                        const riskEntry = payload.find(p => p.dataKey === 'revenueAtRisk');
                        return (
                          <div className="bg-neutral-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono space-y-1.5 border border-neutral-800">
                            <p className="font-semibold text-neutral-300">{label}</p>
                            <p className="text-emerald-400">
                              Recovered: {formatINR(Number(recEntry?.value || 0))}
                            </p>
                            <p className="text-neutral-300">
                              Revenue at Risk: {formatINR(Number(riskEntry?.value || 0))}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recovered" 
                    stroke="#059669" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#recoveredGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenueAtRisk" 
                    stroke="#A3A3A3" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#atRiskGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-xs text-[#737373]">
            <span>Average time to recovery: <strong className="text-neutral-900 font-mono">18 mins</strong></span>
            <span>Recovery rate ceiling: <strong className="text-neutral-900 font-mono">84.2%</strong></span>
          </div>
        </div>

        {/* Right (1 col): AI Agent Status Card */}
        <div 
          id="recovery-agent-status-card"
          className="bg-white border border-[#E7E7E7] rounded-xl p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-sm font-semibold text-[#171717]">Recovery Agent</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                ● Active
              </span>
            </div>

            <p className="text-xs text-[#737373] mt-3 leading-relaxed">
              Monitoring payment failures and overdue receivables in real time. Executing bounded retries and transactional recovery links.
            </p>

            {/* Operational stats list */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5] text-xs">
                <span className="text-[#737373]">Cases analyzed</span>
                <span className="font-mono font-medium text-[#171717]">{casesAnalyzed}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5] text-xs">
                <span className="text-[#737373]">Actions executed</span>
                <span className="font-mono font-medium text-[#171717]">{actionsExecuted}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5] text-xs">
                <span className="text-[#737373]">Recovered</span>
                <span className="font-mono font-semibold text-emerald-700">{formatINR(totalRecovered)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-[#737373]">Policy enforcement</span>
                <span className="font-mono text-neutral-800 text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded">
                  Max 2 Retries / 6h Cooldown
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAEAEA]">
            <button
              id="view-agent-activity-btn"
              onClick={onViewActivity}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-medium text-neutral-800 bg-[#F8F9FA] hover:bg-neutral-200 border border-[#E7E7E7] rounded-lg transition-colors"
            >
              <span>View activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Revenue At Risk Section (Table) */}
      <section className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden" id="revenue-at-risk-table-section">
        {/* Table Header */}
        <div className="p-5 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Revenue at risk</h2>
            <p className="text-xs text-[#737373]">Cases requiring recovery action</p>
          </div>
          <button
            id="view-all-cases-btn"
            onClick={onViewAllCases}
            className="text-xs font-medium text-neutral-700 hover:text-[#171717] flex items-center space-x-1 hover:underline"
          >
            <span>View all cases ({cases.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] font-medium select-none">
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-4">Issue</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-3">Risk</th>
                <th className="py-3 px-4">Recommended action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {displayCases.map((c) => {
                const isRecovered = c.status === 'Recovered';
                const isNeedsReview = c.status === 'Needs review';
                const isAwaiting = c.status === 'Awaiting payment';
                const normalized = normalizeFailureCode(c.failureCode, c.failureReason, c.issue);
                const cat = c.rootCauseCategory || normalized.category;
                const expVal = getCaseExpectedRecovery(c);

                return (
                  <tr
                    key={c.id}
                    id={`case-row-${c.id}`}
                    onClick={() => onOpenCase(c)}
                    className="hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-5 font-medium text-[#171717]">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-neutral-900 group-hover:text-black">
                            {c.customerName}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border inline-flex items-center ${
                            cat === 'Technical'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : cat === 'Fraud'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {cat}
                          </span>
                        </div>
                        <span className="block text-[11px] text-[#737373] font-normal">
                          {c.companyName || c.customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Issue */}
                    <td className="py-3.5 px-4 text-[#525252]">
                      <span className="inline-flex items-center text-xs">
                        {c.issue}
                      </span>
                    </td>

                    {/* Amount & Expected Salvage */}
                    <td className="py-3.5 px-4 font-mono">
                      <div>
                        <span className="font-bold text-[#171717] block">
                          {formatINR(c.amount)}
                        </span>
                        {!isRecovered && (
                          <span className="text-[10px] text-blue-700 font-semibold block">
                            Exp: {formatINR(expVal)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                          c.risk === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : c.risk === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {c.risk}
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4 text-neutral-800">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-xs text-neutral-900">
                          {c.recommendedAction}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({c.recoveryProbability}%)
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                          isRecovered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isNeedsReview
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isAwaiting
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isRecovered
                              ? 'bg-emerald-600'
                              : isNeedsReview
                              ? 'bg-rose-600'
                              : isAwaiting
                              ? 'bg-blue-600'
                              : 'bg-neutral-500'
                          }`}
                        ></span>
                        <span>{c.status}</span>
                      </span>
                    </td>

                    {/* Updated (Dynamic Relative Time Elapsed) */}
                    <td className="py-3.5 px-4 text-[11px] text-[#737373] font-mono whitespace-nowrap">
                      {formatCaseTimeAgo(c)}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-5 text-right">
                      {isRecovered ? (
                        <span className="text-emerald-700 text-[11px] font-mono font-medium">
                          ✓ Recovered
                        </span>
                      ) : (
                        <button
                          id={`execute-btn-${c.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onExecuteAction(c);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 bg-white border border-[#D4D4D4] hover:bg-neutral-50 hover:border-neutral-400 rounded transition-colors shadow-2xs"
                        >
                          {c.recommendedAction}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
