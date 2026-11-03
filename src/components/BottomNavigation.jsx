import React from 'react';

function BottomNavigation({ currentTab, setCurrentTab, onScanClick }) {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentTab('dashboard')}
      >
        <i className={`bi bi-house${currentTab === 'dashboard' ? '-fill' : '-door'}`}></i>
        <span>Home</span>
        {currentTab === 'dashboard' && <span className="nav-active-indicator"></span>}
      </button>

      <button 
        className={`nav-tab-btn ${currentTab === 'milk-entry' ? 'active' : ''}`}
        onClick={() => setCurrentTab('milk-entry')}
      >
        <i className={`bi bi-plus-circle${currentTab === 'milk-entry' ? '-fill' : ''}`}></i>
        <span>Entry</span>
        {currentTab === 'milk-entry' && <span className="nav-active-indicator"></span>}
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
        <i className={`bi bi-wallet${currentTab === 'profit' ? '-fill' : '2'}`}></i>
        <span>Finance</span>
        {currentTab === 'profit' && <span className="nav-active-indicator"></span>}
      </button>

      <button 
        className={`nav-tab-btn ${currentTab === 'more' ? 'active' : ''}`}
        onClick={() => setCurrentTab('more')}
      >
        <i className={`bi bi-${currentTab === 'more' ? 'grid-fill' : 'three-dots'}`}></i>
        <span>More</span>
        {currentTab === 'more' && <span className="nav-active-indicator"></span>}
      </button>
    </div>
  );
}

export default BottomNavigation;
