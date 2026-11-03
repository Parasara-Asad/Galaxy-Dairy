import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

function Header({ setSidebarOpen, onOpenProfile, onOpenAuth }) {
  const [timeStr, setTimeStr] = useState('--:--:--');
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayName = userProfile?.fullName || currentUser?.displayName || "Galaxy Dairy";
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="top-navbar bg-gradient-primary text-white p-3 shadow-sm d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center gap-3">
        {setSidebarOpen && (
          <button
            type="button"
            id="sidebarToggleBtn"
            className="btn btn-light btn-sm d-md-none"
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        )}
        <div>
          <h1 className="h4 mb-0 fw-bold">{displayName}</h1>
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
        {currentUser ? (
          <div
            className="user-avatar rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center shadow-sm cursor-pointer"
            style={{ width: '40px', height: '40px', cursor: 'pointer' }}
            onClick={onOpenProfile}
            title="Open Profile"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt={displayName} className="w-100 h-100 rounded-circle object-fit-cover" />
            ) : (
              initials
            )}
          </div>
        ) : (
          <button
            className="btn btn-light btn-sm rounded-pill fw-semibold text-primary px-3"
            onClick={onOpenAuth}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
