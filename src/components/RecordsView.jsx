import React, { useState } from 'react';
import { convertToCSV, exportFile } from '../utils/exportUtils';

function RecordsView({ records, onEditRecord, onDeleteRecord, triggerToast }) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filter Logic
  const filtered = records.filter(r => {
    const matchesSearch = !search || 
      r.receiptNo.toLowerCase().includes(search.toLowerCase()) || 
      r.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      r.villageName.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !dateFilter || r.date.startsWith(dateFilter);
    const matchesShift = shiftFilter === 'ALL' || r.milkShift === shiftFilter;

    return matchesSearch && matchesDate && matchesShift;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this collection record?')) {
      onDeleteRecord(id);
      setSelectedRecord(null);
    }
  };

  const handleEdit = (record) => {
    onEditRecord(record);
    setSelectedRecord(null);
  };

  const exportRecordsToExcel = async () => {
    if (filtered.length === 0) {
      triggerToast("No records available to export.", "warning");
      return;
    }

    const headers = [
      "Receipt No",
      "Date",
      "Shift",
      "Milk Type",
      "Farmer Name",
      "Mobile Number",
      "Village",
      "Quantity (Litre)",
      "Fat (%)",
      "SNF (%)",
      "Rate Per Litre (₹)",
      "Total Amount (₹)",
      "Remarks"
    ];

    const rows = filtered.map((r) => [
      r.receiptNo,
      formatDate(r.date),
      r.milkShift,
      r.milkType,
      r.farmerName,
      r.mobileNumber || '',
      r.villageName || '',
      r.litreQty,
      r.fatPercentage,
      r.snfValue || '',
      r.ratePerLitre,
      r.totalAmount,
      r.remarks || ''
    ]);

    const csvContent = convertToCSV(headers, rows);
    const filename = `Milk_Collection_Records_${Date.now()}.csv`;

    triggerToast("Generating Excel file...", "primary");
    const result = await exportFile(filename, csvContent);
    if (result.success) {
      if (result.native) {
        triggerToast("Saved to storage and opened share sheet!", "success");
      } else {
        triggerToast("Excel CSV downloaded successfully!", "success");
      }
    } else {
      triggerToast("Failed to download Excel file.", "danger");
    }
  };

  return (
    <div className="records-mobile-view">
      <div className="d-flex justify-content-between align-items-center mb-3 text-dark">
        <div>
          <h4 className="fw-bold mb-1">Milk Collection Records</h4>
          <p className="text-muted small mb-0">Search and review past cooperative collections.</p>
        </div>
        <button 
          className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1"
          onClick={exportRecordsToExcel}
        >
          <i className="bi bi-file-earmark-excel-fill"></i>
          <span>Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 p-3 mb-3 rounded-4 shadow-sm">
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-secondary"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0"
                placeholder="Search by receipt, farmer, village..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="input-group input-group-sm">
              <input
                type={dateFilter ? "date" : "text"}
                placeholder="Select Date"
                onFocus={(e) => {
                  e.target.type = 'date';
                  try {
                    e.target.showPicker();
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                onClick={(e) => {
                  e.target.type = 'date';
                  try {
                    e.target.showPicker();
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                onKeyDown={(e) => e.preventDefault()}
                inputMode="none"
                className="form-control form-control-sm border-end-0"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <span 
                className="input-group-text border-start-0 text-secondary bg-light"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  if (input) {
                    input.type = 'date';
                    try {
                      input.showPicker();
                    } catch (err) {
                      console.warn(err);
                    }
                  }
                }}
              >
                <i className="bi bi-calendar3"></i>
              </span>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <select
              className="form-select form-select-sm"
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
            >
              <option value="ALL">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Cards Stack */}
      <div className="records-stack">
        {filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-folder2-open fs-1 opacity-50 mb-2 d-block"></i>
            <span>No matching records found.</span>
          </div>
        ) : (
          filtered.map(r => (
            <div 
              key={r.id} 
              className="record-card border"
              onClick={() => setSelectedRecord(r)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-primary-color small text-nowrap">{r.receiptNo}</span>
                <span className="text-muted small-text text-nowrap">{formatDate(r.date).split(',')[0]}</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline mt-1">
                <h6 className="fw-bold mb-0 text-dark">{r.farmerName}</h6>
                <span className="fw-bold fs-5 text-success">₹{r.totalAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-secondary mt-1 small-text">
                <span>{r.litreQty.toFixed(2)} Litres • Fat: {r.fatPercentage.toFixed(1)}%</span>
                <span className={`badge ${r.milkShift === 'Morning' ? 'bg-warning-subtle text-warning' : 'bg-info-subtle text-primary'}`}>
                  {r.milkShift}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Details Bottom Sheet */}
      {selectedRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered bottom-sheet-dialog show">
            <div className="modal-content border-0 shadow-lg bottom-sheet-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-receipt text-primary"></i>
                  <span>Record Details</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedRecord(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="card border p-3 mb-3 bg-light">
                  <div className="row g-2 text-dark">
                    <div className="col-6">
                      <span className="small text-muted d-block">Receipt Number</span>
                      <strong className="text-primary">{selectedRecord.receiptNo}</strong>
                    </div>
                    <div className="col-6">
                      <span className="small text-muted d-block">Collection Date</span>
                      <strong>{formatDate(selectedRecord.date)}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Shift</span>
                      <span className="badge bg-secondary-subtle text-secondary">{selectedRecord.milkShift}</span>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Milk Type</span>
                      <span className="badge bg-primary-subtle text-primary">{selectedRecord.milkType}</span>
                    </div>
                  </div>
                </div>

                <div className="card border p-3 mb-3">
                  <div className="row g-2 text-dark">
                    <div className="col-12">
                      <span className="small text-muted d-block">Farmer</span>
                      <strong>{selectedRecord.farmerName}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Mobile Number</span>
                      <strong>{selectedRecord.mobileNumber || '9876543210'}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Village</span>
                      <strong>{selectedRecord.villageName || 'Anand'}</strong>
                    </div>
                  </div>
                </div>

                <div className="card border p-3 mb-3">
                  <div className="row g-2 text-dark">
                    <div className="col-4">
                      <span className="small text-muted d-block">Quantity</span>
                      <strong className="fs-6">{selectedRecord.litreQty.toFixed(2)} L</strong>
                    </div>
                    <div className="col-4">
                      <span className="small text-muted d-block">Fat %</span>
                      <strong className="fs-6">{selectedRecord.fatPercentage.toFixed(1)}%</strong>
                    </div>
                    <div className="col-4">
                      <span className="small text-muted d-block">SNF %</span>
                      <strong className="fs-6">{selectedRecord.snfValue ? selectedRecord.snfValue.toFixed(1) : '8.5'}%</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Rate/Litre</span>
                      <strong className="fs-6">₹{selectedRecord.ratePerLitre.toFixed(2)}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Total Amount</span>
                      <strong className="fs-5 text-success">₹{selectedRecord.totalAmount.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {selectedRecord.remarks && (
                  <div className="mb-3 text-dark">
                    <span className="small text-muted d-block">Remarks</span>
                    <p className="mb-0 small">{selectedRecord.remarks}</p>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-info text-white rounded-pill flex-fill"
                    onClick={() => handleEdit(selectedRecord)}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Record
                  </button>
                  <button 
                    className="btn btn-danger rounded-pill flex-fill"
                    onClick={() => handleDelete(selectedRecord.id)}
                  >
                    <i className="bi bi-trash me-1"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsView;
