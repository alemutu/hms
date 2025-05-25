import { Department } from './departments';

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'receptionist'
  | 'nurse'
  | 'doctor'
  | 'lab_technician'
  | 'radiologist'
  | 'pharmacist'
  | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  specialization?: string;
  status: 'active' | 'inactive';
  permissions: string[];
  hospital_id?: string;
  admin_role?: 'super_admin' | 'admin' | 'staff';
}

export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: [
    'admin.access',
    'user.manage.all',
    'hospital.manage',
    'department.manage',
    'settings.manage',
    'reports.view',
    'records.view.all'
  ],
  admin: [
    'admin.access',
    'user.manage',
    'department.manage',
    'settings.manage',
    'reports.view',
    'records.view.all'
  ],
  receptionist: [
    'patient.register',
    'patient.view',
    'appointment.create',
    'appointment.view',
    'records.view'
  ],
  nurse: [
    'patient.view',
    'vitals.create',
    'vitals.update',
    'triage.manage',
    'records.view'
  ],
  doctor: [
    'patient.view',
    'consultation.create',
    'consultation.update',
    'prescription.create',
    'lab.request',
    'records.view',
    'records.update'
  ],
  lab_technician: [
    'patient.view',
    'lab.view',
    'lab.update',
    'lab.complete',
    'records.view.limited'
  ],
  radiologist: [
    'patient.view',
    'radiology.view',
    'radiology.update',
    'radiology.complete',
    'records.view.limited'
  ],
  pharmacist: [
    'patient.view',
    'prescription.view',
    'prescription.dispense',
    'inventory.manage',
    'records.view.limited'
  ],
  cashier: [
    'patient.view',
    'payment.create',
    'payment.process',
    'invoice.generate',
    'records.view.limited'
  ]
};

export const departmentRoles: Record<Department, UserRole[]> = {
  reception: ['receptionist'],
  triage: ['nurse'],
  'general-consultation': ['doctor'],
  pediatrics: ['doctor'],
  gynecology: ['doctor'],
  surgical: ['doctor'],
  orthopedic: ['doctor'],
  dental: ['doctor'],
  'eye-clinic': ['doctor'],
  physiotherapy: ['doctor'],
  laboratory: ['lab_technician'],
  radiology: ['radiologist'],
  pharmacy: ['pharmacist'],
  cashier: ['cashier']
};

// Default users for development
export const defaultUsers: User[] = [
  {
    id: 'super-admin-1',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: 'super_admin',
    status: 'active',
    permissions: rolePermissions.super_admin,
    admin_role: 'super_admin'
  },
  {
    id: 'reception-1',
    name: 'Jane Smith',
    email: 'reception@example.com',
    role: 'receptionist',
    department: 'reception',
    status: 'active',
    permissions: rolePermissions.receptionist
  },
  {
    id: 'doctor-1',
    name: 'Dr. Sarah Chen',
    email: 'doctor@example.com',
    role: 'doctor',
    department: 'general-consultation',
    specialization: 'Internal Medicine',
    status: 'active',
    permissions: rolePermissions.doctor
  }
];