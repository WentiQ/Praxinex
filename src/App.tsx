import React, { useState } from 'react';
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
import { CaseDetailModal } from './components/CaseDetailModal';
import { ActionExecutionModal } from './components/ActionExecutionModal';
import { SimulateFailureModal } from './components/SimulateFailureModal';
import { ScanProgressModal } from './components/ScanProgressModal';
import { 
  INITIAL_CASES, 
  INITIAL_ACTIVITIES, 
  INITIAL_MERCHANT, 
  INITIAL_POLICIES, 
  PAYMENT_LEDGER, 
  CUSTOMER_DIRECTORY, 
  REVENUE_TREND_DATA 
} from './data/mockData';
import { RecoveryCase, ActivityEvent, MerchantProfile, RecoveryPolicy, PaymentRecord, CustomerRecord } from './types';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [dateRange, setDateRange] = useState<string>('today');

  // Core Data
  const [cases, setCases] = useState<RecoveryCase[]>(INITIAL_CASES);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [merchant, setMerchant] = useState<MerchantProfile>(INITIAL_MERCHANT);
  const [policies, setPolicies] = useState<RecoveryPolicy>(INITIAL_POLICIES);
  const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENT_LEDGER);
  const [customers, setCustomers] = useState<CustomerRecord[]>(CUSTOMER_DIRECTORY);
  const [trendData, setTrendData] = useState(REVENUE_TREND_DATA);

  // Modals & Interactive Flow States
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [executingCase, setExecutingCase] = useState<RecoveryCase | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);

  // Computed Financial Metrics
  const totalAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 161000);
  const totalRecovered = cases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 87500);
  const activeCasesCount = cases.filter(c => c.status !== 'Recovered').length;
  const recoveryRate = (totalRecovered / (totalRecovered + totalAtRisk)) * 100;
  const casesAnalyzed = 42 + (cases.length - INITIAL_CASES.length);
  const actionsExecuted = 31 + (cases.filter(c => c.status === 'Recovered').length - 5);

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

    // Update Payments ledger
    if (isSuccess) {
      const newPayment: PaymentRecord = {
        id: `p-${Date.now()}`,
        razorpayPaymentId: `pay_Nq${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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

      // Update Trend chart
      setTrendData(prev => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            recovered: last.recovered + updatedCase.amount,
            remaining: Math.max(0, last.remaining - updatedCase.amount)
          }
        ];
      });
    }
  };

  const handleAddSimulatedCase = (newCase: RecoveryCase) => {
    setCases(prev => [newCase, ...prev]);

    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newActivity: ActivityEvent = {
      id: `act-sim-${Date.now()}`,
      timestamp: now.toISOString(),
      timeDisplay,
      dateDisplay: 'Today',
      eventTitle: 'Revenue risk detected',
      caseId: newCase.id,
      customerName: newCase.customerName,
      amount: newCase.amount,
      decision: `Diagnosed: ${newCase.recommendedAction}`,
      reason: newCase.failureReason,
      policy: 'Intake compliance verified',
      result: 'Ingested into active recovery queue',
      resultStatus: 'info'
    };

    setActivities(prev => [newActivity, ...prev]);
    setSelectedCase(newCase);
  };

  const handleScanComplete = (batchRecovered: number, updatedCount: number) => {
    // Mark in-progress cases as recovered
    setCases(prev => prev.map(c => {
      if (c.id === 'RC-1095' || c.id === 'RC-1093') {
        return {
          ...c,
          status: 'Recovered',
          recoveredAmount: c.amount,
          recoveredAt: 'Just now',
          updated: 'Just now'
        };
      }
      return c;
    }));

    // Update Trend data
    setTrendData(prev => {
      const last = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        {
          ...last,
          recovered: last.recovered + batchRecovered,
          remaining: Math.max(0, last.remaining - batchRecovered)
        }
      ];
    });

    const now = new Date();
    const timeDisplay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const batchActivity: ActivityEvent = {
      id: `act-batch-${Date.now()}`,
      timestamp: now.toISOString(),
      timeDisplay,
      dateDisplay: 'Today',
      eventTitle: 'Batch recovery scan completed',
      caseId: 'BATCH',
      customerName: 'Multiple Accounts',
      amount: batchRecovered,
      decision: 'Autonomous batch scan execution',
      reason: 'Automated policy-compliant retry & payment links',
      policy: 'All bounded limits respected',
      result: `Captured ₹${batchRecovered.toLocaleString('en-IN')}`,
      resultStatus: 'success'
    };

    setActivities(prev => [batchActivity, ...prev]);
  };

  const getHeaderDetails = () => {
    switch (currentTab) {
      case 'overview':
        return { title: 'Overview', subtitle: 'Revenue recovery at a glance' };
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
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden select-none font-sans" id="recovery-app-root">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeCaseCount={activeCasesCount}
        merchant={merchant}
        onOpenSettings={() => setCurrentTab('settings')}
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
              onOpenCaseId={(caseId) => {
                const target = cases.find(c => c.id === caseId);
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
              onUpdatePolicy={setPolicies}
            />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsView
              merchant={merchant}
              onUpdateMerchant={setMerchant}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              merchant={merchant}
              onUpdateMerchant={setMerchant}
            />
          )}
        </main>
      </div>

      {/* Case Detail Modal / Drawer */}
      <CaseDetailModal
        caseItem={selectedCase}
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
      />

      {/* Batch Scan Progress Modal */}
      <ScanProgressModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanComplete={handleScanComplete}
      />
    </div>
  );
}
