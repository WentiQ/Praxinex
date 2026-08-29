import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  PlusCircle, 
  CreditCard, 
  Building, 
  Sparkles,
  Play,
  Zap,
  Radio,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sliders,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { RecoveryCase, IssueType, MerchantProfile } from '../types';
import firstNames from '../../data/first_names.json';
import lastNames from '../../data/last_names.json';

const getRandomDatasetCustomer = () => {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)] || 'Aarav';
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)] || 'Sharma';
  return {
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}${ln.toLowerCase()}@gmail.com`,
    company: `${ln} Tech`,
    phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`
  };
};

interface RazorpayPlan {
  id: string;
  name: string;
  description: string;
  amount: number;       // paise
  amountINR: number;    // rupees
  currency: string;
  period: string;
  interval: number;
  periodLabel: string;
}

interface SimulateFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (newCase: RecoveryCase) => void;
  merchant?: MerchantProfile;
  onSync?: () => Promise<void>;
}

export const SimulateFailureModal: React.FC<SimulateFailureModalProps> = ({
  isOpen,
  onClose,
  onAddCase,
  merchant,
  onSync
}) => {
  const [tab, setTab] = useState<'quick' | 'custom' | 'auto'>('quick');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastCreatedCase, setLastCreatedCase] = useState<RecoveryCase | null>(null);

  // Dynamic Custom Form States initialized from 2500x2500 Dataset
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState<number>(18500);
  const [issue, setIssue] = useState<IssueType>('Payment failed');
  const [failureReason, setFailureReason] = useState('Bank switch network timeout during 3DS OTP authorization');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay Gateway (UPI / Cards / Netbanking)');

  // Razorpay Subscription Plans
  const [razorpayPlans, setRazorpayPlans] = useState<RazorpayPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string>('');

  const fetchRazorpayPlans = async () => {
    setIsLoadingPlans(true);
    setPlansError('');
    try {
      const kId = merchant?.razorpayKeyId || '';
      const kSec = merchant?.razorpayKeySecret || '';
      const params = new URLSearchParams();
      if (kId) params.append('keyId', kId);
      if (kSec) params.append('keySecret', kSec);

      const res = await fetch(`/api/razorpay/plans?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.plans) && data.plans.length > 0) {
        setRazorpayPlans(data.plans);
        // Auto-select first plan and set amount
        const first = data.plans[0];
        setSelectedPlanId(first.id);
        setAmount(first.amountINR);
        setPlansError('');
      } else if (data?.success && Array.isArray(data.plans) && data.plans.length === 0) {
        setRazorpayPlans([]);
        setPlansError('No subscription plans found in your Razorpay account. Create one at dashboard.razorpay.com/app/subscriptions/plans');
      } else {
        setRazorpayPlans([]);
        setPlansError(data?.error || 'Could not load plans from Razorpay');
      }
    } catch (err: any) {
      console.warn('Plan fetch error:', err);
      setRazorpayPlans([]);
      setPlansError('Failed to connect to Razorpay plans API. Please verify server status.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleIssueChange = (newIssue: IssueType) => {
    setIssue(newIssue);
    if (newIssue === 'Subscription lapsed') {
      setFailureReason('Recurring auto-debit charge rejected by bank (e-mandate / card expired)');
      setPaymentMethod('Razorpay Recurring Autopay (e-Mandate / Cards)');
      // Fetch real plans from Razorpay — amount will be set from selected plan
      fetchRazorpayPlans();
    } else if (newIssue === 'Invoice overdue') {
      setFailureReason('Net-30 corporate invoice overdue past scheduled settlement window');
      setPaymentMethod('Razorpay Invoice Portal');
      setAmount(85000);
      setRazorpayPlans([]);
      setSelectedPlanId('');
    } else if (newIssue === 'Checkout abandoned') {
      setFailureReason('Customer initiated cart checkout but exited before completing 3DS authorization');
      setPaymentMethod('Razorpay Dynamic Rail');
      setAmount(24500);
      setRazorpayPlans([]);
      setSelectedPlanId('');
    } else {
      setFailureReason('Bank switch network timeout during 3DS OTP authorization');
      setPaymentMethod('Razorpay Gateway (UPI / Cards / Netbanking)');
      setAmount(18500);
      setRazorpayPlans([]);
      setSelectedPlanId('');
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = razorpayPlans.find(p => p.id === planId);
    if (plan) {
      setAmount(plan.amountINR);
    }
  };

  const randomizeCustomCustomer = () => {
    const p = getRandomDatasetCustomer();
    setCustomerName(p.name);
    setCustomerEmail(p.email);
    setCustomerPhone(p.phone);
    setCompanyName(p.company);
  };

  useEffect(() => {
    if (isOpen && !customerName) {
      randomizeCustomCustomer();
    }
  }, [isOpen]);

  // Auto Traffic Engine States
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [maxDailyCases, setMaxDailyCases] = useState<number>(100);
  const [targetCasesToday, setTargetCasesToday] = useState<number>(80);
  const [generatedToday, setGeneratedToday] = useState<number>(0);
  const [pacingMode, setPacingMode] = useState<'random_daily' | 'fast_demo'>('fast_demo');
  const [totalGeneratedAllTime, setTotalGeneratedAllTime] = useState<number>(0);
  const [nextScheduledAt, setNextScheduledAt] = useState<string>('');

  // Poll status when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const fetchStatus = () => {
      fetch('/api/simulate/status')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.autoTrafficState) {
            setIsAutoRunning(data.autoTrafficState.isRunning);
            setMaxDailyCases(data.autoTrafficState.maxDailyCases || 100);
            setTargetCasesToday(data.autoTrafficState.targetCasesToday || 80);
            setGeneratedToday(data.autoTrafficState.generatedToday || 0);
            setPacingMode(data.autoTrafficState.pacingMode || 'fast_demo');
            setTotalGeneratedAllTime(data.autoTrafficState.totalGeneratedAllTime || 0);
            setNextScheduledAt(data.autoTrafficState.nextScheduledAt || '');
          }
        })
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // 1-Click Instant Live Razorpay Case Generation
  const handleQuickGenerate = async (preset?: any) => {
    setIsGenerating(true);
    setLastCreatedCase(null);
    try {
      const res = await fetch('/api/simulate/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customData: preset || undefined,
          razorpayKeyId: merchant?.razorpayKeyId,
          razorpayKeySecret: merchant?.razorpayKeySecret
        })
      });
      const data = await res.json();
      if (data.success && data.case) {
        setLastCreatedCase(data.case);
        onAddCase(data.case);
        // NOTE: Do NOT call onSync() here — it would overwrite the newly added case
        // before Supabase persistence completes. The 30s heartbeat will sync it later.
      }
    } catch (err) {
      console.error('Failed to generate live Razorpay simulation:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom Form Submission
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLastCreatedCase(null);
    try {
      const customData = {
        customerName,
        customerEmail,
        customerPhone,
        companyName,
        amount: Number(amount) || 5000,
        issue,
        failureReason,
        paymentMethod,
        planId: issue === 'Subscription lapsed' ? selectedPlanId : undefined
      };

      const res = await fetch('/api/simulate/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customData,
          razorpayKeyId: merchant?.razorpayKeyId,
          razorpayKeySecret: merchant?.razorpayKeySecret
        })
      });
      const data = await res.json();
      if (data.success && data.case) {
        setLastCreatedCase(data.case);
        onAddCase(data.case);
        // NOTE: Do NOT call onSync() here — it would overwrite the newly added case
        // before Supabase persistence completes. The 30s heartbeat will sync it later.
      }
    } catch (err) {
      console.error('Failed to create custom simulation:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle / Configure Background Auto-Traffic Engine
  const handleToggleAutoTraffic = async (enable: boolean) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/simulate/auto-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable,
          maxDailyCases: Number(maxDailyCases) || 100,
          pacingMode,
          razorpayKeyId: merchant?.razorpayKeyId,
          razorpayKeySecret: merchant?.razorpayKeySecret
        })
      });
      const data = await res.json();
      if (data.success && data.autoTrafficState) {
        setIsAutoRunning(data.autoTrafficState.isRunning);
        setMaxDailyCases(data.autoTrafficState.maxDailyCases);
        setTargetCasesToday(data.autoTrafficState.targetCasesToday);
        setGeneratedToday(data.autoTrafficState.generatedToday);
        setPacingMode(data.autoTrafficState.pacingMode);
        setTotalGeneratedAllTime(data.autoTrafficState.totalGeneratedAllTime);
        setNextScheduledAt(data.autoTrafficState.nextScheduledAt);
        if (onSync) onSync();
      }
    } catch (err) {
      console.error('Failed to toggle auto traffic:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="simulate-failure-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAEAEA] flex items-center justify-between bg-neutral-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#171717]">Live Payment Traffic & Simulator</h3>
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Simulates cart checkouts using <span className="font-semibold text-neutral-800">2,500 First Names × 2,500 Last Names</span>, generates 1st Payment Links, and tracks until Payment Done.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 border-b border-[#EAEAEA] flex space-x-4 text-xs font-medium bg-white">
          <button
            onClick={() => setTab('quick')}
            className={`pb-2.5 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              tab === 'quick'
                ? 'border-b-2 border-neutral-900 text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Presets</span>
          </button>

          <button
            onClick={() => setTab('auto')}
            className={`pb-2.5 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              tab === 'auto'
                ? 'border-b-2 border-neutral-900 text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Autonomous Engine</span>
            {isAutoRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`pb-2.5 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              tab === 'custom'
                ? 'border-b-2 border-neutral-900 text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Case Builder</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Quick Presets Tab */}
          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 flex items-start space-x-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">6.25M Customer Combinations & Real Links:</span> Randomizes 1st & last names from the 2,500 × 2,500 dataset, assigns <span className="font-mono text-[11px]">&lt;firstname&gt;&lt;lastname&gt;@gmail.com</span>, picks multiples of 10 up to ₹10,00,000, and generates the initial payment link to start tracking.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickGenerate({
                    issue: 'Payment failed',
                    amount: 18500,
                    failureReason: 'Bank switch network timeout during 3DS OTP authorization',
                    product: 'Enterprise API Gateway'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900 group-hover:text-black">💳 Payment Failed (₹18,500)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">Card/UPI Timeout</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Standard transaction failure with automated 1-click retry payment link dispatch.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    issue: 'Invoice overdue',
                    amount: 85000,
                    failureReason: 'Net-30 corporate invoice overdue past scheduled settlement window',
                    product: 'Autonomous Cluster Annual License'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">📄 Invoice Overdue (₹85,000)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">B2B Net-30</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Overdue milestone invoice on Razorpay with automated invoice settlement link.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    amount: 12000,
                    issue: 'Subscription lapsed',
                    failureReason: 'Recurring auto-debit charge rejected by bank (e-mandate / card expired)',
                    product: 'SaaS Platform Pro Monthly'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">🔄 Subscription Lapsed (₹12,000)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">Autopay Failed</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Recurring auto-debit mandate dropped. 1-click update link dispatched.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    amount: 24500,
                    issue: 'Checkout abandoned',
                    failureReason: 'Customer initiated cart checkout but exited before completing 3DS authorization',
                    product: 'Cloud Compute Instance Monthly'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">🛒 Cart Abandoned (₹24,500)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">Drop-off</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Checkout initiated $\rightarrow$ drop-off detected $\rightarrow$ AI recovery dispatched.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Autonomous Engine Tab */}
          {tab === 'auto' && (
            <div className="space-y-5">
              {/* Engine Status & Control Card */}
              <div className="bg-neutral-900 text-white rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${isAutoRunning ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20' : 'bg-neutral-500'}`}></div>
                    <div>
                      <h4 className="text-xs font-semibold">Autonomous Traffic Engine</h4>
                      <p className="text-[11px] text-neutral-400">
                        {isAutoRunning ? 'Engine ACTIVE: Dispatching real Razorpay cases on randomized timings' : 'Engine IDLE'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleAutoTraffic(!isAutoRunning)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                      isAutoRunning
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold'
                    }`}
                  >
                    {isAutoRunning ? 'Stop Engine' : 'Start Auto-Traffic'}
                  </button>
                </div>

                {/* Daily Quota Progress Bar */}
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">Today's Random Target Progress:</span>
                    <span className="font-mono text-xs text-white">
                      <strong className="text-emerald-400">{generatedToday}</strong> / {targetCasesToday} cases
                      <span className="text-neutral-400 text-[10px] ml-1.5 font-normal">(Max limit: {maxDailyCases})</span>
                    </span>
                  </div>
                  
                  {/* Progress track */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((generatedToday / (targetCasesToday || 1)) * 100))}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Target Range: {Math.round(maxDailyCases * 0.6)} – {maxDailyCases} cases</span>
                    <span>Remaining Today: {Math.max(0, targetCasesToday - generatedToday)}</span>
                  </div>
                </div>
              </div>

              {/* User Configuration Form */}
              <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                  Daily Traffic Budget & Random Timings Setup
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Max Cases Per Day Input */}
                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Max Cases Per Day
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1000}
                      value={maxDailyCases}
                      onChange={(e) => setMaxDailyCases(Math.max(1, Number(e.target.value)))}
                      disabled={isAutoRunning}
                      placeholder="e.g. 100"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-60"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      For each day, a target between <strong>60% & 100%</strong> ({Math.round(maxDailyCases * 0.6)} - {maxDailyCases} cases) will be randomly selected.
                    </p>
                  </div>

                  {/* Pacing Distribution Mode */}
                  <div>
                    <label className="font-semibold text-neutral-800 block mb-1">
                      Random Timing Distribution
                    </label>
                    <select
                      value={pacingMode}
                      onChange={(e) => setPacingMode(e.target.value as any)}
                      disabled={isAutoRunning}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-60"
                    >
                      <option value="fast_demo">⚡ Interactive Demo (Random bursts: 18s - 65s)</option>
                      <option value="random_daily">🕒 Realistic 24-Hour Pacing (Throughout the day)</option>
                    </select>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Timing between cases is completely randomized and unpredictable.
                    </p>
                  </div>
                </div>

                {/* Bounded Safety Guarantee Alert */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-start space-x-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-900">
                    <strong className="block font-semibold">Strict Ceiling Guardrail</strong>
                    Total cases generated in any 24-hour cycle will strictly remain <strong>&le; {maxDailyCases} cases</strong>. Once today's target is fulfilled, generation automatically pauses until the next calendar day.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Form Tab */}
          {tab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-neutral-100/70 p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[11px] text-neutral-600">
                  Pick a random customer dynamically from the <strong>2,500 First × 2,500 Last Names</strong> dataset:
                </span>
                <button
                  type="button"
                  onClick={randomizeCustomCustomer}
                  className="px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 rounded text-[11px] font-medium text-neutral-800 transition-colors flex items-center space-x-1 cursor-pointer shrink-0 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Randomize Pair</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Issue Category</label>
                  <select
                    value={issue}
                    onChange={(e) => handleIssueChange(e.target.value as IssueType)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="Payment failed">💳 Payment failed (Card / UPI / Netbanking)</option>
                    <option value="Invoice overdue">📄 Invoice overdue (B2B Net-30 / Milestone)</option>
                    <option value="Subscription lapsed">🔄 Subscription lapsed (Recurring Autopay)</option>
                    <option value="Checkout abandoned">🛒 Checkout abandoned (Cart drop-off)</option>
                  </select>
                </div>

                <div>
                  {issue === 'Subscription lapsed' ? (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-neutral-800">Razorpay Plan</label>
                        <button
                          type="button"
                          onClick={fetchRazorpayPlans}
                          disabled={isLoadingPlans}
                          className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-800 transition-colors"
                          title="Reload plans from Razorpay"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingPlans ? 'animate-spin' : ''}`} />
                          Reload
                        </button>
                      </div>
                      {isLoadingPlans ? (
                        <div className="w-full flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-500 text-sm">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Fetching plans from Razorpay...</span>
                        </div>
                      ) : plansError ? (
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-[11px]">
                          {plansError}
                        </div>
                      ) : razorpayPlans.length > 0 ? (
                        <select
                          value={selectedPlanId}
                          onChange={(e) => handlePlanSelect(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        >
                          {razorpayPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} — ₹{plan.amountINR.toLocaleString('en-IN')}/{plan.periodLabel}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-400 text-sm italic">
                          Select issue to load plans
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="font-semibold text-neutral-800 block mb-1">Amount at Risk (₹)</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Show amount read-only when plan selected */}
              {issue === 'Subscription lapsed' && razorpayPlans.length > 0 && (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Plan amount auto-filled: <strong>₹{amount.toLocaleString('en-IN')}</strong> — this is the exact amount charged by Razorpay for this plan.</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">Failure Reason / Context</label>
                <input
                  type="text"
                  required
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-neutral-900 hover:bg-black text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating on Razorpay API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Generate Case & Create on Razorpay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Success Banner if Case Created */}
          {lastCreatedCase && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Case {lastCreatedCase.id} Successfully Generated on Razorpay!</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                  {lastCreatedCase.status}
                </span>
              </div>

              <p className="text-[11px] text-emerald-700">
                Created for <span className="font-semibold">{lastCreatedCase.customerName}</span> ({lastCreatedCase.companyName}) for <span className="font-bold font-mono">₹{lastCreatedCase.amount.toLocaleString('en-IN')}</span>.
              </p>

              {lastCreatedCase.paymentLinkUrl && (
                <div className="pt-1 flex items-center space-x-2">
                  <a
                    href={lastCreatedCase.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-mono font-medium text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <span>Open Official Link</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Ref ID: {lastCreatedCase.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAEAEA] bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Razorpay Test & Live Sync Mode Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
