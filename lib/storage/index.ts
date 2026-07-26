// lib/storage/index.ts
// Client-only persistence. Filio stores the working session in the browser's
// IndexedDB. Nothing here ever touches a network — the user's data never leaves
// their device (§2). Export/import writes a .filio.json the user keeps locally.

import { openDB, type IDBPDatabase } from "idb";
import type { FilioData, FilioExportFile } from "@/store/types";
import { triggerBrowserDownload } from "@/lib/download";

const DB_NAME = "filio";
const DB_VERSION = 1;
const STORE = "session";
const KEY = "current";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Persist the current session. Safe to call frequently (the store debounces). */
export async function saveSession(data: FilioData): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await getDB();
  await db.put(STORE, data, KEY);
}

/** Load a previously saved session, or null if none / unavailable. */
export async function loadSession(): Promise<FilioData | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await getDB();
    const data = (await db.get(STORE, KEY)) as FilioData | undefined;
    return data ?? null;
  } catch {
    return null;
  }
}

/** Wipe ALL Filio data from the browser (behind a confirm step in the UI). */
export async function deleteAllData(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await getDB();
    await db.clear(STORE);
    db.close();
  } catch {
    // fall through to a hard delete
  } finally {
    dbPromise = null;
    try {
      indexedDB.deleteDatabase(DB_NAME);
    } catch {
      /* ignore */
    }
  }
}

/** Build the export wrapper for a downloadable .filio.json. */
export function buildExportFile(data: FilioData): FilioExportFile {
  return { app: "filio", schema: 1, exportedAt: data.updatedAt, data };
}

/** Trigger a browser download of the progress file. Stays on the user's machine. */
export function downloadExportFile(data: FilioData): string {
  const payload = JSON.stringify(buildExportFile(data), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const stamp = new Date(data.updatedAt).toISOString().slice(0, 10);
  const filename = `filio-progress-${stamp}.filio.json`;
  triggerBrowserDownload(blob, filename);
  return filename;
}

/** Parse and validate an imported .filio.json. Throws with a friendly message. */
export function parseImportFile(text: string): FilioData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON. Please choose a .filio.json exported by Filio.");
  }
  const file = parsed as Partial<FilioExportFile>;
  if (!file || file.app !== "filio" || !file.data) {
    throw new Error("That doesn't look like a Filio progress file.");
  }
  if (file.data.version !== 1 && file.data.version !== 2) {
    throw new Error("This progress file was made by an incompatible version of Filio.");
  }
  // Older (v1) files predate the multi-form fields; the store fills any gaps by
  // merging over createDefaultData() when it imports, so returning the raw data is safe.
  return file.data;
}
