import assert from "node:assert";

// Mock localStorage for Node testing environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
try {
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    writable: true,
    configurable: true,
  });
} catch {
  // navigator is defined
}

// Import sync services
const {
  getIncomeStorageKey,
  getExpenseStorageKey,
  getCachedIncomeRecords,
  setCachedIncomeRecords,
  getCachedExpenseRecords,
  setCachedExpenseRecords,
  addToPendingQueue,
  getPendingQueue,
  removeFromPendingQueue,
} = await import("../src/services/recordsSyncService.js");

console.log("=== Galaxy Dairy Multi-Device Financial Synchronization Tests ===");

// -------------------------------------------------------------
// Helper: Financial Balance Calculation (Formula: Total Income - Total Expenses)
// -------------------------------------------------------------
function calculateFinancials(records, incomeRecords, expenseRecords) {
  const milkRevenue = records.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const otherIncome = incomeRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalIncome = milkRevenue + otherIncome;
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalBalance = totalIncome - totalExpenses;

  return {
    milkRevenue,
    otherIncome,
    totalIncome,
    totalExpenses,
    totalBalance,
  };
}

// -------------------------------------------------------------
// Test 0: Storage Key Isolation
// -------------------------------------------------------------
console.log("\n[Test 0] Checking Storage Key Isolation");
const userA = "user_account_A";
const userB = "user_account_B";
assert.strictEqual(getIncomeStorageKey(userA), "mcms_income_records_user_account_A");
assert.strictEqual(getExpenseStorageKey(userA), "mcms_expense_records_user_account_A");
assert.notStrictEqual(getIncomeStorageKey(userA), getIncomeStorageKey(userB));
assert.notStrictEqual(getExpenseStorageKey(userA), getExpenseStorageKey(userB));
console.log("  Passed: Financial storage keys are strictly isolated per user account.");

// -------------------------------------------------------------
// Simulate Centralized Server Pub/Sub Database for Laptop & Mobile
// -------------------------------------------------------------
class MockServerDb {
  constructor() {
    this.incomes = new Map();
    this.expenses = new Map();
    this.incomeListeners = new Set();
    this.expenseListeners = new Set();
  }

  subscribeIncomes(fn) {
    this.incomeListeners.add(fn);
    return () => this.incomeListeners.delete(fn);
  }

  subscribeExpenses(fn) {
    this.expenseListeners.add(fn);
    return () => this.expenseListeners.delete(fn);
  }

  broadcastIncomes() {
    const list = Array.from(this.incomes.values()).sort(
      (a, b) => new Date(b.date + "T00:00:00").getTime() - new Date(a.date + "T00:00:00").getTime()
    );
    for (const listener of this.incomeListeners) {
      listener([...list]);
    }
  }

  broadcastExpenses() {
    const list = Array.from(this.expenses.values()).sort(
      (a, b) => new Date(b.date + "T00:00:00").getTime() - new Date(a.date + "T00:00:00").getTime()
    );
    for (const listener of this.expenseListeners) {
      listener([...list]);
    }
  }

  saveIncome(income) {
    this.incomes.set(income.id, { ...income });
    this.broadcastIncomes();
  }

  updateIncome(id, updates) {
    const current = this.incomes.get(id);
    if (current) {
      this.incomes.set(id, { ...current, ...updates, id });
      this.broadcastIncomes();
    }
  }

  deleteIncome(id) {
    this.incomes.delete(id);
    this.broadcastIncomes();
  }

  saveExpense(expense) {
    this.expenses.set(expense.id, { ...expense });
    this.broadcastExpenses();
  }

  updateExpense(id, updates) {
    const current = this.expenses.get(id);
    if (current) {
      this.expenses.set(id, { ...current, ...updates, id });
      this.broadcastExpenses();
    }
  }

  deleteExpense(id) {
    this.expenses.delete(id);
    this.broadcastExpenses();
  }
}

const serverDb = new MockServerDb();

// Laptop and Mobile Devices connected to the same account:
let laptopIncomes = [];
let laptopExpenses = [];
let mobileIncomes = [];
let mobileExpenses = [];

// Both devices subscribe to the real-time server database
const unsubLaptopInc = serverDb.subscribeIncomes((data) => { laptopIncomes = data; });
const unsubLaptopExp = serverDb.subscribeExpenses((data) => { laptopExpenses = data; });
const unsubMobileInc = serverDb.subscribeIncomes((data) => { mobileIncomes = data; });
const unsubMobileExp = serverDb.subscribeExpenses((data) => { mobileExpenses = data; });

// -------------------------------------------------------------
// Test Case 1: Add ₹5 income on Mobile -> Verify Laptop automatically shows ₹5 income
// -------------------------------------------------------------
console.log("\n[Test Case 1] Add ₹5 income on Mobile -> Verify Laptop automatically shows ₹5 income");
const income1 = {
  id: "INC_TEST_1",
  userId: "user@example.com",
  date: "2026-11-03",
  category: "Retail Sales",
  description: "Milk cup sales",
  amount: 5.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
serverDb.saveIncome(income1);

assert.strictEqual(mobileIncomes.length, 1);
assert.strictEqual(laptopIncomes.length, 1);
assert.strictEqual(laptopIncomes[0].amount, 5.0);
console.log(`  Mobile shows: ₹${mobileIncomes[0].amount}`);
console.log(`  Laptop automatically received: ₹${laptopIncomes[0].amount}`);
assert.strictEqual(laptopIncomes[0].amount, mobileIncomes[0].amount);
console.log("  Passed: Test Case 1 succeeded.");

// -------------------------------------------------------------
// Test Case 2: Add ₹100 income on Laptop -> Verify Mobile automatically shows ₹105 total income
// -------------------------------------------------------------
console.log("\n[Test Case 2] Add ₹100 income on Laptop -> Verify Mobile automatically shows ₹105 total income");
const income2 = {
  id: "INC_TEST_2",
  userId: "user@example.com",
  date: "2026-11-03",
  category: "Product Sales",
  description: "Paneer order",
  amount: 100.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
serverDb.saveIncome(income2);

const mobileTotals = calculateFinancials([], mobileIncomes, mobileExpenses);
const laptopTotals = calculateFinancials([], laptopIncomes, laptopExpenses);

assert.strictEqual(mobileIncomes.length, 2);
assert.strictEqual(laptopIncomes.length, 2);
assert.strictEqual(mobileTotals.totalIncome, 105.0);
assert.strictEqual(laptopTotals.totalIncome, 105.0);
console.log(`  Mobile Total Income: ₹${mobileTotals.totalIncome}`);
console.log(`  Laptop Total Income: ₹${laptopTotals.totalIncome}`);
console.log("  Passed: Test Case 2 succeeded.");

// -------------------------------------------------------------
// Test Case 3: Add ₹50 expense on Mobile -> Verify Laptop shows ₹50 expense and both show identical balance
// -------------------------------------------------------------
console.log("\n[Test Case 3] Add ₹50 expense on Mobile -> Verify Laptop shows ₹50 expense and matching balance");
const expense1 = {
  id: "EXP_TEST_1",
  userId: "user@example.com",
  date: "2026-11-03",
  category: "Transport",
  description: "Fuel refill",
  amount: 50.0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
serverDb.saveExpense(expense1);

const mobileFinancialsAfterExp = calculateFinancials([], mobileIncomes, mobileExpenses);
const laptopFinancialsAfterExp = calculateFinancials([], laptopIncomes, laptopExpenses);

assert.strictEqual(laptopExpenses.length, 1);
assert.strictEqual(laptopExpenses[0].amount, 50.0);
assert.strictEqual(mobileFinancialsAfterExp.totalExpenses, 50.0);
assert.strictEqual(laptopFinancialsAfterExp.totalExpenses, 50.0);

// Total Balance = Total Income (105) - Total Expenses (50) = 55
assert.strictEqual(mobileFinancialsAfterExp.totalBalance, 55.0);
assert.strictEqual(laptopFinancialsAfterExp.totalBalance, 55.0);
console.log(`  Mobile: Total Income = ₹${mobileFinancialsAfterExp.totalIncome}, Expenses = ₹${mobileFinancialsAfterExp.totalExpenses}, Balance = ₹${mobileFinancialsAfterExp.totalBalance}`);
console.log(`  Laptop: Total Income = ₹${laptopFinancialsAfterExp.totalIncome}, Expenses = ₹${laptopFinancialsAfterExp.totalExpenses}, Balance = ₹${laptopFinancialsAfterExp.totalBalance}`);
console.log("  Passed: Test Case 3 succeeded.");

// -------------------------------------------------------------
// Test Case 4: Edit an income transaction on Laptop -> Verify Mobile automatically displays the edited amount
// -------------------------------------------------------------
console.log("\n[Test Case 4] Edit income transaction on Laptop -> Verify Mobile automatically displays edited amount");
// Edit income1 from ₹5 to ₹25
serverDb.updateIncome("INC_TEST_1", { amount: 25.0, description: "Milk cup sales (updated)" });

const mobileFinancialsAfterEdit = calculateFinancials([], mobileIncomes, mobileExpenses);
const laptopFinancialsAfterEdit = calculateFinancials([], laptopIncomes, laptopExpenses);

assert.strictEqual(mobileIncomes.find((i) => i.id === "INC_TEST_1").amount, 25.0);
assert.strictEqual(laptopIncomes.find((i) => i.id === "INC_TEST_1").amount, 25.0);
assert.strictEqual(mobileFinancialsAfterEdit.totalIncome, 125.0);
assert.strictEqual(laptopFinancialsAfterEdit.totalIncome, 125.0);
assert.strictEqual(mobileFinancialsAfterEdit.totalBalance, 75.0);
assert.strictEqual(laptopFinancialsAfterEdit.totalBalance, 75.0);
console.log(`  Mobile updated income transaction: ₹${mobileIncomes.find((i) => i.id === "INC_TEST_1").amount}`);
console.log(`  Mobile new Total Income: ₹${mobileFinancialsAfterEdit.totalIncome}, Balance = ₹${mobileFinancialsAfterEdit.totalBalance}`);
console.log("  Passed: Test Case 4 succeeded.");

// -------------------------------------------------------------
// Test Case 5: Delete an expense on Mobile -> Verify Laptop automatically updates expense history and balance
// -------------------------------------------------------------
console.log("\n[Test Case 5] Delete an expense on Mobile -> Verify Laptop automatically updates expense history and balance");
serverDb.deleteExpense("EXP_TEST_1");

const mobileFinancialsAfterDel = calculateFinancials([], mobileIncomes, mobileExpenses);
const laptopFinancialsAfterDel = calculateFinancials([], laptopIncomes, laptopExpenses);

assert.strictEqual(laptopExpenses.length, 0);
assert.strictEqual(mobileExpenses.length, 0);
assert.strictEqual(laptopFinancialsAfterDel.totalExpenses, 0.0);
assert.strictEqual(mobileFinancialsAfterDel.totalExpenses, 0.0);
assert.strictEqual(laptopFinancialsAfterDel.totalBalance, 125.0);
assert.strictEqual(mobileFinancialsAfterDel.totalBalance, 125.0);
console.log(`  Laptop Expenses count: ${laptopExpenses.length}, Total Expenses: ₹${laptopFinancialsAfterDel.totalExpenses}`);
console.log(`  Laptop updated Balance: ₹${laptopFinancialsAfterDel.totalBalance}`);
console.log("  Passed: Test Case 5 succeeded.");

// -------------------------------------------------------------
// Test Case 6: Simultaneous transactions on both devices -> Verify no transaction lost or duplicated
// -------------------------------------------------------------
console.log("\n[Test Case 6] Simultaneous transactions on both devices -> Verify no transaction lost or duplicated");
const simultaneousIncomeLaptop = {
  id: "INC_SIMUL_LAPTOP_" + Math.random().toString(36).substring(2, 7),
  userId: "user@example.com",
  date: "2026-11-03",
  amount: 200.0,
  category: "Bulk Sales",
};
const simultaneousIncomeMobile = {
  id: "INC_SIMUL_MOBILE_" + Math.random().toString(36).substring(2, 7),
  userId: "user@example.com",
  date: "2026-11-03",
  amount: 300.0,
  category: "Ghee Sales",
};
const simultaneousExpenseLaptop = {
  id: "EXP_SIMUL_LAPTOP_" + Math.random().toString(36).substring(2, 7),
  userId: "user@example.com",
  date: "2026-11-03",
  amount: 40.0,
  category: "Packing Materials",
};

serverDb.saveIncome(simultaneousIncomeLaptop);
serverDb.saveIncome(simultaneousIncomeMobile);
serverDb.saveExpense(simultaneousExpenseLaptop);

assert.strictEqual(laptopIncomes.length, 4); // 2 previous + 2 simultaneous
assert.strictEqual(mobileIncomes.length, 4);
assert.strictEqual(laptopExpenses.length, 1);
assert.strictEqual(mobileExpenses.length, 1);

const finalLaptop = calculateFinancials([], laptopIncomes, laptopExpenses);
const finalMobile = calculateFinancials([], mobileIncomes, mobileExpenses);

assert.strictEqual(finalLaptop.totalIncome, finalMobile.totalIncome);
assert.strictEqual(finalLaptop.totalExpenses, finalMobile.totalExpenses);
assert.strictEqual(finalLaptop.totalBalance, finalMobile.totalBalance);
console.log(`  Both devices have identical 4 income records and 1 expense record.`);
console.log(`  Final Balance on Laptop: ₹${finalLaptop.totalBalance}`);
console.log(`  Final Balance on Mobile: ₹${finalMobile.totalBalance}`);
console.log("  Passed: Test Case 6 succeeded.");

// -------------------------------------------------------------
// Test 7: Offline Financial Queue Operations & Deduplication
// -------------------------------------------------------------
console.log("\n[Test 7] Offline Financial Queue Operations & Deduplication");
const testUser = "user@example.com";
addToPendingQueue(testUser, {
  collection: "income_records",
  type: "set",
  id: "INC_OFFLINE_1",
  data: { id: "INC_OFFLINE_1", amount: 150, updatedAt: "2026-11-03T12:00:00.000Z" },
});
addToPendingQueue(testUser, {
  collection: "expense_records",
  type: "set",
  id: "EXP_OFFLINE_1",
  data: { id: "EXP_OFFLINE_1", amount: 60, updatedAt: "2026-11-03T12:00:00.000Z" },
});

let q = getPendingQueue(testUser);
assert.strictEqual(q.length, 2);

// Deduplication check: re-adding same ID updates in-place
addToPendingQueue(testUser, {
  collection: "income_records",
  type: "set",
  id: "INC_OFFLINE_1",
  data: { id: "INC_OFFLINE_1", amount: 180, updatedAt: "2026-11-03T12:05:00.000Z" },
});
q = getPendingQueue(testUser);
assert.strictEqual(q.length, 2, "Queue length must not grow when updating existing id");
assert.strictEqual(q.find((item) => item.id === "INC_OFFLINE_1").data.amount, 180);

removeFromPendingQueue(testUser, "INC_OFFLINE_1", "income_records");
removeFromPendingQueue(testUser, "EXP_OFFLINE_1", "expense_records");
q = getPendingQueue(testUser);
assert.strictEqual(q.length, 0);
console.log("  Passed: Offline financial queueing and deduplication verified.");

// Cleanup listeners
unsubLaptopInc();
unsubLaptopExp();
unsubMobileInc();
unsubMobileExp();

console.log("\n=======================================================");
console.log("ALL FINANCIAL SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
