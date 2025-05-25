export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization?: string;
  schedule: {
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    startTime: string;
    endTime: string;
  };
  availability?: {
    date: string;
    slots: string[];
  }[];
}

export const doctors: Doctor[] = [
  {
    id: 'dr-chen',
    name: 'Dr. Sarah Chen',
    department: 'general-consultation',
    specialization: 'Internal Medicine',
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  },
  {
    id: 'dr-brown',
    name: 'Dr. Michael Brown',
    department: 'pediatrics',
    specialization: 'Pediatrics',
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  },
  {
    id: 'dr-white',
    name: 'Dr. Emily White',
    department: 'dental',
    specialization: 'General Dentistry',
    schedule: {
      days: ['tuesday', 'thursday', 'saturday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  },
  {
    id: 'dr-wilson',
    name: 'Dr. James Wilson',
    department: 'pediatrics',
    specialization: 'Pediatric Surgery',
    schedule: {
      days: ['tuesday', 'thursday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  },
  {
    id: 'dr-anderson',
    name: 'Dr. Lisa Anderson',
    department: 'dental',
    specialization: 'Orthodontics',
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      endTime: '17:00'
    }
  }
];