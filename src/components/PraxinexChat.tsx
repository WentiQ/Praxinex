import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard, 
  ShieldAlert, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap
} from 'lucide-react';
import { RecoveryCase, MerchantProfile, ActiveTab, PraxinexMessage, PraxinexAction } from '../types';
import { formatINR } from '../utils/formatters';

interface PraxinexChatProps {
  isOpen: boolean;
  onClose: () => void;
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

const DEFAULT_PROMPTS = [
  'Schedule optimal-timing retry for pending cases',
  'Repair mandate for lapsed subscriptions',
  'Generate payment link for Dinesh',
  'Run all due scheduled retries now',
  'What is our total revenue at risk?',
  'Why did case RC-SUB-1082 fail?'
];

export const PraxinexChat: React.FC<PraxinexChatProps> = ({
  isOpen,
  onClose,
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
      id: 'init-1',
      sender: 'praxinex',
      text: 'Hello! I am **Praxinex**, your autonomous AI Revenue Recovery Agent.\n\nI have real-time access to your Razorpay gateway, invoices, customer histories, and recovery policies. You can ask me any doubt about your data, or instruct me to execute any recovery action across the platform.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thoughts: ['Connected to Razorpay live gateway store', 'Indexed recovery cases & financial metrics']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
          text: data.reply || 'Task processed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          thoughts: data.thoughts,
          actions: data.actions,
          caseCards: data.caseCards,
          paymentLinkCard: data.paymentLinkCard,
          mandateRepairCard: data.mandateRepairCard,
          scheduledRetryCard: data.scheduledRetryCard,
          metricsHighlight: data.metricsHighlight
        };

        setMessages(prev => [...prev, agentMessage]);

        // If the agent performed any mutation or created cards, trigger instant platform sync
        if (data.hasMutations || data.paymentLinkCard || data.mandateRepairCard || data.scheduledRetryCard) {
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
            text: 'Apologies, I encountered an issue: ' + (data.error || 'Unable to complete request'),
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
          text: 'Network error connecting to Praxinex reasoning core: ' + err.message,
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

  if (!isOpen) return null;

  return (
    <div 
      className={'fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white border border-[#E7E7E7] ' + (
        isExpandedFull 
          ? 'inset-4 rounded-2xl' 
          : 'bottom-6 right-6 w-[440px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)] rounded-2xl'
      )}
      id="praxinex-chat-drawer"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#EAEAEA] bg-gradient-to-r from-neutral-900 to-neutral-950 text-white rounded-t-2xl flex items-center justify-between select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white tracking-tight font-sans">Praxinex AI Agent</h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                merchant.geminiApiKey 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {merchant.geminiApiKey ? 'Gemini 3.7 Flash' : 'Deterministic Core'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Omniscient Platform Assistant</span>
              {!merchant.geminiApiKey && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('integrations');
                  }}
                  className="text-[10px] text-emerald-400 underline hover:text-emerald-300 ml-1 cursor-pointer"
                >
                  + Add Gemini Key
                </button>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpandedFull(!isExpandedFull)}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={isExpandedFull ? 'Minimize' : 'Expand full screen'}
          >
            {isExpandedFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Praxinex"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBFBFB] text-xs">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'praxinex';
          return (
            <div 
              key={msg.id}
              className={'flex flex-col ' + (isAgent ? 'items-start' : 'items-end')}
            >
              <div className={'flex items-start space-x-2 max-w-[92%] ' + (isAgent ? 'flex-row' : 'flex-row-reverse space-x-reverse')}>
                {/* Avatar */}
                <div className={'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ' + (
                  isAgent 
                    ? 'bg-neutral-900 text-emerald-400 border border-neutral-700 shadow-2xs' 
                    : 'bg-blue-600 text-white'
                )}>
                  {isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className={'rounded-xl p-3.5 shadow-2xs ' + (
                  isAgent 
                    ? 'bg-white border border-[#E7E7E7] text-neutral-900' 
                    : 'bg-neutral-900 text-white font-medium'
                )}>
                  {/* Thinking Steps Accordion */}
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
                        <div className="mt-1.5 space-y-1 bg-neutral-50 p-2 rounded border border-neutral-200/60 font-mono text-[10px] text-neutral-600">
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

                  {/* Message Content */}
                  <div className="leading-relaxed whitespace-pre-line text-xs">
                    {msg.text}
                  </div>

                  {/* Payment Link Card */}
                  {msg.paymentLinkCard && (
                    <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase font-bold text-blue-700">
                          {msg.paymentLinkCard.url.includes('rzp.io') ? 'Razorpay Official Link' : 'Razorpay Payment Link'}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-900">{formatINR(msg.paymentLinkCard.amount)}</span>
                      </div>
                      <div className="text-[11px] font-mono text-blue-900 bg-white p-2 rounded border border-blue-100 truncate">
                        {msg.paymentLinkCard.url}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-blue-700 font-mono">
                          Dispatched via Email & SMS
                        </span>
                        <a
                          href={msg.paymentLinkCard.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Mandate Repair Card */}
                  {msg.mandateRepairCard && (
                    <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">
                            Subscription Mandate Repair (Card Autopay)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-950">{formatINR(msg.mandateRepairCard.amount)}</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-snug">
                        {msg.mandateRepairCard.instructions || 'Customer can update recurring debit/credit card without re-subscribing.'}
                      </p>
                      <div className="text-[11px] font-mono text-emerald-900 bg-white p-2 rounded border border-emerald-200 truncate">
                        {msg.mandateRepairCard.repairUrl}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-700 font-mono">
                          Card network update active
                        </span>
                        <a
                          href={msg.mandateRepairCard.repairUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors shadow-2xs"
                        >
                          <span>Open Repair Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Retry Card */}
                  {msg.scheduledRetryCard && (
                    <div className="mt-3 p-3 bg-purple-50/80 border border-purple-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-700" />
                          <span className="text-[10px] font-mono uppercase font-bold text-purple-800">
                            Optimal Bank Window Scheduled
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">
                          {msg.scheduledRetryCard.peakSuccessRate}% Peak Rate
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-snug">
                        {msg.scheduledRetryCard.windowReason}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-purple-700 font-mono font-semibold">
                          Target: {msg.scheduledRetryCard.scheduledAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            fetch('/api/dunning/execute-scheduled', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ caseId: msg.scheduledRetryCard?.caseId })
                            }).then(() => onSyncGateway());
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-medium cursor-pointer shadow-2xs"
                        >
                          <Zap className="w-3 h-3 fill-current text-amber-300" />
                          <span>Run Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Case Cards */}
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

                  {/* Actions Proposed */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                      {msg.actions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] font-mono text-neutral-400 mt-1 px-8">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-md bg-neutral-900 text-emerald-400 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-[#E7E7E7] rounded-xl p-3 shadow-2xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-neutral-600 font-mono">Praxinex is reasoning...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-3 py-2 bg-white border-t border-[#EAEAEA] flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {DEFAULT_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(promptText)}
            className="text-[11px] whitespace-nowrap bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-full transition-colors shrink-0 cursor-pointer"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-[#E7E7E7] rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            id="praxinex-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Praxinex or execute recovery actions..."
            className="flex-1 text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-xl px-3.5 py-2.5 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
