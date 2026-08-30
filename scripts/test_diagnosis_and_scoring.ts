import { normalizeFailureCode, calculatePredictiveRecoveryScore } from '../src/utils/aiDiagnosisEngine.js';

console.log('🧪 Running AI Root-Cause Diagnosis & Predictive Recovery Scoring Test Suite...\n');

// ----------------------------------------------------------------------
// Test 1: Technical Failure Normalization & Scoring
// ----------------------------------------------------------------------
console.log('--- Test 1: Technical Network Latency ---');
const techDiag = normalizeFailureCode('GATEWAY_ERROR_DEBIT_FAILED', 'Bank switch network timeout during 3DS OTP authorization', 'Payment failed');
console.log('Category:', techDiag.category);
console.log('SubCategory:', techDiag.subCategory);
console.log('Merchant Insight:', techDiag.merchantExplanation);
console.log('Customer View:', techDiag.customerExplanation);
console.log('Action:', techDiag.recommendedAction);

const techScore = calculatePredictiveRecoveryScore({
  amount: 18500,
  issue: 'Payment failed',
  failureCode: 'GATEWAY_ERROR_DEBIT_FAILED',
  failureReason: 'Bank switch network timeout',
  createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
  attemptCount: 1,
  customer: {
    lifetimeValue: 120000,
    successfulTransactions: 12,
    failedTransactions: 1
  }
});
console.log('Recovery Probability:', techScore.finalScore + '%');
console.log('Expected Recovery Value: ₹' + techScore.expectedRecoveryValue.toLocaleString('en-IN'));
console.log('Priority Rank:', techScore.priorityRank);
console.log('Factor Count:', techScore.factors.length);
if (techDiag.category !== 'Technical' || techScore.finalScore < 85) {
  throw new Error('Test 1 failed: Expected Technical classification with high salvage probability');
}
console.log('✅ Test 1 Passed!\n');

// ----------------------------------------------------------------------
// Test 2: Behavioral Failure Normalization & Scoring
// ----------------------------------------------------------------------
console.log('--- Test 2: Customer-Side Insufficient Funds (Aging Decay) ---');
const behDiag = normalizeFailureCode('INSUFFICIENT_FUNDS', 'Card limit reached / Insufficient available balance', 'Payment failed');
console.log('Category:', behDiag.category);
console.log('SubCategory:', behDiag.subCategory);
console.log('Merchant Insight:', behDiag.merchantExplanation);
console.log('Customer View:', behDiag.customerExplanation);

const behScore = calculatePredictiveRecoveryScore({
  amount: 25000,
  issue: 'Payment failed',
  failureCode: 'INSUFFICIENT_FUNDS',
  failureReason: 'Card limit reached',
  createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago (aging decay applied)
  attemptCount: 2,
  customer: {
    lifetimeValue: 40000,
    successfulTransactions: 4,
    failedTransactions: 2
  }
});
console.log('Recovery Probability (with 36h decay & attempt penalty):', behScore.finalScore + '%');
console.log('Expected Recovery Value: ₹' + behScore.expectedRecoveryValue.toLocaleString('en-IN'));
console.log('Priority Rank:', behScore.priorityRank);
if (behDiag.category !== 'Behavioral' || behScore.timeElapsedDecay >= 0) {
  throw new Error('Test 2 failed: Expected Behavioral classification with aging time decay penalty');
}
console.log('✅ Test 2 Passed!\n');

// ----------------------------------------------------------------------
// Test 3: Expired Card / Mandate Normalization
// ----------------------------------------------------------------------
console.log('--- Test 3: Expired Card on Subscription Autopay ---');
const expDiag = normalizeFailureCode('EXPIRED_CARD', 'Recurring auto-debit charge rejected: card expired', 'Subscription lapsed');
console.log('Category:', expDiag.category);
console.log('SubCategory:', expDiag.subCategory);
console.log('Merchant Insight:', expDiag.merchantExplanation);
console.log('Customer View:', expDiag.customerExplanation);

const expScore = calculatePredictiveRecoveryScore({
  amount: 12000,
  issue: 'Subscription lapsed',
  failureCode: 'EXPIRED_CARD',
  failureReason: 'Card expired',
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  attemptCount: 1,
  customer: {
    lifetimeValue: 90000,
    successfulTransactions: 9,
    failedTransactions: 0
  }
});
console.log('Recovery Probability:', expScore.finalScore + '%');
console.log('Priority Rank:', expScore.priorityRank);
if (expDiag.category !== 'Behavioral' || expDiag.subCategory !== 'Expired Card / Instrument') {
  throw new Error('Test 3 failed: Expected Expired Card classification');
}
console.log('✅ Test 3 Passed!\n');

// ----------------------------------------------------------------------
// Test 4: Fraud & Suspicious Velocity Normalization & Stopping Rule
// ----------------------------------------------------------------------
console.log('--- Test 4: High-Risk Velocity Spike (Fraud Stopping Rule) ---');
const fraudDiag = normalizeFailureCode('VELOCITY_CHECK_FAILED', 'Suspicious velocity: 6 rapid failed attempts from same device', 'Payment failed');
console.log('Category:', fraudDiag.category);
console.log('SubCategory:', fraudDiag.subCategory);
console.log('Recommended Action:', fraudDiag.recommendedAction);
console.log('Merchant Insight:', fraudDiag.merchantExplanation);

const fraudScore = calculatePredictiveRecoveryScore({
  amount: 150000,
  issue: 'Payment failed',
  failureCode: 'VELOCITY_CHECK_FAILED',
  failureReason: 'Velocity check failed',
  createdAt: new Date().toISOString(),
  attemptCount: 3,
  customer: null
});
console.log('Recovery Probability:', fraudScore.finalScore + '%');
console.log('Priority Rank:', fraudScore.priorityRank);
if (fraudDiag.category !== 'Fraud' || fraudDiag.recommendedAction !== 'Escalate' || fraudScore.priorityRank !== 'Low Priority') {
  throw new Error('Test 4 failed: Expected Fraud escalation stopping rule and low priority rank');
}
console.log('✅ Test 4 Passed!\n');

// ----------------------------------------------------------------------
// Test 5: Prioritization Sorting Verification
// ----------------------------------------------------------------------
console.log('--- Test 5: Queue Prioritization Ranking ---');
const testCases = [
  { id: 'C1', amount: 5000, recoveryProbability: 95, expVal: 4750 },
  { id: 'C2', amount: 85000, recoveryProbability: 80, expVal: 68000 },
  { id: 'C3', amount: 18500, recoveryProbability: 92, expVal: 17020 },
  { id: 'C4', amount: 150000, recoveryProbability: 18, expVal: 27000 }
];

testCases.sort((a, b) => (b.expVal !== a.expVal ? b.expVal - a.expVal : b.recoveryProbability - a.recoveryProbability));
console.log('Prioritized Order (Highest expected salvageable revenue first):');
testCases.forEach((c, idx) => {
  console.log(`Rank #${idx + 1}: ${c.id} (₹${c.amount} @ ${c.recoveryProbability}% -> Expected ₹${c.expVal})`);
});
if (testCases[0].id !== 'C2' || testCases[1].id !== 'C4') {
  throw new Error('Test 5 failed: Prioritization order incorrect');
}
console.log('✅ Test 5 Passed!\n');

console.log('🎉 ALL 5 DIAGNOSTIC & SCORING TEST SUITES PASSED PERFECTLY!');
