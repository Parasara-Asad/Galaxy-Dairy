import React, { useState, useEffect } from 'react';

function Header({ setSidebarOpen }) {
  const [timeStr, setTimeStr] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-navbar bg-gradient-primary text-white p-3 shadow-sm d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          id="sidebarToggleBtn"
          className="btn btn-light btn-sm d-md-none"
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div>
          <h1 className="h4 mb-0 fw-bold">Asad</h1>
          <small className="opacity-75 d-none d-sm-inline">Milk Collection Management Dashboard</small>
        </div>
      </div>
      <div className="d-none d-sm-flex align-items-center gap-3">
        <span
          className="badge bg-light text-primary px-3 py-2 rounded-pill fw-normal"
          id="liveClockDisplay"
        >
          <i className="bi bi-clock me-1"></i> {timeStr}
        </span>
        <div
          className="user-avatar rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center"
          style={{ width: '40px', height: '40px' }}
        >
          DS
        </div>
      </div>
    </header>
  );
}

export default Header;
