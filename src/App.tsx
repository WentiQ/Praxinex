import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { RecoveryCasesView } from './components/RecoveryCasesView';
import { PaymentsView } from './components/PaymentsView';
import { CustomersView } from './components/CustomersView';
import { ActivityView } from './components/ActivityView';
import { AnalyticsView } from './components/AnalyticsView';
import { PoliciesView } from './components/PoliciesView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { PraxinexView } from './components/PraxinexView';
import { PraxinexChat } from './components/PraxinexChat';
import { CaseDetailModal } from './components/CaseDetailModal';
import { ActionExecutionModal } from './components/ActionExecutionModal';
import { SimulateFailureModal } from './components/SimulateFailureModal';
import { ScanProgressModal } from './components/ScanProgressModal';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import { Sparkles } from 'lucide-react';
import { 
  INITIAL_CASES, 
  INITIAL_ACTIVITIES, 
  INITIAL_MERCHANT, 
  INITIAL_POLICIES, 
  PAYMENT_LEDGER, 
  CUSTOMER_DIRECTORY
} from './data/mockData';
import { RecoveryCase, ActivityEvent, MerchantProfile, RecoveryPolicy, PaymentRecord, CustomerRecord, ActiveTab } from './types';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [dateRange, setDateRange] = useState<string>('today');

  // Supabase Authentication State
  const [user, setUser] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Core Data
  const [cases, setCases] = useState<RecoveryCase[]>(INITIAL_CASES);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [merchant, setMerchant] = useState<MerchantProfile>(() => {
    try {
      const saved = localStorage.getItem('recovery_merchant_profile');
      if (saved) return { ...INITIAL_MERCHANT, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_MERCHANT;
  });

  const handleUpdateMerchant = (updated: MerchantProfile) => {
    setMerchant(updated);
    try {
      localStorage.setItem('recovery_merchant_profile', JSON.stringify(updated));
      fetch('/api/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
    } catch {}
  };

  const [policies, setPolicies] = useState<RecoveryPolicy>(() => {
    try {
      const saved = localStorage.getItem('recovery_policies_data');
      if (saved) return { ...INITIAL_POLICIES, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_POLICIES;
  });

  const handleUpdatePolicies = (updated: RecoveryPolicy) => {
    setPolicies(updated);
    try {
      localStorage.setItem('recovery_policies_data', JSON.stringify(updated));
      fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    // Load merchant settings from database
    fetch('/api/merchant')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.profile) {
          setMerchant(prev => ({ ...prev, ...data.profile }));
        }
      })
      .catch(() => {});

    // Load policies from database
    fetch('/api/policies')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.policies) {
          setPolicies(prev => ({ ...prev, ...data.policies }));
        }
      })
      .catch(() => {});

    // Load cases from shared database
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.cases) && data.cases.length > 0) {
          setCases(data.cases);
        }
      })
      .catch(() => {});

    // Load activities from shared database
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.activities) && data.activities.length > 0) {
          setActivities(data.activities);
        }
      })
      .catch(() => {});
  }, []);

  const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENT_LEDGER);
  const [syncedCustomers, setSyncedCustomers] = useState<CustomerRecord[]>([]);

  // Dynamically calculate and update Customers in real-time from all cases and payments
  const customers: CustomerRecord[] = useMemo(() => {
    const map = new Map<string, CustomerRecord>();

    // 1. Initial base customers
    CUSTOMER_DIRECTORY.forEach(c => {
      map.set(c.email.toLowerCase(), { ...c });
    });

    // 2. Synced customers from Razorpay
    syncedCustomers.forEach(c => {
      const email = (c.email || '').toLowerCase().trim();
      if (!email) return;
      map.set(email, { ...c });
    });

    // 3. Dynamic Aggregation from all live cases
    cases.forEach(cs => {
      if (!cs || !cs.customerEmail) return;
      const email = cs.customerEmail.toLowerCase().trim();
      const existing = map.get(email) || {
        id: `cust_${cs.id}`,
        name: cs.customerName || 'Customer',
        email: cs.customerEmail || 'finance@merchant.in',
        phone: cs.customerPhone || '+91 98765 43210',
        totalSpent: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        recoveredTransactions: 0,
        lifetimeValue: 0,
        riskCategory: 'Low Risk',
        lastSeen: cs.updated || 'Just now'
      };

      const caseAmount = Number(cs.amount) || 0;
      const recAmount = Number(cs.recoveredAmount) || caseAmount;

      if (cs.status === 'Recovered') {
        existing.recoveredTransactions += 1;
        existing.successfulTransactions += 1;
        existing.totalSpent += recAmount;
        existing.lifetimeValue += recAmount;
      } else {
        existing.failedTransactions += 1;
        existing.lifetimeValue += caseAmount;
        if (cs.risk === 'High') existing.riskCategory = 'High Risk';
        else if (cs.risk === 'Medium' && existing.riskCategory !== 'High Risk') existing.riskCategory = 'Medium Risk';
      }

      existing.lastSeen = cs.updated || 'Just now';
      map.set(email, existing);
    });

    // 4. Update from payments
    payments.forEach(p => {
      if (!p || !p.customerEmail) return;
      const email = p.customerEmail.toLowerCase().trim();
      const existing = map.get(email);
      if (existing && p.status === 'succeeded') {
        if (existing.successfulTransactions === 0) existing.successfulTransactions = 1;
        existing.totalSpent = Math.max(existing.totalSpent, Number(p.amount) || 0);
        existing.lifetimeValue = Math.max(existing.lifetimeValue, existing.totalSpent);
      }
    });

    return Array.from(map.values());
  }, [cases, payments, syncedCustomers]);

  // Dynamic Real-Time Trend Data calculated directly from live cases & settlements
  const trendData = useMemo(() => {
    const activeAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
    const totalRecovered = cases
      .filter(c => c.status === 'Recovered')
      .reduce((sum, c) => sum + (c.recoveredAmount || c.amount || 0), 0);

    const now = new Date();
    const points = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const factor = i === 0 ? 1 : 0.45 + ((6 - i) * 0.09);
      points.push({
        date: label,
        revenueAtRisk: i === 0 ? activeAtRisk : Math.round(activeAtRisk * factor),
        recovered: i === 0 ? totalRecovered : Math.round(totalRecovered * (factor * 0.9)),
        remaining: i === 0 ? activeAtRisk : Math.round(activeAtRisk * factor)
      });
    }
    return points;
  }, [cases]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals & Interactive Flow States
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [executingCase, setExecutingCase] = useState<RecoveryCase | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [isPraxinexChatOpen, setIsPraxinexChatOpen] = useState<boolean>(false);

  // Global Keyboard Shortcut (Ctrl+K / Cmd+K) to trigger Praxinex
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPraxinexChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Razorpay Sync Function
  const syncLiveRazorpayData = useCallback(async (quiet = false) => {
    if (!quiet) setIsSyncing(true);
    try {
      const res = await fetch(`/api/razorpay/sync?keyId=${encodeURIComponent(merchant.razorpayKeyId)}&keySecret=${encodeURIComponent(merchant.razorpayKeySecret)}`);
      const data = await res.json();

      if (data.success && data.transformed) {
        const { cases: realCases, customers: realCustomers, payments: realPayments, activities: realActivities } = data.transformed;

        if (realCases && realCases.length > 0) {
          setCases(prev => {
            const casesMap = new Map<string, any>();
            for (const p of prev) {
              if (p && p.id) casesMap.set(p.id, p);
            }
            for (const rc of realCases) {
              if (!rc || !rc.id) continue;
              const existing = casesMap.get(rc.id);
              if (existing) {
                const existingTimelineIds = new Set((existing.timeline || []).map((t: any) => t.id));
                const mergedTimeline = [
                  ...(existing.timeline || []),
                  ...(rc.timeline || []).filter((t: any) => !existingTimelineIds.has(t.id))
                ];
                const isRecovered = rc.status === 'Recovered' || existing.status === 'Recovered';
                casesMap.set(rc.id, {
                  ...existing,
                  ...rc,
                  status: isRecovered ? 'Recovered' : rc.status,
                  recommendedAction: isRecovered ? 'None (Recovered)' : rc.recommendedAction,
                  recoveredAmount: isRecovered ? (rc.recoveredAmount || rc.amount || existing.recoveredAmount) : 0,
                  recoveredAt: isRecovered ? (rc.recoveredAt || existing.recoveredAt || 'Captured') : undefined,
                  timeline: mergedTimeline
                });
              } else {
                casesMap.set(rc.id, rc);
              }
            }
            return Array.from(casesMap.values());
          });

          // Live update selectedCase if open
          setSelectedCase(curr => {
            if (!curr) return null;
            const updated = realCases.find((rc: any) => rc.id === curr.id || (rc.invoiceNumber && rc.invoiceNumber === curr.invoiceNumber));
            if (updated) {
              const existingIds = new Set(curr.timeline.map((t: any) => t.id));
              const mergedTimeline = [
                ...curr.timeline,
                ...updated.timeline.filter((t: any) => !existingIds.has(t.id))
              ];
              const isRecovered = updated.status === 'Recovered' || updated.recommendedAction === 'None (Recovered)' || curr.status === 'Recovered' || Boolean(updated.recoveredAmount && updated.recoveredAmount > 0);
              return {
                ...curr,
                paymentLinkUrl: updated.paymentLinkUrl || curr.paymentLinkUrl,
                razorpayPaymentId: updated.razorpayPaymentId || curr.razorpayPaymentId,
                status: isRecovered ? 'Recovered' : updated.status,
                recommendedAction: isRecovered ? 'None (Recovered)' : updated.recommendedAction,
                recoveredAmount: isRecovered ? (updated.recoveredAmount || updated.amount || curr.recoveredAmount) : 0,
                recoveredAt: isRecovered ? (updated.recoveredAt || curr.recoveredAt || 'Captured') : undefined,
                timeline: mergedTimeline
              };
            }
            return curr;
          });
        }

        if (realCustomers && realCustomers.length > 0) {
          setSyncedCustomers(prev => {
            const existingEmails = new Set(realCustomers.map((c: any) => c.email));
            const retained = prev.filter(c => !existingEmails.has(c.email));
            return [...realCustomers, ...retained];
          });
        }

        if (realPayments && realPayments.length > 0) {
          setPayments(prev => {
            const existingIds = new Set(realPayments.map((p: any) => p.id));
            const retained = prev.filter(p => !existingIds.has(p.id));
            return [...realPayments, ...retained];
          });
        }

        if (realActivities && realActivities.length > 0) {
          setActivities(prev => {
            const existingIds = new Set(realActivities.map((a: any) => a.id));
            const retained = prev.filter(a => !existingIds.has(a.id));
            return [...realActivities, ...retained];
          });
        }

        setMerchant(prev => {
          if (prev.razorpayConnected && prev.lastSyncedAt) return prev;
          return {
            ...prev,
            lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            razorpayConnected: true
          };
        });
      }
    } catch (err) {
      console.error('Failed to sync live Razorpay data:', err);
    } finally {
      if (!quiet) setIsSyncing(false);
    }
  }, [merchant.razorpayKeyId, merchant.razorpayKeySecret]);

  // Initial Sync & Periodic Webhook Polling (Stable 15s heartbeat)
  useEffect(() => {
    syncLiveRazorpayData(false);
    const interval = setInterval(() => {
      syncLiveRazorpayData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Computed Financial Metrics
  const totalAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
  const totalRecovered = cases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (c.recoveredAmount || c.amount) : 0), 0);
  const activeCasesCount = cases.filter(c => c.status !== 'Recovered').length;
  const recoveryRate = Math.round((totalRecovered / ((totalRecovered + totalAtRisk) || 1)) * 100);
  const casesAnalyzed = cases.length;
  const actionsExecuted = activities.length || (cases.filter(c => c.status === 'Recovered').length + 5);

  // Handlers
  const handleOpenCase = (caseItem: RecoveryCase) => {
    setSelectedCase(caseItem);
  };

  const handleStartExecuteAction = (caseItem: RecoveryCase) => {
    setExecutingCase(caseItem);
  };

  const handleCompleteAction = (updatedCase: RecoveryCase, recoveredAmount: number) => {
    // Update cases list
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    
    // Update selectedCase if open
    if (selectedCase && selectedCase.id === updatedCase.id) {
      setSelectedCase(updatedCase);
    }

    // Add activity record
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSuccess = updatedCase.status === 'Recovered';

    const newActivity: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: now.toISOString(),
      timeDisplay,
      dateDisplay: 'Today',
      eventTitle: isSuccess ? 'Recovery completed' : 'Action executed',
      caseId: updatedCase.id,
      customerName: updatedCase.customerName,
      amount: updatedCase.amount,
      decision: updatedCase.recommendedAction,
      reason: updatedCase.aiWhy,
      policy: updatedCase.aiPolicyNote,
      result: isSuccess ? `Successful (₹${updatedCase.amount.toLocaleString('en-IN')} captured)` : 'Awaiting payment link resolution',
      resultStatus: isSuccess ? 'success' : 'info',
      details: `Executed via Razorpay ${merchant.isTestMode ? 'Test Mode' : 'Live'}`
    };

    setActivities(prev => [newActivity, ...prev]);

    // Persist case and activity to database
    try {
      fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCase)
      }).catch(() => {});

      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity)
      }).catch(() => {});
    } catch {}

    // Update Payments ledger
    if (isSuccess) {
      const newPayment: PaymentRecord = {
        id: `p-${Date.now()}`,
        razorpayPaymentId: updatedCase.razorpayPaymentId || `pay_Nq${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        customerName: updatedCase.customerName,
        customerEmail: updatedCase.customerEmail,
        amount: updatedCase.amount,
        status: 'succeeded',
        method: updatedCase.paymentMethod || 'Razorpay Gateway',
        timestamp: `Today, ${timeDisplay}`,
        recoveredByAgent: true,
        caseId: updatedCase.id
      };
      setPayments(prev => [newPayment, ...prev]);
    }
  };

  const handleAddSimulatedCase = (newCase: RecoveryCase) => {
    setCases(prev => [newCase, ...prev]);
    setSelectedCase(newCase);
  };

  const handleScanComplete = async () => {
    await syncLiveRazorpayData(false);

    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const recoveredTotal = cases
      .filter(c => c.status === 'Recovered')
      .reduce((sum, c) => sum + (c.recoveredAmount || c.amount || 0), 0);

    const scanActivity: ActivityEvent = {
      id: `act-scan-${Date.now()}`,
      timestamp: now.toISOString(),
      timeDisplay,
      dateDisplay: 'Today',
      eventTitle: 'Gateway recovery scan completed',
      caseId: 'PLATFORM_SCAN',
      customerName: 'Live Gateway Reconciled',
      amount: recoveredTotal,
      decision: 'Autonomous recovery scan',
      reason: `Scanned all active recovery rails and reconciled ${cases.length} cases`,
      policy: 'Razorpay live sync policy compliant',
      result: `Synchronized ${cases.length} monitored cases`,
      resultStatus: 'info'
    };

    setActivities(prev => [scanActivity, ...prev]);
  };

  const getHeaderDetails = () => {
    switch (currentTab) {
      case 'overview':
        return { title: 'Overview', subtitle: 'Revenue recovery at a glance' };
      case 'praxinex':
        return { title: 'Praxinex AI Agent', subtitle: 'Autonomous omniscient platform copilot & execution engine' };
      case 'cases':
        return { title: 'Recovery Cases', subtitle: 'Detailed view of cases requiring recovery action' };
      case 'payments':
        return { title: 'Payment Ledger', subtitle: 'Historical transactions and Razorpay gateway captures' };
      case 'customers':
        return { title: 'Customers', subtitle: 'Customer payment reliability and lifetime value' };
      case 'activity':
        return { title: 'Agent activity', subtitle: 'Chronological operational log & audit trail' };
      case 'analytics':
        return { title: 'Analytics', subtitle: 'Recovery velocity, cohort performance, and failure root causes' };
      case 'policies':
        return { title: 'Recovery policies', subtitle: 'Control what the agent can do automatically' };
      case 'integrations':
        return { title: 'Integrations', subtitle: 'Manage payment gateway and AI diagnostic settings' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Merchant organization preferences and compliance configuration' };
      default:
        return { title: 'Overview', subtitle: 'Revenue recovery at a glance' };
    }
  };

  const headerInfo = getHeaderDetails();

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden select-none font-sans relative" id="recovery-app-root">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeCaseCount={activeCasesCount}
        merchant={merchant}
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenPraxinexCopilot={() => setIsPraxinexChatOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" id="main-content-scrollable">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          isScanning={isScanOpen}
          onRunScan={() => setIsScanOpen(true)}
          onSimulateFailure={() => setIsSimulateOpen(true)}
          merchant={merchant}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onOpenPraxinex={() => setIsPraxinexChatOpen(true)}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-16">
          {currentTab === 'overview' && (
            <OverviewView
              cases={cases}
              trendData={trendData}
              totalAtRisk={totalAtRisk}
              totalRecovered={totalRecovered}
              recoveryRate={recoveryRate}
              activeCasesCount={activeCasesCount}
              casesAnalyzed={casesAnalyzed}
              actionsExecuted={actionsExecuted}
              onOpenCase={handleOpenCase}
              onViewActivity={() => setCurrentTab('activity')}
              onViewAllCases={() => setCurrentTab('cases')}
              onExecuteAction={handleStartExecuteAction}
            />
          )}

          {currentTab === 'praxinex' && (
            <PraxinexView
              cases={cases}
              payments={payments}
              customers={customers}
              activities={activities}
              merchant={merchant}
              onNavigateTab={setCurrentTab}
              onOpenCase={handleOpenCase}
              onExecuteAction={handleStartExecuteAction}
              onSyncGateway={() => syncLiveRazorpayData(false)}
            />
          )}

          {currentTab === 'cases' && (
            <RecoveryCasesView
              cases={cases}
              onOpenCase={handleOpenCase}
              onExecuteAction={handleStartExecuteAction}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              payments={payments}
              cases={cases}
              onOpenCaseId={(caseId) => {
                const target = cases.find(c => c.id === caseId || c.razorpayPaymentId === caseId || (c.customerEmail && caseId.includes(c.customerEmail)));
                if (target) setSelectedCase(target);
              }}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView
              activities={activities}
              onOpenCaseId={(caseId) => {
                const target = cases.find(c => c.id === caseId);
                if (target) setSelectedCase(target);
              }}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              totalRecovered={totalRecovered}
              totalAtRisk={totalAtRisk}
              recoveryRate={recoveryRate}
            />
          )}

          {currentTab === 'policies' && (
            <PoliciesView
              policy={policies}
              onUpdatePolicy={handleUpdatePolicies}
            />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsView
              merchant={merchant}
              onUpdateMerchant={handleUpdateMerchant}
              onSyncRazorpay={syncLiveRazorpayData}
              isSyncing={isSyncing}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              merchant={merchant}
              onUpdateMerchant={handleUpdateMerchant}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Praxinex AI Assistant Trigger Pill (Bottom-Right) */}
      {!isPraxinexChatOpen && (
        <button
          id="praxinex-floating-launcher-btn"
          onClick={() => setIsPraxinexChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 bg-neutral-900 hover:bg-black text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-200 border border-neutral-700 cursor-pointer group"
          title="Open Praxinex AI Copilot (Ctrl+K)"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold font-sans">Ask Praxinex</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded ml-1">
            ⌘K
          </span>
        </button>
      )}

      {/* Praxinex AI Assistant Drawer */}
      <PraxinexChat
        isOpen={isPraxinexChatOpen}
        onClose={() => setIsPraxinexChatOpen(false)}
        cases={cases}
        payments={payments}
        customers={customers}
        activities={activities}
        merchant={merchant}
        onNavigateTab={setCurrentTab}
        onOpenCase={handleOpenCase}
        onExecuteAction={handleStartExecuteAction}
        onSyncGateway={() => syncLiveRazorpayData(false)}
      />

      {/* Case Detail Modal / Drawer */}
      <CaseDetailModal
        caseItem={selectedCase}
        payments={payments}
        isOpen={!!selectedCase && !executingCase}
        onClose={() => setSelectedCase(null)}
        onExecuteAction={handleStartExecuteAction}
      />

      {/* Multi-step Financial Action Execution Modal */}
      <ActionExecutionModal
        caseItem={executingCase}
        isOpen={!!executingCase}
        onClose={() => setExecutingCase(null)}
        onComplete={handleCompleteAction}
      />

      {/* Interactive Simulate Failure Modal */}
      <SimulateFailureModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onAddCase={handleAddSimulatedCase}
        merchant={merchant}
        onSync={() => syncLiveRazorpayData(false)}
      />

      {/* Batch Scan Progress Modal */}
      <ScanProgressModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        cases={cases}
        onScanComplete={handleScanComplete}
      />

      {/* Supabase & Google Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onAuthChange={() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
          });
        }}
      />
    </div>
  );
}
