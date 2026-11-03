import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";

function AuthModal({ isOpen, onClose }) {
  const {
    isFirebaseConfigured,
    loginWithGoogle,
    registerWithUsername,
    loginWithUsernameOrEmail,
    resetPassword,
  } = useAuth();

  // Mode: 'login', 'signup', 'forgot'
  const [authMode, setAuthMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Login Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup Form State
  const [fullName, setFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+91");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot Password State
  const [resetIdentifier, setResetIdentifier] = useState("");

  // Clear messages when switching tabs
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, [authMode]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || "Google sign-in failed. Please check your network and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!identifier.trim()) {
      setErrorMessage("Please enter your username or email.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      await loginWithUsernameOrEmail(identifier, password);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      let msg = "Failed to log in. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        msg = "Incorrect username or password. Please try again.";
      } else if (err.code === "auth/user-not-found") {
        msg = "No account found with this username or email.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please wait a moment and try again.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "No internet connection. Please check your network and try again.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!signupUsername.trim()) {
      setErrorMessage("Please choose a unique username.");
      return;
    }
    if (signupUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const trimmedPhone = signupPhone.replace(/\D/g, "");
    const fullPhone = trimmedPhone ? `${signupCountryCode}${trimmedPhone}` : "";

    setLoading(true);
    try {
      await registerWithUsername({
        fullName,
        username: signupUsername,
        password: signupPassword,
        email: signupEmail,
        phoneNumber: fullPhone,
      });
      setSuccessMessage("Account created successfully!");
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      let msg = err.message || "Registration failed.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Try logging in instead.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!resetIdentifier.trim()) {
      setErrorMessage("Please enter your registered username or email.");
      return;
    }
    setLoading(true);
    try {
      const sentEmail = await resetPassword(resetIdentifier);
      setSuccessMessage(`Password reset link sent to ${sentEmail}. Check your inbox!`);
    } catch (err) {
      console.error(err);
      let msg = err.message || "Could not send reset link.";
      if (err.code === "auth/user-not-found") {
        msg = "No user found with this email/username.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1200 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered px-3"
        style={{ maxWidth: "480px" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">

          {/* Header Banner – Green Gradient */}
          <div
            className="p-4 text-white position-relative"
            style={{ background: "linear-gradient(135deg, #14532d, #16a34a)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: "42px", height: "42px", background: "rgba(255,255,255,0.2)" }}
                >
                  <i className="bi bi-flower1 fs-4 text-white"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0 text-white">Galaxy Dairy</h5>
                  <span className="small opacity-75">Cooperative Authentication</span>
                </div>
              </div>

            </div>

          </div>

          {/* Missing Config Notification */}
          {!isFirebaseConfigured && (
            <div className="bg-warning-subtle text-warning-emphasis p-3 border-bottom small d-flex align-items-start gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 text-warning"></i>
              <div>
                <strong>Firebase Configuration Needed:</strong>
                <p className="mb-0 mt-1">
                  Add your Firebase keys to your <code>.env</code> file (or Netlify environment variables) to enable cloud authentication.
                </p>
              </div>
            </div>
          )}

          {/* Auth Navigation Tabs */}
          <div className="p-2 border-bottom d-flex gap-1" style={{ background: "#f0fdf4" }}>
            <button
              className={`btn btn-sm rounded-pill flex-fill fw-semibold ${
                authMode === "login" ? "shadow-sm text-white" : "text-muted"
              }`}
              style={
                authMode === "login"
                  ? { background: "#16a34a", border: "none" }
                  : { background: "transparent", border: "none" }
              }
              onClick={() => setAuthMode("login")}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
            </button>
            <button
              className={`btn btn-sm rounded-pill flex-fill fw-semibold ${
                authMode === "signup" ? "shadow-sm text-white" : "text-muted"
              }`}
              style={
                authMode === "signup"
                  ? { background: "#16a34a", border: "none" }
                  : { background: "transparent", border: "none" }
              }
              onClick={() => setAuthMode("signup")}
            >
              <i className="bi bi-person-plus me-1"></i> Sign Up
            </button>
          </div>

          <div className="modal-body p-4">

            {/* Feedback Banners */}
            {errorMessage && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3 rounded-3">
                <i className="bi bi-exclamation-circle-fill text-danger"></i>
                <div className="flex-grow-1">{errorMessage}</div>
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-3 rounded-3">
                <i className="bi bi-check-circle-fill text-success"></i>
                <div className="flex-grow-1">{successMessage}</div>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {authMode === "login" && (
              <form onSubmit={handleUsernameLogin}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Username or Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. asad or user@domain.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-secondary mb-0">
                      Password
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 small text-decoration-none"
                      style={{ fontSize: "0.8rem" }}
                      onClick={() => setAuthMode("forgot")}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi bi-${showPassword ? "eye-slash" : "eye"}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 rounded-pill py-2 fw-semibold mb-3 text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                  )}
                  Log In
                </button>

                <div className="text-center my-3 position-relative">
                  <hr className="my-2" />
                  <span className="bg-white px-2 small text-muted position-relative" style={{ top: "-13px" }}>
                    or continue with
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                  style={{ background: "#fff", border: "1px solid #e5e7eb" }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" />
                  </svg>
                  <span>Google Sign In</span>
                </button>
              </form>
            )}

            {/* TAB 2: SIGN UP */}
            {authMode === "signup" && (
              <form onSubmit={handleUsernameSignup}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Parasara Zahid"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Username <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">@</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. zahid_dairy"
                      value={signupUsername}
                      onChange={(e) =>
                        setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
                      }
                      required
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Lowercase letters, numbers, underscores, and dots only.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Email <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@mail.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Phone Number <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <div className="input-group">
                    <select
                      className="form-select flex-grow-0"
                      style={{ width: "95px" }}
                      value={signupCountryCode}
                      onChange={(e) => setSignupCountryCode(e.target.value)}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="10-digit mobile"
                      value={signupPhone}
                      onChange={(e) =>
                        setSignupPhone(e.target.value.replace(/\D/g, "").slice(0, 12))
                      }
                      maxLength="12"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      <i className={`bi bi-${showSignupPassword ? "eye-slash" : "eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 rounded-pill py-2 fw-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-person-check me-1"></i>
                  )}
                  Create Account
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {authMode === "forgot" && (
              <form onSubmit={handleForgotPassword}>
                <div className="text-center mb-3">
                  <div
                    className="bg-info-subtle text-info rounded-circle mx-auto d-flex align-items-center justify-content-center mb-2"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <i className="bi bi-key fs-4"></i>
                  </div>
                  <h6 className="fw-bold mb-1">Reset Password</h6>
                  <p className="small text-muted mb-0">
                    Enter your username or email address and we will send a password reset link.
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Username or Registered Email
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. zahid or name@mail.com"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100 rounded-pill py-2 fw-semibold mb-2 text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-envelope-check me-1"></i>
                  )}
                  Send Reset Link
                </button>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none"
                    onClick={() => setAuthMode("login")}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back to Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
