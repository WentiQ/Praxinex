import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  PlusCircle, 
  CreditCard, 
  Building, 
  Sparkles,
  Play
} from 'lucide-react';
import { RecoveryCase, IssueType } from '../types';

interface SimulateFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (newCase: RecoveryCase) => void;
}

export const SimulateFailureModal: React.FC<SimulateFailureModalProps> = ({
  isOpen,
  onClose,
  onAddCase
}) => {
  const [customerName, setCustomerName] = useState('Ananya Roy');
  const [customerEmail, setCustomerEmail] = useState('ananya.roy@nexuscad.in');
  const [companyName, setCompanyName] = useState('Nexus CAD India');
  const [amount, setAmount] = useState<number>(14500);
  const [issue, setIssue] = useState<IssueType>('Payment failed');
  const [failureReason, setFailureReason] = useState('Bank switch network timeout on corporate debit card');
  const [paymentMethod, setPaymentMethod] = useState('Axis Bank Corporate Visa ••5501');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const caseId = `RC-${Math.floor(1100 + Math.random() * 900)}`;
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let recommendedAction: any = 'Retry payment';
    let recoveryProbability = 78;
    let risk: any = 'Medium';
    let aiWhy = 'Customer has 5 prior on-time settlements. Temporary bank decline diagnosed with 1 allowed autonomous retry.';

    if (amount > 50000 || issue === 'Invoice overdue') {
      recommendedAction = 'Escalate';
      risk = 'High';
      recoveryProbability = 50;
      aiWhy = 'High value transaction exceeding autonomous limit. Halting automated messages for finance team review.';
    } else if (failureReason.toLowerCase().includes('otp') || failureReason.toLowerCase().includes('auth')) {
      recommendedAction = 'Payment link';
      recoveryProbability = 68;
      aiWhy = '3DS OTP step timed out. Dispatched instant 1-click Razorpay payment link via email & SMS.';
    }

    const newCase: RecoveryCase = {
      id: caseId,
      customerName,
      customerEmail,
      companyName,
      issue,
      amount: Number(amount) || 5000,
      risk,
      recommendedAction,
      status: 'In progress',
      updated: 'Just now',
      createdAt: now.toISOString(),
      failureReason,
      failureCode: 'ISSUER_TIMEOUT',
      paymentMethod,
      razorpayPaymentId: `pay_Nq${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      attemptCount: 1,
      maxAttempts: 2,
      recoveryProbability,
      aiWhy,
      aiPolicyNote: 'Automatic recovery policy allowed',
      policyAllowed: true,
      timeline: [
        {
          id: `t-sim-${Date.now()}-1`,
          timestamp: now.toISOString(),
          timeDisplay,
          title: `${issue} event ingested`,
          description: `${paymentMethod} transaction of ₹${amount.toLocaleString('en-IN')} failed (${failureReason}).`,
          type: 'failure'
        },
        {
          id: `t-sim-${Date.now()}-2`,
          timestamp: now.toISOString(),
          timeDisplay,
          title: 'Revenue risk detected',
          description: 'Recovery Agent detected risk and evaluated historical customer context.',
          type: 'detection'
        },
        {
          id: `t-sim-${Date.now()}-3`,
          timestamp: now.toISOString(),
          timeDisplay,
          title: `AI diagnosed strategy: ${recommendedAction}`,
          description: `Evaluated ${recoveryProbability}% recovery confidence. Checked bounded merchant rules.`,
          type: 'diagnosis'
        }
      ]
    };

    onAddCase(newCase);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="simulate-failure-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-semibold text-[#171717]">Simulate Revenue Risk Event</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-neutral-800 block mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Amount at Risk (₹)</label>
              <input
                type="number"
                required
                min={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 font-mono font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-800 block mb-1">Issue Type</label>
              <select
                value={issue}
                onChange={(e) => setIssue(e.target.value as IssueType)}
                className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="Payment failed">Payment failed</option>
                <option value="Invoice overdue">Invoice overdue</option>
                <option value="Subscription lapsed">Subscription lapsed</option>
                <option value="Checkout abandoned">Checkout abandoned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-800 block mb-1">Failure Reason</label>
            <input
              type="text"
              required
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-800 block mb-1">Payment Method</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-neutral-600 hover:text-neutral-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#171717] hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-2xs transition-colors"
            >
              Inject Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
