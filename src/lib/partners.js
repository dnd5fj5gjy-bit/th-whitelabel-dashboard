// Pre-loaded 72 partner prospects for Ted's Health White-Label CRM

let idCounter = 1;
const makeId = () => `p-${String(idCounter++).padStart(3, '0')}`;
const now = new Date().toISOString();

function p(name, category, operatingMode, edStatus, trtStatus, score, wave, contactName = '', contactEmail = '', contactJobTitle = '', website = '', notes = '') {
  return {
    id: makeId(),
    name,
    category,
    operatingMode,
    edStatus: edStatus === 'Yes',
    trtStatus: trtStatus === 'Yes',
    score,
    wave: `W${wave}`,
    contactName,
    contactEmail,
    contactJobTitle,
    website,
    notes,
    pipelineStage: 'identified',
    interactions: [],
    agreementStatus: 'not-started',
    archived: false,
    notCompatible: false,
    createdAt: now,
  };
}

const PARTNERS = [
  // TELEHEALTH PLATFORMS
  p('WebMed Pharmacy', 'Telehealth Platform', 'PLATFORM', 'Yes', 'No', 88, 1),
  p('PharmaDoctor', 'Telehealth Platform', 'PLATFORM', 'Yes', 'No', 86, 1),

  // ONLINE PHARMACIES
  p('The Independent Pharmacy', 'Online Pharmacy', 'FULL', 'Yes', 'No', 92, 1),
  p('MedExpress', 'Online Pharmacy', 'FULL', 'Yes', 'No', 92, 1),
  p('Chemist Direct', 'Online Pharmacy', 'FULL', 'Yes', 'No', 90, 1),
  p('SimplyMeds Online', 'Online Pharmacy', 'FULL', 'Yes', 'No', 87, 1),
  p('Assured Pharmacy', 'Online Pharmacy', 'FULL', 'Yes', 'No', 84, 1),
  p('Well Pharmacy', 'Online Pharmacy', 'FULL', 'No', 'No', 84, 2),
  p('Simple Online Pharmacy', 'Online Pharmacy', 'FULL', 'Yes', 'No', 84, 1),
  p('Doctor-4-U', 'Online Pharmacy', 'FULL', 'Yes', 'No', 82, 1),

  // MEN'S HEALTH CLINICS
  p('Oxford Online Pharmacy', "Men's Health Clinic", 'FULL', 'Yes', 'No', 90, 1),
  p('Mojo Men\'s Health', "Men's Health Clinic", 'FULL', 'Yes', 'No', 87, 1),
  p('Mojo', "Men's Health Clinic", 'FULL', 'Yes', 'No', 87, 1),
  p('Mosh', "Men's Health Clinic", 'FULL', 'Yes', 'No', 87, 1),
  p('Men\'s Health Clinic', "Men's Health Clinic", 'CHECK', 'Yes', 'No', 78, 2),
  p('Optiman Clinics', "Men's Health Clinic", 'CHECK', 'Yes', 'No', 76, 2),
  p('Androfill', "Men's Health Clinic", 'CHECK', 'Yes', 'No', 76, 2),
  p('The ED Clinic', "Men's Health Clinic", 'CHECK', 'Yes', 'No', 72, 2),

  // ED TREATMENT PROVIDERS
  p('Treated', 'ED Treatment Provider', 'FULL', 'Yes', 'No', 85, 1),
  p('Dr Fox Pharmacy', 'ED Treatment Provider', 'FULL', 'Yes', 'No', 84, 1),

  // PRIVATE GP SERVICES
  p('Babylon Health', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 93, 2),
  p('Pharmica', 'Private GP Service', 'FULL', 'Yes', 'No', 92, 1),
  p('Doctor Care Anywhere', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 90, 1),
  p('MedicSpot', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 90, 1),
  p('The GP Service', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 90, 1),
  p('Doctor4U', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 88, 1),
  p('London Doctors Clinic', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 78, 2),
  p('Roodlane Medical', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 76, 2),
  p('The Harley Street Clinic', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 76, 2),
  p('Spire Healthcare', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 76, 2),
  p('HCA Healthcare UK', 'Private GP Service', 'PLATFORM', 'Yes', 'No', 70, 3),

  // CORPORATE HEALTH
  p('Zava', 'Corporate Health', 'FULL', 'Yes', 'No', 89, 1),
  p('Push Doctor', 'Corporate Health', 'PLATFORM', 'Yes', 'No', 86, 2),
  p('Echo by LloydsPharmacy', 'Corporate Health', 'FULL', 'No', 'No', 82, 2),
  p('Thriva', 'Corporate Health', 'FULL', 'No', 'No', 78, 2),
  p('Vitality', 'Corporate Health', 'FULL', 'Yes', 'No', 76, 3),
  p('Phlo Digital Pharmacy', 'Corporate Health', 'FULL', 'No', 'No', 76, 2),
  p('Benenden Health', 'Corporate Health', 'FULL', 'Yes', 'No', 74, 3),
  p('Bupa', 'Corporate Health', 'FULL', 'Yes', 'No', 74, 3),
  p('Check4Cancer', 'Corporate Health', 'FULL', 'Yes', 'No', 72, 3),
  p('Simplyhealth', 'Corporate Health', 'FULL', 'Yes', 'No', 72, 3),
  p('Randox Health', 'Corporate Health', 'FULL', 'Yes', 'No', 72, 3),
  p('Bluecrest Wellness', 'Corporate Health', 'FULL', 'Yes', 'No', 72, 3),
  p('Bupa Health Clinics', 'Corporate Health', 'PLATFORM', 'No', 'No', 70, 3),
  p('Preventicum', 'Corporate Health', 'FULL', 'Yes', 'No', 70, 3),

  // SEXUAL HEALTH CLINICS
  p('LloydsPharmacy Online Doctor', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 90, 1),
  p('Medicspot', 'Sexual Health Clinic', 'PLATFORM', 'Yes', 'No', 90, 1),
  p('ZAVA', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 89, 1),
  p('Dr Felix', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 87, 1),
  p('Superdrug Online Doctor', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 87, 1),
  p('Pharmacy2U', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 85, 1),
  p('Online Doctor by Boots', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 84, 1),
  p('HealthExpress', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 84, 1),
  p('Online Clinic', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 84, 1),
  p('Medichecks', 'Sexual Health Clinic', 'FULL', 'No', 'No', 84, 2),
  p('The Online Clinic', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 84, 1),
  p('DrEd Online Doctor', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 82, 1),
  p('DrEd', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 82, 1),
  p('Online Doctor UK', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 82, 1),
  p('The STI Clinic', 'Sexual Health Clinic', 'CHECK', 'Yes', 'No', 80, 2),
  p('Click Pharmacy', 'Sexual Health Clinic', 'FULL', 'Yes', 'No', 80, 2),
];

export default PARTNERS;

export const CATEGORIES = [
  'Telehealth Platform',
  'Online Pharmacy',
  "Men's Health Clinic",
  'ED Treatment Provider',
  'Private GP Service',
  'Corporate Health',
  'Sexual Health Clinic',
];

export const OPERATING_MODES = ['FULL', 'PLATFORM', 'CHECK'];

export const PIPELINE_STAGES = [
  'identified',
  'contacted',
  'replied',
  'call-booked',
  'proposal-sent',
  'negotiating',
  'signed',
  'dead',
];

export const PIPELINE_STAGE_LABELS = {
  'identified': 'Identified',
  'contacted': 'Contacted',
  'replied': 'Replied',
  'call-booked': 'Call Booked',
  'proposal-sent': 'Proposal Sent',
  'negotiating': 'Negotiating',
  'signed': 'Signed',
  'dead': 'Dead',
};

export const WAVES = ['W1', 'W2', 'W3'];

export const INTERACTION_TYPES = [
  'Email Sent',
  'Email Received',
  'Call',
  'Meeting',
  'Note',
  'LinkedIn',
  'Other',
];

export const AGREEMENT_STATUSES = [
  'not-started',
  'draft-sent',
  'under-review',
  'negotiating',
  'signed',
  'declined',
];
