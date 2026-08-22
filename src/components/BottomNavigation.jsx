import React from 'react';

function BottomNavigation({ currentTab, setCurrentTab, onScanClick }) {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentTab('dashboard')}
      >
        <i className="bi bi-house-door-fill"></i>
        <span>Home</span>
      </button>

      <button 
        className={`nav-tab-btn ${currentTab === 'milk-entry' ? 'active' : ''}`}
        onClick={() => setCurrentTab('milk-entry')}
      >
        <i className="bi bi-plus-circle-fill"></i>
        <span>Entry</span>
      </button>

      {/* Floating Action Button (FAB) in the middle */}
      <button 
        className="scan-tab-btn"
        onClick={onScanClick}
        title="Scan Milk Receipt"
      >
        <i className="bi bi-camera-fill text-white fs-4"></i>
      </button>

      <button 
        className={`nav-tab-btn ${currentTab === 'profit' ? 'active' : ''}`}
        onClick={() => setCurrentTab('profit')}
      >
        <i className="bi bi-wallet2"></i>
        <span>Finance</span>
      </button>

      <button 
        className={`nav-tab-btn ${currentTab === 'more' ? 'active' : ''}`}
        onClick={() => setCurrentTab('more')}
      >
        <i className="bi bi-three-dots"></i>
        <span>More</span>
      </button>
    </div>
  );
}

export default BottomNavigation;
