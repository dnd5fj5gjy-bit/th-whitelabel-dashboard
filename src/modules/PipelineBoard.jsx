import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Filter,
  Archive,
  Download,
  ChevronDown,
  GripVertical,
  MessageSquare,
  Eye,
  EyeOff,
  X,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, CATEGORIES, OPERATING_MODES, WAVES } from '../lib/partners.js';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import PartnerProfile from './PartnerProfile.jsx';

// Category color map
const CATEGORY_COLORS = {
  'Telehealth Platform': { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-700/40' },
  'Online Pharmacy': { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700/40' },
  "Men's Health Clinic": { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700/40' },
  'ED Treatment Provider': { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-700/40' },
  'Private GP Service': { bg: 'bg-cyan-900/40', text: 'text-cyan-300', border: 'border-cyan-700/40' },
  'Corporate Health': { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-700/40' },
  'Sexual Health Clinic': { bg: 'bg-pink-900/40', text: 'text-pink-300', border: 'border-pink-700/40' },
};

const MODE_COLORS = {
  FULL: { bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
  PLATFORM: { bg: 'bg-blue-900/50', text: 'text-blue-400' },
  CHECK: { bg: 'bg-amber-900/50', text: 'text-amber-400' },
};

function getDaysSinceLastContact(partner) {
  if (!partner.interactions || partner.interactions.length === 0) return null;
  const sorted = [...partner.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  return differenceInDays(new Date(), new Date(sorted[0].date));
}

function PartnerCard({ partner, selected, onToggleSelect, onClick, onLogActivity, onDragStart, onDragEnd }) {
  const [hovering, setHovering] = useState(false);
  const daysSince = getDaysSinceLastContact(partner);
  const catColor = CATEGORY_COLORS[partner.category] || { bg: 'bg-gray-900/40', text: 'text-gray-300', border: 'border-gray-700/40' };
  const modeColor = MODE_COLORS[partner.operatingMode] || MODE_COLORS.FULL;

  const daysColor = daysSince === null ? 'text-[#7DB892]' : daysSince >= 10 ? 'text-[#C0392B]' : daysSince >= 5 ? 'text-[#E07B00]' : 'text-[#7DB892]';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', partner.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(partner.id);
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${
        partner.archived
          ? 'border-[#1A3D26]/50 bg-[#0F2318]/50 opacity-50'
          : partner.notCompatible
            ? 'border-[#C0392B]/30 bg-[#0F2318]'
            : 'border-[#1A3D26] bg-[#0F2318] hover:border-[#2ECC71]/40'
      } ${selected ? 'ring-1 ring-[#2ECC71]' : ''}`}
    >
      {/* Top row: checkbox + name */}
      <div className="flex items-start gap-2">
        <div className="pt-0.5" style={{ opacity: hovering || selected ? 1 : 0, transition: 'opacity 150ms' }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(partner.id);
            }}
            className="w-3.5 h-3.5 rounded border-[#1A3D26] bg-[#0A1A12] accent-[#2ECC71] cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onClick(partner)}>
          <div className="font-semibold text-[#F0F7F2] text-sm truncate leading-tight">{partner.name}</div>
        </div>
        <GripVertical size={14} className="text-[#1A3D26] flex-shrink-0 mt-0.5" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-2" onClick={() => onClick(partner)}>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor.bg} ${catColor.text}`}>
          {partner.category}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${modeColor.bg} ${modeColor.text}`}>
          {partner.operatingMode}
        </span>
      </div>

      {/* Score bar + Wave */}
      <div className="flex items-center gap-2 mt-2" onClick={() => onClick(partner)}>
        <div className="flex-1 h-1.5 rounded-full bg-[#0A1A12] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${partner.score}%`,
              background: partner.score >= 85 ? '#2ECC71' : partner.score >= 70 ? '#E07B00' : '#C0392B',
            }}
          />
        </div>
        <span className="font-mono text-[11px] text-[#7DB892] flex-shrink-0">{partner.score}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A1A12] text-[#7DB892] font-mono flex-shrink-0">
          {partner.wave}
        </span>
      </div>

      {/* Bottom row: ED/TRT dots, days since contact, log button */}
      <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${partner.edStatus ? 'bg-[#2ECC71]' : 'bg-[#1A3D26]'}`} title={partner.edStatus ? 'ED: Yes' : 'ED: No'} />
          <span className={`w-2 h-2 rounded-full ${partner.trtStatus ? 'bg-blue-400' : 'bg-[#1A3D26]'}`} title={partner.trtStatus ? 'TRT: Yes' : 'TRT: No'} />
          {daysSince !== null && (
            <span className={`text-[10px] font-mono ${daysColor}`}>{daysSince}d ago</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLogActivity(partner);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#7DB892] hover:text-[#2ECC71] hover:bg-[#0A1A12] transition-colors"
        >
          <MessageSquare size={11} />
          Log
        </button>
      </div>
    </div>
  );
}

function AddPartnerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    operatingMode: 'FULL',
    edStatus: true,
    trtStatus: false,
    score: 70,
    wave: 'W1',
    contactName: '',
    contactEmail: '',
    contactJobTitle: '',
    website: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#0F2318] border border-[#1A3D26] rounded-lg w-full max-w-lg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F0F7F2]">Add Partner</h2>
          <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Partner Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Operating Mode</label>
              <select value={form.operatingMode} onChange={(e) => setForm({ ...form, operatingMode: e.target.value })} className="w-full">
                {OPERATING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Score</label>
              <input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })} className="w-full font-mono" />
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Wave</label>
              <select value={form.wave} onChange={(e) => setForm({ ...form, wave: e.target.value })} className="w-full">
                {WAVES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                <input type="checkbox" checked={form.edStatus} onChange={(e) => setForm({ ...form, edStatus: e.target.checked })} className="accent-[#2ECC71]" />
                ED
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                <input type="checkbox" checked={form.trtStatus} onChange={(e) => setForm({ ...form, trtStatus: e.target.checked })} className="accent-[#2ECC71]" />
                TRT
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Contact Name</label>
              <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Job Title</label>
              <input type="text" value={form.contactJobTitle} onChange={(e) => setForm({ ...form, contactJobTitle: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full h-16 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-[#7DB892] hover:text-[#F0F7F2] rounded-md border border-[#1A3D26] hover:border-[#2ECC71]/40">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 text-sm bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium">
              Add Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickLogModal({ partner, onClose, onLog }) {
  const [form, setForm] = useState({
    type: 'Email Sent',
    subject: '',
    outcome: '',
    nextAction: '',
    nextActionDue: '',
  });

  const TYPES = ['Email Sent', 'Email Received', 'Call', 'Meeting', 'Note', 'LinkedIn', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    onLog(partner.id, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#0F2318] border border-[#1A3D26] rounded-lg w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#F0F7F2]">Log Activity — {partner.name}</h2>
          <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Subject *</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full" autoFocus />
          </div>
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Outcome</label>
            <input type="text" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Next Action</label>
              <input type="text" value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Due Date</label>
              <input type="date" value={form.nextActionDue} onChange={(e) => setForm({ ...form, nextActionDue: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-[#7DB892] hover:text-[#F0F7F2] rounded-md border border-[#1A3D26]">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-sm bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium">Log Activity</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkActionBar({ count, onMoveStage, onMoveWave, onArchive, onExport, onClear }) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showWaveMenu, setShowWaveMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0F2318] border border-[#1A3D26] rounded-lg">
      <span className="text-sm text-[#F0F7F2] font-medium">{count} selected</span>
      <div className="h-4 w-px bg-[#1A3D26]" />

      {/* Move to Stage */}
      <div className="relative">
        <button
          onClick={() => { setShowStageMenu(!showStageMenu); setShowWaveMenu(false); }}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#7DB892] hover:text-[#2ECC71] border border-[#1A3D26] rounded-md hover:border-[#2ECC71]/40"
        >
          <ArrowRight size={13} /> Move Stage <ChevronDown size={12} />
        </button>
        {showStageMenu && (
          <div className="absolute top-full left-0 mt-1 bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl py-1 z-50 min-w-[150px]">
            {PIPELINE_STAGES.map((s) => (
              <button key={s} onClick={() => { onMoveStage(s); setShowStageMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#F0F7F2] hover:bg-[#1A6B3C]/30"
              >
                {PIPELINE_STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move to Wave */}
      <div className="relative">
        <button
          onClick={() => { setShowWaveMenu(!showWaveMenu); setShowStageMenu(false); }}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#7DB892] hover:text-[#2ECC71] border border-[#1A3D26] rounded-md hover:border-[#2ECC71]/40"
        >
          Move Wave <ChevronDown size={12} />
        </button>
        {showWaveMenu && (
          <div className="absolute top-full left-0 mt-1 bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl py-1 z-50">
            {WAVES.map((w) => (
              <button key={w} onClick={() => { onMoveWave(w); setShowWaveMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#F0F7F2] hover:bg-[#1A6B3C]/30"
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onArchive} className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#E07B00] hover:text-[#E07B00] border border-[#1A3D26] rounded-md hover:border-[#E07B00]/40">
        <Archive size={13} /> Archive
      </button>
      <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#7DB892] hover:text-[#2ECC71] border border-[#1A3D26] rounded-md hover:border-[#2ECC71]/40">
        <Download size={13} /> Export CSV
      </button>

      <div className="flex-1" />
      <button onClick={onClear} className="text-xs text-[#7DB892] hover:text-[#F0F7F2]">Clear</button>
    </div>
  );
}

export default function PipelineBoard({ globalSearch }) {
  const {
    partners,
    addPartner,
    movePipelineStage,
    addInteraction,
    bulkMoveStage,
    bulkMoveWave,
    bulkArchive,
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [logPartner, setLogPartner] = useState(null);
  const [profilePartner, setProfilePartner] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWave, setFilterWave] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterScoreMin, setFilterScoreMin] = useState('');
  const [filterScoreMax, setFilterScoreMax] = useState('');

  // Apply filters
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (!showArchived && p.archived) return false;
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const match = p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.contactName?.toLowerCase().includes(q) ||
          p.contactEmail?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterWave && p.wave !== filterWave) return false;
      if (filterMode && p.operatingMode !== filterMode) return false;
      if (filterScoreMin && p.score < parseInt(filterScoreMin)) return false;
      if (filterScoreMax && p.score > parseInt(filterScoreMax)) return false;
      return true;
    });
  }, [partners, showArchived, globalSearch, filterCategory, filterWave, filterMode, filterScoreMin, filterScoreMax]);

  // Group by stage
  const columns = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach((s) => (map[s] = []));
    filteredPartners.forEach((p) => {
      if (map[p.pipelineStage]) map[p.pipelineStage].push(p);
    });
    return map;
  }, [filteredPartners]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDrop = useCallback(
    (stage, e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) movePipelineStage(id, stage);
      setDraggingId(null);
      setDragOverStage(null);
    },
    [movePipelineStage]
  );

  const handleExportCSV = useCallback(() => {
    const ids = [...selectedIds];
    const selected = partners.filter((p) => ids.includes(p.id));
    const headers = ['Name', 'Category', 'Mode', 'ED', 'TRT', 'Score', 'Wave', 'Stage', 'Contact', 'Email', 'Website'];
    const rows = selected.map((p) => [
      p.name, p.category, p.operatingMode,
      p.edStatus ? 'Yes' : 'No', p.trtStatus ? 'Yes' : 'No',
      p.score, p.wave, PIPELINE_STAGE_LABELS[p.pipelineStage],
      p.contactName, p.contactEmail, p.website,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partners-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, partners]);

  // Keep profile partner in sync with store
  const currentProfilePartner = profilePartner ? partners.find((p) => p.id === profilePartner.id) || null : null;

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1A3D26] bg-[#0A1A12] flex-shrink-0">
        <Filter size={15} className="text-[#7DB892]" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2]">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterWave} onChange={(e) => setFilterWave(e.target.value)}
          className="text-xs py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2]">
          <option value="">All Waves</option>
          {WAVES.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}
          className="text-xs py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2]">
          <option value="">All Modes</option>
          {OPERATING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <input type="number" placeholder="Min" value={filterScoreMin} onChange={(e) => setFilterScoreMin(e.target.value)}
            className="w-16 text-xs py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2] font-mono" />
          <span className="text-[#7DB892] text-xs">-</span>
          <input type="number" placeholder="Max" value={filterScoreMax} onChange={(e) => setFilterScoreMax(e.target.value)}
            className="w-16 text-xs py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2] font-mono" />
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border transition-colors ${
            showArchived
              ? 'text-[#E07B00] border-[#E07B00]/40 bg-[#E07B00]/10'
              : 'text-[#7DB892] border-[#1A3D26] hover:border-[#2ECC71]/40'
          }`}
        >
          {showArchived ? <Eye size={13} /> : <EyeOff size={13} />}
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium"
        >
          <Plus size={14} /> Add Partner
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-2 flex-shrink-0">
          <BulkActionBar
            count={selectedIds.size}
            onMoveStage={(stage) => { bulkMoveStage([...selectedIds], stage); setSelectedIds(new Set()); }}
            onMoveWave={(wave) => { bulkMoveWave([...selectedIds], wave); setSelectedIds(new Set()); }}
            onArchive={() => { bulkArchive([...selectedIds]); setSelectedIds(new Set()); }}
            onExport={handleExportCSV}
            onClear={() => setSelectedIds(new Set())}
          />
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex gap-3 h-full" style={{ minWidth: PIPELINE_STAGES.length * 260 }}>
          {PIPELINE_STAGES.map((stage) => {
            const cards = columns[stage] || [];
            const isOver = dragOverStage === stage;
            return (
              <div
                key={stage}
                className={`flex flex-col w-[260px] flex-shrink-0 rounded-lg border transition-colors ${
                  isOver ? 'border-[#2ECC71]/50 bg-[#2ECC71]/5' : 'border-[#1A3D26]/50 bg-[#0A1A12]/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(stage, e)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1A3D26]/50">
                  <span className="text-xs font-semibold text-[#F0F7F2] uppercase tracking-wider">
                    {PIPELINE_STAGE_LABELS[stage]}
                  </span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0F2318] text-[#7DB892]">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.map((partner) => (
                    <PartnerCard
                      key={partner.id}
                      partner={partner}
                      selected={selectedIds.has(partner.id)}
                      onToggleSelect={toggleSelect}
                      onClick={(p) => setProfilePartner(p)}
                      onLogActivity={(p) => setLogPartner(p)}
                      onDragStart={(id) => setDraggingId(id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="text-center py-8 text-[#7DB892]/40 text-xs">
                      Drop partners here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => addPartner(data)}
        />
      )}

      {logPartner && (
        <QuickLogModal
          partner={logPartner}
          onClose={() => setLogPartner(null)}
          onLog={(partnerId, interaction) => {
            addInteraction(partnerId, interaction);
            setLogPartner(null);
          }}
        />
      )}

      {/* Partner Profile slide-over */}
      {currentProfilePartner && (
        <PartnerProfile
          partner={currentProfilePartner}
          onClose={() => setProfilePartner(null)}
        />
      )}
    </div>
  );
}
