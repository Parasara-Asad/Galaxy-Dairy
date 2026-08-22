import React, { useState, useEffect, useRef } from 'react';
import { convertToCSV, exportFile } from '../utils/exportUtils';

// Sub-component to render the Trend Chart
function ProfitChart({ records, incomeRecords, expenseRecords, darkMode }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = [];
    const dates = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(d);
      labels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
    }

    const dailyIncomeData = [];
    const dailyExpenseData = [];
    const dailyProfitData = [];

    dates.forEach(date => {
      const dateStr = date.toISOString().slice(0, 10);
      
      const dailyMilkRevenue = records
        .filter(r => r.date.slice(0, 10) === dateStr)
        .reduce((sum, r) => sum + r.totalAmount, 0);

      const dailyOtherIncome = incomeRecords
        .filter(r => r.date === dateStr)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalIncome = dailyMilkRevenue + dailyOtherIncome;

      const totalExpense = expenseRecords
        .filter(r => r.date === dateStr)
        .reduce((sum, r) => sum + r.amount, 0);

      const dailyProfit = totalIncome - totalExpense;

      dailyIncomeData.push(totalIncome);
      dailyExpenseData.push(totalExpense);
      dailyProfitData.push(dailyProfit);
    });

    const textColor = darkMode ? "#9CA3AF" : "#6b7280";
    const gridColor = darkMode ? "#334155" : "#e5e7eb";
    const legendColor = darkMode ? "#E5E7EB" : "#1f2937";

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (window.Chart) {
      chartInstanceRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Income (₹)",
              data: dailyIncomeData,
              borderColor: "#10b981",
              borderWidth: 2,
              tension: 0.3,
              fill: false
            },
            {
              label: "Expenses (₹)",
              data: dailyExpenseData,
              borderColor: "#ef4444",
              borderWidth: 2,
              tension: 0.3,
              fill: false
            },
            {
              label: "Profit (₹)",
              data: dailyProfitData,
              borderColor: "#3b82f6",
              borderWidth: 2.5,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: legendColor,
                font: { family: "Poppins", size: 10 }
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: "Poppins", size: 9 } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: "Poppins", size: 9 } }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [records, incomeRecords, expenseRecords, darkMode]);

  return (
    <div style={{ position: "relative", height: "220px", width: "100%" }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

// Helpers
function getPeriodDates(period, customStart = "", customEnd = "") {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (period === "current-week") {
    const currentDay = now.getDay();
    const distance = currentDay === 0 ? -6 : 1 - currentDay;
    start.setDate(now.getDate() + distance);
    start.setHours(0, 0, 0, 0);
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "previous-week") {
    const currentDay = now.getDay();
    const distance = (currentDay === 0 ? -6 : 1 - currentDay) - 7;
    start.setDate(now.getDate() + distance);
    start.setHours(0, 0, 0, 0);
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "last-7-days") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "custom") {
    if (customStart) start = new Date(customStart + "T00:00:00");
    else start = new Date(0);
    if (customEnd) end = new Date(customEnd + "T23:59:59");
    else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
  }
  return { start, end };
}

function getMetricsForPeriod(records, incomeRecords, expenseRecords, start, end) {
  const periodRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= start && d <= end;
  });
  const milkRevenue = periodRecords.reduce((total, r) => total + r.totalAmount, 0);

  const periodIncome = incomeRecords.filter(r => {
    const d = new Date(r.date + "T00:00:00");
    return d >= start && d <= end;
  });
  const otherIncome = periodIncome.reduce((total, r) => total + r.amount, 0);

  const periodExpense = expenseRecords.filter(r => {
    const d = new Date(r.date + "T00:00:00");
    return d >= start && d <= end;
  });
  
  const milkPurchaseCost = periodExpense
    .filter(r => r.category === "Milk Purchase")
    .reduce((total, r) => total + r.amount, 0);
    
  const otherExpenses = periodExpense
    .filter(r => r.category !== "Milk Purchase")
    .reduce((total, r) => total + r.amount, 0);

  const totalIncome = milkRevenue + otherIncome;
  const totalExpenses = milkPurchaseCost + otherExpenses;
  const netProfit = totalIncome - totalExpenses;

  return {
    milkRevenue,
    otherIncome,
    totalIncome,
    milkPurchaseCost,
    otherExpenses,
    totalExpenses,
    netProfit
  };
}

function ProfitLossView({ 
  records, 
  incomeRecords, 
  expenseRecords, 
  darkMode,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  triggerToast,
  showLoading,
  onlyLedger = false // Sub-screen routing parameter
}) {
  const formsCardRef = useRef(null);

  // Forms states
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().slice(0, 10));
  const [incomeCategory, setIncomeCategory] = useState('Other Milk Income');
  const [editIncomeId, setEditIncomeId] = useState(null);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseCategory, setExpenseCategory] = useState('Milk Purchase');
  const [editExpenseId, setEditExpenseId] = useState(null);

  // P&L Period Selectors
  const [weeklyPeriod, setWeeklyPeriod] = useState('current-week');
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklyEndDate, setWeeklyEndDate] = useState('');

  // Ledger Filter states
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const last7DaysStart = new Date();
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);
    setWeeklyStartDate(last7DaysStart.toISOString().slice(0, 10));
    setWeeklyEndDate(todayStr);
  }, []);

  const totalMilkRevenue = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const milkPurchaseCost = expenseRecords
    .filter(r => r.category === "Milk Purchase")
    .reduce((sum, r) => sum + r.amount, 0);
  const otherIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalMilkRevenue + otherIncome - totalExpenses;

  const { start: wStart, end: wEnd } = getPeriodDates(weeklyPeriod, weeklyStartDate, weeklyEndDate);
  const wMetrics = getMetricsForPeriod(records, incomeRecords, expenseRecords, wStart, wEnd);

  const clearIncomeForm = () => {
    setIncomeDesc('');
    setIncomeAmount('');
    setIncomeCategory('Other Milk Income');
    setIncomeDate(new Date().toISOString().slice(0, 10));
    setEditIncomeId(null);
  };

  const clearExpenseForm = () => {
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseCategory('Milk Purchase');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setEditExpenseId(null);
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(incomeAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast("Please enter a valid income amount.", "warning");
      return;
    }
    showLoading(true);
    setTimeout(() => {
      const data = { description: incomeDesc.trim(), amount: amt, date: incomeDate, category: incomeCategory };
      if (editIncomeId) {
        onUpdateIncome(editIncomeId, data);
        triggerToast("Income transaction updated!", "success");
      } else {
        onAddIncome(data);
        triggerToast("Income transaction saved!", "success");
      }
      clearIncomeForm();
      showLoading(false);
    }, 200);
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      triggerToast("Please enter a valid expense amount.", "warning");
      return;
    }
    showLoading(true);
    setTimeout(() => {
      const data = { description: expenseDesc.trim(), amount: amt, date: expenseDate, category: expenseCategory };
      if (editExpenseId) {
        onUpdateExpense(editExpenseId, data);
        triggerToast("Expense transaction updated!", "success");
      } else {
        onAddExpense(data);
        triggerToast("Expense transaction saved!", "success");
      }
      clearExpenseForm();
      showLoading(false);
    }, 200);
  };

  const handleEdit = (tx) => {
    if (tx.type === 'income') {
      setEditIncomeId(tx.id);
      setIncomeDesc(tx.description);
      setIncomeAmount(tx.amount.toString());
      setIncomeDate(tx.date);
      setIncomeCategory(tx.category);
    } else {
      setEditExpenseId(tx.id);
      setExpenseDesc(tx.description);
      setExpenseAmount(tx.amount.toString());
      setExpenseDate(tx.date);
      setExpenseCategory(tx.category);
    }
    if (formsCardRef.current) {
      formsCardRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDelete = (id, type) => {
    if (confirm(`Are you sure you want to delete this ${type} transaction?`)) {
      if (type === 'income') onDeleteIncome(id);
      else onDeleteExpense(id);
      triggerToast("Transaction deleted.", "danger");
    }
  };

  // Compile Ledger Transaction list
  const allTransactions = [
    ...incomeRecords.map(r => ({ ...r, type: 'income' })),
    ...expenseRecords.map(r => ({ ...r, type: 'expense' }))
  ];

  allTransactions.sort((a, b) => {
    const diff = new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00");
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });

  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = !filterSearch || tx.description.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesType = (filterType === 'ALL') || (tx.type === filterType);
    const matchesCat = (filterCategory === 'ALL') || (tx.category === filterCategory);
    let matchesDate = true;
    if (filterFromDate) matchesDate = matchesDate && (tx.date >= filterFromDate);
    if (filterToDate) matchesDate = matchesDate && (tx.date <= filterToDate);
    return matchesSearch && matchesType && matchesCat && matchesDate;
  });

  const resetFilters = () => {
    setFilterSearch('');
    setFilterType('ALL');
    setFilterCategory('ALL');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const exportLedgerToExcel = async () => {
    if (filteredTransactions.length === 0) {
      triggerToast("No ledger records available to export.", "warning");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount (INR)"
    ];

    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.date),
      tx.type === 'income' ? 'Income' : 'Expense',
      tx.category,
      tx.description,
      tx.amount
    ]);

    const csvContent = convertToCSV(headers, rows);
    const filename = `Financial_Ledger_Export_${Date.now()}.csv`;

    triggerToast("Generating Excel file...", "primary");
    const result = await exportFile(filename, csvContent);
    if (result.success) {
      if (result.native) {
        triggerToast("Saved to storage and opened share sheet!", "success");
      } else {
        triggerToast("Ledger CSV downloaded successfully!", "success");
      }
    } else {
      triggerToast("Failed to download Excel file.", "danger");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="profit-loss-mobile">
      {/* 1. Normal View (P&L Dashboard + Chart) */}
      {!onlyLedger && (
        <>
          <div className="mb-3 text-dark">
            <h4 className="fw-bold mb-1">Financial Overview</h4>
            <p className="text-muted small">Analyze revenues, operational costs, and profit margin balances.</p>
          </div>

          {/* Indicators cards */}
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-3">
              <div className="card border-0 p-3 h-100 rounded-4">
                <span className="small-text text-muted fw-semibold">Milk Sales</span>
                <h4 className="fw-bold text-primary mb-0 mt-1">₹{totalMilkRevenue.toFixed(0)}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 p-3 h-100 rounded-4">
                <span className="small-text text-muted fw-semibold">Other Revenue</span>
                <h4 className="fw-bold text-success mb-0 mt-1">₹{otherIncome.toFixed(0)}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 p-3 h-100 rounded-4">
                <span className="small-text text-muted fw-semibold">Total Expenses</span>
                <h4 className="fw-bold text-warning mb-0 mt-1">₹{totalExpenses.toFixed(0)}</h4>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className={`card border-0 p-3 h-100 rounded-4 border-start border-4 ${netProfit >= 0 ? 'border-success' : 'border-danger'}`}>
                <span className="small-text text-muted fw-semibold">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</span>
                <h4 className={`fw-bold mb-0 mt-1 ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{netProfit.toFixed(0)}
                </h4>
              </div>
            </div>
          </div>

          {/* Interactive Report Card */}
          <div className="card border-0 p-3 mb-4 rounded-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-dark">Period Report</h6>
              <div className="period-tab-container m-0">
                <button className={`period-tab-btn ${weeklyPeriod === 'current-week' ? 'active' : ''}`} onClick={() => setWeeklyPeriod('current-week')}>Week</button>
                <button className={`period-tab-btn ${weeklyPeriod === 'last-7-days' ? 'active' : ''}`} onClick={() => setWeeklyPeriod('last-7-days')}>7 Days</button>
                <button className={`period-tab-btn ${weeklyPeriod === 'custom' ? 'active' : ''}`} onClick={() => setWeeklyPeriod('custom')}>Custom</button>
              </div>
            </div>

            {weeklyPeriod === 'custom' && (
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <input type="date" className="form-control form-control-sm" value={weeklyStartDate} onChange={(e) => setWeeklyStartDate(e.target.value)} />
                </div>
                <div className="col-6">
                  <input type="date" className="form-control form-control-sm" value={weeklyEndDate} onChange={(e) => setWeeklyEndDate(e.target.value)} />
                </div>
              </div>
            )}

            <div className="row g-3 text-dark">
              <div className="col-6 border-end pe-3">
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-secondary">Milk Revenue</span>
                  <strong>₹{wMetrics.milkRevenue.toFixed(0)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-secondary">Other Income</span>
                  <strong>₹{wMetrics.otherIncome.toFixed(0)}</strong>
                </div>
                <div className="d-flex justify-content-between border-top pt-1 fw-bold text-success small">
                  <span>Total Income</span>
                  <span>₹{wMetrics.totalIncome.toFixed(0)}</span>
                </div>
              </div>
              <div className="col-6 ps-3">
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-secondary">Milk Cost</span>
                  <strong>₹{wMetrics.milkPurchaseCost.toFixed(0)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-secondary">Other Expense</span>
                  <strong>₹{wMetrics.otherExpenses.toFixed(0)}</strong>
                </div>
                <div className="d-flex justify-content-between border-top pt-1 fw-bold text-danger small">
                  <span>Total Expense</span>
                  <span>₹{wMetrics.totalExpenses.toFixed(0)}</span>
                </div>
              </div>
              <div className="col-12 mt-2">
                <div className={`alert text-center fw-bold py-2 mb-0 rounded-pill small ${wMetrics.netProfit >= 0 ? 'alert-success' : 'alert-danger'}`}>
                  Net Balance: ₹{wMetrics.netProfit.toFixed(0)} {wMetrics.netProfit >= 0 ? 'Profit' : 'Loss'}
                </div>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="card border-0 p-3 mb-4 rounded-4 shadow-sm">
            <h6 className="fw-bold mb-3 text-dark">P&L Trend (Last 6 Days)</h6>
            <ProfitChart records={records} incomeRecords={incomeRecords} expenseRecords={expenseRecords} darkMode={darkMode} />
          </div>

          {/* Double form Transaction registries */}
          <div className="card border-0 p-3 mb-4 rounded-4 shadow-sm" ref={formsCardRef} id="profitFormsCard">
            <div className="form-section-title mt-0">Record Income</div>
            <form onSubmit={handleIncomeSubmit} className="mb-4">
              <div className="row g-2">
                <div className="col-12">
                  <input type="text" className="form-control form-control-sm" placeholder="Income details (Optional)" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} />
                </div>
                <div className="col-6">
                  <input type="number" step="0.01" min="0.01" className="form-control form-control-sm" placeholder="Amount (₹)" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} inputMode="decimal" required />
                </div>
                <div className="col-6">
                  <input type="date" className="form-control form-control-sm" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} required />
                </div>
                <div className="col-12 col-sm-6">
                  <select className="form-select form-select-sm" value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)}>
                    <option value="Other Milk Income">Other Milk Income</option>
                    <option value="Product Sales">Product Sales</option>
                    <option value="Subsidy">Subsidy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-12 d-flex gap-2 mt-2">
                  <button type="submit" className="btn btn-success flex-fill rounded-pill py-2 small">
                    <i className="bi bi-plus-circle"></i> {editIncomeId ? "Update Income" : "Add Income"}
                  </button>
                  <button type="button" className="btn btn-secondary px-3 rounded-pill" onClick={clearIncomeForm}>Clear</button>
                </div>
              </div>
            </form>

            <div className="form-section-title">Record Expense</div>
            <form onSubmit={handleExpenseSubmit}>
              <div className="row g-2">
                <div className="col-12">
                  <input type="text" className="form-control form-control-sm" placeholder="Expense details (Optional)" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
                </div>
                <div className="col-6">
                  <input type="number" step="0.01" min="0.01" className="form-control form-control-sm" placeholder="Amount (₹)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} inputMode="decimal" required />
                </div>
                <div className="col-6">
                  <input type="date" className="form-control form-control-sm" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                </div>
                <div className="col-12 col-sm-6">
                  <select className="form-select form-select-sm" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                    <option value="Milk Purchase">Milk Purchase</option>
                    <option value="Transport">Transport</option>
                    <option value="Worker Salary">Worker Salary</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Animal Feed">Animal Feed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-12 d-flex gap-2 mt-2">
                  <button type="submit" className="btn btn-danger flex-fill rounded-pill py-2 small">
                    <i className="bi bi-dash-circle"></i> {editExpenseId ? "Update Expense" : "Add Expense"}
                  </button>
                  <button type="button" className="btn btn-secondary px-3 rounded-pill" onClick={clearExpenseForm}>Clear</button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* 2. Sub-Screen Mode (Financial Transaction Ledger & Filters) */}
      {(onlyLedger || !onlyLedger) && (
        <div className={onlyLedger ? "" : "mt-4"}>
          <div className="d-flex justify-content-between align-items-center mb-3 text-dark">
            <div>
              <h5 className="fw-bold mb-1">Financial Ledger logs</h5>
              <p className="text-muted small mb-0">Search and review cooperative income/expense items.</p>
            </div>
            <button 
              className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1"
              onClick={exportLedgerToExcel}
            >
              <i className="bi bi-file-earmark-excel-fill"></i>
              <span>Excel</span>
            </button>
          </div>

          {/* Ledger filters card */}
          <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
            <div className="row g-2">
              <div className="col-12">
                <input type="text" className="form-control form-control-sm" placeholder="Search description..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
              </div>
              <div className="col-6">
                <select className="form-select form-select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="col-6">
                <select className="form-select form-select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  <option value="Milk Purchase">Milk Purchase</option>
                  <option value="Product Sales">Product Sales</option>
                  <option value="Transport">Transport</option>
                  <option value="Worker Salary">Worker Salary</option>
                  <option value="Subsidy">Subsidy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-6">
                <input
                  type={filterFromDate ? "date" : "text"}
                  placeholder="From Date"
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  className="form-control form-control-sm"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                />
              </div>
              <div className="col-6">
                <input
                  type={filterToDate ? "date" : "text"}
                  placeholder="To Date"
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  className="form-control form-control-sm"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-sm btn-outline-secondary w-100 rounded-pill mt-1" onClick={resetFilters}>Reset Filters</button>
              </div>
            </div>
          </div>

          {/* Transaction Cards List */}
          <div className="ledger-stack">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <span>No ledger items recorded.</span>
              </div>
            ) : (
              filteredTransactions.map(tx => {
                const isInc = tx.type === 'income';
                return (
                  <div key={tx.id} className="record-card border p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge ${isInc ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {isInc ? 'Income' : 'Expense'}
                      </span>
                      <span className="text-muted small-text">{formatDate(tx.date)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-baseline mt-1">
                      <h6 className="fw-bold mb-0 text-dark">{tx.description}</h6>
                      <strong className={`fs-6 ${isInc ? 'text-success' : 'text-danger'}`}>
                        {isInc ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                      <span className="badge bg-secondary-subtle text-secondary small-text">{tx.category}</span>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-sm btn-outline-secondary py-1" onClick={() => handleEdit(tx)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger py-1" onClick={() => handleDelete(tx.id, tx.type)}><i className="bi bi-trash"></i></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfitLossView;
