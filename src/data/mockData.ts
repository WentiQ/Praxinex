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

export const INITIAL_CASES: RecoveryCase[] = [];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [];

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

export const PAYMENT_LEDGER: PaymentRecord[] = [];

export const CUSTOMER_DIRECTORY: CustomerRecord[] = [];
