import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  CreditCard, 
  Send, 
  RefreshCw,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { RecoveryCase, PaymentRecord } from '../types';
import { formatINR, formatTimelineDateTime } from '../utils/formatters';

interface CaseDetailModalProps {
  caseItem: RecoveryCase | null;
  payments?: PaymentRecord[];
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  payments = [],
  isOpen,
  onClose,
  onExecuteAction
}) => {
  if (!isOpen || !caseItem) return null;

  const isRecovered = caseItem.status === 'Recovered';
  const isNeedsReview = caseItem.status === 'Needs review';
  const isAwaiting = caseItem.status === 'Awaiting payment' || caseItem.status === 'In progress';

  // Combine caseItem.timeline with any matching live payments from Payments Ledger in real-time
  const liveTimelineEvents = React.useMemo(() => {
    const events = [...(caseItem.timeline || [])];
    const existingIds = new Set(events.map((t: any) => t.id));

    if (payments && payments.length > 0) {
      const cEmail = (caseItem.customerEmail || '').toLowerCase();
      const cId = caseItem.id;
      const rzpId = caseItem.razorpayPaymentId;

      payments.forEach(p => {
        const pEmail = (p.customerEmail || '').toLowerCase();
        const pId = p.razorpayPaymentId || p.id;
        const isMatch = (p.caseId && (cId === p.caseId || cId.includes(p.caseId) || p.caseId.includes(cId))) ||
                        (rzpId && (rzpId === pId || rzpId === p.id)) ||
                        (pEmail && cEmail && pEmail === cEmail);

        if (isMatch) {
          const tId = `t-pay-live-${pId}`;
          if (!existingIds.has(tId) && !existingIds.has(`t-pay-${pId}`) && !existingIds.has(pId)) {
            const isSuccess = p.status === 'succeeded';
            events.push({
              id: tId,
              timestamp: p.isoTimestamp || (p.timestamp ? new Date(p.timestamp).toISOString() : new Date().toISOString()),
              timeDisplay: p.timestamp || 'Just now',
              title: isSuccess ? `Payment captured: ${formatINR(p.amount)}` : `Payment attempt failed (${p.failureReason || p.method || 'Declined'})`,
              description: isSuccess
                ? `Razorpay confirmed capture of ${formatINR(p.amount)} via ${p.method || 'Gateway'} (ref: ${pId}). Revenue recovered.`
                : `Payment attempt ${pId} for ${formatINR(p.amount)} failed (${p.failureReason || 'Declined by bank network'}).`,
              type: isSuccess ? 'success' : 'failure',
              actionType: isSuccess ? 'Recovery' : 'Payment link'
            });
            existingIds.add(tId);
          }
        }
      });
    }

    return events.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }, [caseItem, payments]);

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="case-detail-modal-overlay"
      onClick={onClose}
    >
      <div 
        id="case-detail-modal-container"
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-[#171717] tracking-tight">
                {caseItem.customerName}
              </h2>
              {/* Status Badge */}
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1.5 ${
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
                <span>{isRecovered ? 'Recovered' : caseItem.status}</span>
              </span>
            </div>

            <div className="flex items-center space-x-3 mt-1.5 text-xs text-[#737373]">
              <span className="font-mono font-semibold text-neutral-900 text-sm">
                {formatINR(caseItem.amount)} at risk
              </span>
              <span>•</span>
              <span>Case ID: <span className="font-mono">{caseItem.id}</span></span>
              {caseItem.companyName && (
                <>
                  <span>•</span>
                  <span>{caseItem.companyName}</span>
                </>
              )}
            </div>
          </div>

          <button
            id="close-case-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E7E7E7] hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two-Column Layout */}
        <div className="p-6 flex-1 min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#EAEAEA]">
          {/* LEFT: Recovery timeline (Independently Scrollable) */}
          <div className="space-y-4 pr-0 md:pr-4 overflow-y-auto h-full" id="timeline-column">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2 z-10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                Recovery timeline
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Audit Trail ({liveTimelineEvents.length} events)
              </span>
            </div>

            {/* Thin vertical timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-200 pb-4">
              {liveTimelineEvents
                .map((event, idx) => {
                  const isSuccess = event.type === 'success';
                  const isFailure = event.type === 'failure';
                  const isAction = event.type === 'action';
                  const isDiagnosis = event.type === 'diagnosis';
                  const isEscalation = event.type === 'escalation';

                  return (
                    <div key={event.id || idx} className="relative group">
                      {/* Timeline Node Point */}
                      <div 
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isSuccess
                            ? 'border-emerald-600 text-emerald-600'
                            : isFailure
                            ? 'border-rose-500 text-rose-500'
                            : isEscalation
                            ? 'border-amber-500 text-amber-600'
                            : isAction
                            ? 'border-blue-600 text-blue-600'
                            : isDiagnosis
                            ? 'border-purple-600 text-purple-600'
                            : 'border-neutral-400 text-neutral-500'
                        }`}
                      >
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSuccess
                              ? 'bg-emerald-600'
                              : isFailure
                              ? 'bg-rose-500 animate-pulse'
                              : isEscalation
                              ? 'bg-amber-500'
                              : isAction
                              ? 'bg-blue-600'
                              : isDiagnosis
                              ? 'bg-purple-600'
                              : 'bg-neutral-400'
                          }`} 
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-[#171717]">
                              {event.title}
                            </span>
                            {isFailure && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-medium">
                                Incident
                              </span>
                            )}
                            {isDiagnosis && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium">
                                AI Evaluated
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#737373] whitespace-nowrap ml-2">
                            {formatTimelineDateTime(event.timestamp, event.timeDisplay)}
                          </span>
                        </div>
                        <p className="text-xs text-[#525252] leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT: AI decision & Bounded action (Independent Panel) */}
          <div className="space-y-5 pl-0 md:pl-8 pt-6 md:pt-0 overflow-y-auto h-full pr-1" id="ai-decision-column">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3 sticky top-0 bg-white pb-1 z-10">
                <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                <span>AI decision</span>
              </div>

              {/* Recommended Action Card */}
              <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-[11px] text-[#737373] font-medium block">
                    Recommended action
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-base font-semibold text-[#171717]">
                      {isRecovered ? 'None (Payment Settled)' : caseItem.recommendedAction}
                    </span>
                    {isRecovered && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                        ✓ Recovered
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#737373] font-medium block mb-1">
                    Why
                  </span>
                  <p className="text-xs text-[#171717] leading-relaxed bg-white border border-[#EAEAEA] p-3 rounded-md">
                    “{isRecovered 
                      ? `Transaction of ${formatINR(caseItem.recoveredAmount || caseItem.amount)} has been successfully captured and settled on Razorpay. Revenue recovery complete.` 
                      : caseItem.aiWhy}”
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E7E7E7] p-3 rounded-lg">
                <span className="text-[11px] text-[#737373] block">Recovery probability</span>
                <span className="text-lg font-bold font-mono text-emerald-800 mt-0.5 block">
                  {caseItem.recoveryProbability}%
                </span>
              </div>

              <div className="bg-white border border-[#E7E7E7] p-3 rounded-lg">
                <span className="text-[11px] text-[#737373] block">Attempt count</span>
                <span className="text-lg font-bold font-mono text-[#171717] mt-0.5 block">
                  {caseItem.attemptCount} of {caseItem.maxAttempts}
                </span>
              </div>
            </div>

            {/* Policy Compliance Note */}
            <div className="bg-white border border-[#E7E7E7] p-3.5 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-neutral-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Policy constraint check</span>
              </div>
              <p className="text-[11px] text-[#737373]">
                {caseItem.aiPolicyNote}
              </p>
            </div>

            {/* Action Trigger Box */}
            <div className="pt-2 space-y-2">
              {caseItem.paymentLinkUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono text-blue-700 block uppercase font-bold">Razorpay Live Link</span>
                    <span className="text-xs font-mono text-blue-900 truncate block">{caseItem.paymentLinkUrl}</span>
                  </div>
                  <a
                    href={caseItem.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shrink-0 transition-colors shadow-2xs"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {isRecovered ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <span className="text-xs font-semibold text-emerald-800 font-mono block">
                    ✓ {formatINR(caseItem.recoveredAmount || caseItem.amount)} recovered
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-0.5 block">
                    Settled at {caseItem.recoveredAt || 'Today'}
                  </span>
                </div>
              ) : (
                <button
                  id="execute-case-action-btn"
                  onClick={() => {
                    onExecuteAction(caseItem);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#171717] hover:bg-neutral-800 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute {caseItem.recommendedAction}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#737373] shrink-0">
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span>Payment ID: {caseItem.razorpayPaymentId || 'N/A'}</span>
            <span>•</span>
            <span>Method: {caseItem.paymentMethod}</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-700 hover:text-neutral-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
