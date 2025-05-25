export const departments = {
  RECEPTION: 'reception',
  TRIAGE: 'triage',
  GENERAL: 'general-consultation',
  CARDIOLOGY: 'cardiology',
  PEDIATRICS: 'pediatrics',
  GYNECOLOGY: 'gynecology',
  SURGICAL: 'surgical',
  ORTHOPEDIC: 'orthopedic',
  DENTAL: 'dental',
  EYE: 'eye-clinic',
  PHYSIOTHERAPY: 'physiotherapy',
  LABORATORY: 'laboratory',
  RADIOLOGY: 'radiology',
  PHARMACY: 'pharmacy'
} as const;

export type Department = typeof departments[keyof typeof departments];

export const departmentNames: Record<Department, string> = {
  [departments.RECEPTION]: 'Reception',
  [departments.TRIAGE]: 'Triage',
  [departments.GENERAL]: 'General Consultation',
  [departments.CARDIOLOGY]: 'Cardiology',
  [departments.PEDIATRICS]: 'Pediatrics',
  [departments.GYNECOLOGY]: 'Gynecology & Obstetrics',
  [departments.SURGICAL]: 'Surgical',
  [departments.ORTHOPEDIC]: 'Orthopedic',
  [departments.DENTAL]: 'Dental',
  [departments.EYE]: 'Eye Clinic',
  [departments.PHYSIOTHERAPY]: 'Physiotherapy',
  [departments.LABORATORY]: 'Laboratory',
  [departments.RADIOLOGY]: 'Radiology',
  [departments.PHARMACY]: 'Pharmacy'
};

export const departmentGroups = {
  CLINICAL: [
    departments.GENERAL,
    departments.CARDIOLOGY,
    departments.PEDIATRICS,
    departments.GYNECOLOGY,
    departments.SURGICAL,
    departments.ORTHOPEDIC,
    departments.DENTAL,
    departments.EYE,
    departments.PHYSIOTHERAPY
  ],
  DIAGNOSTICS: [
    departments.LABORATORY,
    departments.RADIOLOGY
  ],
  SUPPORT: [
    departments.RECEPTION,
    departments.TRIAGE,
    departments.PHARMACY
  ]
} as const;