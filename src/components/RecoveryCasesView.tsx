import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Download, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play,
  Sparkles
} from 'lucide-react';
import { RecoveryCase, RiskLevel, IssueType, CaseStatus } from '../types';
import { formatINR } from '../utils/formatters';

interface RecoveryCasesViewProps {
  cases: RecoveryCase[];
  onOpenCase: (caseItem: RecoveryCase) => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
}

export const RecoveryCasesView: React.FC<RecoveryCasesViewProps> = ({
  cases,
  onOpenCase,
  onExecuteAction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRisk = selectedRisk === 'all' || c.risk === selectedRisk;
    const matchesIssue = selectedIssue === 'all' || c.issue === selectedIssue;
    
    let matchesStatus = true;
    if (selectedStatus === 'Recovered') {
      matchesStatus = c.status === 'Recovered';
    } else if (selectedStatus === 'Needs review') {
      matchesStatus = c.status === 'Needs review';
    } else if (selectedStatus === 'Awaiting payment') {
      matchesStatus = c.status === 'Awaiting payment' || c.status === 'In progress';
    } else if (selectedStatus !== 'all') {
      matchesStatus = c.status === selectedStatus;
    }

    return matchesSearch && matchesRisk && matchesIssue && matchesStatus;
  });

  const totalFilteredRisk = filteredCases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
  const totalFilteredRecovered = filteredCases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (c.recoveredAmount || c.amount) : 0), 0);

  const allCount = cases.length;
  const needsReviewCount = cases.filter(c => c.status === 'Needs review').length;
  const awaitingCount = cases.filter(c => c.status === 'Awaiting payment' || c.status === 'In progress').length;
  const recoveredCount = cases.filter(c => c.status === 'Recovered').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="recovery-cases-container">
      {/* Header Summary Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Recovery Cases</h2>
          <p className="text-xs text-[#737373]">
            {filteredCases.length} of {cases.length} cases matching filters
          </p>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-[#737373] block text-[11px]">Active Risk ({cases.filter(c => c.status !== 'Recovered').length} cases)</span>
            <span className="text-base font-bold text-neutral-900">{formatINR(totalFilteredRisk)}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200"></div>
          <div>
            <span className="text-[#737373] block text-[11px]">Recovered ({recoveredCount} cases)</span>
            <span className="text-base font-bold text-emerald-800">{formatINR(totalFilteredRecovered)}</span>
          </div>
        </div>
      </div>

      {/* Quick Status Pill Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-white border border-[#E7E7E7] text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <span>All Cases</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatus === 'all' ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-100 text-neutral-600'}`}>
            {allCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedStatus('Needs review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
            selectedStatus === 'Needs review'
              ? 'bg-rose-700 text-white'
              : 'bg-white border border-[#E7E7E7] text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <span>Needs Review</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatus === 'Needs review' ? 'bg-rose-900 text-rose-100' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {needsReviewCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedStatus('Awaiting payment')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
            selectedStatus === 'Awaiting payment'
              ? 'bg-blue-700 text-white'
              : 'bg-white border border-[#E7E7E7] text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <span>Awaiting Payment</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatus === 'Awaiting payment' ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {awaitingCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedStatus('Recovered')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
            selectedStatus === 'Recovered'
              ? 'bg-emerald-700 text-white'
              : 'bg-white border border-[#E7E7E7] text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <span>Recovered</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatus === 'Recovered' ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {recoveredCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-cases-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, company, email, or Case ID..."
            className="w-full text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Risk Level */}
          <select
            id="filter-risk-select"
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs bg-white border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          {/* Issue Type */}
          <select
            id="filter-issue-select"
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="text-xs bg-white border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Issues</option>
            <option value="Payment failed">Payment Failed</option>
            <option value="Invoice overdue">Invoice Overdue</option>
            <option value="Subscription lapsed">Subscription Lapsed</option>
            <option value="Checkout abandoned">Checkout Abandoned</option>
          </select>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] font-medium select-none">
                <th className="py-3 px-5">Case ID</th>
                <th className="py-3 px-4">Customer</th>
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
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373] text-xs">
                    <p className="font-semibold text-neutral-900">No recovery cases found</p>
                    <p className="mt-1 text-[11px]">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isRecovered = c.status === 'Recovered';
                  const isNeedsReview = c.status === 'Needs review';
                  const isAwaiting = c.status === 'Awaiting payment' || c.status === 'In progress';

                  return (
                    <tr
                      key={c.id}
                      id={`case-item-${c.id}`}
                      onClick={() => onOpenCase(c)}
                      className="hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                    >
                      {/* Case ID */}
                      <td className="py-3.5 px-5 font-mono text-[11px] text-neutral-500 font-medium">
                        {c.id}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 font-medium text-[#171717]">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-neutral-900 group-hover:text-black">
                              {c.customerName}
                            </span>
                            {c.paymentLinkUrl && (
                              <span className="text-[9px] font-mono px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                Live Link
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-[#737373] font-normal">
                            {c.customerEmail}
                          </span>
                        </div>
                      </td>

                      {/* Issue */}
                      <td className="py-3.5 px-4 text-[#525252]">
                        <span className="inline-flex items-center text-xs">
                          {c.issue}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#171717]">
                        {formatINR(c.amount)}
                      </td>

                      {/* Risk */}
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
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          {isRecovered ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-0.5" />
                              <span>None (Recovered)</span>
                            </span>
                          ) : (
                            <>
                              <span className="font-medium text-xs text-neutral-900">
                                {c.recommendedAction}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                ({c.recoveryProbability}%)
                              </span>
                            </>
                          )}
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
                          <span>{isRecovered ? 'Recovered' : c.status}</span>
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 text-[11px] text-[#737373] font-mono">
                        {c.updated}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        {isRecovered ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-mono font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Recovered</span>
                          </span>
                        ) : (
                          <button
                            id={`case-list-action-${c.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecuteAction(c);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-neutral-900 bg-white border border-[#D4D4D4] hover:bg-neutral-50 hover:border-neutral-400 rounded transition-colors shadow-2xs cursor-pointer"
                          >
                            {c.recommendedAction}
                          </button>
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
    </div>
  );
};
