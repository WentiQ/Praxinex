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
  | 'Mandate repair'
  | 'Schedule retry'
  | 'Escalate';

export type CaseStatus = 
  | 'Recovered' 
  | 'In progress' 
  | 'Awaiting payment' 
  | 'Needs review' 
  | 'Scheduled' 
  | 'Failed';

export type CommunicationChannel = 'email' | 'sms';

export interface ChannelDeliveryStatus {
  channel: CommunicationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed';
  timestamp: string;
  recipient: string;
  details?: string;
}

export interface PersonalizedMessageCopy {
  channel: CommunicationChannel;
  subject?: string; // For Email
  heading?: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  tone: 'polite_reassuring' | 'urgent_polite' | 'vip_executive';
  reassuranceNote?: string;
}

export interface ScheduledRetryInfo {
  scheduledAt: string; // ISO String
  scheduledTimeDisplay: string;
  bankName?: string;
  peakSuccessRate: number; // e.g. 94.2
  windowReason: string;
  status: 'pending' | 'executing' | 'executed' | 'cancelled';
  autoExecute: boolean;
}

export interface MandateRepairInfo {
  mandateId?: string;
  subscriptionId?: string;
  repairUrl: string;
  cardNetworkSupported: string[];
  expiresAt: string;
  customerInstructions: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  title: string;
  description: string;
  type: 'failure' | 'detection' | 'diagnosis' | 'action' | 'success' | 'escalation' | 'scheduled' | 'recovered' | 'link' | 'mandate' | 'reminder' | string;
  actionType?: string;
  channel?: CommunicationChannel;
}

export type RootCauseCategory = 'Technical' | 'Behavioral' | 'Fraud';
export type PriorityRank = 'Critical Priority' | 'High Priority' | 'Medium Priority' | 'Low Priority';

export interface NormalizedErrorInfo {
  code: string;
  category: RootCauseCategory;
  subCategory: string;
  merchantExplanation: string;
  customerExplanation: string;
  recommendedAction: RecommendedAction;
  optimalTimeWindow: string;
  isTransient: boolean;
}

export interface ScoringFactor {
  name: string;
  weight: number;
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
  finalScore: number;
  expectedRecoveryValue: number;
  priorityRank: PriorityRank;
  factors: ScoringFactor[];
}

export interface RecoveryCase {
  id: string;
  userId?: string;
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
  rootCauseCategory?: RootCauseCategory;
  rootCauseSubCategory?: string;
  normalizedError?: NormalizedErrorInfo;
  scoringBreakdown?: ScoringBreakdown;
  expectedRecoveryValue?: number;
  priorityRank?: PriorityRank;
  // Multi-Channel Smart Dunning & Scheduled Execution Extensions
  scheduledRetry?: ScheduledRetryInfo;
  mandateRepair?: MandateRepairInfo;
  channelStatuses?: ChannelDeliveryStatus[];
  lastMessageCopy?: PersonalizedMessageCopy[];
  // Dynamic Response Window & LLM Diagnosis Extensions
  responseWindowHours?: number;
  responseWindowDeadline?: string;
  lastDiagnosedAt?: string;
  timelineUpdatedAt?: string;
  llmDiagnosis?: LLMDiagnosisResult;
}

export interface LLMDiagnosisResult {
  merchantExplanation: string;
  customerExplanation: string;
  recommendedAction: RecommendedAction;
  optimalTimeWindow: string;
  optimalWindowReason?: string;
  scheduledAt?: string | null;
  scheduledTimeDisplay?: string | null;
  nextScheduleTiming?: string;
  responseWindowHours: number;
  responseWindowDeadline?: string;
  priorityRank: PriorityRank;
  recoveryProbability: number;
  rootCauseCategory?: RootCauseCategory;
  rootCauseSubCategory?: string;
  diagnosedAt: string;
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
  channel?: CommunicationChannel;
  type?: string;
  action?: string;
  description?: string;
  recoveryProbability?: number;
  status?: string;
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
  // Smart Dunning Multi-Channel & Mandate Rules
  emailEnabled: boolean;
  smsEnabled: boolean;
  smartTimingAutoExecute: boolean;
  autoMandateRepairForSubscriptions: boolean;
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
  customerPhone?: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'refunded' | 'captured';
  failureReason?: string;
  method: string;
  timestamp: string;
  recoveredByAgent: boolean;
  caseId?: string;
  orderId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  isoTimestamp?: string;
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

export type ActiveTab = 
  | 'overview' 
  | 'cases' 
  | 'payments' 
  | 'customers' 
  | 'analytics' 
  | 'activity' 
  | 'policies' 
  | 'integrations' 
  | 'settings'
  | 'praxinex';

export interface PraxinexAction {
  id: string;
  type: 
    | 'generate_payment_link' 
    | 'navigate' 
    | 'open_case' 
    | 'sync_data' 
    | 'escalate_case' 
    | 'retry_charge' 
    | 'retry_payment' 
    | 'send_reminder' 
    | 'schedule_retry'
    | 'repair_mandate'
    | 'execute_scheduled_now'
    | 'escalate';
  label: string;
  payload?: any;
  status?: 'pending' | 'executed' | 'failed';
  resultText?: string;
}

export interface PraxinexMessage {
  id: string;
  sender: 'user' | 'praxinex';
  text: string;
  timestamp: string;
  thoughts?: string[];
  actions?: PraxinexAction[];
  caseCards?: RecoveryCase[];
  paymentLinkCard?: {
    id: string;
    url: string;
    amount: number;
    customerName: string;
    description: string;
    channels?: CommunicationChannel[];
  };
  mandateRepairCard?: {
    id: string;
    repairUrl: string;
    customerName: string;
    subscriptionId: string;
    amount: number;
    instructions: string;
  };
  scheduledRetryCard?: {
    caseId: string;
    customerName: string;
    scheduledAt: string;
    peakSuccessRate: number;
    windowReason: string;
  };
  metricsHighlight?: {
    revenueAtRisk: number;
    recovered: number;
    recoveryRate: number;
    activeCases: number;
  };
}
