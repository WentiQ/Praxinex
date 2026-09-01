import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sliders, 
  RotateCcw, 
  Mail, 
  AlertTriangle, 
  Lock, 
  Check,
  Info
} from 'lucide-react';
import { RecoveryPolicy } from '../types';
import { formatINR } from '../utils/formatters';

interface PoliciesViewProps {
  policy: RecoveryPolicy;
  onUpdatePolicy: (updated: RecoveryPolicy) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policy,
  onUpdatePolicy
}) => {
  const [form, setForm] = useState<RecoveryPolicy>(policy);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Keep policy form state in sync with prop updates and resets
  React.useEffect(() => {
    setForm(policy);
  }, [policy]);

  const handleChange = <K extends keyof RecoveryPolicy>(key: K, value: RecoveryPolicy[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdatePolicy(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8" id="policies-page-container">
      {/* Title & Introduction */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Recovery policies</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Control what the agent can do automatically. These bounded guardrails strictly constrain autonomous actions.
          </p>
        </div>

        <button
          id="save-policies-button"
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved successfully</span>
            </>
          ) : (
            <span>Save policy changes</span>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Section 1: Payment recovery */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
            <RotateCcw className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-[#171717]">Payment recovery</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Automatic retry toggle */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Automatic retry</span>
                <span className="text-[#737373] text-[11px]">
                  Allow the AI agent to retry eligible transient payment failures via Razorpay.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRetry}
                  onChange={(e) => handleChange('autoRetry', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>

            {/* Maximum retries */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Maximum retries</span>
                <span className="text-[#737373] text-[11px]">
                  Hard ceiling on automated retry attempts before stopping.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.maxRetries}
                  onChange={(e) => handleChange('maxRetries', Number(e.target.value))}
                  className="w-16 text-center font-mono font-bold bg-[#F8F9FA] border border-[#E7E7E7] rounded-md py-1 text-xs text-neutral-900"
                />
                <span className="text-neutral-500 font-mono text-[11px]">retries</span>
              </div>
            </div>

            {/* Minimum time between retries */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Minimum time between retries</span>
                <span className="text-[#737373] text-[11px]">
                  Cooldown gap to prevent customer bank fatigue or duplicate declines.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={form.retryCooldownHours}
                  onChange={(e) => handleChange('retryCooldownHours', Number(e.target.value))}
                  className="w-16 text-center font-mono font-bold bg-[#F8F9FA] border border-[#E7E7E7] rounded-md py-1 text-xs text-neutral-900"
                />
                <span className="text-neutral-500 font-mono text-[11px]">hours</span>
              </div>
            </div>

            {/* Smart Timing Auto-Execution */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Intelligent Bank Timing Auto-Execution</span>
                <span className="text-[#737373] text-[11px]">
                  Automatically schedules and executes retries when bank success rates are statistically highest (09:00 - 11:30 AM & salary dates).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smartTimingAutoExecute}
                  onChange={(e) => handleChange('smartTimingAutoExecute', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>

            {/* Subscription Mandate Auto-Repair */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-neutral-900 block">Auto Subscription Mandate Repair</span>
                <span className="text-[#737373] text-[11px]">
                  Generates dedicated card mandate repair links for lapsed subscriptions (switches cards without re-subscribing).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoMandateRepairForSubscriptions}
                  onChange={(e) => handleChange('autoMandateRepairForSubscriptions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Customer communication */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
            <Mail className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-[#171717]">Multi-Channel Communication</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Email Channel Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Email Notifications (SMTP)</span>
                <span className="text-[#737373] text-[11px]">
                  Dispatches polite, context-aware recovery emails with 1-click links.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.emailEnabled}
                  onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>

            {/* SMS Channel Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">SMS (DLT Telecom Route)</span>
                <span className="text-[#737373] text-[11px]">
                  Dispatches concise 160-character DLT compliant recovery SMS alerts.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smsEnabled}
                  onChange={(e) => handleChange('smsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>

            {/* Automatic reminders */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Automatic reminders</span>
                <span className="text-[#737373] text-[11px]">
                  Send transactional payment links and renewal reminders.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoReminders}
                  onChange={(e) => handleChange('autoReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>

            {/* Maximum reminders */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Maximum reminders</span>
                <span className="text-[#737373] text-[11px]">
                  Total reminders sent per case before stopping automated contact.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.maxReminders}
                  onChange={(e) => handleChange('maxReminders', Number(e.target.value))}
                  className="w-16 text-center font-mono font-bold bg-[#F8F9FA] border border-[#E7E7E7] rounded-md py-1 text-xs text-neutral-900"
                />
                <span className="text-neutral-500 font-mono text-[11px]">reminders</span>
              </div>
            </div>

            {/* Minimum interval */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-neutral-900 block">Minimum interval</span>
                <span className="text-[#737373] text-[11px]">
                  Time gap between consecutive reminder emails or links.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={6}
                  max={72}
                  value={form.reminderIntervalHours}
                  onChange={(e) => handleChange('reminderIntervalHours', Number(e.target.value))}
                  className="w-16 text-center font-mono font-bold bg-[#F8F9FA] border border-[#E7E7E7] rounded-md py-1 text-xs text-neutral-900"
                />
                <span className="text-neutral-500 font-mono text-[11px]">hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Escalation & High-risk actions */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
            <AlertTriangle className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-[#171717]">Escalation & High-risk actions</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Escalate after failed attempts */}
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <div>
                <span className="font-semibold text-neutral-900 block">Escalate after</span>
                <span className="text-[#737373] text-[11px]">
                  Stop automated agent execution and assign case to human finance team.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={form.escalateAfterFailedAttempts}
                  onChange={(e) => handleChange('escalateAfterFailedAttempts', Number(e.target.value))}
                  className="w-16 text-center font-mono font-bold bg-[#F8F9FA] border border-[#E7E7E7] rounded-md py-1 text-xs text-neutral-900"
                />
                <span className="text-neutral-500 font-mono text-[11px]">failed attempts</span>
              </div>
            </div>

            {/* Require merchant approval for high-risk */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-neutral-900 block">Require merchant approval for high-risk</span>
                <span className="text-[#737373] text-[11px]">
                  Mandates manual authorization for amounts exceeding threshold (e.g. {formatINR(form.highRiskThresholdAmount)}).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireApprovalForHighRisk}
                  onChange={(e) => handleChange('requireApprovalForHighRisk', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#171717]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
