import type { IntakeSlot, MedicineTiming, TabKey } from "./types";

export const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "Family board" },
  { key: "patients", label: "Patient profile" },
  { key: "medicines", label: "Medicines" },
  { key: "purchases", label: "Purchases" },
  { key: "reports", label: "Reports" },
  { key: "setup", label: "Setup" },
];

export const accentColors = ["#f97316", "#14b8a6", "#38bdf8", "#f43f5e", "#facc15"];
export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const intakeSlots: IntakeSlot[] = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
];

export const intakeLabels: Record<IntakeSlot, string> = {
  before_breakfast: "Before breakfast",
  after_breakfast: "After breakfast",
  before_lunch: "Before lunch",
  after_lunch: "After lunch",
  before_dinner: "Before dinner",
  after_dinner: "After dinner",
};

export function statusLabel(status: string) {
  if (status === "syncing") return "Syncing household";
  if (status === "offline") return "Offline queue";
  if (status === "error") return "Needs attention";
  if (status === "loading") return "Loading";
  return "Ready";
}

export function emptyTiming(): MedicineTiming {
  return {};
}
