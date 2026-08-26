import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  ShieldCheck, 
  ArrowUpRight, 
  CreditCard, 
  History,
  Phone,
  Mail
} from 'lucide-react';
import { CustomerRecord } from '../types';
import { formatINR } from '../utils/formatters';

interface CustomersViewProps {
  customers: CustomerRecord[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" id="customers-page-container">
      {/* Header */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Customer Directory</h2>
          <p className="text-xs text-[#737373]">
            Historical payment health, recovery track record, and customer lifetime value (CLV)
          </p>
        </div>

        <div className="text-xs font-mono text-neutral-600 bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-[#EAEAEA]">
          Tracked profiles: <strong className="text-neutral-900">{customers.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full text-xs bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg pl-9 pr-3 py-2 text-[#171717] focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#737373] font-medium select-none">
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4">Successful</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Recovered</th>
                <th className="py-3 px-4">Risk Profile</th>
                <th className="py-3 px-5 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredCustomers.map((cust) => {
                const isLow = cust.riskCategory === 'Low Risk';
                const isHigh = cust.riskCategory === 'High Risk';

                return (
                  <tr key={cust.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#171717]">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                          {cust.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-neutral-900">{cust.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#737373] font-mono text-[11px]">
                      <div>{cust.email}</div>
                      <div className="text-neutral-500">{cust.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                      {formatINR(cust.lifetimeValue)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-800 font-medium">
                      {cust.successfulTransactions} txns
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-700">
                      {cust.failedTransactions}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                      {cust.recoveredTransactions} (100%)
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                          isLow
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isHigh
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {cust.riskCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono text-[11px] text-[#737373]">
                      {cust.lastSeen}
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
