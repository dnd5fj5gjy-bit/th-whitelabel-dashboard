import { useState } from 'react';
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
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'pipeline', label: 'Pipeline', icon: Kanban },
  { key: 'partners', label: 'Partner Profiles', icon: Users },
  { key: 'outreach', label: 'AI Outreach', icon: Sparkles },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'partnership-page', label: 'Partnership Page', icon: Globe },
  { key: 'agreements', label: 'Agreements', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ activeModule, onNavigate, globalSearch, onGlobalSearchChange, children }) {
  const [collapsed, setCollapsed] = useState(false);

  const activeLabel = NAV_ITEMS.find((n) => n.key === activeModule)?.label || 'Pipeline';

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
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Version */}
        {!collapsed && (
          <div className="px-4 py-3 text-[10px] text-[#7DB892] opacity-50">
            v0.1.0 — Command Centre
          </div>
        )}
      </aside>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 56 : 220 }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-[#1A3D26] bg-[#0A1A12]">
          <h1 className="text-lg font-semibold text-[#F0F7F2]">{activeLabel}</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7DB892]" />
            <input
              type="text"
              placeholder="Search partners..."
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-64 text-sm rounded-md bg-[#0F2318] border border-[#1A3D26] text-[#F0F7F2] placeholder:text-[#7DB892]/50 focus:border-[#2ECC71] focus:outline-none"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
