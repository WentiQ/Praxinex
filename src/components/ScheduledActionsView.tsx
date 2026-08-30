import React, { useState, useMemo } from 'react';
import {
  Clock,
  Zap,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Play,
  ChevronRight,
  AlertTriangle,
  Target,
  TrendingUp,
  Bot,
  Timer,
  Link,
  ShieldCheck,
  Mail,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { RecoveryCase } from '../types';
import { formatINR, formatExactTiming } from '../utils/formatters';
import { normalizeFailureCode } from '../utils/aiDiagnosisEngine';

interface ScheduledActionsViewProps {
  cases: RecoveryCase[];
  onOpenCase: (caseItem: RecoveryCase) => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
}

export type ActionRailType = 'retry' | 'schedule' | 'link' | 'mandate' | 'reminder' | 'escalate';

export interface ScheduledActionItem {
  caseId: string;
  caseItem: RecoveryCase;
  recommendedAction: string;
  actionRailType: ActionRailType;
  timingText: string; // The exact same string shown in "Timing:" in AI Diagnosis
  scheduledAt: string; // ISO 8601 string
  scheduledAtMs: number;
  scheduledTimeDisplay: string;
  windowReason: string;
  status: 'pending' | 'executed' | 'cancelled';
  autoExecute: boolean;
  peakSuccessRate: number;
  priorityRank: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  issue: string;
  rootCauseCategory?: string;
  rootCauseSubCategory?: string;
}

// Get the exact same timing string shown in "Timing:" in AI Diagnosis in recovery case
function getAIDiagnosisTiming(c: RecoveryCase): string {
  return formatExactTiming(c.llmDiagnosis?.optimalTimeWindow || c.scheduledRetry?.scheduledTimeDisplay, c);
}

function formatCountdown(isoDate: string): { label: string; urgent: boolean; overdue: boolean } {
  const ms = new Date(isoDate).getTime() - Date.now();
  if (ms <= 0) {
    const overMs = Math.abs(ms);
    const overMins = Math.floor(overMs / 60000);
    if (overMins < 60) return { label: `${overMins}m overdue`, urgent: true, overdue: true };
    const overHrs = Math.floor(overMs / 3600000);
    if (overHrs < 24) return { label: `${overHrs}h overdue`, urgent: true, overdue: true };
    return { label: `${Math.floor(overHrs / 24)}d overdue`, urgent: true, overdue: true };
  }
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return { label: `In ${secs}s`, urgent: true, overdue: false };
  const mins = Math.floor(secs / 60);
  if (mins < 60) return { label: `In ${mins}m`, urgent: mins < 30, overdue: false };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `In ${hrs}h ${mins % 60}m`, urgent: hrs < 2, overdue: false };
  const days = Math.floor(hrs / 24);
  return { label: `In ${days}d ${hrs % 24}h`, urgent: false, overdue: false };
}

function parseAndNormalizeTiming(c: RecoveryCase): {
  scheduledIso: string;
  scheduledMs: number;
  timingText: string;
  reason: string;
  action: string;
  railType: ActionRailType;
  status: 'pending' | 'executed' | 'cancelled';
} {
  const action = c.llmDiagnosis?.recommendedAction || c.recommendedAction || 'Payment link';
  const timingText = getAIDiagnosisTiming(c);
  
  let railType: ActionRailType = 'link';
  const aLower = action.toLowerCase();
  if (aLower.includes('schedule')) railType = 'schedule';
  else if (aLower.includes('retry')) railType = 'retry';
  else if (aLower.includes('mandate')) railType = 'mandate';
  else if (aLower.includes('reminder')) railType = 'reminder';
  else if (aLower.includes('escalat')) railType = 'escalate';
  else railType = 'link';

  // Determine execution status
  let status: 'pending' | 'executed' | 'cancelled' = 'pending';
  if (c.status === 'Recovered' || c.scheduledRetry?.status === 'executed') {
    status = 'executed';
  } else if (c.scheduledRetry?.status === 'cancelled') {
    status = 'cancelled';
  }

  // 1. Try scheduledRetry.scheduledAt
  let targetDate: Date | null = null;
  let reason = c.scheduledRetry?.windowReason || c.llmDiagnosis?.optimalWindowReason || timingText;

  if (c.scheduledRetry?.scheduledAt) {
    const d = new Date(c.scheduledRetry.scheduledAt);
    if (!isNaN(d.getTime())) {
      targetDate = d;
    }
  }

  // 2. Try responseWindowDeadline
  if (!targetDate && c.responseWindowDeadline) {
    const d = new Date(c.responseWindowDeadline);
    if (!isNaN(d.getTime())) {
      targetDate = d;
    }
  }

  // 3. Try llmDiagnosis fields
  if (!targetDate && c.llmDiagnosis?.scheduledAt) {
    const d = new Date(c.llmDiagnosis.scheduledAt);
    if (!isNaN(d.getTime())) {
      targetDate = d;
    }
  }
  if (!targetDate && c.llmDiagnosis?.responseWindowDeadline) {
    const d = new Date(c.llmDiagnosis.responseWindowDeadline);
    if (!isNaN(d.getTime())) {
      targetDate = d;
    }
  }

  // 4. Derive from timingText if contains time patterns
  if (!targetDate) {
    const now = new Date();
    const tLower = timingText.toLowerCase();
    if (tLower.includes('15m') || tLower.includes('15 mins') || tLower.includes('15 min')) {
      targetDate = new Date(now.getTime() + 15 * 60 * 1000);
    } else if (tLower.includes('45m') || tLower.includes('45 mins') || tLower.includes('45 min')) {
      targetDate = new Date(now.getTime() + 45 * 60 * 1000);
    } else if (tLower.includes('5-10m') || tLower.includes('10m')) {
      targetDate = new Date(now.getTime() + 10 * 60 * 1000);
    } else if (tLower.includes('1 hour') || tLower.includes('1h')) {
      targetDate = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (tLower.includes('09:30 am') || tLower.includes('9:30 am') || tLower.includes('morning')) {
      const nextMorning = new Date(now.getTime());
      nextMorning.setHours(9, 30, 0, 0);
      if (nextMorning.getTime() <= now.getTime()) {
        nextMorning.setDate(nextMorning.getDate() + 1);
      }
      targetDate = nextMorning;
    } else if (tLower.includes('10:00 am')) {
      const nextSlot = new Date(now.getTime());
      nextSlot.setHours(10, 0, 0, 0);
      if (nextSlot.getTime() <= now.getTime()) {
        nextSlot.setDate(nextSlot.getDate() + 1);
      }
      targetDate = nextSlot;
    } else if (tLower.includes('11:00 am')) {
      const nextSlot = new Date(now.getTime());
      nextSlot.setHours(11, 0, 0, 0);
      if (nextSlot.getTime() <= now.getTime()) {
        nextSlot.setDate(nextSlot.getDate() + 1);
      }
      targetDate = nextSlot;
    } else if (tLower.includes('immediate') || tLower.includes('instant')) {
      targetDate = new Date(now.getTime() + 2 * 60 * 1000); // 2m immediate window
    } else if (railType === 'schedule') {
      const nextMorning = new Date(now.getTime());
      nextMorning.setHours(9, 30, 0, 0);
      if (nextMorning.getTime() <= now.getTime()) {
        nextMorning.setDate(nextMorning.getDate() + 1);
      }
      targetDate = nextMorning;
    } else {
      const hours = c.responseWindowHours || c.llmDiagnosis?.responseWindowHours || 24;
      targetDate = new Date(now.getTime() + hours * 3600 * 1000);
    }
  }

  const scheduledIso = targetDate.toISOString();
  const scheduledMs = targetDate.getTime();

  return {
    scheduledIso,
    scheduledMs,
    timingText,
    reason,
    action,
    railType,
    status
  };
}

export const ScheduledActionsView: React.FC<ScheduledActionsViewProps> = ({
  cases,
  onOpenCase,
  onExecuteAction
}) => {
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'executed' | 'cancelled'>('all');
  const [filterRail, setFilterRail] = useState<string>('all');

  // Process ALL recovery cases and build strictly ONE schedule item per case ID
  const allScheduledItems = useMemo(() => {
    const itemsMap = new Map<string, ScheduledActionItem>();

    cases.forEach(c => {
      if (!c || !c.id) return;
      const parsed = parseAndNormalizeTiming(c);

      const item: ScheduledActionItem = {
        caseId: c.id,
        caseItem: c,
        recommendedAction: parsed.action,
        actionRailType: parsed.railType,
        timingText: parsed.timingText,
        scheduledAt: parsed.scheduledIso,
        scheduledAtMs: parsed.scheduledMs,
        scheduledTimeDisplay: parsed.timingText,
        windowReason: parsed.reason,
        status: parsed.status,
        autoExecute: c.scheduledRetry?.autoExecute ?? (parsed.railType === 'retry' || parsed.railType === 'schedule'),
        peakSuccessRate: Number(c.scheduledRetry?.peakSuccessRate) || Number(c.recoveryProbability) || (c.status === 'Recovered' ? 100 : 85),
        priorityRank: c.priorityRank || 'Medium Priority',
        amount: c.amount,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        issue: c.issue,
        rootCauseCategory: c.rootCauseCategory,
        rootCauseSubCategory: c.rootCauseSubCategory
      };

      // Exactly ONE schedule entry per case ID
      itemsMap.set(c.id, item);
    });

    return Array.from(itemsMap.values()).sort((a, b) => {
      // Pending actions first (sorted chronologically from earliest upcoming to later)
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return a.scheduledAtMs - b.scheduledAtMs;
    });
  }, [cases]);

  // Filtered items based on status tab and rail filter
  const filteredItems = useMemo(() => {
    return allScheduledItems.filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesRail = filterRail === 'all' || item.actionRailType === filterRail;
      return matchesStatus && matchesRail;
    });
  }, [allScheduledItems, filterStatus, filterRail]);

  const pendingItems = useMemo(() => allScheduledItems.filter(i => i.status === 'pending'), [allScheduledItems]);
  const executedItems = useMemo(() => allScheduledItems.filter(i => i.status === 'executed'), [allScheduledItems]);
  const cancelledItems = useMemo(() => allScheduledItems.filter(i => i.status === 'cancelled'), [allScheduledItems]);

  const overdueItems = useMemo(() => {
    const nowMs = Date.now();
    return pendingItems.filter(i => i.scheduledAtMs < nowMs);
  }, [pendingItems]);

  const totalPendingValue = useMemo(() => {
    return pendingItems.reduce((sum, i) => sum + i.amount, 0);
  }, [pendingItems]);

  const handleExecuteAllDue = async () => {
    setIsExecutingAll(true);
    try {
      await fetch('/api/dunning/execute-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceExecuteAll: true })
      });
      // Execute the first item in UI
      if (pendingItems.length > 0) {
        onExecuteAction(pendingItems[0].caseItem);
      }
    } catch (err) {
      console.error('Error executing all scheduled actions:', err);
    } finally {
      setIsExecutingAll(false);
    }
  };

  const handleExecuteItem = async (item: ScheduledActionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setExecutingId(item.caseId);
    try {
      if (item.actionRailType === 'retry' || item.actionRailType === 'schedule') {
        await fetch('/api/dunning/execute-scheduled', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId: item.caseId })
        });
      }
      onExecuteAction(item.caseItem);
    } catch (err) {
      console.error('Error executing scheduled action:', err);
    } finally {
      setExecutingId(null);
    }
  };

  const getRailBadgeConfig = (rail: ActionRailType) => {
    switch (rail) {
      case 'schedule':
        return {
          label: 'Schedule Retry',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Clock,
          actionBtn: 'Execute Retry Now'
        };
      case 'retry':
        return {
          label: 'Retry Payment',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Zap,
          actionBtn: 'Run Instant Retry'
        };
      case 'link':
        return {
          label: 'Payment Link',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Link,
          actionBtn: 'Send Link Now'
        };
      case 'mandate':
        return {
          label: 'Mandate Repair',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: CreditCard,
          actionBtn: 'Dispatch Repair Link'
        };
      case 'reminder':
        return {
          label: 'Send Reminder',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Mail,
          actionBtn: 'Send Reminder Now'
        };
      case 'escalate':
        return {
          label: 'Escalate Review',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
          actionBtn: 'Review Escalation'
        };
      default:
        return {
          label: 'Payment Link',
          badgeClass: 'bg-neutral-50 text-neutral-700 border-neutral-200',
          icon: Link,
          actionBtn: 'Execute Action'
        };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="scheduled-actions-container">

      {/* Page Header */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-[#171717]">Scheduled Actions by Agent</h2>
              <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                AUTONOMOUS QUEUE
              </span>
            </div>
            <p className="text-xs text-[#737373] mt-0.5">
              {allScheduledItems.length} recovery cases with planned execution windows &bull; Ordered by next upcoming time
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-[#737373] block text-[11px]">Pending Queue</span>
            <span className="text-base font-bold text-purple-800">{pendingItems.length}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200" />
          <div>
            <span className="text-[#737373] block text-[11px]">Due / Overdue</span>
            <span className={`text-base font-bold ${overdueItems.length > 0 ? 'text-rose-700' : 'text-neutral-400'}`}>
              {overdueItems.length}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200" />
          <div>
            <span className="text-[#737373] block text-[11px]">Pending Value</span>
            <span className="text-base font-bold text-neutral-900">{formatINR(totalPendingValue)}</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-200" />
          <div>
            <span className="text-[#737373] block text-[11px]">Executed</span>
            <span className="text-base font-bold text-emerald-700">{executedItems.length}</span>
          </div>
        </div>
      </div>

      {/* Overdue / Due Alert */}
      {overdueItems.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-rose-900">
                {overdueItems.length} scheduled recovery action{overdueItems.length > 1 ? 's' : ''} currently due
              </span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Optimal clearance windows have arrived. Execute immediately to secure customer recovery.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isExecutingAll}
            onClick={handleExecuteAllDue}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-2xs shrink-0 cursor-pointer transition-colors"
          >
            {isExecutingAll
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Running All...</span></>
              : <><Zap className="w-3.5 h-3.5 fill-current text-amber-300" /><span>Execute Due Actions Now</span></>
            }
          </button>
        </div>
      )}

      {/* Filter Tabs & Rail Selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status Tabs */}
        <div className="flex items-center space-x-2">
          {([
            { key: 'all', label: 'All Actions', count: allScheduledItems.length },
            { key: 'pending', label: 'Pending Queue', count: pendingItems.length },
            { key: 'executed', label: 'Executed', count: executedItems.length },
            { key: 'cancelled', label: 'Cancelled', count: cancelledItems.length },
          ] as { key: typeof filterStatus; label: string; count: number }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-[#E7E7E7] text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterStatus === tab.key ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Rail Filter & Global Execute */}
        <div className="flex items-center space-x-2">
          <select
            value={filterRail}
            onChange={(e) => setFilterRail(e.target.value)}
            className="text-xs bg-white border border-[#E7E7E7] rounded-lg px-2.5 py-1.5 text-neutral-700 cursor-pointer focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Recovery Rails</option>
            <option value="schedule">Scheduled Retry</option>
            <option value="retry">Instant Auto-Retry</option>
            <option value="link">Payment Link</option>
            <option value="mandate">Mandate Repair</option>
            <option value="reminder">Send Reminder</option>
            <option value="escalate">Escalate Review</option>
          </select>

          <button
            type="button"
            disabled={isExecutingAll || pendingItems.length === 0}
            onClick={handleExecuteAllDue}
            className="flex items-center space-x-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            {isExecutingAll
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Running All...</span></>
              : <><Zap className="w-3.5 h-3.5 fill-current text-amber-300" /><span>Run Due Actions</span></>
            }
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">No Scheduled Actions in this view</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            All cases with active timings and recommended rails appear here ordered by execution time.
          </p>
        </div>
      )}

      {/* Scheduled Actions List */}
      {filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const countdown = formatCountdown(item.scheduledAt);
            const isOverdue = countdown.overdue;
            const isUrgent = countdown.urgent;
            const isExecuted = item.status === 'executed';
            const isCancelled = item.status === 'cancelled';
            const isThisExecuting = executingId === item.caseId;
            const isNext = idx === 0 && !isExecuted && !isCancelled && filterStatus !== 'executed';

            const railConfig = getRailBadgeConfig(item.actionRailType);
            const RailIcon = railConfig.icon;

            const cardBorder = isNext
              ? 'border-purple-400 ring-2 ring-purple-100'
              : isOverdue && !isExecuted && !isCancelled
              ? 'border-rose-300'
              : 'border-[#E7E7E7]';

            return (
              <div
                key={item.caseId}
                onClick={() => onOpenCase(item.caseItem)}
                className={`bg-white border rounded-xl p-4.5 hover:shadow-sm transition-all duration-150 cursor-pointer group relative ${cardBorder}`}
              >
                {isNext && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-700 text-white shadow-2xs">
                    NEXT UPCOMING
                  </span>
                )}

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left Column: Index, Customer, Rail & Timing */}
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-mono font-bold border ${
                      isExecuted ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                      isCancelled ? 'bg-neutral-100 border-neutral-200 text-neutral-400' :
                      isOverdue ? 'bg-rose-100 border-rose-200 text-rose-700' :
                      'bg-purple-100 border-purple-200 text-purple-700'
                    }`}>
                      {isExecuted ? <CheckCircle2 className="w-4 h-4" /> :
                       isCancelled ? <XCircle className="w-4 h-4" /> :
                       `#${idx + 1}`}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-bold text-neutral-900">{item.customerName}</span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{item.caseId}</span>
                        
                        {/* Recommended Rail Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${railConfig.badgeClass}`}>
                          <RailIcon className="w-3 h-3" />
                          <span>Rail: {item.recommendedAction}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-500 truncate">
                        {item.customerEmail} &bull; Issue: <strong className="text-neutral-700">{item.issue}</strong>
                      </p>

                      {/* Timing & Window Reason Row */}
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5 pt-0.5">
                        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                          isExecuted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          isCancelled ? 'text-neutral-500 bg-neutral-50 border-neutral-200' :
                          isOverdue ? 'text-rose-700 bg-rose-50 border-rose-200' :
                          isUrgent ? 'text-amber-700 bg-amber-50 border-amber-200' :
                          'text-purple-700 bg-purple-50 border-purple-200'
                        }`}>
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Timing: <strong className="font-mono font-semibold">{item.timingText}</strong></span>
                        </div>

                        {/* Countdown Badge */}
                        {!isExecuted && !isCancelled && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isOverdue ? 'text-rose-700 bg-rose-50 border-rose-200' :
                            isUrgent ? 'text-amber-700 bg-amber-50 border-amber-200' :
                            'text-neutral-600 bg-neutral-50 border-neutral-200'
                          }`}>
                            {countdown.label}
                          </span>
                        )}
                      </div>

                      {/* AI Root-Cause telemetry */}
                      {(item.rootCauseCategory || item.rootCauseSubCategory) && (
                        <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 pt-0.5">
                          <Bot className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>AI Root Cause: <strong className="text-neutral-700">{item.rootCauseCategory}</strong> ({item.rootCauseSubCategory || 'Direct Action'})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Amount, Probability, Action Button */}
                  <div className="flex items-center space-x-4 shrink-0 flex-wrap gap-y-2">
                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-neutral-900">{formatINR(item.amount)}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {item.peakSuccessRate}% Salvage Rate
                      </div>
                    </div>

                    {item.priorityRank && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        item.priorityRank === 'Critical Priority' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        item.priorityRank === 'High Priority' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        item.priorityRank === 'Medium Priority' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-neutral-50 text-neutral-600 border-neutral-200'
                      }`}>
                        {item.priorityRank.replace(' Priority', '')}
                      </span>
                    )}

                    {/* Action Execution Button */}
                    {!isExecuted && !isCancelled && (
                      <button
                        type="button"
                        disabled={isThisExecuting}
                        onClick={(e) => handleExecuteItem(item, e)}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shadow-2xs ${
                          isOverdue
                            ? 'bg-rose-700 hover:bg-rose-800 text-white border-rose-700'
                            : 'bg-purple-700 hover:bg-purple-800 text-white border-purple-700'
                        }`}
                      >
                        {isThisExecuting
                          ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Executing...</span></>
                          : <><Play className="w-3 h-3 fill-current" /><span>{railConfig.actionBtn}</span></>
                        }
                      </button>
                    )}

                    {isExecuted && (
                      <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Recovered / Executed</span>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 bg-neutral-50 border border-neutral-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelled</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics Summary Footer */}
      {allScheduledItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-neutral-700">Average Predicted Success</span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900">
              {allScheduledItems.length > 0
                ? Math.round(allScheduledItems.reduce((s, i) => s + (Number(i.peakSuccessRate) || 85), 0) / allScheduledItems.length)
                : 0}%
            </div>
            <p className="text-[11px] text-neutral-500">Weighted across all active recovery rails</p>
          </div>

          <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-neutral-700">Expected Salvageable Value</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {formatINR(pendingItems.reduce((s, i) => s + Math.round(i.amount * ((Number(i.peakSuccessRate) || 85) / 100)), 0))}
            </div>
            <p className="text-[11px] text-neutral-500">Probability-weighted value in pending queue</p>
          </div>

          <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-neutral-700">Auto-Execution Coverage</span>
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900">
              {pendingItems.filter(i => i.autoExecute).length} / {pendingItems.length}
            </div>
            <p className="text-[11px] text-neutral-500">Actions enabled for autonomous background trigger</p>
          </div>
        </div>
      )}
    </div>
  );
};

