import firstNames from '../../data/first_names.json';
import lastNames from '../../data/last_names.json';

export type PaymentLifecycleStatus = 
  | 'payment_link_generated'  // Cart checkout clicked -> Initial payment link created
  | 'awaiting_payment'        // User viewing payment link / cart
  | 'checkout_abandoned'      // User left checkout without paying
  | 'recovery_in_progress'    // AI Agent sending smart reminder / follow-up link
  | 'payment_attempted'       // User opened link again and initiated payment
  | 'payment_done';           // Payment captured & settled

export interface PaymentTimelineStep {
  step: number;
  timestamp: string;
  stage: PaymentLifecycleStatus;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentTrackedCustomer {
  customerId: string;
  firstName: string;
  lastName: string;
  customerName: string;
  email: string;
  amount: number; // in INR (multiples of 10 up to 10,00,000)
  cartId: string;
  initialPaymentLinkId: string;
  paymentLinkUrl: string;
  status: PaymentLifecycleStatus;
  createdAt: string;
  completedAt?: string;
  settledPaymentId?: string;
  timeline: PaymentTimelineStep[];
}

/**
 * Helper to generate a random multiple of 10 up to 10,00,000
 */
export function generateRandomAmount(maxAmount = 1000000, minAmount = 10, step = 10): number {
  const minSteps = Math.max(1, Math.floor(minAmount / step));
  const maxSteps = Math.floor(maxAmount / step);
  const randomStep = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
  return randomStep * step;
}

/**
 * Creates a unique customer from first_names.json & last_names.json,
 * and starts payment tracking with the 1st generated payment link.
 */
export function createCustomerAndStartPaymentTrack(customAmount?: number): PaymentTrackedCustomer {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  const customerName = `${fn} ${ln}`;
  const email = `${fn.toLowerCase()}${ln.toLowerCase()}@gmail.com`;
  const amount = customAmount ?? generateRandomAmount();
  
  const randomSuffix = Math.random().toString(36).substring(2, 9).toUpperCase();
  const customerId = `CUST-${randomSuffix}`;
  const cartId = `CART-${randomSuffix}`;
  const paymentLinkId = `plink_TV${randomSuffix.toLowerCase()}`;
  const paymentLinkUrl = `https://rzp.io/rzp/${randomSuffix.slice(0, 7)}`;
  const now = new Date().toISOString();

  const initialStep: PaymentTimelineStep = {
    step: 1,
    timestamp: now,
    stage: 'payment_link_generated',
    title: 'Payment Link Generated on Razorpay',
    description: `Payment link (${paymentLinkId}) generated on Razorpay for ₹${amount.toLocaleString('en-IN')}.`,
    metadata: {
      cartId,
      paymentLinkId,
      paymentLinkUrl,
      amount
    }
  };

  return {
    customerId,
    firstName: fn,
    lastName: ln,
    customerName,
    email,
    amount,
    cartId,
    initialPaymentLinkId: paymentLinkId,
    paymentLinkUrl,
    status: 'payment_link_generated',
    createdAt: now,
    timeline: [initialStep]
  };
}

/**
 * Advances a tracked payment lifecycle to its next state until payment is done.
 */
export function advancePaymentLifecycle(
  customer: PaymentTrackedCustomer,
  nextStage: PaymentLifecycleStatus,
  description?: string,
  extraMetadata?: Record<string, any>
): PaymentTrackedCustomer {
  const stepNumber = customer.timeline.length + 1;
  const now = new Date().toISOString();

  let title = '';
  switch (nextStage) {
    case 'awaiting_payment':
      title = 'Payment Link Delivered - Awaiting Payment';
      break;
    case 'checkout_abandoned':
      title = 'Payment Pending / Unsettled';
      break;
    case 'recovery_in_progress':
      title = 'Recovery Follow-up Dispatched';
      break;
    case 'payment_attempted':
      title = 'Payment Processing Initiated';
      break;
    case 'payment_done':
      title = 'Payment Captured & Settled Successfully';
      break;
    default:
      title = `Payment status updated to ${nextStage}`;
  }

  const step: PaymentTimelineStep = {
    step: stepNumber,
    timestamp: now,
    stage: nextStage,
    title,
    description: description || `Payment state moved to ${nextStage} for customer ${customer.customerName}.`,
    metadata: extraMetadata
  };

  const updatedTimeline = [...customer.timeline, step];
  const isDone = nextStage === 'payment_done';

  return {
    ...customer,
    status: nextStage,
    completedAt: isDone ? now : customer.completedAt,
    settledPaymentId: isDone ? (extraMetadata?.paymentId || `pay_${Math.random().toString(36).substring(2, 10)}`) : customer.settledPaymentId,
    timeline: updatedTimeline
  };
}

/**
 * Simulates the complete end-to-end journey from 1st payment link generation to payment done.
 */
export function simulateFullPaymentLifecycle(customAmount?: number): PaymentTrackedCustomer {
  let customer = createCustomerAndStartPaymentTrack(customAmount);
  
  // Step 2: Awaiting payment
  customer = advancePaymentLifecycle(
    customer,
    'awaiting_payment',
    `Payment link ${customer.paymentLinkUrl} sent to ${customer.email}. Awaiting authorization.`
  );

  // Step 3: Payment unsettled / declined
  customer = advancePaymentLifecycle(
    customer,
    'checkout_abandoned',
    `Payment attempt unsettled for ₹${customer.amount.toLocaleString('en-IN')}. Initializing recovery tracking.`
  );

  // Step 4: Recovery follow-up link
  customer = advancePaymentLifecycle(
    customer,
    'recovery_in_progress',
    `Recovery notification with payment link dispatched to ${customer.email}.`
  );

  // Step 5: Payment attempted
  customer = advancePaymentLifecycle(
    customer,
    'payment_attempted',
    `Customer authorized payment method on Razorpay.`
  );

  // Step 6: Payment done
  const settledPaymentId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  customer = advancePaymentLifecycle(
    customer,
    'payment_done',
    `Payment of ₹${customer.amount.toLocaleString('en-IN')} confirmed and captured via Razorpay (Ref: ${settledPaymentId}). Tracking closed.`,
    { paymentId: settledPaymentId, settledAmount: customer.amount }
  );

  return customer;
}
