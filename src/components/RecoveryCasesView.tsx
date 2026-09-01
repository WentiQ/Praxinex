import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Cpu,
  UserCheck,
  Zap,
  TrendingUp,
  ArrowUpDown,
  CreditCard,
  Mail,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { RecoveryCase, RiskLevel, IssueType, CaseStatus, RootCauseCategory } from '../types';
import { formatINR, formatCaseTimeAgo } from '../utils/formatters';
import { normalizeFailureCode, calculatePredictiveRecoveryScore, caseHasAIDiagnosis } from '../utils/aiDiagnosisEngine';

interface RecoveryCasesViewProps {
  cases: RecoveryCase[];
  onOpenCase: (caseItem: RecoveryCase) => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
  onDiagnoseAllUndiagnosed?: (caseIds?: string[]) => void;
  isDiagnosingBatch?: boolean;
  undiagnosedCases?: RecoveryCase[];
}

export const RecoveryCasesView: React.FC<RecoveryCasesViewProps> = ({
  cases,
  onOpenCase,
  onExecuteAction,
  onDiagnoseAllUndiagnosed,
  isDiagnosingBatch = false,
  undiagnosedCases
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'probability' | 'recoverable' | 'amount' | 'recent'>('recent');
  const [isExecutingScheduled, setIsExecutingScheduled] = useState<boolean>(false);

  const getCaseLastUpdatedTime = (c: RecoveryCase): number => {
    let latestMs = 0;
    if (c.lastDiagnosedAt) {
      const ms = new Date(c.lastDiagnosedAt).getTime();
      if (!isNaN(ms) && ms > latestMs) latestMs = ms;
    }
    if (c.recoveredAt) {
      const ms = new Date(c.recoveredAt).getTime();
      if (!isNaN(ms) && ms > latestMs) latestMs = ms;
    }
    if ((c as any).updatedAt) {
      const ms = new Date((c as any).updatedAt).getTime();
      if (!isNaN(ms) && ms > latestMs) latestMs = ms;
    }
    if (Array.isArray(c.timeline) && c.timeline.length > 0) {
      c.timeline.forEach((t) => {
        if (t && t.timestamp) {
          const ms = new Date(t.timestamp).getTime();
          if (!isNaN(ms) && ms > latestMs) latestMs = ms;
        }
      });
    }
    if (c.createdAt) {
      const ms = new Date(c.createdAt).getTime();
      if (!isNaN(ms) && ms > latestMs) latestMs = ms;
    }
    return latestMs;
  };

  const getCaseExpectedRecovery = (c: RecoveryCase): number => {
    if (c.expectedRecoveryValue !== undefined) return c.expectedRecoveryValue;
    const prob = c.recoveryProbability || 75;
    return Math.round(c.amount * (prob / 100));
  };

  const getCaseCategory = (c: RecoveryCase): RootCauseCategory => {
    if (c.rootCauseCategory) return c.rootCauseCategory;
    const normalized = normalizeFailureCode(c.failureCode, c.failureReason, c.issue);
    return normalized.category;
  };

  const scheduledCases = useMemo(() => {
    return cases.filter(c => c.status === 'Scheduled' || (c.scheduledRetry && c.scheduledRetry.status === 'pending'));
  }, [cases]);

  const handleExecuteAllScheduled = async () => {
    setIsExecutingScheduled(true);
    try {
      await fetch('/api/dunning/execute-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceExecuteAll: true })
      });
      // Execute the first scheduled case in UI to refresh modal/timeline
      if (scheduledCases.length > 0) {
        onExecuteAction({ ...scheduledCases[0], recommendedAction: 'Retry payment' });
      }
    } catch (err) {
      console.error('Error executing scheduled retries:', err);
    } finally {
      setIsExecutingScheduled(false);
    }
  };

  const rawFiltered = cases
    .filter((c) => {
      const matchesSearch = 
        c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.failureReason && c.failureReason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.failureCode && c.failureCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRisk = selectedRisk === 'all' || c.risk === selectedRisk;
      const matchesIssue = selectedIssue === 'all' || c.issue === selectedIssue;
      
      const cat = getCaseCategory(c);
      const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;

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


      return matchesSearch && matchesRisk && matchesIssue && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      // 1. Unrecovered before recovered
      if (a.status === 'Recovered' && b.status !== 'Recovered') return 1;
      if (a.status !== 'Recovered' && b.status === 'Recovered') return -1;

      // 3. Selected Sort Strategy
      if (sortBy === 'priority') {
        // Smart Prioritization: High-value, high-probability revenue first
        const expA = getCaseExpectedRecovery(a);
        const expB = getCaseExpectedRecovery(b);
        if (expB !== expA) return expB - expA;
        return (b.recoveryProbability || 75) - (a.recoveryProbability || 75);
      } else if (sortBy === 'probability') {
        return (b.recoveryProbability || 75) - (a.recoveryProbability || 75);
      } else if (sortBy === 'recoverable') {
        return getCaseExpectedRecovery(b) - getCaseExpectedRecovery(a);
      } else if (sortBy === 'amount') {
        return b.amount - a.amount;
      } else {
        return getCaseLastUpdatedTime(b) - getCaseLastUpdatedTime(a);
      }
    });

  // Ensure strict uniqueness in displayed list by case ID
  const seenIds = new Set<string>();
  const filteredCases = rawFiltered.filter(c => {
    if (!c || !c.id) return false;
    if (seenIds.has(c.id)) return false;
    seenIds.add(c.id);
    return true;
  });

  const totalFilteredRisk = filteredCases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
  const totalFilteredRecoverable = filteredCases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? getCaseExpectedRecovery(c) : 0), 0);
  const totalFilteredRecovered = filteredCases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (c.recoveredAmount || c.amount) : 0), 0);

  const allCount = cases.length;
  const scheduledCount = scheduledCases.length;
  const needsReviewCount = cases.filter(c => c.status === 'Needs review').length;
  const awaitingCount = cases.filter(c => c.status === 'Awaiting payment' || c.status === 'In progress').length;
  const recoveredCount = cases.filter(c => c.status === 'Recovered').length;
  const undiagnosedCount = cases.filter(c => c.status !== 'Recovered' && !caseHasAIDiagnosis(c)).length;

  const technicalCount = cases.filter(c => getCaseCategory(c) === 'Technical').length;
  const behavioralCount = cases.filter(c => getCaseCategory(c) === 'Behavioral').length;
  const fraudCount = cases.filter(c => getCaseCategory(c) === 'Fraud').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="recovery-cases-container">

      {/* Header Summary Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-[#171717]">Recovery Cases</h2>
            <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              AI Prioritized Queue
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            {filteredCases.length} of {cases.length} cases matching filters • Ranked by expected salvageable revenue
          </p>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-[#737373] block text-[11px]">Active Risk ({cases.filter(c => c.status !== 'Recovered').length})</span>
            <span className="text-base font-bold text-neutral-900">{formatINR(totalFilteredRisk)}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200"></div>
          <div>
            <span className="text-[#737373] block text-[11px]">Expected Salvage Value</span>
            <span className="text-base font-bold text-blue-700">{formatINR(totalFilteredRecoverable)}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200"></div>
          <div>
            <span className="text-[#737373] block text-[11px]">Recovered ({recoveredCount})</span>
            <span className="text-base font-bold text-emerald-800">{formatINR(totalFilteredRecovered)}</span>
          </div>
        </div>
      </div>

      {/* Filter Row 1: Status Tabs & Root-Cause Categories */}
      <div className="space-y-2.5">
        {/* Status Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
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


          {/* Root-Cause Category Filter Pills */}
          <div className="flex items-center space-x-1.5 text-xs bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <span className="text-[11px] text-neutral-500 font-medium px-2 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Root Cause:</span>
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All ({allCount})
            </button>
            <button
              onClick={() => setSelectedCategory('Technical')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                selectedCategory === 'Technical'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Technical ({technicalCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('Behavioral')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                selectedCategory === 'Behavioral'
                  ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>Behavioral ({behavioralCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('Fraud')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                selectedCategory === 'Fraud'
                  ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Fraud ({fraudCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Smart Sort */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-cases-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, email, Case ID, or error code..."
            className="w-full text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Dropdown Filters & Smart Prioritization Sort */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Smart Prioritization Sort */}
          <div className="flex items-center space-x-1.5 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-[11px] text-neutral-500 font-medium">Rank by:</span>
            <select
              id="sort-strategy-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-0 font-semibold text-neutral-900 focus:outline-none cursor-pointer"
            >
              <option value="recent">🕒 Recently Updated (Default)</option>
              <option value="priority">⚡ AI Priority (High-Value Salvage First)</option>
              <option value="probability">🎯 Recovery Probability (High → Low)</option>
              <option value="recoverable">💰 Expected Value (₹ High → Low)</option>
              <option value="amount">💳 Total Amount (High → Low)</option>
            </select>
          </div>

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

      {/* Undiagnosed Unrecovered Cases Autonomous AI Diagnosis Banner */}
      {undiagnosedCount > 0 && (
        <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-purple-900/10 border border-purple-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-neutral-900">
                  Autonomous AI Diagnosis in Progress ({undiagnosedCount} Cases Identified)
                </h3>
                <span className="text-[10px] font-mono font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Autonomous Pipeline
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Praxinex AI has automatically identified active cases lacking root-cause diagnosis and is diagnosing them one by one in the background.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 bg-purple-100/90 border border-purple-300 text-purple-950 text-xs font-mono font-semibold rounded-lg flex items-center space-x-2 shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
              <span>Diagnosing one by one ({undiagnosedCount} pending)...</span>
            </div>
          </div>
        </div>
      )}


      {/* Main Cases Table */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] font-medium select-none">
                <th className="py-3 px-4">Priority / Case ID</th>
                <th className="py-3 px-4">Customer & Root Cause</th>
                <th className="py-3 px-4">Issue & Failure Code</th>
                <th className="py-3 px-4">Amount / Expected Salvage</th>
                <th className="py-3 px-4">AI Diagnosis & Action</th>
                <th className="py-3 px-4">Probability</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
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
                  const cat = getCaseCategory(c);
                  const expectedVal = getCaseExpectedRecovery(c);
                  const rank = c.priorityRank || (expectedVal >= 40000 ? 'Critical Priority' : (expectedVal >= 15000 ? 'High Priority' : 'Medium Priority'));

                  return (
                    <tr
                      key={c.id}
                      id={`case-item-${c.id}`}
                      onClick={() => onOpenCase(c)}
                      className="hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                    >
                      {/* Priority / Case ID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] text-neutral-500 font-medium block">
                            {c.id}
                          </span>
                          {!isRecovered && (
                            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border inline-block ${
                              rank === 'Critical Priority'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : rank === 'High Priority'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : rank === 'Medium Priority'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                            }`}>
                              {rank.replace(' Priority', '')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer & Root Cause */}
                      <td className="py-3.5 px-4 font-medium text-[#171717]">
                        <div className="space-y-1">
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
                          
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border inline-flex items-center space-x-1 ${
                              cat === 'Technical'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : cat === 'Fraud'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {cat === 'Technical' && <Cpu className="w-2.5 h-2.5 mr-0.5" />}
                              {cat === 'Behavioral' && <UserCheck className="w-2.5 h-2.5 mr-0.5" />}
                              {cat === 'Fraud' && <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />}
                              <span>{cat}</span>
                            </span>
                            <span className="text-[11px] text-[#737373] truncate max-w-[120px]">
                              {c.customerEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Issue & Normalized Failure Code */}
                      <td className="py-3.5 px-4 text-[#525252]">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium text-xs text-neutral-900 block">
                              {c.issue}
                            </span>
                            {c.mandateRepair && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                                Card Mandate
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span className="font-mono text-[10px] text-neutral-500 bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0] inline-block truncate max-w-[150px]">
                              {c.failureCode || 'GATEWAY_ERROR_DEBIT_FAILED'}
                            </span>
                            {c.scheduledRetry && c.scheduledRetry.status === 'pending' && (
                              <span className="font-mono text-[9px] text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-flex items-center space-x-1 font-bold">
                                <Clock className="w-2.5 h-2.5 text-purple-700" />
                                <span>{c.scheduledRetry.scheduledTimeDisplay} ({c.scheduledRetry.peakSuccessRate}%)</span>
                              </span>
                            )}
                            {c.responseWindowDeadline && (c.status === 'Awaiting payment' || c.status === 'In progress') && (
                              <span className="font-mono text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center space-x-1 font-semibold">
                                <span>⏳ {Math.max(1, Math.round((new Date(c.responseWindowDeadline).getTime() - Date.now()) / (3600 * 1000)))}h window</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount & Expected Salvage */}
                      <td className="py-3.5 px-4 font-mono">
                        <div>
                          <span className="font-bold text-[#171717] block">
                            {formatINR(c.amount)}
                          </span>
                          {!isRecovered ? (
                            <span className="text-[10px] text-blue-700 font-semibold block">
                              Exp: {formatINR(expectedVal)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              ✓ Recovered
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recommended Action / AI Diagnosis */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          {isRecovered ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-0.5" />
                              <span>Settled</span>
                            </span>
                          ) : !caseHasAIDiagnosis(c) ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                <Sparkles className="w-2.5 h-2.5 text-purple-600 animate-pulse" />
                                <span>Pending Diagnosis</span>
                              </span>
                              <span className="block text-[11px] text-neutral-500">
                                {c.recommendedAction}
                              </span>
                            </div>
                          ) : (
                            <span className={`font-medium text-xs ${
                              c.recommendedAction === 'Mandate repair' 
                                ? 'text-emerald-700 font-semibold' 
                                : c.recommendedAction === 'Schedule retry'
                                ? 'text-purple-700 font-semibold'
                                : 'text-neutral-900'
                            }`}>
                              {c.recommendedAction}
                            </span>
                          )}
                        </div>
                      </td>


                      {/* Probability */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (c.recoveryProbability || 75) >= 80 ? 'bg-emerald-600' : ((c.recoveryProbability || 75) >= 60 ? 'bg-blue-600' : 'bg-rose-500')
                              }`}
                              style={{ width: `${c.recoveryProbability || 75}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-neutral-800">
                            {c.recoveryProbability || 75}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                            isRecovered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'Scheduled'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
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
                                : c.status === 'Scheduled'
                                ? 'bg-purple-600 animate-ping'
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
                      <td className="py-3.5 px-4 text-[11px] text-[#737373] font-mono whitespace-nowrap">
                        {formatCaseTimeAgo(c)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {isRecovered ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 text-xs font-mono font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <button
                            id={`case-list-action-${c.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecuteAction(c);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors shadow-2xs cursor-pointer whitespace-nowrap border ${
                              c.status === 'Scheduled'
                                ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 font-semibold'
                                : c.recommendedAction === 'Mandate repair'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 font-semibold'
                                : 'text-neutral-900 bg-white border-[#D4D4D4] hover:bg-neutral-50 hover:border-neutral-400'
                            }`}
                          >
                            {c.status === 'Scheduled' ? '⚡ Execute Now' : c.recommendedAction}
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
