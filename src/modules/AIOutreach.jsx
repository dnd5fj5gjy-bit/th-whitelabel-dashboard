import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../hooks/useStore';
import { askClaude } from '../lib/ai';
import storage from '../lib/storage';
import { PIPELINE_STAGES } from '../lib/partners';
import { differenceInDays, format } from 'date-fns';
import {
  Sparkles, Copy, Check, Send, ChevronDown, ChevronRight, Loader2, Clock, User,
  Building2, Zap, Mail, FileText, Trash2, ArrowRight, X
} from 'lucide-react';

const OUTREACH_TYPES = [
  { id: 'touch-1', label: 'Touch 1', shortLabel: 'T1', desc: 'Cold email. Personalised, insight-led.' },
  { id: 'touch-2', label: 'Touch 2', shortLabel: 'T2', desc: 'Follow-up with value add (Day 6-8).' },
  { id: 'touch-3', label: 'Touch 3', shortLabel: 'T3', desc: 'Low-friction close (Day 14-16).' },
  { id: 'call-prep', label: 'Call Prep', shortLabel: 'Call', desc: 'Talking points for discovery call.' },
  { id: 'post-call', label: 'Post-Call', shortLabel: 'Post', desc: 'Summary + next steps email.' },
  { id: 'custom', label: 'Custom', shortLabel: 'Custom', desc: 'Write your own instruction.' },
];

const SYSTEM_PROMPT = `You are a senior commercial partnerships manager at Ted's Health, the UK's only licensable B2B clinical platform for TRT (Testosterone Replacement Therapy) and ED (Erectile Dysfunction). Ted's Health offers a fully white-label platform allowing partners to offer TRT and ED services entirely under their own brand, with two operating models: FULL_SERVICE (Ted's provides the doctors, pharmacy, labs, nursing, prescribing licence and CQC registration — zero clinical infrastructure required from the partner) and PLATFORM_ONLY (partner brings their own GMC-registered doctors and CQC registration — Ted's provides only the technology, pharmacy integration via SignatureRx, labs via Inuvi, and patient management platform). Ted's Health is building its first cohort of white-label partners for a Q3 2026 launch. You write outreach that is personalised, insight-led, and never generic. You reference specific gaps in the partner's offering. You never mention Ted's Health in ways that break the white-label premise. You are direct, commercial, and concise.`;

const CATEGORY_COLORS = {
  'Telehealth Platform': '#3B82F6',
  'Online Pharmacy': '#10B981',
  "Men's Health Clinic": '#8B5CF6',
  'ED Treatment Provider': '#EC4899',
  'Private GP Service': '#F59E0B',
  'Corporate Health': '#06B6D4',
  'Sexual Health Clinic': '#EF4444',
};

const STORAGE_KEY = 'th:outreach-history';

// Smart defaults: auto-pick outreach type based on pipeline stage
function getSmartDefault(partner) {
  if (!partner) return 'touch-1';
  switch (partner.pipelineStage) {
    case 'identified': return 'touch-1';
    case 'contacted': return 'touch-2';
    case 'replied': return 'touch-3';
    case 'call-booked': return 'call-prep';
    case 'proposal-sent':
    case 'negotiating': return 'post-call';
    default: return 'touch-1';
  }
}

// Next pipeline stage mapping
function getNextStage(currentStage) {
  const idx = PIPELINE_STAGES.indexOf(currentStage);
  if (idx === -1 || idx >= PIPELINE_STAGES.length - 2) return null; // skip 'dead'
  return PIPELINE_STAGES[idx + 1];
}

function getOutreachHistory(partnerId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[partnerId] || [];
  } catch { return []; }
}

function saveOutreachHistory(partnerId, entry) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!all[partnerId]) all[partnerId] = [];
    all[partnerId].unshift(entry);
    if (all[partnerId].length > 50) all[partnerId] = all[partnerId].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) { console.error('Failed to save outreach history:', e); }
}

function clearOutreachHistory(partnerId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete all[partnerId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) { console.error('Failed to clear outreach history:', e); }
}

export default function AIOutreach({ params, onNavigate }) {
  const { partners, addInteraction, movePipelineStage } = useStore();
  const activePartners = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [outreachType, setOutreachType] = useState('touch-1');
  const [customInstruction, setCustomInstruction] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [preGenerated, setPreGenerated] = useState(null);
  const [showPreGenerated, setShowPreGenerated] = useState(true);

  // Auto-select partner from params — bulletproof: run every time params change
  useEffect(() => {
    if (params?.partnerId) {
      const exists = partners.find(p => p.id === params.partnerId);
      if (exists) {
        setSelectedPartnerId(params.partnerId);
        setOutput(null);
        setLogged(false);
        setCopied(false);
      }
    }
  }, [params?.partnerId, partners]);

  const partner = useMemo(() => partners.find(p => p.id === selectedPartnerId), [partners, selectedPartnerId]);

  // Smart default: auto-pick type when partner changes
  useEffect(() => {
    if (partner) {
      setOutreachType(getSmartDefault(partner));
      setHistory(getOutreachHistory(partner.id));
      // Load pre-generated outreach from AI Populate
      const cached = storage.get(`outreach:${partner.id}`, null);
      setPreGenerated(cached);
      setShowPreGenerated(true);
    } else {
      setHistory([]);
      setPreGenerated(null);
    }
  }, [partner?.id, partner?.pipelineStage]);

  const daysSinceLastContact = useMemo(() => {
    if (!partner || !partner.interactions.length) return null;
    const sorted = [...partner.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return differenceInDays(new Date(), new Date(sorted[0].date));
  }, [partner]);

  const nextStage = useMemo(() => partner ? getNextStage(partner.pipelineStage) : null, [partner]);

  function buildUserPrompt() {
    if (!partner) return '';
    const interactionHistory = partner.interactions.length > 0
      ? partner.interactions.map(i =>
        `[${i.date}] ${i.type}: ${i.subject}${i.outcome ? ` -- Outcome: ${i.outcome}` : ''}${i.nextAction ? ` -- Next: ${i.nextAction}` : ''}`
      ).join('\n')
      : 'No previous interactions.';

    const typeInstruction = {
      'touch-1': 'Write a Touch 1 cold outreach email. This is the first contact. Make it personalised, insight-led, and reference a specific gap in their current offering. Keep it concise -- under 200 words for the body.',
      'touch-2': 'Write a Touch 2 follow-up email (Day 6-8 after first contact). Share a relevant insight, commercial angle, or competitive pressure they may not have considered. Reference the first email. Under 150 words body.',
      'touch-3': 'Write a Touch 3 low-friction close email (Day 14-16). Very short, direct. Ask for 15 minutes. Remove all friction. Under 100 words body.',
      'call-prep': 'Generate discovery call talking points. Include: opening framing, 5 key questions to ask, value hooks to weave in, likely objections with responses, and a suggested close/next step.',
      'post-call': 'Write a post-call follow-up email. Summarise the key discussion points, confirm agreed next steps, and propose a timeline. Professional but warm. Under 200 words body.',
      'custom': `Follow this instruction: ${customInstruction}`,
    }[outreachType];

    return `Partner: ${partner.name}
Category: ${partner.category}
Operating Mode: ${partner.operatingMode}
Partner Score: ${partner.score}/100
ED Services: ${partner.edStatus ? 'Currently offers ED' : 'Does not offer ED'}
TRT Services: ${partner.trtStatus ? 'Currently offers TRT' : 'Does not offer TRT'}
Wave: ${partner.wave}
Current Pipeline Stage: ${partner.pipelineStage}
Days Since Last Contact: ${daysSinceLastContact !== null ? daysSinceLastContact : 'Never contacted'}
Total Interactions: ${partner.interactions.length}
${partner.contactName ? `Contact Person: ${partner.contactName}` : ''}
${partner.contactJobTitle ? `Job Title: ${partner.contactJobTitle}` : ''}
${partner.website ? `Website: ${partner.website}` : ''}
${partner.notes ? `Notes: ${partner.notes}` : ''}

Interaction History:
${interactionHistory}

Task: ${typeInstruction}

${outreachType !== 'call-prep' ? 'Format your response as:\nSUBJECT: [subject line]\n\n[email body]' : 'Format with clear section headings.'}`;
  }

  async function handleGenerate() {
    if (!partner) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    setCopied(false);
    setLogged(false);

    try {
      const result = await askClaude(SYSTEM_PROMPT, buildUserPrompt(), 1500);
      let subject = '';
      let body = result;

      const subjectMatch = result.match(/^SUBJECT:\s*(.+?)(?:\n|$)/im);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = result.slice(subjectMatch.index + subjectMatch[0].length).trim();
      }

      const outputObj = { subject, body, type: outreachType, generatedAt: new Date().toISOString() };
      setOutput(outputObj);
      saveOutreachHistory(partner.id, outputObj);
      setHistory(getOutreachHistory(partner.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!output) return;
    const text = output.subject ? `Subject: ${output.subject}\n\n${output.body}` : output.body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogAndAdvance() {
    if (!partner || !output || logged) return;
    // Log the interaction
    addInteraction(partner.id, {
      id: `int-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Email Sent',
      subject: output.subject || `${OUTREACH_TYPES.find(t => t.id === outreachType)?.label || 'Outreach'} -- AI Generated`,
      outcome: 'Sent via AI Outreach',
      nextAction: outreachType === 'touch-1' ? 'Follow up in 6-8 days' : outreachType === 'touch-2' ? 'Final follow-up in 7-8 days' : '',
      nextActionDue: outreachType === 'touch-1'
        ? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        : outreachType === 'touch-2'
          ? new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0]
          : '',
    });
    // Advance pipeline stage if there's a next one
    if (nextStage) {
      movePipelineStage(partner.id, nextStage);
    }
    setLogged(true);
  }

  function handleClearHistory() {
    if (!partner) return;
    clearOutreachHistory(partner.id);
    setHistory([]);
  }

  const handlePartnerChange = useCallback((id) => {
    setSelectedPartnerId(id);
    setOutput(null);
    setLogged(false);
    setCopied(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
            <Sparkles size={20} className="text-[#2ECC71]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F0F7F2]">AI Outreach</h1>
            <p className="text-sm text-[#7DB892]">Quick-fire outreach workflow</p>
          </div>
        </div>
      </div>

      {/* Partner selector row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <select
            value={selectedPartnerId}
            onChange={e => handlePartnerChange(e.target.value)}
            className="w-full appearance-none bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 pr-8 text-[#F0F7F2] text-sm"
          >
            <option value="">Choose a partner...</option>
            {activePartners.map(p => (
              <option key={p.id} value={p.id}>{p.name} -- {p.pipelineStage.replace('-', ' ')} -- {p.score}/100</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7DB892] pointer-events-none" />
        </div>
      </div>

      {/* Partner context card -- compact one-line */}
      {partner && (
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] px-4 py-2.5 flex items-center gap-4 flex-wrap text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[partner.category] || '#7DB892' }} />
            <span className="text-[#F0F7F2] font-medium">{partner.name}</span>
          </span>
          <span className="text-[#7DB892]">{partner.category}</span>
          <span className="text-[#7DB892] font-mono">{partner.operatingMode}</span>
          <span className="text-[#2ECC71] font-mono">{partner.score}/100</span>
          <span className="text-[#7DB892] capitalize">{partner.pipelineStage.replace('-', ' ')}</span>
          <span className="text-[#7DB892]">
            {daysSinceLastContact !== null ? `${daysSinceLastContact}d ago` : 'Never contacted'}
          </span>
          {partner.contactName && (
            <span className="text-[#7DB892] flex items-center gap-1">
              <User size={10} />
              {partner.contactName}
            </span>
          )}
        </div>
      )}

      {/* Pre-generated draft from AI Populate */}
      {partner && preGenerated && showPreGenerated && !output && (
        <div className="rounded-lg border border-[#2ECC71]/30 bg-[#0F2318] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A3D26] bg-[#2ECC71]/5">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles size={14} className="text-[#2ECC71]" />
              <span className="text-[#2ECC71] font-medium">Pre-generated Draft</span>
              <span className="text-xs text-[#7DB892]">from AI Populate</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOutput(preGenerated);
                  setOutreachType(preGenerated.type || 'touch-1');
                  setCopied(false);
                  setLogged(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors"
              >
                Use Draft
              </button>
              <button
                onClick={() => setShowPreGenerated(false)}
                className="text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {preGenerated.subject && (
              <div className="text-xs text-[#F0F7F2] font-medium">
                <span className="text-[#7DB892]">Subject:</span> {preGenerated.subject}
              </div>
            )}
            <div className="text-xs text-[#7DB892] line-clamp-3 whitespace-pre-wrap">
              {preGenerated.body}
            </div>
            {preGenerated.generatedAt && (
              <div className="text-[10px] text-[#7DB892]/40">
                Generated {format(new Date(preGenerated.generatedAt), 'd MMM HH:mm')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output type tab bar */}
      {partner && (
        <div className="flex items-center gap-1 bg-[#0A1A12] rounded-lg p-1 border border-[#1A3D26]">
          {OUTREACH_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setOutreachType(t.id)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                outreachType === t.id
                  ? 'bg-[#1A6B3C] text-white shadow-sm'
                  : 'text-[#7DB892] hover:text-[#F0F7F2] hover:bg-[#0F2318]'
              }`}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom instruction */}
      {outreachType === 'custom' && partner && (
        <textarea
          value={customInstruction}
          onChange={e => setCustomInstruction(e.target.value)}
          placeholder="Describe what you want generated..."
          rows={2}
          className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a] resize-none"
        />
      )}

      {/* Smart default hint + Generate button */}
      {partner && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={!partner || loading || (outreachType === 'custom' && !customInstruction.trim())}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate
              </>
            )}
          </button>
          <span className="text-xs text-[#4a7a5a]">
            Smart pick: <span className="text-[#7DB892]">{OUTREACH_TYPES.find(t => t.id === getSmartDefault(partner))?.label}</span>
            {' '}based on <span className="text-[#7DB892] capitalize">{partner.pipelineStage.replace('-', ' ')}</span> stage
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-6 space-y-4 animate-pulse">
          <div className="h-5 bg-[#1A3D26] rounded w-2/3" />
          <div className="space-y-2">
            <div className="h-3 bg-[#1A3D26] rounded w-full" />
            <div className="h-3 bg-[#1A3D26] rounded w-5/6" />
            <div className="h-3 bg-[#1A3D26] rounded w-4/6" />
            <div className="h-3 bg-[#1A3D26] rounded w-full" />
            <div className="h-3 bg-[#1A3D26] rounded w-3/4" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#C0392B]/40 bg-[#C0392B]/10 p-4 text-sm text-[#F0F7F2]">
          <p className="font-medium text-[#C0392B]">Generation Failed</p>
          <p className="mt-1 text-[#7DB892]">{error}</p>
        </div>
      )}

      {/* Output */}
      {output && !loading && (
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A3D26] bg-[#0A1A12]/50">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles size={14} className="text-[#2ECC71]" />
              <span className="text-[#7DB892]">
                {OUTREACH_TYPES.find(t => t.id === outreachType)?.label || 'Output'}
              </span>
              <span className="text-[#4a7a5a]">for</span>
              <span className="text-[#F0F7F2] font-medium">{partner?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
              >
                {copied ? <Check size={12} className="text-[#2ECC71]" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleLogAndAdvance}
                disabled={logged}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
                  logged
                    ? 'bg-[#2ECC71]/20 text-[#2ECC71] cursor-default'
                    : 'bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white'
                }`}
              >
                {logged ? (
                  <>
                    <Check size={12} />
                    Logged & Advanced
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Log & {nextStage ? `Move to ${nextStage.replace('-', ' ')}` : 'Log as Sent'}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {output.subject && (
              <div>
                <div className="text-xs text-[#7DB892] mb-1 uppercase tracking-wider">Subject Line</div>
                <div className="text-[#F0F7F2] font-medium text-base bg-[#0A1A12] rounded-md px-3 py-2 border border-[#1A3D26]">
                  {output.subject}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[#7DB892] mb-1 uppercase tracking-wider">Body</div>
              <div className="text-[#F0F7F2] text-sm leading-relaxed whitespace-pre-wrap bg-[#0A1A12] rounded-md px-4 py-3 border border-[#1A3D26]">
                {output.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!output && !loading && !error && partner && (
        <div className="rounded-lg border border-[#1A3D26] border-dashed bg-[#0F2318]/50 p-8 flex flex-col items-center justify-center text-center">
          <Sparkles size={28} className="text-[#1A3D26] mb-2" />
          <p className="text-[#7DB892] text-sm">Click Generate to create outreach</p>
        </div>
      )}

      {!partner && !loading && (
        <div className="rounded-lg border border-[#1A3D26] border-dashed bg-[#0F2318]/50 p-12 flex flex-col items-center justify-center text-center">
          <Building2 size={32} className="text-[#1A3D26] mb-3" />
          <p className="text-[#7DB892] text-sm">Select a partner to get started</p>
        </div>
      )}

      {/* History -- collapsible, last 3 shown inline */}
      {partner && history.length > 0 && (
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318]">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clock size={12} />
              Previous ({history.length})
            </span>
            <ChevronDown size={12} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory && (
            <div className="border-t border-[#1A3D26]">
              <div className="flex justify-end px-4 pt-2">
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-xs text-[#C0392B] hover:text-[#C0392B]/80 transition-colors"
                >
                  <Trash2 size={10} />
                  Clear
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#1A3D26]">
                {history.slice(0, 3).map((h, i) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-[#0A1A12]/30">
                    <div className="flex items-center justify-between text-xs text-[#7DB892] mb-0.5">
                      <span>{OUTREACH_TYPES.find(t => t.id === h.type)?.label || h.type}</span>
                      <span>{format(new Date(h.generatedAt), 'd MMM HH:mm')}</span>
                    </div>
                    {h.subject && (
                      <p className="text-xs text-[#F0F7F2] font-medium truncate">{h.subject}</p>
                    )}
                    <p className="text-xs text-[#7DB892] mt-0.5 line-clamp-1">{h.body}</p>
                    <button
                      onClick={() => {
                        setOutput(h);
                        setOutreachType(h.type);
                        setCopied(false);
                        setLogged(false);
                      }}
                      className="text-xs text-[#2ECC71] hover:underline mt-0.5"
                    >
                      Load
                    </button>
                  </div>
                ))}
                {history.length > 3 && (
                  <div className="px-4 py-2 text-xs text-[#4a7a5a] text-center">
                    +{history.length - 3} more in history
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
