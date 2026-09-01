import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
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
import { LoadingScreen } from './components/LoadingScreen';
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
import { getUndiagnosedUnrecoveredCases, caseHasAIDiagnosis } from './utils/aiDiagnosisEngine';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [dateRange, setDateRange] = useState<string>('today');
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Supabase Authentication State
  const [user, setUser] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;
      setUser(nextUser);
      if (event === 'SIGNED_OUT' || !nextUser) {
        // Strictly reset all client states immediately to clean defaults upon sign out
        setMerchant(INITIAL_MERCHANT);
        setPolicies(INITIAL_POLICIES);
        setCases(INITIAL_CASES);
        setActivities(INITIAL_ACTIVITIES);
        setPayments(PAYMENT_LEDGER);
        setSyncedCustomers(CUSTOMER_DIRECTORY);
        merchantRef.current = INITIAL_MERCHANT;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Core Data - initialized with base defaults, strictly persisted to & hydrated from Supabase PostgreSQL Cloud
  const [cases, setCases] = useState<RecoveryCase[]>(INITIAL_CASES);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [merchant, setMerchant] = useState<MerchantProfile>(INITIAL_MERCHANT);

  const handleUpdateMerchant = (updated: MerchantProfile) => {
    setMerchant(updated);
    fetch('/api/merchant', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(user?.id ? { 'x-user-id': user.id } : {})
      },
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to save merchant to database:', err));
  };

  const [policies, setPolicies] = useState<RecoveryPolicy>(INITIAL_POLICIES);

  const handleUpdatePolicies = (updated: RecoveryPolicy) => {
    setPolicies(updated);
    fetch('/api/policies', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(user?.id ? { 'x-user-id': user.id } : {})
      },
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to save policies to database:', err));
  };

  const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENT_LEDGER);
  const [syncedCustomers, setSyncedCustomers] = useState<CustomerRecord[]>(CUSTOMER_DIRECTORY);

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

  // Dynamic Real-Time Trend Data calculated strictly and 100% purely from database cases & payments
  const trendData = useMemo(() => {
    const parseToDate = (input: any): Date | null => {
      if (!input) return null;
      if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
      if (typeof input === 'number') {
        const d = new Date(input < 1e11 ? input * 1000 : input);
        return isNaN(d.getTime()) ? null : d;
      }
      const str = String(input).trim();
      if (!str) return null;
      const lower = str.toLowerCase();
      if (lower === 'just now' || lower === 'payment settled') return new Date();
      if (lower.startsWith('today')) return new Date();
      if (lower.startsWith('yesterday')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
      }
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) return parsed;
      return null;
    };

    const toLocalDateStr = (d: Date | null): string => {
      if (!d || isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const now = new Date();
    let daysCount = 7;
    if (dateRange === '30d') daysCount = 30;
    else if (dateRange === 'month') daysCount = Math.max(7, now.getDate());

    // 1. Build recovery map directly from Payments ledger
    const dailyRecoveredMap = new Map<string, number>();
    const processedPaymentCaseIds = new Set<string>();

    payments.forEach(p => {
      if (p.status === 'succeeded' || p.status === 'captured') {
        const pDate = parseToDate(p.isoTimestamp || p.timestamp || (p as any).createdAt) || now;
        const dateStr = toLocalDateStr(pDate);
        const amt = Number(p.amount || 0);
        dailyRecoveredMap.set(dateStr, (dailyRecoveredMap.get(dateStr) || 0) + amt);

        if (p.caseId) processedPaymentCaseIds.add(p.caseId);
        if (p.razorpayPaymentId) processedPaymentCaseIds.add(p.razorpayPaymentId);
        if (p.invoiceId) processedPaymentCaseIds.add(p.invoiceId);
      }
    });

    // 2. Also check if any recovered case is not already in payments ledger
    cases.forEach(c => {
      if (c.status === 'Recovered') {
        const isAlreadyCounted = (c.id && processedPaymentCaseIds.has(c.id)) ||
                                 (c.razorpayPaymentId && processedPaymentCaseIds.has(c.razorpayPaymentId)) ||
                                 (c.invoiceNumber && processedPaymentCaseIds.has(c.invoiceNumber));
        if (!isAlreadyCounted) {
          let recDate = c.recoveredAt ? parseToDate(c.recoveredAt) : null;
          if (!recDate && Array.isArray(c.timeline)) {
            for (let j = c.timeline.length - 1; j >= 0; j--) {
              const t = c.timeline[j];
              if (t && (t.type === 'recovered' || /settled|recovered|captured/i.test(t.title || ''))) {
                recDate = parseToDate(t.timestamp || t.timeDisplay);
                if (recDate) break;
              }
            }
          }
          if (!recDate && c.updated && c.updated.toLowerCase().includes('settled')) {
            recDate = parseToDate(c.updated);
          }
          if (!recDate && c.createdAt) recDate = parseToDate(c.createdAt);
          if (!recDate) recDate = now;

          const dateStr = toLocalDateStr(recDate);
          const amt = Number(c.recoveredAmount || c.amount || 0);
          dailyRecoveredMap.set(dateStr, (dailyRecoveredMap.get(dateStr) || 0) + amt);
        }
      }
    });

    const points: Array<{ date: string; dayStr: string; revenueAtRisk: number; recovered: number; remaining: number; isToday: boolean }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const targetDayStr = toLocalDateStr(dayObj);
      const isToday = (i === 0);

      let label = dayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (isToday) label = 'Today';
      else if (i === 1) label = 'Yesterday';

      // Exact daily recovered amount from payments ledger on this specific date
      const dayRecovered = dailyRecoveredMap.get(targetDayStr) || 0;

      // Active Revenue at Risk on this specific date
      let dayAtRisk = 0;
      cases.forEach(c => {
        let createdDate = c.createdAt ? parseToDate(c.createdAt) : null;
        if (!createdDate && Array.isArray(c.timeline) && c.timeline.length > 0) {
          createdDate = parseToDate(c.timeline[0]?.timestamp);
        }
        if (!createdDate) createdDate = now;
        const createdStr = toLocalDateStr(createdDate);

        let recDate: Date | null = null;
        if (c.status === 'Recovered') {
          if (c.recoveredAt) recDate = parseToDate(c.recoveredAt);
          if (!recDate && Array.isArray(c.timeline)) {
            for (let j = c.timeline.length - 1; j >= 0; j--) {
              const t = c.timeline[j];
              if (t && (t.type === 'recovered' || /settled|recovered|captured/i.test(t.title || ''))) {
                recDate = parseToDate(t.timestamp || t.timeDisplay);
                if (recDate) break;
              }
            }
          }
        }
        const recStr = recDate ? toLocalDateStr(recDate) : null;

        if (createdStr <= targetDayStr) {
          if (!recStr || recStr >= targetDayStr) {
            dayAtRisk += Number(c.amount || 0);
          }
        }
      });

      points.push({
        date: label,
        dayStr: targetDayStr,
        revenueAtRisk: dayAtRisk,
        recovered: dayRecovered,
        remaining: dayAtRisk,
        isToday
      });
    }

    return points;
  }, [cases, payments, dateRange]);

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
      const authHeaders: Record<string, string> = user?.id ? { 
        'x-user-id': user.id,
        'x-user-email': user.email || ''
      } : {};
      const res = await fetch(`/api/razorpay/sync?keyId=${encodeURIComponent(kId)}&keySecret=${encodeURIComponent(kSec)}${isReset ? '&reset=true' : ''}`, {
        headers: authHeaders
      });
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
              const key = t.id || `${t.type}:${t.title}:${t.timestamp || t.timeDisplay}`;
              if (!seen.has(key)) {
                seen.add(key);
                timelineMap.set(key, t);
              }
            });

            // 2. Append new server-side timeline entries if not already present
            serverTimeline.forEach(t => {
              if (!t) return;
              const key = t.id || `${t.type}:${t.title}:${t.timestamp || t.timeDisplay}`;
              const alreadyExists = Array.from(timelineMap.values()).some(
                e => e.id === t.id || (e.type === t.type && e.title === t.title && e.description === t.description && Math.abs(
                  new Date(e.timestamp || 0).getTime() - new Date(t.timestamp || 0).getTime()
                ) < 2000)
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

          return merged;
        });

        setSyncedCustomers(newCustomers);
        setPayments(newPayments);
        setActivities(newActivities);

        setMerchant(prev => {
          const updated = {
            ...prev,
            razorpayKeyId: kId,
            razorpayKeySecret: kSec,
            lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            razorpayConnected: true
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to sync live Razorpay data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Initial Sync & Periodic Polling (Runs on mount & auth change + 30s heartbeat)
  useEffect(() => {
    let isMounted = true;
    const authHeaders: Record<string, string> = user?.id ? { 
      'x-user-id': user.id,
      'x-user-email': user.email || ''
    } : {};

    async function init() {
      const startTime = Date.now();

      // 1. Fetch persistent cases from server database first so memory/state has saved diagnosis & timeline
      try {
        const resCases = await fetch('/api/cases', { headers: authHeaders });
        const dataCases = await resCases.json();
        if (isMounted) {
          if (dataCases?.success && Array.isArray(dataCases.cases) && dataCases.cases.length > 0) {
            setCases(dataCases.cases);
            casesRef.current = dataCases.cases;
          } else if (!user?.id) {
            setCases(INITIAL_CASES);
            casesRef.current = INITIAL_CASES;
          } else {
            setCases([]);
            casesRef.current = [];
          }
        }
      } catch {}

      try {
        const resMerchant = await fetch('/api/merchant', { headers: authHeaders });
        const dataMerchant = await resMerchant.json();
        if (isMounted) {
          if (dataMerchant?.success && dataMerchant.profile) {
            const profile = dataMerchant.profile;
            setMerchant(prev => ({ ...prev, ...profile }));
            merchantRef.current = profile;
            await syncLiveRazorpayData(false, profile.razorpayKeyId, profile.razorpayKeySecret);
          } else {
            setMerchant(INITIAL_MERCHANT);
            merchantRef.current = INITIAL_MERCHANT;
            await syncLiveRazorpayData(false);
          }
        }
      } catch {
        if (isMounted) await syncLiveRazorpayData(false);
      }

      try {
        const resPolicies = await fetch('/api/policies', { headers: authHeaders });
        const dataPolicies = await resPolicies.json();
        if (isMounted) {
          if (dataPolicies?.success && dataPolicies.policies) {
            setPolicies(prev => ({ ...prev, ...dataPolicies.policies }));
          } else {
            setPolicies(INITIAL_POLICIES);
          }
        }
      } catch {}

      try {
        const resActivities = await fetch('/api/activities', { headers: authHeaders });
        const dataActivities = await resActivities.json();
        if (isMounted) {
          if (dataActivities?.success && Array.isArray(dataActivities.activities) && dataActivities.activities.length > 0) {
            setActivities(dataActivities.activities);
          } else if (!user?.id) {
            setActivities(INITIAL_ACTIVITIES);
          } else {
            setActivities([]);
          }
        }
      } catch {}

      try {
        const resPayments = await fetch('/api/payments', { headers: authHeaders });
        const dataPayments = await resPayments.json();
        if (isMounted) {
          if (dataPayments?.success && Array.isArray(dataPayments.payments) && dataPayments.payments.length > 0) {
            setPayments(dataPayments.payments);
          } else if (!user?.id) {
            setPayments(PAYMENT_LEDGER);
          } else {
            setPayments([]);
          }
        }
      } catch {}

      if (isMounted) {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 1600 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            setIsInitialLoading(false);
          }
        }, remainingDelay);
      }
    }

    init();

    const interval = setInterval(() => {
      syncLiveRazorpayData(false);
    }, 30000);

    // Fast background sync for live diagnosed cases from backend database
    const casesPollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/cases', { headers: authHeaders });
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
  }, [user?.id, syncLiveRazorpayData]);

  // Computed Financial Metrics
  const totalAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? (Number(c.amount) || 0) : 0), 0);
  const totalRecovered = cases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (Number(c.recoveredAmount || c.amount) || 0) : 0), 0);
  const activeCasesCount = cases.filter(c => c.status !== 'Recovered').length;
  const scheduledCount = cases.filter(c => c.status !== 'Recovered' && c.scheduledRetry?.status !== 'executed').length;
  const recoveryRate = (totalRecovered + totalAtRisk) > 0 ? Math.round((totalRecovered / (totalRecovered + totalAtRisk)) * 100) : 0;
  
  // Real Cases Analyzed by Agent
  const diagnosedCasesCount = cases.filter(c => caseHasAIDiagnosis(c)).length;
  const casesAnalyzed = diagnosedCasesCount > 0 ? diagnosedCasesCount : cases.length;

  // Real actions executed by Agent
  const executedActionsFromCases = cases.reduce((count, c) => {
    let caseActions = 0;
    if (c.status === 'Recovered') caseActions++;
    if (c.scheduledRetry?.status === 'executed') caseActions++;
    if (Array.isArray(c.timeline)) {
      caseActions += c.timeline.filter(t => t && (t.type === 'action' || t.type === 'link' || t.type === 'scheduled' || t.type === 'mandate' || t.type === 'reminder' || t.type === 'success' || (t.title && /link|retry|recovered|settled/i.test(t.title)))).length;
    }
    return count + caseActions;
  }, 0);
  const actionsExecuted = Math.max(activities.length, executedActionsFromCases, cases.filter(c => c.status === 'Recovered').length);

  // Handlers
  const handleOpenCase = (caseItem: RecoveryCase) => {
    setSelectedCase(caseItem);
  };

  const handleStartExecuteAction = (caseItem: RecoveryCase) => {
    setExecutingCase(caseItem);
  };

  const handleCompleteAction = (updatedCase: RecoveryCase, recoveredAmount: number) => {
    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSuccess = updatedCase.status === 'Recovered';

    if (isSuccess) {
      updatedCase.recoveredAt = updatedCase.recoveredAt || now.toISOString();
      updatedCase.recoveredAmount = Number(recoveredAmount || updatedCase.recoveredAmount || updatedCase.amount || 0);
      updatedCase.updated = 'Payment settled';
    }

    // Update cases list
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    
    // Update selectedCase if open
    if (selectedCase && selectedCase.id === updatedCase.id) {
      setSelectedCase(updatedCase);
    }

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

  // Undiagnosed Unrecovered Cases Computation
  const undiagnosedCases = useMemo(() => {
    return getUndiagnosedUnrecoveredCases(cases);
  }, [cases]);

  const casesRef = useRef<RecoveryCase[]>(cases);
  useEffect(() => {
    casesRef.current = cases;
  }, [cases]);

  const [isDiagnosingBatch, setIsDiagnosingBatch] = useState<boolean>(false);
  const [activeDiagnosingCaseId, setActiveDiagnosingCaseId] = useState<string | null>(null);
  const isDiagnosingQueueRef = useRef<boolean>(false);

  // Autonomous Sequential Diagnosis Worker: Automatically processes all undiagnosed unrecovered cases one-by-one
  useEffect(() => {
    if (isInitialLoading || cases.length === 0 || isDiagnosingQueueRef.current) return;

    const initialUndiagnosed = getUndiagnosedUnrecoveredCases(cases);
    if (initialUndiagnosed.length === 0) return;

    isDiagnosingQueueRef.current = true;
    setIsDiagnosingBatch(true);

    (async () => {
      try {
        while (true) {
          const currentList = getUndiagnosedUnrecoveredCases(casesRef.current);
          if (currentList.length === 0) {
            break;
          }

          const nextCase = currentList[0];
          setActiveDiagnosingCaseId(nextCase.id);

          console.log(`🤖 [Autonomous Sequential Diagnosis] Processing Case ${nextCase.id} (${nextCase.customerName}) with AI Agent... (${currentList.length} remaining)`);

          try {
            const res = await fetch('/api/agent/diagnose-case', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                caseId: nextCase.id,
                caseItem: nextCase
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data && data.diagnosis) {
                console.log(`✅ [Autonomous Sequential Diagnosis] Successfully diagnosed Case ${nextCase.id}: ${data.diagnosis.recommendedAction} (${data.diagnosis.recoveryProbability}%)`);

                const now = new Date();
                const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const diagEntryId = `t-diag-${nextCase.id}-${Date.now()}`;

                const updatedTimeline = Array.isArray(data.case?.timeline) && data.case.timeline.length > 0
                  ? [...data.case.timeline]
                  : (Array.isArray(nextCase.timeline) ? [...nextCase.timeline] : []);

                const newDiagEvent = {
                  id: diagEntryId,
                  timestamp: data.diagnosis.diagnosedAt || now.toISOString(),
                  timeDisplay,
                  title: `AI Root-Cause Diagnosis (Action: ${data.diagnosis.recommendedAction})`,
                  description: `${data.diagnosis.merchantExplanation} [Optimal Window: ${data.diagnosis.optimalTimeWindow} • Expected Salvage: ${data.diagnosis.recoveryProbability}%]`,
                  type: 'diagnosis',
                  actionType: data.diagnosis.recommendedAction
                };

                const isRecentDup = updatedTimeline.some(
                  (t: any) => t && t.type === 'diagnosis' && t.title === newDiagEvent.title && t.description === newDiagEvent.description && Math.abs(new Date(t.timestamp || 0).getTime() - now.getTime()) < 2000
                );
                if (!isRecentDup) {
                  updatedTimeline.push(newDiagEvent);
                }
                updatedTimeline.sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

                const updatedCaseObj: RecoveryCase = {
                  ...nextCase,
                  ...(data.case || {}),
                  llmDiagnosis: data.diagnosis,
                  aiWhy: data.diagnosis.merchantExplanation || nextCase.aiWhy,
                  recommendedAction: data.diagnosis.recommendedAction || nextCase.recommendedAction,
                  recoveryProbability: Number(data.diagnosis.recoveryProbability) || nextCase.recoveryProbability || 75,
                  priorityRank: data.diagnosis.priorityRank || nextCase.priorityRank,
                  rootCauseCategory: data.diagnosis.rootCauseCategory || nextCase.rootCauseCategory,
                  rootCauseSubCategory: data.diagnosis.rootCauseSubCategory || nextCase.rootCauseSubCategory,
                  lastDiagnosedAt: data.diagnosis.diagnosedAt || now.toISOString(),
                  timeline: updatedTimeline
                };

                // Update state and immediate ref
                setCases(prev => {
                  const updated = prev.map(c => c.id === nextCase.id ? updatedCaseObj : c);
                  casesRef.current = updated;
                  return updated;
                });
                setSelectedCase(prev => prev?.id === nextCase.id ? updatedCaseObj : prev);

                // Persist to server database
                fetch('/api/cases', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(user?.id ? { 'x-user-id': user.id, 'x-user-email': user.email || '' } : {})
                  },
                  body: JSON.stringify(updatedCaseObj)
                }).catch(() => {});
              }
            }
          } catch (caseErr) {
            console.error(`Autonomous diagnosis error for Case ${nextCase.id}:`, caseErr);
            // Fallback so it doesn't get stuck in an infinite retry loop
            const now = new Date();
            const fallbackCase: RecoveryCase = {
              ...nextCase,
              lastDiagnosedAt: now.toISOString(),
              timeline: [
                ...(Array.isArray(nextCase.timeline) ? nextCase.timeline : []),
                {
                  id: `t-diag-${nextCase.id}-${Date.now()}`,
                  timestamp: now.toISOString(),
                  timeDisplay: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  title: `AI Root-Cause Diagnosis (Action: ${nextCase.recommendedAction})`,
                  description: `${nextCase.aiWhy || 'AI failure root-cause synthesized.'}`,
                  type: 'diagnosis',
                  actionType: nextCase.recommendedAction
                }
              ]
            };
            setCases(prev => {
              const updated = prev.map(c => c.id === nextCase.id ? fallbackCase : c);
              casesRef.current = updated;
              return updated;
            });
          }

          // Small 350ms pause for smooth sequential pacing
          await new Promise(r => setTimeout(r, 350));
        }
      } finally {
        isDiagnosingQueueRef.current = false;
        setIsDiagnosingBatch(false);
        setActiveDiagnosingCaseId(null);
      }
    })();
  }, [cases, isInitialLoading]);


  const triggerAutonomousDiagnosis = useCallback(async (customCaseId?: string) => {
    if (customCaseId) {
      const targetCase = cases.find(c => c.id === customCaseId);
      if (targetCase) {
        try {
          const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(user?.id ? { 'x-user-id': user.id, 'x-user-email': user.email || '' } : {})
          };
          const res = await fetch('/api/agent/diagnose-case', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ caseId: targetCase.id, caseItem: targetCase })
          });
          const data = await res.json();
          if (data?.case && data?.diagnosis) {
            const now = new Date();
            const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const diagEntryId = `t-diag-${targetCase.id}-${Date.now()}`;
            const currentTl = Array.isArray(data.case?.timeline) && data.case.timeline.length > 0 
              ? [...data.case.timeline] 
              : (Array.isArray(targetCase.timeline) ? [...targetCase.timeline] : []);
            const newDiagEvent = {
              id: diagEntryId,
              timestamp: data.diagnosis.diagnosedAt || now.toISOString(),
              timeDisplay,
              title: `AI Root-Cause Diagnosis (Action: ${data.diagnosis.recommendedAction})`,
              description: `${data.diagnosis.merchantExplanation} [Optimal Window: ${data.diagnosis.optimalTimeWindow} • Expected Salvage: ${data.diagnosis.recoveryProbability}%]`,
              type: 'diagnosis',
              actionType: data.diagnosis.recommendedAction
            };
            const isRecentDup = currentTl.some(
              (t: any) => t && t.type === 'diagnosis' && t.title === newDiagEvent.title && t.description === newDiagEvent.description && Math.abs(new Date(t.timestamp || 0).getTime() - now.getTime()) < 2000
            );
            if (!isRecentDup) {
              currentTl.push(newDiagEvent);
            }
            currentTl.sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

            const updated: RecoveryCase = {
              ...targetCase,
              ...data.case,
              llmDiagnosis: data.diagnosis,
              lastDiagnosedAt: data.diagnosis.diagnosedAt || new Date().toISOString(),
              timeline: currentTl
            };
            setCases(prev => prev.map(c => c.id === data.case.id ? updated : c));
            casesRef.current = casesRef.current.map(c => c.id === data.case.id ? updated : c);
            setSelectedCase(prev => prev?.id === data.case.id ? updated : prev);

            fetch('/api/cases', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify(updated)
            }).catch(() => {});
          }
        } catch (err) {
          console.error('Error triggering diagnosis:', err);
        }
      }
    }
  }, [cases, user?.id]);

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

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden select-none font-sans relative" id="recovery-app-root">
      {/* Fullscreen Initial Loading Splash Page */}
      <LoadingScreen isLoading={isInitialLoading} />

      {/* Left Sidebar with integrated Date Range & Simulator controls */}
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
        dateRange={dateRange}
        setDateRange={setDateRange}
        onSimulateFailure={() => setIsSimulateOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" id="main-content-scrollable">
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
              onDiagnoseAllUndiagnosed={triggerAutonomousDiagnosis}
              isDiagnosingBatch={isDiagnosingBatch}
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
              onDiagnoseAllUndiagnosed={triggerAutonomousDiagnosis}
              isDiagnosingBatch={isDiagnosingBatch}
              undiagnosedCases={undiagnosedCases}
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
          setCases(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
          setSelectedCase(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
          fetch('/api/cases', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(user?.id ? { 'x-user-id': user.id } : {})
            },
            body: JSON.stringify(updated)
          }).catch(err => console.error('Failed to update case in database:', err));
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
