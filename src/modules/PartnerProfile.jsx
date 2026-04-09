import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Archive,
  Ban,
  Sparkles,
  FileText,
  ExternalLink,
  Send,
  Trash2,
  Search,
  Mail,
  Phone,
  Video,
  StickyNote,
  Link,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  RefreshCw,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  CATEGORIES,
  OPERATING_MODES,
  WAVES,
  INTERACTION_TYPES,
  AGREEMENT_STATUSES,
} from '../lib/partners.js';
import { generateOutreach, generateAISummary } from '../lib/ai.js';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
  'Telehealth Platform': 'bg-blue-900/40 text-blue-300',
  'Online Pharmacy': 'bg-emerald-900/40 text-emerald-300',
  "Men's Health Clinic": 'bg-purple-900/40 text-purple-300',
  'ED Treatment Provider': 'bg-rose-900/40 text-rose-300',
  'Private GP Service': 'bg-cyan-900/40 text-cyan-300',
  'Corporate Health': 'bg-amber-900/40 text-amber-300',
  'Sexual Health Clinic': 'bg-pink-900/40 text-pink-300',
};

const MODE_COLORS = {
  FULL: 'bg-emerald-900/50 text-emerald-400',
  PLATFORM: 'bg-blue-900/50 text-blue-400',
  CHECK: 'bg-amber-900/50 text-amber-400',
};

const INTERACTION_ICONS = {
  'Email Sent': { icon: Send, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-700/40' },
  'Email Received': { icon: Mail, color: 'text-blue-300', bg: 'bg-blue-900/30', border: 'border-blue-700/40' },
  'Call': { icon: Phone, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700/40' },
  'Meeting': { icon: Video, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700/40' },
  'Note': { icon: StickyNote, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700/40' },
  'LinkedIn': { icon: Link, color: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-700/40' },
  'Other': { icon: MoreHorizontal, color: 'text-gray-400', bg: 'bg-gray-900/30', border: 'border-gray-700/40' },
};

const QUICK_INTERACTION_TYPES = [
  { type: 'Email Sent', icon: Send, label: 'Email' },
  { type: 'Call', icon: Phone, label: 'Call' },
  { type: 'Meeting', icon: Video, label: 'Meet' },
  { type: 'Note', icon: StickyNote, label: 'Note' },
  { type: 'LinkedIn', icon: Link, label: 'LinkedIn' },
];

// AI summary cache in localStorage
const AI_SUMMARY_KEY = 'th:ai-summaries';

function getCachedSummary(partnerId) {
  try {
    const all = JSON.parse(localStorage.getItem(AI_SUMMARY_KEY) || '{}');
    return all[partnerId] || null;
  } catch { return null; }
}

function setCachedSummary(partnerId, summary) {
  try {
    const all = JSON.parse(localStorage.getItem(AI_SUMMARY_KEY) || '{}');
    all[partnerId] = { text: summary, date: new Date().toISOString() };
    localStorage.setItem(AI_SUMMARY_KEY, JSON.stringify(all));
  } catch (e) { /* ignore */ }
}

// Click-to-edit inline field component
function EditableField({ value, onSave, type = 'text', placeholder = '', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== (value || '')) {
      onSave(draft);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-transparent border-b border-[#2ECC71] text-[#F0F7F2] outline-none py-0 px-0 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:text-[#2ECC71] transition-colors border-b border-transparent hover:border-[#2ECC71]/30 ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-[#7DB892]/40 italic">{placeholder || 'Click to add'}</span>}
    </span>
  );
}

// Editable number field
function EditableNumberField({ value, onSave, min = 0, max = 100, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value || 0));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(String(value || 0));
  }, [value]);

  const handleSave = () => {
    setEditing(false);
    const num = parseInt(draft) || 0;
    const clamped = Math.min(max, Math.max(min, num));
    if (clamped !== value) {
      onSave(clamped);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setDraft(String(value || 0)); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-transparent border-b border-[#2ECC71] text-[#F0F7F2] outline-none py-0 px-0 w-12 font-mono ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:text-[#2ECC71] transition-colors font-mono ${className}`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

export default function PartnerProfile({ partner, onClose, onNavigate }) {
  const {
    updatePartner,
    archivePartner,
    unarchivePartner,
    markNotCompatible,
    markAsActive,
    addInteraction,
    deleteInteraction,
    movePipelineStage,
    updateAgreementStatus,
  } = useStore();

  const [interactionSearch, setInteractionSearch] = useState('');

  // Quick interaction form — always visible
  const [quickType, setQuickType] = useState('Email Sent');
  const [quickNote, setQuickNote] = useState('');
  const [showQuickDetails, setShowQuickDetails] = useState(false);
  const [quickOutcome, setQuickOutcome] = useState('');
  const [quickNextAction, setQuickNextAction] = useState('');
  const [quickNextActionDue, setQuickNextActionDue] = useState('');

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(() => getCachedSummary(partner.id));
  const [aiError, setAiError] = useState('');

  // Sorted interactions
  const sortedInteractions = useMemo(() => {
    let items = [...(partner.interactions || [])];
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (interactionSearch) {
      const q = interactionSearch.toLowerCase();
      items = items.filter(
        (i) =>
          i.subject?.toLowerCase().includes(q) ||
          i.type?.toLowerCase().includes(q) ||
          i.outcome?.toLowerCase().includes(q) ||
          i.nextAction?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [partner.interactions, interactionSearch]);

  // Inline field save helper
  const saveField = useCallback((field, value) => {
    updatePartner(partner.id, { [field]: value });
  }, [updatePartner, partner.id]);

  const handleQuickInteraction = useCallback((e) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    addInteraction(partner.id, {
      type: quickType,
      subject: quickNote.trim(),
      ...(showQuickDetails && quickOutcome ? { outcome: quickOutcome } : {}),
      ...(showQuickDetails && quickNextAction ? { nextAction: quickNextAction } : {}),
      ...(showQuickDetails && quickNextActionDue ? { nextActionDue: quickNextActionDue } : {}),
    });
    setQuickNote('');
    setQuickOutcome('');
    setQuickNextAction('');
    setQuickNextActionDue('');
    setShowQuickDetails(false);
  }, [addInteraction, partner.id, quickType, quickNote, showQuickDetails, quickOutcome, quickNextAction, quickNextActionDue]);

  const handleAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const result = await generateAISummary(partner);
      setAiSummary({ text: result, date: new Date().toISOString() });
      setCachedSummary(partner.id, result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAgreement = useCallback(() => {
    if (onNavigate) {
      onNavigate('agreements', { partnerId: partner.id });
      onClose();
    }
  }, [onNavigate, partner.id, onClose]);

  const handleGenerateOutreach = useCallback(() => {
    if (onNavigate) {
      onNavigate('outreach', { partnerId: partner.id });
      onClose();
    }
  }, [onNavigate, partner.id, onClose]);

  const catColor = CATEGORY_COLORS[partner.category] || 'bg-gray-900/40 text-gray-300';
  const modeColor = MODE_COLORS[partner.operatingMode] || MODE_COLORS.FULL;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-[#0A1A12] border-l border-[#1A3D26] z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header — click-to-edit name */}
        <div className="flex items-start justify-between p-5 border-b border-[#1A3D26] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <EditableField
                value={partner.name}
                onSave={(v) => saveField('name', v)}
                placeholder="Partner name"
                className="text-xl font-bold text-[#F0F7F2]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${catColor}`}>
                {partner.category}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${modeColor}`}>
                {partner.operatingMode}
              </span>
              <EditableNumberField
                value={partner.score}
                onSave={(v) => saveField('score', v)}
                className="text-sm text-[#2ECC71] font-semibold"
              />
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#0F2318] text-[#7DB892] font-mono">{partner.wave}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${partner.edStatus ? 'bg-[#2ECC71]' : 'bg-[#1A3D26]'}`} title={partner.edStatus ? 'ED: Yes' : 'ED: No'} />
              <span className={`w-2.5 h-2.5 rounded-full ${partner.trtStatus ? 'bg-blue-400' : 'bg-[#1A3D26]'}`} title={partner.trtStatus ? 'TRT: Yes' : 'TRT: No'} />
            </div>
          </div>
          <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2] ml-4 mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Pipeline stage pills — clickable to change instantly */}
          <div className="px-5 py-3 border-b border-[#1A3D26]">
            <label className="block text-[10px] uppercase tracking-wider text-[#7DB892] mb-2">Pipeline Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map((s) => {
                const isActive = partner.pipelineStage === s;
                return (
                  <button
                    key={s}
                    onClick={() => movePipelineStage(partner.id, s)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-[#2ECC71] text-[#0A1A12]'
                        : 'bg-[#0F2318] text-[#7DB892] border border-[#1A3D26] hover:border-[#2ECC71]/40 hover:text-[#2ECC71]'
                    }`}
                  >
                    {PIPELINE_STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agreement status */}
          <div className="px-5 py-3 border-b border-[#1A3D26] flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wider text-[#7DB892] mb-1">Agreement Status</label>
              <select
                value={partner.agreementStatus}
                onChange={(e) => updateAgreementStatus(partner.id, e.target.value)}
                className="w-full text-sm bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2] py-1.5 px-2"
              >
                {AGREEMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cached AI Summary — shown at the top if exists */}
          {(aiSummary || aiLoading || aiError) && (
            <div className="px-5 py-3 border-b border-[#1A3D26]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892] flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#2ECC71]" />
                  AI Summary
                </h3>
                <button
                  onClick={handleAISummary}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs text-[#7DB892] hover:text-[#2ECC71] disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {aiLoading ? 'Analyzing...' : (aiSummary ? 'Refresh' : 'Generate')}
                </button>
              </div>
              {aiError && <div className="text-sm text-[#C0392B] bg-[#C0392B]/10 rounded-md p-3">{aiError}</div>}
              {aiSummary && (
                <div className="text-sm text-[#F0F7F2] bg-[#0F2318] rounded-md p-3 whitespace-pre-wrap">
                  {aiSummary.text}
                  <div className="text-[10px] text-[#7DB892]/50 mt-2">
                    Generated {aiSummary.date ? format(new Date(aiSummary.date), 'dd MMM yyyy, HH:mm') : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact details — click-to-edit fields */}
          <div className="px-5 py-4 border-b border-[#1A3D26]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892] mb-3">Contact Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs">Contact</span>
                <EditableField
                  value={partner.contactName}
                  onSave={(v) => saveField('contactName', v)}
                  placeholder="Add contact name"
                  className="text-[#F0F7F2] text-sm"
                />
              </div>
              <div className="flex items-center">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs">Email</span>
                <EditableField
                  value={partner.contactEmail}
                  onSave={(v) => saveField('contactEmail', v)}
                  type="email"
                  placeholder="Add email"
                  className="text-[#F0F7F2] text-sm"
                />
              </div>
              <div className="flex items-center">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs">Title</span>
                <EditableField
                  value={partner.contactJobTitle}
                  onSave={(v) => saveField('contactJobTitle', v)}
                  placeholder="Add job title"
                  className="text-[#F0F7F2] text-sm"
                />
              </div>
              <div className="flex items-center">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs">Website</span>
                <EditableField
                  value={partner.website}
                  onSave={(v) => saveField('website', v)}
                  type="url"
                  placeholder="Add website"
                  className="text-[#F0F7F2] text-sm"
                />
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-[#7DB892] hover:text-[#2ECC71]">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <div className="flex items-start">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs pt-0.5">Notes</span>
                <EditableField
                  value={partner.notes}
                  onSave={(v) => saveField('notes', v)}
                  placeholder="Add notes"
                  className="text-[#F0F7F2] text-sm flex-1"
                />
              </div>
              <div className="flex items-center gap-4 pt-1">
                <span className="w-20 text-[#7DB892] flex-shrink-0 text-xs">Services</span>
                <label className="flex items-center gap-1.5 text-xs text-[#7DB892] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partner.edStatus}
                    onChange={(e) => saveField('edStatus', e.target.checked)}
                    className="accent-[#2ECC71]"
                  />
                  ED
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#7DB892] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partner.trtStatus}
                    onChange={(e) => saveField('trtStatus', e.target.checked)}
                    className="accent-[#2ECC71]"
                  />
                  TRT
                </label>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 py-3 border-b border-[#1A3D26] flex flex-wrap gap-2">
            <button
              onClick={handleGenerateOutreach}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium"
            >
              <Sparkles size={13} />
              Generate Outreach
            </button>
            <button
              onClick={handleOpenAgreement}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40 rounded-md"
            >
              <FileText size={13} /> Open Agreement
            </button>
            {!aiSummary && (
              <button
                onClick={handleAISummary}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40 rounded-md disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Get AI Summary
              </button>
            )}
            <div className="flex-1" />
            {partner.archived ? (
              <button
                onClick={() => unarchivePartner(partner.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#2ECC71]/40 text-[#2ECC71] hover:bg-[#2ECC71]/10 rounded-md"
              >
                <CheckCircle size={13} /> Unarchive
              </button>
            ) : (
              <button
                onClick={() => archivePartner(partner.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#E07B00]/40 text-[#E07B00] hover:bg-[#E07B00]/10 rounded-md"
              >
                <Archive size={13} /> Archive
              </button>
            )}
            {partner.notCompatible ? (
              <button
                onClick={() => markAsActive(partner.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#2ECC71]/40 text-[#2ECC71] hover:bg-[#2ECC71]/10 rounded-md"
              >
                <CheckCircle size={13} /> Mark Active
              </button>
            ) : (
              <button
                onClick={() => markNotCompatible(partner.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#C0392B]/40 text-[#C0392B] hover:bg-[#C0392B]/10 rounded-md"
              >
                <Ban size={13} /> Not Compatible
              </button>
            )}
          </div>

          {/* Interaction Log */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892]">
                Interaction Log ({partner.interactions?.length || 0})
              </h3>
            </div>

            {/* Always-visible quick interaction form */}
            <form onSubmit={handleQuickInteraction} className="bg-[#0F2318] rounded-lg border border-[#1A3D26] p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {QUICK_INTERACTION_TYPES.map((qt) => {
                  const Icon = qt.icon;
                  const isActive = quickType === qt.type;
                  return (
                    <button
                      key={qt.type}
                      type="button"
                      onClick={() => setQuickType(qt.type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                          : 'text-[#7DB892] hover:text-[#F0F7F2] border border-[#1A3D26] hover:border-[#2ECC71]/20'
                      }`}
                      title={qt.type}
                    >
                      <Icon size={11} />
                      {qt.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="What happened? Press Enter to log..."
                  className="flex-1 text-xs py-1.5 px-2.5 bg-[#0A1A12] border border-[#1A3D26] rounded-md text-[#F0F7F2] placeholder:text-[#7DB892]/40"
                />
                <button
                  type="submit"
                  disabled={!quickNote.trim()}
                  className="px-3 py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium disabled:opacity-30"
                >
                  Log
                </button>
              </div>
              {/* Optional details toggle */}
              {!showQuickDetails ? (
                <button
                  type="button"
                  onClick={() => setShowQuickDetails(true)}
                  className="text-[10px] text-[#7DB892] hover:text-[#2ECC71] mt-1.5"
                >
                  + Add details
                </button>
              ) : (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    value={quickOutcome}
                    onChange={(e) => setQuickOutcome(e.target.value)}
                    placeholder="Outcome..."
                    className="w-full text-[11px] py-1 px-2 bg-[#0A1A12] border border-[#1A3D26] rounded text-[#F0F7F2] placeholder:text-[#7DB892]/40"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={quickNextAction}
                      onChange={(e) => setQuickNextAction(e.target.value)}
                      placeholder="Next action..."
                      className="flex-1 text-[11px] py-1 px-2 bg-[#0A1A12] border border-[#1A3D26] rounded text-[#F0F7F2] placeholder:text-[#7DB892]/40"
                    />
                    <input
                      type="date"
                      value={quickNextActionDue}
                      onChange={(e) => setQuickNextActionDue(e.target.value)}
                      className="text-[11px] py-1 px-2 bg-[#0A1A12] border border-[#1A3D26] rounded text-[#F0F7F2]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickDetails(false)}
                    className="text-[10px] text-[#7DB892] hover:text-[#F0F7F2]"
                  >
                    Hide details
                  </button>
                </div>
              )}
            </form>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7DB892]" />
              <input
                type="text"
                placeholder="Search interactions..."
                value={interactionSearch}
                onChange={(e) => setInteractionSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2]"
              />
            </div>

            {/* Chat-style timeline */}
            <div className="space-y-0">
              {sortedInteractions.length === 0 ? (
                <div className="text-center py-8 text-[#7DB892]/40 text-xs">
                  No interactions recorded yet. Use the form above to log one.
                </div>
              ) : (
                sortedInteractions.map((interaction, idx) => {
                  const typeConfig = INTERACTION_ICONS[interaction.type] || INTERACTION_ICONS.Other;
                  const Icon = typeConfig.icon;
                  const isLast = idx === sortedInteractions.length - 1;

                  return (
                    <div key={interaction.id} className="flex gap-3 group">
                      {/* Timeline line + color-coded icon */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-7 h-7 rounded-full ${typeConfig.bg} border ${typeConfig.border} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={13} className={typeConfig.color} />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-[#1A3D26] min-h-[20px]" />}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-4`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`text-xs font-medium ${typeConfig.color}`}>{interaction.type}</span>
                            <span className="text-[10px] text-[#7DB892] ml-2">
                              {interaction.date ? format(new Date(interaction.date), 'dd MMM yyyy, HH:mm') : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteInteraction(partner.id, interaction.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#C0392B]/60 hover:text-[#C0392B] transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="text-sm text-[#F0F7F2] mt-0.5">{interaction.subject}</div>
                        {interaction.outcome && (
                          <div className="text-xs text-[#7DB892] mt-1">
                            <span className="text-[#7DB892]/60">Outcome:</span> {interaction.outcome}
                          </div>
                        )}
                        {interaction.nextAction && (
                          <div className="text-xs mt-1">
                            <span className="text-[#7DB892]/60">Next:</span>{' '}
                            <span className="text-[#E07B00]">{interaction.nextAction}</span>
                            {interaction.nextActionDue && (
                              <span className="text-[#7DB892]/60 ml-1">
                                (due {format(new Date(interaction.nextActionDue), 'dd MMM')})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 200ms ease-out;
        }
      `}</style>
    </>
  );
}
