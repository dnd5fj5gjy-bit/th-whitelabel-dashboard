import {
  Printer, ExternalLink, Shield, Cpu, Users, Stethoscope, Building2,
  FlaskConical, CheckCircle2, ArrowRight, Pill, HeartPulse, MonitorSmartphone,
  Landmark, Phone, Globe, Activity, Clock
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Online Pharmacies', icon: Pill, pitch: 'Add TRT and ED services to your existing dispensing workflow — no clinical hires, no CQC registration, full branding control.' },
  { name: 'Telehealth Platforms', icon: MonitorSmartphone, pitch: 'Expand your men\'s health offering overnight with a plug-in clinical pathway that matches your existing UX.' },
  { name: "Men's Health Clinics", icon: HeartPulse, pitch: 'Go from referral-based TRT to a fully digital, scalable pathway that keeps patients in your brand.' },
  { name: 'ED Treatment Providers', icon: Activity, pitch: 'Bolt on TRT alongside your ED offering and double patient lifetime value with a clinically governed protocol.' },
  { name: 'Private GP Services', icon: Stethoscope, pitch: 'Offer specialist men\'s health pathways without hiring endocrinologists — all under your clinical governance umbrella.' },
  { name: 'Corporate Health Providers', icon: Building2, pitch: 'Add a premium men\'s health vertical to your corporate wellbeing package — fully managed, fully branded.' },
  { name: 'Sexual Health Clinics', icon: Shield, pitch: 'Extend your sexual health services with clinical-grade ED and TRT pathways that keep patients within your ecosystem.' },
];

const TIMELINE_STEPS = [
  { label: 'Register Interest', desc: 'Fill in the form or email us directly' },
  { label: 'Discovery Call', desc: '30-minute call to assess fit and model' },
  { label: 'Partnership Agreement', desc: 'Commercial terms, data processing, clinical governance' },
  { label: 'Branding Setup', desc: 'Your logo, colours, domain — we build it' },
  { label: 'Go Live', desc: 'Patients can access services under your brand' },
];

export default function PartnershipPage() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFFFE' }}>
      <style>{`
        @media print {
          body, #root { background: white !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b" style={{ background: '#FAFFFE', borderColor: '#d1e8d9' }}>
        <span className="text-sm font-medium" style={{ color: '#1A6B3C' }}>
          Ted's Health — Partnership Overview
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#1A6B3C', color: 'white' }}
        >
          <Printer size={14} />
          Print / Share
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16" style={{ color: '#1A2E23' }}>
        {/* HERO */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#1A2E23' }}>
            The UK's Only Licensable B2B<br />Clinical Platform for TRT & ED
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#3a5e47' }}>
            A fully white-label clinical platform that lets you offer Testosterone Replacement Therapy and
            Erectile Dysfunction services entirely under your own brand — with zero clinical infrastructure required.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="#register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#1A6B3C' }}
            >
              Register Interest
              <ArrowRight size={16} />
            </a>
            <a
              href="#discovery"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border-2 transition-colors hover:bg-[#1A6B3C]/5"
              style={{ color: '#1A6B3C', borderColor: '#1A6B3C' }}
            >
              Book a Discovery Call
              <Phone size={16} />
            </a>
          </div>
        </section>

        {/* WHAT WE'VE BUILT */}
        <section className="space-y-6">
          <SectionHeading icon={Cpu}>What We've Built — The Technology</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Full TRT clinical pathway — from blood test ordering through to ongoing prescribing and monitoring',
              'Full ED pathway — consultation, prescribing, dispensing, and follow-up',
              'Automated billing and revenue tracking per patient per partner',
              'Dedicated partner portal with real-time patient metrics and revenue dashboard',
              'Complete branding control — logo, colours, domain, email templates, patient-facing copy',
              'Configurable clinical rules — set your own formulary, dosing protocols, and escalation thresholds',
              'Patient management system with appointment scheduling, messaging, and document storage',
              'Integrated lab ordering with automatic result parsing and clinical flagging',
              'Secure video consultations via embedded Zoom SDK',
              'Automated ID verification via Onfido',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#f0f9f4' }}>
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: '#1A6B3C' }} />
                <span className="text-sm" style={{ color: '#1A2E23' }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CLINICAL INFRASTRUCTURE */}
        <section className="space-y-6">
          <SectionHeading icon={Stethoscope}>The Clinical Infrastructure</SectionHeading>
          <p className="text-sm" style={{ color: '#3a5e47' }}>
            Ted's Health has assembled the entire clinical supply chain so you don't have to.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'GMC-Registered Doctors', detail: 'Led by Dr Jonathan Andrews (CMO). Full prescribing team with men\'s health specialisation.' },
              { label: 'CQC Registration', detail: 'Ted\'s Health holds CQC registration — partners operating under FULL SERVICE inherit our compliance.' },
              { label: 'SignatureRx Pharmacy', detail: 'UK-regulated pharmacy partner handling dispensing, cold chain, and nationwide delivery.' },
              { label: 'Inuvi Labs', detail: 'Nationwide blood testing network. At-home kits and walk-in clinics. Automated result parsing.' },
              { label: 'Heim Nursing', detail: 'Nationwide nursing network for injection teaching, blood draws, and patient support.' },
              { label: 'Onfido ID Verification', detail: 'Automated identity verification and age confirmation before any clinical pathway begins.' },
              { label: 'Zoom SDK Video', detail: 'Embedded video consultations — no patient download required, fully branded.' },
              { label: 'Clinical Governance', detail: 'Full audit trail, adverse event reporting, clinical protocols reviewed quarterly.' },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border p-4" style={{ background: 'white', borderColor: '#d1e8d9' }}>
                <div className="font-semibold text-sm mb-1" style={{ color: '#1A2E23' }}>{item.label}</div>
                <div className="text-xs" style={{ color: '#3a5e47' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TWO MODELS */}
        <section className="space-y-6 print-break">
          <SectionHeading icon={Building2}>Two Models — One Platform</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FULL SERVICE */}
            <div className="rounded-xl border-2 p-6 space-y-4" style={{ background: 'white', borderColor: '#1A6B3C' }}>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#1A6B3C', color: 'white' }}>
                FULL SERVICE
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1A2E23' }}>We Run Everything</h3>
              <p className="text-sm" style={{ color: '#3a5e47' }}>
                Ted's Health provides the doctors, pharmacy, labs, nursing, prescribing licence, and CQC registration.
                Zero clinical infrastructure required from you.
              </p>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#1A6B3C' }}>
                  What you get:
                </div>
                {[
                  'GMC-registered prescribing team',
                  'CQC-registered clinical service',
                  'SignatureRx pharmacy dispensing',
                  'Inuvi lab test ordering & parsing',
                  'Heim nursing network',
                  'Full patient management platform',
                  'Complete white-label branding',
                  'Partner revenue dashboard',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#1A2E23' }}>
                    <CheckCircle2 size={14} style={{ color: '#1A6B3C' }} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t" style={{ borderColor: '#d1e8d9' }}>
                <div className="text-xs font-semibold" style={{ color: '#1A6B3C' }}>Best for:</div>
                <p className="text-xs" style={{ color: '#3a5e47' }}>
                  Online pharmacies, health platforms, and brands that want to launch men's health services
                  without any clinical hires, regulatory burden, or infrastructure investment.
                </p>
              </div>
            </div>

            {/* PLATFORM ONLY */}
            <div className="rounded-xl border-2 p-6 space-y-4" style={{ background: 'white', borderColor: '#3B82F6' }}>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#3B82F6', color: 'white' }}>
                PLATFORM ONLY
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1A2E23' }}>You Bring the Doctors</h3>
              <p className="text-sm" style={{ color: '#3a5e47' }}>
                You bring your own GMC-registered doctors and CQC registration. Ted's Health provides the technology,
                pharmacy integration, lab integration, and patient management platform.
              </p>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3B82F6' }}>
                  What you get:
                </div>
                {[
                  'Full patient management platform',
                  'SignatureRx pharmacy integration',
                  'Inuvi lab integration & parsing',
                  'Clinical pathway engine',
                  'Video consultation (Zoom SDK)',
                  'Automated ID verification',
                  'Complete white-label branding',
                  'Partner revenue dashboard',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#1A2E23' }}>
                    <CheckCircle2 size={14} style={{ color: '#3B82F6' }} />
                    {item}
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t" style={{ borderColor: '#d1e8d9' }}>
                <div className="text-xs font-semibold" style={{ color: '#3B82F6' }}>Best for:</div>
                <p className="text-xs" style={{ color: '#3a5e47' }}>
                  Private GP services, telehealth platforms, and clinics with existing clinical teams that want
                  a purpose-built men's health technology stack without building from scratch.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="space-y-6">
          <SectionHeading icon={Users}>Who It's For</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className="rounded-lg border p-4" style={{ background: 'white', borderColor: '#d1e8d9' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} style={{ color: '#1A6B3C' }} />
                    <span className="font-semibold text-sm" style={{ color: '#1A2E23' }}>{cat.name}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#3a5e47' }}>{cat.pitch}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* COMMERCIAL STRUCTURE */}
        <section className="space-y-6 print-break">
          <SectionHeading icon={Landmark}>Commercial Structure</SectionHeading>
          <p className="text-sm" style={{ color: '#3a5e47' }}>
            Transparent, predictable pricing aligned with your growth. No hidden costs.
          </p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#d1e8d9' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f0f9f4' }}>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1A2E23' }}>Fee Component</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1A2E23' }}>Description</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1A2E23' }}>Indicative Range</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Setup Fee', 'One-time onboarding: branding, configuration, integration, training', '\u00a32,500 - \u00a310,000'],
                  ['Platform Access Fee', 'Monthly access to the white-label platform, portal, and support', '\u00a3500 - \u00a32,000/mo'],
                  ['Per-Patient Fee', 'Charged per active patient per month across all pathways', '\u00a35 - \u00a315/patient/mo'],
                  ['Revenue Share', 'Percentage of consultation and treatment revenue', '10% - 25%'],
                ].map(([name, desc, range], i) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#d1e8d9', background: i % 2 ? '#f0f9f4' : 'white' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#1A2E23' }}>{name}</td>
                    <td className="px-5 py-3" style={{ color: '#3a5e47' }}>{desc}</td>
                    <td className="px-5 py-3 font-mono font-medium" style={{ color: '#1A6B3C' }}>{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs italic" style={{ color: '#7a9d85' }}>
            Final pricing is determined during the discovery call based on partner category, operating model, and expected patient volume.
          </p>
        </section>

        {/* TIMELINE */}
        <section className="space-y-6">
          <SectionHeading icon={Clock}>Timeline to Go Live</SectionHeading>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-0 md:gap-0">
            {TIMELINE_STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center text-center w-40">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2"
                    style={{ background: '#1A6B3C' }}
                  >
                    {i + 1}
                  </div>
                  <div className="font-semibold text-xs mb-1" style={{ color: '#1A2E23' }}>{step.label}</div>
                  <div className="text-[10px] leading-snug" style={{ color: '#3a5e47' }}>{step.desc}</div>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <ArrowRight size={20} className="hidden md:block shrink-0 mx-1" style={{ color: '#1A6B3C' }} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center pt-4">
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: '#1A6B3C', color: 'white' }}
            >
              First cohort: Q3 2026
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-8 border-t space-y-4 text-center" style={{ borderColor: '#d1e8d9' }}>
          <div className="text-lg font-bold" style={{ color: '#1A2E23' }}>Ted's Health</div>
          <div className="text-sm space-y-1" style={{ color: '#3a5e47' }}>
            <p>Part of the Bear Grylls Ventures portfolio</p>
            <p>
              <a href="mailto:partnerships@tedshealth.com" className="underline" style={{ color: '#1A6B3C' }}>
                partnerships@tedshealth.com
              </a>
            </p>
            <p>
              <a href="https://tedshealth.com" target="_blank" rel="noopener" className="underline" style={{ color: '#1A6B3C' }}>
                tedshealth.com
              </a>
            </p>
          </div>
          <div className="pt-4 text-xs" style={{ color: '#7a9d85' }}>
            This document is confidential and intended solely for the recipient. It contains commercially
            sensitive information about Ted's Health's white-label platform, pricing, and partnership structure.
            Do not distribute without written consent from Ted's Health.
          </div>
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#e0f5e9' }}>
        <Icon size={18} style={{ color: '#1A6B3C' }} />
      </div>
      <h2 className="text-xl font-bold" style={{ color: '#1A2E23' }}>{children}</h2>
    </div>
  );
}
