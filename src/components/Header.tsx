import React from 'react';
import { 
  Play, 
  PlusCircle, 
  Calendar, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  User
} from 'lucide-react';
import { MerchantProfile } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  isScanning: boolean;
  onRunScan: () => void;
  onSimulateFailure: () => void;
  merchant: MerchantProfile;
  dateRange: string;
  setDateRange: (range: string) => void;
  onOpenPraxinex?: () => void;
  user?: any | null;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isScanning,
  onRunScan,
  onSimulateFailure,
  merchant,
  dateRange,
  setDateRange,
  onOpenPraxinex,
  user,
  onOpenAuth
}) => {
  return (
    <header 
      id="main-app-header"
      className="h-16 px-8 border-b border-[#E7E7E7] bg-white flex items-center justify-between sticky top-0 z-10"
    >
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-semibold text-[#171717] tracking-tight">{title}</h1>
        <p className="text-xs text-[#737373]">{subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Environment status indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-[11px] font-mono text-neutral-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Razorpay: {merchant.isTestMode ? 'Test Mode' : 'Live'}</span>
        </div>

        {/* Date range selector */}
        <div className="relative">
          <select
            id="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none bg-white border border-[#E7E7E7] hover:border-neutral-400 text-xs text-[#171717] font-medium py-1.5 pl-3 pr-7 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors"
          >
            <option value="today">Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          <Calendar className="w-3.5 h-3.5 text-[#737373] absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* Ask Praxinex AI Button */}
        {onOpenPraxinex && (
          <button
            id="ask-praxinex-header-btn"
            onClick={onOpenPraxinex}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-all shadow-2xs cursor-pointer group"
            title="Open Praxinex AI Assistant (Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Ask Praxinex</span>
            <span className="hidden lg:inline text-[10px] font-mono text-emerald-700 bg-white/70 px-1 py-0.2 rounded border border-emerald-200">
              ⌘K
            </span>
          </button>
        )}

        {/* Simulate Payment Failure Button (For interactive demo) */}
        <button
          id="simulate-risk-button"
          onClick={onSimulateFailure}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-[#E7E7E7] hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
          title="Inject a test failure event into the system"
        >
          <PlusCircle className="w-3.5 h-3.5 text-neutral-500" />
          <span>Simulate failure</span>
        </button>

        {/* Run Recovery Scan Primary Button */}
        <button
          id="run-recovery-scan-button"
          onClick={onRunScan}
          disabled={isScanning}
          className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium text-white rounded-md shadow-xs transition-all ${
            isScanning
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-[#171717] hover:bg-neutral-800 active:scale-[0.98]'
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning queue...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Run recovery scan</span>
            </>
          )}
        </button>

        {/* User Account / Google Sign-in Button */}
        {onOpenAuth && (
          <button
            id="auth-header-button"
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
            title={user ? `Signed in as ${user.email}` : "Sign in / Connect Google Account"}
          >
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-4 h-4 rounded-full"
              />
            ) : user ? (
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {user.email?.[0]?.toUpperCase()}
              </div>
            ) : (
              <User className="w-3.5 h-3.5 text-neutral-600" />
            )}
            <span className="max-w-[100px] truncate hidden sm:inline text-[11px]">
              {user ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : 'Sign In'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
