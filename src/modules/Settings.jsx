import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Settings as SettingsIcon, Eye, EyeOff, Save, Check, Key, Building2, Mail } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useStore();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      setCompanyName(settings.companyName || "Ted's Health Ltd");
      setCompanyNumber(settings.companyNumber || '');
      setRegisteredAddress(settings.registeredAddress || '');
      setContactEmail(settings.contactEmail || 'partnerships@tedshealth.com');
    }
  }, [settings]);

  function handleSave() {
    updateSettings({
      apiKey,
      companyName,
      companyNumber,
      registeredAddress,
      contactEmail,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
          <SettingsIcon size={20} className="text-[#2ECC71]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F0F7F2]">Settings</h1>
          <p className="text-sm text-[#7DB892]">API configuration and company details</p>
        </div>
      </div>

      {/* API Key */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-[#2ECC71]" />
          <h2 className="text-sm font-semibold text-[#F0F7F2]">Anthropic API Key</h2>
        </div>
        <p className="text-xs text-[#7DB892]">
          Required for AI Outreach features. Get your key from{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2ECC71] hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 pr-10 text-sm text-[#F0F7F2] font-mono placeholder:text-[#4a7a5a]"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Company Details */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-[#2ECC71]" />
          <h2 className="text-sm font-semibold text-[#F0F7F2]">Ted's Health Company Details</h2>
        </div>
        <p className="text-xs text-[#7DB892]">
          These details are used in generated partnership agreements.
        </p>

        <div>
          <label className="block text-xs text-[#7DB892] mb-1">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Ted's Health Ltd"
            className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a]"
          />
        </div>

        <div>
          <label className="block text-xs text-[#7DB892] mb-1">Company Number</label>
          <input
            type="text"
            value={companyNumber}
            onChange={e => setCompanyNumber(e.target.value)}
            placeholder="e.g. 12345678"
            className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] font-mono placeholder:text-[#4a7a5a]"
          />
        </div>

        <div>
          <label className="block text-xs text-[#7DB892] mb-1">Registered Address</label>
          <textarea
            value={registeredAddress}
            onChange={e => setRegisteredAddress(e.target.value)}
            placeholder="Full registered office address"
            rows={3}
            className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a] resize-none"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-[#2ECC71]" />
          <h2 className="text-sm font-semibold text-[#F0F7F2]">Default Contact Email</h2>
        </div>
        <input
          type="email"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          placeholder="partnerships@tedshealth.com"
          className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a]"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${saved
          ? 'bg-[#2ECC71] text-[#0A1A12]'
          : 'bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white'
          }`}
      >
        {saved ? (
          <>
            <Check size={16} />
            Saved
          </>
        ) : (
          <>
            <Save size={16} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}
