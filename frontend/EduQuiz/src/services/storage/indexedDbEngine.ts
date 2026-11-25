import type { AdminRecordEnvelope } from "../../types/admin";
import type {
  AttemptAnswerRecord,
  AttemptRecord,
  QuestionReportRecord,
} from "../../types/attempt";
import type { StorageMode } from "../../types/pagination";
import type { ProctoringViolationEvent } from "../../types/proctoring";
import type { QuestionRecord, QuizRecord } from "../../types/quiz";
import {
  BACKEND_SEED_QUESTIONS,
  BACKEND_SEED_QUIZZES,
} from "../data/backendSeederMirror";
import {
  buildFigmaAdminRecordEnvelopes,
  FIGMA_ATTEMPTS,
  FIGMA_INITIAL_ANSWERS,
  FIGMA_QUESTION_REPORTS,
  FIGMA_QUESTIONS,
  FIGMA_QUIZZES,
} from "../data/figmaReferenceCatalog";

export const DB_NAME = "eduquiz_web_idb";
export const DB_VERSION = 1;
export const SEED_VERSION = "v5.1-seed-1";

export const STORE_NAMES = [
  "quizzes",
  "questions",
  "attempts",
  "attempt_answers",
  "question_reports",
  "proctoring_logs",
  "admin_records",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

export interface StoreTypeMap {
  quizzes: QuizRecord;
  questions: QuestionRecord;
  attempts: AttemptRecord;
  attempt_answers: AttemptAnswerRecord;
  question_reports: QuestionReportRecord;
  proctoring_logs: ProctoringViolationEvent;
  admin_records: AdminRecordEnvelope;
}

interface IndexSpec {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

const STORE_SCHEMAS: Record<StoreName, { keyPath: string; indexes: IndexSpec[] }> = {
  quizzes: {
    keyPath: "id",
    indexes: [
      { name: "by_subjectId", keyPath: "subjectId" },
      { name: "by_levelCode", keyPath: "levelCode" },
      { name: "by_status", keyPath: "quizStatus" },
      { name: "by_source", keyPath: "dataSource" },
      { name: "by_saved", keyPath: "isSaved" },
    ],
  },
  questions: {
    keyPath: "id",
    indexes: [
      { name: "by_quizId", keyPath: "quizId" },
      { name: "by_quiz_order", keyPath: ["quizId", "orderIndex"], unique: true },
      { name: "by_subject_level", keyPath: ["subjectName", "levelCode"] },
      { name: "by_status", keyPath: "approvalStatus" },
    ],
  },
  attempts: {
    keyPath: "id",
    indexes: [
      { name: "by_quizId", keyPath: "quizId" },
      { name: "by_status", keyPath: "status" },
      { name: "by_startedAt", keyPath: "startedAt" },
      { name: "by_user_status", keyPath: ["userId", "status"] },
    ],
  },
  attempt_answers: {
    keyPath: "id",
    indexes: [
      { name: "by_attemptId", keyPath: "attemptId" },
      { name: "by_attempt_order", keyPath: ["attemptId", "orderIndex"] },
      { name: "by_bookmarked", keyPath: ["attemptId", "isBookmarked"] },
    ],
  },
  question_reports: {
    keyPath: "id",
    indexes: [
      { name: "by_questionId", keyPath: "questionId" },
      { name: "by_status", keyPath: "status" },
      { name: "by_priority", keyPath: "priority" },
      { name: "by_createdAt", keyPath: "createdAt" },
    ],
  },
  proctoring_logs: {
    keyPath: "id",
    indexes: [
      { name: "by_attemptId", keyPath: "attemptId" },
      { name: "by_type", keyPath: "violationType" },
      { name: "by_timestamp", keyPath: "timestamp" },
    ],
  },
  admin_records: {
    keyPath: "id",
    indexes: [
      { name: "by_recordType", keyPath: "recordType" },
      { name: "by_status", keyPath: "status" },
      { name: "by_updatedAt", keyPath: "updatedAt" },
    ],
  },
};

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<void> | null = null;
let storageMode: StorageMode = "INDEXED_DB";
const modeListeners = new Set<(mode: StorageMode) => void>();

/**
 * In-Memory Fallback (Degraded Mode) when browser blocks IndexedDB.
 * NOTE: Does NOT survive F5/page reload; UI must show Degraded Mode notice.
 */
const memoryStores: Record<StoreName, Map<string, unknown>> = {
  quizzes: new Map(),
  questions: new Map(),
  attempts: new Map(),
  attempt_answers: new Map(),
  question_reports: new Map(),
  proctoring_logs: new Map(),
  admin_records: new Map(),
};

function setStorageMode(next: StorageMode): void {
  if (storageMode !== next) {
    storageMode = next;
    modeListeners.forEach((fn) => fn(next));
  }
}

export function getStorageMode(): StorageMode {
  return storageMode;
}

export function subscribeStorageMode(listener: (mode: StorageMode) => void): () => void {
  modeListeners.add(listener);
  return () => modeListeners.delete(listener);
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        const schema = STORE_SCHEMAS[name];
        const store = db.objectStoreNames.contains(name)
          ? request.transaction!.objectStore(name)
          : db.createObjectStore(name, { keyPath: schema.keyPath });

        for (const idx of schema.indexes) {
          if (!store.indexNames.contains(idx.name)) {
            store.createIndex(idx.name, idx.keyPath, { unique: Boolean(idx.unique) });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onblocked = () => reject(new Error("IndexedDB open blocked"));
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putSeedRecordIdempotent<K extends StoreName>(
  storeName: K,
  record: StoreTypeMap[K],
): Promise<void> {
  const existing = await rawGetById(storeName, record.id);
  if (existing && (existing as { modifiedByUser?: boolean }).modifiedByUser) {
    return;
  }
  await rawPut(storeName, record);
}

async function seedDatabaseIdempotent(): Promise<void> {
  const meta = await rawGetById("admin_records", "meta:seed_version");
  if (meta && (meta.payload as { version?: string } | undefined)?.version === SEED_VERSION) {
    return;
  }

  for (const quiz of [...FIGMA_QUIZZES, ...BACKEND_SEED_QUIZZES]) {
    await putSeedRecordIdempotent("quizzes", quiz);
  }
  for (const question of [...FIGMA_QUESTIONS, ...BACKEND_SEED_QUESTIONS]) {
    await putSeedRecordIdempotent("questions", question);
  }
  for (const attempt of FIGMA_ATTEMPTS) {
    await putSeedRecordIdempotent("attempts", attempt);
  }
  for (const answer of FIGMA_INITIAL_ANSWERS) {
    await putSeedRecordIdempotent("attempt_answers", answer);
  }
  for (const report of FIGMA_QUESTION_REPORTS) {
    await putSeedRecordIdempotent("question_reports", report);
  }
  for (const envelope of buildFigmaAdminRecordEnvelopes()) {
    await putSeedRecordIdempotent("admin_records", envelope);
  }

  await rawPut("admin_records", {
    id: "meta:seed_version",
    recordType: "META",
    status: "APPLIED",
    updatedAt: new Date().toISOString(),
    dataSource: "FIGMA_REFERENCE",
    payload: { version: SEED_VERSION },
  });
}

async function rawGetById<K extends StoreName>(
  storeName: K,
  id: string,
): Promise<StoreTypeMap[K] | null> {
  if (storageMode === "IN_MEMORY_FALLBACK" || !dbInstance) {
    return (memoryStores[storeName].get(id) as StoreTypeMap[K] | undefined) ?? null;
  }
  const tx = dbInstance.transaction(storeName, "readonly");
  const res = await idbRequest(tx.objectStore(storeName).get(id));
  return (res as StoreTypeMap[K] | undefined) ?? null;
}

async function rawPut<K extends StoreName>(
  storeName: K,
  record: StoreTypeMap[K],
): Promise<StoreTypeMap[K]> {
  if (storageMode === "IN_MEMORY_FALLBACK" || !dbInstance) {
    memoryStores[storeName].set(record.id, record);
    return record;
  }
  const tx = dbInstance.transaction(storeName, "readwrite");
  await idbRequest(tx.objectStore(storeName).put(record));
  return record;
}

export async function ensureDbReady(): Promise<StorageMode> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        dbInstance = await openIndexedDb();
        setStorageMode("INDEXED_DB");
      } catch {
        dbInstance = null;
        setStorageMode("IN_MEMORY_FALLBACK");
      }
      await seedDatabaseIdempotent();
    })();
  }
  await initPromise;
  return storageMode;
}

export const idbEngine = {
  ensureReady: ensureDbReady,
  getMode: getStorageMode,

  async getAll<K extends StoreName>(storeName: K): Promise<StoreTypeMap[K][]> {
    await ensureDbReady();
    if (storageMode === "IN_MEMORY_FALLBACK" || !dbInstance) {
      return Array.from(memoryStores[storeName].values()) as StoreTypeMap[K][];
    }
    const tx = dbInstance.transaction(storeName, "readonly");
    return (await idbRequest(tx.objectStore(storeName).getAll())) as StoreTypeMap[K][];
  },

  async getById<K extends StoreName>(
    storeName: K,
    id: string,
  ): Promise<StoreTypeMap[K] | null> {
    await ensureDbReady();
    return rawGetById(storeName, id);
  },

  async getByIndex<K extends StoreName>(
    storeName: K,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
  ): Promise<StoreTypeMap[K][]> {
    await ensureDbReady();
    if (storageMode === "IN_MEMORY_FALLBACK" || !dbInstance) {
      const schema = STORE_SCHEMAS[storeName];
      const idx = schema.indexes.find((i) => i.name === indexName);
      const all = Array.from(memoryStores[storeName].values()) as StoreTypeMap[K][];
      if (!idx) return all;
      return all.filter((item) => {
        const rec = item as unknown as Record<string, unknown>;
        if (Array.isArray(idx.keyPath)) {
          const val = idx.keyPath.map((k) => rec[k]);
          return JSON.stringify(val) === JSON.stringify(query);
        }
        return rec[idx.keyPath] === query;
      });
    }
    const tx = dbInstance.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return (await idbRequest(store.index(indexName).getAll(query))) as StoreTypeMap[K][];
  },

  async put<K extends StoreName>(
    storeName: K,
    record: StoreTypeMap[K],
  ): Promise<StoreTypeMap[K]> {
    await ensureDbReady();
    return rawPut(storeName, record);
  },

  async remove<K extends StoreName>(storeName: K, id: string): Promise<void> {
    await ensureDbReady();
    if (storageMode === "IN_MEMORY_FALLBACK" || !dbInstance) {
      memoryStores[storeName].delete(id);
      return;
    }
    const tx = dbInstance.transaction(storeName, "readwrite");
    await idbRequest(tx.objectStore(storeName).delete(id));
  },
};
