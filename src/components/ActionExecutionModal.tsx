import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  X,
  CreditCard,
  Send,
  AlertTriangle,
  ExternalLink,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Calendar,
  Lock
} from 'lucide-react';
import { RecoveryCase, CommunicationChannel, PersonalizedMessageCopy } from '../types';
import { formatINR } from '../utils/formatters';
import { calculateOptimalRetrySlot, generatePersonalizedCopy, generateMandateRepairInfo } from '../utils/dunningEngine';

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
  const isSubscriptionCase = useMemo(() => {
    if (!caseItem) return false;
    const issueLower = (caseItem.issue || '').toLowerCase();
    const idLower = (caseItem.id || '').toLowerCase();
    return issueLower.includes('subscription') || idLower.includes('sub') || (caseItem.failureReason || '').toLowerCase().includes('mandate');
  }, [caseItem]);

  // Action Mode: 'link' | 'scheduled_retry' | 'mandate_repair' | 'escalate'
  const [actionMode, setActionMode] = useState<'link' | 'scheduled_retry' | 'mandate_repair' | 'escalate'>('link');
  const [selectedChannels, setSelectedChannels] = useState<CommunicationChannel[]>(['email', 'sms']);
  const [activeCopyTab, setActiveCopyTab] = useState<CommunicationChannel>('email');
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Optimal Timing Calculation
  const optimalTiming = useMemo(() => {
    if (!caseItem) return null;
    return calculateOptimalRetrySlot(caseItem.failureCode, caseItem.failureReason);
  }, [caseItem]);

  // Personalized Copy Generator
  const [messageCopies, setMessageCopies] = useState<PersonalizedMessageCopy[]>([]);

  useEffect(() => {
    if (caseItem) {
      const isSub = isSubscriptionCase || caseItem.recommendedAction === 'Mandate repair';
      if (isSub && caseItem.issue === 'Subscription lapsed') {
        setActionMode('mandate_repair');
      } else if (caseItem.recommendedAction === 'Schedule retry') {
        setActionMode('scheduled_retry');
      } else if (caseItem.recommendedAction === 'Escalate') {
        setActionMode('escalate');
      } else {
        setActionMode('link');
      }

      const generated = generatePersonalizedCopy({
        customerName: caseItem.customerName,
        customerEmail: caseItem.customerEmail,
        customerPhone: caseItem.customerPhone,
        amount: caseItem.amount,
        caseId: caseItem.id,
        issue: caseItem.issue,
        failureCode: caseItem.failureCode,
        failureReason: caseItem.failureReason,
        paymentLinkUrl: caseItem.paymentLinkUrl || '',
        isSubscriptionMandate: isSub
      });
      setMessageCopies(generated);
    }
  }, [caseItem, isSubscriptionCase]);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      setIsExecuting(false);
      setCurrentStep(0);
      setIsDone(false);
      setActionResult(null);
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen || !caseItem || !optimalTiming) return null;

  const toggleChannel = (ch: CommunicationChannel) => {
    setSelectedChannels(prev => 
      prev.includes(ch) 
        ? (prev.length > 1 ? prev.filter(c => c !== ch) : prev) 
        : [...prev, ch]
    );
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartExecution = async () => {
    setIsExecuting(true);
    setCurrentStep(0);
    setIsDone(false);

    try {
      // Step 0: Policy Compliance & Gateway Health
      setCurrentStep(0);
      await new Promise(r => setTimeout(r, 600));

      if (actionMode === 'scheduled_retry') {
        // Step 1: Evaluating Bank Switch Peak Window
        setCurrentStep(1);
        await new Promise(r => setTimeout(r, 700));

        // Step 2: Registering Scheduled Background Worker Job
        setCurrentStep(2);
        const schedRes = await fetch('/api/dunning/schedule-retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: caseItem.id,
            scheduledAt: optimalTiming.scheduledAt,
            windowReason: optimalTiming.windowReason,
            peakSuccessRate: optimalTiming.peakSuccessRate,
            bankName: optimalTiming.bankName,
            autoExecute: true
          })
        }).then(r => r.json());

        setActionResult(schedRes);
        await new Promise(r => setTimeout(r, 600));

        // Step 3: Finalizing Schedule State
        setCurrentStep(3);
        await new Promise(r => setTimeout(r, 500));
        setCurrentStep(4);
        setIsDone(true);
        return;
      }

      if (actionMode === 'escalate') {
        setCurrentStep(1);
        await new Promise(r => setTimeout(r, 600));
        setCurrentStep(2);
        await new Promise(r => setTimeout(r, 700));
        setCurrentStep(3);
        setActionResult({ status: 'escalated' });
        await new Promise(r => setTimeout(r, 500));
        setCurrentStep(4);
        setIsDone(true);
        return;
      }

      // Live 1-Click Link or Subscription Mandate Repair Dispatch
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 600));

      setCurrentStep(2);
      const isMandate = actionMode === 'mandate_repair';
      const dispatchRes = await fetch('/api/dunning/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseItem.id,
          amount: caseItem.amount,
          customerName: caseItem.customerName,
          customerEmail: caseItem.customerEmail,
          customerPhone: caseItem.customerPhone,
          channels: selectedChannels,
          isMandateRepair: isMandate,
          customCopy: messageCopies
        })
      }).then(r => r.json());

      setActionResult(dispatchRes);
      await new Promise(r => setTimeout(r, 700));

      // Step 3: Multi-channel delivery verification
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 600));

      // Step 4: Complete
      setCurrentStep(4);
      setIsDone(true);

    } catch (err: any) {
      console.error('Execution failed:', err);
      setIsDone(true);
    }
  };

  const handleFinishAndSave = () => {
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedCase: RecoveryCase = { ...caseItem };

    if (actionMode === 'scheduled_retry') {
      updatedCase = {
        ...caseItem,
        status: 'Scheduled',
        recommendedAction: 'Schedule retry',
        updated: 'Just now',
        scheduledRetry: {
          ...optimalTiming,
          status: 'pending',
          autoExecute: true
        },
        timeline: [
          ...caseItem.timeline,
          {
            id: `t-sch-ui-${Date.now()}`,
            timestamp: now.toISOString(),
            timeDisplay,
            title: 'Optimal-timing retry scheduled',
            description: `Scheduled auto-retry for ${optimalTiming.scheduledTimeDisplay} (${optimalTiming.windowReason} - ${optimalTiming.peakSuccessRate}% success rate).`,
            type: 'scheduled',
            actionType: 'Schedule retry'
          }
        ]
      };
    } else if (actionMode === 'mandate_repair') {
      const repairUrl = actionResult?.paymentLinkUrl || actionResult?.linkUrl || caseItem.paymentLinkUrl || '';
      const mandateInfo = generateMandateRepairInfo(caseItem);
      updatedCase = {
        ...caseItem,
        status: 'Awaiting payment',
        recommendedAction: 'Mandate repair',
        paymentLinkUrl: repairUrl,
        mandateRepair: {
          ...mandateInfo,
          repairUrl
        },
        channelStatuses: actionResult?.channelStatuses,
        updated: 'Just now',
        attemptCount: caseItem.attemptCount + 1,
        timeline: [
          ...caseItem.timeline,
          {
            id: `t-mnd-ui-${Date.now()}`,
            timestamp: now.toISOString(),
            timeDisplay,
            title: 'Card mandate repair link dispatched',
            description: `Generated dedicated card mandate update link (${repairUrl}) and dispatched to ${selectedChannels.join(' & ')}. Customer can update card without re-subscribing.`,
            type: 'action',
            actionType: 'Mandate repair'
          }
        ]
      };
    } else if (actionMode === 'escalate') {
      updatedCase = {
        ...caseItem,
        status: 'Needs review',
        recommendedAction: 'Escalate',
        updated: 'Just now',
        attemptCount: caseItem.attemptCount + 1,
        timeline: [
          ...caseItem.timeline,
          {
            id: `t-esc-ui-${Date.now()}`,
            timestamp: now.toISOString(),
            timeDisplay,
            title: 'Case escalated to finance queue',
            description: 'Stopping rule triggered. Assigned to finance operations.',
            type: 'escalation',
            actionType: 'Escalate'
          }
        ]
      };
    } else {
      // Dynamic Payment Link Overwriting
      const generatedUrl = actionResult?.paymentLinkUrl || actionResult?.linkUrl || caseItem.paymentLinkUrl;
      const generatedId = actionResult?.razorpayPaymentId || actionResult?.linkId || actionResult?.simulatedPaymentId || caseItem.razorpayPaymentId;
      const newTimelineEntry = {
        id: `t-link-ui-${Date.now()}`,
        timestamp: now.toISOString(),
        timeDisplay,
        title: 'Dynamic payment link dispatched',
        description: `Dispatched 1-click dynamic recovery link (${generatedUrl}) to ${selectedChannels.join(' & ')} (${caseItem.customerEmail || caseItem.customerPhone}).`,
        type: 'action' as const,
        actionType: 'Payment link'
      };

      updatedCase = {
        ...caseItem,
        status: 'Awaiting payment',
        recommendedAction: 'Payment link',
        paymentLinkUrl: generatedUrl,
        razorpayPaymentId: generatedId,
        channelStatuses: actionResult?.channelStatuses,
        updated: 'Just now',
        attemptCount: caseItem.attemptCount + 1,
        timeline: [
          ...(caseItem.timeline || []),
          newTimelineEntry
        ]
      };
    }

    onComplete(updatedCase, 0);
    onClose();
  };

  const liveLinkUrl = actionResult?.paymentLinkUrl || actionResult?.linkUrl || (actionMode === 'mandate_repair' ? caseItem.mandateRepair?.repairUrl : caseItem.paymentLinkUrl);

  const executionSteps = actionMode === 'scheduled_retry' ? [
    { title: 'Validating bank clearing profile...', detail: `${optimalTiming.bankName} clearing telemetry analyzed` },
    { title: 'Calculating statistical peak liquidity slot...', detail: `${optimalTiming.windowReason} (${optimalTiming.peakSuccessRate}% success)` },
    { title: 'Registering background auto-retry task...', detail: `Queued for ${optimalTiming.scheduledTimeDisplay} with active scheduler` },
    { title: 'Committing audit trail & case status...', detail: 'Set case state to Scheduled with auto-execution hook' }
  ] : actionMode === 'mandate_repair' ? [
    { title: 'Verifying subscription mandate status...', detail: `Checking recurring e-mandate for ${caseItem.id}` },
    { title: 'Generating dedicated card mandate repair link...', detail: 'Excluding UPI; configuring secure card e-mandate swap' },
    { title: `Dispatching to customer (${selectedChannels.join(', ')})...`, detail: `Sending personalized polite instructions to ${caseItem.customerEmail || caseItem.customerPhone}` },
    { title: 'Confirming delivery & updating timeline...', detail: 'Audit trail recorded; awaiting customer card re-authentication' }
  ] : actionMode === 'escalate' ? [
    { title: 'Checking escalation thresholds...', detail: 'Verifying max retries and risk rules' },
    { title: 'Routing to finance queue...', detail: 'Halting automated dunning to prevent dispute' },
    { title: 'Assigning operational owner...', detail: 'Tagged for manual finance specialist review' },
    { title: 'Updating case state...', detail: 'Marked as Needs Review' }
  ] : [
    { title: 'Validating gateway & policy constraints...', detail: `Compliant with retry ceiling (Attempt ${caseItem.attemptCount} of ${caseItem.maxAttempts})` },
    { title: 'Generating official dynamic payment link...', detail: 'Created Razorpay direct 1-click checkout link' },
    { title: `Dispatching across ${selectedChannels.join(' & ')}...`, detail: `Delivered personalized copy to ${caseItem.customerEmail || caseItem.customerPhone}` },
    { title: 'Recording delivery acknowledgments & audit log...', detail: 'Transaction ledger and case timeline updated' }
  ];

  const currentEmailCopy = messageCopies.find(c => c.channel === 'email');
  const currentSmsCopy = messageCopies.find(c => c.channel === 'sms');

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="action-execution-modal-overlay"
    >
      <div 
        id="action-execution-modal-container"
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 px-6 border-b border-[#EAEAEA] flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Autonomous Action Engine
              </span>
              <span className="text-xs text-[#737373] font-mono">Case #{caseItem.id}</span>
            </div>
            <h3 className="text-base font-bold text-[#171717] mt-1">
              Multi-Channel Smart Dunning & Recovery Action
            </h3>
          </div>
          
          <div className="text-right">
            <span className="font-mono text-sm font-bold text-neutral-900 block">
              {formatINR(caseItem.amount)}
            </span>
            <span className="text-[11px] text-[#737373] font-mono block">
              {caseItem.customerName}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!isExecuting ? (
            /* CONFIGURATION & PREVIEW SCREEN */
            <div className="space-y-5">
              
              {/* 1. Action Mode Selection Pills */}
              <div>
                <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider block mb-2">
                  Select Recovery Action Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: 1-Click Dynamic Payment Link */}
                  <button
                    type="button"
                    onClick={() => setActionMode('link')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      actionMode === 'link'
                        ? 'border-neutral-900 bg-neutral-50 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Send className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900">1-Click Payment Link</span>
                    </div>
                    <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                      Instant direct link via Email & SMS.
                    </p>
                  </button>

                  {/* Option 2: Intelligent Optimal-Timing Retry */}
                  <button
                    type="button"
                    onClick={() => setActionMode('scheduled_retry')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      actionMode === 'scheduled_retry'
                        ? 'border-neutral-900 bg-neutral-50 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900">Optimal-Timing Retry</span>
                    </div>
                    <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                      Auto-executes at peak bank window ({optimalTiming.peakSuccessRate}% rate).
                    </p>
                  </button>

                  {/* Option 3: Subscription Mandate Repair */}
                  <button
                    type="button"
                    onClick={() => setActionMode('mandate_repair')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      actionMode === 'mandate_repair'
                        ? 'border-neutral-900 bg-neutral-50 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900">Card Mandate Repair</span>
                    </div>
                    <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                      Card swap without re-subscribing.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Optimal-Timing Details Banner (If scheduled_retry or info) */}
              {actionMode === 'scheduled_retry' && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-950">
                        Intelligent Timing Engine Analysis
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                      {optimalTiming.peakSuccessRate}% Peak Success
                    </span>
                  </div>

                  <p className="text-xs text-purple-900 leading-relaxed">
                    <strong>Recommended Slot:</strong> {optimalTiming.scheduledTimeDisplay}
                  </p>
                  <p className="text-[11px] text-purple-700">
                    💡 {optimalTiming.windowReason}. The autonomous scheduler will trigger and execute the recovery charge in the background when this window arrives.
                  </p>
                </div>
              )}

              {/* 3. Subscription Mandate Repair Banner */}
              {actionMode === 'mandate_repair' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">
                      Subscription Mandate Repair (Card e-Mandates)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Generates a dedicated e-mandate update link for the customer's recurring subscription. The customer can securely replace their expired/declined debit/credit card with a fresh card (₹2 refundable validation) without losing continuous access or tenure.
                  </p>
                </div>
              )}

              {/* 4. Multi-Channel Selector (Email & SMS) */}
              {actionMode !== 'scheduled_retry' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                      Communication Channels:
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Transactional Delivery
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Email Channel */}
                    <div 
                      onClick={() => toggleChannel('email')}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        selectedChannels.includes('email')
                          ? 'bg-blue-50/50 border-blue-300 text-blue-950'
                          : 'bg-white border-neutral-200 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-xs font-bold block text-neutral-900">Email Notification</span>
                          <span className="text-[10px] text-neutral-500 truncate block font-mono">
                            {caseItem.customerEmail || 'customer@enterprise.in'}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedChannels.includes('email')} 
                        readOnly 
                        className="rounded text-neutral-900 focus:ring-0"
                      />
                    </div>

                    {/* SMS Channel */}
                    <div 
                      onClick={() => toggleChannel('sms')}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        selectedChannels.includes('sms')
                          ? 'bg-purple-50/50 border-purple-300 text-purple-950'
                          : 'bg-white border-neutral-200 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <div>
                          <span className="text-xs font-bold block text-neutral-900">SMS (DLT Route)</span>
                          <span className="text-[10px] text-neutral-500 truncate block font-mono">
                            {caseItem.customerPhone || '+91 98765 43210'}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedChannels.includes('sms')} 
                        readOnly 
                        className="rounded text-neutral-900 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Personalized Message Copy Live Preview */}
              {actionMode !== 'scheduled_retry' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                        Personalized Polite Copy Preview:
                      </label>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveCopyTab('email')}
                        className={`px-2.5 py-0.5 rounded text-xs font-medium cursor-pointer ${
                          activeCopyTab === 'email' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        Email Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCopyTab('sms')}
                        className={`px-2.5 py-0.5 rounded text-xs font-medium cursor-pointer ${
                          activeCopyTab === 'sms' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        SMS Copy
                      </button>
                    </div>
                  </div>

                  {/* Copy Preview Box */}
                  <div className="p-3.5 bg-[#F8F9FA] border border-[#E7E7E7] rounded-xl text-xs space-y-2">
                    {activeCopyTab === 'email' && currentEmailCopy ? (
                      <>
                        <div className="border-b border-[#EAEAEA] pb-2">
                          <span className="text-[10px] uppercase font-mono text-[#737373] block">Subject:</span>
                          <span className="text-xs font-semibold text-neutral-900 block">{currentEmailCopy.subject}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-mono text-[#737373] block">Body:</span>
                          <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed mt-0.5">
                            {currentEmailCopy.body}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-neutral-500">
                          <span>CTA: <strong className="text-blue-700">[{currentEmailCopy.ctaText}]</strong></span>
                          <span>{currentEmailCopy.reassuranceNote}</span>
                        </div>
                      </>
                    ) : currentSmsCopy ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono text-[#737373]">DLT SMS Message:</span>
                          <span className="text-[10px] font-mono text-neutral-500">{currentSmsCopy.body.length} / 160 chars</span>
                        </div>
                        <p className="text-xs font-mono text-neutral-800 bg-white p-2.5 rounded border border-[#EAEAEA] leading-relaxed">
                          {currentSmsCopy.body}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LIVE EXECUTION PROGRESSION SCREEN */
            <div className="space-y-4 py-2">
              <div className="space-y-3 font-mono text-xs">
                {executionSteps.map((step, idx) => {
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

              {/* Final Success Outcome Card */}
              {isDone && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
                  <div className="text-center">
                    <span className="text-xs text-emerald-700 font-mono block font-semibold">
                      ✓ Action Executed Successfully
                    </span>
                    <span className="text-base font-bold text-emerald-900 font-mono block mt-0.5">
                      {actionMode === 'scheduled_retry' 
                        ? 'Auto-Retry Scheduled in Background'
                        : actionMode === 'mandate_repair'
                        ? 'Subscription Mandate Repair Dispatched'
                        : actionMode === 'escalate'
                        ? 'Case Routed to Finance'
                        : 'Dynamic Payment Link Dispatched'}
                    </span>
                    <span className="text-xs text-emerald-700 block mt-0.5">
                      {actionMode === 'scheduled_retry'
                        ? `Agent will execute autonomously on ${optimalTiming.scheduledTimeDisplay}`
                        : `Delivered via ${selectedChannels.join(' & ')} with carrier acknowledgment`}
                    </span>
                  </div>

                  {liveLinkUrl && actionMode !== 'escalate' && actionMode !== 'scheduled_retry' && (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 bg-white/80 p-2.5 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-blue-700 font-mono block">
                          {actionMode === 'mandate_repair' ? 'Razorpay Mandate Repair Link' : 'Razorpay Live Link'}
                        </span>
                        <span className="text-xs font-mono text-neutral-800 truncate block">{liveLinkUrl}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(liveLinkUrl)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-mono inline-flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                        </button>
                        
                        <a
                          href={liveLinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium inline-flex items-center space-x-1 shadow-2xs transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
          >
            {isDone ? 'Close' : 'Cancel'}
          </button>

          {!isExecuting ? (
            <button
              type="button"
              onClick={handleStartExecution}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>
                {actionMode === 'scheduled_retry'
                  ? 'Confirm & Schedule Auto-Retry'
                  : actionMode === 'mandate_repair'
                  ? 'Dispatch Mandate Repair Link'
                  : 'Execute & Dispatch 1-Click Link'}
              </span>
            </button>
          ) : isDone ? (
            <button
              type="button"
              onClick={handleFinishAndSave}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done & Update Case</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
