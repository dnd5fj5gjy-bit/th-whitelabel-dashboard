import { useState, useCallback, useMemo } from 'react';
import { StoreProvider, useStore } from './hooks/useStore.jsx';
import Layout from './components/Layout.jsx';
import PipelineBoard from './modules/PipelineBoard.jsx';
import AIOutreach from './modules/AIOutreach.jsx';
import Analytics from './modules/Analytics.jsx';
import PartnershipPage from './modules/PartnershipPage.jsx';
import AgreementHub from './modules/AgreementHub.jsx';
import Settings from './modules/Settings.jsx';
import PartnerProfile from './modules/PartnerProfile.jsx';
import { Lock } from 'lucide-react';

const PASSWORD = 'BW';

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
    // If navigating to 'partners' with a partnerId, open pipeline with that partner's profile
    if (module === 'partners' && params?.partnerId) {
      setActiveModule('pipeline');
      setModuleParams(null);
      setSelectedPartnerId(params.partnerId);
      const partner = partners.find((p) => p.id === params.partnerId);
      setBreadcrumbs((prev) => [
        ...prev,
        { module: 'pipeline', label: `Pipeline > ${partner?.name || 'Partner'}`, params: null },
      ]);
      return;
    }

    setActiveModule(module);
    setModuleParams(params);

    // Build breadcrumb label
    const MODULE_LABELS = {
      pipeline: 'Pipeline',
      outreach: 'AI Outreach',
      analytics: 'Analytics',
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
      case 'outreach':
        return <AIOutreach params={moduleParams} onNavigate={handleNavigate} />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
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
    <StoreProvider>
      <Dashboard />
    </StoreProvider>
  );
}
