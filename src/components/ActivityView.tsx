import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { ActivityEvent } from '../types';
import { formatINR } from '../utils/formatters';

interface ActivityViewProps {
  activities: ActivityEvent[];
  onOpenCaseId?: (caseId: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  onOpenCaseId
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([activities[0]?.id || 'act-101']));
  const [filterType, setFilterType] = useState<string>('all');

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const filteredActivities = activities
    .filter((act) => {
      if (filterType === 'success') return act.resultStatus === 'success';
      if (filterType === 'escalated') return act.resultStatus === 'warning';
      return true;
    })
    .slice()
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : (a.id ? parseInt(a.id.replace(/\D/g, '')) || 0 : 0);
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : (b.id ? parseInt(b.id.replace(/\D/g, '')) || 0 : 0);
      return timeB - timeA; // Recent (newest) to oldest
    });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6" id="agent-activity-page">
      {/* Header Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-[#171717]">Agent activity</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
