import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ScheduledActionsView } from './components/ScheduledActionsView';
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

  // Core Data - initialized from deterministic cache to prevent layout shift or flashing on refresh
  const [cases, setCases] = useState<RecoveryCase[]>(() => {
    try {
      const saved = localStorage.getItem('recovery_cases_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CASES;
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('recovery_activities_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ACTIVITIES;
  });

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

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('recovery_payments_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return PAYMENT_LEDGER;
  });

  const [syncedCustomers, setSyncedCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('recovery_customers_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return CUSTOMER_DIRECTORY;
  });

  // Dynamically calculate and update Customers in real-time from all cases and payments
  const customers: CustomerRecord[] = useMemo(() => {
    const map = new Map<string, CustomerRecord>();

    // 1. Synced customers from Razorpay
    syncedCustomers.forEach(c => {
      const email = (c.email || '').toLowerCase().trim();
      if (!email) return;
      map.set(email, { ...c });
    });

    // 2. Dynamic Aggregation from all live cases
    cases.forEach(cs => {
      if (!cs || !cs.customerEmail) return;
      const email = cs.customerEmail.toLowerCase().trim();
      const existing = map.get(email) || {
        id: `cust_${cs.id}`,
        name: (cs.customerName && !cs.customerName.toLowerCase().startsWith('customer') && !cs.customerName.toLowerCase().startsWith('subscriber') && cs.customerName !== 'Valued Customer')
          ? cs.customerName
          : (cs.customerEmail && cs.customerEmail.includes('@') ? cs.customerEmail.split('@')[0].split(/[\._\-]+/).map(s=>s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()).join(' ') : 'Valued Client'),
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
        else if (cs.risk === 'Medium' && existing.riskCategory !== 'High Risk') existing.riskCategory = 'Moderate';
      }

      existing.lastSeen = cs.updated || 'Just now';
      map.set(email, existing);
    });

    // 3. Update from payments
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

  // Dynamic Real-Time Trend Data calculated strictly from database cases & payments
  // Shows 0 for days without data (no speculation or hardcoded baselines)
  const trendData = useMemo(() => {
    const now = new Date();
    const points = [];

    const matchesDay = (dateInput: any, targetYYYYMMDD: string) => {
      if (!dateInput) return false;
      if (typeof dateInput === 'string' && dateInput.startsWith(targetYYYYMMDD)) return true;
      try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return false;
        return d.toISOString().split('T')[0] === targetYYYYMMDD;
      } catch {
        return false;
      }
    };

    const createdOnOrBefore = (c: RecoveryCase, dayEndMs: number) => {
      if (!c.createdAt) return true;
      try {
        const t = new Date(c.createdAt).getTime();
        return isNaN(t) || t <= dayEndMs;
      } catch {
        return true;
      }
    };

    for (let i = 6; i >= 0; i--) {
      const dayObj = new Date(now);
      dayObj.setDate(now.getDate() - i);
      const targetYYYYMMDD = dayObj.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayEnd = new Date(dayObj);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEndMs = dayEnd.getTime();

      if (i === 0) {
        // TODAY:
        // - Recovered: Total amount recovered today across live cases
        // - Revenue at risk: Total active unrecovered cases today
        const recVal = cases
          .filter(c => c.status === 'Recovered')
          .reduce((sum, c) => sum + (c.recoveredAmount || c.amount || 0), 0);

        const riskVal = cases
          .filter(c => c.status !== 'Recovered')
          .reduce((sum, c) => sum + (c.amount || 0), 0);

        points.push({
          date: label,
          revenueAtRisk: riskVal,
          recovered: recVal,
          remaining: riskVal
        });
      } else {
        // PAST DAYS (Strictly calculated from database — 0 if no records exist for that day):
        const recoveredCasesOnDay = cases.filter(c => c.status === 'Recovered' && matchesDay(c.recoveredAt || c.updated || c.createdAt, targetYYYYMMDD));
        const recFromCases = recoveredCasesOnDay.reduce((sum, c) => sum + (c.recoveredAmount || c.amount || 0), 0);

        const paymentsOnDay = payments.filter(p => (p.status === 'captured' || p.status === 'succeeded') && matchesDay(p.isoTimestamp || (p as any).createdAt || p.timestamp, targetYYYYMMDD));
        const recFromPayments = paymentsOnDay.reduce((sum, p) => sum + (p.amount || 0), 0);

        const recVal = Math.max(recFromCases, recFromPayments);

        const riskCasesOnDay = cases.filter(c => {
          if (!createdOnOrBefore(c, dayEndMs)) return false;
          if (c.status !== 'Recovered') return true;
          if (c.recoveredAt) {
            try {
              const recMs = new Date(c.recoveredAt).getTime();
              if (!isNaN(recMs) && recMs > dayEndMs) return true;
            } catch {}
          }
          return false;
        });

        const riskVal = riskCasesOnDay.reduce((sum, c) => sum + (c.amount || 0), 0);

        points.push({
          date: label,
          revenueAtRisk: riskVal,
          recovered: recVal,
          remaining: riskVal
        });
      }
    }

    return points;
  }, [cases, payments]);

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

  // Stable reference to latest merchant without causing re-render loops
  const merchantRef = useRef<MerchantProfile>(merchant);
  useEffect(() => {
    merchantRef.current = merchant;
  }, [merchant]);

  // Live Razorpay Sync Function
  const syncLiveRazorpayData = useCallback(async (isReset = false, customKeyId?: string, customKeySecret?: string) => {
    setIsSyncing(true);
    const kId = (customKeyId || merchantRef.current?.razorpayKeyId || '').trim();
    const kSec = (customKeySecret || merchantRef.current?.razorpayKeySecret || '').trim();
    if (!kId) {
      setIsSyncing(false);
      return;
    }
    try {
      const res = await fetch(`/api/razorpay/sync?keyId=${encodeURIComponent(kId)}&keySecret=${encodeURIComponent(kSec)}${isReset ? '&reset=true' : ''}`);
      const data = await res.json();

      if (data.success && data.transformed) {
        const { cases: realCases, customers: realCustomers, payments: realPayments, activities: realActivities } = data.transformed;

        const syncedCases = Array.isArray(realCases) ? realCases : [];
        const newCustomers = Array.isArray(realCustomers) ? realCustomers : [];
        const newPayments = Array.isArray(realPayments) ? realPayments : [];
        const newActivities = Array.isArray(realActivities) ? realActivities : [];

        // Merge synced cases with local state - PRESERVE diagnosis data that the server already merged
        // The server-side sync already preserves llmDiagnosis, scheduledRetry etc. from DB.
        // But we also preserve any local-state fields the server doesn't know about yet.
        setCases(prev => {
          const localMap = new Map<string, any>();
          prev.forEach(c => { if (c.id) localMap.set(c.id, c); });

          const merged = syncedCases.map((sc: any) => {
            const local = localMap.get(sc.id);
            if (!local) return sc;

            // Preserve all AI diagnosis fields unconditionally from whichever source has the latest/populated data
            const diagSource = (local.lastDiagnosedAt && (!sc.lastDiagnosedAt || new Date(local.lastDiagnosedAt).getTime() >= new Date(sc.lastDiagnosedAt).getTime())) ? local : sc;
            const fallbackSource = (diagSource === local) ? sc : local;

            const mergedCase: any = {
              ...sc,
              llmDiagnosis: diagSource.llmDiagnosis || fallbackSource.llmDiagnosis,
              aiWhy: diagSource.aiWhy || fallbackSource.aiWhy || (diagSource.llmDiagnosis?.merchantExplanation),
              recommendedAction: diagSource.recommendedAction || fallbackSource.recommendedAction || (diagSource.llmDiagnosis?.recommendedAction) || sc.recommendedAction,
              recoveryProbability: diagSource.recoveryProbability || fallbackSource.recoveryProbability || (diagSource.llmDiagnosis?.recoveryProbability) || sc.recoveryProbability,
              priorityRank: diagSource.priorityRank || fallbackSource.priorityRank || (diagSource.llmDiagnosis?.priorityRank) || sc.priorityRank,
              rootCauseCategory: diagSource.rootCauseCategory || fallbackSource.rootCauseCategory || (diagSource.llmDiagnosis?.rootCauseCategory) || sc.rootCauseCategory,
              rootCauseSubCategory: diagSource.rootCauseSubCategory || fallbackSource.rootCauseSubCategory || (diagSource.llmDiagnosis?.rootCauseSubCategory) || sc.rootCauseSubCategory,
              scoringBreakdown: diagSource.scoringBreakdown || fallbackSource.scoringBreakdown,
              responseWindowHours: diagSource.responseWindowHours || fallbackSource.responseWindowHours || (diagSource.llmDiagnosis?.responseWindowHours) || sc.responseWindowHours,
              responseWindowDeadline: diagSource.responseWindowDeadline || fallbackSource.responseWindowDeadline || (diagSource.llmDiagnosis?.responseWindowDeadline) || sc.responseWindowDeadline,
              lastDiagnosedAt: diagSource.lastDiagnosedAt || fallbackSource.lastDiagnosedAt || sc.lastDiagnosedAt
            };

            // Always preserve scheduledRetry from whichever source has it
            if (local.scheduledRetry && local.scheduledRetry.status === 'pending') {
              mergedCase.scheduledRetry = local.scheduledRetry;
              if (local.status === 'Scheduled') mergedCase.status = 'Scheduled';
            } else if (sc.scheduledRetry) {
              mergedCase.scheduledRetry = sc.scheduledRetry;
            }

            // Merge timelines - prioritize local timeline as base so custom simulation events & AI diagnosis steps are never reset
            const serverTimeline: any[] = Array.isArray(sc.timeline)
              ? sc.timeline.filter((t: any) => t && !(typeof t.title === 'string' && t.title.includes('AI strategy evaluated')))
              : [];
            const localTimeline: any[] = Array.isArray(local.timeline)
              ? local.timeline.filter((t: any) => t && !(typeof t.title === 'string' && t.title.includes('AI strategy evaluated')))
              : [];
            const timelineMap = new Map<string, any>();
            const seen = new Set<string>();

            // 1. Start with local timeline as base
            localTimeline.forEach(t => {
              if (!t) return;
              const key = t.id || `${t.type}:${t.title}:${t.timeDisplay}`;
              if (!seen.has(key)) {
                seen.add(key);
                timelineMap.set(key, t);
              }
            });

            // 2. Append new server-side timeline entries if not already present
            serverTimeline.forEach(t => {
              if (!t) return;
              const key = t.id || `${t.type}:${t.title}:${t.timeDisplay}`;
              const alreadyExists = Array.from(timelineMap.values()).some(
                e => e.id === t.id || (e.type === t.type && e.title === t.title && Math.abs(
                  new Date(e.timestamp || 0).getTime() - new Date(t.timestamp || 0).getTime()
                ) < 120000)
              );
              if (!seen.has(key) && !alreadyExists) {
                seen.add(key);
                timelineMap.set(key, t);
              }
            });

            mergedCase.timeline = Array.from(timelineMap.values()).sort(
              (a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
            );

            return mergedCase;
          });

          // Also include any local cases not present in the sync result (e.g. non-Razorpay cases)
          prev.forEach(lc => {
            if (!merged.find((mc: any) => mc.id === lc.id)) {
              merged.push(lc);
            }
          });

          try {
            localStorage.setItem('recovery_cases_cache', JSON.stringify(merged));
          } catch {}
          return merged;
        });

        setSyncedCustomers(newCustomers);
        setPayments(newPayments);
        setActivities(newActivities);

        try {
          localStorage.setItem('recovery_customers_cache', JSON.stringify(newCustomers));
          localStorage.setItem('recovery_payments_cache', JSON.stringify(newPayments));
          localStorage.setItem('recovery_activities_cache', JSON.stringify(newActivities));
        } catch {}

        setMerchant(prev => {
          const updated = {
            ...prev,
            razorpayKeyId: kId,
            razorpayKeySecret: kSec,
            lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            razorpayConnected: true
          };
          try {
            localStorage.setItem('recovery_merchant_profile', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to sync live Razorpay data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial Sync & Periodic Polling (Runs once on mount + 30s heartbeat)
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const resMerchant = await fetch('/api/merchant');
        const dataMerchant = await resMerchant.json();
        if (isMounted && dataMerchant?.success && dataMerchant.profile) {
          const profile = dataMerchant.profile;
          setMerchant(prev => {
            const merged = { ...prev, ...profile };
            try {
              localStorage.setItem('recovery_merchant_profile', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          merchantRef.current = profile;
          await syncLiveRazorpayData(false, profile.razorpayKeyId, profile.razorpayKeySecret);
        } else {
          await syncLiveRazorpayData(false);
        }
      } catch {
        await syncLiveRazorpayData(false);
      }

      try {
        const resPolicies = await fetch('/api/policies');
        const dataPolicies = await resPolicies.json();
        if (isMounted && dataPolicies?.success && dataPolicies.policies) {
          setPolicies(prev => ({ ...prev, ...dataPolicies.policies }));
        }
      } catch {}
    }

    init();

    const interval = setInterval(() => {
      syncLiveRazorpayData(false);
    }, 30000);

    // Fast background sync for live diagnosed cases from backend SQLite database
    const casesPollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/cases');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.cases && Array.isArray(data.cases)) {
            setCases(prev => {
              const localMap = new Map<string, any>();
              prev.forEach(c => { if (c.id) localMap.set(c.id, c); });

              return data.cases.map((sc: any) => {
                const local = localMap.get(sc.id);
                if (!local) return sc;

                const diagSource = (local.lastDiagnosedAt && (!sc.lastDiagnosedAt || new Date(local.lastDiagnosedAt).getTime() > new Date(sc.lastDiagnosedAt).getTime())) ? local : sc;
                const fallbackSource = (diagSource === local) ? sc : local;

                const combinedTl = [...(Array.isArray(local.timeline) ? local.timeline : []), ...(Array.isArray(sc.timeline) ? sc.timeline : [])];
                const seenTl = new Set<string>();
                const mergedTimeline: any[] = [];
                combinedTl.forEach((t: any) => {
                  if (!t) return;
                  const key = t.id || `${t.type}:${t.title}:${t.timestamp || t.timeDisplay}`;
                  if (!seenTl.has(key)) {
                    seenTl.add(key);
                    mergedTimeline.push(t);
                  }
                });
                mergedTimeline.sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

                const merged: any = {
                  ...sc,
                  paymentLinkUrl: local.paymentLinkUrl || sc.paymentLinkUrl,
                  razorpayPaymentId: local.razorpayPaymentId || sc.razorpayPaymentId,
                  llmDiagnosis: diagSource.llmDiagnosis || fallbackSource.llmDiagnosis,
                  aiWhy: diagSource.aiWhy || fallbackSource.aiWhy || (diagSource.llmDiagnosis?.merchantExplanation),
                  recommendedAction: diagSource.recommendedAction || fallbackSource.recommendedAction || (diagSource.llmDiagnosis?.recommendedAction) || sc.recommendedAction,
                  recoveryProbability: diagSource.recoveryProbability || fallbackSource.recoveryProbability || (diagSource.llmDiagnosis?.recoveryProbability) || sc.recoveryProbability,
                  priorityRank: diagSource.priorityRank || fallbackSource.priorityRank || (diagSource.llmDiagnosis?.priorityRank) || sc.priorityRank,
                  rootCauseCategory: diagSource.rootCauseCategory || fallbackSource.rootCauseCategory || (diagSource.llmDiagnosis?.rootCauseCategory) || sc.rootCauseCategory,
                  rootCauseSubCategory: diagSource.rootCauseSubCategory || fallbackSource.rootCauseSubCategory || (diagSource.llmDiagnosis?.rootCauseSubCategory) || sc.rootCauseSubCategory,
                  scoringBreakdown: diagSource.scoringBreakdown || fallbackSource.scoringBreakdown,
                  responseWindowHours: diagSource.responseWindowHours || fallbackSource.responseWindowHours || (diagSource.llmDiagnosis?.responseWindowHours) || sc.responseWindowHours,
                  responseWindowDeadline: diagSource.responseWindowDeadline || fallbackSource.responseWindowDeadline || (diagSource.llmDiagnosis?.responseWindowDeadline) || sc.responseWindowDeadline,
                  lastDiagnosedAt: diagSource.lastDiagnosedAt || fallbackSource.lastDiagnosedAt || sc.lastDiagnosedAt,
                  timeline: mergedTimeline.length > 0 ? mergedTimeline : sc.timeline
                };

                return merged;
              });
            });
          }
        }
      } catch {}
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(casesPollInterval);
    };
  }, [syncLiveRazorpayData]);

  // Computed Financial Metrics
  const totalAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
  const totalRecovered = cases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (c.recoveredAmount || c.amount) : 0), 0);
  const activeCasesCount = cases.filter(c => c.status !== 'Recovered').length;
  const scheduledCount = cases.filter(c => c.status !== 'Recovered' && c.scheduledRetry?.status !== 'executed').length;
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

    // Auto-trigger LLM Re-diagnose endpoint immediately for newly added recovery case
    fetch('/api/agent/diagnose-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: newCase.id, caseItem: newCase })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.case) {
          setCases(prev => prev.map(c => c.id === data.case.id ? { ...c, ...data.case } : c));
          setSelectedCase(prev => prev?.id === data.case.id ? { ...prev, ...data.case } : prev);
        }
      })
      .catch(() => {});
  };

  const handleOpenCaseById = useCallback(async (caseId: string) => {
    if (!caseId) return;
    const clean = caseId.trim();

    // 1. Search locally in cases state
    let target = cases.find(c => 
      c.id === clean || 
      c.id.toLowerCase() === clean.toLowerCase() ||
      c.invoiceNumber === clean ||
      c.razorpayPaymentId === clean ||
      clean.includes(c.id) ||
      c.id.includes(clean)
    );

    if (target) {
      setSelectedCase(target);
      return;
    }

    // 2. Fetch latest fresh cases from server
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data?.cases && Array.isArray(data.cases)) {
        setCases(data.cases);
        target = data.cases.find((c: any) => 
          c.id === clean || 
          c.id.toLowerCase() === clean.toLowerCase() ||
          c.invoiceNumber === clean ||
          c.razorpayPaymentId === clean ||
          clean.includes(c.id) ||
          c.id.includes(clean)
        );
        if (target) {
          setSelectedCase(target);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load case for inspection:', err);
    }
  }, [cases]);

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
      case 'scheduled':
        return { title: 'Scheduled Actions by Agent', subtitle: 'Autonomous execution queue ordered by next upcoming schedule' };
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
        scheduledCount={scheduledCount}
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

          {currentTab === 'scheduled' && (
            <ScheduledActionsView
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
              cases={cases}
              onOpenCaseId={handleOpenCaseById}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              cases={cases}
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
        onCaseUpdated={(updated) => {
          setCases(prev => {
            const nextCases = prev.map(c => c.id === updated.id ? { ...c, ...updated } : c);
            try {
              localStorage.setItem('recovery_cases_cache', JSON.stringify(nextCases));
            } catch {}
            return nextCases;
          });
          setSelectedCase(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
          try {
            fetch('/api/cases', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            }).catch(() => {});
          } catch {}
        }}
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
