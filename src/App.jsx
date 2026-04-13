import { useState, useCallback, useMemo, Component } from 'react';

// Error boundary to prevent blank screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Dashboard error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#0A1A12', minHeight: '100vh', color: '#F0F7F2', fontFamily: 'DM Sans, sans-serif' }}>
          <h2 style={{ color: '#C0392B', marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#7DB892', fontSize: 14, marginBottom: 20 }}>{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ padding: '8px 20px', background: '#1A6B3C', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { StoreProvider, useStore } from './hooks/useStore.jsx';
import Layout from './components/Layout.jsx';
import PipelineBoard from './modules/PipelineBoard.jsx';
import AIOutreach from './modules/AIOutreach.jsx';
import Analytics from './modules/Analytics.jsx';
import PartnershipPage from './modules/PartnershipPage.jsx';
import AgreementHub from './modules/AgreementHub.jsx';
import AIPopulate from './modules/AIPopulate.jsx';
import Settings from './modules/Settings.jsx';
import PartnerProfile from './modules/PartnerProfile.jsx';
import { Lock, Search, Users, Mail, Phone, ExternalLink, Sparkles } from 'lucide-react';
import { CATEGORIES } from './lib/partners.js';

const PASSWORD = 'TH';

const CATEGORY_COLORS = {
  'Telehealth Platform': '#3B82F6',
  'Online Pharmacy': '#10B981',
  "Men's Health Clinic": '#8B5CF6',
  'ED Treatment Provider': '#EC4899',
  'Private GP Service': '#F59E0B',
  'Corporate Health': '#06B6D4',
  'Sexual Health Clinic': '#EF4444',
};

function PartnerListView({ partners, onOpenProfile, onNavigate }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWave, setFilterWave] = useState('');

  const activePartners = useMemo(() =>
    partners.filter(p => !p.archived),
    [partners]
  );

  const filtered = useMemo(() => {
    let list = activePartners;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.contactName || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) list = list.filter(p => p.category === filterCategory);
    if (filterWave) list = list.filter(p => String(p.wave) === filterWave);
    return list.sort((a, b) => b.score - a.score);
  }, [activePartners, search, filterCategory, filterWave]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
          <Users size={20} className="text-[#2ECC71]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F0F7F2]">Partner Profiles</h1>
          <p className="text-sm text-[#7DB892]">{activePartners.length} partners in pipeline</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7DB892]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[#0A1A12] border border-[#1A3D26]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="text-sm bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterWave}
          onChange={e => setFilterWave(e.target.value)}
          className="text-sm bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2"
        >
          <option value="">All Waves</option>
          <option value="1">Wave 1</option>
          <option value="2">Wave 2</option>
          <option value="3">Wave 3</option>
        </select>
      </div>

      {/* Partner list */}
      <div className="space-y-1.5">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onOpenProfile(p.id)}
            className="w-full text-left rounded-lg border border-[#1A3D26] bg-[#0F2318] hover:border-[#1A6B3C]/50 transition-all px-4 py-3 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#F0F7F2]">{p.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[p.category]}20`, color: CATEGORY_COLORS[p.category] }}>
                  {p.category}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                  p.operatingMode === 'FULL' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' :
                  p.operatingMode === 'PLATFORM' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                  'bg-[#E07B00]/10 text-[#E07B00]'
                }`}>
                  {p.operatingMode}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0A1A12] text-[#7DB892] font-mono">W{p.wave}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#7DB892]">
                {p.contactName && <span className="flex items-center gap-1"><Users size={10} />{p.contactName}</span>}
                {p.contactEmail && <span className="flex items-center gap-1"><Mail size={10} />{p.contactEmail}</span>}
                <span className="capitalize">{p.pipelineStage.replace('-', ' ')}</span>
                <span>{p.interactions.length} interactions</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[#2ECC71]">{p.score}</div>
                <div className="text-[9px] text-[#7DB892]">Score</div>
              </div>
              <div className="flex gap-1.5">
                {p.edStatus && <span className="w-2 h-2 rounded-full bg-[#3B82F6]" title="ED" />}
                {p.trtStatus && <span className="w-2 h-2 rounded-full bg-[#2ECC71]" title="TRT" />}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#7DB892] text-sm">
            No partners match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem('th:auth', '1');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1A12]">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-[#2ECC71] font-bold text-2xl tracking-wide mb-1">TED'S HEALTH</div>
          <div className="text-[#7DB892] text-sm">White-Label Partner Command Centre</div>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#0F2318] border border-[#1A3D26] rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0A1A12] border border-[#1A3D26] flex items-center justify-center">
              <Lock size={18} className="text-[#7DB892]" />
            </div>
          </div>
          <label className="block text-xs text-[#7DB892] mb-1.5 text-center">Enter password to continue</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={`w-full text-center text-lg tracking-widest mb-3 ${error ? 'border-[#C0392B] shake' : ''}`}
            autoFocus
            placeholder="..."
          />
          <button
            type="submit"
            className="w-full py-2 bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium text-sm transition-colors"
          >
            Unlock
          </button>
          {error && <div className="text-[#C0392B] text-xs text-center mt-2">Wrong password</div>}
        </form>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            50% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
          }
          .shake { animation: shake 300ms ease-in-out; }
        `}</style>
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeModule, setActiveModule] = useState('pipeline');
  const [moduleParams, setModuleParams] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Breadcrumb history for navigation
  const [breadcrumbs, setBreadcrumbs] = useState([{ module: 'pipeline', label: 'Pipeline', params: null }]);

  // Lifted partner profile state — accessible from ANY module
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  const { partners } = useStore();
  const selectedPartner = useMemo(
    () => (selectedPartnerId ? partners.find((p) => p.id === selectedPartnerId) || null : null),
    [selectedPartnerId, partners]
  );

  const handleNavigate = useCallback((module, params = null) => {
    // If navigating to 'partners' with a partnerId, open the partner profile slide-over
    if (module === 'partners' && params?.partnerId) {
      setSelectedPartnerId(params.partnerId);
      const partner = partners.find((p) => p.id === params.partnerId);
      // Stay on partners module to show the list
      setActiveModule('partners');
      setModuleParams(params);
      setBreadcrumbs((prev) => [
        ...prev,
        { module: 'partners', label: `Partners > ${partner?.name || 'Partner'}`, params },
      ]);
      return;
    }

    setActiveModule(module);
    setModuleParams(params);

    // Build breadcrumb label
    const MODULE_LABELS = {
      pipeline: 'Pipeline',
      partners: 'Partner Profiles',
      outreach: 'AI Outreach',
      analytics: 'Analytics',
      'ai-populate': 'AI Command Centre',
      'partnership-page': 'Partnership Page',
      agreements: 'Agreements',
      settings: 'Settings',
    };
    const label = MODULE_LABELS[module] || module;
    setBreadcrumbs((prev) => {
      // If navigating to an already-visited module, trim back to it
      const existingIdx = prev.findIndex((b) => b.module === module && !params);
      if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
      return [...prev, { module, label, params }];
    });
  }, [partners]);

  const handleBreadcrumbBack = useCallback(() => {
    if (breadcrumbs.length <= 1) return;
    const prev = breadcrumbs[breadcrumbs.length - 2];
    setActiveModule(prev.module);
    setModuleParams(prev.params);
    setBreadcrumbs((b) => b.slice(0, -1));
  }, [breadcrumbs]);

  const openPartnerProfile = useCallback((partnerId) => {
    setSelectedPartnerId(partnerId);
  }, []);

  const closePartnerProfile = useCallback(() => {
    setSelectedPartnerId(null);
  }, []);

  const renderModule = useCallback(() => {
    switch (activeModule) {
      case 'pipeline':
        return (
          <PipelineBoard
            globalSearch={globalSearch}
            onNavigate={handleNavigate}
            onOpenProfile={openPartnerProfile}
          />
        );
      case 'partners':
        return (
          <PartnerListView
            partners={partners}
            onOpenProfile={openPartnerProfile}
            onNavigate={handleNavigate}
          />
        );
      case 'outreach':
        return <AIOutreach params={moduleParams} onNavigate={handleNavigate} />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      case 'ai-populate':
        return <AIPopulate onNavigate={handleNavigate} />;
      case 'partnership-page':
        return <PartnershipPage />;
      case 'agreements':
        return <AgreementHub params={moduleParams} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <PipelineBoard
            globalSearch={globalSearch}
            onNavigate={handleNavigate}
            onOpenProfile={openPartnerProfile}
          />
        );
    }
  }, [activeModule, globalSearch, moduleParams, handleNavigate, openPartnerProfile]);

  // Current breadcrumb text
  const breadcrumbText = useMemo(() => {
    if (breadcrumbs.length <= 1) return '';
    return breadcrumbs.map((b) => b.label).join(' > ');
  }, [breadcrumbs]);

  return (
    <Layout
      activeModule={activeModule}
      onNavigate={handleNavigate}
      globalSearch={globalSearch}
      onGlobalSearchChange={setGlobalSearch}
      breadcrumbText={breadcrumbText}
      onBreadcrumbBack={handleBreadcrumbBack}
      canGoBack={breadcrumbs.length > 1}
      onOpenProfile={openPartnerProfile}
    >
      {renderModule()}

      {/* Global partner profile slide-over — accessible from any module */}
      {selectedPartner && (
        <PartnerProfile
          partner={selectedPartner}
          onClose={closePartnerProfile}
          onNavigate={handleNavigate}
        />
      )}
    </Layout>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('th:auth') === '1');

  if (!authed) {
    return <PasswordGate onUnlock={() => setAuthed(true)} />;
  }

  return (
    <ErrorBoundary>
      <StoreProvider>
        <Dashboard />
      </StoreProvider>
    </ErrorBoundary>
  );
}
