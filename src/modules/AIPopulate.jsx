import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { askClaude } from '../lib/ai';
import storage from '../lib/storage';
import { WAVES } from '../lib/partners';
import {
  Sparkles, Play, Square, CheckCircle, AlertTriangle, Clock, Eye,
  Copy, Check, ChevronDown, ChevronUp, Loader2, Wand2, BarChart3,
  X, RefreshCw, Filter, Users, Zap, FileText, Brain
} from 'lucide-react';
import { format } from 'date-fns';

const OUTREACH_SYSTEM_PROMPT = `You are a senior commercial partnerships manager at Ted's Health, the UK's only licensable B2B clinical platform for TRT (Testosterone Replacement Therapy) and ED (Erectile Dysfunction). Ted's Health offers a fully white-label platform allowing partners to offer TRT and ED services entirely under their own brand, with two operating models: FULL_SERVICE (Ted's provides the doctors, pharmacy, labs, nursing, prescribing licence and CQC registration — zero clinical infrastructure required from the partner) and PLATFORM_ONLY (partner brings their own GMC-registered doctors and CQC registration — Ted's provides only the technology, pharmacy integration via SignatureRx, labs via Inuvi, and patient management platform). Ted's Health is building its first cohort of white-label partners for a Q3 2026 launch. You write outreach that is personalised, insight-led, and never generic. You reference specific gaps in the partner's offering. You never mention Ted's Health in ways that break the white-label premise. You are direct, commercial, and concise.`;

const INTEL_SYSTEM_PROMPT = `You are a B2B intelligence analyst for Ted's Health. Provide a brief business overview of the target company, focusing on: what they do, their current service gaps (particularly around TRT/ED), why a white-label partnership would benefit them, key talking points for a discovery call, and potential objections to anticipate. Be specific and commercially focused. Under 200 words.`;

function buildOutreachPrompt(partner) {
  return `Write a Touch 1 cold outreach email to ${partner.name}.

Partner: ${partner.name}
Category: ${partner.category}
Operating Mode: ${partner.operatingMode}
Partner Score: ${partner.score}/100
ED Services: ${partner.edStatus ? 'Currently offers ED' : 'Does not offer ED'}
TRT Services: ${partner.trtStatus ? 'Currently offers TRT' : 'Does not offer TRT'}
Wave: ${partner.wave}
${partner.contactName ? `Contact Person: ${partner.contactName}` : ''}
${partner.contactJobTitle ? `Job Title: ${partner.contactJobTitle}` : ''}
${partner.website ? `Website: ${partner.website}` : ''}
${partner.notes ? `Notes: ${partner.notes}` : ''}

This is the first contact. Make it personalised, insight-led, and reference a specific gap in their current offering. Keep it concise -- under 200 words for the body.

Format your response as:
SUBJECT: [subject line]

[email body]`;
}

function buildIntelPrompt(partner) {
  return `Target Company: ${partner.name}
Category: ${partner.category}
Operating Mode: ${partner.operatingMode}
Partner Score: ${partner.score}/100
ED Services: ${partner.edStatus ? 'Currently offers ED' : 'Does not offer ED'}
TRT Services: ${partner.trtStatus ? 'Currently offers TRT' : 'Does not offer TRT'}
${partner.website ? `Website: ${partner.website}` : ''}
${partner.notes ? `Notes: ${partner.notes}` : ''}

Provide the business intelligence brief.`;
}

function getOutreach(partnerId) {
  return storage.get(`outreach:${partnerId}`, null);
}

function setOutreach(partnerId, data) {
  storage.set(`outreach:${partnerId}`, data);
}

function getIntel(partnerId) {
  return storage.get(`intel:${partnerId}`, null);
}

function setIntel(partnerId, data) {
  storage.set(`intel:${partnerId}`, data);
}

function ContentModal({ title, content, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = content.subject
      ? `Subject: ${content.subject}\n\n${content.body}`
      : (content.text || content.body || '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-8">
        <div className="w-full max-w-2xl bg-[#0F2318] border border-[#1A3D26] rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3D26]">
            <h3 className="text-sm font-semibold text-[#F0F7F2]">{title}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
              >
                {copied ? <Check size={12} className="text-[#2ECC71]" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={onClose} className="text-[#7DB892] hover:text-[#F0F7F2]">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {content.subject && (
              <div>
                <div className="text-xs text-[#7DB892] mb-1 uppercase tracking-wider">Subject Line</div>
                <div className="text-[#F0F7F2] font-medium bg-[#0A1A12] rounded-md px-3 py-2 border border-[#1A3D26]">
                  {content.subject}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[#7DB892] mb-1 uppercase tracking-wider">
                {content.subject ? 'Email Body' : 'Intelligence Brief'}
              </div>
              <div className="text-[#F0F7F2] text-sm leading-relaxed whitespace-pre-wrap bg-[#0A1A12] rounded-md px-4 py-3 border border-[#1A3D26]">
                {content.body || content.text}
              </div>
            </div>
            {content.generatedAt && (
              <div className="text-[10px] text-[#7DB892]/50">
                Generated {format(new Date(content.generatedAt), 'dd MMM yyyy, HH:mm')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AIPopulate({ onNavigate }) {
  const { partners, settings } = useStore();
  const active = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  // State
  const [selectedWave, setSelectedWave] = useState('W1');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [currentStep, setCurrentStep] = useState(''); // 'outreach' | 'intel'
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState([]);
  const [viewContent, setViewContent] = useState(null); // { title, content }
  const [showResults, setShowResults] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const cancelRef = useRef(false);
  const timerRef = useRef(null);

  // Compute status counts
  const statusCounts = useMemo(() => {
    let outreachCount = 0;
    let intelCount = 0;
    let bothCount = 0;
    active.forEach(p => {
      const hasOutreach = !!getOutreach(p.id);
      const hasIntel = !!getIntel(p.id);
      if (hasOutreach) outreachCount++;
      if (hasIntel) intelCount++;
      if (hasOutreach && hasIntel) bothCount++;
    });
    return { outreachCount, intelCount, bothCount, total: active.length };
  }, [active, processedCount]); // processedCount forces recompute after processing

  // Partners for selected wave
  const wavePartners = useMemo(() => {
    return active.filter(p => p.wave === selectedWave);
  }, [active, selectedWave]);

  // Wave status counts
  const waveStatus = useMemo(() => {
    let outreach = 0, intel = 0, both = 0;
    wavePartners.forEach(p => {
      const hasO = !!getOutreach(p.id);
      const hasI = !!getIntel(p.id);
      if (hasO) outreach++;
      if (hasI) intel++;
      if (hasO && hasI) both++;
    });
    return { outreach, intel, both, total: wavePartners.length };
  }, [wavePartners, processedCount]);

  // Elapsed timer
  useEffect(() => {
    if (processing && startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [processing, startTime]);

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Toggle selection
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(wavePartners.map(p => p.id)));
  }, [wavePartners]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectUnprocessed = useCallback(() => {
    const ids = wavePartners
      .filter(p => !getOutreach(p.id) || !getIntel(p.id))
      .map(p => p.id);
    setSelectedIds(new Set(ids));
  }, [wavePartners]);

  // Process partners
  const processPartners = useCallback(async (partnerList) => {
    if (!settings.apiKey) {
      setErrors([{ partner: 'System', error: 'No API key configured. Go to Settings first.' }]);
      return;
    }

    cancelRef.current = false;
    setProcessing(true);
    setProcessedCount(0);
    setTotalToProcess(partnerList.length);
    setStartTime(Date.now());
    setElapsed(0);
    setErrors([]);
    setShowResults(false);

    const newErrors = [];

    for (let i = 0; i < partnerList.length; i++) {
      if (cancelRef.current) break;

      const partner = partnerList[i];
      setCurrentPartner(partner);
      setProcessedCount(i);

      // Generate outreach if not already cached
      if (!getOutreach(partner.id)) {
        setCurrentStep('outreach');
        try {
          const result = await askClaude(OUTREACH_SYSTEM_PROMPT, buildOutreachPrompt(partner), 1024);
          let subject = '';
          let body = result;
          const subjectMatch = result.match(/^SUBJECT:\s*(.+?)(?:\n|$)/im);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
            body = result.slice(subjectMatch.index + subjectMatch[0].length).trim();
          }
          setOutreach(partner.id, {
            subject,
            body,
            type: 'touch-1',
            generatedAt: new Date().toISOString(),
          });
        } catch (err) {
          newErrors.push({ partner: partner.name, error: `Outreach: ${err.message}` });
        }
      }

      if (cancelRef.current) break;

      // Generate intel if not already cached
      if (!getIntel(partner.id)) {
        setCurrentStep('intel');
        try {
          const result = await askClaude(INTEL_SYSTEM_PROMPT, buildIntelPrompt(partner), 512);
          setIntel(partner.id, {
            text: result,
            generatedAt: new Date().toISOString(),
          });
        } catch (err) {
          newErrors.push({ partner: partner.name, error: `Intel: ${err.message}` });
        }
      }

      if (cancelRef.current) break;

      // Delay between partners to avoid rate limits
      if (i < partnerList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }

    setErrors(newErrors);
    setProcessedCount(cancelRef.current ? processedCount : partnerList.length);
    setCurrentPartner(null);
    setCurrentStep('');
    setProcessing(false);
    setShowResults(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [settings.apiKey]);

  const handleAutoPopulateAll = useCallback(() => {
    const toProcess = wavePartners.filter(p => !getOutreach(p.id) || !getIntel(p.id));
    if (toProcess.length === 0) {
      // All already processed, reprocess all
      processPartners(wavePartners);
    } else {
      processPartners(toProcess);
    }
  }, [wavePartners, processPartners]);

  const handleProcessSelected = useCallback(() => {
    const toProcess = wavePartners.filter(p => selectedIds.has(p.id));
    processPartners(toProcess);
  }, [wavePartners, selectedIds, processPartners]);

  const handleStop = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const hasApiKey = !!settings.apiKey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1A6B3C] to-[#2ECC71]/40 flex items-center justify-center">
            <Wand2 size={20} className="text-[#2ECC71]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F0F7F2]">AI Command Centre</h1>
            <p className="text-sm text-[#7DB892]">Batch-generate outreach and intelligence for all partners</p>
          </div>
        </div>
        {!hasApiKey && (
          <button
            onClick={() => onNavigate?.('settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E07B00]/40 bg-[#E07B00]/10 text-[#E07B00] text-sm font-medium hover:bg-[#E07B00]/20 transition-colors"
          >
            <AlertTriangle size={14} />
            Configure API Key
          </button>
        )}
      </div>

      {/* Dashboard Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-[#7DB892]" />
            <span className="text-xs text-[#7DB892]">Total Partners</span>
          </div>
          <div className="text-3xl font-mono font-semibold text-[#F0F7F2]">{statusCounts.total}</div>
        </div>
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-[#7DB892]" />
            <span className="text-xs text-[#7DB892]">Outreach Generated</span>
          </div>
          <div className="text-3xl font-mono font-semibold text-[#2ECC71]">
            {statusCounts.outreachCount}
            <span className="text-sm text-[#7DB892] font-normal ml-1">/ {statusCounts.total}</span>
          </div>
        </div>
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-[#7DB892]" />
            <span className="text-xs text-[#7DB892]">Intel Generated</span>
          </div>
          <div className="text-3xl font-mono font-semibold text-[#2ECC71]">
            {statusCounts.intelCount}
            <span className="text-sm text-[#7DB892] font-normal ml-1">/ {statusCounts.total}</span>
          </div>
        </div>
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-[#7DB892]" />
            <span className="text-xs text-[#7DB892]">Fully Populated</span>
          </div>
          <div className="text-3xl font-mono font-semibold text-[#2ECC71]">
            {statusCounts.bothCount}
            <span className="text-sm text-[#7DB892] font-normal ml-1">/ {statusCounts.total}</span>
          </div>
          <div className="mt-2 h-1.5 bg-[#0A1A12] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2ECC71] transition-all duration-500"
              style={{ width: `${statusCounts.total > 0 ? (statusCounts.bothCount / statusCounts.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Wave Selector + Action Buttons */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
            <Zap size={14} className="text-[#2ECC71]" />
            Batch Processing
          </h2>
          <div className="flex items-center gap-2">
            {WAVES.map(w => (
              <button
                key={w}
                onClick={() => { setSelectedWave(w); setSelectedIds(new Set()); setSelectMode(false); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  selectedWave === w
                    ? 'bg-[#2ECC71] text-[#0A1A12]'
                    : 'bg-[#0A1A12] text-[#7DB892] border border-[#1A3D26] hover:border-[#2ECC71]/40 hover:text-[#2ECC71]'
                }`}
              >
                {w.replace('W', 'Wave ')}
              </button>
            ))}
          </div>
        </div>

        {/* Wave status */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-[#0A1A12] rounded-md px-3 py-2 text-center">
            <div className="text-lg font-mono text-[#F0F7F2] font-semibold">{waveStatus.total}</div>
            <div className="text-[10px] text-[#7DB892]">Partners</div>
          </div>
          <div className="bg-[#0A1A12] rounded-md px-3 py-2 text-center">
            <div className="text-lg font-mono text-[#2ECC71] font-semibold">{waveStatus.outreach}</div>
            <div className="text-[10px] text-[#7DB892]">Outreach</div>
          </div>
          <div className="bg-[#0A1A12] rounded-md px-3 py-2 text-center">
            <div className="text-lg font-mono text-[#2ECC71] font-semibold">{waveStatus.intel}</div>
            <div className="text-[10px] text-[#7DB892]">Intel</div>
          </div>
          <div className="bg-[#0A1A12] rounded-md px-3 py-2 text-center">
            <div className="text-lg font-mono font-semibold" style={{ color: waveStatus.both === waveStatus.total && waveStatus.total > 0 ? '#2ECC71' : '#E07B00' }}>
              {waveStatus.total > 0 ? Math.round((waveStatus.both / waveStatus.total) * 100) : 0}%
            </div>
            <div className="text-[10px] text-[#7DB892]">Complete</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {!processing ? (
            <>
              <button
                onClick={handleAutoPopulateAll}
                disabled={!hasApiKey || wavePartners.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#1A6B3C] to-[#2ECC71]/80 hover:from-[#2ECC71]/80 hover:to-[#2ECC71] text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#2ECC71]/10"
              >
                <Play size={16} />
                Auto-Populate {selectedWave.replace('W', 'Wave ')}
                {waveStatus.both < waveStatus.total && (
                  <span className="ml-1 text-xs opacity-80">
                    ({waveStatus.total - waveStatus.both} remaining)
                  </span>
                )}
              </button>

              <button
                onClick={() => setSelectMode(!selectMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectMode
                    ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/40'
                    : 'border border-[#1A3D26] text-[#7DB892] hover:text-[#2ECC71] hover:border-[#2ECC71]/40'
                }`}
              >
                <Filter size={14} />
                Select Specific
              </button>

              {selectMode && selectedIds.size > 0 && (
                <button
                  onClick={handleProcessSelected}
                  disabled={!hasApiKey}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  <Sparkles size={14} />
                  Process Selected ({selectedIds.size})
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C0392B] hover:bg-[#C0392B]/80 text-white font-medium text-sm transition-colors"
            >
              <Square size={14} />
              Stop Processing
            </button>
          )}
        </div>

        {/* Selection controls */}
        {selectMode && !processing && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={selectAll} className="text-xs text-[#7DB892] hover:text-[#2ECC71] transition-colors">
              Select All
            </button>
            <span className="text-[#1A3D26]">|</span>
            <button onClick={selectNone} className="text-xs text-[#7DB892] hover:text-[#2ECC71] transition-colors">
              Select None
            </button>
            <span className="text-[#1A3D26]">|</span>
            <button onClick={selectUnprocessed} className="text-xs text-[#7DB892] hover:text-[#2ECC71] transition-colors">
              Select Unprocessed
            </button>
            <span className="text-xs text-[#7DB892] ml-auto">{selectedIds.size} selected</span>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {processing && (
        <div className="rounded-lg border border-[#2ECC71]/30 bg-[#0F2318] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-[#2ECC71] animate-spin" />
              <div>
                <div className="text-sm font-medium text-[#F0F7F2]">
                  Processing: {currentPartner?.name || '...'}
                </div>
                <div className="text-xs text-[#7DB892] mt-0.5">
                  {currentStep === 'outreach' ? 'Generating outreach email...' : 'Generating business intelligence...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#7DB892] font-mono">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatElapsed(elapsed)}
              </span>
              <span className="text-[#2ECC71] font-semibold">
                {processedCount} / {totalToProcess}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-[#0A1A12] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1A6B3C] to-[#2ECC71] transition-all duration-300"
              style={{ width: `${totalToProcess > 0 ? (processedCount / totalToProcess) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-[#7DB892]">
            <span>{Math.round(totalToProcess > 0 ? (processedCount / totalToProcess) * 100 : 0)}% complete</span>
            {processedCount > 0 && (
              <span>
                ~{Math.round(((elapsed / processedCount) * (totalToProcess - processedCount)) / 60)}m remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-[#C0392B]" />
            <span className="text-sm font-medium text-[#C0392B]">{errors.length} error{errors.length !== 1 ? 's' : ''} during processing</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {errors.map((e, i) => (
              <div key={i} className="text-xs text-[#7DB892]">
                <span className="text-[#F0F7F2]">{e.partner}:</span> {e.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table / Partner List */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A3D26]">
          <h2 className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
            <BarChart3 size={14} className="text-[#7DB892]" />
            {selectedWave.replace('W', 'Wave ')} Partners
            <span className="text-xs font-normal text-[#7DB892]">({wavePartners.length})</span>
          </h2>
          {showResults && !processing && (
            <span className="flex items-center gap-1.5 text-xs text-[#2ECC71]">
              <CheckCircle size={12} />
              Batch complete -- {formatElapsed(elapsed)} elapsed
            </span>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b border-[#1A3D26] text-[10px] text-[#7DB892] uppercase tracking-wider">
          {selectMode && <div className="col-span-1">Select</div>}
          <div className={selectMode ? 'col-span-3' : 'col-span-4'}>Partner</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2 text-center">Outreach</div>
          <div className="col-span-2 text-center">Intel</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {/* Table rows */}
        <div className="max-h-[480px] overflow-y-auto divide-y divide-[#1A3D26]/50">
          {wavePartners.length === 0 ? (
            <div className="text-center py-12 text-[#7DB892] text-sm">
              No partners in {selectedWave.replace('W', 'Wave ')}
            </div>
          ) : (
            wavePartners.map(p => {
              const hasOutreach = !!getOutreach(p.id);
              const hasIntel = !!getIntel(p.id);
              const isSelected = selectedIds.has(p.id);
              const isCurrentlyProcessing = processing && currentPartner?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 gap-2 px-5 py-2.5 items-center text-sm transition-colors ${
                    isCurrentlyProcessing ? 'bg-[#2ECC71]/5' : 'hover:bg-[#0A1A12]/30'
                  }`}
                >
                  {selectMode && (
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        className="accent-[#2ECC71]"
                      />
                    </div>
                  )}
                  <div className={`${selectMode ? 'col-span-3' : 'col-span-4'} flex items-center gap-2`}>
                    {isCurrentlyProcessing && (
                      <Loader2 size={12} className="text-[#2ECC71] animate-spin flex-shrink-0" />
                    )}
                    <span className="text-[#F0F7F2] font-medium truncate">{p.name}</span>
                  </div>
                  <div className="col-span-2 text-xs text-[#7DB892] truncate">{p.category}</div>
                  <div className="col-span-1 text-center text-xs font-mono text-[#2ECC71]">{p.score}</div>
                  <div className="col-span-2 text-center">
                    {hasOutreach ? (
                      <button
                        onClick={() => setViewContent({ title: `Outreach -- ${p.name}`, content: getOutreach(p.id) })}
                        className="inline-flex items-center gap-1 text-xs text-[#2ECC71] hover:text-[#2ECC71]/80 transition-colors"
                      >
                        <CheckCircle size={12} />
                        <span>View</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#7DB892]/40">--</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {hasIntel ? (
                      <button
                        onClick={() => setViewContent({ title: `Intel -- ${p.name}`, content: getIntel(p.id) })}
                        className="inline-flex items-center gap-1 text-xs text-[#2ECC71] hover:text-[#2ECC71]/80 transition-colors"
                      >
                        <CheckCircle size={12} />
                        <span>View</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#7DB892]/40">--</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => onNavigate?.('outreach', { partnerId: p.id })}
                      className="text-xs text-[#7DB892] hover:text-[#2ECC71] transition-colors"
                      title="Open in AI Outreach"
                    >
                      <Sparkles size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Content viewer modal */}
      {viewContent && (
        <ContentModal
          title={viewContent.title}
          content={viewContent.content}
          onClose={() => setViewContent(null)}
        />
      )}
    </div>
  );
}
