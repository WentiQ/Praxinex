import { RecoveryCase, ActivityEvent, RecoveryPolicy, MerchantProfile, PaymentRecord, CustomerRecord } from '../types';

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

export const INITIAL_CASES: RecoveryCase[] = [
  {
    id: 'RC-INV-1',
    customerName: 'Dinesh',
    customerEmail: 'dineshpolavarapu66@gmail.com',
    customerPhone: '7032983348',
    companyName: 'NOEON Technologies',
    issue: 'Invoice overdue',
    amount: 90000,
    risk: 'High',
    recommendedAction: 'Payment link',
    status: 'Needs review',
    updated: 'Live from Razorpay',
    createdAt: '2026-08-26T03:45:00Z',
    failureReason: 'Invoice #1 unpaid (NOEON AB-M1 robot brain)',
    failureCode: 'INVOICE_UNPAID',
    paymentMethod: 'Razorpay Invoice Portal',
    razorpayPaymentId: 'inv_TUOpdL2QQj3VgD',
    invoiceNumber: 'inv_TUOpdL2QQj3VgD',
    paymentLinkUrl: 'https://rzp.io/rzp/QeUgNGM',
    attemptCount: 1,
    maxAttempts: 3,
    recoveryProbability: 82,
    aiWhy: 'Active Razorpay invoice for ₹90,000 ("NOEON AB-M1"). Status: issued. Customer contact verified (7032983348). Generated direct payment portal link.',
    aiPolicyNote: 'Invoice recovery bounds verified. 1-click payment portal active.',
    policyAllowed: true,
    recoveredAmount: 0,
    timeline: [
      {
        id: 't-inv-1',
        timestamp: '2026-08-26T04:32:00Z',
        timeDisplay: '10:02 AM',
        title: 'Invoice Issued on Razorpay',
        description: 'Invoice #1 generated for ₹90,000 (NOEON AB-M1 robot brain) with SMS and Email notifications sent.',
        type: 'detection'
      },
      {
        id: 't-inv-2',
        timestamp: '2026-08-26T04:33:00Z',
        timeDisplay: '10:03 AM',
        title: 'Revenue risk detected',
        description: 'Recovery agent ingested unpaid invoice event from Razorpay Webhook TTWXpg6OFXSym0.',
        type: 'detection'
      },
      {
        id: 't-inv-3',
        timestamp: '2026-08-26T04:34:00Z',
        timeDisplay: '10:04 AM',
        title: 'AI diagnosed settlement strategy',
        description: 'Diagnosed high-value robotics asset invoice. Recommended 1-click Razorpay payment link dispatch.',
        type: 'diagnosis'
      }
    ]
  },
  {
    id: 'RC-PL-bZxwmC',
    customerName: 'Dinesh',
    customerEmail: 'dineshpolavarapu66@gmail.com',
    customerPhone: '+917981271373',
    companyName: 'NOEON Robotics',
    issue: 'Payment failed',
    amount: 10000,
    risk: 'Medium',
    recommendedAction: 'Payment link',
    status: 'Awaiting payment',
    updated: 'Live from Razorpay',
    createdAt: '2026-08-26T03:30:00Z',
    failureReason: 'Awaiting link settlement: "noeon subscription"',
    failureCode: 'PAYMENT_LINK_ACTIVE',
    paymentMethod: 'Razorpay Dynamic Rail',
    razorpayPaymentId: 'plink_TUPl2G0SbZxwmC',
    paymentLinkUrl: 'https://rzp.io/rzp/WT6797L',
    attemptCount: 1,
    maxAttempts: 3,
    recoveryProbability: 88,
    aiWhy: 'Active Razorpay Payment Link for ₹10,000 ("noeon subscription"). Customer contact +917981271373 with SMS/Email notifications active.',
    aiPolicyNote: 'Autonomous reminder & payment link dispatch compliant',
    policyAllowed: true,
    recoveredAmount: 0,
    timeline: [
      {
        id: 't-pl-1',
        timestamp: '2026-08-26T04:15:00Z',
        timeDisplay: '09:45 AM',
        title: 'Payment Link Created on Razorpay',
        description: 'Created link plink_TUPl2G0SbZxwmC for ₹10,000: https://rzp.io/rzp/WT6797L',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-PL-TTVhyx',
    customerName: 'ABC Industries Pvt Ltd',
    customerEmail: 'finance@abcindustries.in',
    customerPhone: '+919876543210',
    companyName: 'ABC Industries Pvt Ltd',
    issue: 'Invoice overdue',
    amount: 420000,
    risk: 'High',
    recommendedAction: 'Payment link',
    status: 'Needs review',
    updated: 'Live from Razorpay',
    createdAt: '2026-08-26T02:00:00Z',
    failureReason: 'Settlement: Customer ABC — ₹4.2L Overdue Invoice (18 Days Late) (Approved Extension)',
    failureCode: 'OFFER_7_DAY_EXTENSION',
    paymentMethod: 'Razorpay Multi-Rail',
    razorpayPaymentId: 'plink_TTVhyxk7IJ2I8d',
    paymentLinkUrl: 'https://rzp.io/rzp/jTGXmhm',
    attemptCount: 1,
    maxAttempts: 2,
    recoveryProbability: 75,
    aiWhy: 'Approved 7-day payment extension for ₹4,20,000 enterprise account. Dispatched secure link: https://rzp.io/rzp/jTGXmhm.',
    aiPolicyNote: 'High-risk policy: Verified approved extension protocol.',
    policyAllowed: true,
    recoveredAmount: 0,
    timeline: [
      {
        id: 't-pl-2',
        timestamp: '2026-08-26T02:00:00Z',
        timeDisplay: '07:30 AM',
        title: 'Payment Extension Link Generated',
        description: 'Generated plink_TTVhyxk7IJ2I8d (₹4.2L) for ABC Industries: https://rzp.io/rzp/jTGXmhm',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-PL-TTVUcH',
    customerName: 'Enterprise AI Procurement Agent',
    customerEmail: 'agentprocureenterprise44@agentnet.in',
    customerPhone: '+919876543210',
    companyName: 'AgentNet Commerce',
    issue: 'Payment failed',
    amount: 9529,
    risk: 'Low',
    recommendedAction: 'Payment link',
    status: 'Awaiting payment',
    updated: 'Live from Razorpay',
    createdAt: '2026-08-26T01:30:00Z',
    failureReason: 'Agentic Commerce: 1x Enterprise Cloud Compute Node (Dedicated) (NPCI_UAP)',
    failureCode: 'NPCI_UAP_SETTLEMENT',
    paymentMethod: 'UPI / Card Rail',
    razorpayPaymentId: 'plink_TTVUcHF1SCyoOB',
    paymentLinkUrl: 'https://rzp.io/rzp/J6QuVT8',
    attemptCount: 1,
    maxAttempts: 3,
    recoveryProbability: 92,
    aiWhy: 'Dedicated compute node link for AI procurement agent with 5% protocol discount. Short link: https://rzp.io/rzp/J6QuVT8',
    aiPolicyNote: 'Autonomous agentic commerce policy compliant',
    policyAllowed: true,
    recoveredAmount: 0,
    timeline: [
      {
        id: 't-pl-3',
        timestamp: '2026-08-26T01:30:00Z',
        timeDisplay: '07:00 AM',
        title: 'Agentic Commerce Link Active',
        description: 'Payment link plink_TTVUcHF1SCyoOB generated for ₹9,529: https://rzp.io/rzp/J6QuVT8',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-PL-TTDOzP',
    customerName: 'ABC Industries Pvt Ltd',
    customerEmail: 'finance@abcindustries.in',
    customerPhone: '+919876543210',
    companyName: 'ABC Industries',
    issue: 'Invoice overdue',
    amount: 420000,
    risk: 'High',
    recommendedAction: 'Escalate',
    status: 'Needs review',
    updated: 'Live from Razorpay',
    createdAt: '2026-08-25T02:00:00Z',
    failureReason: 'Formal 7-day Payment Extension - Invoice #inc_abc_001',
    failureCode: 'NOEON_EXPERIENCE_ENGINE',
    paymentMethod: 'Razorpay Dynamic',
    razorpayPaymentId: 'plink_TTDOzPXoOy4LkL',
    paymentLinkUrl: 'https://rzp.io/rzp/RZ6Q8FE',
    attemptCount: 2,
    maxAttempts: 2,
    recoveryProbability: 60,
    aiWhy: 'Extended due date passed for Invoice #inc_abc_001. Requires finance escalation.',
    aiPolicyNote: 'High-risk stopping rule enforced.',
    policyAllowed: false,
    recoveredAmount: 0,
    timeline: [
      {
        id: 't-pl-4',
        timestamp: '2026-08-25T02:00:00Z',
        timeDisplay: 'Aug 25',
        title: 'Extension Link Generated',
        description: 'Link plink_TTDOzPXoOy4LkL generated: https://rzp.io/rzp/RZ6Q8FE',
        type: 'action'
      }
    ]
  },
  {
    id: 'RC-1092',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@innovate.co.in',
    customerPhone: '+91 98201 44521',
    companyName: 'Innovate Digital',
    issue: 'Payment failed',
    amount: 5000,
    risk: 'Medium',
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
        id: 't-5',
        timestamp: '2026-08-26T04:35:00Z',
        timeDisplay: '10:05 AM',
        title: 'Payment succeeded',
        description: 'Razorpay confirmed transaction capture (ref: pay_Nq9xL12850aA_retry1).',
        type: 'success'
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
    id: 'p-100',
    razorpayPaymentId: 'inv_TUOpdL2QQj3VgD',
    customerName: 'Dinesh',
    customerEmail: 'dineshpolavarapu66@gmail.com',
    amount: 90000,
    status: 'failed',
    failureReason: 'INVOICE_UNPAID',
    method: 'Razorpay Invoice Portal',
    timestamp: 'Today, 10:02 AM',
    recoveredByAgent: false,
    caseId: 'RC-INV-1'
  },
  {
    id: 'p-101',
    razorpayPaymentId: 'plink_TUPl2G0SbZxwmC',
    customerName: 'Dinesh',
    customerEmail: 'dineshpolavarapu66@gmail.com',
    amount: 10000,
    status: 'failed',
    failureReason: 'PAYMENT_LINK_ACTIVE',
    method: 'Razorpay Dynamic Rail',
    timestamp: 'Today, 09:45 AM',
    recoveredByAgent: false,
    caseId: 'RC-PL-bZxwmC'
  },
  {
    id: 'p-102',
    razorpayPaymentId: 'pay_Nq9xL12850aA',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@innovate.co.in',
    amount: 5000,
    status: 'succeeded',
    method: 'HDFC Visa Debit',
    timestamp: 'Today, 10:05 AM',
    recoveredByAgent: true,
    caseId: 'RC-1092'
  }
];

export const CUSTOMER_DIRECTORY: CustomerRecord[] = [
  {
    id: 'cust_TUOnIy7jOFYkiD',
    name: 'Dinesh',
    email: 'dineshpolavarapu66@gmail.com',
    phone: '7032983348',
    totalSpent: 90000,
    successfulTransactions: 1,
    failedTransactions: 0,
    recoveredTransactions: 1,
    lifetimeValue: 90000,
    riskCategory: 'Low Risk',
    lastSeen: 'Live on Razorpay'
  },
  {
    id: 'cust_abc_ind',
    name: 'ABC Industries Pvt Ltd',
    email: 'finance@abcindustries.in',
    phone: '+91 98765 43210',
    totalSpent: 420000,
    successfulTransactions: 3,
    failedTransactions: 1,
    recoveredTransactions: 1,
    lifetimeValue: 420000,
    riskCategory: 'Moderate',
    lastSeen: 'Today'
  },
  {
    id: 'cust_agentnet',
    name: 'Enterprise AI Procurement Agent',
    email: 'agentprocureenterprise44@agentnet.in',
    phone: '+91 98765 43210',
    totalSpent: 9529,
    successfulTransactions: 2,
    failedTransactions: 0,
    recoveredTransactions: 1,
    lifetimeValue: 9529,
    riskCategory: 'Low Risk',
    lastSeen: 'Today'
  },
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
  }
];
