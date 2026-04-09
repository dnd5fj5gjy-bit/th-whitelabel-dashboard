import { useState, useCallback } from 'react';
import { StoreProvider } from './hooks/useStore.jsx';
import Layout from './components/Layout.jsx';
import PipelineBoard from './modules/PipelineBoard.jsx';
import AIOutreach from './modules/AIOutreach.jsx';
import Analytics from './modules/Analytics.jsx';
import PartnershipPage from './modules/PartnershipPage.jsx';
import AgreementHub from './modules/AgreementHub.jsx';
import Settings from './modules/Settings.jsx';
import { Lock } from 'lucide-react';

const PASSWORD = 'BW';

function PlaceholderModule({ name }) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-53px)]">
      <div className="text-center">
        <div className="text-[#7DB892] text-sm mb-1">Module</div>
        <div className="text-[#F0F7F2] text-xl font-semibold">{name}</div>
        <div className="text-[#7DB892]/50 text-xs mt-2">Coming soon</div>
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

  const handleNavigate = useCallback((module, params = null) => {
    setActiveModule(module);
    setModuleParams(params);
  }, []);

  const renderModule = useCallback(() => {
    switch (activeModule) {
      case 'pipeline':
        return <PipelineBoard globalSearch={globalSearch} onNavigate={handleNavigate} />;
      case 'partners':
        return <PlaceholderModule name="Partner Profiles" />;
      case 'outreach':
        return <AIOutreach params={moduleParams} />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      case 'partnership-page':
        return <PartnershipPage />;
      case 'agreements':
        return <AgreementHub />;
      case 'settings':
        return <Settings />;
      default:
        return <PipelineBoard globalSearch={globalSearch} onNavigate={handleNavigate} />;
    }
  }, [activeModule, globalSearch, moduleParams, handleNavigate]);

  return (
    <Layout
      activeModule={activeModule}
      onNavigate={handleNavigate}
      globalSearch={globalSearch}
      onGlobalSearchChange={setGlobalSearch}
    >
      {renderModule()}
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
