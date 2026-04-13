import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  Filter,
  Archive,
  Download,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MessageSquare,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  Check,
  Undo2,
} from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, CATEGORIES, OPERATING_MODES, WAVES, PRIORITIES, PRIORITY_LABELS, PRIORITY_COLORS } from '../lib/partners.js';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

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

const EMPTY_STATE_MESSAGES = {
  identified: 'Drag partners here or click + to add new ones',
  contacted: 'Partners you\'ve reached out to appear here',
  replied: 'Partners who responded to your outreach',
  'call-booked': 'Partners with scheduled discovery calls',
  'proposal-sent': 'Partners who received your proposal',
  negotiating: 'Active negotiations with partners',
  signed: 'Signed partnerships — congrats!',
  dead: 'Partners that didn\'t work out',
};

function getDaysSinceLastContact(partner) {
  if (!partner.interactions || partner.interactions.length === 0) return null;
  const sorted = [...partner.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  return differenceInDays(new Date(), new Date(sorted[0].date));
}

// Inline quick log form that slides out from the card
function InlineQuickLog({ partner, onLog, onClose }) {
  const [type, setType] = useState('Email Sent');
  const [note, setNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDue, setNextActionDue] = useState('');
  const inputRef = useRef(null);

  const TYPES = ['Email Sent', 'Email Received', 'Call', 'Meeting', 'Note', 'LinkedIn', 'Other'];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    onLog(partner.id, {
      type,
      subject: note.trim(),
      ...(showDetails && outcome ? { outcome } : {}),
      ...(showDetails && nextAction ? { nextAction } : {}),
      ...(showDetails && nextActionDue ? { nextActionDue } : {}),
    });
    onClose();
  };

  return (
    <div
      className="mt-2 bg-[#0A1A12] border border-[#2ECC71]/30 rounded-lg p-2.5 space-y-2"
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-[10px] py-1 px-1.5 bg-[#0F2318] border border-[#1A3D26] rounded text-[#F0F7F2] flex-shrink-0"
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            ref={inputRef}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Quick note..."
            className="flex-1 text-[11px] py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded text-[#F0F7F2] placeholder:text-[#7DB892]/40"
          />
        </div>
        {showDetails && (
          <div className="space-y-1.5">
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Outcome..."
              className="w-full text-[10px] py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded text-[#F0F7F2] placeholder:text-[#7DB892]/40"
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Next action..."
                className="flex-1 text-[10px] py-1 px-2 bg-[#0F2318] border border-[#1A3D26] rounded text-[#F0F7F2] placeholder:text-[#7DB892]/40"
              />
              <input
                type="date"
                value={nextActionDue}
                onChange={(e) => setNextActionDue(e.target.value)}
                className="text-[10px] py-1 px-1.5 bg-[#0F2318] border border-[#1A3D26] rounded text-[#F0F7F2]"
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] text-[#7DB892] hover:text-[#2ECC71]"
          >
            {showDetails ? 'Less details' : '+ Add details'}
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-0.5 text-[10px] text-[#7DB892] hover:text-[#F0F7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[10px] bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded font-medium"
            >
              Log
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Context menu for inline stage change
function StageContextMenu({ x, y, partner, onMove, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[#0F2318] border border-[#1A3D26] rounded-lg shadow-xl py-1 z-[60] min-w-[150px]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[10px] text-[#7DB892] uppercase tracking-wider border-b border-[#1A3D26]">
        Move to stage
      </div>
      {PIPELINE_STAGES.map((s) => (
        <button
          key={s}
          onClick={() => { onMove(partner.id, s); onClose(); }}
          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
            s === partner.pipelineStage
              ? 'text-[#2ECC71] bg-[#2ECC71]/10'
              : 'text-[#F0F7F2] hover:bg-[#1A6B3C]/30'
          }`}
        >
          {PIPELINE_STAGE_LABELS[s]}
          {s === partner.pipelineStage && <Check size={11} className="inline ml-2" />}
        </button>
      ))}
    </div>
  );
}

function PartnerCard({ partner, selected, onToggleSelect, onClick, onLogActivity, onDragStart, onDragEnd, showInlineLog, onToggleInlineLog, onLogSubmit, onContextMenu }) {
  const daysSince = getDaysSinceLastContact(partner);
  const catColor = CATEGORY_COLORS[partner.category] || { bg: 'bg-gray-900/40', text: 'text-gray-300', border: 'border-gray-700/40' };
  const modeColor = MODE_COLORS[partner.operatingMode] || MODE_COLORS.FULL;

  const daysColor = daysSince === null ? 'text-[#7DB892]' : daysSince >= 10 ? 'text-[#C0392B]' : daysSince >= 5 ? 'text-[#E07B00]' : 'text-[#7DB892]';

  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, partner);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', partner.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(partner.id);
      }}
      onDragEnd={onDragEnd}
      onContextMenu={handleContextMenu}
      className={`rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all duration-150 ${
        partner.archived
          ? 'border-[#1A3D26]/50 bg-[#0F2318]/50 opacity-50'
          : partner.notCompatible
            ? 'border-[#C0392B]/30 bg-[#0F2318]'
            : 'border-[#1A3D26] bg-[#0F2318] hover:border-[#2ECC71]/40'
      } ${selected ? 'ring-1 ring-[#2ECC71]' : ''}`}
    >
      {/* Top row: checkbox + name — checkbox always visible */}
      <div className="flex items-start gap-2">
        <div className="pt-0.5">
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
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onClick(partner)}>
          <div className="font-semibold text-[#F0F7F2] text-sm truncate leading-tight">{partner.name}</div>
        </div>
        <GripVertical size={14} className="text-[#1A3D26] flex-shrink-0 mt-0.5" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-2 cursor-pointer" onClick={() => onClick(partner)}>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor.bg} ${catColor.text}`}>
          {partner.category}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${modeColor.bg} ${modeColor.text}`}>
          {partner.operatingMode}
        </span>
        {partner.priority && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: PRIORITY_COLORS[partner.priority] }}
          >
            {partner.priority === 'Warm Lead' ? 'WL' : partner.priority}
          </span>
        )}
      </div>

      {/* Score bar + Wave */}
      <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => onClick(partner)}>
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
            onToggleInlineLog(partner.id);
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
            showInlineLog
              ? 'text-[#2ECC71] bg-[#2ECC71]/10'
              : 'text-[#7DB892] hover:text-[#2ECC71] hover:bg-[#0A1A12]'
          }`}
        >
          <MessageSquare size={11} />
          Log
        </button>
      </div>

      {/* Inline quick log form */}
      {showInlineLog && (
        <InlineQuickLog
          partner={partner}
          onLog={onLogSubmit}
          onClose={() => onToggleInlineLog(null)}
        />
      )}
    </div>
  );
}

function AddPartnerModal({ onClose, onAdd }) {
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    score: 70,
    operatingMode: 'FULL',
    edStatus: true,
    trtStatus: false,
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
        className="bg-[#0F2318] border border-[#1A3D26] rounded-lg w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F0F7F2]">Add Partner</h2>
          <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Required: 3 fields only */}
          <div>
            <label className="block text-xs text-[#7DB892] mb-1">Company Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full"
              autoFocus
              placeholder="e.g. The Independent Pharmacy"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Score *</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })}
                className="w-full font-mono"
              />
            </div>
          </div>

          {/* Expandable section */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-xs text-[#7DB892] hover:text-[#2ECC71] w-full py-1"
          >
            {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showMore ? 'Less details' : 'Add more details'}
          </button>

          {showMore && (
            <div className="space-y-3 pt-1 border-t border-[#1A3D26]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#7DB892] mb-1">Operating Mode</label>
                  <select value={form.operatingMode} onChange={(e) => setForm({ ...form, operatingMode: e.target.value })} className="w-full">
                    {OPERATING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7DB892] mb-1">Wave</label>
                  <select value={form.wave} onChange={(e) => setForm({ ...form, wave: e.target.value })} className="w-full">
                    {WAVES.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                  <input type="checkbox" checked={form.edStatus} onChange={(e) => setForm({ ...form, edStatus: e.target.checked })} className="accent-[#2ECC71]" />
                  ED
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                  <input type="checkbox" checked={form.trtStatus} onChange={(e) => setForm({ ...form, trtStatus: e.target.checked })} className="accent-[#2ECC71]" />
                  TRT
                </label>
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
            </div>
          )}

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

// Toast notification for stage changes
function StageChangeToast({ partnerName, stageName, onUndo, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2.5 bg-[#0F2318] border border-[#2ECC71]/40 rounded-lg shadow-xl animate-toast-in">
      <Check size={14} className="text-[#2ECC71] flex-shrink-0" />
      <span className="text-sm text-[#F0F7F2]">
        Moved <span className="font-semibold">{partnerName}</span> to <span className="text-[#2ECC71]">{stageName}</span>
      </span>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 px-2 py-0.5 text-xs text-[#E07B00] hover:text-[#F0F7F2] border border-[#E07B00]/40 rounded hover:bg-[#E07B00]/10"
      >
        <Undo2 size={11} /> Undo
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-toast-in { animation: toastIn 200ms ease-out; }
      `}</style>
    </div>
  );
}

export default function PipelineBoard({ globalSearch, onOpenProfile }) {
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' or 'priority'
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dragOverPriority, setDragOverPriority] = useState(null);
  const [inlineLogPartnerId, setInlineLogPartnerId] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, partner }

  // Toast state for stage changes via drag
  const [toast, setToast] = useState(null); // { partnerName, stageName, partnerId, previousStage }

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
      if (id) {
        const partner = partners.find((p) => p.id === id);
        if (partner && partner.pipelineStage !== stage) {
          const previousStage = partner.pipelineStage;
          movePipelineStage(id, stage);
          setToast({
            partnerName: partner.name,
            stageName: PIPELINE_STAGE_LABELS[stage],
            partnerId: id,
            previousStage,
          });
        }
      }
      setDraggingId(null);
      setDragOverStage(null);
    },
    [movePipelineStage, partners]
  );

  const handleUndoStageChange = useCallback(() => {
    if (toast) {
      movePipelineStage(toast.partnerId, toast.previousStage);
      setToast(null);
    }
  }, [toast, movePipelineStage]);

  const handleContextMenu = useCallback((e, partner) => {
    setContextMenu({ x: e.clientX, y: e.clientY, partner });
  }, []);

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

  const handleCardClick = useCallback((partner) => {
    if (onOpenProfile) onOpenProfile(partner.id);
  }, [onOpenProfile]);

  const toggleInlineLog = useCallback((partnerId) => {
    setInlineLogPartnerId((prev) => (prev === partnerId ? null : partnerId));
  }, []);

  const handleInlineLogSubmit = useCallback((partnerId, interaction) => {
    addInteraction(partnerId, interaction);
    setInlineLogPartnerId(null);
  }, [addInteraction]);

  return (
    <div className="flex flex-col h-[calc(100vh-105px)]">
      {/* View toggle + Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1A3D26] bg-[#0A1A12] flex-shrink-0">
        {/* Pipeline / Priority toggle — prominent at left */}
        <div className="flex items-center bg-[#0F2318] rounded-md border border-[#1A3D26] overflow-hidden mr-2">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'pipeline' ? 'bg-[#1A6B3C] text-white' : 'text-[#7DB892] hover:text-[#F0F7F2]'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('priority')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'priority' ? 'bg-[#1A6B3C] text-white' : 'text-[#7DB892] hover:text-[#F0F7F2]'
            }`}
          >
            Priority
          </button>
        </div>

        <div className="w-px h-5 bg-[#1A3D26]" />

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

      {/* Bulk action bar — sticky at top when items selected */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-2 flex-shrink-0 sticky top-0 z-20 bg-[#0A1A12]">
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

      {/* Kanban columns — Pipeline or Priority view */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        {viewMode === 'priority' ? (
          /* ─── PRIORITY VIEW ─────────────────────────────────────────── */
          <div className="flex flex-col gap-4 h-full">
            {/* Info banner when no partners have priorities */}
            {filteredPartners.filter(p => p.priority && !p.archived).length === 0 && (
              <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5 text-center">
                <p className="text-sm text-[#F0F7F2] font-medium mb-1">No partners have been prioritised yet</p>
                <p className="text-xs text-[#7DB892]">Open a partner profile and assign a priority (P1, P2, P3, or Warm Lead) to see them here. Or drag partners from the Pipeline view into these columns.</p>
              </div>
            )}
            <div className="flex gap-3 flex-1" style={{ minWidth: PRIORITIES.length * 300 }}>
              {PRIORITIES.map((priority) => {
                const cards = filteredPartners.filter(p => p.priority === priority && !p.archived);
                const isOver = dragOverPriority === priority;
                const color = PRIORITY_COLORS[priority];
                return (
                  <div
                    key={priority}
                    className="flex flex-col w-[300px] flex-shrink-0 rounded-lg border transition-colors"
                    style={{
                      borderColor: isOver ? color : '#1A3D26',
                      backgroundColor: isOver ? `${color}10` : '#0F2318',
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverPriority(priority); }}
                    onDragLeave={() => setDragOverPriority(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverPriority(null);
                      if (draggingId) {
                        updatePartner(draggingId, { priority });
                        setDraggingId(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1A3D26]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-[#F0F7F2] uppercase tracking-wider">
                          {PRIORITY_LABELS[priority]}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0A1A12] text-[#7DB892]">
                        {cards.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                      {cards.map((p) => (
                        <PartnerCard
                          key={p.id}
                          partner={p}
                          selected={selectedIds.has(p.id)}
                          onToggleSelect={toggleSelect}
                          onClick={(partner) => onOpenProfile?.(partner.id)}
                          onDragStart={handleDragStart}
                          onDragEnd={() => setDraggingId(null)}
                          onLogActivity={(id) => setInlineLogPartnerId(id)}
                          onContextMenu={() => {}}
                        />
                      ))}
                      {cards.length === 0 && (
                        <div className="text-center py-12 text-xs text-[#7DB892]/40 border border-dashed border-[#1A3D26] rounded-lg">
                          Drag partners here<br />or assign {PRIORITY_LABELS[priority]} in their profile
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── PIPELINE VIEW ─────────────────────────────────────────── */
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
                      onClick={handleCardClick}
                      onLogActivity={() => {}}
                      onDragStart={(id) => setDraggingId(id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                      showInlineLog={inlineLogPartnerId === partner.id}
                      onToggleInlineLog={toggleInlineLog}
                      onLogSubmit={handleInlineLogSubmit}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="text-center py-8 px-3">
                      <div className="text-[#7DB892]/40 text-xs">
                        {EMPTY_STATE_MESSAGES[stage]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => {
            const newPartner = addPartner(data);
            if (onOpenProfile && newPartner) {
              onOpenProfile(newPartner.id);
            }
          }}
        />
      )}

      {/* Context menu for inline stage change */}
      {contextMenu && (
        <StageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          partner={contextMenu.partner}
          onMove={(partnerId, stage) => {
            const partner = partners.find((p) => p.id === partnerId);
            if (partner && partner.pipelineStage !== stage) {
              const previousStage = partner.pipelineStage;
              movePipelineStage(partnerId, stage);
              setToast({
                partnerName: partner.name,
                stageName: PIPELINE_STAGE_LABELS[stage],
                partnerId,
                previousStage,
              });
            }
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Stage change toast */}
      {toast && (
        <StageChangeToast
          partnerName={toast.partnerName}
          stageName={toast.stageName}
          onUndo={handleUndoStageChange}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
