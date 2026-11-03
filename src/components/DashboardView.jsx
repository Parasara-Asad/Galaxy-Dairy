import React, { useState } from 'react';

function DashboardView({ records, setCurrentTab, openScanModal, userName }) {
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-mobile" style={{ animation: "fadeInUp 0.3s ease" }}>

      {/* Welcome Section */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <h4 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>
            Hello, {userName || "everyone"} 🌿
          </h4>
        </div>
        <p className="text-muted small mb-0">
          Today's cooperative milk collection summary
        </p>
        <div
          style={{
            width: "40px",
            height: "3px",
            borderRadius: "2px",
            background: "linear-gradient(90deg, #16a34a, #22c55e)",
            marginTop: "6px",
          }}
        />
      </div>

      {/* 4 Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Card 1: Today's Milk */}
        <div className="col-6">
          <div
            className="card border-0 p-3 h-100 rounded-4 dash-card-hover"
            style={{ boxShadow: "0 2px 12px rgba(22,163,74,0.08)" }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px", background: "#dcfce7" }}
              >
                <i className="bi bi-bucket-fill" style={{ color: "#16a34a", fontSize: "1rem" }}></i>
              </div>
              <span className="small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}>Today's Milk</span>
            </div>
            <h3 className="dash-metric-num mb-0" style={{ color: "#16a34a" }}>{todayLitre.toFixed(1)} L</h3>
            <span className="small text-muted mt-1">{todayRecords.length} collections</span>
          </div>
        </div>

        {/* Card 2: Today's Pay */}
        <div className="col-6">
          <div
            className="card border-0 p-3 h-100 rounded-4 dash-card-hover"
            style={{ boxShadow: "0 2px 12px rgba(22,163,74,0.08)" }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px", background: "#d1fae5" }}
              >
                <i className="bi bi-currency-rupee" style={{ color: "#059669", fontSize: "1rem" }}></i>
              </div>
              <span className="small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}>Today's Pay</span>
            </div>
            <h3 className="dash-metric-num mb-0" style={{ color: "#059669" }}>₹{todayAmount.toFixed(0)}</h3>
            <span className="small text-muted mt-1">Paid to farmers</span>
          </div>
        </div>

        {/* Card 3: Average Fat */}
        <div className="col-6">
          <div
            className="card border-0 p-3 h-100 rounded-4 dash-card-hover"
            style={{ boxShadow: "0 2px 12px rgba(245,158,11,0.08)" }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px", background: "#fef3c7" }}
              >
                <i className="bi bi-pie-chart-fill" style={{ color: "#d97706", fontSize: "1rem" }}></i>
              </div>
              <span className="small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}>Average Fat</span>
            </div>
            <h3 className="dash-metric-num mb-0" style={{ color: "#d97706" }}>{avgFatToday}%</h3>
            <span className="small text-muted mt-1">Quality average</span>
          </div>
        </div>

        {/* Card 4: Avg Rate */}
        <div className="col-6">
          <div
            className="card border-0 p-3 h-100 rounded-4 dash-card-hover"
            style={{ boxShadow: "0 2px 12px rgba(107,114,128,0.08)" }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "34px", height: "34px", background: "#f1f5f9" }}
              >
                <i className="bi bi-calculator-fill" style={{ color: "#64748b", fontSize: "1rem" }}></i>
              </div>
              <span className="small fw-semibold text-uppercase text-secondary" style={{ fontSize: "0.62rem", letterSpacing: "0.5px" }}>Avg Rate</span>
            </div>
            <h3 className="dash-metric-num mb-0 text-secondary">₹{avgRateToday}</h3>
            <span className="small text-muted mt-1">Rupees / Litre</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-secondary text-uppercase small" style={{ letterSpacing: "0.8px" }}>Quick Actions</h6>
        <div className="row g-2">
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('milk-entry')}>
            <div className="action-btn-card" style={{ borderRadius: "16px" }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
              >
                <i className="bi bi-plus-circle-fill text-white fs-5"></i>
              </div>
              <span className="small fw-semibold" style={{ color: "var(--text-primary)" }}>Add Entry</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={openScanModal}>
            <div className="action-btn-card" style={{ borderRadius: "16px" }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
              >
                <i className="bi bi-camera-fill text-white fs-5"></i>
              </div>
              <span className="small fw-semibold" style={{ color: "var(--text-primary)" }}>Scan Receipt</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('profit')}>
            <div className="action-btn-card" style={{ borderRadius: "16px" }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <i className="bi bi-graph-up-arrow text-white fs-5"></i>
              </div>
              <span className="small fw-semibold" style={{ color: "var(--text-primary)" }}>Finance P&L</span>
            </div>
          </div>
          <div className="col-6 col-sm-3" onClick={() => setCurrentTab('more')}>
            <div className="action-btn-card" style={{ borderRadius: "16px" }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <i className="bi bi-folder2-open text-white fs-5"></i>
              </div>
              <span className="small fw-semibold" style={{ color: "var(--text-primary)" }}>Records Log</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-baseline mb-2">
          <h6 className="fw-bold text-secondary text-uppercase small mb-0" style={{ letterSpacing: "0.8px" }}>Recent Entries</h6>
          <button 
            className="btn btn-link p-0 text-decoration-none small"
            style={{ color: "var(--primary-color)" }}
            onClick={() => {
              setCurrentTab('more');
            }}
          >
            View All
          </button>
        </div>

        <div className="recent-list">
          {recentRecords.length === 0 ? (
            <div
              className="card border-0 p-4 text-center rounded-4"
              style={{ background: "var(--primary-lighter)", color: "var(--text-secondary)" }}
            >
              <i className="bi bi-inbox fs-2 mb-2" style={{ color: "#16a34a", opacity: 0.5 }}></i>
              <span className="small">No collections recorded today.</span>
            </div>
          ) : (
            recentRecords.map(r => (
              <div 
                key={r.id} 
                className="record-card"
                onClick={() => setSelectedRecord(r)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  {/* Farmer avatar + info */}
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "0.75rem",
                      }}
                    >
                      {getInitials(r.farmerName)}
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0" style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{r.farmerName}</h6>
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>{r.receiptNo} · {formatDate(r.date)}</span>
                    </div>
                  </div>
                  {/* Amount */}
                  <span className="fw-bold fs-6" style={{ color: "#16a34a" }}>₹{r.totalAmount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {r.litreQty.toFixed(2)} L • Fat: {r.fatPercentage.toFixed(1)}%
                  </span>
                  <span
                    className={r.milkShift === 'Morning' ? 'gd-badge-morning' : 'gd-badge-evening'}
                  >
                    {r.milkShift === 'Morning' ? '🌅' : '🌆'} {r.milkShift}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Details Overlay Modal Bottom Sheet */}
      {selectedRecord && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered bottom-sheet-dialog show">
            <div className="modal-content border-0 shadow-lg bottom-sheet-content">
              {/* Green gradient header */}
              <div
                className="modal-header border-0 text-white"
                style={{ background: "linear-gradient(135deg, #14532d, #15803d)", padding: "1rem 1.25rem" }}
              >
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-receipt"></i>
                  <span>Record Details</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedRecord(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="card border p-3 mb-3 rounded-4" style={{ background: "var(--primary-lighter)" }}>
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="small text-muted d-block">Receipt Number</span>
                      <strong style={{ color: "var(--primary-color)" }}>{selectedRecord.receiptNo}</strong>
                    </div>
                    <div className="col-6">
                      <span className="small text-muted d-block">Collection Date</span>
                      <strong>{formatDate(selectedRecord.date)}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Shift</span>
                      <span className={selectedRecord.milkShift === 'Morning' ? 'gd-badge-morning' : 'gd-badge-evening'}>
                        {selectedRecord.milkShift}
                      </span>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Milk Type</span>
                      <span
                        className="badge"
                        style={{ background: "#dcfce7", color: "#15803d" }}
                      >{selectedRecord.milkType}</span>
                    </div>
                  </div>
                </div>

                <div className="card border p-3 mb-3 rounded-4">
                  <div className="row g-2">
                    <div className="col-12">
                      <span className="small text-muted d-block">Farmer</span>
                      <strong>{selectedRecord.farmerName}</strong>
                    </div>
                  </div>
                </div>

                <div className="card border p-3 mb-3 rounded-4">
                  <div className="row g-2">
                    <div className="col-6">
                      <span className="small text-muted d-block">Quantity</span>
                      <strong className="fs-6">{selectedRecord.litreQty.toFixed(2)} L</strong>
                    </div>
                    <div className="col-6">
                      <span className="small text-muted d-block">Fat %</span>
                      <strong className="fs-6">{selectedRecord.fatPercentage.toFixed(1)}%</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Rate/Litre</span>
                      <strong className="fs-6">₹{selectedRecord.ratePerLitre.toFixed(2)}</strong>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="small text-muted d-block">Total Amount</span>
                      <strong className="fs-5" style={{ color: "#16a34a" }}>₹{selectedRecord.totalAmount.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn rounded-pill w-100 fw-semibold"
                  style={{ background: "#f1f5f9", color: "var(--text-secondary)" }}
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
