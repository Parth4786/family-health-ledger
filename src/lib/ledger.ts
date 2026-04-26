import { addDays, daysBetween, todayIso } from "./date";
import type {
  AppStats,
  DerivedMedicine,
  Medicine,
  Patient,
  PatientSummary,
  Purchase,
  ReminderItem,
  Report,
} from "../types";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateMedicineState(
  medicine: Medicine,
  purchases: Purchase[],
  today = todayIso(),
): Omit<DerivedMedicine, "patient"> {
  const medicinePurchases = purchases.filter(
    (purchase) => !purchase.is_archived && purchase.medicine_id === medicine.id,
  );

  const initialTablets = medicine.initial_strips_bought * medicine.tablets_per_strip;
  const purchasedTablets = medicinePurchases.reduce(
    (sum, purchase) => sum + purchase.strips_bought * purchase.tablets_per_strip,
    0,
  );
  const totalTablets = round(initialTablets + purchasedTablets);
  const consumedTablets = round(daysBetween(medicine.start_date, today) * medicine.dosage_per_day);
  const remainingTablets = round(Math.max(0, totalTablets - consumedTablets));
  const daysLeft = medicine.dosage_per_day > 0 ? Math.max(0, Math.ceil(remainingTablets / medicine.dosage_per_day)) : 0;

  const initialCost = medicine.initial_total_cost;
  const purchaseCost = medicinePurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const totalCost = initialCost + purchaseCost;
  const costPerTablet = totalTablets > 0 ? totalCost / totalTablets : 0;
  const dailyCost = round(costPerTablet * medicine.dosage_per_day);
  const remainingValue = round(costPerTablet * remainingTablets);

  return {
    medicine,
    totalTablets,
    consumedTablets,
    remainingTablets,
    daysLeft,
    endDate: medicine.is_active ? addDays(today, daysLeft) : medicine.stop_date,
    dailyCost,
    remainingValue,
    totalCost,
  };
}

export function buildDerivedMedicines(
  patients: Patient[],
  medicines: Medicine[],
  purchases: Purchase[],
  today = todayIso(),
): DerivedMedicine[] {
  return medicines
    .filter((medicine) => !medicine.is_archived)
    .map((medicine) => {
      const patient = patients.find((entry) => entry.id === medicine.patient_id);
      const state = calculateMedicineState(medicine, purchases, today);
      return {
        ...state,
        patient,
      };
    });
}

export function buildReminders(derivedMedicines: DerivedMedicine[]): ReminderItem[] {
  return derivedMedicines
    .filter((entry) => entry.medicine.is_active && !entry.medicine.stop_date && entry.patient?.is_active)
    .filter((entry) => entry.daysLeft <= 7)
    .map((entry) => ({
      medicine: entry.medicine,
      patient: entry.patient!,
      daysLeft: entry.daysLeft,
      remainingTablets: entry.remainingTablets,
      remainingValue: entry.remainingValue,
      status: entry.daysLeft <= 2 ? "critical" : entry.daysLeft <= 5 ? "warning" : "ok",
    }) as ReminderItem)
    .sort((left, right) => left.daysLeft - right.daysLeft);
}

export function buildPatientSummaries(
  patients: Patient[],
  derivedMedicines: DerivedMedicine[],
  reports: Report[],
): PatientSummary[] {
  return patients
    .filter((patient) => !patient.is_archived)
    .map((patient) => {
      const medicines = derivedMedicines.filter((entry) => entry.medicine.patient_id === patient.id);
      return {
        patient,
        activeMedicines: medicines.filter((entry) => entry.medicine.is_active).length,
        criticalCount: medicines.filter((entry) => entry.medicine.is_active && entry.daysLeft <= 2).length,
        monthlyCost: round(medicines.reduce((sum, entry) => sum + entry.dailyCost * 30, 0)),
        reportCount: reports.filter((report) => !report.is_archived && report.patient_id === patient.id).length,
      };
    });
}

export function buildAppStats(
  patients: Patient[],
  derivedMedicines: DerivedMedicine[],
  reports: Report[],
): AppStats {
  return {
    monthlyCost: round(derivedMedicines.reduce((sum, entry) => sum + entry.dailyCost * 30, 0)),
    criticalCount: derivedMedicines.filter((entry) => entry.medicine.is_active && entry.daysLeft <= 2).length,
    totalReports: reports.filter((report) => !report.is_archived).length,
    activePatients: patients.filter((patient) => patient.is_active && !patient.is_archived).length,
  };
}
