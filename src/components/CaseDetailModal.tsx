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
import { RecoveryCase } from '../types';
import { formatINR } from '../utils/formatters';

interface CaseDetailModalProps {
  caseItem: RecoveryCase | null;
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  isOpen,
  onClose,
  onExecuteAction
}) => {
  if (!isOpen || !caseItem) return null;

  const isRecovered = caseItem.status === 'Recovered';
  const isNeedsReview = caseItem.status === 'Needs review';
  const isAwaiting = caseItem.status === 'Awaiting payment';

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="case-detail-modal-overlay"
      onClick={onClose}
    >
      <div 
        id="case-detail-modal-container"
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between bg-white">
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
                <span>{caseItem.status}</span>
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
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#EAEAEA]">
          {/* LEFT: Recovery timeline */}
          <div className="space-y-4 pr-0 md:pr-4" id="timeline-column">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                Recovery timeline
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">
                Audit Trail ({caseItem.timeline.length} events)
              </span>
            </div>

            {/* Thin vertical timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-200">
              {caseItem.timeline.map((event, idx) => {
                const isSuccess = event.type === 'success';
                const isFailure = event.type === 'failure';
                const isAction = event.type === 'action';
                const isDiagnosis = event.type === 'diagnosis';

                return (
                  <div key={event.id || idx} className="relative group">
                    {/* Timeline Node Point */}
                    <div 
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isSuccess
                          ? 'border-emerald-600 text-emerald-600'
                          : isFailure
                          ? 'border-rose-500 text-rose-500'
                          : isAction
                          ? 'border-blue-600 text-blue-600'
                          : 'border-neutral-400 text-neutral-500'
                      }`}
                    >
                      <div 
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSuccess
                            ? 'bg-emerald-600'
                            : isFailure
                            ? 'bg-rose-500'
                            : isAction
                            ? 'bg-blue-600'
                            : 'bg-neutral-400'
                        }`} 
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#171717]">
                          {event.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#737373]">
                          {event.timeDisplay}
                        </span>
                      </div>
                      <p className="text-xs text-[#737373] leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: AI decision & Bounded action */}
          <div className="space-y-5 pl-0 md:pl-8 pt-6 md:pt-0" id="ai-decision-column">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#737373] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
                <span>AI decision</span>
              </div>

              {/* Recommended Action Card */}
              <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-[11px] text-[#737373] font-medium block">
                    Recommended action
                  </span>
                  <span className="text-base font-semibold text-[#171717] mt-0.5 block">
                    {caseItem.recommendedAction}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#737373] font-medium block mb-1">
                    Why
                  </span>
                  <p className="text-xs text-[#171717] leading-relaxed bg-white border border-[#EAEAEA] p-3 rounded-md">
                    “{caseItem.aiWhy}”
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
            <div className="pt-2">
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
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#171717] hover:bg-neutral-800 rounded-lg transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute {caseItem.recommendedAction}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#737373]">
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
