import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Zap, 
  Layers, 
  CreditCard, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Terminal, 
  Activity 
} from 'lucide-react';
import { RecoveryCase, MerchantProfile, ActiveTab, PraxinexMessage, PraxinexAction } from '../types';
import { formatINR } from '../utils/formatters';

interface PraxinexViewProps {
  cases: RecoveryCase[];
  payments: any[];
  customers: any[];
  activities: any[];
  merchant: MerchantProfile;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCase: (caseItem: RecoveryCase) => void;
  onExecuteAction: (caseItem: RecoveryCase) => void;
  onSyncGateway: () => void;
}

export const PraxinexView: React.FC<PraxinexViewProps> = ({
  cases,
  payments,
  customers,
  activities,
  merchant,
  onNavigateTab,
  onOpenCase,
  onExecuteAction,
  onSyncGateway
}) => {
  const [messages, setMessages] = useState<PraxinexMessage[]>([
    {
      id: 'init-view-1',
      sender: 'praxinex',
      text: 'Greetings. I am **Praxinex**, your autonomous AI Revenue Recovery Agent.\n\nI continuously monitor your Razorpay payment rails, detect transaction failures, evaluate dynamic recovery policies, and execute settlements autonomously. How can I assist you right now?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thoughts: ['Live gateway connection verified', 'Real-time telemetry synchronized across active cases']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const totalAtRisk = cases.reduce((sum, c) => sum + (c.status !== 'Recovered' ? c.amount : 0), 0);
  const totalRecovered = cases.reduce((sum, c) => sum + (c.status === 'Recovered' ? (c.recoveredAmount || c.amount) : 0), 0);
  const activeCasesCount = cases.filter(c => c.status !== 'Recovered').length;
  const recoveryRate = Math.round((totalRecovered / ((totalRecovered + totalAtRisk) || 1)) * 100);

  const toggleThoughts = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: PraxinexMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          conversation: messages.slice(-6),
          currentSnapshot: {
            cases,
            payments,
            customers,
            activities,
            merchant
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage: PraxinexMessage = {
          id: 'msg-prax-' + Date.now(),
          sender: 'praxinex',
          text: data.reply || 'Task executed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thoughts: data.thoughts,
          actions: data.actions,
          caseCards: data.caseCards,
          paymentLinkCard: data.paymentLinkCard,
          metricsHighlight: data.metricsHighlight
        };

        setMessages(prev => [...prev, agentMessage]);

        // If the agent performed any mutation or payment link, trigger instant platform sync
        if (data.hasMutations || data.paymentLinkCard) {
          onSyncGateway();
        }

        if (data.actions && data.actions.length > 0) {
          data.actions.forEach((act: PraxinexAction) => {
            if (act.type === 'navigate' && act.payload?.tab) {
              onNavigateTab(act.payload.tab as ActiveTab);
            } else if (act.type === 'sync_data') {
              onSyncGateway();
            }
          });
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: 'msg-err-' + Date.now(),
            sender: 'praxinex',
            text: 'Apologies: ' + (data.error || 'Execution failed'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'praxinex',
          text: 'Error connecting to Praxinex engine: ' + err.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: PraxinexAction) => {
    if (action.type === 'navigate' && action.payload?.tab) {
      onNavigateTab(action.payload.tab as ActiveTab);
    } else if (action.type === 'open_case' && action.payload?.caseId) {
      const targetCase = cases.find(c => c.id === action.payload.caseId || c.id.toLowerCase().includes(action.payload.caseId.toLowerCase()));
      if (targetCase) {
        onOpenCase(targetCase);
      }
    } else if (
      (action.type === 'generate_payment_link' || 
       action.type === 'retry_payment' || 
       action.type === 'send_reminder' || 
       action.type === 'escalate') && action.payload?.caseId
    ) {
      const targetCase = cases.find(c => c.id === action.payload.caseId || c.id.toLowerCase().includes(action.payload.caseId.toLowerCase()));
      if (targetCase) {
        onExecuteAction(targetCase);
      }
    } else if (action.type === 'sync_data') {
      onSyncGateway();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="praxinex-workspace">
      {/* Agent Hero Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-bold tracking-tight font-sans text-white">Praxinex AI Agent</h1>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-medium border ${
                  merchant.geminiApiKey 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {merchant.geminiApiKey ? '● Gemini 3.7 Flash Connected' : '● Deterministic Heuristics Active'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                Omniscient revenue recovery copilot. Communicates with your entire database, explains root-cause payment failures, and executes real gateway actions autonomously.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!merchant.geminiApiKey && (
              <button
                onClick={() => onNavigateTab('integrations')}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Add Gemini API Key</span>
              </button>
            )}
            <button
              onClick={() => onSyncGateway()}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl text-xs font-medium transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Razorpay Gateway</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-800/80 font-mono">
          <div>
            <span className="text-[11px] text-neutral-400 block">Active Risk</span>
            <span className="text-lg font-bold text-white">{formatINR(totalAtRisk)}</span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">Recovered Revenue</span>
            <span className="text-lg font-bold text-emerald-400">{formatINR(totalRecovered)}</span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">Recovery Rate</span>
            <span className="text-lg font-bold text-emerald-400">{recoveryRate}%</span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">Active Cases</span>
            <span className="text-lg font-bold text-white">{activeCasesCount} Cases</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Capability Deck & Quick Operations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#EAEAEA]">
              <Cpu className="w-4 h-4 text-neutral-900" />
              <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">Agent Capabilities</h3>
            </div>

            <div className="space-y-3">
              <div 
                onClick={() => handleSendMessage('Generate payment link for Dinesh')}
                className="p-3 bg-[#F8F9FA] hover:bg-neutral-100 border border-[#E7E7E7] rounded-xl cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                  <span className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dispatch Razorpay Payment Link</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Calls Razorpay API to generate a frictionless 1-click dynamic link for customer settlement.
                </p>
              </div>

              <div 
                onClick={() => handleSendMessage('What is our total revenue at risk and which case is largest?')}
                className="p-3 bg-[#F8F9FA] hover:bg-neutral-100 border border-[#E7E7E7] rounded-xl cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                  <span className="flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Analyze Financial Exposure</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Calculates live gross exposure, recovery success velocity, and high-risk case distribution.
                </p>
              </div>

              <div 
                onClick={() => handleSendMessage('Show all high risk cases')}
                className="p-3 bg-[#F8F9FA] hover:bg-neutral-100 border border-[#E7E7E7] rounded-xl cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                  <span className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Filter & Escalate High Risk</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Identifies cases exceeding autonomous safety bounds (e.g. ₹50,000 threshold).
                </p>
              </div>

              <div 
                onClick={() => handleSendMessage('Go to Payments ledger')}
                className="p-3 bg-[#F8F9FA] hover:bg-neutral-100 border border-[#E7E7E7] rounded-xl cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                  <span className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Autonomous Navigation</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Direct navigation and view manipulation via natural language prompts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Praxinex Interactive Terminal */}
        <div className="lg:col-span-7 bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden flex flex-col h-[640px]">
          {/* Terminal Header */}
          <div className="p-3.5 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-neutral-700" />
              <span className="text-xs font-semibold text-neutral-900">Interactive Praxinex Terminal</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">Connected: Razorpay REST Engine</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBFBFB] text-xs">
            {messages.map((msg) => {
              const isAgent = msg.sender === 'praxinex';
              return (
                <div key={msg.id} className={'flex flex-col ' + (isAgent ? 'items-start' : 'items-end')}>
                  <div className={'flex items-start space-x-2.5 max-w-[90%] ' + (isAgent ? 'flex-row' : 'flex-row-reverse space-x-reverse')}>
                    <div className={'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ' + (
                      isAgent 
                        ? 'bg-neutral-900 text-emerald-400 border border-neutral-700 shadow-2xs' 
                        : 'bg-blue-600 text-white'
                    )}>
                      {isAgent ? <Bot className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={'rounded-xl p-4 shadow-2xs ' + (
                      isAgent 
                        ? 'bg-white border border-[#E7E7E7] text-neutral-900' 
                        : 'bg-neutral-900 text-white font-medium'
                    )}>
                      {isAgent && msg.thoughts && msg.thoughts.length > 0 && (
                        <div className="mb-2.5 pb-2 border-b border-neutral-100">
                          <button
                            onClick={() => toggleThoughts(msg.id)}
                            className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Praxinex reasoning ({msg.thoughts.length} steps)</span>
                            {expandedThoughts[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedThoughts[msg.id] && (
                            <div className="mt-1.5 space-y-1 bg-neutral-50 p-2.5 rounded border border-neutral-200/60 font-mono text-[10px] text-neutral-600">
                              {msg.thoughts.map((step, idx) => (
                                <div key={idx} className="flex items-center space-x-1.5">
                                  <span className="text-emerald-600">›</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="leading-relaxed whitespace-pre-line text-xs">
                        {msg.text}
                      </div>

                      {msg.paymentLinkCard && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase font-bold text-blue-700">Razorpay Payment Link</span>
                            <span className="text-xs font-mono font-bold text-neutral-900">{formatINR(msg.paymentLinkCard.amount)}</span>
                          </div>
                          <div className="text-[11px] font-mono text-blue-900 bg-white p-2 rounded border border-blue-100 truncate">
                            {msg.paymentLinkCard.url}
                          </div>
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <a
                              href={msg.paymentLinkCard.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs"
                            >
                              <span>Open Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {msg.caseCards && msg.caseCards.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 block">Related Cases</span>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.caseCards.map((c) => (
                              <div 
                                key={c.id}
                                onClick={() => onOpenCase(c)}
                                className="p-2.5 bg-[#F9FAFB] hover:bg-white border border-[#E7E7E7] hover:border-neutral-400 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                              >
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-[11px] font-medium text-neutral-600">{c.id}</span>
                                    <span className="font-semibold text-neutral-900">{c.customerName}</span>
                                  </div>
                                  <span className="text-[11px] font-mono text-neutral-500">{formatINR(c.amount)} • {c.status}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCase(c);
                                  }}
                                  className="px-2 py-1 bg-white border border-neutral-300 hover:bg-neutral-50 rounded text-[10px] font-medium text-neutral-800"
                                >
                                  Inspect
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                          {msg.actions.map((act) => (
                            <button
                              key={act.id}
                              onClick={() => handleActionClick(act)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 mt-1 px-10">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-emerald-400 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-[#E7E7E7] rounded-xl p-3.5 shadow-2xs flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs text-neutral-600 font-mono">Praxinex is synthesizing platform intelligence...</span>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Input */}
          <div className="p-3.5 bg-white border-t border-[#E7E7E7]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Praxinex any question or execute recovery actions..."
                className="flex-1 text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-xl px-4 py-2.5 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
