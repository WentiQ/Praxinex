import React from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  CreditCard, 
  Users, 
  Activity, 
  BarChart3, 
  Sliders, 
  Cpu, 
  Settings,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  Calendar,
  PlusCircle
} from 'lucide-react';
import { MerchantProfile } from '../types';

export type NavigationTab = 
  | 'overview' 
  | 'praxinex'
  | 'cases' 
  | 'scheduled'
  | 'payments' 
  | 'customers' 
  | 'activity' 
  | 'analytics' 
  | 'policies' 
  | 'integrations' 
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeCaseCount: number;
  scheduledCount?: number;
  merchant: MerchantProfile;
  onOpenSettings: () => void;
  onOpenPraxinexCopilot?: () => void;
  user?: any | null;
  onOpenAuth?: () => void;
  dateRange?: string;
  setDateRange?: (range: string) => void;
  onSimulateFailure?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeCaseCount,
  scheduledCount = 0,
  merchant,
  onOpenSettings,
  onOpenPraxinexCopilot,
  user,
  onOpenAuth,
  dateRange,
  setDateRange,
  onSimulateFailure
}) => {
  const navItems = [
    { id: 'overview' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'praxinex' as NavigationTab, label: 'Praxinex AI', icon: Sparkles, isAi: true },
    { id: 'cases' as NavigationTab, label: 'Recovery Cases', icon: ShieldAlert, badge: activeCaseCount },
    { id: 'scheduled' as NavigationTab, label: 'Scheduled Actions', icon: Clock, badge: scheduledCount, isScheduled: true },
    { id: 'payments' as NavigationTab, label: 'Payments', icon: CreditCard },
    { id: 'customers' as NavigationTab, label: 'Customers', icon: Users },
    { id: 'activity' as NavigationTab, label: 'Activity', icon: Activity },
    { id: 'analytics' as NavigationTab, label: 'Analytics', icon: BarChart3 },
    { id: 'policies' as NavigationTab, label: 'Policies', icon: Sliders },
    { id: 'integrations' as NavigationTab, label: 'Integrations', icon: Cpu },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      id="sidebar-container"
      className="w-64 flex-shrink-0 bg-white border-r border-[#E7E7E7] flex flex-col justify-between h-screen sticky top-0 select-none z-20"
    >
      {/* Top section */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#EAEAEA]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-sm tracking-tight text-[#171717]">Praxinex</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                  AI Ops
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">Autonomous Engine</p>
            </div>
          </div>
        </div>

        {/* Controls: Date Range & Live Simulator */}
        <div className="px-3 py-2.5 space-y-2 border-b border-[#EAEAEA]">
          {/* Date Range Selector */}
          {setDateRange && (
            <div className="relative">
              <select
                id="sidebar-date-range-select"
                value={dateRange || 'today'}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E7E7E7] hover:border-neutral-400 hover:bg-neutral-50 text-xs text-[#171717] font-medium py-1.5 pl-2.5 pr-7 rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-colors shadow-2xs"
              >
                <option value="today">Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#737373] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          {/* Simulate Live Traffic Button */}
          {onSimulateFailure && (
            <button
              id="sidebar-simulate-risk-button"
              onClick={onSimulateFailure}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 text-xs font-medium text-neutral-800 bg-white border border-[#E7E7E7] hover:border-neutral-400 hover:bg-neutral-50 rounded-md transition-all cursor-pointer shadow-2xs group"
              title="Open Live Razorpay Traffic & Failure Simulator"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-90 transition-transform" />
              <span>Simulate Live Traffic</span>
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-0.5" id="sidebar-navigation">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#171717] text-white shadow-xs'
                    : item.isAi
                    ? 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60'
                    : 'text-[#525252] hover:text-[#171717] hover:bg-[#F4F4F5]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAi ? 'text-emerald-600' : 'text-[#737373]'}`} />
                  <span className={item.isAi && !isActive ? 'font-semibold text-emerald-900' : ''}>{item.label}</span>
                </div>
                {item.isAi && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-600 text-white'
                  }`}>
                    COPILOT
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200'
                        : (item as any).isScheduled
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Merchant / User Account Info */}
      <div className="p-3 border-t border-[#EAEAEA]">
        <button
          id="merchant-profile-trigger"
          onClick={onOpenAuth || onOpenSettings}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F4F5] transition-colors text-left group cursor-pointer"
          title={user ? `Signed in as ${user.email}` : "Click to Sign In / Manage Account"}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-7 h-7 rounded-md object-cover flex-shrink-0 border border-neutral-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                {(user?.email?.[0] || merchant.name.charAt(0)).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#171717] truncate">
                {user ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : merchant.name}
              </p>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-[#737373] truncate font-mono">
                  {user ? 'Cloud Synced' : (merchant.isTestMode ? 'Razorpay Test' : 'Razorpay Live')}
                </p>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A3A3A3] group-hover:text-[#171717] flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
};
