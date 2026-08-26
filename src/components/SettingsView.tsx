import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  Download, 
  Check,
  Globe
} from 'lucide-react';
import { MerchantProfile } from '../types';

interface SettingsViewProps {
  merchant: MerchantProfile;
  onUpdateMerchant: (updated: MerchantProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  merchant,
  onUpdateMerchant
}) => {
  const [name, setName] = useState(merchant.name);
  const [email, setEmail] = useState(merchant.email);
  const [businessType, setBusinessType] = useState(merchant.businessType);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMerchant({
      ...merchant,
      name,
      email,
      businessType
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8" id="settings-page-container">
      {/* Title */}
      <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#171717]">Merchant Account Settings</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Organization profile, currency standards, and audit preferences
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-neutral-800 rounded-lg transition-colors shadow-2xs"
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved</span>
            </>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
            <Building2 className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-[#171717]">Organization Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-neutral-800 block mb-1">Company / Merchant Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">Finance Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">Industry / Business Model</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-800 block mb-1">Primary Settlement Currency</label>
                <input
                  type="text"
                  disabled
                  value="INR (₹) — Indian Rupee"
                  className="w-full bg-neutral-100 border border-[#E7E7E7] rounded-lg px-3 py-2 text-neutral-600 font-mono"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Security & Audit exports */}
        <div className="bg-white border border-[#E7E7E7] rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-[#171717]">Audit Logs & Compliance</h3>
          </div>

          <div className="flex items-center justify-between text-xs py-2">
            <div>
              <span className="font-semibold text-neutral-900 block">Export Full Audit Trail</span>
              <span className="text-[#737373] text-[11px]">
                Download ISO-compliant CSV ledger of all AI diagnostic evaluations and retry executions.
              </span>
            </div>
            <button
              onClick={() => alert('Exporting full cryptographic audit trail CSV...')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F8F9FA] hover:bg-neutral-100 border border-[#E7E7E7] rounded-lg text-neutral-800 font-medium text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
