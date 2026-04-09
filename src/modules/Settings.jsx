import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import storage from '../lib/storage.js';
import { askClaude } from '../lib/ai';
import {
  Settings as SettingsIcon, Eye, EyeOff, Save, Check, Key, Building2, Mail,
  Loader2, AlertTriangle, Users, FileText, MessageSquare, Download, Trash2, Database
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, partners } = useStore();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [saved, setSaved] = useState(false);

  // API test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'error' | null
  const [testError, setTestError] = useState('');

  // Reset state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      setCompanyName(settings.companyName || "Ted's Health Ltd");
      setCompanyNumber(settings.companyNumber || '');
      setRegisteredAddress(settings.registeredAddress || '');
      setContactEmail(settings.contactEmail || 'partnerships@tedshealth.com');
    }
  }, [settings]);

  // Data stats
  const dataStats = useMemo(() => {
    const active = partners.filter(p => !p.archived && !p.notCompatible);
    const totalPartners = partners.length;
    const activePartners = active.length;
    const totalInteractions = partners.reduce((sum, p) => sum + p.interactions.length, 0);
    const agreementsDrafted = partners.filter(p => p.agreementStatus && p.agreementStatus !== 'not-started').length;
    const signed = partners.filter(p => p.pipelineStage === 'signed').length;
    return { totalPartners, activePartners, totalInteractions, agreementsDrafted, signed };
  }, [partners]);

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

  async function handleTestApi() {
    setTesting(true);
    setTestResult(null);
    setTestError('');

    try {
      // Save the key first so askClaude can use it
      updateSettings({ apiKey });
      const result = await askClaude(
        'You are a test assistant.',
        'Reply with exactly: API_OK',
        20
      );
      if (result && result.includes('API_OK')) {
        setTestResult('success');
      } else {
        setTestResult('success'); // Got a response, key works
      }
    } catch (e) {
      setTestResult('error');
      setTestError(e.message);
    } finally {
      setTesting(false);
    }
  }

  function handleExportCSV() {
    const active = partners.filter(p => !p.archived && !p.notCompatible);
    const headers = ['Name', 'Category', 'Operating Mode', 'Score', 'Wave', 'Pipeline Stage', 'Agreement Status', 'Contact Name', 'Contact Email', 'Interactions'];
    const rows = active.map(p => [
      `"${p.name}"`,
      `"${p.category}"`,
      p.operatingMode,
      p.score,
      p.wave,
      p.pipelineStage,
      p.agreementStatus || 'not-started',
      `"${p.contactName || ''}"`,
      `"${p.contactEmail || ''}"`,
      p.interactions.length,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `th-pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetAll() {
    if (resetInput !== 'DELETE') return;
    storage.clear();
    setShowResetConfirm(false);
    setResetInput('');
    window.location.reload();
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
          <p className="text-sm text-[#7DB892]">API configuration, company details, and data management</p>
        </div>
      </div>

      {/* Data Stats */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-[#2ECC71]" />
          <h2 className="text-sm font-semibold text-[#F0F7F2]">Data Overview</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <DataStat label="Partners" value={dataStats.totalPartners} icon={Users} />
          <DataStat label="Active" value={dataStats.activePartners} icon={Users} accent />
          <DataStat label="Interactions" value={dataStats.totalInteractions} icon={MessageSquare} />
          <DataStat label="Agreements" value={dataStats.agreementsDrafted} icon={FileText} />
          <DataStat label="Signed" value={dataStats.signed} icon={Check} accent />
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

        {/* Test API button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestApi}
            disabled={!apiKey || testing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Key size={12} />
                Test API Key
              </>
            )}
          </button>
          {testResult === 'success' && (
            <span className="flex items-center gap-1 text-xs text-[#2ECC71]">
              <Check size={12} />
              API key is valid
            </span>
          )}
          {testResult === 'error' && (
            <span className="flex items-center gap-1 text-xs text-[#C0392B]">
              <AlertTriangle size={12} />
              {testError.length > 60 ? testError.slice(0, 60) + '...' : testError}
            </span>
          )}
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

      {/* Data Management */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-[#7DB892]" />
          <h2 className="text-sm font-semibold text-[#F0F7F2]">Data Management</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
          >
            <Download size={14} />
            Export Pipeline as CSV
          </button>
        </div>

        <div className="pt-3 border-t border-[#1A3D26]">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-[#C0392B]/40 text-[#C0392B] hover:bg-[#C0392B]/10 transition-colors"
            >
              <Trash2 size={14} />
              Reset All Data
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#C0392B]" />
                <span className="text-sm text-[#C0392B] font-medium">This will delete all partners, interactions, and settings.</span>
              </div>
              <p className="text-xs text-[#7DB892]">Type <span className="font-mono text-[#C0392B]">DELETE</span> to confirm.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={resetInput}
                  onChange={e => setResetInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="bg-[#0A1A12] border border-[#C0392B]/40 rounded-md px-3 py-2 text-sm text-[#F0F7F2] font-mono placeholder:text-[#4a7a5a] w-40"
                />
                <button
                  onClick={handleResetAll}
                  disabled={resetInput !== 'DELETE'}
                  className="px-4 py-2 rounded-md text-sm bg-[#C0392B] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#C0392B]/80 transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => { setShowResetConfirm(false); setResetInput(''); }}
                  className="text-xs text-[#7DB892] hover:text-[#F0F7F2] px-2 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataStat({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3 text-center">
      <Icon size={14} className={`mx-auto mb-1 ${accent ? 'text-[#2ECC71]' : 'text-[#7DB892]'}`} />
      <div className={`text-lg font-mono font-semibold ${accent ? 'text-[#2ECC71]' : 'text-[#F0F7F2]'}`}>{value}</div>
      <div className="text-[10px] text-[#7DB892]">{label}</div>
    </div>
  );
}
