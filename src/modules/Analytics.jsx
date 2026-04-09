import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, CATEGORIES } from '../lib/partners';
import { differenceInDays, subDays, format } from 'date-fns';
import {
  BarChart3, Users, Target, HandshakeIcon, AlertTriangle, TrendingUp,
  Zap, Lock, ArrowRight, Clock, Sparkles, Activity, Phone, Mail
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

  const active = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  const stats = useMemo(() => {
    const totalPipeline = active.length;
    const wave1Active = active.filter(p => p.wave === 'W1').length;
    const dealsInProgress = active.filter(p =>
      ['contacted', 'replied', 'call-booked', 'proposal-sent', 'negotiating'].includes(p.pipelineStage)
    ).length;
    const signed = active.filter(p => p.pipelineStage === 'signed').length;

    const now = new Date();
    const overdue = active.filter(p => {
      const lastInteraction = p.interactions.find(i => i.nextActionDue);
      if (!lastInteraction) return false;
      return new Date(lastInteraction.nextActionDue) < now;
    });

    return { totalPipeline, wave1Active, dealsInProgress, signed, overdue };
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

  return (
    <div className="space-y-6">
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

      {/* Pipeline Funnel */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
        <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#7DB892]" />
          Pipeline Funnel
        </h2>
        <div className="space-y-2">
          {FUNNEL_STAGES.map(stage => {
            const count = stageCounts[stage];
            const pct = (count / maxStageCount) * 100;
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-28 text-xs text-[#7DB892] text-right shrink-0">
                  {PIPELINE_STAGE_LABELS[stage]}
                </div>
                <div className="flex-1 h-7 bg-[#0A1A12] rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                      backgroundColor: FUNNEL_COLORS[stage],
                    }}
                  />
                  {count > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-[#F0F7F2] font-medium">
                      {count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-[#7DB892]" />
            Category Breakdown
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map(({ category, total, stages }) => (
              <div key={category}>
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
              </div>
            ))}
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
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#C0392B]">{daysOverdue}d overdue</span>
                    <button
                      onClick={() => onNavigate?.('partners', { partnerId: p.id, openActivity: true })}
                      className="text-xs px-2 py-1 rounded bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] transition-colors"
                    >
                      Log Activity
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
          <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#7DB892]" />
            Weekly Activity Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-4 text-center">
              <Mail size={18} className="text-[#3B82F6] mx-auto mb-2" />
              <div className="text-2xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.emailsSent}</div>
              <div className="text-xs text-[#7DB892] mt-1">Emails Sent</div>
            </div>
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-4 text-center">
              <Phone size={18} className="text-[#2ECC71] mx-auto mb-2" />
              <div className="text-2xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.callsHeld}</div>
              <div className="text-xs text-[#7DB892] mt-1">Calls / Meetings</div>
            </div>
            <div className="rounded-md border border-[#1A3D26] bg-[#0A1A12] p-4 text-center">
              <Activity size={18} className="text-[#E07B00] mx-auto mb-2" />
              <div className="text-2xl font-mono text-[#F0F7F2] font-semibold">{weeklyActivity.totalInteractions}</div>
              <div className="text-xs text-[#7DB892] mt-1">Total Interactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-5">
        <h2 className="text-sm font-semibold text-[#F0F7F2] mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-[#2ECC71]" />
          Top Opportunities — Wave 1, Not Yet Contacted
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
