export type IssueType = 
  | 'Payment failed' 
  | 'Invoice overdue' 
  | 'Subscription lapsed' 
  | 'Checkout abandoned';

export type RiskLevel = 'High' | 'Medium' | 'Low';

export type RecommendedAction = 
  | 'Retry payment' 
  | 'Payment link' 
  | 'Send reminder' 
  | 'Escalate' 
  | 'Schedule retry';

export type CaseStatus = 
  | 'Recovered' 
  | 'In progress' 
  | 'Awaiting payment' 
  | 'Needs review' 
  | 'Scheduled' 
  | 'Failed';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  title: string;
  description: string;
  type: 'failure' | 'detection' | 'diagnosis' | 'action' | 'success' | 'escalation';
}

export interface RecoveryCase {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  issue: IssueType;
  amount: number; // in INR
  risk: RiskLevel;
  recommendedAction: RecommendedAction;
  status: CaseStatus;
  updated: string;
  createdAt: string;
  failureReason: string;
  failureCode: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  invoiceNumber?: string;
  attemptCount: number;
  maxAttempts: number;
  recoveryProbability: number; // percentage e.g. 78
  aiWhy: string;
  aiPolicyNote: string;
  policyAllowed: boolean;
  timeline: TimelineEvent[];
  recoveredAmount?: number;
  recoveredAt?: string;
  paymentLinkUrl?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  dateDisplay: string;
  eventTitle: string;
  caseId: string;
  customerName: string;
  amount: number;
  decision: string;
  reason: string;
  policy: string;
  result: string;
  resultStatus: 'success' | 'info' | 'warning' | 'critical';
  details?: string;
}

export interface RecoveryPolicy {
  autoRetry: boolean;
  maxRetries: number;
  retryCooldownHours: number;
  autoReminders: boolean;
  maxReminders: number;
  reminderIntervalHours: number;
  escalateAfterFailedAttempts: number;
  requireApprovalForHighRisk: boolean;
  highRiskThresholdAmount: number;
}

export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  currency: 'INR';
  businessType: string;
  plan: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  isTestMode: boolean;
  razorpayConnected: boolean;
  geminiApiKey: string;
  geminiConnected: boolean;
  lastSyncedAt: string;
}

export interface PaymentRecord {
  id: string;
  razorpayPaymentId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'refunded' | 'captured';
  failureReason?: string;
  method: string;
  timestamp: string;
  recoveredByAgent: boolean;
  caseId?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  successfulTransactions: number;
  failedTransactions: number;
  recoveredTransactions: number;
  lifetimeValue: number;
  riskCategory: 'Low Risk' | 'Moderate' | 'High Risk';
  lastSeen: string;
}
