import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config.js";

const DEFAULT_GUEST_RECORDS = [
  {
    id: "REC_1001",
    receiptNo: "RC-1001",
    date: new Date().toISOString().slice(0, 16),
    farmerName: "Parasara Zahid",
    mobileNumber: "9879400931",
    villageName: "Sindhavdar",
    milkShift: "Morning",
    milkType: "Cow",
    litreQty: 10.0,
    fatPercentage: 4.5,
    ratePerLitre: 45.0,
    totalAmount: 450.0,
    remarks: "Regular daily entry",
  },
];

export const getRecordsStorageKey = (userId) => {
  return userId ? `mcms_records_${userId}` : "mcms_records";
};

export const getPendingSyncKey = (userId) => {
  return userId ? `mcms_pending_sync_${userId}` : "mcms_pending_sync_guest";
};

/**
 * Loads records from local cache for fast initial UI rendering.
 */
export const getCachedRecords = (userId) => {
  const key = getRecordsStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read cached records:", err);
  }

  // If guest, initialize default demo records
  if (!userId) {
    try {
      localStorage.setItem("mcms_records", JSON.stringify(DEFAULT_GUEST_RECORDS));
    } catch {
      // ignore storage error
    }
    return DEFAULT_GUEST_RECORDS;
  }

  return [];
};

/**
 * Saves current records to local cache.
 */
export const setCachedRecords = (userId, records) => {
  const key = getRecordsStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.warn("Failed to write cached records:", err);
  }
};

/**
 * Retrieves the pending offline sync queue from localStorage.
 */
export const getPendingQueue = (userId) => {
  if (!userId) return [];
  const key = getPendingSyncKey(userId);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Appends an operation to the pending offline sync queue.
 */
export const addToPendingQueue = (userId, operation) => {
  if (!userId) return;
  const key = getPendingSyncKey(userId);
  try {
    const queue = getPendingQueue(userId);
    // Replace existing operation for same record id if exists
    const filtered = queue.filter((item) => item.id !== operation.id);
    filtered.push(operation);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to add to pending sync queue:", err);
  }
};

/**
 * Clears an item from the pending sync queue.
 */
export const removeFromPendingQueue = (userId, recordId) => {
  if (!userId) return;
  const key = getPendingSyncKey(userId);
  try {
    const queue = getPendingQueue(userId);
    const updated = queue.filter((item) => item.id !== recordId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to remove from pending queue:", err);
  }
};

/**
 * Flushes pending offline sync operations to Firestore.
 * Prevents overwriting newer server data with older local data.
 */
export const flushPendingSyncQueue = async (userId) => {
  if (!db || !userId || !navigator.onLine) return;
  const queue = getPendingQueue(userId);
  if (queue.length === 0) return;

  for (const op of queue) {
    try {
      const recordDocRef = doc(db, "records", op.id);
      if (op.type === "set") {
        // Compare with server document to avoid overwriting newer server data
        const serverSnap = await getDoc(recordDocRef);
        if (serverSnap.exists()) {
          const serverData = serverSnap.data();
          const serverUpdatedAt = new Date(serverData.updatedAt || serverData.createdAt || 0).getTime();
          const localUpdatedAt = new Date(op.data.updatedAt || op.data.createdAt || 0).getTime();
          if (serverUpdatedAt > localUpdatedAt) {
            // Server data is newer; skip overwriting
            removeFromPendingQueue(userId, op.id);
            continue;
          }
        }
        await setDoc(recordDocRef, op.data, { merge: true });
        removeFromPendingQueue(userId, op.id);
      } else if (op.type === "delete") {
        await deleteDoc(recordDocRef);
        removeFromPendingQueue(userId, op.id);
      }
    } catch (err) {
      console.warn(`Pending sync error for record ${op.id}:`, err?.message || err);
    }
  }
};

/**
 * Real-time subscription to user's milk records in Firestore.
 * Listens to updates from all devices simultaneously.
 */
export const subscribeToMilkRecords = (userId, onUpdate, onError) => {
  if (!isFirebaseConfigured || !db || !userId) {
    const cached = getCachedRecords(userId);
    onUpdate(cached);
    return () => {};
  }

  // First flush any offline pending actions
  flushPendingSyncQueue(userId).catch(() => {});

  // Query records for this authenticated user
  const recordsQuery = query(
    collection(db, "records"),
    where("userId", "==", userId)
  );

  let isFirstLoad = true;

  const unsubscribe = onSnapshot(
    recordsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      const serverRecords = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        serverRecords.push({
          id: docSnap.id,
          ...data,
          // Ensure numeric types match component expectations
          litreQty: Number(data.litreQty) || 0,
          fatPercentage: Number(data.fatPercentage) || 0,
          ratePerLitre: Number(data.ratePerLitre) || 0,
          totalAmount: Number(data.totalAmount) || 0,
        });
      });

      // Sort records by date / createdAt descending
      serverRecords.sort((a, b) => {
        const tA = new Date(a.date || a.createdAt || 0).getTime();
        const tB = new Date(b.date || b.createdAt || 0).getTime();
        return tB - tA;
      });

      // Update local storage cache
      setCachedRecords(userId, serverRecords);

      // Notify caller
      onUpdate(serverRecords);
      isFirstLoad = false;
    },
    (error) => {
      console.warn("Real-time milk records subscription warning:", error?.message || error);
      if (isFirstLoad) {
        // Fall back to cached local storage records
        const cached = getCachedRecords(userId);
        onUpdate(cached);
      }
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );

  return unsubscribe;
};

/**
 * One-time fetch for records (used for periodic fallback refresh).
 */
export const fetchMilkRecords = async (userId) => {
  if (!isFirebaseConfigured || !db || !userId) {
    return getCachedRecords(userId);
  }

  try {
    const recordsQuery = query(
      collection(db, "records"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(recordsQuery);
    const list = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        litreQty: Number(data.litreQty) || 0,
        fatPercentage: Number(data.fatPercentage) || 0,
        ratePerLitre: Number(data.ratePerLitre) || 0,
        totalAmount: Number(data.totalAmount) || 0,
      });
    });

    list.sort((a, b) => {
      const tA = new Date(a.date || a.createdAt || 0).getTime();
      const tB = new Date(b.date || b.createdAt || 0).getTime();
      return tB - tA;
    });

    setCachedRecords(userId, list);
    return list;
  } catch (err) {
    console.warn("fetchMilkRecords error:", err);
    return getCachedRecords(userId);
  }
};

/**
 * Saves a new milk record.
 * Handles both online real-time save and offline local queueing.
 */
export const saveMilkRecord = async (recordData, userId) => {
  // Deterministic unique ID with entropy to avoid collisions across simultaneous devices
  const recordId =
    recordData.id || `REC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const nowIso = new Date().toISOString();
  const record = {
    ...recordData,
    id: recordId,
    userId: userId || "guest",
    litreQty: Number(recordData.litreQty) || 0,
    fatPercentage: Number(recordData.fatPercentage) || 0,
    ratePerLitre: Number(recordData.ratePerLitre) || 0,
    totalAmount: Number(recordData.totalAmount) || 0,
    createdAt: recordData.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", recordId);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn("Failed to write record to Firestore directly; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id: recordId, data: record });
    }
  }

  return record;
};

/**
 * Updates an existing milk record.
 */
export const updateMilkRecord = async (id, recordData, userId) => {
  const nowIso = new Date().toISOString();
  const updated = {
    ...recordData,
    id,
    userId: userId || "guest",
    litreQty: Number(recordData.litreQty) || 0,
    fatPercentage: Number(recordData.fatPercentage) || 0,
    ratePerLitre: Number(recordData.ratePerLitre) || 0,
    totalAmount: Number(recordData.totalAmount) || 0,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn("Failed to update record in Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id, data: updated });
    }
  }

  return updated;
};

/**
 * Deletes a milk record.
 */
export const deleteMilkRecord = async (id, userId) => {
  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Failed to delete record from Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "delete", id });
    }
  }
};

/**
 * Migrates local guest records to authenticated user if any non-default records exist.
 */
export const migrateGuestRecordsIfAny = async (userId) => {
  if (!userId || !db) return;
  try {
    const raw = localStorage.getItem("mcms_records");
    if (!raw) return;
    const guestRecords = JSON.parse(raw);
    if (!Array.isArray(guestRecords) || guestRecords.length === 0) return;

    // Check if user already has records on server
    const serverRecords = await fetchMilkRecords(userId);
    const serverIds = new Set(serverRecords.map((r) => r.id));
    const serverReceipts = new Set(serverRecords.map((r) => r.receiptNo));

    for (const r of guestRecords) {
      // Skip the built-in demo record unless user wants it
      if (r.id === "REC_1001" && serverRecords.length > 0) continue;
      // Skip if already in server
      if (serverIds.has(r.id) || serverReceipts.has(r.receiptNo)) continue;

      const toSave = {
        ...r,
        id: r.id || `REC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId,
      };
      await saveMilkRecord(toSave, userId);
    }
  } catch (err) {
    console.warn("Guest records migration warning:", err);
  }
};
