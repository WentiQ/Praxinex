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
  Layers
} from 'lucide-react';
import { MerchantProfile } from '../types';

export type NavigationTab = 
  | 'overview' 
  | 'cases' 
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
  merchant: MerchantProfile;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeCaseCount,
  merchant,
  onOpenSettings,
}) => {
  const navItems = [
    { id: 'overview' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'cases' as NavigationTab, label: 'Recovery Cases', icon: ShieldAlert, badge: activeCaseCount },
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
                <span className="font-semibold text-sm tracking-tight text-[#171717]">Recovery</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                  AI Ops
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">Autonomous Engine</p>
            </div>
          </div>
        </div>

        {/* Live Agent Status Widget */}
        <div className="px-3 py-3 border-b border-[#EAEAEA]">
          <div className="bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-[11px] font-medium text-[#171717]">Agent Status</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#737373] leading-snug">
              Monitoring Razorpay webhooks & bounded recovery policies.
            </p>
          </div>
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
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#171717] hover:bg-[#F4F4F5]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#737373]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200'
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

      {/* Bottom Merchant Account Info */}
      <div className="p-3 border-t border-[#EAEAEA]">
        <button
          id="merchant-profile-trigger"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F4F5] transition-colors text-left group"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
              {merchant.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#171717] truncate">{merchant.name}</p>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-[#737373] truncate font-mono">
                  {merchant.isTestMode ? 'Razorpay Test' : 'Razorpay Live'}
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
