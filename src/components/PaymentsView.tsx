import React, { useState } from 'react';
import { 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight,
  Filter,
  Download
} from 'lucide-react';
import { PaymentRecord } from '../types';
import { formatINR } from '../utils/formatters';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  onOpenCaseId?: (caseId: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  onOpenCaseId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getPaymentTimestamp = (p: PaymentRecord): number => {
    if (p.isoTimestamp) {
      const t = new Date(p.isoTimestamp).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (p.timestamp) {
      const t = new Date(p.timestamp).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    return 0;
  };

  const filteredPayments = payments
    .filter((p) => {
      const matchesSearch = 
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => getPaymentTimestamp(b) - getPaymentTimestamp(a));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="payments-page-container">
      {/* Header Banner */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Payment Ledger</h2>
          <p className="text-xs text-[#737373]">
            Complete ledger of transactions, retries, and Razorpay gateway captures
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs font-mono text-neutral-600 bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-[#EAEAEA]">
            Total transactions: <strong className="text-neutral-900">{payments.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-payments-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, payment ID, or email..."
            className="w-full text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] font-medium select-none">
                <th className="py-3 px-5">Payment ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Failure Code</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-5 text-right">Agent Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredPayments.map((p) => {
                const isSucceeded = p.status === 'succeeded';

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono text-[11px] text-neutral-700 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{p.razorpayPaymentId}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#171717]">
                      <div>
                        <span className="font-semibold text-neutral-900">{p.customerName}</span>
                        <span className="block text-[11px] text-[#737373]">{p.customerEmail}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-[#171717]">
                      {formatINR(p.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700 text-xs">
                      {p.method}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                          isSucceeded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSucceeded ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        ></span>
                        <span className="capitalize">{p.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {p.failureReason || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-[#737373] font-mono">
                      {p.timestamp}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono text-[11px]">
                      {p.recoveredByAgent ? (
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Agent Recovered
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
