import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Filter,
  Zap,
  Bot,
  RefreshCw,
  Cpu,
  CreditCard,
  Send,
  Terminal,
  Activity,
  Play
} from 'lucide-react';
import { ActivityEvent, RecoveryCase } from '../types';
import { formatINR } from '../utils/formatters';

interface ActivityViewProps {
  activities: ActivityEvent[];
  cases?: RecoveryCase[];
  onOpenCaseId?: (caseId: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  cases = [],
  onOpenCaseId
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([activities[0]?.id || 'act-101']));
  const [filterType, setFilterType] = useState<string>('all');
  const [liveActivities, setLiveActivities] = useState<ActivityEvent[]>(activities);

  // Keep live activities in sync with props
  useEffect(() => {
    setLiveActivities(activities);
  }, [activities]);

  // Live Agent Status from Server
  const [liveState, setLiveState] = useState<any>({
    status: 'monitoring',
    subsystem: 'Continuous Background Sentinel',
    step: 'Monitoring scheduled retries and customer response windows',
    currentCaseId: null,
    currentCustomerName: null,
    currentAmount: null,
    currentIssue: null,
    currentPipelineStep: 1,
    progressPercent: 100,
    queueDepth: 0
  });

  const [liveThoughts, setLiveThoughts] = useState<any[]>([
    {
      id: 'th-init',
      timeDisplay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: 'Bot',
      text: 'Praxinex autonomous engine initialized. Monitoring 24/7 recovery workflows.',
      subsystem: 'Core Sentinel'
    }
  ]);

  // Poll server live-status every 1 second for live real-time streaming
  useEffect(() => {
    let isMounted = true;
    const fetchLiveStatus = async () => {
      try {
        const res = await fetch('/api/agent/live-status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.state) setLiveState(data.state);
            if (data.thoughts && data.thoughts.length > 0) setLiveThoughts(data.thoughts);
          }
        }
      } catch (err) {
        // Fallback
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const scheduledCount = cases.filter(c => c.status === 'Scheduled' || (c.scheduledRetry && c.scheduledRetry.status === 'pending')).length;
  const awaitingCount = cases.filter(c => c.status === 'Awaiting payment' && c.responseWindowDeadline).length;
  const diagnosedCount = cases.filter(c => c.llmDiagnosis || c.lastDiagnosedAt).length;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFilteredActivities = () => {
    const list = liveActivities.length > 0 ? liveActivities : activities;
    return list.filter(act => {
      if (filterType === 'all') return true;
      if (filterType === 'recovery') return act.type === 'recovery_success';
      if (filterType === 'retry') return act.type === 'auto_retry' || act.type === 'scheduled';
      if (filterType === 'link') return act.type === 'payment_link' || act.type === 'action';
      if (filterType === 'ai') return act.type === 'ai_diagnosis' || act.type === 'diagnosis';
      if (filterType === 'escalation') return act.type === 'escalation';
      return true;
    });
  };

  const filteredActivities = getFilteredActivities();

  const pipelineSteps = [
    { num: 1, title: '1. Ingest Timeline', desc: 'Audit log & customer history' },
    { num: 2, title: '2. Gemini LLM', desc: 'Root-cause & rail diagnosis' },
    { num: 3, title: '3. Optimal Timing', desc: 'Behavioral clearing window' },
    { num: 4, title: '4. Autonomous Exec', desc: 'Trigger retry / link / mandate' },
    { num: 5, title: '5. Audit Ledger', desc: 'Commit immutable ledger' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="activity-container">

      {/* 1. Live Autonomous Agent Real-Time Control Room & Thought Stream */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Top Radar Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Praxinex Autonomous Agent Radar</h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  <span>EXECUTING 24/7</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Subsystem: <strong className="text-neutral-200">{liveState.subsystem || 'Autonomous Recovery Engine'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 font-mono text-xs text-neutral-300 bg-neutral-800/80 px-3.5 py-2 rounded-lg border border-neutral-700">
            <div>
              <span className="text-[10px] text-neutral-500 block">Queue</span>
              <span className="text-xs font-bold text-amber-400">{liveState.queueDepth || 0} pending</span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-700"></div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Scheduled</span>
              <span className="text-xs font-bold text-blue-400">{scheduledCount}</span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-700"></div>
            <div>
              <span className="text-[10px] text-neutral-500 block">Response Deadlines</span>
              <span className="text-xs font-bold text-purple-400">{awaitingCount}</span>
            </div>
          </div>
        </div>

        {/* Current Active Case & Live Subsystem Action */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Current Real-Time Agent Operation:
              </span>
            </div>
            {liveState.currentCaseId ? (
              <div 
                onClick={() => onOpenCaseId && onOpenCaseId(liveState.currentCaseId)}
                className="flex items-center space-x-2 bg-purple-950/80 border border-purple-800/80 px-2.5 py-1 rounded-md cursor-pointer hover:bg-purple-900/80 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                <span className="text-xs font-mono font-bold text-purple-200">{liveState.currentCaseId}</span>
                <span className="text-xs text-neutral-300 font-medium">— {liveState.currentCustomerName}</span>
                <span className="text-xs font-mono text-purple-300 font-bold">({formatINR(liveState.currentAmount || 1000)})</span>
              </div>
            ) : (
              <span className="text-xs font-mono text-neutral-500">All prioritized queues clear • Continuous background sentinel active</span>
            )}
          </div>

          <div className="text-sm font-medium text-neutral-100 flex items-center space-x-2 bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 font-mono">
            <span className="text-emerald-400">›</span>
            <span>{liveState.step || 'Monitoring bank clearance windows and customer response timeouts.'}</span>
          </div>

          {/* 5-Step Execution Pipeline Visualizer */}
          <div className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
              {pipelineSteps.map((step) => {
                const currentStepNum = liveState.currentPipelineStep || 1;
                const isCurrent = step.num === currentStepNum;
                const isPast = step.num < currentStepNum;

                return (
                  <div
                    key={step.num}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-purple-950/90 border-purple-500 text-white shadow-md shadow-purple-950 scale-102 ring-1 ring-purple-500'
                        : isPast
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1 font-semibold text-[11px]">
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : null}
                      {isCurrent ? <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping mr-1"></span> : null}
                      <span>{step.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Agent Terminal / Thought Stream Console */}
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 text-[11px] text-neutral-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-neutral-200">Real-Time Autonomous Agent Stream</span>
            </div>
            <span className="text-[10px] text-neutral-500">Live Streaming ({liveThoughts.length} entries)</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
            {liveThoughts.map((th, idx) => (
              <div key={th.id || idx} className="flex items-start space-x-2 text-neutral-300 hover:text-white transition-colors">
                <span className="text-neutral-500 text-[10px] shrink-0 w-16">{th.timeDisplay}</span>
                <span className="text-purple-400 shrink-0">[{th.subsystem || 'Agent'}]</span>
                <span className="text-neutral-200 flex-1 leading-snug">{th.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-[#171717]">Audit & Activity Log</h2>
            <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
              Immutable Ledger
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Real-time chronological operational log & autonomous decision audit trail ({filteredActivities.length} total events)
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All Events ({activities.length})
          </button>
          <button
            onClick={() => setFilterType('success')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterType === 'success'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Recoveries
          </button>
          <button
            onClick={() => setFilterType('escalated')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterType === 'escalated'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Escalations
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs divide-y divide-[#EAEAEA]">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No agent activities recorded yet. Trigger a payment simulation or connect webhooks to see real-time activities.
          </div>
        ) : (
          filteredActivities.map((event) => {
            const isExpanded = expandedIds.has(event.id);
            const isSuccess = event.resultStatus === 'success';
            const isWarning = event.resultStatus === 'warning';

            return (
              <div 
                key={event.id}
                id={`activity-item-${event.id}`}
                className="p-5 hover:bg-[#FAFAFA] transition-colors"
              >
                {/* Header row of activity */}
                <div 
                  onClick={() => toggleExpand(event.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="font-mono text-xs text-neutral-500 font-medium w-16 shrink-0">
                      {event.timeDisplay}
                    </span>

                    <div 
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-600'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`} 
                    />

                    <div>
                      <span className="text-xs font-semibold text-neutral-900">
                        {event.eventTitle}
                      </span>
                      <span className="text-xs text-neutral-500 ml-2">
                        — {event.customerName} ({formatINR(event.amount)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {onOpenCaseId && event.caseId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCaseId(event.caseId);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 rounded border border-neutral-300 transition-all flex items-center space-x-1 cursor-pointer"
                        title={`Inspect Case ${event.caseId}`}
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {isSuccess ? `+${formatINR(event.amount)}` : event.resultStatus}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Expandable Details Box */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#F0F0F0] pl-20 space-y-3 animate-fade-in text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg p-4">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] block mb-1">
                          Decision
                        </span>
                        <p className="text-neutral-900 font-medium font-mono">
                          {event.decision}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] block mb-1">
                          Policy Check
                        </span>
                        <p className="text-neutral-700">
                          {event.policy}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] block mb-1">
                          Reason
                        </span>
                        <p className="text-neutral-800 leading-relaxed bg-white border border-[#EAEAEA] p-2.5 rounded">
                          “{event.reason}”
                        </p>
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] block mb-0.5">
                            Result
                          </span>
                          <span className="font-mono text-neutral-900 font-medium">
                            {event.result}
                          </span>
                        </div>

                        {onOpenCaseId && event.caseId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCaseId(event.caseId);
                            }}
                            className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white font-medium text-xs rounded flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <span>Inspect Case {event.caseId}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
