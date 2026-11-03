import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/useAuth";

function ProfileModal({ isOpen, onClose }) {
  const { currentUser, userProfile, updateUserProfileData, logout } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoPreview, setPhotoPreview] = useState(""); // local blob preview
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userProfile || currentUser) {
      setFullName(userProfile?.fullName || currentUser?.displayName || "");
      setPhoneNumber(userProfile?.phoneNumber || currentUser?.phoneNumber || "");
      const existingPhoto = userProfile?.photoURL || currentUser?.photoURL || "";
      setPhotoURL(existingPhoto);
      setPhotoPreview(existingPhoto);
    }
  }, [userProfile, currentUser, isOpen]);

  if (!isOpen) return null;

  // Convert selected image file to base64 data URL for storage
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusMessage({ text: "Please select an image file (JPG, PNG, etc.)", type: "danger" });
      return;
    }
    if (file.size > 700 * 1024) {
      setStatusMessage({ text: "Image is too large. Please pick one under 700 KB.", type: "danger" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhotoPreview(dataUrl);
      setPhotoURL(dataUrl);
      setStatusMessage({ text: "", type: "" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
    setPhotoURL("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMessage({ text: "", type: "" });
    setLoading(true);
    try {
      await updateUserProfileData({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        photoURL: photoURL,
      });
      setStatusMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      let friendlyMsg = "Failed to update profile. Please try again.";
      const raw = err.message || "";
      if (raw.includes("longer than") || raw.includes("photoURL") || raw.includes("bytes")) {
        friendlyMsg = "Profile photo is too large. Please choose an image under 1 MB.";
      } else if (raw.includes("network") || raw.includes("Network")) {
        friendlyMsg = "No internet connection. Please check your network and try again.";
      } else if (raw.includes("permission") || raw.includes("PERMISSION_DENIED")) {
        friendlyMsg = "You do not have permission to update this profile.";
      } else if (raw.includes("unauthenticated") || raw.includes("not authenticated")) {
        friendlyMsg = "Your session has expired. Please log in again.";
      } else if (raw.includes("quota") || raw.includes("resource-exhausted")) {
        friendlyMsg = "Service is temporarily busy. Please wait a moment and try again.";
      } else if (raw.includes("invalid") && raw.includes("email")) {
        friendlyMsg = "The email address entered is not valid.";
      } else if (raw.includes("phone")) {
        friendlyMsg = "The phone number entered is not valid.";
      }
      setStatusMessage({ text: friendlyMsg, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onClose) onClose();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const userInitials = (fullName || userProfile?.username || "GD")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1200 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div
        className="modal-dialog modal-dialog-centered px-3"
        style={{ maxWidth: "460px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="p-4 text-white position-relative"
            style={{ background: "linear-gradient(135deg, #14532d, #16a34a)" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="modal-title fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-person-badge"></i>
                <span>Edit Profile</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <p className="small mb-0 opacity-75 mt-1">Manage your account information.</p>
          </div>

          <div className="modal-body p-4">

            {/* ── Avatar Upload UI ── */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                {/* Avatar circle — click to open file picker */}
                <div
                  className="rounded-circle border border-3 shadow overflow-hidden d-flex align-items-center justify-content-center mx-auto"
                  style={{
                    width: "90px", height: "90px",
                    cursor: "pointer", background: "#f1f5f9",
                    borderColor: "#16a34a !important",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change photo"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="fw-bold fs-3" style={{ color: "#16a34a" }}>{userInitials}</span>
                  )}
                </div>

                {/* Camera badge button */}
                <button
                  type="button"
                  className="btn btn-sm rounded-circle shadow position-absolute d-flex align-items-center justify-content-center p-0 border-2 border-white"
                  style={{ width: "28px", height: "28px", bottom: "2px", right: "2px", background: "#16a34a", border: "2px solid white" }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photo"
                >
                  <i className="bi bi-camera-fill text-white" style={{ fontSize: "12px" }}></i>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleFileChange}
              />

              {/* Upload / Remove buttons */}
              <div className="d-flex justify-content-center gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-upload me-1"></i> Choose Photo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                    onClick={handleRemovePhoto}
                  >
                    <i className="bi bi-trash me-1"></i> Remove
                  </button>
                )}
              </div>
              <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                JPG, PNG · Max 700 KB
              </small>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  Username <span className="text-muted fw-normal">(Permanent)</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">@</span>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={userProfile?.username || ""}
                    disabled
                    readOnly
                  />
                </div>
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Unique username cannot be changed.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  Mobile Phone Number
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-phone"></i>
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +91 9879400931"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn rounded-pill py-2 flex-fill fw-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="bi bi-check2 me-1"></i>
                  )}
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger rounded-pill py-2 px-3 fw-semibold"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Log Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
