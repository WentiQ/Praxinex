// AI Root-Cause Diagnosis, Error Normalization, and Predictive Recovery Scoring Engine

export type RootCauseCategory = 'Technical' | 'Behavioral' | 'Fraud';

export type PriorityRank = 'Critical Priority' | 'High Priority' | 'Medium Priority' | 'Low Priority';

export interface NormalizedErrorInfo {
  code: string;
  category: RootCauseCategory;
  subCategory: string;
  merchantExplanation: string;
  customerExplanation: string;
  recommendedAction: 'Retry payment' | 'Payment link' | 'Send reminder' | 'Escalate' | 'Schedule retry';
  optimalTimeWindow: string;
  isTransient: boolean;
}

export interface ScoringFactor {
  name: string;
  weight: number; // e.g. +12 or -8
  description: string;
  valueDisplay: string;
}

export interface ScoringBreakdown {
  baseScore: number;
  historicalSuccessRateFactor: number;
  ltvFactor: number;
  amountAndFrequencyFactor: number;
  failureReasonFactor: number;
  timeElapsedDecay: number;
  attemptPenalty: number;
  finalScore: number; // 0 - 100
  expectedRecoveryValue: number; // INR
  priorityRank: PriorityRank;
  factors: ScoringFactor[];
}

// -------------------------------------------------------------
// Comprehensive Failure Code Normalization Catalog
// -------------------------------------------------------------
const NORMALIZED_ERROR_CATALOG: Record<string, Omit<NormalizedErrorInfo, 'code'>> = {
  // --- TECHNICAL / NETWORK / BANK DOWNTIME ---
  'GATEWAY_ERROR_DEBIT_FAILED': {
    category: 'Technical',
    subCategory: 'Bank Switch Downtime',
    merchantExplanation: 'The issuing bank switch dropped the debit authorization connection before confirming debit. The payment instrument is valid; an automated background retry has high success.',
    customerExplanation: 'Your bank’s transaction server was temporarily unreachable. No funds were debited from your account. Click the secure link to retry or choose an alternate payment rail.',
    recommendedAction: 'Retry payment',
    optimalTimeWindow: 'Instant Background Retry (15m Cooldown)',
    isTransient: true
  },
  'PAYMENT_TIMED_OUT': {
    category: 'Technical',
    subCategory: 'OTP / 3DS Session Timeout',
    merchantExplanation: 'The 3D-Secure authentication session timed out waiting for the customer or SMS gateway delivery. Re-dispatching a pre-filled 1-click link will recover this cart.',
    customerExplanation: 'The payment verification window expired before completion. You can safely complete your transaction using this fresh 1-click link.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate 1-Click Link Dispatch',
    isTransient: true
  },
  'ACQUIRER_DOWN': {
    category: 'Technical',
    subCategory: 'Acquiring Bank Outage',
    merchantExplanation: 'The merchant acquirer routing node experienced a momentary network outage. Routing through backup switch rail.',
    customerExplanation: 'The payment processing network is experiencing temporary delays. We are rerouting your transaction automatically.',
    recommendedAction: 'Retry payment',
    optimalTimeWindow: 'Background Rail Fallback (5-10m)',
    isTransient: true
  },
  'GATEWAY_ERROR_ISSUER_DOWN': {
    category: 'Technical',
    subCategory: 'Issuer Bank Core Down',
    merchantExplanation: 'The customer’s issuing bank core banking system (CBS) returned 503 Service Unavailable. Recommend automated cooldown before retrying.',
    customerExplanation: 'Your card issuer is currently undergoing routine system maintenance. We will safely retry as soon as the bank systems resume.',
    recommendedAction: 'Schedule retry',
    optimalTimeWindow: 'Scheduled Cooldown Window (45 mins)',
    isTransient: true
  },
  'BAD_REQUEST_ERROR': {
    category: 'Technical',
    subCategory: 'Gateway Payload Latency',
    merchantExplanation: 'Gateway communication handshake failed due to transient signature or network serialization error.',
    customerExplanation: 'We encountered a momentary communication glitch with the payment gateway. Click below to retry seamlessly.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate Dispatch',
    isTransient: true
  },

  // --- CUSTOMER-SIDE / BEHAVIORAL ---
  'INSUFFICIENT_FUNDS': {
    category: 'Behavioral',
    subCategory: 'Insufficient Balance',
    merchantExplanation: 'The customer’s account or card limit has insufficient funds for this transaction. Direct retries will fail; scheduled reminder aligned with salary/morning window or multi-rail UPI link is recommended.',
    customerExplanation: 'Your bank declined the transaction due to insufficient available balance or credit limit. You can complete this payment using another bank account or UPI link.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Morning Salary Window (10:00 AM - 12:30 PM)',
    isTransient: false
  },
  'CARD_LIMIT_EXCEEDED': {
    category: 'Behavioral',
    subCategory: 'Daily / Transaction Card Limit',
    merchantExplanation: 'Customer has exceeded their daily online transaction limit set by their bank app. Multi-rail payment link enables split payment or alternate netbanking.',
    customerExplanation: 'This transaction exceeds the daily online spending limit set on your card. You can either adjust your limit in your banking app or complete via NetBanking/UPI.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate Delivery (Multi-Rail Fallback)',
    isTransient: false
  },
  'EXPIRED_CARD': {
    category: 'Behavioral',
    subCategory: 'Expired Card / Instrument',
    merchantExplanation: 'The card on file has expired. Retrying this instrument will fail 100% of the time. Dispatched a 1-click card update link to secure uninterrupted service.',
    customerExplanation: 'Your saved payment card has expired. Please take 30 seconds to update your payment details securely via this link.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate Instrument Update Link',
    isTransient: false
  },
  'MANDATE_INACTIVE': {
    category: 'Behavioral',
    subCategory: 'Recurring Mandate Inactive',
    merchantExplanation: 'Recurring autopay e-mandate was suspended or cancelled by customer bank. Re-authorizing via Razorpay Autopay link will restore billing lifecycle.',
    customerExplanation: 'Your subscription autopay mandate is currently inactive. Please re-verify your autopay method to keep your subscription uninterrupted.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate Autopay Re-auth Link',
    isTransient: false
  },
  'PAYMENT_AUTHENTICATION_FAILED': {
    category: 'Behavioral',
    subCategory: 'Customer 3DS Authentication Dropped',
    merchantExplanation: 'Customer entered incorrect OTP or abandoned the 3D-Secure authentication prompt before submitting.',
    customerExplanation: 'The OTP or password entered was incorrect or expired. Please click below to generate a new verification code and complete payment.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate 1-Click Link Delivery',
    isTransient: true
  },
  'CHECKOUT_ABANDONED': {
    category: 'Behavioral',
    subCategory: 'Cart / Checkout Abandonment',
    merchantExplanation: 'Customer added items to cart and entered checkout but dropped off before final submission. Triggered gentle multi-channel recovery link.',
    customerExplanation: 'We saved your checkout cart! Complete your order in one click using your saved preferred payment method.',
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Cart Recovery (Within 1 Hour)',
    isTransient: true
  },
  'INVOICE_OVERDUE': {
    category: 'Behavioral',
    subCategory: 'Commercial Invoice Overdue',
    merchantExplanation: 'Enterprise invoice payment terms elapsed without settlement. Automated dunning dispatch with instant Razorpay corporate settlement link.',
    customerExplanation: 'Invoice is outstanding past agreed settlement terms. Please arrange wire settlement or click the secure link to pay online.',
    recommendedAction: 'Send reminder',
    optimalTimeWindow: 'Standard Corporate Business Hours (11:00 AM)',
    isTransient: false
  },

  // --- FRAUD / HIGH-RISK ATTEMPTS ---
  'VELOCITY_CHECK_FAILED': {
    category: 'Fraud',
    subCategory: 'Suspicious Velocity Spike',
    merchantExplanation: 'Multiple rapid failure attempts (>5 in 10 minutes) detected from this IP/device footprint. High chargeback risk; automated retries halted for risk review.',
    customerExplanation: 'This transaction was temporarily paused by automated safety checks. Please contact support or verify your billing identity.',
    recommendedAction: 'Escalate',
    optimalTimeWindow: 'Manual Security Review Required',
    isTransient: false
  },
  'PAYMENT_FRAUD_DETECTED': {
    category: 'Fraud',
    subCategory: 'Fraud Engine Flag / Stolen Card',
    merchantExplanation: 'Gateway fraud detection heuristics flagged high risk score. Card reported lost/stolen or high chargeback probability.',
    customerExplanation: 'This transaction could not be processed due to security verification failure. Please contact your card issuing bank.',
    recommendedAction: 'Escalate',
    optimalTimeWindow: 'Security Quarantine (No Auto-Retry)',
    isTransient: false
  },
  'CHARGEBACK_RISK': {
    category: 'Fraud',
    subCategory: 'High Chargeback Risk BIN',
    merchantExplanation: 'The BIN range or customer identifier has a high historical dispute / chargeback rate. Enforce manual merchant signoff before accepting funds.',
    customerExplanation: 'Additional merchant confirmation is required to process this order. Our compliance team will reach out shortly.',
    recommendedAction: 'Escalate',
    optimalTimeWindow: 'Compliance Officer Review',
    isTransient: false
  }
};

/**
 * Normalizes any gateway error code or raw failure reason into structured classification.
 */
export function normalizeFailureCode(rawCode?: string, rawReason?: string, issue?: string): NormalizedErrorInfo {
  const code = (rawCode || '').trim().toUpperCase();
  const reason = (rawReason || '').toLowerCase();
  const issueStr = (issue || '').toLowerCase();

  // 1. Direct Catalog Lookup
  if (NORMALIZED_ERROR_CATALOG[code]) {
    return {
      code,
      ...NORMALIZED_ERROR_CATALOG[code]
    };
  }

  // 2. Heuristic Pattern Match for Technical Failures
  if (
    code.includes('TIMEOUT') || 
    code.includes('GATEWAY') || 
    code.includes('SWITCH') || 
    code.includes('NETWORK') || 
    code.includes('ACQUIRER') ||
    reason.includes('timeout') || 
    reason.includes('network') || 
    reason.includes('bank switch') || 
    reason.includes('latency') ||
    reason.includes('server error') ||
    reason.includes('temporarily unreachable')
  ) {
    return {
      code: code || 'GATEWAY_ERROR_DEBIT_FAILED',
      category: 'Technical',
      subCategory: 'Bank / Network Latency',
      merchantExplanation: `Gateway communication timed out during debit processing. The card/mandate is valid; automated background retry or instant payment link avoids customer friction.`,
      customerExplanation: `Your bank was momentarily unreachable and no funds were debited. Click here to safely complete your payment.`,
      recommendedAction: 'Retry payment',
      optimalTimeWindow: 'Instant Background Retry (15m Cooldown)',
      isTransient: true
    };
  }

  // 3. Heuristic Pattern Match for Fraud & High-Risk
  if (
    code.includes('FRAUD') || 
    code.includes('VELOCITY') || 
    code.includes('STOLEN') || 
    code.includes('CHARGEBACK') || 
    code.includes('BLOCKED_CARD') ||
    reason.includes('fraud') || 
    reason.includes('velocity') || 
    reason.includes('suspicious') || 
    reason.includes('chargeback') || 
    reason.includes('stolen')
  ) {
    return {
      code: code || 'VELOCITY_CHECK_FAILED',
      category: 'Fraud',
      subCategory: 'Suspicious Velocity / Risk Flag',
      merchantExplanation: `High-risk telemetry detected (velocity spike or fraud heuristic). Automated retries locked to prevent chargebacks. Requires manual signoff.`,
      customerExplanation: `This transaction was paused by safety systems. Please verify your payment details with customer support.`,
      recommendedAction: 'Escalate',
      optimalTimeWindow: 'Manual Security Review Required',
      isTransient: false
    };
  }

  // 4. Heuristic Pattern Match for Expired Instruments
  if (
    code.includes('EXPIRED') || 
    reason.includes('expired') || 
    reason.includes('card update') || 
    reason.includes('renew')
  ) {
    return {
      code: code || 'EXPIRED_CARD',
      category: 'Behavioral',
      subCategory: 'Expired Card / Instrument',
      merchantExplanation: `The payment method has expired. Retrying the dead card will fail; dispatched a 1-click update link to update details.`,
      customerExplanation: `Your payment method has expired. Please use this secure 1-click link to update your card details.`,
      recommendedAction: 'Payment link',
      optimalTimeWindow: 'Immediate Instrument Update Link',
      isTransient: false
    };
  }

  // 5. Heuristic Pattern Match for Insufficient Funds
  if (
    code.includes('INSUFFICIENT') || 
    code.includes('FUNDS') || 
    code.includes('BALANCE') || 
    code.includes('LIMIT') ||
    reason.includes('insufficient') || 
    reason.includes('balance') || 
    reason.includes('funds') || 
    reason.includes('limit reached')
  ) {
    return {
      code: code || 'INSUFFICIENT_FUNDS',
      category: 'Behavioral',
      subCategory: 'Insufficient Balance / Limit',
      merchantExplanation: `Transient balance or credit limit shortage detected. Multi-rail payment link (supporting UPI/Debit) scheduled for optimal salary/morning hours.`,
      customerExplanation: `Your bank declined due to insufficient balance or card limit. Use this link to pay via another account or UPI.`,
      recommendedAction: 'Payment link',
      optimalTimeWindow: 'Morning Salary Window (10:00 AM - 12:30 PM)',
      isTransient: false
    };
  }

  // 6. Subscriptions / Mandates
  if (
    issueStr.includes('subscription') || 
    code.includes('MANDATE') || 
    reason.includes('mandate') || 
    reason.includes('autopay')
  ) {
    return {
      code: code || 'MANDATE_INACTIVE',
      category: 'Behavioral',
      subCategory: 'Recurring Mandate Inactive',
      merchantExplanation: `Recurring autopay mandate dropped by issuer. Re-authorization link dispatched to restore recurring cash flow.`,
      customerExplanation: `Your autopay subscription mandate requires re-verification. Complete in 1 click to avoid service pause.`,
      recommendedAction: 'Payment link',
      optimalTimeWindow: 'Immediate Autopay Re-auth Link',
      isTransient: false
    };
  }

  // 7. Invoices Overdue
  if (issueStr.includes('invoice') || reason.includes('invoice') || reason.includes('net-30')) {
    return {
      code: code || 'INVOICE_OVERDUE',
      category: 'Behavioral',
      subCategory: 'Commercial Invoice Overdue',
      merchantExplanation: `Corporate invoice settlement window elapsed. Automated dunning note with 1-click Razorpay payment link dispatched.`,
      customerExplanation: `Your corporate invoice is outstanding. Settle securely via the link or bank transfer.`,
      recommendedAction: 'Send reminder',
      optimalTimeWindow: 'Standard Corporate Business Hours (11:00 AM)',
      isTransient: false
    };
  }

  // 8. Default Checkout Abandonment
  return {
    code: code || 'PAYMENT_AUTHENTICATION_FAILED',
    category: 'Behavioral',
    subCategory: 'Customer 3DS Authentication Dropped',
    merchantExplanation: `Payment authorization dropped prior to OTP confirmation. Dispatched frictionless 1-click link to salvage checkout.`,
    customerExplanation: `Your checkout session is saved. Click to complete your payment securely via UPI, Card, or NetBanking.`,
    recommendedAction: 'Payment link',
    optimalTimeWindow: 'Immediate 1-Click Link Delivery',
    isTransient: true
  };
}

// -------------------------------------------------------------
// Predictive Recovery Scoring Algorithm
// -------------------------------------------------------------
export interface RecoveryScoringInput {
  amount: number;
  issue: string;
  failureCode?: string;
  failureReason?: string;
  createdAt?: string;
  attemptCount?: number;
  customer?: {
    lifetimeValue?: number;
    successfulTransactions?: number;
    failedTransactions?: number;
    recoveredTransactions?: number;
  } | null;
}

/**
 * Calculates the exact dynamic recovery probability (0–100%) and scoring breakdown
 * based on customer LTV, historical success rate, amount & billing frequency, failure root cause, and time decay.
 */
export function calculatePredictiveRecoveryScore(input: RecoveryScoringInput): ScoringBreakdown {
  const { amount = 5000, issue = 'Payment failed', failureCode, failureReason, createdAt, attemptCount = 1, customer } = input;
  
  const normalized = normalizeFailureCode(failureCode, failureReason, issue);
  const factors: ScoringFactor[] = [];

  // Factor 1: Root-Cause Base Likelihood
  let baseScore = 75;
  if (normalized.category === 'Technical') {
    baseScore = 92;
    factors.push({
      name: 'Root Cause (Technical Network Latency)',
      weight: +17,
      description: 'Transient bank switch/OTP network timeout has high salvageability on retry.',
      valueDisplay: '92% Baseline'
    });
  } else if (normalized.category === 'Fraud') {
    baseScore = 18;
    factors.push({
      name: 'Root Cause (High-Risk / Velocity Spike)',
      weight: -57,
      description: 'Fraud telemetry or suspicious velocity severely impairs autonomous recovery.',
      valueDisplay: '18% Baseline'
    });
  } else {
    // Behavioral Sub-categories
    if (normalized.subCategory.includes('Expired')) {
      baseScore = 84;
      factors.push({
        name: 'Root Cause (Expired Payment Method)',
        weight: +9,
        description: 'Customer instrument update links have strong 84% conversion.',
        valueDisplay: '84% Baseline'
      });
    } else if (normalized.subCategory.includes('Insufficient')) {
      baseScore = 72;
      factors.push({
        name: 'Root Cause (Insufficient Funds / Limit)',
        weight: -3,
        description: 'Balance shortage responds well to multi-rail & salary-timed recovery.',
        valueDisplay: '72% Baseline'
      });
    } else if (normalized.subCategory.includes('Invoice')) {
      baseScore = 78;
      factors.push({
        name: 'Root Cause (Commercial Invoice Terms)',
        weight: +3,
        description: 'B2B commercial invoices have high eventual capture with active dunning.',
        valueDisplay: '78% Baseline'
      });
    } else {
      baseScore = 80;
      factors.push({
        name: 'Root Cause (Customer Auth Drop-off)',
        weight: +5,
        description: '3DS cart drop-off recovers quickly via 1-click fallback link.',
        valueDisplay: '80% Baseline'
      });
    }
  }

  // Factor 2: Customer Historical Success Rate
  let historicalSuccessRateFactor = 0;
  if (customer && (customer.successfulTransactions !== undefined || customer.failedTransactions !== undefined)) {
    const successCount = Number(customer.successfulTransactions) || 0;
    const failCount = Number(customer.failedTransactions) || 0;
    const totalTx = successCount + failCount;
    
    if (totalTx >= 2) {
      const rate = successCount / totalTx;
      if (rate >= 0.85) {
        historicalSuccessRateFactor = +10;
        factors.push({
          name: 'Customer Historical Health',
          weight: +10,
          description: `Established track record with ${Math.round(rate * 100)}% historical payment success rate.`,
          valueDisplay: `+10% (${Math.round(rate * 100)}% success)`
        });
      } else if (rate >= 0.60) {
        historicalSuccessRateFactor = +4;
        factors.push({
          name: 'Customer Historical Health',
          weight: +4,
          description: `Moderate track record (${Math.round(rate * 100)}% success rate).`,
          valueDisplay: `+4% (${Math.round(rate * 100)}% success)`
        });
      } else {
        historicalSuccessRateFactor = -12;
        factors.push({
          name: 'Customer Historical Health',
          weight: -12,
          description: `Chronic failure history (${Math.round(rate * 100)}% success rate across ${totalTx} orders).`,
          valueDisplay: `-12% (Low historical success)`
        });
      }
    }
  }

  // Factor 3: Customer Lifetime Value (LTV)
  let ltvFactor = 0;
  const ltv = customer?.lifetimeValue || amount;
  if (ltv >= 100000) {
    ltvFactor = +8;
    factors.push({
      name: 'High LTV Enterprise Tier',
      weight: +8,
      description: `High-value customer profile (LTV: ₹${Math.round(ltv).toLocaleString('en-IN')}) with high brand affinity.`,
      valueDisplay: '+8% (Tier 1 LTV)'
    });
  } else if (ltv >= 30000) {
    ltvFactor = +4;
    factors.push({
      name: 'Mid-Tier Customer LTV',
      weight: +4,
      description: `Good lifetime transaction volume (₹${Math.round(ltv).toLocaleString('en-IN')}).`,
      valueDisplay: '+4% (Tier 2 LTV)'
    });
  }

  // Factor 4: Transaction Amount & Billing Frequency
  let amountAndFrequencyFactor = 0;
  const issueLower = (issue || '').toLowerCase();
  const isSubscription = issueLower.includes('subscription') || issueLower.includes('autopay');
  
  if (isSubscription) {
    amountAndFrequencyFactor += 4;
    factors.push({
      name: 'Recurring Subscription Autopay',
      weight: +4,
      description: 'Active subscription mandate has high customer commitment and repeat intent.',
      valueDisplay: '+4% (Recurring)'
    });
  }

  if (amount >= 50000) {
    amountAndFrequencyFactor -= 6;
    factors.push({
      name: 'High-Ticket Value Adjustment',
      weight: -6,
      description: `Large transaction (₹${amount.toLocaleString('en-IN')}) requires deliberate buyer confirmation.`,
      valueDisplay: '-6% (High Ticket)'
    });
  } else if (amount <= 5000) {
    amountAndFrequencyFactor += 3;
    factors.push({
      name: 'Low-Friction Transaction Amount',
      weight: +3,
      description: 'Micro/low-ticket amounts face near-zero purchase hesitation.',
      valueDisplay: '+3% (Low ticket)'
    });
  }

  // Factor 5: Time Elapsed Decay Function (Aging Penalty)
  let timeElapsedDecay = 0;
  if (createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!isNaN(createdMs)) {
      const hoursAgo = Math.max(0, (Date.now() - createdMs) / (1000 * 60 * 60));
      if (hoursAgo < 1) {
        timeElapsedDecay = 0;
        factors.push({
          name: 'Fresh Failure Window (< 1h)',
          weight: 0,
          description: 'Payment addressed immediately during active user session.',
          valueDisplay: '0% (Fresh)'
        });
      } else if (hoursAgo <= 6) {
        timeElapsedDecay = -3;
        factors.push({
          name: 'Recent Failure Decay (1-6h)',
          weight: -3,
          description: 'Minor time decay as buyer may have navigated away from checkout.',
          valueDisplay: '-3% (1-6h ago)'
        });
      } else if (hoursAgo <= 24) {
        timeElapsedDecay = -7;
        factors.push({
          name: 'Day-1 Aging Decay (6-24h)',
          weight: -7,
          description: 'Same-day outreach window.',
          valueDisplay: '-7% (6-24h ago)'
        });
      } else if (hoursAgo <= 72) {
        timeElapsedDecay = -14;
        factors.push({
          name: 'Multi-Day Aging Decay (24-72h)',
          weight: -14,
          description: 'Recovery likelihood drops noticeably after 24 hours.',
          valueDisplay: '-14% (1-3 days ago)'
        });
      } else {
        timeElapsedDecay = -24;
        factors.push({
          name: 'Stale Incident Decay (> 3 days)',
          weight: -24,
          description: 'Aged failure; requires active incentives or manual outreach to salvage.',
          valueDisplay: '-24% (> 3 days ago)'
        });
      }
    }
  }

  // Factor 6: Attempt Count Penalty
  let attemptPenalty = 0;
  if (attemptCount > 1) {
    attemptPenalty = (attemptCount - 1) * -8;
    factors.push({
      name: `Retry Exhaustion (${attemptCount} attempts)`,
      weight: attemptPenalty,
      description: `Multiple prior failed retries indicate persistent customer or bank blockage.`,
      valueDisplay: `${attemptPenalty}% (${attemptCount} attempts)`
    });
  }

  // Compute Final Calculated Score (Clamped 5% to 98%)
  let calculated = baseScore + historicalSuccessRateFactor + ltvFactor + amountAndFrequencyFactor + timeElapsedDecay + attemptPenalty;
  const finalScore = Math.max(5, Math.min(98, Math.round(calculated)));

  // Calculate Expected Recoverable Value: Amount * (Probability / 100)
  const expectedRecoveryValue = Math.round(amount * (finalScore / 100));

  // Determine Priority Rank
  let priorityRank: PriorityRank = 'Medium Priority';
  if (normalized.category === 'Fraud') {
    priorityRank = 'Low Priority';
  } else if (expectedRecoveryValue >= 40000 || (expectedRecoveryValue >= 20000 && finalScore >= 80)) {
    priorityRank = 'Critical Priority';
  } else if (expectedRecoveryValue >= 15000 || finalScore >= 85) {
    priorityRank = 'High Priority';
  } else if (expectedRecoveryValue >= 5000 || finalScore >= 60) {
    priorityRank = 'Medium Priority';
  } else {
    priorityRank = 'Low Priority';
  }

  return {
    baseScore,
    historicalSuccessRateFactor,
    ltvFactor,
    amountAndFrequencyFactor,
    failureReasonFactor: 0,
    timeElapsedDecay,
    attemptPenalty,
    finalScore,
    expectedRecoveryValue,
    priorityRank,
    factors
  };
}

// -------------------------------------------------------------
// Dynamic Customer Response Window Calculation
// -------------------------------------------------------------

/**
 * Computes dynamic customer response timeout window in hours based on issue type,
 * transaction size, and urgency.
 */
export function calculateDynamicResponseWindow(
  issue: string = '',
  amount: number = 0,
  isMandate: boolean = false
): number {
  const issueLower = (issue || '').toLowerCase();

  if (isMandate || issueLower.includes('subscription')) {
    // Subscriptions: 24h window for customer to switch card before billing cutoff
    return 24;
  }
  if (issueLower.includes('invoice')) {
    // B2B commercial invoice: 48h corporate AP turnaround
    return 48;
  }
  if (issueLower.includes('abandoned') || issueLower.includes('checkout')) {
    // Cart abandonment: 2 hours while purchase intent is fresh
    return 2;
  }
  if (amount >= 50000) {
    // High-ticket payment: 36 hours for customer to verify banking limits
    return 36;
  }
  // Default standard payment failure recovery: 12 hours
  return 12;
}

/**
 * Fallback / deterministic structured AI diagnosis synthesis that mirrors LLM reasoning.
 */
export function buildDeterministicLLMDiagnosis(
  caseItem: any,
  customer?: any
): any {
  const normalized = normalizeFailureCode(caseItem.failureCode, caseItem.failureReason, caseItem.issue);
  const scoring = calculatePredictiveRecoveryScore({
    amount: caseItem.amount,
    issue: caseItem.issue,
    failureCode: caseItem.failureCode,
    failureReason: caseItem.failureReason,
    createdAt: caseItem.createdAt,
    attemptCount: caseItem.attemptCount || 1,
    customer
  });

  const isMandate = caseItem.issue === 'Subscription lapsed' || 
    (caseItem.id && caseItem.id.toLowerCase().includes('sub')) || 
    (caseItem.failureReason || '').toLowerCase().includes('mandate');

  const responseWindowHours = calculateDynamicResponseWindow(caseItem.issue, caseItem.amount, isMandate);

  let scheduledAt: string | null = null;
  let scheduledTimeDisplay: string | null = null;
  const now = new Date();
  let exactTiming = '';
  if (normalized.recommendedAction === 'Schedule retry') {
    const schedDate = new Date(now);
    schedDate.setDate(schedDate.getDate() + 1);
    schedDate.setHours(9, 30, 0, 0);
    scheduledAt = schedDate.toISOString();
    scheduledTimeDisplay = schedDate.toLocaleString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    exactTiming = scheduledTimeDisplay;
  } else if (normalized.recommendedAction === 'Retry payment') {
    const retryDate = new Date(now.getTime() + 15 * 60 * 1000);
    exactTiming = retryDate.toLocaleString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    const dispatchDate = new Date(now.getTime() + 2 * 60 * 1000);
    exactTiming = dispatchDate.toLocaleString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  const responseWindowDeadline = new Date(now.getTime() + responseWindowHours * 3600 * 1000).toISOString();

  return {
    merchantExplanation: normalized.merchantExplanation,
    customerExplanation: normalized.customerExplanation,
    recommendedAction: isMandate ? 'Mandate repair' : normalized.recommendedAction,
    optimalTimeWindow: exactTiming,
    optimalWindowReason: exactTiming,
    scheduledAt,
    scheduledTimeDisplay,
    nextScheduleTiming: scheduledAt || undefined,
    responseWindowHours,
    responseWindowDeadline,
    priorityRank: scoring.priorityRank,
    recoveryProbability: scoring.finalScore,
    rootCauseCategory: normalized.category,
    rootCauseSubCategory: normalized.subCategory,
    diagnosedAt: now.toISOString()
  };
}
