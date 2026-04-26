export type SyncStatus = "idle" | "loading" | "syncing" | "offline" | "error" | "ready";

export type TabKey = "dashboard" | "patients" | "medicines" | "purchases" | "reports" | "setup";

export interface Household {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  household_id: string;
  name: string;
  relationship: string;
  birth_year: number | null;
  conditions: string;
  notes: string;
  color_accent: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  household_id: string;
  patient_id: string;
  name: string;
  purpose: string;
  dosage_per_day: number;
  schedule: string[];
  tablets_per_strip: number;
  initial_strips_bought: number;
  initial_total_cost: number;
  start_date: string;
  stop_date: string | null;
  notes: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  household_id: string;
  patient_id: string;
  medicine_id: string | null;
  label: string;
  purchased_on: string;
  strips_bought: number;
  tablets_per_strip: number;
  total_cost: number;
  pharmacy: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  household_id: string;
  patient_id: string;
  title: string;
  report_type: string;
  report_date: string;
  summary: string;
  file_url: string;
  file_path: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  household: Household | null;
  patients: Patient[];
  medicines: Medicine[];
  purchases: Purchase[];
  reports: Report[];
}

export interface ReminderItem {
  medicine: Medicine;
  patient: Patient;
  daysLeft: number;
  remainingTablets: number;
  remainingValue: number;
  status: "critical" | "warning" | "ok";
}

export interface PatientSummary {
  patient: Patient;
  activeMedicines: number;
  criticalCount: number;
  monthlyCost: number;
  reportCount: number;
}

export interface AppStats {
  monthlyCost: number;
  criticalCount: number;
  totalReports: number;
  activePatients: number;
}

export interface DerivedMedicine {
  medicine: Medicine;
  patient: Patient | undefined;
  totalTablets: number;
  consumedTablets: number;
  remainingTablets: number;
  daysLeft: number;
  endDate: string | null;
  dailyCost: number;
  remainingValue: number;
  totalCost: number;
}
