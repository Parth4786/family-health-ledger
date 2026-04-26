import { deleteDB, openDB } from "idb";
import type { Snapshot } from "../types";

type PendingOperation = {
  id: string;
  table: "patients" | "medicines" | "purchases" | "reports" | "households";
  payload: Record<string, unknown>;
};

const DB_NAME = "family-health-ledger";
const SNAPSHOT_KEY = "snapshot";
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("snapshots")) {
        database.createObjectStore("snapshots");
      }
      if (!database.objectStoreNames.contains("pending")) {
        database.createObjectStore("pending", { keyPath: "id" });
      }
    },
  });
}

export async function saveSnapshot(snapshot: Snapshot) {
  const db = await getDb();
  await db.put("snapshots", snapshot, SNAPSHOT_KEY);
}

export async function loadSnapshot() {
  const db = await getDb();
  return (await db.get("snapshots", SNAPSHOT_KEY)) as Snapshot | undefined;
}

export async function queueOperation(operation: PendingOperation) {
  const db = await getDb();
  await db.put("pending", operation);
}

export async function listPendingOperations() {
  const db = await getDb();
  return (await db.getAll("pending")) as PendingOperation[];
}

export async function clearPendingOperation(id: string) {
  const db = await getDb();
  await db.delete("pending", id);
}

export async function clearAllLocalData() {
  await deleteDB(DB_NAME);
}
