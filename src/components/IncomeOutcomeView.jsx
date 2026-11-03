import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notoGujaratiB64 } from '../assets/notoGujaratiFont';
import { notoSansB64 } from '../assets/notoSansFont';

function IncomeOutcomeView({ records = [], incomeRecords = [], expenseRecords = [], triggerToast }) {
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'income' | 'outcome'
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // 1. Normalize all Income and Outcome records
  const allIncome = useMemo(() => {
    const milk = records.map(r => ({
      id: r.id || `milk_${r.receiptNo || Math.random()}`,
      type: 'income',
      category: 'Milk Revenue',
      description: r.farmerName ? `${r.farmerName} (${r.litreQty ?? 0}L)` : 'Milk Collection',
      amount: Number(r.totalAmount) || 0,
      date: (r.date || '').slice(0, 10),
    }));

    const other = incomeRecords.map(r => ({
      id: r.id,
      type: 'income',
      category: r.category || 'Other Income',
      description: r.description || '',
      amount: Number(r.amount) || 0,
      date: (r.date || '').slice(0, 10),
    }));

    return [...milk, ...other];
  }, [records, incomeRecords]);

  const allOutcome = useMemo(() => {
    return expenseRecords.map(r => ({
      id: r.id,
      type: 'outcome',
      category: r.category || 'Expense',
      description: r.description || '',
      amount: Number(r.amount) || 0,
      date: (r.date || '').slice(0, 10),
    }));
  }, [expenseRecords]);

  // Overall Totals (unfiltered)
  const totalIncomeAmt = useMemo(() => allIncome.reduce((s, r) => s + r.amount, 0), [allIncome]);
  const totalOutcomeAmt = useMemo(() => allOutcome.reduce((s, r) => s + r.amount, 0), [allOutcome]);
  const netBalance = totalIncomeAmt - totalOutcomeAmt;

  // Combined and sorted list for display
  const combinedList = useMemo(() => {
    const combined = [...allIncome, ...allOutcome];
    return combined.sort((a, b) => {
      const diff = new Date(b.date + "T00:00:00") - new Date(a.date + "T00:00:00");
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [allIncome, allOutcome]);

  // Filtered list based on search/type/dates
  const filteredList = useMemo(() => {
    return combinedList.filter(item => {
      const q = filterSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        item.description.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q);
      
      const matchesType = (filterType === 'ALL') || (item.type === filterType);
      
      let matchesDate = true;
      if (filterFromDate) matchesDate = matchesDate && (item.date >= filterFromDate);
      if (filterToDate) matchesDate = matchesDate && (item.date <= filterToDate);

      return matchesSearch && matchesType && matchesDate;
    });
  }, [combinedList, filterSearch, filterType, filterFromDate, filterToDate]);

  const resetFilters = () => {
    setFilterSearch('');
    setFilterType('ALL');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── PDF Export Function ──────────────────────────────────────────────────
  const exportPDF = () => {
    if (triggerToast) triggerToast('Generating PDF…', 'primary');

    const GUJARATI_FONT = 'NotoGujarati';
    const SANS_FONT = 'NotoSans';
    const GUJARATI_RE = /[\u0A80-\u0AFF]/;
    const fontFor = (text) => GUJARATI_RE.test(String(text ?? '')) ? GUJARATI_FONT : SANS_FONT;

    const safeDate = (raw) => {
      if (!raw) return '—';
      const s = String(raw).trim();
      const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) {
        const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
        if (!isNaN(d)) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const d = new Date(s);
      if (!isNaN(d)) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return s;
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Register Unicode fonts
    try {
      doc.addFileToVFS('NotoSansGujarati-Regular.ttf', notoGujaratiB64);
      doc.addFont('NotoSansGujarati-Regular.ttf', GUJARATI_FONT, 'normal');
      doc.addFileToVFS('NotoSans-Regular.ttf', notoSansB64);
      doc.addFont('NotoSans-Regular.ttf', SANS_FONT, 'normal');
    } catch (e) {
      console.warn('Font loading error in jsPDF:', e);
    }

    const drawHeader = (title, color) => {
      doc.setFillColor(...color);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(SANS_FONT, 'normal');
      doc.text('Galaxy Dairy', margin, 11);
      doc.setFontSize(10);
      doc.text(title, margin, 20);
      doc.setFontSize(8);
      doc.text(`Generated: ${now}`, pageW - margin, 20, { align: 'right' });
      doc.setTextColor(30, 30, 30);
    };

    const drawTotalBar = (label, value, color, y) => {
      doc.setFillColor(...color);
      doc.roundedRect(margin, y, pageW - margin * 2, 11, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(SANS_FONT, 'normal');
      doc.text(label, margin + 4, y + 7.5);
      doc.text(value, pageW - margin - 2, y + 7.5, { align: 'right' });
    };

    const addPageNumbers = () => {
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont(SANS_FONT, 'normal');
        doc.text(`Page ${i} of ${total}`, pageW / 2, pageH - 5, { align: 'center' });
      }
    };

    const columns = ['Date', 'Category', 'Description', 'Amount'];
    const baseStyles = {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      overflow: 'linebreak',
      font: SANS_FONT,
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      minCellHeight: 8,
    };
    const colDefs = {
      0: { cellWidth: 26, valign: 'top' },
      1: { cellWidth: 38, valign: 'top' },
      2: { cellWidth: 86, valign: 'top', overflow: 'linebreak' },
      3: { cellWidth: 32, halign: 'right', valign: 'top' },
    };

    const willDrawCell = (data) => {
      if (data.section === 'head') return;
      const text = String(data.cell.raw ?? '');
      data.cell.styles.font = fontFor(text);
    };

    // ── PAGE 1+ : ALL INCOME ──────────────────────────────────────────────
    drawHeader('All Income Report', [20, 83, 45]);

    const incomeRows = allIncome.length > 0
      ? allIncome.map(r => [safeDate(r.date), r.category, r.description, fmtCurrency(r.amount)])
      : [['—', '—', 'No income records available.', '—']];

    autoTable(doc, {
      startY: 32,
      tableWidth: 'fixed',
      head: [columns],
      body: incomeRows,
      margin: { left: margin, right: margin },
      styles: baseStyles,
      headStyles: {
        fillColor: [20, 83, 45], textColor: 255,
        fontStyle: 'bold', font: SANS_FONT, fontSize: 9,
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: colDefs,
      willDrawCell,
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader('All Income Report (cont.)', [20, 83, 45]);
      },
    });

    drawTotalBar('Total Income:', fmtCurrency(totalIncomeAmt), [20, 83, 45], doc.lastAutoTable.finalY + 5);

    // ── PAGE 2+ : ALL OUTCOME ─────────────────────────────────────────────
    doc.addPage();
    drawHeader('All Outcome (Expense) Report', [153, 27, 27]);

    const outcomeRows = allOutcome.length > 0
      ? allOutcome.map(r => [safeDate(r.date), r.category, r.description, fmtCurrency(r.amount)])
      : [['—', '—', 'No outcome records available.', '—']];

    autoTable(doc, {
      startY: 32,
      tableWidth: 'fixed',
      head: [columns],
      body: outcomeRows,
      margin: { left: margin, right: margin },
      styles: baseStyles,
      headStyles: {
        fillColor: [153, 27, 27], textColor: 255,
        fontStyle: 'bold', font: SANS_FONT, fontSize: 9,
      },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      columnStyles: colDefs,
      willDrawCell,
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader('All Outcome Report (cont.)', [153, 27, 27]);
      },
    });

    drawTotalBar('Total Outcome:', fmtCurrency(totalOutcomeAmt), [153, 27, 27], doc.lastAutoTable.finalY + 5);

    // Net Summary on Final Page
    const netY = doc.lastAutoTable.finalY + 20;
    if (netY < pageH - 25) {
      const netColor = netBalance >= 0 ? [22, 101, 52] : [185, 28, 28];
      const netLabel = netBalance >= 0 ? 'Net Profit Balance:' : 'Net Deficit Balance:';
      drawTotalBar(netLabel, fmtCurrency(Math.abs(netBalance)), netColor, netY);
    }

    addPageNumbers();
    doc.save('Galaxy-Dairy-Income-Outcome-Report.pdf');
    if (triggerToast) triggerToast('PDF downloaded successfully!', 'success');
  };

  return (
    <div className="income-outcome-view">
      {/* Header with Title and PDF Download Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Income & Outcome</h4>
          <p className="text-muted small mb-0">View all income & outcome transactions and download PDF report</p>
        </div>
        <button
          className="btn btn-danger rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
          onClick={exportPDF}
        >
          <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
          <span className="fw-semibold">Download PDF</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="row g-2 mb-3">
        <div className="col-4">
          <div className="card border-0 p-3 h-100 rounded-4 shadow-sm bg-success-subtle">
            <span className="small text-muted fw-semibold d-block">Total Income</span>
            <strong className="fs-5 text-success">{fmtCurrency(totalIncomeAmt)}</strong>
            <span className="small text-muted mt-1">{allIncome.length} entries</span>
          </div>
        </div>

        <div className="col-4">
          <div className="card border-0 p-3 h-100 rounded-4 shadow-sm bg-danger-subtle">
            <span className="small text-muted fw-semibold d-block">Total Outcome</span>
            <strong className="fs-5 text-danger">{fmtCurrency(totalOutcomeAmt)}</strong>
            <span className="small text-muted mt-1">{allOutcome.length} entries</span>
          </div>
        </div>

        <div className="col-4">
          <div className={`card border-0 p-3 h-100 rounded-4 shadow-sm ${netBalance >= 0 ? 'bg-primary-subtle' : 'bg-warning-subtle'}`}>
            <span className="small text-muted fw-semibold d-block">Net Balance</span>
            <strong className={`fs-5 ${netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
              {netBalance >= 0 ? '+' : ''}{fmtCurrency(netBalance)}
            </strong>
            <span className="small text-muted mt-1">{netBalance >= 0 ? 'Surplus' : 'Deficit'}</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search description, category, farmer..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>

          <div className="col-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="income">Income Only</option>
              <option value="outcome">Outcome Only</option>
            </select>
          </div>

          <div className="col-4 col-md-3">
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              placeholder="From Date"
            />
          </div>

          <div className="col-4 col-md-3">
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              placeholder="To Date"
            />
          </div>

          {(filterSearch || filterType !== 'ALL' || filterFromDate || filterToDate) && (
            <div className="col-12">
              <button
                className="btn btn-sm btn-outline-secondary w-100 rounded-pill"
                onClick={resetFilters}
              >
                Reset Filters ({filteredList.length} shown)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Records Stack List */}
      <div className="records-stack">
        {filteredList.length === 0 ? (
          <div className="card border-0 p-5 rounded-4 shadow-sm text-center text-muted">
            <i className="bi bi-inbox fs-1 mb-2 opacity-50"></i>
            <p className="mb-0">No income or outcome transactions found.</p>
          </div>
        ) : (
          filteredList.map(item => {
            const isInc = item.type === 'income';
            return (
              <div key={item.id} className="card border-0 p-3 mb-2 rounded-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className={`badge ${isInc ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-2 py-1`}>
                    <i className={`bi ${isInc ? 'bi-arrow-down-left-circle-fill' : 'bi-arrow-up-right-circle-fill'} me-1`}></i>
                    {isInc ? 'Income' : 'Outcome'}
                  </span>
                  <span className="text-muted small">{formatDate(item.date)}</span>
                </div>

                <div className="d-flex justify-content-between align-items-baseline mt-1">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{item.description || item.category}</h6>
                    <span className="badge bg-light text-secondary border small-text mt-1">{item.category}</span>
                  </div>
                  <strong className={`fs-5 ${isInc ? 'text-success' : 'text-danger'}`}>
                    {isInc ? '+' : '-'} {fmtCurrency(item.amount)}
                  </strong>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default IncomeOutcomeView;
