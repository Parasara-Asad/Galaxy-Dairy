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

// --- Default Demo Records for Guest Mode ---
const DEFAULT_GUEST_RECORDS = [
  {
    id: "REC_1001",
    recordType: "milk",
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

const DEFAULT_GUEST_INCOME = [
  {
    id: "INC_1",
    recordType: "income",
    date: new Date().toISOString().slice(0, 10),
    category: "Product Sales",
    description: "Ghee sales to local distributor",
    amount: 2500.0,
  },
  {
    id: "INC_2",
    recordType: "income",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    category: "Subsidy",
    description: "Govt Milk Cooperative Subsidy",
    amount: 1200.0,
  },
];

const DEFAULT_GUEST_EXPENSES = [
  {
    id: "EXP_1",
    recordType: "expense",
    date: new Date().toISOString().slice(0, 10),
    category: "Milk Purchase",
    description: "Milk purchased from farmers",
    amount: 3500.0,
  },
  {
    id: "EXP_2",
    recordType: "expense",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    category: "Transport",
    description: "Pickup van refueling",
    amount: 1100.0,
  },
  {
    id: "EXP_3",
    recordType: "expense",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    category: "Worker Salary",
    description: "Daily wage payment",
    amount: 800.0,
  },
];

// --- Storage Key Helpers ---
export const getRecordsStorageKey = (userId) => {
  return userId ? `mcms_records_${userId}` : "mcms_records";
};

export const getIncomeStorageKey = (userId) => {
  return userId ? `mcms_income_records_${userId}` : "mcms_income_records";
};

export const getExpenseStorageKey = (userId) => {
  return userId ? `mcms_expense_records_${userId}` : "mcms_expense_records";
};

export const getPendingSyncKey = (userId) => {
  return userId ? `mcms_pending_sync_${userId}` : "mcms_pending_sync_guest";
};

// ==========================================
// 1. LOCAL CACHE GETTERS & SETTERS
// ==========================================
export const getCachedRecords = (userId) => {
  const key = getRecordsStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read cached milk records:", err);
  }

  if (!userId) {
    try {
      localStorage.setItem("mcms_records", JSON.stringify(DEFAULT_GUEST_RECORDS));
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_RECORDS;
  }
  return [];
};

export const setCachedRecords = (userId, records) => {
  const key = getRecordsStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.warn("Failed to write cached milk records:", err);
  }
};

export const getCachedIncomeRecords = (userId) => {
  const key = getIncomeStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read cached income records:", err);
  }

  if (!userId) {
    try {
      localStorage.setItem("mcms_income_records", JSON.stringify(DEFAULT_GUEST_INCOME));
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_INCOME;
  }
  return [];
};

export const setCachedIncomeRecords = (userId, records) => {
  const key = getIncomeStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.warn("Failed to write cached income records:", err);
  }
};

export const getCachedExpenseRecords = (userId) => {
  const key = getExpenseStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read cached expense records:", err);
  }

  if (!userId) {
    try {
      localStorage.setItem("mcms_expense_records", JSON.stringify(DEFAULT_GUEST_EXPENSES));
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_EXPENSES;
  }
  return [];
};

export const setCachedExpenseRecords = (userId, records) => {
  const key = getExpenseStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.warn("Failed to write cached expense records:", err);
  }
};

// ==========================================
// 2. OFFLINE SYNC QUEUE OPERATIONS
// ==========================================
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

export const addToPendingQueue = (userId, operation) => {
  if (!userId) return;
  const key = getPendingSyncKey(userId);
  try {
    const queue = getPendingQueue(userId);
    const filtered = queue.filter((item) => item.id !== operation.id);
    filtered.push(operation);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to add to pending sync queue:", err);
  }
};

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

export const flushPendingSyncQueue = async (userId) => {
  if (!db || !userId || !navigator.onLine) return;
  const queue = getPendingQueue(userId);
  if (queue.length === 0) return;

  for (const op of queue) {
    try {
      const docRef = doc(db, "records", op.id);
      if (op.type === "set") {
        const serverSnap = await getDoc(docRef);
        if (serverSnap.exists()) {
          const serverData = serverSnap.data();
          const serverUpdatedAt = new Date(serverData.updatedAt || serverData.createdAt || 0).getTime();
          const localUpdatedAt = new Date(op.data.updatedAt || op.data.createdAt || 0).getTime();
          if (serverUpdatedAt > localUpdatedAt) {
            removeFromPendingQueue(userId, op.id);
            continue;
          }
        }
        await setDoc(docRef, op.data, { merge: true });
        removeFromPendingQueue(userId, op.id);
      } else if (op.type === "delete") {
        await deleteDoc(docRef);
        removeFromPendingQueue(userId, op.id);
      }
    } catch (err) {
      console.warn(`Pending sync error for records/${op.id}:`, err?.message || err);
    }
  }
};

// ==========================================
// 3. UNIFIED REAL-TIME DATA SYNCHRONIZATION
// ==========================================
/**
 * Single real-time subscription to user's records in Firestore.
 * Automatically parses, sorts, and delivers milk records, income records, and expense records
 * to all logged-in devices simultaneously.
 */
export const subscribeToAllUserData = (
  userId,
  { onMilkUpdate, onIncomeUpdate, onExpenseUpdate },
  onError
) => {
  if (!isFirebaseConfigured || !db || !userId) {
    if (onMilkUpdate) onMilkUpdate(getCachedRecords(userId));
    if (onIncomeUpdate) onIncomeUpdate(getCachedIncomeRecords(userId));
    if (onExpenseUpdate) onExpenseUpdate(getCachedExpenseRecords(userId));
    return () => {};
  }

  // Flush any pending operations first
  flushPendingSyncQueue(userId).catch(() => {});

  const recordsQuery = query(
    collection(db, "records"),
    where("userId", "==", userId)
  );

  let isFirstLoad = true;

  const unsubscribe = onSnapshot(
    recordsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      const milkList = [];
      const incomeList = [];
      const expenseList = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const type = data.recordType;

        if (type === "income") {
          incomeList.push({
            id: docSnap.id,
            ...data,
            amount: Number(data.amount) || 0,
          });
        } else if (type === "expense") {
          expenseList.push({
            id: docSnap.id,
            ...data,
            amount: Number(data.amount) || 0,
          });
        } else {
          // Default: Milk collection record
          milkList.push({
            id: docSnap.id,
            ...data,
            litreQty: Number(data.litreQty) || 0,
            fatPercentage: Number(data.fatPercentage) || 0,
            ratePerLitre: Number(data.ratePerLitre) || 0,
            totalAmount: Number(data.totalAmount) || 0,
          });
        }
      });

      // Sort milk records descending
      milkList.sort((a, b) => {
        const tA = new Date(a.date || a.createdAt || 0).getTime();
        const tB = new Date(b.date || b.createdAt || 0).getTime();
        return tB - tA;
      });

      // Sort incomes descending
      incomeList.sort((a, b) => {
        const tA = new Date((a.date || "") + "T00:00:00").getTime();
        const tB = new Date((b.date || "") + "T00:00:00").getTime();
        if (tB !== tA) return tB - tA;
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });

      // Sort expenses descending
      expenseList.sort((a, b) => {
        const tA = new Date((a.date || "") + "T00:00:00").getTime();
        const tB = new Date((b.date || "") + "T00:00:00").getTime();
        if (tB !== tA) return tB - tA;
        return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
      });

      // Update local storage caches
      setCachedRecords(userId, milkList);
      setCachedIncomeRecords(userId, incomeList);
      setCachedExpenseRecords(userId, expenseList);

      // Dispatch to components
      if (onMilkUpdate) onMilkUpdate(milkList);
      if (onIncomeUpdate) onIncomeUpdate(incomeList);
      if (onExpenseUpdate) onExpenseUpdate(expenseList);

      isFirstLoad = false;
    },
    (error) => {
      console.warn("Real-time data subscription notice:", error?.message || error);
      if (isFirstLoad) {
        if (onMilkUpdate) onMilkUpdate(getCachedRecords(userId));
        if (onIncomeUpdate) onIncomeUpdate(getCachedIncomeRecords(userId));
        if (onExpenseUpdate) onExpenseUpdate(getCachedExpenseRecords(userId));
      }
      if (typeof onError === "function") onError(error);
    }
  );

  return unsubscribe;
};

// ==========================================
// 4. CRUD FOR MILK RECORDS
// ==========================================
export const saveMilkRecord = async (recordData, userId) => {
  const recordId =
    recordData.id || `REC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  const record = {
    ...recordData,
    id: recordId,
    recordType: "milk",
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
      console.warn("Failed to write milk record to Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id: recordId, data: record });
    }
  }

  return record;
};

export const updateMilkRecord = async (id, recordData, userId) => {
  const nowIso = new Date().toISOString();
  const updated = {
    ...recordData,
    id,
    recordType: "milk",
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
      console.warn("Failed to update milk record in Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id, data: updated });
    }
  }

  return updated;
};

export const deleteMilkRecord = async (id, userId) => {
  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Failed to delete milk record from Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "delete", id });
    }
  }
};

// ==========================================
// 5. CRUD FOR INCOME RECORDS
// ==========================================
export const saveIncomeRecord = async (incomeData, userId) => {
  const recordId =
    incomeData.id || `INC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  const record = {
    ...incomeData,
    id: recordId,
    recordType: "income",
    userId: userId || "guest",
    amount: Number(incomeData.amount) || 0,
    date: incomeData.date || nowIso.slice(0, 10),
    category: incomeData.category || "Other Milk Income",
    description: (incomeData.description || "").trim(),
    createdAt: incomeData.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", recordId);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn("Failed to write income to Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id: recordId, data: record });
    }
  }

  return record;
};

export const updateIncomeRecord = async (id, incomeData, userId) => {
  const nowIso = new Date().toISOString();
  const updated = {
    ...incomeData,
    id,
    recordType: "income",
    userId: userId || "guest",
    amount: Number(incomeData.amount) || 0,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn("Failed to update income in Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id, data: updated });
    }
  }

  return updated;
};

export const deleteIncomeRecord = async (id, userId) => {
  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Failed to delete income from Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "delete", id });
    }
  }
};

// ==========================================
// 6. CRUD FOR EXPENSE RECORDS
// ==========================================
export const saveExpenseRecord = async (expenseData, userId) => {
  const recordId =
    expenseData.id || `EXP_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  const record = {
    ...expenseData,
    id: recordId,
    recordType: "expense",
    userId: userId || "guest",
    amount: Number(expenseData.amount) || 0,
    date: expenseData.date || nowIso.slice(0, 10),
    category: expenseData.category || "Milk Purchase",
    description: (expenseData.description || "").trim(),
    createdAt: expenseData.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", recordId);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn("Failed to write expense to Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id: recordId, data: record });
    }
  }

  return record;
};

export const updateExpenseRecord = async (id, expenseData, userId) => {
  const nowIso = new Date().toISOString();
  const updated = {
    ...expenseData,
    id,
    recordType: "expense",
    userId: userId || "guest",
    amount: Number(expenseData.amount) || 0,
    updatedAt: nowIso,
  };

  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn("Failed to update expense in Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "set", id, data: updated });
    }
  }

  return updated;
};

export const deleteExpenseRecord = async (id, userId) => {
  if (userId && db) {
    try {
      const docRef = doc(db, "records", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Failed to delete expense from Firestore; queueing offline:", err);
      addToPendingQueue(userId, { type: "delete", id });
    }
  }
};

// ==========================================
// 7. GUEST RECORDS MIGRATION
// ==========================================
export const migrateGuestRecordsIfAny = async (userId) => {
  if (!userId || !db) return;
  try {
    const recordsQuery = query(
      collection(db, "records"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(recordsQuery);
    const serverIds = new Set(snap.docs.map((d) => d.id));
    const serverReceipts = new Set(snap.docs.map((d) => d.data().receiptNo).filter(Boolean));

    // 1. Milk Records Migration
    const rawMilk = localStorage.getItem("mcms_records");
    if (rawMilk) {
      const guestRecords = JSON.parse(rawMilk);
      if (Array.isArray(guestRecords)) {
        for (const r of guestRecords) {
          if (r.id === "REC_1001" && snap.size > 0) continue;
          if (serverIds.has(r.id) || (r.receiptNo && serverReceipts.has(r.receiptNo))) continue;
          await saveMilkRecord(r, userId);
        }
      }
    }

    // 2. Income Records Migration
    const rawIncome = localStorage.getItem("mcms_income_records");
    if (rawIncome) {
      const guestIncomes = JSON.parse(rawIncome);
      if (Array.isArray(guestIncomes)) {
        for (const inc of guestIncomes) {
          if ((inc.id === "INC_1" || inc.id === "INC_2") && snap.size > 0) continue;
          if (serverIds.has(inc.id)) continue;
          await saveIncomeRecord(inc, userId);
        }
      }
    }

    // 3. Expense Records Migration
    const rawExpenses = localStorage.getItem("mcms_expense_records");
    if (rawExpenses) {
      const guestExpenses = JSON.parse(rawExpenses);
      if (Array.isArray(guestExpenses)) {
        for (const exp of guestExpenses) {
          if ((exp.id === "EXP_1" || exp.id === "EXP_2" || exp.id === "EXP_3") && snap.size > 0) continue;
          if (serverIds.has(exp.id)) continue;
          await saveExpenseRecord(exp, userId);
        }
      }
    }
  } catch (err) {
    console.warn("Guest records migration warning:", err);
  }
};
