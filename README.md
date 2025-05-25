# Searchable HMS

A comprehensive Hospital Management System built with React, TypeScript, and Supabase.

## Features

- Patient registration and management
- Triage and consultation workflow
- Laboratory and radiology test management
- Pharmacy and medication dispensing
- Billing and invoicing
- Appointment scheduling
- Medical records management
- Multi-tenant architecture for multiple hospitals

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Custom store with React Context
- **UI Components**: Shadcn UI
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/searchable-hms.git
   cd searchable-hms
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Initialize Supabase:
   ```bash
   cd supabase
   ./init.sh
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `users` - System users including staff and administrators
- `hospitals` - Hospital organizations registered in the system
- `patients` - Patient records with demographic and workflow information
- `vital_signs` - Patient vital signs recorded during triage and consultations
- `medical_history` - Patient medical history including conditions and allergies
- `consultations` - Patient consultations with doctors
- `lab_tests` - Laboratory and radiology tests ordered for patients
- `prescriptions` - Medication prescriptions for patients
- `medications` - Medication inventory for pharmacy
- `invoices` - Billing invoices for patients
- `payments` - Payment records for invoices
- `service_charges` - Service charges for various departments
- `notifications` - System notifications for users and departments

For more details, see the [Database Schema Documentation](supabase/migrations/README.md).

## Deployment

The application can be deployed to any hosting service that supports React applications. For the backend, you'll need a Supabase project.

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Apply the migrations to your Supabase project
3. Update the environment variables with your Supabase project details
4. Build and deploy the frontend:
   ```bash
   npm run build
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.