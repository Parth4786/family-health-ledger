import { addDays, daysBetween, todayIso } from "./date";
import type {
  AppStats,
  DailyLog,
  DerivedMedicine,
  Medicine,
  Patient,
  PatientSummary,
  Purchase,
  ReminderItem,
  Report,
  TimelineEntry,
} from "../types";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function courseDaysRemaining(medicine: Medicine, today = todayIso()) {
  if (!medicine.duration_days) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, medicine.duration_days - daysBetween(medicine.start_date, today));
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
  const activeDaysTaken = daysBetween(medicine.start_date, medicine.stop_date ?? today);
  const consumedTablets = round(activeDaysTaken * medicine.dosage_per_day);
  const remainingTablets = round(Math.max(0, totalTablets - consumedTablets));
  const stockDaysLeft = medicine.dosage_per_day > 0 ? Math.max(0, Math.ceil(remainingTablets / medicine.dosage_per_day)) : 0;
  const courseRemaining = courseDaysRemaining(medicine, today);
  const daysLeft = Number.isFinite(courseRemaining) ? Math.min(stockDaysLeft, courseRemaining) : stockDaysLeft;

  const initialCost = medicine.initial_total_cost;
  const purchaseCost = medicinePurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const totalCost = initialCost + purchaseCost;
  const costPerTablet = totalTablets > 0 ? totalCost / totalTablets : 0;
  const dailyCost = round(costPerTablet * medicine.dosage_per_day);
  const remainingValue = round(costPerTablet * remainingTablets);
  const isCourseComplete = Boolean(medicine.duration_days && activeDaysTaken >= medicine.duration_days);

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
    activeDaysTaken,
    isCourseComplete,
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
  dailyLogs: DailyLog[],
): PatientSummary[] {
  return patients
    .filter((patient) => !patient.is_archived)
    .map((patient) => {
      const medicines = derivedMedicines.filter((entry) => entry.medicine.patient_id === patient.id);
      const latestLog = dailyLogs
        .filter((log) => !log.is_archived && log.patient_id === patient.id)
        .sort((left, right) => right.logged_on.localeCompare(left.logged_on))[0];

      return {
        patient,
        activeMedicines: medicines.filter((entry) => entry.medicine.is_active).length,
        criticalCount: medicines.filter((entry) => entry.medicine.is_active && entry.daysLeft <= 2).length,
        monthlyCost: round(medicines.reduce((sum, entry) => sum + entry.dailyCost * 30, 0)),
        reportCount: reports.filter((report) => !report.is_archived && report.patient_id === patient.id).length,
        latestLog,
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

export function buildTimeline(
  patientId: string,
  medicines: DerivedMedicine[],
  purchases: Purchase[],
  reports: Report[],
  dailyLogs: DailyLog[],
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  medicines
    .filter((entry) => entry.medicine.patient_id === patientId)
    .forEach((entry) => {
      entries.push({
        id: `${entry.medicine.id}-start`,
        kind: "medicine-started",
        patientId,
        title: `${entry.medicine.name} started`,
        subtitle: entry.medicine.dosage_notes || entry.medicine.purpose,
        date: entry.medicine.start_date,
      });

      if (entry.medicine.stop_date) {
        entries.push({
          id: `${entry.medicine.id}-stop`,
          kind: "medicine-stopped",
          patientId,
          title: `${entry.medicine.name} stopped`,
          subtitle: `${entry.activeDaysTaken} days taken`,
          date: entry.medicine.stop_date,
        });
      }
    });

  purchases
    .filter((purchase) => !purchase.is_archived && purchase.patient_id === patientId)
    .forEach((purchase) => {
      entries.push({
        id: purchase.id,
        kind: "purchase",
        patientId,
        title: purchase.label,
        subtitle: `${purchase.strips_bought} strips purchased`,
        date: purchase.purchased_on,
      });
    });

  reports
    .filter((report) => !report.is_archived && report.patient_id === patientId)
    .forEach((report) => {
      entries.push({
        id: report.id,
        kind: "report",
        patientId,
        title: report.title,
        subtitle: report.report_type,
        date: report.report_date,
      });
    });

  dailyLogs
    .filter((log) => !log.is_archived && log.patient_id === patientId)
    .forEach((log) => {
      entries.push({
        id: log.id,
        kind: "daily-log",
        patientId,
        title: "Daily health log",
        subtitle: [log.bp_systolic && log.bp_diastolic ? `${log.bp_systolic}/${log.bp_diastolic} BP` : "", log.pulse ? `${log.pulse} pulse` : "", log.sugar ? `${log.sugar} sugar` : ""].filter(Boolean).join(" • ") || "Vitals updated",
        date: log.logged_on,
      });
    });

  return entries.sort((left, right) => right.date.localeCompare(left.date));
}
