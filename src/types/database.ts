export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          hospital_id: string | null
          id_number: string | null
          full_name: string
          age: number
          gender: string
          email: string | null
          phone_number: string | null
          place_of_residence: string | null
          registration_date: string | null
          status: string | null
          priority: string | null
          current_department: string | null
          next_destination: string | null
          previous_departments: Json | null
          is_new_patient: boolean | null
          wait_time: number | null
          payment_method: string | null
          insurance_provider: string | null
          insurance_number: string | null
          mpesa_number: string | null
          bank_reference: string | null
          patient_type: string
          op_number: string | null
          ip_number: string | null
          em_number: string | null
          is_emergency: boolean | null
          emergency_type: string | null
          emergency_description: string | null
          emergency_brought_by: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          assigned_doctor_id: string | null
          assigned_doctor_name: string | null
          assigned_at: string | null
          workflow_timestamps: Json | null
          workflow_flags: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          id_number?: string | null
          full_name: string
          age: number
          gender: string
          email?: string | null
          phone_number?: string | null
          place_of_residence?: string | null
          registration_date?: string | null
          status?: string | null
          priority?: string | null
          current_department?: string | null
          next_destination?: string | null
          previous_departments?: Json | null
          is_new_patient?: boolean | null
          wait_time?: number | null
          payment_method?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          mpesa_number?: string | null
          bank_reference?: string | null
          patient_type: string
          op_number?: string | null
          ip_number?: string | null
          em_number?: string | null
          is_emergency?: boolean | null
          emergency_type?: string | null
          emergency_description?: string | null
          emergency_brought_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          assigned_doctor_id?: string | null
          assigned_doctor_name?: string | null
          assigned_at?: string | null
          workflow_timestamps?: Json | null
          workflow_flags?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hospital_id?: string | null
          id_number?: string | null
          full_name?: string
          age?: number
          gender?: string
          email?: string | null
          phone_number?: string | null
          place_of_residence?: string | null
          registration_date?: string | null
          status?: string | null
          priority?: string | null
          current_department?: string | null
          next_destination?: string | null
          previous_departments?: Json | null
          is_new_patient?: boolean | null
          wait_time?: number | null
          payment_method?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          mpesa_number?: string | null
          bank_reference?: string | null
          patient_type?: string
          op_number?: string | null
          ip_number?: string | null
          em_number?: string | null
          is_emergency?: boolean | null
          emergency_type?: string | null
          emergency_description?: string | null
          emergency_brought_by?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          assigned_doctor_id?: string | null
          assigned_doctor_name?: string | null
          assigned_at?: string | null
          workflow_timestamps?: Json | null
          workflow_flags?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      vital_signs: {
        Row: {
          id: string
          patient_id: string
          blood_pressure: string
          pulse_rate: number
          temperature: number
          oxygen_saturation: number
          respiratory_rate: number
          recorded_at: string
          recorded_by: string
          notes: string | null
          weight: number | null
          height: number | null
          bmi: number | null
          is_emergency: boolean | null
          glasgow_coma_scale: Json | null
          avpu: string | null
          trauma_score: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          blood_pressure: string
          pulse_rate: number
          temperature: number
          oxygen_saturation: number
          respiratory_rate: number
          recorded_at: string
          recorded_by: string
          notes?: string | null
          weight?: number | null
          height?: number | null
          bmi?: number | null
          is_emergency?: boolean | null
          glasgow_coma_scale?: Json | null
          avpu?: string | null
          trauma_score?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          blood_pressure?: string
          pulse_rate?: number
          temperature?: number
          oxygen_saturation?: number
          respiratory_rate?: number
          recorded_at?: string
          recorded_by?: string
          notes?: string | null
          weight?: number | null
          height?: number | null
          bmi?: number | null
          is_emergency?: boolean | null
          glasgow_coma_scale?: Json | null
          avpu?: string | null
          trauma_score?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_history: {
        Row: {
          id: string
          patient_id: string
          has_diabetes: boolean | null
          has_hypertension: boolean | null
          has_heart_disease: boolean | null
          has_asthma: boolean | null
          has_cancer: boolean | null
          has_surgeries: boolean | null
          has_allergies: boolean | null
          allergies: Json | null
          medications: Json | null
          family_history: Json | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          has_diabetes?: boolean | null
          has_hypertension?: boolean | null
          has_heart_disease?: boolean | null
          has_asthma?: boolean | null
          has_cancer?: boolean | null
          has_surgeries?: boolean | null
          has_allergies?: boolean | null
          allergies?: Json | null
          medications?: Json | null
          family_history?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          has_diabetes?: boolean | null
          has_hypertension?: boolean | null
          has_heart_disease?: boolean | null
          has_asthma?: boolean | null
          has_cancer?: boolean | null
          has_surgeries?: boolean | null
          has_allergies?: boolean | null
          allergies?: Json | null
          medications?: Json | null
          family_history?: Json | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      consultations: {
        Row: {
          id: string
          patient_id: string
          department: string
          doctor_id: string
          doctor_name: string
          start_time: string
          end_time: string | null
          status: string
          priority: string
          chief_complaints: Json | null
          symptoms: Json | null
          diagnosis: Json | null
          treatment: string | null
          notes: string | null
          clinical_notes: string | null
          lab_tests: Json | null
          medications: Json | null
          follow_up: Json | null
          sick_leave: Json | null
          department_specific: Json | null
          timeline: Json | null
          next_department: string | null
          admission_required: boolean | null
          admission_reason: string | null
          admission_notes: string | null
          is_emergency: boolean | null
          emergency_details: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          department: string
          doctor_id: string
          doctor_name: string
          start_time: string
          end_time?: string | null
          status: string
          priority: string
          chief_complaints?: Json | null
          symptoms?: Json | null
          diagnosis?: Json | null
          treatment?: string | null
          notes?: string | null
          clinical_notes?: string | null
          lab_tests?: Json | null
          medications?: Json | null
          follow_up?: Json | null
          sick_leave?: Json | null
          department_specific?: Json | null
          timeline?: Json | null
          next_department?: string | null
          admission_required?: boolean | null
          admission_reason?: string | null
          admission_notes?: string | null
          is_emergency?: boolean | null
          emergency_details?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          department?: string
          doctor_id?: string
          doctor_name?: string
          start_time?: string
          end_time?: string | null
          status?: string
          priority?: string
          chief_complaints?: Json | null
          symptoms?: Json | null
          diagnosis?: Json | null
          treatment?: string | null
          notes?: string | null
          clinical_notes?: string | null
          lab_tests?: Json | null
          medications?: Json | null
          follow_up?: Json | null
          sick_leave?: Json | null
          department_specific?: Json | null
          timeline?: Json | null
          next_department?: string | null
          admission_required?: boolean | null
          admission_reason?: string | null
          admission_notes?: string | null
          is_emergency?: boolean | null
          emergency_details?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_tests: {
        Row: {
          id: string
          patient_id: string
          test_type: string
          requested_by: string
          requested_at: string
          department: string
          priority: string
          clinical_info: string
          status: string
          return_to_department: string
          sample_id: string | null
          sample_type: string | null
          sample_collected_at: string | null
          sample_collected_by: string | null
          started_at: string | null
          machine_id: string | null
          machine_name: string | null
          results: Json | null
          report_delivery: Json | null
          notes: string | null
          custom_fields: Json | null
          category: string | null
          payment_status: string | null
          inventory_used: Json | null
          order_transmission_status: string | null
          order_transmission_time: string | null
          order_received_time: string | null
          workflow_timestamps: Json | null
          review_status: Json | null
          is_emergency: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          test_type: string
          requested_by: string
          requested_at: string
          department: string
          priority: string
          clinical_info: string
          status: string
          return_to_department: string
          sample_id?: string | null
          sample_type?: string | null
          sample_collected_at?: string | null
          sample_collected_by?: string | null
          started_at?: string | null
          machine_id?: string | null
          machine_name?: string | null
          results?: Json | null
          report_delivery?: Json | null
          notes?: string | null
          custom_fields?: Json | null
          category?: string | null
          payment_status?: string | null
          inventory_used?: Json | null
          order_transmission_status?: string | null
          order_transmission_time?: string | null
          order_received_time?: string | null
          workflow_timestamps?: Json | null
          review_status?: Json | null
          is_emergency?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          test_type?: string
          requested_by?: string
          requested_at?: string
          department?: string
          priority?: string
          clinical_info?: string
          status?: string
          return_to_department?: string
          sample_id?: string | null
          sample_type?: string | null
          sample_collected_at?: string | null
          sample_collected_by?: string | null
          started_at?: string | null
          machine_id?: string | null
          machine_name?: string | null
          results?: Json | null
          report_delivery?: Json | null
          notes?: string | null
          custom_fields?: Json | null
          category?: string | null
          payment_status?: string | null
          inventory_used?: Json | null
          order_transmission_status?: string | null
          order_transmission_time?: string | null
          order_received_time?: string | null
          workflow_timestamps?: Json | null
          review_status?: Json | null
          is_emergency?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          consultation_id: string | null
          prescribed_by: string
          prescribed_at: string
          status: string
          medications: Json
          notes: string | null
          dispensed_at: string | null
          dispensed_by: string | null
          dispensing_notes: string | null
          payment_status: string | null
          patient_instructions: string | null
          is_emergency: boolean | null
          priority: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          consultation_id?: string | null
          prescribed_by: string
          prescribed_at: string
          status: string
          medications: Json
          notes?: string | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          dispensing_notes?: string | null
          payment_status?: string | null
          patient_instructions?: string | null
          is_emergency?: boolean | null
          priority?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          consultation_id?: string | null
          prescribed_by?: string
          prescribed_at?: string
          status?: string
          medications?: Json
          notes?: string | null
          dispensed_at?: string | null
          dispensed_by?: string | null
          dispensing_notes?: string | null
          payment_status?: string | null
          patient_instructions?: string | null
          is_emergency?: boolean | null
          priority?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      medications: {
        Row: {
          id: string
          hospital_id: string | null
          name: string
          category: string
          quantity: number
          unit: string
          minimum_stock: number
          expiry_date: string | null
          price: number
          status: string
          batch_number: string | null
          location: string | null
          supplier: string | null
          reorder_level: number | null
          last_restocked: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          name: string
          category: string
          quantity: number
          unit: string
          minimum_stock: number
          expiry_date?: string | null
          price: number
          status: string
          batch_number?: string | null
          location?: string | null
          supplier?: string | null
          reorder_level?: number | null
          last_restocked?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hospital_id?: string | null
          name?: string
          category?: string
          quantity?: number
          unit?: string
          minimum_stock?: number
          expiry_date?: string | null
          price?: number
          status?: string
          batch_number?: string | null
          location?: string | null
          supplier?: string | null
          reorder_level?: number | null
          last_restocked?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          patient_id: string
          visit_id: string
          items: Json
          total_amount: number
          status: string
          created_at: string
          due_date: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          notes: string | null
          is_emergency: boolean | null
          created_by: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id: string
          items: Json
          total_amount: number
          status: string
          created_at: string
          due_date: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          notes?: string | null
          is_emergency?: boolean | null
          created_by?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          visit_id?: string
          items?: Json
          total_amount?: number
          status?: string
          created_at?: string
          due_date?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          notes?: string | null
          is_emergency?: boolean | null
          created_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          patient_id: string
          invoice_id: string | null
          amount: number
          method: string
          reference: string
          timestamp: string
          received_by: string
          notes: string | null
          is_emergency: boolean | null
          waived: boolean | null
          waived_reason: string | null
          waived_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          invoice_id?: string | null
          amount: number
          method: string
          reference: string
          timestamp: string
          received_by: string
          notes?: string | null
          is_emergency?: boolean | null
          waived?: boolean | null
          waived_reason?: string | null
          waived_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          invoice_id?: string | null
          amount?: number
          method?: string
          reference?: string
          timestamp?: string
          received_by?: string
          notes?: string | null
          is_emergency?: boolean | null
          waived?: boolean | null
          waived_reason?: string | null
          waived_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      service_charges: {
        Row: {
          id: string
          hospital_id: string | null
          name: string
          department: string
          amount: number
          category: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          name: string
          department: string
          amount: number
          category: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hospital_id?: string | null
          name?: string
          department?: string
          amount?: number
          category?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_charges_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          timestamp: string
          read: boolean | null
          patient_id: string | null
          test_id: string | null
          prescription_id: string | null
          invoice_id: string | null
          priority: string
          action: string | null
          department_target: string | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          timestamp: string
          read?: boolean | null
          patient_id?: string | null
          test_id?: string | null
          prescription_id?: string | null
          invoice_id?: string | null
          priority: string
          action?: string | null
          department_target?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          timestamp?: string
          read?: boolean | null
          patient_id?: string | null
          test_id?: string | null
          prescription_id?: string | null
          invoice_id?: string | null
          priority?: string
          action?: string | null
          department_target?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          hospital_id: string | null
          email: string
          name: string
          role: string
          department: string | null
          specialization: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          email: string
          name: string
          role: string
          department?: string | null
          specialization?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hospital_id?: string | null
          email?: string
          name?: string
          role?: string
          department?: string | null
          specialization?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}