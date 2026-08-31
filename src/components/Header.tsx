import React from 'react';
import { 
  PlusCircle, 
  Calendar, 
  User
} from 'lucide-react';
import { MerchantProfile } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  isScanning?: boolean;
  onRunScan?: () => void;
  onSimulateFailure: () => void;
  merchant?: MerchantProfile;
  dateRange: string;
  setDateRange: (range: string) => void;
  onOpenPraxinex?: () => void;
  user?: any | null;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onSimulateFailure,
  dateRange,
  setDateRange,
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

        {/* Simulate Payment Traffic & Live Razorpay Generator */}
        <button
          id="simulate-risk-button"
          onClick={onSimulateFailure}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-white border border-[#E7E7E7] hover:border-neutral-400 hover:bg-neutral-50 rounded-md transition-all cursor-pointer shadow-2xs group"
          title="Open Live Razorpay Traffic & Failure Simulator"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-90 transition-transform" />
          <span>Simulate Live Traffic</span>
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

