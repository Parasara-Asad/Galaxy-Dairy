import React, { useState } from 'react';

function DashboardView({ records, setCurrentTab, openScanModal }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.date.startsWith(todayStr));
  
  const todayLitre = todayRecords.reduce((acc, r) => acc + r.litreQty, 0);
  const todayAmount = todayRecords.reduce((acc, r) => acc + r.totalAmount, 0);

  const avgFatToday = todayRecords.length > 0
    ? (todayRecords.reduce((acc, r) => acc + r.fatPercentage, 0) / todayRecords.length).toFixed(1)
    : "0.0";

  const avgRateToday = todayLitre > 0 
    ? (todayAmount / todayLitre).toFixed(2)
    : "0.00";

  const recentRecords = records.slice(0, 4);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-mobile">
      {/* Welcome Banner */}
      <div className="mb-4 text-dark">
        <h4 className="fw-bold mb-0">Hello, everyone</h4>
        <p className="text-muted small">Here is today's cooperative collection summary.</p>
      </div>

      {/* 2-Column Responsive Indicators Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="card border-0 p-3 h-100 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-2 text-primary">
              <i className="bi bi-bucket-fill fs-5"></i>
              <span className="small-text fw-semibold uppercase text-secondary">Today's Milk</span>
            </div>
            <h3 className="dash-metric-num text-primary mb-0">{todayLitre.toFixed(1)} L</h3>
            <span className="small-text text-muted mt-1">{todayRecords.length} collections</span>
          </div>
        </div>

        <div className="col-6">
          <div className="card border-0 p-3 h-100 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-2 text-success">
              <i className="bi bi-currency-rupee fs-5"></i>
              <span className="small-text fw-semibold uppercase text-secondary">Today's Pay</span>
            </div>
            <h3 className="dash-metric-num text-success mb-0">₹{todayAmount.toFixed(0)}</h3>
            <span className="small-text text-muted mt-1">Paid to farmers</span>
          </div>
        </div>

        <div className="col-6">
          <div className="card border-0 p-3 h-100 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-2 text-warning">
              <i className="bi bi-pie-chart-fill fs-5"></i>
              <span className="small-text fw-semibold uppercase text-secondary">Average Fat</span>
            </div>
            <h3 className="dash-metric-num text-warning mb-0">{avgFatToday}%</h3>
            <span className="small-text text-muted mt-1">Quality average</span>
          </div>
        </div>

        <div className="col-6">
          <div className="card border-0 p-3 h-100 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-2 text-secondary">
              <i className="bi bi-calculator-fill fs-5"></i>
              <span className="small-text fw-semibold uppercase text-secondary">Avg Rate</span>
            </div>
            <h3 className="dash-metric-num text-secondary mb-0">₹{avgRateToday}</h3>
            <span className="small-text text-muted mt-1">Rupees / Litre</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-secondary text-uppercase tracking-wider small">Quick Actions</h6>
        <div className="row g-2">
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('milk-entry')}>
            <div className="action-btn-card">
              <i className="bi bi-plus-circle text-primary fs-3 mb-1"></i>
              <span className="small fw-semibold text-dark">Add Entry</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={openScanModal}>
            <div className="action-btn-card">
              <i className="bi bi-camera text-info fs-3 mb-1"></i>
              <span className="small fw-semibold text-dark">Scan Receipt</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('profit')}>
            <div className="action-btn-card">
              <i className="bi bi-graph-up-arrow text-success fs-3 mb-1"></i>
              <span className="small fw-semibold text-dark">Finance P&L</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('more')}>
            <div className="action-btn-card">
              <i className="bi bi-folder2-open text-warning fs-3 mb-1"></i>
              <span className="small fw-semibold text-dark">Records Log</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Recent Records cards list */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-baseline mb-2">
          <h6 className="fw-bold text-secondary text-uppercase tracking-wider small mb-0">Recent Entries</h6>
          <button 
            className="btn btn-link p-0 text-decoration-none small text-primary-color"
            onClick={() => {
              setCurrentTab('more');
            }}
          >
            View All
          </button>
        </div>

        <div className="recent-list">
          {recentRecords.length === 0 ? (
            <div className="card border-0 p-4 text-center rounded-4 text-muted">
              <span>No collections recorded today.</span>
            </div>
          ) : (
            recentRecords.map(r => (
              <div 
                key={r.id} 
                className="record-card"
                onClick={() => setSelectedRecord(r)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-primary-color small text-nowrap">{r.receiptNo}</span>
                  <span className="text-muted small-text text-nowrap">{formatDate(r.date)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-baseline mt-1">
                  <h6 className="fw-bold mb-0 text-dark">{r.farmerName}</h6>
                  <span className="fw-bold fs-6 text-success">₹{r.totalAmount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary mt-1 small-text">
                  <span>{r.litreQty.toFixed(2)} L • Fat: {r.fatPercentage.toFixed(1)}%</span>
                  <span className={`badge ${r.milkShift === 'Morning' ? 'bg-warning-subtle text-warning' : 'bg-info-subtle text-primary'}`}>
                    {r.milkShift}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Details Overlay Modal Bottom Sheet */}
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

                <button 
                  className="btn btn-secondary rounded-pill w-100"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
