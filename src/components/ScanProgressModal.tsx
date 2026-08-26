import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { RecoveryCase } from '../types';
import { formatINR } from '../utils/formatters';

interface ScanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (recoveredAmount: number, updatedCasesCount: number) => void;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  isOpen,
  onClose,
  onScanComplete
}) => {
  const [step, setStep] = useState<number>(0);
  const [recoveredTotal, setRecoveredTotal] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setRecoveredTotal(0);
      return;
    }

    const t1 = setTimeout(() => {
      setStep(1);
    }, 700);

    const t2 = setTimeout(() => {
      setStep(2);
      setRecoveredTotal(12000);
    }, 1700);

    const t3 = setTimeout(() => {
      setStep(3);
      setRecoveredTotal(20500);
    }, 2800);

    const t4 = setTimeout(() => {
      setStep(4);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDone = step >= 4;

  const handleFinish = () => {
    onScanComplete(20500, 3);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      id="scan-progress-modal-overlay"
    >
      <div 
        className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-neutral-800" />
            <h3 className="text-sm font-semibold text-[#171717]">Autonomous Recovery Scan</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {isDone ? 'Batch Finished' : 'Processing'}
          </span>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          <div className="space-y-3">
            {/* Step 1 */}
            <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
              step >= 1 ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'opacity-40 border-transparent'
            }`}>
              <div className="mt-0.5">
                {step > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : step === 1 ? (
                  <Loader2 className="w-4 h-4 text-neutral-900 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px]">1</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Scanning Razorpay failed event queue...</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Discovered 5 unrecovered payment risks across active merchants.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
              step >= 2 ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'opacity-40 border-transparent'
            }`}>
              <div className="mt-0.5">
                {step > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : step === 2 ? (
                  <Loader2 className="w-4 h-4 text-neutral-900 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px]">2</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Executing bounded retry on Amit Verma (₹12,000)...</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Passed 6h cooldown. Razorpay charge authorized.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
              step >= 3 ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'opacity-40 border-transparent'
            }`}>
              <div className="mt-0.5">
                {step > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : step === 3 ? (
                  <Loader2 className="w-4 h-4 text-neutral-900 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px]">3</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Dispatching payment link to Priya Mehta (₹8,500)...</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Customer authorized via 1-click fallback.</p>
              </div>
            </div>
          </div>

          {/* Recovered Banner */}
          {recoveredTotal > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center animate-fade-in space-y-1">
              <span className="text-[11px] text-emerald-700 block">Batch Revenue Recovered</span>
              <span className="text-xl font-bold text-emerald-900 block font-mono">
                +{formatINR(recoveredTotal)}
              </span>
              <span className="text-[11px] text-emerald-700 block font-sans">
                {isDone ? 'All eligible cases processed and updated' : 'Executing remaining bounded actions...'}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 px-6 bg-[#FAFAFA] border-t border-[#EAEAEA] flex items-center justify-between">
          <span className="text-[11px] text-[#737373] font-mono">
            {isDone ? 'Scan complete' : 'Agent operating...'}
          </span>
          <button
            disabled={!isDone}
            onClick={handleFinish}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              isDone
                ? 'bg-[#171717] text-white hover:bg-neutral-800 shadow-2xs cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            Apply & View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
