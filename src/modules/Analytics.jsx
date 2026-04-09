import { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, CATEGORIES } from '../lib/partners';
import { differenceInDays, subDays, format } from 'date-fns';
import {
  BarChart3, Users, Target, HandshakeIcon, AlertTriangle, TrendingUp,
  Zap, Lock, ArrowRight, Clock, Sparkles, Activity, Phone, Mail, ChevronRight
} from 'lucide-react';

const CATEGORY_COLORS = {
  'Telehealth Platform': '#3B82F6',
  'Online Pharmacy': '#10B981',
  "Men's Health Clinic": '#8B5CF6',
  'ED Treatment Provider': '#EC4899',
  'Private GP Service': '#F59E0B',
  'Corporate Health': '#06B6D4',
  'Sexual Health Clinic': '#EF4444',
};

const FUNNEL_STAGES = PIPELINE_STAGES.filter(s => s !== 'dead');
const FUNNEL_COLORS = {
  'identified': '#1A3D26',
  'contacted': '#1E5A32',
  'replied': '#22763E',
  'call-booked': '#26924A',
  'proposal-sent': '#2AAE56',
  'negotiating': '#2CC964',
  'signed': '#2ECC71',
};

export default function Analytics({ onNavigate }) {
  const { partners } = useStore();
  const [drilldownStage, setDrilldownStage] = useState(null);
  const [drilldownCategory, setDrilldownCategory] = useState(null);

  const active = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  const stats = useMemo(() => {
    const totalPipeline = active.length;
    const wave1Active = active.filter(p => p.wave === 'W1').length;
    const dealsInProgress = active.filter(p =>
      ['contacted', 'replied', 'call-booked', 'proposal-sent', 'negotiating'].includes(p.pipelineStage)
    ).length;
    const signed = active.filter(p => p.pipelineStage === 'signed').length;
    return { totalPipeline, wave1Active, dealsInProgress, signed };
  }, [active]);

  const overdue = useMemo(() => {
    const now = new Date();
    return active
      .map(p => {
        const actions = p.interactions.filter(i => i.nextActionDue && new Date(i.nextActionDue) < now);
        if (actions.length === 0) return null;
        const latest = actions.sort((a, b) => new Date(b.nextActionDue) - new Date(a.nextActionDue))[0];
        return {
          partner: p,
          action: latest.nextAction || 'Follow up',
          daysOverdue: differenceInDays(now, new Date(latest.nextActionDue)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [active]);

  const stageCounts = useMemo(() => {
    const counts = {};
    FUNNEL_STAGES.forEach(s => { counts[s] = 0; });
    active.forEach(p => { if (counts[p.pipelineStage] !== undefined) counts[p.pipelineStage]++; });
    return counts;
  }, [active]);

  const maxStageCount = useMemo(() => Math.max(...Object.values(stageCounts), 1), [stageCounts]);

  const categoryBreakdown = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catPartners = active.filter(p => p.category === cat);
      const stageDistribution = {};
      FUNNEL_STAGES.forEach(s => {
        stageDistribution[s] = catPartners.filter(p => p.pipelineStage === s).length;
      });
      return { category: cat, total: catPartners.length, stages: stageDistribution };
    }).filter(c => c.total > 0);
  }, [active]);

  const maxCatCount = useMemo(() => Math.max(...categoryBreakdown.map(c => c.total), 1), [categoryBreakdown]);

  const waveProgress = useMemo(() => {
    return ['W1', 'W2', 'W3'].map(wave => {
      const wavePartners = active.filter(p => p.wave === wave);
      const total = wavePartners.length;
      const contacted = wavePartners.filter(p => p.pipelineStage !== 'identified').length;
      const replied = wavePartners.filter(p =>
        ['replied', 'call-booked', 'proposal-sent', 'negotiating', 'signed'].includes(p.pipelineStage)
      ).length;
      const activeConvo = wavePartners.filter(p =>
        ['call-booked', 'proposal-sent', 'negotiating'].includes(p.pipelineStage)
      ).length;
      const contactedPct = total > 0 ? (contacted / total) * 100 : 0;
      return { wave, total, contacted, replied, activeConvo, contactedPct };
    });
  }, [active]);

  // Weekly spark chart data: interactions per day for last 7 days
  const dailyActivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLabel = format(d, 'EEE');
      let count = 0;
      active.forEach(p => {
        p.interactions.forEach(int => {
          if (int.date && int.date.startsWith(dateStr)) count++;
        });
      });
      days.push({ dateStr, dayLabel, count });
    }
    return days;
  }, [active]);

  const maxDailyCount = useMemo(() => Math.max(...dailyActivity.map(d => d.count), 1), [dailyActivity]);

  const weeklyActivity = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    let emailsSent = 0, callsHeld = 0, totalInteractions = 0;
    active.forEach(p => {
      p.interactions.forEach(i => {
        if (new Date(i.date) >= weekAgo) {
          totalInteractions++;
          if (i.type === 'Email Sent') emailsSent++;
          if (i.type === 'Call' || i.type === 'Meeting') callsHeld++;
        }
      });
    });
    return { emailsSent, callsHeld, totalInteractions };
  }, [active]);

  const topOpportunities = useMemo(() => {
    return active
      .filter(p => p.wave === 'W1' && p.pipelineStage === 'identified')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [active]);

  // Drilldown lists
  const drilldownPartners = useMemo(() => {
    if (drilldownStage) return active.filter(p => p.pipelineStage === drilldownStage);
    if (drilldownCategory) return active.filter(p => p.category === drilldownCategory);
    return [];
  }, [active, drilldownStage, drilldownCategory]);

  // Priority section logic
  const priority = useMemo(() => {
    if (overdue.length > 0) {
      return {
        type: 'overdue',
        message: `${overdue.length} overdue follow-up${overdue.length === 1 ? '' : 's'}`,
        action: 'Review overdue',
        severity: 'danger',
      };
    }
    const w1Uncontacted = active.filter(p => p.wave === 'W1' && p.pipelineStage === 'identified').length;
    if (w1Uncontacted > 0) {
      return {
        type: 'w1',
        message: `${w1Uncontacted} Wave 1 partner${w1Uncontacted === 1 ? '' : 's'} haven't been contacted yet`,
        action: 'Start outreach',
        severity: 'warning',
      };
    }
    const inProgress = active.filter(p =>
      ['replied', 'call-booked'].includes(p.pipelineStage)
    ).length;
    if (inProgress > 0) {
      return {
        type: 'progress',
        message: `${inProgress} active conversation${inProgress === 1 ? '' : 's'} to advance`,
        action: 'View pipeline',
        severity: 'info',
      };
    }
    return null;
  }, [overdue, active]);

  function handlePriorityAction() {
    if (!priority) return;
    if (priority.type === 'overdue') {
      // Scroll to overdue section or navigate
      const el = document.getElementById('overdue-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (priority.type === 'w1') {
      if (topOpportunities.length > 0) {
        onNavigate?.('outreach', { partnerId: topOpportunities[0].id });
      }
    } else {
      onNavigate?.('pipeline');
    }
  }

  function handleStageClick(stage) {
    setDrilldownCategory(null);
    setDrilldownStage(drilldownStage === stage ? null : stage);
  }

  function handleCategoryClick(category) {
    setDrilldownStage(null);
    setDrilldownCategory(drilldownCategory === category ? null : category);
  }

  return (
    <div className="space-y-6">
      {/* Overdue banner */}
      {overdue.length > 0 && (
        <div className="rounded-lg border border-[#C0392B]/40 bg-[#C0392B]/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#C0392B]" />
            <span className="text-sm font-medium text-[#C0392B]">
              {overdue.length} overdue follow-up{overdue.length === 1 ? '' : 's'}
            </span>
            <span className="text-xs text-[#C0392B]/70">
              -- most overdue: {overdue[0].partner.name} ({overdue[0].daysOverdue}d)
            </span>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('overdue-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs px-3 py-1.5 rounded-md bg-[#C0392B] text-white hover:bg-[#C0392B]/80 transition-colors"
          >
            Review
          </button>
        </div>
      )}

      {/* Today's Priority */}
      {priority && (
        <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
          priority.severity === 'danger'
            ? 'border-[#C0392B]/30 bg-[#C0392B]/5'
            : priority.severity === 'warning'
              ? 'border-[#E07B00]/30 bg-[#E07B00]/5'
              : 'border-[#1A6B3C]/30 bg-[#1A6B3C]/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              priority.severity === 'danger'
                ? 'bg-[#C0392B]/20'
                : priority.severity === 'warning'
                  ? 'bg-[#E07B00]/20'
                  : 'bg-[#1A6B3C]/20'
            }`}>
              <Target size={16} className={
                priority.severity === 'danger' ? 'text-[#C0392B]'
                  : priority.severity === 'warning' ? 'text-[#E07B00]'
                    : 'text-[#2ECC71]'
              } />
            </div>
            <div>
              <div className="text-xs text-[#7DB892] uppercase tracking-wider">Today's Priority</div>
              <div className="text-sm text-[#F0F7F2] font-medium">{priority.message}</div>
            </div>
          </div>
          <button
            onClick={handlePriorityAction}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors"
          >
            {priority.action}
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
          <BarChart3 size={20} className="text-[#2ECC71]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F0F7F2]">Analytics & Command View</h1>
          <p className="text-sm text-[#7DB892]">Pipeline health, activity metrics, and key opportunities</p>
        </div>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Pipeline" value={stats.totalPipeline} />
        <StatCard icon={Target} label="Wave 1 Active" value={stats.wave1Active} accent />
        <StatCard icon={TrendingUp} label="Deals in Progress" value={stats.dealsInProgress} />
        <StatCard icon={HandshakeIcon} label="Signed" value={stats.signed} accent />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Follow-ups"
          value={overdue.length}
          danger={overdue.length > 0}
        />
      </div>

      {/* Pipeline Funnel -- clickable */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
        <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#7DB892]" />
          Pipeline Funnel
          <span className="text-xs text-[#4a7a5a] font-normal ml-1">Click a stage to drill down</span>
        </h2>
        <div className="space-y-2">
          {FUNNEL_STAGES.map(stage => {
            const count = stageCounts[stage];
            const pct = (count / maxStageCount) * 100;
            const isActive = drilldownStage === stage;
            return (
              <button
                key={stage}
                onClick={() => handleStageClick(stage)}
                className={`w-full flex items-center gap-3 rounded-md transition-colors ${
                  isActive ? 'bg-[#0A1A12] ring-1 ring-[#2ECC71]/40' : 'hover:bg-[#0A1A12]/30'
                }`}
              >
                <div className="w-28 text-xs text-[#7DB892] text-right shrink-0 py-1">
                  {PIPELINE_STAGE_LABELS[stage]}
                </div>
                <div className="flex-1 h-7 bg-[#0A1A12] rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                      backgroundColor: isActive ? '#2ECC71' : FUNNEL_COLORS[stage],
                    }}
                  />
                  {count > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-[#F0F7F2] font-medium">
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage drilldown list */}
        {drilldownStage && drilldownPartners.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1A3D26]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#7DB892] uppercase tracking-wider">
                {PIPELINE_STAGE_LABELS[drilldownStage]} -- {drilldownPartners.length} partner{drilldownPartners.length === 1 ? '' : 's'}
              </h3>
              <button onClick={() => setDrilldownStage(null)} className="text-xs text-[#4a7a5a] hover:text-[#7DB892]">
                Close
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {drilldownPartners.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md bg-[#0A1A12] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[p.category] }} />
                    <span className="text-sm text-[#F0F7F2]">{p.name}</span>
                    <span className="text-xs text-[#7DB892] font-mono">{p.score}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate?.('pipeline', { partnerId: p.id })}
                      className="text-xs px-2 py-1 rounded bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onNavigate?.('outreach', { partnerId: p.id })}
                      className="text-xs px-2 py-1 rounded bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={10} />
                      Outreach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown -- clickable */}
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#7DB892]" />
            Category Breakdown
            <span className="text-xs text-[#4a7a5a] font-normal ml-1">Click to filter</span>
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map(({ category, total, stages }) => {
              const isActive = drilldownCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`w-full text-left rounded-md transition-colors ${isActive ? 'bg-[#0A1A12]/50 ring-1 ring-[#2ECC71]/30 p-2 -mx-2' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F0F7F2] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: CATEGORY_COLORS[category] }} />
                      {category}
                    </span>
                    <span className="font-mono text-[#7DB892]">{total}</span>
                  </div>
                  <div className="h-5 bg-[#0A1A12] rounded-md overflow-hidden flex" style={{ width: `${(total / maxCatCount) * 100}%`, minWidth: '40px' }}>
                    {FUNNEL_STAGES.map(stage => {
                      const count = stages[stage];
                      if (count === 0) return null;
                      return (
                        <div
                          key={stage}
                          className="h-full"
                          style={{
                            width: `${(count / total) * 100}%`,
                            backgroundColor: FUNNEL_COLORS[stage],
                            opacity: 0.7 + (FUNNEL_STAGES.indexOf(stage) / FUNNEL_STAGES.length) * 0.3,
                          }}
                          title={`${PIPELINE_STAGE_LABELS[stage]}: ${count}`}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}

            {/* Category drilldown list */}
            {drilldownCategory && (
              <div className="pt-3 border-t border-[#1A3D26]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-[#7DB892] uppercase tracking-wider">
                    {drilldownCategory} -- {drilldownPartners.length} partner{drilldownPartners.length === 1 ? '' : 's'}
                  </h3>
                  <button onClick={() => setDrilldownCategory(null)} className="text-xs text-[#4a7a5a] hover:text-[#7DB892]">
                    Close
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {drilldownPartners.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-md bg-[#0A1A12] px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#F0F7F2]">{p.name}</span>
                        <span className="text-[10px] text-[#7DB892] capitalize">{p.pipelineStage.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate?.('pipeline', { partnerId: p.id })}
                          className="text-xs px-2 py-1 rounded bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onNavigate?.('outreach', { partnerId: p.id })}
                          className="text-xs px-2 py-1 rounded bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors flex items-center gap-1"
                        >
                          <Sparkles size={10} />
                          Outreach
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 border-t border-[#1A3D26]">
              {FUNNEL_STAGES.map(stage => (
                <div key={stage} className="flex items-center gap-1 text-[10px] text-[#7DB892]">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: FUNNEL_COLORS[stage] }} />
                  {PIPELINE_STAGE_LABELS[stage]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Progress */}
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <Zap size={14} className="text-[#7DB892]" />
            Wave Progress
          </h2>
          <div className="space-y-4">
            {waveProgress.map((w, idx) => {
              const prevWave = idx > 0 ? waveProgress[idx - 1] : null;
              const isLocked = prevWave && prevWave.contactedPct < 50;
              return (
                <div
                  key={w.wave}
                  className={`rounded-md border p-3 ${isLocked ? 'border-[#1A3D26]/50 opacity-50' : 'border-[#1A3D26]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
                      {w.wave.replace('W', 'Wave ')}
                      <span className="text-xs font-mono text-[#7DB892]">({w.total} partners)</span>
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-xs text-[#E07B00]">
                        <Lock size={12} />
                        LOCKED
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                    <div>
                      <div className="font-mono text-[#F0F7F2] text-sm">{w.contacted}</div>
                      <div className="text-[#7DB892]">Contacted</div>
                    </div>
                    <div>
                      <div className="font-mono text-[#F0F7F2] text-sm">{w.replied}</div>
                      <div className="text-[#7DB892]">Replied</div>
                    </div>
                    <div>
                      <div className="font-mono text-[#F0F7F2] text-sm">{w.activeConvo}</div>
                      <div className="text-[#7DB892]">Active Convo</div>
                    </div>
                  </div>
                  <div className="h-2 bg-[#0A1A12] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${w.contactedPct}%`,
                        backgroundColor: w.contactedPct >= 50 ? '#2ECC71' : '#E07B00',
                      }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-[#7DB892] mt-1 font-mono">
                    {Math.round(w.contactedPct)}% contacted
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Follow-ups */}
        <div id="overdue-section" className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className={overdue.length > 0 ? 'text-[#C0392B]' : 'text-[#7DB892]'} />
            Overdue Follow-ups
            {overdue.length > 0 && (
              <span className="text-xs font-mono bg-[#C0392B]/20 text-[#C0392B] px-2 py-0.5 rounded-full">
                {overdue.length}
              </span>
            )}
          </h2>
          {overdue.length === 0 ? (
            <p className="text-sm text-[#7DB892] text-center py-4">No overdue follow-ups. Nice.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {overdue.map(({ partner: p, action, daysOverdue }) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3">
                  <div>
                    <div className="text-sm text-[#F0F7F2] font-medium">{p.name}</div>
                    <div className="text-xs text-[#7DB892]">{action}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#C0392B]">{daysOverdue}d overdue</span>
                    <button
                      onClick={() => onNavigate?.('pipeline', { partnerId: p.id })}
                      className="text-xs px-2 py-1 rounded bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
                    >
                      Log Activity
                    </button>
                    <button
                      onClick={() => onNavigate?.('outreach', { partnerId: p.id })}
                      className="text-xs px-2 py-1 rounded bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={10} />
                      Outreach
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Activity with spark chart */}
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#7DB892]" />
            Weekly Activity
          </h2>

          {/* Spark chart */}
          <div className="flex items-end gap-1 h-16 mb-4 px-1">
            {dailyActivity.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: `${Math.max((d.count / maxDailyCount) * 48, d.count > 0 ? 4 : 2)}px`,
                    backgroundColor: d.count > 0 ? '#2ECC71' : '#1A3D26',
                  }}
                />
                <span className="text-[9px] text-[#7DB892]">{d.dayLabel}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3 text-center">
              <Mail size={16} className="text-[#3B82F6] mx-auto mb-1" />
              <div className="text-xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.emailsSent}</div>
              <div className="text-[10px] text-[#7DB892] mt-0.5">Emails Sent</div>
            </div>
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3 text-center">
              <Phone size={16} className="text-[#2ECC71] mx-auto mb-1" />
              <div className="text-xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.callsHeld}</div>
              <div className="text-[10px] text-[#7DB892] mt-0.5">Calls / Meetings</div>
            </div>
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3 text-center">
              <Activity size={16} className="text-[#E07B00] mx-auto mb-1" />
              <div className="text-xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.totalInteractions}</div>
              <div className="text-[10px] text-[#7DB892] mt-0.5">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
        <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-[#2ECC71]" />
          Top Opportunities -- Wave 1, Not Yet Contacted
        </h2>
        {topOpportunities.length === 0 ? (
          <p className="text-sm text-[#7DB892] text-center py-4">All Wave 1 partners have been contacted.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {topOpportunities.map(p => (
              <div key={p.id} className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[p.category] }} />
                  <span className="text-xs text-[#7DB892] truncate">{p.category}</span>
                </div>
                <div className="text-sm text-[#F0F7F2] font-medium mb-1 truncate">{p.name}</div>
                <div className="text-lg font-mono text-[#2ECC71] font-semibold mb-2">{p.score}</div>
                <button
                  onClick={() => onNavigate?.('outreach', { partnerId: p.id })}
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white transition-colors"
                >
                  <Sparkles size={11} />
                  Generate Outreach
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, danger }) {
  return (
    <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={danger ? 'text-[#C0392B]' : 'text-[#7DB892]'} />
        <span className="text-xs text-[#7DB892]">{label}</span>
      </div>
      <div className={`text-3xl font-mono font-semibold ${danger ? 'text-[#C0392B]' : accent ? 'text-[#2ECC71]' : 'text-[#F0F7F2]'}`}>
        {value}
      </div>
    </div>
  );
}
