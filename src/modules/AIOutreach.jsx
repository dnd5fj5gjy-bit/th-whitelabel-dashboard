import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { askClaude } from '../lib/ai';
import { differenceInDays, format } from 'date-fns';
import {
  Sparkles, Copy, Check, Send, ChevronDown, Loader2, Clock, User,
  Building2, Zap, Mail, Phone, FileText, MessageSquare, Trash2
} from 'lucide-react';

const OUTREACH_TYPES = [
  { id: 'touch-1', label: 'Touch 1 — Cold Email', desc: 'First contact. Personalised, insight-led. Reference a gap in their current offering.' },
  { id: 'touch-2', label: 'Touch 2 — Follow-up with Value Add', desc: 'Day 6-8. Share a relevant insight, case study, or commercial angle they haven\'t considered.' },
  { id: 'touch-3', label: 'Touch 3 — Low-friction Close', desc: 'Day 14-16. Short, direct. Ask for 15 minutes. Remove all friction.' },
  { id: 'call-prep', label: 'Call Prep — Talking Points', desc: 'Discovery call talking points. Key questions, value hooks, objection handling.' },
  { id: 'post-call', label: 'Post-call Follow-up', desc: 'Summary of discussion, agreed next steps, timeline confirmation email.' },
  { id: 'custom', label: 'Custom', desc: 'Write your own instruction for what to generate.' },
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

export default function AIOutreach({ params }) {
  const { partners, addInteraction } = useStore();
  const activePartners = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  const [selectedPartnerId, setSelectedPartnerId] = useState(params?.partnerId || '');
  const [outreachType, setOutreachType] = useState('touch-1');
  const [customInstruction, setCustomInstruction] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (params?.partnerId) setSelectedPartnerId(params.partnerId);
  }, [params?.partnerId]);

  const partner = useMemo(() => partners.find(p => p.id === selectedPartnerId), [partners, selectedPartnerId]);

  useEffect(() => {
    if (partner) {
      setHistory(getOutreachHistory(partner.id));
    } else {
      setHistory([]);
    }
  }, [partner]);

  const daysSinceLastContact = useMemo(() => {
    if (!partner || !partner.interactions.length) return null;
    const sorted = [...partner.interactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return differenceInDays(new Date(), new Date(sorted[0].date));
  }, [partner]);

  function buildUserPrompt() {
    if (!partner) return '';
    const interactionHistory = partner.interactions.length > 0
      ? partner.interactions.map(i =>
        `[${i.date}] ${i.type}: ${i.subject}${i.outcome ? ` — Outcome: ${i.outcome}` : ''}${i.nextAction ? ` — Next: ${i.nextAction}` : ''}`
      ).join('\n')
      : 'No previous interactions.';

    const typeInstruction = {
      'touch-1': 'Write a Touch 1 cold outreach email. This is the first contact. Make it personalised, insight-led, and reference a specific gap in their current offering. Keep it concise — under 200 words for the body.',
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

  function handleLogAsSent() {
    if (!partner || !output || logged) return;
    addInteraction(partner.id, {
      id: `int-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Email Sent',
      subject: output.subject || `${OUTREACH_TYPES.find(t => t.id === outreachType)?.label || 'Outreach'} — AI Generated`,
      outcome: 'Sent via AI Outreach',
      nextAction: outreachType === 'touch-1' ? 'Follow up in 6-8 days' : outreachType === 'touch-2' ? 'Final follow-up in 7-8 days' : '',
      nextActionDue: outreachType === 'touch-1'
        ? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        : outreachType === 'touch-2'
          ? new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0]
          : '',
    });
    setLogged(true);
  }

  function handleClearHistory() {
    if (!partner) return;
    clearOutreachHistory(partner.id);
    setHistory([]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
            <Sparkles size={20} className="text-[#2ECC71]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F0F7F2]">AI Outreach Assistant</h1>
            <p className="text-sm text-[#7DB892]">Generate personalised outreach powered by Claude</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Config */}
        <div className="lg:col-span-1 space-y-4">
          {/* Partner selector */}
          <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
            <label className="block text-sm font-medium text-[#7DB892] mb-2">Select Partner</label>
            <div className="relative">
              <select
                value={selectedPartnerId}
                onChange={e => { setSelectedPartnerId(e.target.value); setOutput(null); }}
                className="w-full appearance-none bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 pr-8 text-[#F0F7F2] text-sm"
              >
                <option value="">Choose a partner...</option>
                {activePartners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7DB892] pointer-events-none" />
            </div>
          </div>

          {/* Partner summary */}
          {partner && (
            <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
                <Building2 size={14} className="text-[#7DB892]" />
                Partner Profile
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-[#7DB892]">Category</span>
                  <p className="text-[#F0F7F2] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: CATEGORY_COLORS[partner.category] || '#7DB892' }} />
                    {partner.category}
                  </p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Mode</span>
                  <p className="text-[#F0F7F2] font-mono">{partner.operatingMode}</p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Score</span>
                  <p className="text-[#F0F7F2] font-mono">{partner.score}/100</p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Wave</span>
                  <p className="text-[#F0F7F2] font-mono">{partner.wave}</p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Stage</span>
                  <p className="text-[#F0F7F2] capitalize">{partner.pipelineStage.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Last Contact</span>
                  <p className="text-[#F0F7F2]">
                    {daysSinceLastContact !== null ? `${daysSinceLastContact}d ago` : 'Never'}
                  </p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Interactions</span>
                  <p className="text-[#F0F7F2] font-mono">{partner.interactions.length}</p>
                </div>
                <div>
                  <span className="text-[#7DB892]">Services</span>
                  <p className="text-[#F0F7F2]">
                    {[partner.edStatus && 'ED', partner.trtStatus && 'TRT'].filter(Boolean).join(', ') || 'None'}
                  </p>
                </div>
              </div>
              {partner.contactName && (
                <div className="pt-2 border-t border-[#1A3D26] text-xs">
                  <div className="flex items-center gap-1.5 text-[#7DB892]">
                    <User size={12} />
                    <span>{partner.contactName}</span>
                    {partner.contactJobTitle && <span className="text-[#4a7a5a]">({partner.contactJobTitle})</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Output type */}
          <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
              <Mail size={14} className="text-[#7DB892]" />
              Output Type
            </h3>
            <div className="space-y-2">
              {OUTREACH_TYPES.map(t => (
                <label
                  key={t.id}
                  className={`block rounded-md border p-3 cursor-pointer transition-colors ${outreachType === t.id
                    ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                    : 'border-[#1A3D26] hover:border-[#1A6B3C]'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="outreach-type"
                      value={t.id}
                      checked={outreachType === t.id}
                      onChange={() => setOutreachType(t.id)}
                      className="mt-0.5 accent-[#2ECC71]"
                    />
                    <div>
                      <div className="text-sm font-medium text-[#F0F7F2]">{t.label}</div>
                      <div className="text-xs text-[#7DB892] mt-0.5">{t.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {outreachType === 'custom' && (
              <textarea
                value={customInstruction}
                onChange={e => setCustomInstruction(e.target.value)}
                placeholder="Describe what you want generated..."
                rows={3}
                className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a] resize-none"
              />
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!partner || loading || (outreachType === 'custom' && !customInstruction.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Outreach
              </>
            )}
          </button>
        </div>

        {/* Right column — Output */}
        <div className="lg:col-span-2 space-y-4">
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
              <div className="space-y-2">
                <div className="h-3 bg-[#1A3D26] rounded w-full" />
                <div className="h-3 bg-[#1A3D26] rounded w-5/6" />
                <div className="h-3 bg-[#1A3D26] rounded w-2/3" />
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
                    onClick={handleLogAsSent}
                    disabled={logged}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${logged
                      ? 'bg-[#2ECC71]/20 text-[#2ECC71] cursor-default'
                      : 'bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white'
                      }`}
                  >
                    {logged ? <Check size={12} /> : <Send size={12} />}
                    {logged ? 'Logged' : 'Log as Sent'}
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
          {!output && !loading && !error && (
            <div className="rounded-lg border border-[#1A3D26] border-dashed bg-[#0F2318]/50 p-12 flex flex-col items-center justify-center text-center">
              <Sparkles size={32} className="text-[#1A3D26] mb-3" />
              <p className="text-[#7DB892] text-sm">
                {partner ? 'Select an output type and click Generate' : 'Select a partner to get started'}
              </p>
            </div>
          )}

          {/* History */}
          {partner && history.length > 0 && (
            <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318]">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#7DB892] hover:text-[#F0F7F2] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock size={14} />
                  Previous Generations ({history.length})
                </span>
                <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              {showHistory && (
                <div className="border-t border-[#1A3D26]">
                  <div className="flex justify-end px-4 pt-2">
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-xs text-[#C0392B] hover:text-[#C0392B]/80 transition-colors"
                    >
                      <Trash2 size={10} />
                      Clear History
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-[#1A3D26]">
                    {history.map((h, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-[#0A1A12]/30">
                        <div className="flex items-center justify-between text-xs text-[#7DB892] mb-1">
                          <span>{OUTREACH_TYPES.find(t => t.id === h.type)?.label || h.type}</span>
                          <span>{format(new Date(h.generatedAt), 'd MMM yyyy HH:mm')}</span>
                        </div>
                        {h.subject && (
                          <p className="text-sm text-[#F0F7F2] font-medium truncate">{h.subject}</p>
                        )}
                        <p className="text-xs text-[#7DB892] mt-1 line-clamp-2">{h.body}</p>
                        <button
                          onClick={() => {
                            setOutput(h);
                            setOutreachType(h.type);
                            setCopied(false);
                            setLogged(false);
                          }}
                          className="text-xs text-[#2ECC71] hover:underline mt-1"
                        >
                          Load this output
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
