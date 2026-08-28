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
  ShieldCheck
} from 'lucide-react';
import { RecoveryCase, IssueType, MerchantProfile } from '../types';

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

  // Custom Form States
  const [customerName, setCustomerName] = useState('Ananya Sharma');
  const [customerEmail, setCustomerEmail] = useState('ananya.sharma@sharmaai.in');
  const [customerPhone, setCustomerPhone] = useState('+919845678901');
  const [companyName, setCompanyName] = useState('Sharma AI Solutions');
  const [amount, setAmount] = useState<number>(14500);
  const [issue, setIssue] = useState<IssueType>('Payment failed');
  const [failureReason, setFailureReason] = useState('Bank switch network timeout on corporate debit card');
  const [paymentMethod, setPaymentMethod] = useState('Axis Bank Corporate Visa ••5501');

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
        if (onSync) onSync();
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
        paymentMethod
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
        if (onSync) onSync();
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
              Simulates realistic failed transactions strictly generated on <span className="font-semibold text-neutral-800">Razorpay API</span> with real checkout links.
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
                  <span className="font-semibold">Razorpay REST API Integration Active:</span> Each simulation creates genuine Razorpay Payment Links and orders via <span className="font-mono text-[11px]">POST /v1/payment_links</span> that immediately appear in your Razorpay Dashboard.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickGenerate()}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900 group-hover:text-black">⚡ Random Persona (₹2k - ₹95k)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">Auto Pick</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Randomizes Indian buyer persona, reason, and amount with live Razorpay link generation.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    name: 'Rohan Verma',
                    company: 'Verma Cloud Logistics',
                    email: 'rohan.verma@vermacloud.in',
                    phone: '+919876543210',
                    amount: 14500,
                    issue: 'Payment failed',
                    reason: 'Bank switch network timeout on corporate debit card',
                    product: 'Cloud Logistics Engine Monthly'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">Rohan Verma (₹14,500)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">Card Timeout</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Verma Cloud Logistics • Corporate Visa decline with autonomous link dispatch.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    name: 'Priya Nair',
                    company: 'Kochi Analytics Labs',
                    email: 'priya.nair@kochianalytics.io',
                    phone: '+919823456789',
                    amount: 48000,
                    issue: 'Invoice overdue',
                    reason: 'Net-15 settlement window elapsed without capture',
                    product: 'Analytics Enterprise Platform Q3'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">Priya Nair (₹48,000)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">Net-15 Overdue</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Kochi Analytics Labs • Enterprise Net-15 overdue invoice requiring AI review.
                  </p>
                </button>

                <button
                  onClick={() => handleQuickGenerate({
                    name: 'Vikram Mehra',
                    company: 'Mehra Industrial Robotics',
                    email: 'vikram.mehra@mehra-robotics.com',
                    phone: '+919834567890',
                    amount: 95000,
                    issue: 'Payment failed',
                    reason: '3DS OTP step timed out on international purchasing card',
                    product: 'Industrial Robot Brain SDK License'
                  })}
                  disabled={isGenerating}
                  className="p-4 border border-neutral-200 hover:border-neutral-900 rounded-xl text-left transition-all hover:shadow-xs bg-white hover:bg-neutral-50/50 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-neutral-900">Vikram Mehra (₹95,000)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">High Risk (₹95k)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Mehra Industrial Robotics • High ticket 3DS OTP timeout with bounded escalation policy.
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
                  <label className="font-semibold text-neutral-800 block mb-1">Amount at Risk (₹)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-800 block mb-1">Issue Category</label>
                  <select
                    value={issue}
                    onChange={(e) => setIssue(e.target.value as IssueType)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="Payment failed">Payment failed (Card / UPI / Netbanking)</option>
                    <option value="Invoice overdue">Invoice overdue (Net-30 / Milestone)</option>
                    <option value="Payment link active">Payment link active (Checkout pending)</option>
                  </select>
                </div>
              </div>

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
                    <span>View Razorpay Link</span>
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
