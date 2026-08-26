import { RecoveryCase, ActivityEvent, RecoveryPolicy, MerchantProfile, PaymentRecord, CustomerRecord } from '../types';

export const INITIAL_MERCHANT: MerchantProfile = {
  id: 'mer_acme_8921',
  name: 'Acme Technologies Pvt Ltd',
  email: 'finance@acmetech.in',
  currency: 'INR',
  businessType: 'SaaS & Enterprise Services',
  plan: 'Enterprise Operations',
  razorpayKeyId: 'rzp_test_TSolTvUZ0mStxn',
  razorpayKeySecret: 'jJtOV3iYoa1XPuuSDVj76nwc',
  isTestMode: true,
  razorpayConnected: true,
  geminiApiKey: '',
  geminiConnected: true,
  lastSyncedAt: '2 mins ago'
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

export const INITIAL_CASES: RecoveryCase[] = [
  {
    id: 'RC-1092',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@innovate.co.in',
    customerPhone: '+91 98201 44521',
    companyName: 'Innovate Digital',
    issue: 'Payment failed',
    amount: 5000,
    risk: 'High',
    recommendedAction: 'Retry payment',
    status: 'Recovered',
    updated: '5 mins ago',
    createdAt: '2026-08-26T03:45:00Z',
    failureReason: 'Temporary bank decline (Issuer timeout)',
    failureCode: 'ISSUER_TIMEOUT',
    paymentMethod: 'HDFC Visa Debit ••4812',
    razorpayPaymentId: 'pay_Nq9xL12850aA',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 78,
    aiWhy: 'Customer has completed 4 previous successful payments without dispute. The current failure is a temporary bank communication timeout and merchant policy permits 1 automated retry.',
    aiPolicyNote: 'Automatic retry allowed (Policy limit: 2 attempts, cooldown: 6h)',
    policyAllowed: true,
    recoveredAmount: 5000,
    recoveredAt: '10:05 AM',
    timeline: [
      {
        id: 't-1',
        timestamp: '2026-08-26T04:32:00Z',
        timeDisplay: '10:02 AM',
        title: 'Payment failed',
        description: 'HDFC debit card transaction ₹5,000 failed due to issuer bank timeout.',
        type: 'failure'
      },
      {
        id: 't-2',
        timestamp: '2026-08-26T04:33:00Z',
        timeDisplay: '10:03 AM',
        title: 'Revenue risk detected',
        description: 'Recovery agent ingested failure webhook from Razorpay.',
        type: 'detection'
      },
      {
        id: 't-3',
        timestamp: '2026-08-26T04:33:30Z',
        timeDisplay: '10:03 AM',
        title: 'AI diagnosed temporary payment failure',
        description: 'Evaluated 4 prior successful payments (100% on-time). Calculated 78% recovery probability.',
        type: 'diagnosis'
      },
      {
        id: 't-4',
        timestamp: '2026-08-26T04:34:00Z',
        timeDisplay: '10:04 AM',
        title: 'Retry initiated',
        description: 'Executed payment retry via Razorpay gateway following auto-retry policy.',
        type: 'action'
      },
      {
        id: 't-5',
        timestamp: '2026-08-26T04:35:00Z',
        timeDisplay: '10:05 AM',
        title: 'Payment succeeded',
        description: 'Razorpay confirmed transaction capture (ref: pay_Nq9xL12850aA_retry1).',
        type: 'success'
      },
      {
        id: 't-6',
        timestamp: '2026-08-26T04:35:10Z',
        timeDisplay: '10:05 AM',
        title: '₹5,000 recovered',
        description: 'Case marked as Recovered. Merchant revenue balance updated.',
        type: 'success'
      }
    ]
  },
  {
    id: 'RC-1093',
    customerName: 'Priya Mehta',
    customerEmail: 'priya.m@techscale.org',
    customerPhone: '+91 97110 33892',
    companyName: 'TechScale India',
    issue: 'Payment failed',
    amount: 8500,
    risk: 'Medium',
    recommendedAction: 'Payment link',
    status: 'Awaiting payment',
    updated: '14 mins ago',
    createdAt: '2026-08-26T03:30:00Z',
    failureReason: 'Authentication expired (OTP not entered in window)',
    failureCode: '3DS_AUTH_FAILED',
    paymentMethod: 'ICICI NetBanking',
    razorpayPaymentId: 'pay_Nq8yP44109bZ',
    attemptCount: 1,
    maxAttempts: 3,
    recoveryProbability: 64,
    aiWhy: 'Customer abandoned OTP step on checkout. Direct card retries are blocked for 3DS failures; generated a frictionless 1-click Razorpay payment link sent via transactional email.',
    aiPolicyNote: 'Customer communication allowed (Policy limit: 3 reminders, gap: 24h)',
    policyAllowed: true,
    timeline: [
      {
        id: 't-10',
        timestamp: '2026-08-26T04:15:00Z',
        timeDisplay: '09:45 AM',
        title: 'Payment failed',
        description: 'ICICI NetBanking transaction failed (OTP timeout).',
        type: 'failure'
      },
      {
        id: 't-11',
        timestamp: '2026-08-26T04:16:00Z',
        timeDisplay: '09:46 AM',
        title: 'Revenue risk detected',
        description: 'Identified ₹8,500 recurring subscription renewal at risk.',
        type: 'detection'
      },
      {
        id: 't-12',
        timestamp: '2026-08-26T04:17:00Z',
        timeDisplay: '09:47 AM',
        title: 'AI selected payment link action',
        description: '3DS failure diagnosed; bypassing card auto-retry to prevent negative UX.',
        type: 'diagnosis'
      },
      {
        id: 't-13',
        timestamp: '2026-08-26T04:18:00Z',
        timeDisplay: '09:48 AM',
        title: 'Payment link generated & dispatched',
        description: 'Link rzp.io/l/rc_8500_priya dispatched via email and WhatsApp payload.',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-1094',
    customerName: 'Acme Cloud Solutions',
    customerEmail: 'accounts@acmecloud.in',
    customerPhone: '+91 98450 19283',
    companyName: 'Acme Cloud India Ltd',
    issue: 'Invoice overdue',
    amount: 75000,
    risk: 'High',
    recommendedAction: 'Escalate',
    status: 'Needs review',
    updated: '28 mins ago',
    createdAt: '2026-08-26T02:00:00Z',
    failureReason: 'Net-30 Enterprise invoice overdue by 14 days',
    failureCode: 'INVOICE_OVERDUE_14D',
    paymentMethod: 'NEFT / RTGS Transfer',
    invoiceNumber: 'INV-2026-0814',
    attemptCount: 2,
    maxAttempts: 2,
    recoveryProbability: 45,
    aiWhy: 'Exceeded maximum automated reminder threshold (2 sent). High financial exposure (₹75,000 > ₹50,000 policy threshold) requires finance manager review before legal/account hold escalation.',
    aiPolicyNote: 'High-risk policy triggered: Merchant manual approval required for amounts > ₹50,000.',
    policyAllowed: false,
    timeline: [
      {
        id: 't-20',
        timestamp: '2026-08-12T00:00:00Z',
        timeDisplay: 'Aug 12',
        title: 'Invoice generated',
        description: 'Enterprise license invoice INV-2026-0814 issued with Net-30 terms.',
        type: 'detection'
      },
      {
        id: 't-21',
        timestamp: '2026-08-26T02:00:00Z',
        timeDisplay: '07:30 AM',
        title: 'Invoice reached 14-day overdue threshold',
        description: 'Automated reminders exhausted (2 reminders delivered with 0 responses).',
        type: 'failure'
      },
      {
        id: 't-22',
        timestamp: '2026-08-26T02:05:00Z',
        timeDisplay: '07:35 AM',
        title: 'Escalation triggered',
        description: 'Flagged for finance team review. Automated actions halted per stopping rules.',
        type: 'escalation'
      }
    ]
  },
  {
    id: 'RC-1095',
    customerName: 'Amit Verma',
    customerEmail: 'amit.verma@fintechventures.in',
    customerPhone: '+91 99800 22341',
    companyName: 'Fintech Ventures',
    issue: 'Payment failed',
    amount: 12000,
    risk: 'Medium',
    recommendedAction: 'Retry payment',
    status: 'In progress',
    updated: '42 mins ago',
    createdAt: '2026-08-26T03:00:00Z',
    failureReason: 'Insufficient balance on primary corporate card',
    failureCode: 'INSUFFICIENT_FUNDS',
    paymentMethod: 'Axis Bank Corp Credit ••9901',
    razorpayPaymentId: 'pay_Nq7tK89201aB',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 72,
    aiWhy: 'Failure code indicates temporary insufficient funds at billing cycle cutoff. Cooldown interval of 6 hours observed. Retry scheduled for optimal payroll settlement window.',
    aiPolicyNote: 'Policy compliant: Cooldown in effect until 12:00 PM.',
    policyAllowed: true,
    timeline: [
      {
        id: 't-30',
        timestamp: '2026-08-26T03:00:00Z',
        timeDisplay: '08:30 AM',
        title: 'Payment failed',
        description: 'Transaction ₹12,000 declined (Insufficient funds).',
        type: 'failure'
      },
      {
        id: 't-31',
        timestamp: '2026-08-26T03:02:00Z',
        timeDisplay: '08:32 AM',
        title: 'AI strategy selected',
        description: 'Scheduled smart retry for 12:00 PM with backup fallback payment link.',
        type: 'diagnosis'
      }
    ]
  },
  {
    id: 'RC-1096',
    customerName: 'Rajesh Khanna',
    customerEmail: 'rkhanna@logisticsapex.com',
    customerPhone: '+91 98112 00192',
    companyName: 'Apex Logistics Ltd',
    issue: 'Subscription lapsed',
    amount: 18000,
    risk: 'High',
    recommendedAction: 'Send reminder',
    status: 'Recovered',
    updated: '1 hour ago',
    createdAt: '2026-08-26T01:15:00Z',
    failureReason: 'Corporate card expired last month',
    failureCode: 'CARD_EXPIRED',
    paymentMethod: 'SBI Corporate Card ••1024',
    razorpayPaymentId: 'pay_Nq5wM11290pL',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 82,
    aiWhy: 'Customer card expired. Sent customized card update portal link. Customer updated to new SBI card and ₹18,000 was successfully processed.',
    aiPolicyNote: 'Customer communication allowed.',
    policyAllowed: true,
    recoveredAmount: 18000,
    recoveredAt: '09:12 AM',
    timeline: [
      {
        id: 't-40',
        timestamp: '2026-08-26T01:15:00Z',
        timeDisplay: '06:45 AM',
        title: 'Subscription payment failed',
        description: 'Card expiration failure detected on recurring tier.',
        type: 'failure'
      },
      {
        id: 't-41',
        timestamp: '2026-08-26T01:18:00Z',
        timeDisplay: '06:48 AM',
        title: 'Payment method update link dispatched',
        description: 'Agent dispatched secure Razorpay card update link to accounts team.',
        type: 'action'
      },
      {
        id: 't-42',
        timestamp: '2026-08-26T03:42:00Z',
        timeDisplay: '09:12 AM',
        title: 'Card updated & ₹18,000 recovered',
        description: 'New card verified and billed successfully.',
        type: 'success'
      }
    ]
  },
  {
    id: 'RC-1097',
    customerName: 'Sunita Deshmukh',
    customerEmail: 'sunita.d@creativestudios.co',
    customerPhone: '+91 98230 88912',
    companyName: 'Creative Studios Pune',
    issue: 'Payment failed',
    amount: 4200,
    risk: 'Low',
    recommendedAction: 'Retry payment',
    status: 'Recovered',
    updated: '2 hours ago',
    createdAt: '2026-08-26T00:30:00Z',
    failureReason: 'Network gateway timeout during 2FA handshake',
    failureCode: 'GATEWAY_TIMEOUT',
    paymentMethod: 'Kotak Mahindra Debit ••7721',
    razorpayPaymentId: 'pay_Nq4pK00981qA',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 91,
    aiWhy: 'Pure infrastructure network timeout on payment gateway. Card is active and verified.',
    aiPolicyNote: 'Auto-retry executed.',
    policyAllowed: true,
    recoveredAmount: 4200,
    recoveredAt: '07:15 AM',
    timeline: [
      {
        id: 't-50',
        timestamp: '2026-08-26T00:30:00Z',
        timeDisplay: '06:00 AM',
        title: 'Payment failed',
        description: 'Razorpay reported gateway latency timeout.',
        type: 'failure'
      },
      {
        id: 't-51',
        timestamp: '2026-08-26T01:45:00Z',
        timeDisplay: '07:15 AM',
        title: 'Auto-retry succeeded',
        description: '₹4,200 collected successfully on attempt 1.',
        type: 'success'
      }
    ]
  },
  {
    id: 'RC-1098',
    customerName: 'Nexus Logistics Hub',
    customerEmail: 'billing@nexuslogistics.in',
    customerPhone: '+91 99104 55670',
    companyName: 'Nexus Logistics Hub LLP',
    issue: 'Invoice overdue',
    amount: 125000,
    risk: 'High',
    recommendedAction: 'Escalate',
    status: 'Needs review',
    updated: '3 hours ago',
    createdAt: '2026-08-25T18:00:00Z',
    failureReason: 'Overdue commercial contract invoice (Net-45)',
    failureCode: 'COMMERCIAL_OVERDUE',
    paymentMethod: 'Bank Wire / RTGS',
    invoiceNumber: 'INV-2026-0798',
    attemptCount: 2,
    maxAttempts: 2,
    recoveryProbability: 52,
    aiWhy: 'High tier B2B account with ₹1,25,000 outstanding. AI stopping rule activated: Automated contact capped at 2. Flagged for account executive manual call.',
    aiPolicyNote: 'Policy limit reached: Escalated to finance manager.',
    policyAllowed: false,
    timeline: [
      {
        id: 't-60',
        timestamp: '2026-08-25T18:00:00Z',
        timeDisplay: 'Yesterday 11:30 PM',
        title: 'Overdue trigger reached',
        description: 'Invoice past 45-day commercial grace window.',
        type: 'failure'
      },
      {
        id: 't-61',
        timestamp: '2026-08-26T01:00:00Z',
        timeDisplay: '06:30 AM',
        title: 'Stopping rule triggered',
        description: 'Agent paused automated messages. Escalated to account executive.',
        type: 'escalation'
      }
    ]
  },
  {
    id: 'RC-1099',
    customerName: 'Vikram Malhotra',
    customerEmail: 'vikram@malhotratech.com',
    customerPhone: '+91 98490 77123',
    companyName: 'Malhotra Enterprise Tech',
    issue: 'Payment failed',
    amount: 9900,
    risk: 'Medium',
    recommendedAction: 'Payment link',
    status: 'Recovered',
    updated: '4 hours ago',
    createdAt: '2026-08-25T22:10:00Z',
    failureReason: 'Exceeded daily limit on UPI VPA',
    failureCode: 'UPI_LIMIT_EXCEEDED',
    paymentMethod: 'UPI (vikram@okhdfcbank)',
    razorpayPaymentId: 'pay_Nq2jU99182xK',
    attemptCount: 1,
    maxAttempts: 3,
    recoveryProbability: 88,
    aiWhy: 'Customer hit UPI daily bank cap. Sent fallback payment link with NetBanking and Credit Card options. Paid within 25 minutes via card.',
    aiPolicyNote: 'Communication policy compliant.',
    policyAllowed: true,
    recoveredAmount: 9900,
    recoveredAt: '04:30 AM',
    timeline: [
      {
        id: 't-70',
        timestamp: '2026-08-25T22:10:00Z',
        timeDisplay: 'Yesterday 03:40 AM',
        title: 'UPI Payment failed',
        description: 'UPI mandate failed: daily transaction limit reached.',
        type: 'failure'
      },
      {
        id: 't-71',
        timestamp: '2026-08-25T22:15:00Z',
        timeDisplay: 'Yesterday 03:45 AM',
        title: 'Smart payment link sent',
        description: 'Multi-rail payment link generated (Credit/Debit/NetBanking).',
        type: 'action'
      },
      {
        id: 't-72',
        timestamp: '2026-08-25T23:00:00Z',
        timeDisplay: 'Yesterday 04:30 AM',
        title: 'Payment succeeded',
        description: 'Customer paid ₹9,900 via Corporate Credit Card.',
        type: 'success'
      }
    ]
  },
  {
    id: 'RC-1100',
    customerName: 'Maya Patel',
    customerEmail: 'maya@designfoundry.in',
    customerPhone: '+91 97240 11982',
    companyName: 'Design Foundry Ahmedabad',
    issue: 'Checkout abandoned',
    amount: 3400,
    risk: 'Low',
    recommendedAction: 'Payment link',
    status: 'Awaiting payment',
    updated: '5 hours ago',
    createdAt: '2026-08-25T21:00:00Z',
    failureReason: 'Session abandoned at payment verification',
    failureCode: 'CHECKOUT_ABANDONED',
    paymentMethod: 'UPI / Cards',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 60,
    aiWhy: 'High-intent checkout abandoned at final review. Dispatched tailored 1-click cart recovery link with 24h price lock.',
    aiPolicyNote: '1 reminder dispatched.',
    policyAllowed: true,
    timeline: [
      {
        id: 't-80',
        timestamp: '2026-08-25T21:00:00Z',
        timeDisplay: 'Yesterday 02:30 AM',
        title: 'Checkout abandoned',
        description: 'Customer entered payment details but dropped off before 2FA.',
        type: 'failure'
      },
      {
        id: 't-81',
        timestamp: '2026-08-25T21:05:00Z',
        timeDisplay: 'Yesterday 02:35 AM',
        title: 'Recovery link dispatched',
        description: 'Dispatched automated cart recovery email.',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-1101',
    customerName: 'CloudScale India',
    customerEmail: 'finance@cloudscale.in',
    customerPhone: '+91 98800 66542',
    companyName: 'CloudScale Infra Pvt Ltd',
    issue: 'Payment failed',
    amount: 50400,
    risk: 'High',
    recommendedAction: 'Retry payment',
    status: 'Recovered',
    updated: '6 hours ago',
    createdAt: '2026-08-25T19:00:00Z',
    failureReason: 'Bank switch network error on high-value mandate',
    failureCode: 'BANK_SWITCH_OFFLINE',
    paymentMethod: 'RBL Corporate Debit ••3390',
    razorpayPaymentId: 'pay_Nq1mZ77291aZ',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 75,
    aiWhy: 'Temporary RBL Bank core switch downtime. Auto-retry performed 4 hours later after switch returned online. Full ₹50,400 captured.',
    aiPolicyNote: 'Auto-retry executed after switch recovery.',
    policyAllowed: true,
    recoveredAmount: 50400,
    recoveredAt: '01:00 AM',
    timeline: [
      {
        id: 't-90',
        timestamp: '2026-08-25T19:00:00Z',
        timeDisplay: 'Yesterday 12:30 AM',
        title: 'Mandate payment failed',
        description: 'RBL Bank corporate mandate failed (switch error).',
        type: 'failure'
      },
      {
        id: 't-91',
        timestamp: '2026-08-25T23:30:00Z',
        timeDisplay: 'Yesterday 01:00 AM',
        title: 'Retry executed & ₹50,400 recovered',
        description: 'Auto-retry succeeded without requiring customer outreach.',
        type: 'success'
      }
    ]
  }
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-101',
    timestamp: '2026-08-26T04:35:00Z',
    timeDisplay: '10:05 AM',
    dateDisplay: 'Today',
    eventTitle: 'Recovery completed',
    caseId: 'RC-1092',
    customerName: 'Rahul Sharma',
    amount: 5000,
    decision: 'Retry payment',
    reason: 'Temporary payment failure + 4 previous successful payments',
    policy: 'Automatic retry enabled (Attempt 1 of 2)',
    result: 'Successful (₹5,000 captured via Razorpay)',
    resultStatus: 'success',
    details: 'Razorpay payment id pay_Nq9xL12850aA_retry1 authorized with 0% chargeback risk.'
  },
  {
    id: 'act-102',
    timestamp: '2026-08-26T04:34:00Z',
    timeDisplay: '10:04 AM',
    dateDisplay: 'Today',
    eventTitle: 'Payment retry executed',
    caseId: 'RC-1092',
    customerName: 'Rahul Sharma',
    amount: 5000,
    decision: 'Execute Razorpay retry',
    reason: 'Issuer timeout resolved on HDFC gateway node',
    policy: 'Compliant with 6-hour retry interval rules',
    result: 'Dispatched to payment processor',
    resultStatus: 'info',
    details: 'Initiated background authorization call to Razorpay API endpoint /v1/payments/retry.'
  },
  {
    id: 'act-103',
    timestamp: '2026-08-26T04:33:30Z',
    timeDisplay: '10:03 AM',
    dateDisplay: 'Today',
    eventTitle: 'Recovery strategy selected',
    caseId: 'RC-1092',
    customerName: 'Rahul Sharma',
    amount: 5000,
    decision: 'Selected action: Retry payment (Probability: 78%)',
    reason: 'Transient failure pattern detected with strong historical customer LTV',
    policy: 'Auto-retry threshold met (score 78 > threshold 50)',
    result: 'Strategy locked and scheduled for immediate execution',
    resultStatus: 'info'
  },
  {
    id: 'act-104',
    timestamp: '2026-08-26T04:33:00Z',
    timeDisplay: '10:03 AM',
    dateDisplay: 'Today',
    eventTitle: 'Payment failure analyzed',
    caseId: 'RC-1092',
    customerName: 'Rahul Sharma',
    amount: 5000,
    decision: 'Ingest and classify risk level: High',
    reason: 'Failed payment code: ISSUER_TIMEOUT',
    policy: 'Standard intake rule',
    result: 'Ingested into active risk queue',
    resultStatus: 'info'
  },
  {
    id: 'act-105',
    timestamp: '2026-08-26T04:18:00Z',
    timeDisplay: '09:48 AM',
    dateDisplay: 'Today',
    eventTitle: 'Payment link generated',
    caseId: 'RC-1093',
    customerName: 'Priya Mehta',
    amount: 8500,
    decision: 'Generate frictionless 1-click Razorpay payment link',
    reason: '3DS OTP timeout prevents automated headless card retry',
    policy: 'Customer notification policy (1 of 3 sent)',
    result: 'Link rzp.io/l/rc_8500_priya dispatched',
    resultStatus: 'info'
  },
  {
    id: 'act-106',
    timestamp: '2026-08-26T03:42:00Z',
    timeDisplay: '09:12 AM',
    dateDisplay: 'Today',
    eventTitle: 'Subscription recovery completed',
    caseId: 'RC-1096',
    customerName: 'Rajesh Khanna',
    amount: 18000,
    decision: 'Card update link followed by subscription charge',
    reason: 'Expired card replaced with valid SBI corporate card',
    policy: 'Autonomous method renewal policy',
    result: 'Successful (₹18,000 recovered)',
    resultStatus: 'success'
  },
  {
    id: 'act-107',
    timestamp: '2026-08-26T02:05:00Z',
    timeDisplay: '07:35 AM',
    dateDisplay: 'Today',
    eventTitle: 'Case escalated to human review',
    caseId: 'RC-1094',
    customerName: 'Acme Cloud Solutions',
    amount: 75000,
    decision: 'Escalate to merchant finance team',
    reason: 'Invoice overdue 14d + amount ₹75,000 exceeds ₹50,000 autonomous threshold',
    policy: 'High-risk policy protection enforced (Stopping rule: Halt automated contacts)',
    result: 'Awaiting human authorization',
    resultStatus: 'warning'
  }
];

export const REVENUE_TREND_DATA = [
  { date: 'Aug 20', revenueAtRisk: 142000, recovered: 48000, remaining: 94000 },
  { date: 'Aug 21', revenueAtRisk: 168000, recovered: 62000, remaining: 106000 },
  { date: 'Aug 22', revenueAtRisk: 195000, recovered: 71000, remaining: 124000 },
  { date: 'Aug 23', revenueAtRisk: 210000, recovered: 75000, remaining: 135000 },
  { date: 'Aug 24', revenueAtRisk: 228000, recovered: 81000, remaining: 147000 },
  { date: 'Aug 25', revenueAtRisk: 242000, recovered: 84000, remaining: 158000 },
  { date: 'Aug 26', revenueAtRisk: 248500, recovered: 87500, remaining: 161000 }
];

export const FAILURE_CATEGORY_DATA = [
  { name: 'Bank / Issuer Timeout', value: 38, count: 14, recoveredRate: '86%' },
  { name: 'Card Expired / Replaced', value: 24, count: 9, recoveredRate: '81%' },
  { name: 'Insufficient Funds (Transient)', value: 18, count: 7, recoveredRate: '68%' },
  { name: '3DS / Auth Abandonment', value: 12, count: 5, recoveredRate: '54%' },
  { name: 'Commercial Invoice Net-30', value: 8, count: 3, recoveredRate: '42%' }
];

export const PAYMENT_LEDGER: PaymentRecord[] = [
  {
    id: 'p-101',
    razorpayPaymentId: 'pay_Nq9xL12850aA_retry1',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@innovate.co.in',
    amount: 5000,
    status: 'succeeded',
    method: 'HDFC Visa Debit',
    timestamp: 'Today, 10:05 AM',
    recoveredByAgent: true,
    caseId: 'RC-1092'
  },
  {
    id: 'p-102',
    razorpayPaymentId: 'pay_Nq9xL12850aA',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@innovate.co.in',
    amount: 5000,
    status: 'failed',
    failureReason: 'ISSUER_TIMEOUT',
    method: 'HDFC Visa Debit',
    timestamp: 'Today, 10:02 AM',
    recoveredByAgent: false,
    caseId: 'RC-1092'
  },
  {
    id: 'p-103',
    razorpayPaymentId: 'pay_Nq8yP44109bZ',
    customerName: 'Priya Mehta',
    customerEmail: 'priya.m@techscale.org',
    amount: 8500,
    status: 'failed',
    failureReason: '3DS_AUTH_FAILED',
    method: 'ICICI NetBanking',
    timestamp: 'Today, 09:45 AM',
    recoveredByAgent: false,
    caseId: 'RC-1093'
  },
  {
    id: 'p-104',
    razorpayPaymentId: 'pay_Nq5wM11290pL_rec',
    customerName: 'Rajesh Khanna',
    customerEmail: 'rkhanna@logisticsapex.com',
    amount: 18000,
    status: 'succeeded',
    method: 'SBI Corporate Card',
    timestamp: 'Today, 09:12 AM',
    recoveredByAgent: true,
    caseId: 'RC-1096'
  },
  {
    id: 'p-105',
    razorpayPaymentId: 'pay_Nq7tK89201aB',
    customerName: 'Amit Verma',
    customerEmail: 'amit.verma@fintechventures.in',
    amount: 12000,
    status: 'failed',
    failureReason: 'INSUFFICIENT_FUNDS',
    method: 'Axis Bank Corp Credit',
    timestamp: 'Today, 08:30 AM',
    recoveredByAgent: false,
    caseId: 'RC-1095'
  },
  {
    id: 'p-106',
    razorpayPaymentId: 'pay_Nq4pK00981qA_r',
    customerName: 'Sunita Deshmukh',
    customerEmail: 'sunita.d@creativestudios.co',
    amount: 4200,
    status: 'succeeded',
    method: 'Kotak Mahindra Debit',
    timestamp: 'Today, 07:15 AM',
    recoveredByAgent: true,
    caseId: 'RC-1097'
  },
  {
    id: 'p-107',
    razorpayPaymentId: 'pay_Nq1mZ77291aZ_r',
    customerName: 'CloudScale India',
    customerEmail: 'finance@cloudscale.in',
    amount: 50400,
    status: 'succeeded',
    method: 'RBL Corporate Debit',
    timestamp: 'Yesterday, 01:00 AM',
    recoveredByAgent: true,
    caseId: 'RC-1101'
  }
];

export const CUSTOMER_DIRECTORY: CustomerRecord[] = [
  {
    id: 'cust-1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@innovate.co.in',
    phone: '+91 98201 44521',
    totalSpent: 45000,
    successfulTransactions: 9,
    failedTransactions: 1,
    recoveredTransactions: 1,
    lifetimeValue: 45000,
    riskCategory: 'Low Risk',
    lastSeen: '10 mins ago'
  },
  {
    id: 'cust-2',
    name: 'Priya Mehta',
    email: 'priya.m@techscale.org',
    phone: '+91 97110 33892',
    totalSpent: 68000,
    successfulTransactions: 8,
    failedTransactions: 1,
    recoveredTransactions: 0,
    lifetimeValue: 68000,
    riskCategory: 'Moderate',
    lastSeen: '14 mins ago'
  },
  {
    id: 'cust-3',
    name: 'Acme Cloud India Ltd',
    email: 'accounts@acmecloud.in',
    phone: '+91 98450 19283',
    totalSpent: 450000,
    successfulTransactions: 6,
    failedTransactions: 2,
    recoveredTransactions: 1,
    lifetimeValue: 450000,
    riskCategory: 'High Risk',
    lastSeen: '28 mins ago'
  },
  {
    id: 'cust-4',
    name: 'Amit Verma',
    email: 'amit.verma@fintechventures.in',
    phone: '+91 99800 22341',
    totalSpent: 124000,
    successfulTransactions: 11,
    failedTransactions: 1,
    recoveredTransactions: 0,
    lifetimeValue: 124000,
    riskCategory: 'Moderate',
    lastSeen: '42 mins ago'
  },
  {
    id: 'cust-5',
    name: 'Apex Logistics Ltd',
    email: 'rkhanna@logisticsapex.com',
    phone: '+91 98112 00192',
    totalSpent: 216000,
    successfulTransactions: 12,
    failedTransactions: 1,
    recoveredTransactions: 1,
    lifetimeValue: 216000,
    riskCategory: 'Low Risk',
    lastSeen: '1 hour ago'
  },
  {
    id: 'cust-6',
    name: 'CloudScale Infra Pvt Ltd',
    email: 'finance@cloudscale.in',
    phone: '+91 98800 66542',
    totalSpent: 604800,
    successfulTransactions: 12,
    failedTransactions: 1,
    recoveredTransactions: 1,
    lifetimeValue: 604800,
    riskCategory: 'Low Risk',
    lastSeen: '6 hours ago'
  }
];
