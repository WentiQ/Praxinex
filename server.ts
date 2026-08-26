import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization of Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Recovery Engine Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// AI Diagnosis Endpoint
app.post('/api/diagnose', async (req, res) => {
  try {
    const { caseData, merchantCustomKey } = req.body;
    if (!caseData) {
      return res.status(400).json({ error: 'Missing caseData in request body' });
    }

    const ai = getGeminiClient(merchantCustomKey);
    
    if (ai) {
      try {
        const prompt = `You are the core diagnostic engine for Recovery, a bounded AI revenue recovery platform for merchants.
Analyze the following payment or invoice failure:
- Customer: ${caseData.customerName} (${caseData.companyName || 'Individual'})
- Amount: ₹${caseData.amount}
- Issue: ${caseData.issue}
- Failure Reason: ${caseData.failureReason} (${caseData.failureCode || 'UNKNOWN'})
- Payment Method: ${caseData.paymentMethod || 'Unknown'}
- Previous Attempt Count: ${caseData.attemptCount || 1}

Merchant Policies:
- Max retries: 2
- Max reminders: 3
- Auto-retry enabled: true
- Escalation threshold: ₹50,000 or >2 failed attempts

Provide a concise, operational JSON response with NO conversational fluff or markdown code fence:
{
  "recommendedAction": "Retry payment" | "Payment link" | "Send reminder" | "Escalate",
  "recoveryProbability": <integer 10-95>,
  "reason": "<2 clear sentences explaining why this action was chosen based on customer history, failure code, and merchant policy>",
  "policyNote": "<1 sentence on compliance with merchant bounds>",
  "policyAllowed": <true/false>
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({
            success: true,
            source: 'gemini-3.7-flash',
            diagnosis: parsed
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to deterministic heuristic rules:', geminiError?.message);
      }
    }

    // High-fidelity fallback heuristic recovery engine if no Gemini API key configured
    let recommendedAction = 'Retry payment';
    let recoveryProbability = 75;
    let reason = 'Temporary communication timeout on issuing bank network. Low chargeback profile with proven previous payments.';
    let policyNote = 'Automatic retry allowed (Policy limit: 2 attempts, cooldown: 6h)';
    let policyAllowed = true;

    const amount = Number(caseData.amount) || 5000;
    const reasonLower = (caseData.failureReason || '').toLowerCase();
    const code = (caseData.failureCode || '').toUpperCase();

    if (code.includes('AUTH') || reasonLower.includes('otp') || reasonLower.includes('3ds')) {
      recommendedAction = 'Payment link';
      recoveryProbability = 65;
      reason = '3DS OTP step timed out. Generating a frictionless 1-click Razorpay payment link directly to customer email & SMS.';
      policyNote = 'Customer communication policy allowed (Reminder 1 of 3)';
    } else if (code.includes('EXPIRED') || reasonLower.includes('expired')) {
      recommendedAction = 'Send reminder';
      recoveryProbability = 82;
      reason = 'Payment method expired. Dispatched secure portal link for customer to enter updated card details.';
      policyNote = 'Autonomous renewal policy compliant';
    } else if (amount >= 50000 || caseData.issue === 'Invoice overdue' || caseData.attemptCount >= 2) {
      recommendedAction = 'Escalate';
      recoveryProbability = 48;
      reason = `Amount (₹${amount.toLocaleString('en-IN')}) or attempt threshold reached. Halting automated retries and alerting finance manager per bounded stopping rules.`;
      policyNote = 'High-risk stopping rule enforced: Merchant manual review required.';
      policyAllowed = false;
    } else if (code.includes('LIMIT') || reasonLower.includes('limit')) {
      recommendedAction = 'Payment link';
      recoveryProbability = 85;
      reason = 'UPI daily limit exceeded on customer bank account. Providing multi-rail payment link (Cards, NetBanking, RTGS).';
      policyNote = 'Alternate payment rail policy active';
    }

    return res.json({
      success: true,
      source: 'rules-engine',
      diagnosis: {
        recommendedAction,
        recoveryProbability,
        reason,
        policyNote,
        policyAllowed
      }
    });
  } catch (error: any) {
    console.error('Diagnosis handler error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate diagnosis' });
  }
});

// Razorpay Action Executor Endpoint
app.post('/api/razorpay/action', async (req, res) => {
  try {
    const { actionType, caseId, amount, customerName, razorpayKeyId, isTestMode } = req.body;

    // Simulate realistic financial gateway latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const simulatedPaymentId = `pay_Nq${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    let resultStatus = 'success';
    let resultMessage = `Successfully executed ${actionType}`;
    let recoveredAmount = 0;

    if (actionType === 'Retry payment') {
      recoveredAmount = amount;
      resultMessage = `Razorpay test charge captured: ${simulatedPaymentId} (₹${amount.toLocaleString('en-IN')})`;
    } else if (actionType === 'Payment link') {
      resultMessage = `Generated payment link: rzp.io/i/${simulatedPaymentId.toLowerCase()}`;
    } else if (actionType === 'Send reminder') {
      resultMessage = `Transactional reminder dispatched via email and WhatsApp payload`;
    } else if (actionType === 'Escalate') {
      resultStatus = 'escalated';
      resultMessage = `Stopping rule enforced. Transferred case to merchant finance queue.`;
    }

    res.json({
      success: true,
      actionType,
      caseId,
      resultStatus,
      resultMessage,
      recoveredAmount,
      simulatedPaymentId,
      gatewayMode: isTestMode !== false ? 'Razorpay Test Mode' : 'Razorpay Live',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Action execution failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Recovery platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
