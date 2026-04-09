import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Kanban,
  Users,
  Sparkles,
  BarChart3,
  Globe,
  FileText,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  Zap,
  X,
  Bell,
  ArrowLeft,
  Wand2,
} from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { CATEGORIES, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from '../lib/partners.js';

const NAV_ITEMS = [
  { key: 'pipeline', label: 'Pipeline', icon: Kanban },
  { key: 'partners', label: 'Partner Profiles', icon: Users },
  { key: 'outreach', label: 'AI Outreach', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'ai-populate', label: 'AI Populate', icon: Wand2 },
  { key: 'partnership-page', label: 'Partnership Page', icon: Globe },
  { key: 'agreements', label: 'Agreements', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

// Compact floating panel for quick actions
function QuickAddPartnerPanel({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score, setScore] = useState(70);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), category, score, operatingMode: 'FULL', edStatus: true, trtStatus: false, wave: 'W1' });
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#F0F7F2]">Quick Add Partner</span>
        <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]"><X size={14} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[10px] text-[#7DB892] mb-0.5">Company Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm"
            autoFocus
            placeholder="e.g. MedExpress"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[#7DB892] mb-0.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-xs">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#7DB892] mb-0.5">Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value) || 0)}
              className="w-full text-xs font-mono"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium"
        >
          Add Partner
        </button>
      </form>
    </div>
  );
}

function QuickLogActivityPanel({ onClose, partners, onSubmit }) {
  const [partnerId, setPartnerId] = useState('');
  const [type, setType] = useState('Email Sent');
  const [note, setNote] = useState('');
  const TYPES = ['Email Sent', 'Email Received', 'Call', 'Meeting', 'Note', 'LinkedIn', 'Other'];

  const activePartners = partners.filter((p) => !p.archived && !p.notCompatible);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!partnerId || !note.trim()) return;
    onSubmit(partnerId, { type, subject: note.trim() });
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#F0F7F2]">Quick Log Activity</span>
        <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]"><X size={14} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[10px] text-[#7DB892] mb-0.5">Partner *</label>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full text-xs" autoFocus>
            <option value="">Select partner...</option>
            {activePartners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[#7DB892] mb-0.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full text-xs">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[#7DB892] mb-0.5">Note *</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs"
            placeholder="Quick note about the activity..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium"
        >
          Log Activity
        </button>
      </form>
    </div>
  );
}

function QuickOutreachPanel({ onClose, partners, onNavigate }) {
  const [partnerId, setPartnerId] = useState('');
  const activePartners = partners.filter((p) => !p.archived && !p.notCompatible);

  const handleGo = () => {
    if (!partnerId) return;
    onNavigate('outreach', { partnerId });
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#F0F7F2]">Generate Outreach</span>
        <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]"><X size={14} /></button>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className="block text-[10px] text-[#7DB892] mb-0.5">Partner</label>
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full text-xs" autoFocus>
            <option value="">Select partner...</option>
            {activePartners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button
          onClick={handleGo}
          disabled={!partnerId}
          className="w-full py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium disabled:opacity-40"
        >
          Open AI Outreach
        </button>
      </div>
    </div>
  );
}

export default function Layout({
  activeModule,
  onNavigate,
  globalSearch,
  onGlobalSearchChange,
  breadcrumbText,
  onBreadcrumbBack,
  canGoBack,
  onOpenProfile,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [quickAction, setQuickAction] = useState(null); // 'add' | 'log' | 'outreach' | null
  const searchRef = useRef(null);
  const quickActionRef = useRef(null);

  const { partners, addPartner, addInteraction, getOverdueFollowups } = useStore();

  const overdueCount = getOverdueFollowups().length;

  const activeLabel = NAV_ITEMS.find((n) => n.key === activeModule)?.label || 'Pipeline';

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close quick action panel on click outside
  useEffect(() => {
    if (!quickAction) return;
    const handler = (e) => {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target)) {
        setQuickAction(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [quickAction]);

  const handleQuickAddPartner = useCallback((data) => {
    const newPartner = addPartner(data);
    if (onOpenProfile && newPartner) {
      onOpenProfile(newPartner.id);
    }
  }, [addPartner, onOpenProfile]);

  const handleQuickLogActivity = useCallback((partnerId, interaction) => {
    addInteraction(partnerId, interaction);
  }, [addInteraction]);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col border-r border-[#1A3D26] z-40 transition-all duration-200"
        style={{
          width: collapsed ? 56 : 220,
          background: '#070F0A',
        }}
      >
        {/* Wordmark */}
        <div className="px-4 pt-5 pb-1 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="text-[#2ECC71] font-bold text-base tracking-wide">
                TED'S HEALTH
              </div>
              <div className="text-[#7DB892] text-[11px] mt-0.5">White-Label CRM</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-[#0F2318] text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-4 flex flex-col gap-0.5 px-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative ${
                  isActive
                    ? 'text-[#2ECC71] bg-[#0F2318]'
                    : 'text-[#7DB892] hover:text-[#F0F7F2] hover:bg-[#0F2318]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-[#2ECC71]" />
                )}
                <div className="relative">
                  <Icon size={18} />
                  {/* Notification badge for pipeline — overdue follow-ups */}
                  {item.key === 'pipeline' && overdueCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-[#E07B00] text-[8px] font-bold text-white flex items-center justify-center px-0.5">
                      {overdueCount > 9 ? '9+' : overdueCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.key === 'pipeline' && overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[#E07B00] font-mono">
                    <Bell size={10} />
                    {overdueCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Version */}
        {!collapsed && (
          <div className="px-4 py-3 text-[10px] text-[#7DB892] opacity-50">
            v0.2.0 — Command Centre
          </div>
        )}
      </aside>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 56 : 220 }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex flex-col border-b border-[#1A3D26] bg-[#0A1A12]">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              {canGoBack && (
                <button
                  onClick={onBreadcrumbBack}
                  className="p-1 rounded hover:bg-[#0F2318] text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
                  title="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-[#F0F7F2]">{activeLabel}</h1>
                {breadcrumbText && (
                  <div className="text-[10px] text-[#7DB892]/60 font-mono mt-0.5">{breadcrumbText}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search with Cmd+K hint */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7DB892]" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search partners..."
                  value={globalSearch}
                  onChange={(e) => onGlobalSearchChange(e.target.value)}
                  className="pl-9 pr-14 py-1.5 w-64 text-sm rounded-md bg-[#0F2318] border border-[#1A3D26] text-[#F0F7F2] placeholder:text-[#7DB892]/50 focus:border-[#2ECC71] focus:outline-none"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#7DB892]/40 bg-[#0A1A12] border border-[#1A3D26] rounded px-1 py-0.5 font-mono">
                  {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+K
                </kbd>
              </div>
            </div>
          </div>

          {/* Quick Actions bar */}
          <div className="flex items-center gap-2 px-6 pb-2.5 relative" ref={quickActionRef}>
            <button
              onClick={() => setQuickAction(quickAction === 'add' ? null : 'add')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                quickAction === 'add'
                  ? 'bg-[#2ECC71] text-[#0A1A12]'
                  : 'bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2]'
              }`}
            >
              <Plus size={13} /> Add Partner
            </button>
            <button
              onClick={() => setQuickAction(quickAction === 'log' ? null : 'log')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                quickAction === 'log'
                  ? 'bg-[#2ECC71] text-[#0A1A12]'
                  : 'border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40'
              }`}
            >
              <MessageSquare size={13} /> Log Activity
            </button>
            <button
              onClick={() => setQuickAction(quickAction === 'outreach' ? null : 'outreach')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                quickAction === 'outreach'
                  ? 'bg-[#2ECC71] text-[#0A1A12]'
                  : 'border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40'
              }`}
            >
              <Zap size={13} /> Generate Outreach
            </button>

            {/* Overdue indicator in quick bar */}
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 ml-auto text-[10px] text-[#E07B00] font-mono">
                <Bell size={11} className="text-[#E07B00]" />
                {overdueCount} overdue follow-up{overdueCount !== 1 ? 's' : ''}
              </div>
            )}

            {/* Floating panels */}
            {quickAction === 'add' && (
              <QuickAddPartnerPanel
                onClose={() => setQuickAction(null)}
                onSubmit={handleQuickAddPartner}
              />
            )}
            {quickAction === 'log' && (
              <QuickLogActivityPanel
                onClose={() => setQuickAction(null)}
                partners={partners}
                onSubmit={handleQuickLogActivity}
              />
            )}
            {quickAction === 'outreach' && (
              <QuickOutreachPanel
                onClose={() => setQuickAction(null)}
                partners={partners}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
