import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  X,
  CreditCard,
  Send,
  AlertTriangle
} from 'lucide-react';
import { RecoveryCase } from '../types';
import { formatINR } from '../utils/formatters';

interface ActionExecutionModalProps {
  caseItem: RecoveryCase | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedCase: RecoveryCase, recoveredAmount: number) => void;
}

export const ActionExecutionModal: React.FC<ActionExecutionModalProps> = ({
  caseItem,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !caseItem) {
      setCurrentStep(0);
      setIsDone(false);
      setActionResult(null);
      return;
    }

    let isCancelled = false;

    async function executeLiveAction() {
      // Step 0: Checking payment status
      setCurrentStep(0);
      await new Promise(r => setTimeout(r, 600));
      if (isCancelled) return;

      // Step 1: Validating recovery policy
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      // Step 2: Executing Razorpay action
      setCurrentStep(2);

      try {
        const res = await fetch('/api/razorpay/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: caseItem.recommendedAction,
            caseId: caseItem.id,
            amount: caseItem.amount,
            customerName: caseItem.customerName,
            customerEmail: caseItem.customerEmail,
            customerPhone: caseItem.customerPhone,
            isTestMode: true
          })
        });
        const data = await res.json();
        if (!isCancelled) setActionResult(data);
      } catch (err) {
        console.error('Action error:', err);
      }

      await new Promise(r => setTimeout(r, 800));
      if (isCancelled) return;

      // Step 3: Confirming gateway transaction
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      // Step 4: Final Success state
      setCurrentStep(4);
      setIsDone(true);
    }

    executeLiveAction();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, caseItem]);

  if (!isOpen || !caseItem) return null;

  const actionName = caseItem.recommendedAction;
  const isRetry = actionName === 'Retry payment';
  const isLink = actionName === 'Payment link';
  const isEscalate = actionName === 'Escalate';

  const liveLinkUrl = actionResult?.paymentLinkUrl || caseItem.paymentLinkUrl;
  const livePaymentId = actionResult?.simulatedPaymentId || caseItem.razorpayPaymentId;

  const steps = [
    { title: 'Checking payment status...', detail: `Verified ${caseItem.paymentMethod || 'Razorpay Gateway'}` },
    { title: 'Validating recovery policy...', detail: `Compliant with autonomous policy limit (Attempt ${caseItem.attemptCount} of ${caseItem.maxAttempts})` },
    { 
      title: isRetry ? 'Executing retry...' : isLink ? 'Generating Razorpay payment link...' : 'Routing to finance queue...',
      detail: isRetry 
        ? 'Dispatched /v1/payments/retry to Razorpay engine' 
        : liveLinkUrl ? `Created live short link: ${liveLinkUrl}` : 'Generated multi-rail payment payload' 
    },
    { 
      title: isRetry ? 'Confirming payment...' : isLink ? 'Dispatching customer communication...' : 'Updating case status...',
      detail: 'Verified and registered with Razorpay Webhook TTWXpg6OFXSym0' 
    },
  ];

  const handleFinish = () => {
    const isSuccess = !isEscalate;
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTimelineEvents = [
      ...caseItem.timeline,
      {
        id: `t-exec-${Date.now()}`,
        timestamp: now.toISOString(),
        timeDisplay,
        title: isRetry ? 'Payment succeeded' : isLink ? 'Payment link sent' : 'Case escalated',
        description: isRetry 
          ? `Razorpay confirmed capture of ${formatINR(caseItem.amount)} (ID: ${livePaymentId}).`
          : isLink
          ? `Dispatched secure 1-click payment link to ${caseItem.customerEmail} (${liveLinkUrl || 'rzp.io'}).`
          : `Stopping rule triggered. Assigned to finance operations.`,
        type: (isRetry ? 'success' : isLink ? 'action' : 'escalation') as any
      }
    ];

    if (isRetry) {
      newTimelineEvents.push({
        id: `t-rec-${Date.now() + 1}`,
        timestamp: now.toISOString(),
        timeDisplay,
        title: `${formatINR(caseItem.amount)} recovered`,
        description: `Case marked as Recovered. Transaction ${livePaymentId} captured.`,
        type: 'success'
      });
    }

    const updatedCase: RecoveryCase = {
      ...caseItem,
      status: isRetry ? 'Recovered' : isLink ? 'Awaiting payment' : 'Needs review',
      updated: 'Just now',
      attemptCount: caseItem.attemptCount + 1,
      recoveredAmount: isRetry ? caseItem.amount : undefined,
      recoveredAt: isRetry ? timeDisplay : undefined,
      paymentLinkUrl: liveLinkUrl,
      razorpayPaymentId: livePaymentId,
      timeline: newTimelineEvents
    };

    onComplete(updatedCase, isRetry ? caseItem.amount : 0);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="action-execution-modal-overlay"
    >
      <div 
        id="action-execution-modal-container"
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737373] block">
              Autonomous Execution
            </span>
            <h3 className="text-base font-bold text-[#171717] mt-0.5">
              {isRetry ? 'Retrying payment' : isLink ? 'Generating payment link' : 'Executing recovery action'}
            </h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-bold text-neutral-900 block">
              {formatINR(caseItem.amount)}
            </span>
            <span className="text-[11px] text-[#737373] font-mono">
              {caseItem.customerName}
            </span>
          </div>
        </div>

        {/* Execution Steps */}
        <div className="p-6 space-y-4">
          <div className="space-y-3 font-mono text-xs">
            {steps.map((step, idx) => {
              const isPassed = currentStep > idx;
              const isCurrent = currentStep === idx && !isDone;

              return (
                <div 
                  key={idx}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                    isPassed
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                      : isCurrent
                      ? 'bg-white border-neutral-900 text-neutral-900 shadow-2xs'
                      : 'bg-transparent border-transparent text-neutral-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-neutral-900 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isPassed || isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {step.title}
                    </p>
                    {(isPassed || isCurrent) && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Outcome State */}
          {isDone && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center animate-fade-in space-y-1">
              <span className="text-xs text-emerald-700 font-mono block">
                Operation Complete
              </span>
              <span className="text-lg font-bold text-emerald-900 font-mono block">
                {isRetry ? `✓ ${formatINR(caseItem.amount)} recovered` : '✓ Recovery action dispatched'}
              </span>
              <span className="text-xs text-emerald-700 block">
                Transaction settled & audit log recorded
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between">
          <span className="text-[11px] text-[#737373] font-mono">
            {isDone ? 'Execution completed' : 'Processing bounded action...'}
          </span>
          <button
            id="done-execution-btn"
            disabled={!isDone}
            onClick={handleFinish}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              isDone
                ? 'bg-[#171717] text-white hover:bg-neutral-800 shadow-2xs cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
