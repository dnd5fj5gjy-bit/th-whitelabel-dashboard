import { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { useStore } from '../hooks/useStore';
import { format } from 'date-fns';
import {
  FileText, ChevronDown, Download, Copy, Check, Building2,
  Calendar, Loader2, AlertCircle
} from 'lucide-react';

const AGREEMENT_STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
];

export default function AgreementHub() {
  const { partners, settings, updateAgreementStatus, addInteraction } = useStore();
  const activePartners = useMemo(() => partners.filter(p => !p.archived && !p.notCompatible), [partners]);

  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [copied, setCopied] = useState(false);
  const agreementRef = useRef(null);

  // Form fields
  const [partnerCompanyNumber, setPartnerCompanyNumber] = useState('');
  const [partnerRegisteredAddress, setPartnerRegisteredAddress] = useState('');
  const [setupFee, setSetupFee] = useState('5,000');
  const [monthlyFee, setMonthlyFee] = useState('1,000');
  const [perPatientFee, setPerPatientFee] = useState('10');
  const [revenueShare, setRevenueShare] = useState('15');
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const partner = useMemo(() => partners.find(p => p.id === selectedPartnerId), [partners, selectedPartnerId]);

  const thName = settings?.companyName || "Ted's Health Ltd";
  const thCompanyNumber = settings?.companyNumber || '[COMPANY NUMBER]';
  const thAddress = settings?.registeredAddress || '[REGISTERED ADDRESS]';
  const thEmail = settings?.contactEmail || 'partnerships@tedshealth.com';

  const partnerName = partner?.name || '[PARTNER NAME]';
  const operatingMode = partner?.operatingMode === 'PLATFORM' ? 'Platform Only' : partner?.operatingMode === 'CHECK' ? 'Compatibility Check' : 'Full Service';
  const edActive = partner?.edStatus ?? false;
  const trtActive = partner?.trtStatus ?? false;
  const pathways = [edActive && 'Erectile Dysfunction (ED)', trtActive && 'Testosterone Replacement Therapy (TRT)'].filter(Boolean);
  const pathwayText = pathways.length > 0 ? pathways.join(' and ') : 'TRT and/or ED (to be confirmed)';

  function handleStatusChange(newStatus) {
    if (!partner) return;
    const prevStatus = partner.agreementStatus;
    updateAgreementStatus(partner.id, newStatus);
    if (newStatus === 'sent' && prevStatus !== 'sent') {
      addInteraction(partner.id, {
        id: `int-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Email Sent',
        subject: 'Partnership Agreement Sent',
        outcome: 'Agreement document sent to partner for review',
        nextAction: 'Follow up on agreement review',
        nextActionDue: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
    }
  }

  function handleDownloadPDF() {
    window.print();
  }

  function handleCopyText() {
    if (!agreementRef.current) return;
    const text = agreementRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt; }
          #root > *:not(.agreement-print-area) { display: none !important; }
          .agreement-print-area { display: block !important; }
          .no-print { display: none !important; }
          .agreement-document { border: none !important; background: white !important; padding: 0 !important; color: black !important; }
          .agreement-document h1, .agreement-document h2, .agreement-document h3 { color: black !important; }
          .agreement-document p, .agreement-document li, .agreement-document td, .agreement-document th { color: #222 !important; }
          .agreement-document table { border-color: #999 !important; }
          .agreement-document th { background: #f0f0f0 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A6B3C]/30 flex items-center justify-center">
            <FileText size={20} className="text-[#2ECC71]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F0F7F2]">Partnership Agreement Hub</h1>
            <p className="text-sm text-[#7DB892]">Generate, review, and track partnership agreements</p>
          </div>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          {/* Partner selector */}
          <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4">
            <label className="block text-sm font-medium text-[#7DB892] mb-2">Select Partner</label>
            <div className="relative">
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
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

          {/* Auto-populated summary */}
          {partner && (
            <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[#F0F7F2] flex items-center gap-2">
                <Building2 size={14} className="text-[#7DB892]" />
                Partner Details (Auto)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-[#7DB892]">Name:</span> <span className="text-[#F0F7F2]">{partner.name}</span></div>
                <div><span className="text-[#7DB892]">Mode:</span> <span className="text-[#F0F7F2]">{operatingMode}</span></div>
                <div className="col-span-2"><span className="text-[#7DB892]">Pathways:</span> <span className="text-[#F0F7F2]">{pathwayText}</span></div>
              </div>
            </div>
          )}

          {/* Manual fields */}
          <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#F0F7F2]">Agreement Details</h3>
            <Field label="Partner Company Number" value={partnerCompanyNumber} onChange={setPartnerCompanyNumber} placeholder="e.g. 12345678" />
            <Field label="Partner Registered Address" value={partnerRegisteredAddress} onChange={setPartnerRegisteredAddress} placeholder="Full registered address" textarea />
            <Field label="Setup Fee (\u00a3)" value={setupFee} onChange={setSetupFee} placeholder="5,000" />
            <Field label="Monthly Platform Fee (\u00a3)" value={monthlyFee} onChange={setMonthlyFee} placeholder="1,000" />
            <Field label="Per-Patient Fee (\u00a3/mo)" value={perPatientFee} onChange={setPerPatientFee} placeholder="10" />
            <Field label="Revenue Share (%)" value={revenueShare} onChange={setRevenueShare} placeholder="15" />
            <div>
              <label className="block text-xs text-[#7DB892] mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2]"
              />
            </div>
          </div>

          {/* Agreement status */}
          {partner && (
            <div className="rounded-lg border border-[#1A3D26] bg-[#0F2318] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#F0F7F2]">Agreement Status</h3>
              <div className="flex flex-wrap gap-2">
                {AGREEMENT_STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${partner.agreementStatus === opt.value
                      ? 'bg-[#2ECC71] text-[#0A1A12]'
                      : 'bg-[#0A1A12] text-[#7DB892] border border-[#1A3D26] hover:border-[#2ECC71]'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {partner.agreementStatus === 'sent' && (
                <p className="text-xs text-[#2ECC71] flex items-center gap-1">
                  <Check size={12} /> Interaction logged automatically
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A6B3C] hover:bg-[#2ECC71]/80 text-white text-sm font-medium transition-colors"
            >
              <Download size={14} />
              Download as PDF
            </button>
            <button
              onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A3D26] hover:bg-[#1A6B3C] text-[#F0F7F2] text-sm font-medium transition-colors"
            >
              {copied ? <Check size={14} className="text-[#2ECC71]" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Full Text'}
            </button>
          </div>
        </div>

        {/* Agreement document */}
        <div className="lg:col-span-2">
          <AgreementDocument
            ref={agreementRef}
            thName={thName}
            thCompanyNumber={thCompanyNumber}
            thAddress={thAddress}
            thEmail={thEmail}
            partnerName={partnerName}
            partnerCompanyNumber={partnerCompanyNumber || '[COMPANY NUMBER]'}
            partnerAddress={partnerRegisteredAddress || '[REGISTERED ADDRESS]'}
            operatingMode={operatingMode}
            pathwayText={pathwayText}
            setupFee={setupFee || '[AMOUNT]'}
            monthlyFee={monthlyFee || '[AMOUNT]'}
            perPatientFee={perPatientFee || '[AMOUNT]'}
            revenueShare={revenueShare || '[PERCENTAGE]'}
            effectiveDate={effectiveDate ? format(new Date(effectiveDate), 'd MMMM yyyy') : '[DATE]'}
          />
        </div>
      </div>

      {/* Print-only full width agreement */}
      <div className="agreement-print-area hidden">
        <AgreementDocument
          ref={null}
          thName={thName}
          thCompanyNumber={thCompanyNumber}
          thAddress={thAddress}
          thEmail={thEmail}
          partnerName={partnerName}
          partnerCompanyNumber={partnerCompanyNumber || '[COMPANY NUMBER]'}
          partnerAddress={partnerRegisteredAddress || '[REGISTERED ADDRESS]'}
          operatingMode={operatingMode}
          pathwayText={pathwayText}
          setupFee={setupFee || '[AMOUNT]'}
          monthlyFee={monthlyFee || '[AMOUNT]'}
          perPatientFee={perPatientFee || '[AMOUNT]'}
          revenueShare={revenueShare || '[PERCENTAGE]'}
          effectiveDate={effectiveDate ? format(new Date(effectiveDate), 'd MMMM yyyy') : '[DATE]'}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div>
      <label className="block text-xs text-[#7DB892] mb-1">{label}</label>
      <Tag
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={textarea ? 2 : undefined}
        className="w-full bg-[#0A1A12] border border-[#1A3D26] rounded-md px-3 py-2 text-sm text-[#F0F7F2] placeholder:text-[#4a7a5a] resize-none"
      />
    </div>
  );
}

const AgreementDocument = forwardRef(function AgreementDocument({
  thName, thCompanyNumber, thAddress, thEmail,
  partnerName, partnerCompanyNumber, partnerAddress,
  operatingMode, pathwayText,
  setupFee, monthlyFee, perPatientFee, revenueShare, effectiveDate
}, ref) {
  return (
    <div ref={ref} className="agreement-document rounded-lg border border-[#1A3D26] bg-[#0F2318] p-8 text-[#F0F7F2] text-sm leading-relaxed space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">

      {/* Title page */}
      <div className="text-center space-y-4 pb-6 border-b border-[#1A3D26]">
        <h1 className="text-2xl font-bold text-[#F0F7F2]">WHITE-LABEL PARTNERSHIP AGREEMENT</h1>
        <div className="text-[#7DB892] text-sm space-y-1">
          <p>between</p>
          <p className="text-[#F0F7F2] font-semibold text-base">{thName}</p>
          <p>(Company No. {thCompanyNumber})</p>
          <p>and</p>
          <p className="text-[#F0F7F2] font-semibold text-base">{partnerName}</p>
          <p>(Company No. {partnerCompanyNumber})</p>
        </div>
        <p className="text-[#7DB892]">Effective Date: <span className="text-[#F0F7F2] font-medium">{effectiveDate}</span></p>
        <p className="text-xs text-[#4a7a5a]">CONFIDENTIAL</p>
      </div>

      {/* Parties */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">PARTIES</h2>
        <p>
          <strong>(1) {thName}</strong>, a company registered in England and Wales under company number {thCompanyNumber},
          whose registered office is at {thAddress} (hereinafter referred to as <strong>"Ted's Health"</strong> or <strong>"the Provider"</strong>).
        </p>
        <p>
          <strong>(2) {partnerName}</strong>, a company registered in England and Wales under company number {partnerCompanyNumber},
          whose registered office is at {partnerAddress} (hereinafter referred to as <strong>"the Partner"</strong>).
        </p>
      </div>

      {/* Recitals */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">RECITALS</h2>
        <p>(A) Ted's Health has developed a proprietary digital health platform enabling the delivery of Testosterone Replacement Therapy (TRT) and Erectile Dysfunction (ED) clinical services on a white-label basis.</p>
        <p>(B) The Partner wishes to offer {pathwayText} services to its customers under its own brand using Ted's Health's platform and, where applicable, clinical infrastructure.</p>
        <p>(C) The parties wish to enter into this Agreement to set out the terms upon which Ted's Health will provide the Platform and Services to the Partner under the <strong>{operatingMode}</strong> operating model.</p>
      </div>

      {/* Clause 1 — Definitions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">1. DEFINITIONS AND INTERPRETATION</h2>
        <p>1.1 In this Agreement, unless the context otherwise requires, the following terms shall have the meanings set out below:</p>
        <div className="pl-6 space-y-2 text-sm">
          <p><strong>"Agreement"</strong> means this White-Label Partnership Agreement including all Schedules attached hereto.</p>
          <p><strong>"Applicable Law"</strong> means all laws, statutes, regulations, and codes of practice applicable to the provision of the Services, including but not limited to the Health and Social Care Act 2008, the Human Medicines Regulations 2012, the Data Protection Act 2018, and UK GDPR.</p>
          <p><strong>"Branding Materials"</strong> means the Partner's logos, trade marks, colour schemes, domain names, and other brand assets provided to Ted's Health for the purposes of white-labelling the Platform.</p>
          <p><strong>"Clinical Governance Framework"</strong> means the framework for clinical oversight, adverse event reporting, and quality assurance as set out in Schedule 2.</p>
          <p><strong>"Commencement Date"</strong> means {effectiveDate} or such other date as the parties agree in writing.</p>
          <p><strong>"Confidential Information"</strong> means all information of a confidential nature disclosed by one party to the other, whether in writing, orally, or by any other means, including but not limited to business plans, financial data, patient data, technical specifications, and trade secrets.</p>
          <p><strong>"Data Processing Agreement"</strong> means the agreement governing the processing of personal data as set out in Schedule 3.</p>
          <p><strong>"Fees"</strong> means the fees payable by the Partner to Ted's Health as set out in Schedule 1.</p>
          <p><strong>"Initial Term"</strong> means the period of 12 months from the Commencement Date.</p>
          <p><strong>"Intellectual Property Rights"</strong> means all patents, trade marks, service marks, registered designs, copyrights, database rights, know-how, trade secrets, and all other intellectual property rights of any nature.</p>
          <p><strong>"Operating Model"</strong> means the {operatingMode} model as described in clause 3.</p>
          <p><strong>"Patient"</strong> means any individual who accesses clinical services through the Partner's branded instance of the Platform.</p>
          <p><strong>"Patient Data"</strong> means all personal data and special category data (as defined by UK GDPR) relating to Patients processed in connection with this Agreement.</p>
          <p><strong>"Platform"</strong> means Ted's Health's proprietary digital health technology platform, including the patient-facing application, clinician interface, partner portal, and all associated systems.</p>
          <p><strong>"Services"</strong> means the white-label platform services and, where applicable, clinical services to be provided by Ted's Health to the Partner pursuant to this Agreement.</p>
        </div>
        <p>1.2 In this Agreement, unless the context otherwise requires: (a) references to clauses and Schedules are to clauses of, and Schedules to, this Agreement; (b) headings are for convenience only and shall not affect interpretation; (c) words in the singular include the plural and vice versa; (d) a reference to a statute or statutory provision includes any subordinate legislation made under it and any modification or re-enactment of it.</p>
      </div>

      {/* Clause 2 — Appointment and Scope */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">2. APPOINTMENT AND SCOPE</h2>
        <p>2.1 Ted's Health hereby agrees to provide the Platform and Services to the Partner on a non-exclusive, white-label basis for the delivery of {pathwayText} services in the United Kingdom.</p>
        <p>2.2 The Partner is appointed on a non-exclusive basis. Ted's Health reserves the right to enter into similar arrangements with other partners, including those operating in the same market segment as the Partner.</p>
        <p>2.3 The Services shall be provided under the <strong>{operatingMode}</strong> operating model as further described in clause 3.</p>
        <p>2.4 The Partner shall not represent itself as an agent, employee, or representative of Ted's Health. The relationship between the parties is that of independent contractors.</p>
        <p>2.5 The Partner acknowledges that all clinical services delivered through the Platform are provided under the clinical governance framework of Ted's Health (in the case of the Full Service model) or the Partner's own CQC registration (in the case of the Platform Only model).</p>
      </div>

      {/* Clause 3 — Operating Model */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">3. OPERATING MODEL</h2>
        <p>3.1 This Agreement is entered into under the <strong>{operatingMode}</strong> operating model.</p>

        <p className="font-semibold text-[#F0F7F2] mt-4">Full Service Model</p>
        <p>3.2 Where the Operating Model is Full Service, Ted's Health shall provide:</p>
        <div className="pl-6 space-y-1">
          <p>(a) access to the Platform fully branded with the Partner's Branding Materials;</p>
          <p>(b) GMC-registered prescribing clinicians for all consultations;</p>
          <p>(c) CQC-registered clinical service delivery;</p>
          <p>(d) pharmacy dispensing and fulfilment via SignatureRx;</p>
          <p>(e) laboratory blood testing via Inuvi;</p>
          <p>(f) nursing services via Heim where clinically indicated;</p>
          <p>(g) patient identity verification via Onfido;</p>
          <p>(h) video consultation capability via Zoom SDK;</p>
          <p>(i) ongoing patient management, monitoring, and clinical follow-up; and</p>
          <p>(j) adverse event reporting and clinical audit.</p>
        </div>

        <p className="font-semibold text-[#F0F7F2] mt-4">Platform Only Model</p>
        <p>3.3 Where the Operating Model is Platform Only, Ted's Health shall provide:</p>
        <div className="pl-6 space-y-1">
          <p>(a) access to the Platform fully branded with the Partner's Branding Materials;</p>
          <p>(b) pharmacy integration with SignatureRx;</p>
          <p>(c) laboratory integration with Inuvi;</p>
          <p>(d) patient identity verification via Onfido;</p>
          <p>(e) video consultation capability via Zoom SDK;</p>
          <p>(f) the patient management system and clinician interface; and</p>
          <p>(g) the partner portal and revenue dashboard.</p>
        </div>

        <p>3.4 Under the Platform Only model, the Partner shall be responsible for:</p>
        <div className="pl-6 space-y-1">
          <p>(a) employing or contracting GMC-registered doctors with appropriate training in men's health;</p>
          <p>(b) maintaining its own CQC registration for the provision of clinical services;</p>
          <p>(c) all clinical governance, including adverse event reporting under its own registration;</p>
          <p>(d) ensuring all clinicians comply with the clinical protocols provided by Ted's Health; and</p>
          <p>(e) providing evidence of professional indemnity insurance for all clinicians.</p>
        </div>
      </div>

      {/* Clause 4 — Partner Obligations */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">4. PARTNER OBLIGATIONS</h2>
        <p>4.1 The Partner shall:</p>
        <div className="pl-6 space-y-1">
          <p>(a) provide all Branding Materials to Ted's Health within 14 days of the Commencement Date in the formats reasonably specified by Ted's Health;</p>
          <p>(b) ensure that all marketing and promotional materials relating to the Services comply with Applicable Law, including ASA and MHRA advertising guidelines;</p>
          <p>(c) not make any claims about the clinical efficacy of treatments that are not supported by the clinical protocols;</p>
          <p>(d) direct all patient clinical queries to the appropriate clinical team (Ted's Health team under Full Service, Partner's own team under Platform Only);</p>
          <p>(e) maintain adequate insurance cover, including public liability insurance of not less than \u00a32,000,000 per claim;</p>
          <p>(f) comply with all Applicable Law in the performance of its obligations under this Agreement;</p>
          <p>(g) not attempt to reverse-engineer, decompile, or otherwise access the source code of the Platform;</p>
          <p>(h) notify Ted's Health immediately of any complaint, adverse event, or regulatory enquiry relating to the Services; and</p>
          <p>(i) co-operate with Ted's Health in any regulatory inspection, audit, or investigation.</p>
        </div>
        <p>4.2 The Partner acknowledges that failure to comply with any obligation under this clause 4 constitutes a material breach of this Agreement.</p>
      </div>

      {/* Clause 5 — Fees and Payment */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">5. FEES AND PAYMENT</h2>
        <p>5.1 The Partner shall pay the Fees as set out in Schedule 1 to this Agreement.</p>
        <p>5.2 The Setup Fee of <strong>\u00a3{setupFee}</strong> is payable within 14 days of execution of this Agreement and is non-refundable.</p>
        <p>5.3 The Monthly Platform Fee of <strong>\u00a3{monthlyFee}</strong> per calendar month is payable in advance on the first business day of each month.</p>
        <p>5.4 The Per-Patient Fee of <strong>\u00a3{perPatientFee}</strong> per active patient per month shall be invoiced monthly in arrears based on the number of patients who accessed any clinical service during the relevant month.</p>
        <p>5.5 The Revenue Share of <strong>{revenueShare}%</strong> of net consultation and treatment revenue shall be calculated and invoiced monthly in arrears.</p>
        <p>5.6 All Fees are exclusive of VAT, which shall be payable in addition at the prevailing rate.</p>
        <p>5.7 Ted's Health shall issue invoices within 5 business days of the end of each calendar month. Payment is due within 30 days of the date of invoice.</p>
        <p>5.8 If any invoice remains unpaid for more than 14 days after its due date, Ted's Health may:</p>
        <div className="pl-6 space-y-1">
          <p>(a) charge interest on the overdue amount at 4% per annum above the Bank of England base rate;</p>
          <p>(b) suspend access to the Platform until all outstanding amounts are paid; and</p>
          <p>(c) recover all reasonable costs of collection, including legal fees.</p>
        </div>
        <p>5.9 Ted's Health may increase the Fees at the start of each Renewal Term by providing not less than 60 days' written notice. Any increase shall not exceed the greater of (a) 5% or (b) the percentage increase in the Consumer Prices Index over the preceding 12 months.</p>
      </div>

      {/* Clause 6 — Intellectual Property */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">6. INTELLECTUAL PROPERTY</h2>
        <p>6.1 All Intellectual Property Rights in the Platform, including but not limited to the software, algorithms, clinical protocols, user interface designs, and documentation, are and shall remain the exclusive property of Ted's Health.</p>
        <p>6.2 Ted's Health grants the Partner a non-exclusive, non-transferable, revocable licence to use the Platform solely for the purpose of delivering white-label clinical services to Patients during the term of this Agreement.</p>
        <p>6.3 The Partner grants Ted's Health a non-exclusive, royalty-free licence to use the Partner's Branding Materials solely for the purpose of white-labelling the Platform during the term of this Agreement.</p>
        <p>6.4 Neither party shall acquire any rights in the other party's Intellectual Property Rights except as expressly granted under this Agreement.</p>
        <p>6.5 The Partner shall not: (a) sub-license any rights granted under this Agreement; (b) use Ted's Health's name, trade marks, or branding in any manner except as expressly authorised; or (c) register or attempt to register any trade mark or domain name that is confusingly similar to any of Ted's Health's marks.</p>
        <p>6.6 Ted's Health may use anonymised and aggregated data derived from the operation of the Platform for the purposes of improving its services, conducting research, and benchmarking, provided that no Patient or Partner can be identified from such data.</p>
      </div>

      {/* Clause 7 — Data Protection */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">7. DATA PROTECTION AND PATIENT CONFIDENTIALITY</h2>
        <p>7.1 Each party shall comply with all Applicable Law relating to data protection, including the Data Protection Act 2018 and UK GDPR.</p>
        <p>7.2 For the purposes of UK GDPR:</p>
        <div className="pl-6 space-y-1">
          <p>(a) Under the Full Service model, Ted's Health is the data controller for Patient Data and the Partner is a data processor;</p>
          <p>(b) Under the Platform Only model, the Partner is the data controller for Patient Data and Ted's Health is a data processor.</p>
        </div>
        <p>7.3 The parties shall enter into the Data Processing Agreement set out in Schedule 3 which sets out the detailed obligations of each party in relation to the processing of Patient Data.</p>
        <p>7.4 Both parties shall implement appropriate technical and organisational measures to ensure the security of Patient Data, including:</p>
        <div className="pl-6 space-y-1">
          <p>(a) encryption of Patient Data in transit and at rest;</p>
          <p>(b) access controls limiting data access to authorised personnel;</p>
          <p>(c) regular security testing and vulnerability assessment;</p>
          <p>(d) staff training on data protection and information security; and</p>
          <p>(e) incident response procedures for data breaches.</p>
        </div>
        <p>7.5 In the event of a personal data breach, the party that becomes aware of the breach shall notify the other party without undue delay and in any event within 24 hours of becoming aware of the breach.</p>
        <p>7.6 Patient Data shall not be transferred outside the United Kingdom without the prior written consent of the data controller and appropriate safeguards being in place.</p>
      </div>

      {/* Clause 8 — Liability and Indemnity */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">8. LIABILITY AND INDEMNITY</h2>
        <p>8.1 Nothing in this Agreement shall exclude or limit either party's liability for: (a) death or personal injury caused by its negligence; (b) fraud or fraudulent misrepresentation; or (c) any other liability which cannot be excluded or limited by law.</p>
        <p>8.2 Subject to clause 8.1:</p>
        <div className="pl-6 space-y-1">
          <p>(a) Ted's Health's total aggregate liability under or in connection with this Agreement shall not exceed the total Fees paid by the Partner in the 12-month period immediately preceding the event giving rise to the claim;</p>
          <p>(b) neither party shall be liable for any indirect, consequential, special, or punitive damages, including loss of profit, loss of revenue, loss of data, or loss of business opportunity; and</p>
          <p>(c) Ted's Health shall not be liable for any clinical outcome, adverse event, or patient harm arising from the Partner's failure to comply with the clinical protocols or its obligations under this Agreement.</p>
        </div>
        <p>8.3 The Partner shall indemnify and hold harmless Ted's Health against all claims, losses, damages, costs, and expenses (including reasonable legal fees) arising from:</p>
        <div className="pl-6 space-y-1">
          <p>(a) any breach by the Partner of this Agreement;</p>
          <p>(b) any negligent or wrongful act or omission of the Partner, its employees, or agents;</p>
          <p>(c) any claim by a third party relating to the Partner's marketing or promotion of the Services; and</p>
          <p>(d) under the Platform Only model, any clinical act or omission of the Partner's clinicians.</p>
        </div>
        <p>8.4 Ted's Health shall maintain professional indemnity insurance of not less than \u00a35,000,000 per claim and shall provide evidence of such insurance to the Partner upon reasonable request.</p>
      </div>

      {/* Clause 9 — Term and Termination */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">9. TERM AND TERMINATION</h2>
        <p>9.1 This Agreement shall commence on the Commencement Date and shall continue for the Initial Term of 12 months.</p>
        <p>9.2 At the end of the Initial Term, this Agreement shall automatically renew for successive periods of 12 months (each a <strong>"Renewal Term"</strong>) unless either party gives the other not less than 90 days' written notice of its intention not to renew prior to the end of the then-current term.</p>
        <p>9.3 Either party may terminate this Agreement immediately by giving written notice to the other if:</p>
        <div className="pl-6 space-y-1">
          <p>(a) the other party commits a material breach of this Agreement which is not capable of remedy;</p>
          <p>(b) the other party commits a material breach of this Agreement which is capable of remedy and fails to remedy such breach within 30 days of receiving written notice specifying the breach and requiring it to be remedied;</p>
          <p>(c) the other party enters into administration, liquidation, or any arrangement with its creditors, or has a receiver or administrative receiver appointed over all or any part of its assets;</p>
          <p>(d) the other party ceases or threatens to cease to carry on business; or</p>
          <p>(e) there is a change of control of the other party and the first party reasonably determines that such change is likely to adversely affect the performance of this Agreement.</p>
        </div>
        <p>9.4 Ted's Health may terminate this Agreement immediately by giving written notice if:</p>
        <div className="pl-6 space-y-1">
          <p>(a) the Partner's conduct creates a risk to patient safety;</p>
          <p>(b) the Partner loses any regulatory registration required for the performance of its obligations under this Agreement; or</p>
          <p>(c) the Partner is subject to regulatory enforcement action that Ted's Health reasonably considers may adversely affect its reputation or the operation of the Platform.</p>
        </div>
        <p>9.5 Upon termination of this Agreement for any reason:</p>
        <div className="pl-6 space-y-1">
          <p>(a) the Partner's access to the Platform shall be revoked;</p>
          <p>(b) Ted's Health shall provide the Partner with a copy of all Patient Data in a commonly used electronic format within 30 days of termination;</p>
          <p>(c) Ted's Health shall delete all Partner Branding Materials from the Platform within 14 days of termination;</p>
          <p>(d) all outstanding Fees shall become immediately due and payable;</p>
          <p>(e) the parties shall co-operate to ensure the safe and orderly transition of any ongoing patient care; and</p>
          <p>(f) clauses 1, 6, 7, 8, 10, and this clause 9.5 shall survive termination.</p>
        </div>
        <p>9.6 Ted's Health shall use reasonable endeavours to provide continuity of care for existing Patients for a period of not less than 90 days following termination to allow for safe clinical handover.</p>
      </div>

      {/* Clause 10 — General */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#2ECC71]">10. GENERAL PROVISIONS</h2>
        <p><strong>10.1 Confidentiality.</strong> Each party shall keep confidential all Confidential Information of the other party and shall not disclose such information to any third party without the prior written consent of the disclosing party, except: (a) to its employees, officers, advisers, or sub-contractors who need to know such information for the purposes of this Agreement, provided they are bound by equivalent obligations of confidentiality; (b) as required by law, regulation, or court order; or (c) to the extent the information is already in the public domain through no fault of the receiving party.</p>
        <p><strong>10.2 Force Majeure.</strong> Neither party shall be liable for any delay or failure to perform its obligations under this Agreement if such delay or failure results from events beyond its reasonable control, including natural disasters, pandemic, war, government action, or failure of third-party telecommunications networks, provided that the affected party notifies the other party promptly and uses reasonable endeavours to mitigate the effects.</p>
        <p><strong>10.3 Entire Agreement.</strong> This Agreement, together with the Schedules, constitutes the entire agreement between the parties in relation to its subject matter and supersedes all prior negotiations, representations, and agreements between the parties, whether written or oral.</p>
        <p><strong>10.4 Variation.</strong> No variation of this Agreement shall be effective unless it is in writing and signed by or on behalf of both parties.</p>
        <p><strong>10.5 Waiver.</strong> A failure or delay by a party to exercise any right or remedy under this Agreement shall not constitute a waiver of that right or remedy. A waiver of any breach shall not constitute a waiver of any subsequent breach.</p>
        <p><strong>10.6 Severability.</strong> If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>
        <p><strong>10.7 Assignment.</strong> Neither party may assign, transfer, or sub-contract any of its rights or obligations under this Agreement without the prior written consent of the other party, except that Ted's Health may assign this Agreement to any affiliate or in connection with a merger, acquisition, or sale of substantially all of its assets.</p>
        <p><strong>10.8 Notices.</strong> All notices under this Agreement shall be in writing and sent to the registered address of the relevant party or such other address as notified in writing. Notices may be sent by email to the authorised contact persons, provided that notice of termination must be sent by recorded delivery.</p>
        <p><strong>10.9 Third Party Rights.</strong> This Agreement does not confer any rights on any person or party other than the parties to this Agreement and their permitted successors and assigns pursuant to the Contracts (Rights of Third Parties) Act 1999.</p>
        <p><strong>10.10 Governing Law and Jurisdiction.</strong> This Agreement shall be governed by and construed in accordance with the laws of England and Wales. The parties irrevocably submit to the exclusive jurisdiction of the courts of England and Wales for the resolution of any dispute arising out of or in connection with this Agreement.</p>
      </div>

      {/* Execution block */}
      <div className="space-y-6 pt-6 border-t border-[#1A3D26]">
        <h2 className="text-lg font-bold text-[#2ECC71]">EXECUTION</h2>
        <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="font-semibold">Signed for and on behalf of {thName}:</p>
            <div className="border-b border-[#1A3D26] pb-1 mt-8"><span className="text-[#7DB892] text-xs">Signature</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Name</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Position</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Date</span></div>
          </div>
          <div className="space-y-4">
            <p className="font-semibold">Signed for and on behalf of {partnerName}:</p>
            <div className="border-b border-[#1A3D26] pb-1 mt-8"><span className="text-[#7DB892] text-xs">Signature</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Name</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Position</span></div>
            <div className="border-b border-[#1A3D26] pb-1"><span className="text-[#7DB892] text-xs">Date</span></div>
          </div>
        </div>
      </div>

      {/* SCHEDULE 1 — Fees */}
      <div className="space-y-3 pt-8 border-t border-[#1A3D26]">
        <h2 className="text-lg font-bold text-[#2ECC71]">SCHEDULE 1 — FEES</h2>
        <p>The following fees shall be payable by the Partner to Ted's Health:</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1A3D26] bg-[#0A1A12]">
                <th className="text-left px-4 py-2 text-[#7DB892] font-semibold">Fee Component</th>
                <th className="text-left px-4 py-2 text-[#7DB892] font-semibold">Amount</th>
                <th className="text-left px-4 py-2 text-[#7DB892] font-semibold">Payment Terms</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1A3D26]">
                <td className="px-4 py-2 text-[#F0F7F2]">Setup Fee</td>
                <td className="px-4 py-2 font-mono text-[#F0F7F2]">\u00a3{setupFee}</td>
                <td className="px-4 py-2 text-[#7DB892]">One-time. Due within 14 days of execution. Non-refundable.</td>
              </tr>
              <tr className="border-b border-[#1A3D26]">
                <td className="px-4 py-2 text-[#F0F7F2]">Monthly Platform Fee</td>
                <td className="px-4 py-2 font-mono text-[#F0F7F2]">\u00a3{monthlyFee}/month</td>
                <td className="px-4 py-2 text-[#7DB892]">Payable in advance on the 1st business day of each calendar month.</td>
              </tr>
              <tr className="border-b border-[#1A3D26]">
                <td className="px-4 py-2 text-[#F0F7F2]">Per-Patient Fee</td>
                <td className="px-4 py-2 font-mono text-[#F0F7F2]">\u00a3{perPatientFee}/patient/month</td>
                <td className="px-4 py-2 text-[#7DB892]">Invoiced monthly in arrears based on active patients.</td>
              </tr>
              <tr className="border-b border-[#1A3D26]">
                <td className="px-4 py-2 text-[#F0F7F2]">Revenue Share</td>
                <td className="px-4 py-2 font-mono text-[#F0F7F2]">{revenueShare}%</td>
                <td className="px-4 py-2 text-[#7DB892]">Of net consultation and treatment revenue. Invoiced monthly in arrears.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-sm">
          <p><strong>1.1 Definitions.</strong> "Active patient" means any Patient who has accessed a consultation, received a prescription, or had a blood test processed during the relevant calendar month.</p>
          <p><strong>1.2 Net Revenue.</strong> Net consultation and treatment revenue means gross revenue from consultations and treatments less: (a) VAT; (b) pharmacy dispensing costs; (c) laboratory testing costs; (d) nursing costs; and (e) any patient refunds or chargebacks.</p>
          <p><strong>1.3 Reporting.</strong> Ted's Health shall provide the Partner with a monthly revenue report within 10 business days of the end of each calendar month, setting out the number of active patients, consultation and treatment revenue, and the calculation of all variable fees.</p>
          <p><strong>1.4 Audit.</strong> Each party shall have the right to audit the other party's records relating to the calculation of Fees, subject to giving not less than 30 days' written notice. Audits shall be conducted at the auditing party's expense unless a discrepancy of more than 5% is found, in which case the cost shall be borne by the audited party.</p>
          <p><strong>1.5 Fee Review.</strong> Fees may be reviewed at the start of each Renewal Term in accordance with clause 5.9 of this Agreement.</p>
        </div>
      </div>

      {/* SCHEDULE 2 — Clinical Governance */}
      <div className="space-y-3 pt-8 border-t border-[#1A3D26]">
        <h2 className="text-lg font-bold text-[#2ECC71]">SCHEDULE 2 — CLINICAL GOVERNANCE FRAMEWORK</h2>

        <p><strong>1. Clinical Leadership</strong></p>
        <div className="pl-6 space-y-1">
          <p>1.1 Ted's Health's Chief Medical Officer (currently Dr Jonathan Andrews) shall have overall responsibility for clinical governance across all white-label partnerships operating under the Full Service model.</p>
          <p>1.2 Under the Platform Only model, the Partner shall appoint a named clinical lead who shall be responsible for clinical governance within the Partner's service.</p>
          <p>1.3 The clinical lead (whether Ted's Health CMO or the Partner's appointee) shall review and approve all clinical protocols before they are deployed on the Platform.</p>
        </div>

        <p className="mt-4"><strong>2. Clinical Protocols</strong></p>
        <div className="pl-6 space-y-1">
          <p>2.1 All clinical pathways on the Platform shall operate in accordance with protocols developed by Ted's Health and approved by the relevant clinical lead.</p>
          <p>2.2 Protocols shall cover: (a) patient eligibility and screening; (b) consultation and assessment; (c) prescribing criteria and contraindications; (d) blood test requirements and monitoring schedules; (e) dose adjustment and titration; (f) adverse event identification and management; and (g) patient follow-up and discharge.</p>
          <p>2.3 Protocols shall be reviewed at least quarterly and updated in line with current clinical evidence and regulatory guidance.</p>
        </div>

        <p className="mt-4"><strong>3. Adverse Event Reporting</strong></p>
        <div className="pl-6 space-y-1">
          <p>3.1 All adverse events shall be reported through the Platform's built-in adverse event reporting system.</p>
          <p>3.2 Serious adverse events shall be escalated to the relevant clinical lead within 4 hours of identification.</p>
          <p>3.3 The clinical lead shall determine whether notification to the MHRA, CQC, or other regulatory body is required and shall submit such notifications within the applicable timeframes.</p>
          <p>3.4 A root cause analysis shall be conducted for all serious adverse events within 72 hours.</p>
        </div>

        <p className="mt-4"><strong>4. Clinical Audit</strong></p>
        <div className="pl-6 space-y-1">
          <p>4.1 Ted's Health shall conduct clinical audits of the Platform and associated services on a quarterly basis.</p>
          <p>4.2 Audits shall review: (a) prescribing patterns and compliance with protocols; (b) patient outcomes and satisfaction; (c) adverse event rates and management; (d) clinician performance; and (e) compliance with regulatory requirements.</p>
          <p>4.3 Audit findings and improvement actions shall be shared with the Partner within 14 days of audit completion.</p>
        </div>

        <p className="mt-4"><strong>5. Regulatory Compliance</strong></p>
        <div className="pl-6 space-y-1">
          <p>5.1 Under the Full Service model, Ted's Health shall maintain CQC registration and comply with all CQC fundamental standards.</p>
          <p>5.2 Under the Platform Only model, the Partner shall maintain its own CQC registration and shall provide evidence of compliance to Ted's Health upon reasonable request.</p>
          <p>5.3 Both parties shall co-operate fully with any CQC inspection or enquiry relating to services delivered through the Platform.</p>
          <p>5.4 Ted's Health shall notify the Partner within 48 hours of any CQC inspection outcome, enforcement action, or change in registration status affecting the services.</p>
        </div>
      </div>

      {/* SCHEDULE 3 — Data Processing Agreement */}
      <div className="space-y-3 pt-8 border-t border-[#1A3D26]">
        <h2 className="text-lg font-bold text-[#2ECC71]">SCHEDULE 3 — DATA PROCESSING AGREEMENT</h2>
        <p>This Data Processing Agreement ("DPA") forms part of the White-Label Partnership Agreement and sets out the terms on which Patient Data shall be processed.</p>

        <p className="mt-4"><strong>1. Scope and Roles</strong></p>
        <div className="pl-6 space-y-1">
          <p>1.1 This DPA applies to all processing of Patient Data in connection with the Agreement.</p>
          <p>1.2 The controller-processor relationship is determined by the Operating Model as set out in clause 7.2 of the Agreement.</p>
          <p>1.3 The data processor shall process Patient Data only on documented instructions from the data controller, unless required to do so by Applicable Law.</p>
        </div>

        <p className="mt-4"><strong>2. Categories of Data</strong></p>
        <div className="pl-6 space-y-1">
          <p>2.1 The following categories of personal data may be processed: (a) patient identity data (name, date of birth, address, contact details); (b) health data (medical history, consultation notes, prescriptions, test results); (c) identity verification data (ID document images, biometric data); and (d) payment data (billing address, payment references).</p>
          <p>2.2 The following categories of data subjects may be affected: patients, clinicians, and partner staff.</p>
        </div>

        <p className="mt-4"><strong>3. Processing Purposes</strong></p>
        <div className="pl-6 space-y-1">
          <p>3.1 Patient Data shall be processed solely for: (a) the provision of clinical services through the Platform; (b) patient communication and appointment management; (c) billing and revenue calculation; (d) clinical audit and quality assurance; (e) regulatory reporting; and (f) as otherwise required by Applicable Law.</p>
        </div>

        <p className="mt-4"><strong>4. Security Measures</strong></p>
        <div className="pl-6 space-y-1">
          <p>4.1 The data processor shall implement the following technical and organisational measures:</p>
          <p>(a) AES-256 encryption for data at rest and TLS 1.3 for data in transit;</p>
          <p>(b) role-based access control with principle of least privilege;</p>
          <p>(c) multi-factor authentication for all system access;</p>
          <p>(d) automated backup with 24-hour recovery point objective;</p>
          <p>(e) penetration testing at least annually by a CREST-accredited provider;</p>
          <p>(f) security event monitoring and alerting;</p>
          <p>(g) staff security awareness training at least annually; and</p>
          <p>(h) documented incident response procedures.</p>
        </div>

        <p className="mt-4"><strong>5. Sub-processors</strong></p>
        <div className="pl-6 space-y-1">
          <p>5.1 The data processor shall not engage any sub-processor without the prior written consent of the data controller.</p>
          <p>5.2 The following sub-processors are pre-approved: SignatureRx (pharmacy dispensing), Inuvi (laboratory testing), Heim (nursing services), Onfido (identity verification), Zoom (video consultations).</p>
          <p>5.3 The data processor shall ensure that each sub-processor is bound by data protection obligations no less onerous than those set out in this DPA.</p>
          <p>5.4 The data processor shall notify the data controller of any intended changes to sub-processors, giving the data controller 30 days to object.</p>
        </div>

        <p className="mt-4"><strong>6. Data Subject Rights</strong></p>
        <div className="pl-6 space-y-1">
          <p>6.1 The data processor shall assist the data controller in responding to data subject access requests and other rights requests under UK GDPR.</p>
          <p>6.2 The data processor shall notify the data controller within 48 hours of receiving any request from a data subject directly.</p>
          <p>6.3 The data processor shall not respond to data subject requests directly unless authorised by the data controller.</p>
        </div>

        <p className="mt-4"><strong>7. Data Breach Notification</strong></p>
        <div className="pl-6 space-y-1">
          <p>7.1 The data processor shall notify the data controller of any personal data breach without undue delay and in any event within 24 hours.</p>
          <p>7.2 The notification shall include: (a) the nature of the breach; (b) categories and approximate number of data subjects affected; (c) likely consequences; and (d) measures taken or proposed to mitigate the breach.</p>
          <p>7.3 The data processor shall cooperate with the data controller in notifying the ICO and affected data subjects where required.</p>
        </div>

        <p className="mt-4"><strong>8. Data Retention and Deletion</strong></p>
        <div className="pl-6 space-y-1">
          <p>8.1 Patient Data shall be retained for the period required by Applicable Law and professional guidance, which for medical records is a minimum of 8 years from the last consultation.</p>
          <p>8.2 Upon termination of the Agreement, the data processor shall, at the choice of the data controller: (a) return all Patient Data in a commonly used electronic format; or (b) securely delete all Patient Data, and provide written certification of deletion.</p>
          <p>8.3 The obligation in 8.2 is subject to any legal requirement to retain Patient Data, in which case the data processor shall isolate and protect such data and limit processing to that required by law.</p>
        </div>

        <p className="mt-4"><strong>9. International Transfers</strong></p>
        <div className="pl-6 space-y-1">
          <p>9.1 Patient Data shall not be transferred outside the United Kingdom without the prior written consent of the data controller.</p>
          <p>9.2 Where international transfers are approved, the data processor shall ensure that appropriate safeguards are in place, including Standard Contractual Clauses or reliance on an adequacy decision.</p>
        </div>

        <p className="mt-4"><strong>10. Audit and Inspection</strong></p>
        <div className="pl-6 space-y-1">
          <p>10.1 The data processor shall make available to the data controller all information necessary to demonstrate compliance with this DPA.</p>
          <p>10.2 The data controller shall have the right to conduct audits, including inspections, of the data processor's premises and systems, subject to 30 days' written notice.</p>
          <p>10.3 The data processor shall cooperate with any audit conducted by the ICO or other supervisory authority.</p>
        </div>
      </div>

      {/* End of document */}
      <div className="text-center pt-8 border-t border-[#1A3D26]">
        <p className="text-xs text-[#4a7a5a]">— END OF AGREEMENT —</p>
        <p className="text-xs text-[#4a7a5a] mt-1">This document is confidential. Do not distribute without written consent from Ted's Health.</p>
      </div>
    </div>
  );
});
