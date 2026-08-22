import React from 'react';

function Sidebar({ currentSection, setCurrentSection, darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  return (
    <nav id="sidebar" className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
      <div className="sidebar-header d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-droplet-half fs-3 text-primary"></i>
          <span className="fw-bold fs-5 brand-text">DairyCare</span>
        </div>
        <button 
          className="btn btn-sm btn-light d-md-none" 
          onClick={() => setSidebarOpen(false)}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <ul className="nav nav-pills flex-column p-3 gap-1 sidebar-nav">
        <li className="nav-item">
          <a
            href="#dashboard"
            className={`nav-link d-flex align-items-center gap-3 ${currentSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection('dashboard');
              setSidebarOpen(false);
            }}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#milk-entry"
            className={`nav-link d-flex align-items-center gap-3 ${currentSection === 'milk-entry' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection('milk-entry');
              setSidebarOpen(false);
            }}
          >
            <i className="bi bi-plus-circle-fill"></i>
            <span>Milk Entry</span>
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#profit"
            className={`nav-link d-flex align-items-center gap-3 ${currentSection === 'profit' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection('profit');
              setSidebarOpen(false);
            }}
          >
            <i className="bi bi-cash-stack"></i>
            <span>Profit & Loss</span>
          </a>
        </li>
      </ul>

      <div className="sidebar-footer p-3 mt-auto border-top">
        <div className="d-flex align-items-center justify-content-between">
          <span className="small text-muted">Dark Mode</span>
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="darkModeToggle"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
