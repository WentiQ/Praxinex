import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  PieChart as PieIcon,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { FAILURE_CATEGORY_DATA } from '../data/mockData';
import { formatINR } from '../utils/formatters';

interface AnalyticsViewProps {
  totalRecovered: number;
  totalAtRisk: number;
  recoveryRate: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  totalRecovered,
  totalAtRisk,
  recoveryRate
}) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="analytics-page-container">
      {/* Header Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Recovery Analytics</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Diagnostic breakdown by failure category, channel conversion, and resolution velocity
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[#737373] block text-[11px]">Net Recovered</span>
            <span className="text-base font-bold text-emerald-800">{formatINR(totalRecovered)}</span>
          </div>
        </div>
      </div>

      {/* Grid 1: Failure Reason Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Failure Reason Breakdown */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">Failure Reason Diagnostics</h3>
            <p className="text-xs text-[#737373]">Distribution of root causes diagnosed by agent</p>
          </div>

          <div className="space-y-4">
            {FAILURE_CATEGORY_DATA.map((cat, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800">{cat.name}</span>
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-neutral-500">{cat.count} cases ({cat.value}%)</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {cat.recoveredRate} rec.
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                    style={{ width: `${cat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Recovery Strategy Efficiency */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">Recovery Action Efficiency</h3>
            <p className="text-xs text-[#737373]">Success conversion rate per bounded action</p>

            <div className="mt-5 space-y-4 text-xs">
              <div className="p-3.5 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 block">Automated Gateway Retry</span>
                  <span className="text-[11px] text-[#737373]">Fired after issuer bank cooldown</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-emerald-800">86.4%</span>
                  <span className="text-[10px] text-neutral-500 block">19 of 22 succeeded</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 block">1-Click Payment Links</span>
                  <span className="text-[11px] text-[#737373]">3DS auth fallback & cart recovery</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-emerald-800">64.2%</span>
                  <span className="text-[10px] text-neutral-500 block">9 of 14 captured</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 block">Payment Method Renewal</span>
                  <span className="text-[11px] text-[#737373]">Expired corporate card updates</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-emerald-800">81.0%</span>
                  <span className="text-[10px] text-neutral-500 block">3 of 4 updated</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between text-xs text-[#737373]">
            <span>Average recovery turnaround: <strong className="text-neutral-900 font-mono">18m 42s</strong></span>
            <span>Unassisted AI recoveries: <strong className="text-neutral-900 font-mono">92%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
