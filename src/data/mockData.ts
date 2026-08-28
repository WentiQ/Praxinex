import { RecoveryCase, ActivityEvent, RecoveryPolicy, MerchantProfile, PaymentRecord, CustomerRecord } from '../types';
import firstNames from '../../data/first_names.json';
import lastNames from '../../data/last_names.json';

export const INITIAL_MERCHANT: MerchantProfile = {
  id: 'mer_acme_8921',
  name: 'Acme Technologies Pvt Ltd',
  email: 'dineshpolavarapu66@gmail.com',
  currency: 'INR',
  businessType: 'SaaS & Enterprise AI Services',
  plan: 'Enterprise Operations',
  razorpayKeyId: 'rzp_test_TSolTvUZ0mStxn',
  razorpayKeySecret: 'jJtOV3iYoa1XPuuSDVj76nwc',
  isTestMode: true,
  razorpayConnected: true,
  geminiApiKey: '',
  geminiConnected: true,
  lastSyncedAt: 'Just now'
};

export const INITIAL_POLICIES: RecoveryPolicy = {
  autoRetry: true,
  maxRetries: 2,
  retryCooldownHours: 6,
  autoReminders: true,
  maxReminders: 3,
  reminderIntervalHours: 24,
  escalateAfterFailedAttempts: 2,
  requireApprovalForHighRisk: true,
  highRiskThresholdAmount: 50000
};

function getRandomNamePair() {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)] || 'Aarav';
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)] || 'Sharma';
  const name = `${fn} ${ln}`;
  const email = `${fn.toLowerCase()}${ln.toLowerCase()}@gmail.com`;
  return { fn, ln, name, email };
}

function getRandomAmount(max = 1000000, min = 1000) {
  const maxSteps = Math.floor(max / 10);
  const minSteps = Math.max(1, Math.floor(min / 10));
  const step = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
  return step * 10;
}

// Generate Initial Sample Cases using 2,500 First Names × 2,500 Last Names
export const INITIAL_CASES: RecoveryCase[] = [
  // 1. Invoice Case (Overdue -> Payment Link Generated)
  (() => {
    const p = getRandomNamePair();
    const amt = getRandomAmount(500000, 50000);
    const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const plinkId = `plink_${Math.random().toString(36).substring(2, 9)}`;
    const plinkUrl = `https://rzp.io/rzp/${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: `RC-${invId}`,
      customerName: p.name,
      customerEmail: p.email,
      customerPhone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyName: `${p.ln} Enterprises`,
      issue: 'Invoice overdue',
      amount: amt,
      risk: amt >= 50000 ? 'High' : 'Medium',
      recommendedAction: 'Payment link',
      status: 'Needs review',
      updated: 'Today',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      failureReason: `Invoice ${invId} settlement window elapsed without payment capture`,
      failureCode: 'INVOICE_OVERDUE',
      paymentMethod: 'Razorpay Invoice Portal',
      invoiceNumber: invId,
      razorpayPaymentId: plinkId,
      paymentLinkUrl: plinkUrl,
      attemptCount: 1,
      maxAttempts: 3,
      recoveryProbability: 78,
      aiWhy: `Invoice ${invId} overdue for ₹${amt.toLocaleString('en-IN')}. Razorpay payment link generated to facilitate immediate settlement.`,
      aiPolicyNote: 'Invoice recovery workflow active',
      policyAllowed: true,
      recoveredAmount: 0,
      timeline: [
        {
          id: `t-${invId}-1`,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          timeDisplay: 'Yesterday, 10:00 AM',
          title: 'Invoice Issued on Razorpay',
          description: `Invoice (${invId}) issued on Razorpay for ₹${amt.toLocaleString('en-IN')}.`,
          type: 'detection'
        },
        {
          id: `t-${invId}-2`,
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          timeDisplay: 'Yesterday, 10:00 PM',
          title: 'Invoice Overdue / Settlement Pending',
          description: `Invoice payment window elapsed without capture for ₹${amt.toLocaleString('en-IN')}.`,
          type: 'failure'
        },
        {
          id: `t-${invId}-3`,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          timeDisplay: '1 hour ago',
          title: 'Payment Link Generated on Razorpay',
          description: `Payment link (${plinkId}: ${plinkUrl}) generated on Razorpay for invoice settlement.`,
          type: 'action'
        }
      ]
    };
  })(),

  // 2. Payment Link Case (Payment Link Generated -> Tracking Active)
  (() => {
    const p = getRandomNamePair();
    const amt = getRandomAmount(250000, 5000);
    const plinkId = `plink_${Math.random().toString(36).substring(2, 9)}`;
    const plinkUrl = `https://rzp.io/rzp/${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: `RC-${plinkId.slice(-6).toUpperCase()}`,
      customerName: p.name,
      customerEmail: p.email,
      customerPhone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyName: `${p.ln} Tech`,
      issue: 'Payment failed',
      amount: amt,
      risk: amt >= 50000 ? 'High' : 'Medium',
      recommendedAction: 'Payment link',
      status: 'Awaiting payment',
      updated: 'Just now',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      failureReason: 'Bank switch network timeout on card transaction',
      failureCode: 'BANK_TIMEOUT',
      paymentMethod: 'Razorpay Gateway',
      razorpayPaymentId: plinkId,
      paymentLinkUrl: plinkUrl,
      attemptCount: 1,
      maxAttempts: 3,
      recoveryProbability: 86,
      aiWhy: `Payment link active on Razorpay for ₹${amt.toLocaleString('en-IN')}. Tracking payment status.`,
      aiPolicyNote: 'Autonomous tracking active',
      policyAllowed: true,
      recoveredAmount: 0,
      timeline: [
        {
          id: `t-${plinkId}-1`,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          timeDisplay: '2 hours ago',
          title: 'Payment Link Generated on Razorpay',
          description: `Payment link (${plinkId}) generated on Razorpay for ₹${amt.toLocaleString('en-IN')}.`,
          type: 'action'
        },
        {
          id: `t-${plinkId}-2`,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          timeDisplay: '1 hour ago',
          title: 'Payment Failed / Pending',
          description: `Transaction attempt declined due to network timeout. Awaiting customer completion.`,
          type: 'failure'
        },
        {
          id: `t-${plinkId}-3`,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          timeDisplay: '15 mins ago',
          title: 'Recovery Link Sent',
          description: `Payment link delivered to ${p.email}. Tracking until payment done.`,
          type: 'diagnosis'
        }
      ]
    };
  })(),

  // 3. Recovered Payment Link Case
  (() => {
    const p = getRandomNamePair();
    const amt = getRandomAmount(100000, 2000);
    const plinkId = `plink_${Math.random().toString(36).substring(2, 9)}`;
    const payId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return {
      id: `RC-${plinkId.slice(-6).toUpperCase()}`,
      customerName: p.name,
      customerEmail: p.email,
      customerPhone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyName: `${p.ln} Solutions`,
      issue: 'Payment failed',
      amount: amt,
      risk: 'Low',
      recommendedAction: 'None (Recovered)',
      status: 'Recovered',
      updated: 'Today',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      failureReason: 'None (Settled)',
      failureCode: 'PAID',
      paymentMethod: 'Razorpay Gateway',
      razorpayPaymentId: plinkId,
      attemptCount: 1,
      maxAttempts: 2,
      recoveryProbability: 100,
      aiWhy: `Payment of ₹${amt.toLocaleString('en-IN')} has been captured and settled via Razorpay (Ref: ${payId}).`,
      aiPolicyNote: 'Revenue recovered. No action required.',
      policyAllowed: true,
      recoveredAmount: amt,
      recoveredAt: 'Earlier today',
      timeline: [
        {
          id: `t-${plinkId}-1`,
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          timeDisplay: '4 hours ago',
          title: 'Payment Link Generated on Razorpay',
          description: `Payment link (${plinkId}) generated on Razorpay for ₹${amt.toLocaleString('en-IN')}.`,
          type: 'action'
        },
        {
          id: `t-${plinkId}-2`,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          timeDisplay: '3 hours ago',
          title: 'Payment Failed',
          description: `Initial card transaction attempt was cancelled.`,
          type: 'failure'
        },
        {
          id: `t-${plinkId}-3`,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          timeDisplay: '2 hours ago',
          title: 'Payment Captured & Settled',
          description: `Payment of ₹${amt.toLocaleString('en-IN')} captured successfully (Ref: ${payId}). Revenue recovered.`,
          type: 'success'
        }
      ]
    };
  })()
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = INITIAL_CASES.map((c, i) => ({
  id: `act-${i + 1}`,
  timestamp: c.createdAt,
  timeDisplay: 'Today',
  dateDisplay: 'Today',
  eventTitle: c.status === 'Recovered' ? 'Payment captured & recovered' : 'Payment link generated on Razorpay',
  caseId: c.id,
  customerName: c.customerName,
  amount: c.amount,
  decision: 'Track payment until completed',
  reason: c.failureReason,
  policy: 'Payment recovery tracking policy',
  result: c.status === 'Recovered' ? `Captured ₹${c.amount.toLocaleString('en-IN')}` : 'Active tracking',
  resultStatus: c.status === 'Recovered' ? 'success' : 'info'
}));

export const REVENUE_TREND_DATA = [
  { date: 'Aug 22', revenueAtRisk: 195000, recovered: 71000, remaining: 124000 },
  { date: 'Aug 23', revenueAtRisk: 210000, recovered: 75000, remaining: 135000 },
  { date: 'Aug 24', revenueAtRisk: 228000, recovered: 81000, remaining: 147000 },
  { date: 'Aug 25', revenueAtRisk: 242000, recovered: 84000, remaining: 158000 },
  { date: 'Aug 26', revenueAtRisk: 248500, recovered: 87500, remaining: 161000 },
  { date: 'Aug 27', revenueAtRisk: 260000, recovered: 92000, remaining: 168000 },
  { date: 'Aug 28', revenueAtRisk: 275000, recovered: 99000, remaining: 176000 }
];

export const FAILURE_CATEGORY_DATA = [
  { name: 'Bank / Gateway Timeout', value: 38, count: 14, recoveredRate: '86%' },
  { name: 'Card Declined / Expired', value: 24, count: 9, recoveredRate: '81%' },
  { name: 'Payment Link Pending', value: 18, count: 7, recoveredRate: '72%' },
  { name: 'Invoice Overdue', value: 12, count: 5, recoveredRate: '64%' },
  { name: 'Authentication Dropped', value: 8, count: 3, recoveredRate: '50%' }
];

export const PAYMENT_LEDGER: PaymentRecord[] = INITIAL_CASES.map((c, i) => ({
  id: `p-${i + 100}`,
  razorpayPaymentId: c.razorpayPaymentId || `pay_${Math.random().toString(36).substring(2, 9)}`,
  customerName: c.customerName,
  customerEmail: c.customerEmail,
  amount: c.amount,
  status: c.status === 'Recovered' ? 'succeeded' : 'failed',
  failureReason: c.status === 'Recovered' ? undefined : c.failureReason,
  method: c.paymentMethod,
  timestamp: 'Today',
  recoveredByAgent: c.status === 'Recovered',
  caseId: c.id
}));

export const CUSTOMER_DIRECTORY: CustomerRecord[] = INITIAL_CASES.map((c, i) => ({
  id: `cust_${i + 1}`,
  name: c.customerName,
  email: c.customerEmail,
  phone: c.customerPhone || `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
  totalSpent: c.amount,
  successfulTransactions: c.status === 'Recovered' ? 1 : 0,
  failedTransactions: c.status === 'Recovered' ? 0 : 1,
  recoveredTransactions: c.status === 'Recovered' ? 1 : 0,
  lifetimeValue: c.amount,
  riskCategory: c.amount >= 50000 ? 'Moderate' : 'Low Risk',
  lastSeen: 'Today'
}));
