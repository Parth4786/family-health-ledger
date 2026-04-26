import { useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { clearAllLocalData, clearPendingOperation, listPendingOperations, loadSnapshot, queueOperation, saveSnapshot } from "../lib/db";
import { demoSnapshot } from "../lib/demo";
import { buildAppStats, buildDerivedMedicines, buildPatientSummaries, buildReminders } from "../lib/ledger";
import { supabase } from "../lib/supabase";
import { todayIso } from "../lib/date";
import type { Household, Medicine, Patient, Purchase, Report, Snapshot, SyncStatus } from "../types";

type TableName = "households" | "patients" | "medicines" | "purchases" | "reports";

function stamp(payload: Record<string, unknown>) {
  const now = new Date().toISOString();
  return {
    ...payload,
    updated_at: now,
    created_at: (payload.created_at as string | undefined) ?? now,
  };
}

async function fetchHousehold(ownerId: string) {
  const { data, error } = await supabase.from("households").select("*").eq("owner_id", ownerId).maybeSingle();
  if (error) {
    throw error;
  }
  return data as Household | null;
}

async function ensureHousehold(ownerId: string, fallbackName: string) {
  const existing = await fetchHousehold(ownerId);
  if (existing) {
    return existing;
  }

  const payload = stamp({
    id: crypto.randomUUID(),
    owner_id: ownerId,
    name: fallbackName,
  });

  const { data, error } = await supabase.from("households").upsert(payload).select().single();
  if (error) {
    throw error;
  }
  return data as Household;
}

async function fetchReportsWithUrls(householdId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("household_id", householdId)
    .order("report_date", { ascending: false });

  if (error) {
    throw error;
  }

  const reports = (data ?? []) as Report[];
  const resolved = await Promise.all(
    reports.map(async (report) => {
      if (!report.file_path) {
        return report;
      }

      const { data: signed } = await supabase.storage.from("reports").createSignedUrl(report.file_path, 60 * 60 * 24 * 30);
      return {
        ...report,
        file_url: signed?.signedUrl ?? report.file_url,
      };
    }),
  );

  return resolved;
}

async function fetchSnapshot(householdId: string) {
  const [patientsResult, medicinesResult, purchasesResult, reports, householdResult] = await Promise.all([
    supabase.from("patients").select("*").eq("household_id", householdId).order("updated_at", { ascending: false }),
    supabase.from("medicines").select("*").eq("household_id", householdId).order("updated_at", { ascending: false }),
    supabase.from("purchases").select("*").eq("household_id", householdId).order("purchased_on", { ascending: false }),
    fetchReportsWithUrls(householdId),
    supabase.from("households").select("*").eq("id", householdId).single(),
  ]);

  const failures = [patientsResult.error, medicinesResult.error, purchasesResult.error, householdResult.error].filter(Boolean);
  if (failures.length > 0) {
    throw failures[0];
  }

  return {
    household: householdResult.data as Household,
    patients: (patientsResult.data ?? []) as Patient[],
    medicines: (medicinesResult.data ?? []) as Medicine[],
    purchases: (purchasesResult.data ?? []) as Purchase[],
    reports,
  } satisfies Snapshot;
}

export function useLedger() {
  const [session, setSession] = useState<Session | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(demoSnapshot);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSnapshot().then((cached) => {
      if (!mounted || !cached) {
        return;
      }
      setSnapshot(cached);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session);
      setSyncStatus(data.session ? "syncing" : "ready");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession) => {
        setSession(nextSession);
      },
    );

    const handleOnline = () => {
      setSyncStatus((current) => (current === "offline" ? "syncing" : current));
    };

    window.addEventListener("online", handleOnline);

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsConfigured(false);
      setSyncStatus("ready");
      return;
    }

    if (!navigator.onLine) {
      setSyncStatus("offline");
      return;
    }

    let cancelled = false;

    async function sync() {
      try {
        setSyncStatus("syncing");
        setError("");

        const household = await ensureHousehold(
          session?.user.id ?? "",
          session?.user.user_metadata.household_name || "My Family Ledger",
        );

        await flushPending();
        const remoteSnapshot = await fetchSnapshot(household.id);

        if (!cancelled) {
          setSnapshot(remoteSnapshot);
          await saveSnapshot(remoteSnapshot);
          setIsConfigured(true);
          setSyncStatus("ready");
        }
      } catch (syncError) {
        if (!cancelled) {
          setIsConfigured(false);
          setSyncStatus("error");
          setError(
            syncError instanceof Error
              ? syncError.message
              : "Supabase sync failed. Check SQL setup and bucket policies.",
          );
        }
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function flushPending() {
    const pending = await listPendingOperations();
    for (const operation of pending) {
      const { error: operationError } = await supabase.from(operation.table).upsert(operation.payload);
      if (operationError) {
        throw operationError;
      }
      await clearPendingOperation(operation.id);
    }
  }

  async function persistSnapshot(nextSnapshot: Snapshot) {
    setSnapshot(nextSnapshot);
    await saveSnapshot(nextSnapshot);
  }

  async function upsertRecord(
    table: TableName,
    record: Record<string, unknown>,
  ) {
    const stampedRecord = stamp(record);

    if (!session?.user || !navigator.onLine) {
      await queueOperation({
        id: crypto.randomUUID(),
        table,
        payload: stampedRecord,
      });
      setSyncStatus("offline");
      return stampedRecord;
    }

    const { error: upsertError } = await supabase.from(table).upsert(stampedRecord);
    if (upsertError) {
      throw upsertError;
    }

    return stampedRecord;
  }

  async function mutateSnapshot(
    table: TableName,
    record: Record<string, unknown>,
  ) {
    const next = (await upsertRecord(table, record)) as unknown as Record<string, unknown> & { id: string };
    const nextSnapshot = structuredClone(snapshot) as Snapshot;

    if (table === "households") {
      nextSnapshot.household = next as unknown as Household;
    } else {
      const collection = nextSnapshot[table] as unknown as Array<Record<string, unknown> & { id: string }>;
      const index = collection.findIndex((entry) => entry.id === next.id);
      if (index >= 0) {
        collection[index] = next;
      } else {
        collection.unshift(next);
      }
    }

    await persistSnapshot(nextSnapshot);
  }

  async function signUp(email: string, password: string, householdName: string) {
    setError("");
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          household_name: householdName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      throw authError;
    }
  }

  async function signIn(email: string, password: string) {
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    await clearAllLocalData();
    setSnapshot(demoSnapshot);
  }

  async function addPatient(input: Omit<Patient, "id" | "created_at" | "updated_at" | "household_id" | "is_archived">) {
    if (!snapshot.household) {
      throw new Error("Household setup is missing.");
    }

    await mutateSnapshot("patients", {
      id: crypto.randomUUID(),
      household_id: snapshot.household.id,
      is_archived: false,
      ...input,
    });
  }

  async function addMedicine(
    input: Omit<Medicine, "id" | "created_at" | "updated_at" | "household_id" | "is_archived">,
  ) {
    if (!snapshot.household) {
      throw new Error("Household setup is missing.");
    }

    await mutateSnapshot("medicines", {
      id: crypto.randomUUID(),
      household_id: snapshot.household.id,
      is_archived: false,
      ...input,
    });
  }

  async function addPurchase(
    input: Omit<Purchase, "id" | "created_at" | "updated_at" | "household_id" | "is_archived">,
  ) {
    if (!snapshot.household) {
      throw new Error("Household setup is missing.");
    }

    await mutateSnapshot("purchases", {
      id: crypto.randomUUID(),
      household_id: snapshot.household.id,
      is_archived: false,
      ...input,
    });
  }

  async function addReport(
    input: Omit<Report, "id" | "created_at" | "updated_at" | "household_id" | "is_archived" | "file_url">,
    file?: File | null,
  ) {
    if (!snapshot.household) {
      throw new Error("Household setup is missing.");
    }

    let filePath = input.file_path;
    let fileUrl = "";

    if (file && session?.user) {
      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-").toLowerCase()}`;
      filePath = `${snapshot.household.id}/${input.patient_id}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from("reports").upload(filePath, file, {
        upsert: true,
      });
      if (uploadError) {
        throw uploadError;
      }
      const { data: signed } = await supabase.storage.from("reports").createSignedUrl(filePath, 60 * 60 * 24 * 30);
      fileUrl = signed?.signedUrl ?? "";
    }

    await mutateSnapshot("reports", {
      id: crypto.randomUUID(),
      household_id: snapshot.household.id,
      ...input,
      file_url: fileUrl,
      file_path: filePath,
      is_archived: false,
    });
  }

  async function toggleMedicineActive(medicine: Medicine) {
    await mutateSnapshot("medicines", {
      ...medicine,
      is_active: !medicine.is_active,
      stop_date: medicine.is_active ? todayIso() : null,
    });
  }

  async function archivePatient(patient: Patient) {
    await mutateSnapshot("patients", {
      ...patient,
      is_archived: true,
      is_active: false,
    });
  }

  async function archiveMedicine(medicine: Medicine) {
    await mutateSnapshot("medicines", {
      ...medicine,
      is_archived: true,
      is_active: false,
      stop_date: medicine.stop_date ?? todayIso(),
    });
  }

  async function archivePurchase(purchase: Purchase) {
    await mutateSnapshot("purchases", {
      ...purchase,
      is_archived: true,
    });
  }

  async function archiveReport(report: Report) {
    await mutateSnapshot("reports", {
      ...report,
      is_archived: true,
    });
  }

  const derivedMedicines = useMemo(
    () => buildDerivedMedicines(snapshot.patients, snapshot.medicines, snapshot.purchases),
    [snapshot],
  );
  const reminders = useMemo(() => buildReminders(derivedMedicines), [derivedMedicines]);
  const patientSummaries = useMemo(
    () => buildPatientSummaries(snapshot.patients, derivedMedicines, snapshot.reports),
    [snapshot.patients, snapshot.reports, derivedMedicines],
  );
  const stats = useMemo(
    () => buildAppStats(snapshot.patients, derivedMedicines, snapshot.reports),
    [snapshot.patients, snapshot.reports, derivedMedicines],
  );

  return {
    session,
    snapshot,
    reminders,
    patientSummaries,
    derivedMedicines,
    stats,
    error,
    syncStatus,
    isConfigured,
    signIn,
    signUp,
    signOut,
    addPatient,
    addMedicine,
    addPurchase,
    addReport,
    toggleMedicineActive,
    archivePatient,
    archiveMedicine,
    archivePurchase,
    archiveReport,
  };
}
