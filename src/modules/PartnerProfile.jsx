import { useState, useMemo } from 'react';
import {
  X,
  Edit3,
  Archive,
  Ban,
  Sparkles,
  FileText,
  ExternalLink,
  Send,
  ChevronDown,
  ChevronUp,
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
import { format, formatDistanceToNow } from 'date-fns';

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
  'Email Sent': Send,
  'Email Received': Mail,
  'Call': Phone,
  'Meeting': Video,
  'Note': StickyNote,
  'LinkedIn': Link,
  'Other': MoreHorizontal,
};

export default function PartnerProfile({ partner, onClose }) {
  const {
    updatePartner,
    archivePartner,
    unarchivePartner,
    markNotCompatible,
    markAsActive,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    movePipelineStage,
    updateAgreementStatus,
  } = useStore();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    contactName: partner.contactName || '',
    contactEmail: partner.contactEmail || '',
    contactJobTitle: partner.contactJobTitle || '',
    website: partner.website || '',
    notes: partner.notes || '',
    name: partner.name || '',
    category: partner.category || '',
    operatingMode: partner.operatingMode || 'FULL',
    score: partner.score || 0,
    wave: partner.wave || 'W1',
    edStatus: partner.edStatus || false,
    trtStatus: partner.trtStatus || false,
  });

  const [interactionSearch, setInteractionSearch] = useState('');
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'Email Sent',
    subject: '',
    outcome: '',
    nextAction: '',
    nextActionDue: '',
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiError, setAiError] = useState('');
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachText, setOutreachText] = useState('');
  const [outreachError, setOutreachError] = useState('');

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

  const handleSaveEdit = () => {
    updatePartner(partner.id, editForm);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      contactName: partner.contactName || '',
      contactEmail: partner.contactEmail || '',
      contactJobTitle: partner.contactJobTitle || '',
      website: partner.website || '',
      notes: partner.notes || '',
      name: partner.name || '',
      category: partner.category || '',
      operatingMode: partner.operatingMode || 'FULL',
      score: partner.score || 0,
      wave: partner.wave || 'W1',
      edStatus: partner.edStatus || false,
      trtStatus: partner.trtStatus || false,
    });
    setEditing(false);
  };

  const handleAddInteraction = (e) => {
    e.preventDefault();
    if (!newInteraction.subject.trim()) return;
    addInteraction(partner.id, newInteraction);
    setNewInteraction({ type: 'Email Sent', subject: '', outcome: '', nextAction: '', nextActionDue: '' });
    setShowAddInteraction(false);
  };

  const handleAISummary = async () => {
    setAiLoading(true);
    setAiError('');
    setAiSummary('');
    try {
      const result = await generateAISummary(partner);
      setAiSummary(result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setOutreachLoading(true);
    setOutreachError('');
    setOutreachText('');
    try {
      const result = await generateOutreach(partner);
      setOutreachText(result);
    } catch (err) {
      setOutreachError(err.message);
    } finally {
      setOutreachLoading(false);
    }
  };

  const catColor = CATEGORY_COLORS[partner.category] || 'bg-gray-900/40 text-gray-300';
  const modeColor = MODE_COLORS[partner.operatingMode] || MODE_COLORS.FULL;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-[#0A1A12] border-l border-[#1A3D26] z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1A3D26] flex-shrink-0">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="text-xl font-bold bg-transparent border-b border-[#2ECC71] text-[#F0F7F2] w-full outline-none pb-1 mb-2"
              />
            ) : (
              <h2 className="text-xl font-bold text-[#F0F7F2] truncate mb-2">{partner.name}</h2>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${catColor}`}>
                {partner.category}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${modeColor}`}>
                {partner.operatingMode}
              </span>
              <span className="font-mono text-sm text-[#2ECC71] font-semibold">{partner.score}</span>
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
          {/* Pipeline stage + Agreement */}
          <div className="px-5 py-4 border-b border-[#1A3D26] flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wider text-[#7DB892] mb-1">Pipeline Stage</label>
              <select
                value={partner.pipelineStage}
                onChange={(e) => movePipelineStage(partner.id, e.target.value)}
                className="w-full text-sm bg-[#0F2318] border border-[#1A3D26] rounded-md text-[#F0F7F2] py-1.5 px-2"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
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

          {/* Contact details */}
          <div className="px-5 py-4 border-b border-[#1A3D26]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892]">Contact Details</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-[#7DB892] hover:text-[#2ECC71]">
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancelEdit} className="text-xs text-[#7DB892] hover:text-[#F0F7F2]">Cancel</button>
                  <button onClick={handleSaveEdit} className="text-xs text-[#2ECC71] hover:text-[#F0F7F2] font-medium">Save</button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Name</label>
                    <input type="text" value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Email</label>
                    <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} className="w-full text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Job Title</label>
                    <input type="text" value={editForm.contactJobTitle} onChange={(e) => setEditForm({ ...editForm, contactJobTitle: e.target.value })} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Website</label>
                    <input type="url" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="w-full text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Category</label>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full text-sm">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Mode</label>
                    <select value={editForm.operatingMode} onChange={(e) => setEditForm({ ...editForm, operatingMode: e.target.value })} className="w-full text-sm">
                      {OPERATING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Wave</label>
                    <select value={editForm.wave} onChange={(e) => setEditForm({ ...editForm, wave: e.target.value })} className="w-full text-sm">
                      {WAVES.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Score</label>
                    <input type="number" min={0} max={100} value={editForm.score} onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })} className="w-full text-sm font-mono" />
                  </div>
                  <div className="flex items-end gap-3 pb-1">
                    <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                      <input type="checkbox" checked={editForm.edStatus} onChange={(e) => setEditForm({ ...editForm, edStatus: e.target.checked })} className="accent-[#2ECC71]" /> ED
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[#7DB892]">
                      <input type="checkbox" checked={editForm.trtStatus} onChange={(e) => setEditForm({ ...editForm, trtStatus: e.target.checked })} className="accent-[#2ECC71]" /> TRT
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#7DB892] mb-0.5">Notes</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full h-16 resize-none text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex">
                  <span className="w-20 text-[#7DB892] flex-shrink-0">Contact</span>
                  <span className="text-[#F0F7F2]">{partner.contactName || '—'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-[#7DB892] flex-shrink-0">Email</span>
                  <span className="text-[#F0F7F2]">{partner.contactEmail ? <a href={`mailto:${partner.contactEmail}`} className="hover:text-[#2ECC71] underline">{partner.contactEmail}</a> : '—'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-[#7DB892] flex-shrink-0">Title</span>
                  <span className="text-[#F0F7F2]">{partner.contactJobTitle || '—'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-[#7DB892] flex-shrink-0">Website</span>
                  <span className="text-[#F0F7F2]">
                    {partner.website ? (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#2ECC71] underline flex items-center gap-1">
                        {partner.website} <ExternalLink size={11} />
                      </a>
                    ) : '—'}
                  </span>
                </div>
                {partner.notes && (
                  <div className="flex">
                    <span className="w-20 text-[#7DB892] flex-shrink-0">Notes</span>
                    <span className="text-[#F0F7F2] whitespace-pre-wrap">{partner.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 py-3 border-b border-[#1A3D26] flex flex-wrap gap-2">
            <button
              onClick={handleGenerateOutreach}
              disabled={outreachLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium disabled:opacity-50"
            >
              {outreachLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Generate Outreach
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40 rounded-md">
              <FileText size={13} /> Open Agreement
            </button>
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40 rounded-md">
                <Edit3 size={13} /> Edit Details
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

          {/* Outreach result */}
          {(outreachText || outreachError) && (
            <div className="px-5 py-3 border-b border-[#1A3D26]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892] mb-2">Generated Outreach</h3>
              {outreachError ? (
                <div className="text-sm text-[#C0392B] bg-[#C0392B]/10 rounded-md p-3">{outreachError}</div>
              ) : (
                <div className="text-sm text-[#F0F7F2] bg-[#0F2318] rounded-md p-3 whitespace-pre-wrap font-mono text-[12px] leading-relaxed">
                  {outreachText}
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          <div className="px-5 py-3 border-b border-[#1A3D26]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892]">AI Summary</h3>
              <button
                onClick={handleAISummary}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs text-[#7DB892] hover:text-[#2ECC71] disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {aiLoading ? 'Analyzing...' : 'Get AI Summary'}
              </button>
            </div>
            {aiError && <div className="text-sm text-[#C0392B] bg-[#C0392B]/10 rounded-md p-3">{aiError}</div>}
            {aiSummary && (
              <div className="text-sm text-[#F0F7F2] bg-[#0F2318] rounded-md p-3 whitespace-pre-wrap">{aiSummary}</div>
            )}
            {!aiSummary && !aiError && !aiLoading && (
              <div className="text-xs text-[#7DB892]/50">Click "Get AI Summary" to analyze interaction history.</div>
            )}
          </div>

          {/* Interaction Log */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7DB892]">
                Interaction Log ({partner.interactions?.length || 0})
              </h3>
              <button
                onClick={() => setShowAddInteraction(!showAddInteraction)}
                className="flex items-center gap-1 text-xs text-[#2ECC71] hover:text-[#F0F7F2] font-medium"
              >
                {showAddInteraction ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAddInteraction ? 'Close' : 'Add Entry'}
              </button>
            </div>

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

            {/* Add interaction form */}
            {showAddInteraction && (
              <form onSubmit={handleAddInteraction} className="bg-[#0F2318] rounded-lg border border-[#1A3D26] p-3 mb-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Type</label>
                    <select
                      value={newInteraction.type}
                      onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                      className="w-full text-xs"
                    >
                      {INTERACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Subject *</label>
                    <input
                      type="text"
                      value={newInteraction.subject}
                      onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#7DB892] mb-0.5">Outcome</label>
                  <input
                    type="text"
                    value={newInteraction.outcome}
                    onChange={(e) => setNewInteraction({ ...newInteraction, outcome: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Next Action</label>
                    <input
                      type="text"
                      value={newInteraction.nextAction}
                      onChange={(e) => setNewInteraction({ ...newInteraction, nextAction: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#7DB892] mb-0.5">Due Date</label>
                    <input
                      type="date"
                      value={newInteraction.nextActionDue}
                      onChange={(e) => setNewInteraction({ ...newInteraction, nextActionDue: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddInteraction(false)} className="px-3 py-1 text-xs text-[#7DB892] hover:text-[#F0F7F2]">Cancel</button>
                  <button type="submit" className="px-3 py-1 text-xs bg-[#1A6B3C] hover:bg-[#2ECC71] text-[#F0F7F2] rounded-md font-medium">Add</button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="space-y-0">
              {sortedInteractions.length === 0 ? (
                <div className="text-center py-8 text-[#7DB892]/40 text-xs">
                  No interactions recorded yet. Click "Add Entry" to log one.
                </div>
              ) : (
                sortedInteractions.map((interaction, idx) => {
                  const Icon = INTERACTION_ICONS[interaction.type] || MoreHorizontal;
                  const isLast = idx === sortedInteractions.length - 1;
                  return (
                    <div key={interaction.id} className="flex gap-3 group">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#0F2318] border border-[#1A3D26] flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-[#7DB892]" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-[#1A3D26] min-h-[20px]" />}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium text-[#F0F7F2]">{interaction.type}</span>
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
