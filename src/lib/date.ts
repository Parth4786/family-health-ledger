const dayMs = 24 * 60 * 60 * 1000;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function daysBetween(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / dayMs));
}

export function addDays(value: string, days: number) {
  const base = new Date(`${value}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function relativeDayLabel(daysLeft: number) {
  if (daysLeft <= 0) {
    return "Ends today";
  }
  if (daysLeft === 1) {
    return "Ends tomorrow";
  }
  return `${daysLeft} days left`;
}
