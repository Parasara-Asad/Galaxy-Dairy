import React from "react";

export const THEME_CONFIGS = [
  {
    id: "light",
    name: "Light Mode",
    badge: "Default Light",
    icon: "bi-sun-fill",
    iconColor: "#eab308",
    description: "Classic clean natural appearance with fresh green accents and white cards.",
    preview: {
      bg: "#f8fafc",
      navBg: "linear-gradient(135deg, #14532d, #16a34a)",
      cardBg: "#ffffff",
      cardBorder: "#e5e7eb",
      cardShadow: "0 2px 8px rgba(0,0,0,0.06)",
      text: "#1a2e1a",
      textMuted: "#6b7280",
      btnBg: "#16a34a",
      btnText: "#ffffff",
      inputBg: "#ffffff",
      inputBorder: "#d1d5db",
      tableHeaderBg: "#f0fdf4",
      tableText: "#1a2e1a",
    },
  },
  {
    id: "dark",
    name: "Dark Mode",
    badge: "Deep Charcoal",
    icon: "bi-moon-stars-fill",
    iconColor: "#38bdf8",
    description: "Modern eye-friendly dark navy theme with glowing emerald accents.",
    preview: {
      bg: "#121826",
      navBg: "linear-gradient(135deg, #0f2d1b, #14532d)",
      cardBg: "#1B2433",
      cardBorder: "#334155",
      cardShadow: "0 4px 16px rgba(0,0,0,0.35)",
      text: "#E5E7EB",
      textMuted: "#9CA3AF",
      btnBg: "#16a34a",
      btnText: "#ffffff",
      inputBg: "#202B3B",
      inputBorder: "#334155",
      tableHeaderBg: "#14532d",
      tableText: "#CBD5E1",
    },
  },
  {
    id: "normal",
    name: "Normal UI",
    badge: "Clean & Simple",
    icon: "bi-window-sidebar",
    iconColor: "#64748b",
    description: "Crisp, minimalist, professional interface with standard shadows and clear typography.",
    preview: {
      bg: "#f1f5f9",
      navBg: "#0f172a",
      cardBg: "#ffffff",
      cardBorder: "#cbd5e1",
      cardShadow: "0 1px 3px rgba(0,0,0,0.08)",
      text: "#0f172a",
      textMuted: "#64748b",
      btnBg: "#0f766e",
      btnText: "#ffffff",
      inputBg: "#ffffff",
      inputBorder: "#cbd5e1",
      tableHeaderBg: "#f8fafc",
      tableText: "#334155",
    },
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    badge: "Soft 3D Tactile",
    icon: "bi-layers-fill",
    iconColor: "#ec4899",
    description: "Soft rounded clay pill design with warm pastel tones, embossed outer & inner shadows.",
    preview: {
      bg: "#e6edf5",
      navBg: "#15803d",
      cardBg: "#ebf1f8",
      cardBorder: "rgba(255,255,255,0.8)",
      cardShadow: "4px 4px 10px #cad5e2, -4px -4px 10px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.7)",
      text: "#1e293b",
      textMuted: "#64748b",
      btnBg: "linear-gradient(145deg, #16a34a, #15803d)",
      btnText: "#ffffff",
      btnShadow: "3px 3px 6px #cad5e2, -3px -3px 6px #ffffff",
      inputBg: "#e2eaf3",
      inputBorder: "rgba(255,255,255,0.6)",
      inputShadow: "inset 2px 2px 5px #cbd5e1, inset -2px -2px 5px #ffffff",
      tableHeaderBg: "#dbe5f1",
      tableText: "#1e293b",
      radius: "16px",
    },
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    badge: "Translucent & Blur",
    icon: "bi-droplet-half",
    iconColor: "#a855f7",
    description: "Futuristic frosted glass cards, backdrop blur, ambient neon glows & layered transparency.",
    preview: {
      bg: "linear-gradient(135deg, #070d1e 0%, #0d1e38 50%, #062b24 100%)",
      navBg: "rgba(11, 19, 43, 0.75)",
      cardBg: "rgba(255, 255, 255, 0.08)",
      cardBorder: "rgba(255, 255, 255, 0.2)",
      cardShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.25)",
      cardBlur: "blur(10px)",
      text: "#ffffff",
      textMuted: "#94a3b8",
      btnBg: "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.95))",
      btnText: "#ffffff",
      btnShadow: "0 4px 14px rgba(34, 197, 94, 0.4)",
      inputBg: "rgba(255, 255, 255, 0.08)",
      inputBorder: "rgba(255, 255, 255, 0.22)",
      tableHeaderBg: "rgba(255, 255, 255, 0.12)",
      tableText: "#e2e8f0",
      radius: "14px",
    },
  },
];

function ThemeSelectorModal({ isOpen, onClose, currentTheme, onSelectTheme }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block theme-selector-modal-backdrop"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1060,
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable px-3"
        style={{ maxWidth: "560px", margin: "1.75rem auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom p-3 d-flex justify-content-between align-items-center bg-gradient-primary text-white">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.2)" }}
              >
                <i className="bi bi-palette-fill fs-5 text-white"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-white fs-5">Appearance / UI Theme</h5>
                <small className="opacity-80">Select from 5 global appearance modes</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body: Theme Cards */}
          <div className="modal-body p-3" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            <p className="small text-muted mb-3">
              Switch the entire application interface instantly. The chosen theme persists across restarts and page reloads.
            </p>

            <div className="d-flex flex-column gap-3">
              {THEME_CONFIGS.map((theme) => {
                const isSelected = currentTheme === theme.id;
                const { preview } = theme;

                return (
                  <div
                    key={theme.id}
                    className={`card border-2 transition-all cursor-pointer rounded-4 overflow-hidden ${
                      isSelected ? "border-success shadow-md" : "border-light-subtle shadow-sm"
                    }`}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      transform: isSelected ? "scale(1.01)" : "scale(1)",
                    }}
                    onClick={() => {
                      onSelectTheme(theme.id);
                    }}
                  >
                    {/* Card Header info */}
                    <div className="p-3 pb-2 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <i
                          className={`bi ${theme.icon} fs-4`}
                          style={{ color: theme.iconColor }}
                        ></i>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark fs-6">{theme.name}</span>
                            <span className="badge rounded-pill bg-secondary-subtle text-secondary small px-2">
                              {theme.badge}
                            </span>
                          </div>
                          <span className="small text-muted d-block">{theme.description}</span>
                        </div>
                      </div>

                      {/* Selection radio/checkmark */}
                      <div className="ms-2">
                        {isSelected ? (
                          <div
                            className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: "28px", height: "28px" }}
                          >
                            <i className="bi bi-check-lg fw-bold"></i>
                          </div>
                        ) : (
                          <div
                            className="border border-2 rounded-circle"
                            style={{ width: "26px", height: "26px" }}
                          ></div>
                        )}
                      </div>
                    </div>

                    {/* LIVE MINI THEME PREVIEW */}
                    <div className="px-3 pb-3">
                      <div
                        className="rounded-3 p-2 overflow-hidden position-relative"
                        style={{
                          background: preview.bg,
                          border: "1px solid rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      >
                        {/* Mini Top Navbar */}
                        <div
                          className="d-flex align-items-center justify-content-between px-2 py-1 mb-2 rounded-2 text-white"
                          style={{
                            background: preview.navBg,
                            backdropFilter: preview.cardBlur || "none",
                            WebkitBackdropFilter: preview.cardBlur || "none",
                          }}
                        >
                          <div className="d-flex align-items-center gap-1 fw-bold">
                            <i className="bi bi-droplet-half"></i>
                            <span>Galaxy Dairy</span>
                          </div>
                          <div className="d-flex gap-2 opacity-75">
                            <span>Dash</span>
                            <span>More</span>
                          </div>
                        </div>

                        {/* Mini Card simulating actual UI */}
                        <div
                          className="p-2 mb-2"
                          style={{
                            background: preview.cardBg,
                            border: `1px solid ${preview.cardBorder}`,
                            boxShadow: preview.cardShadow,
                            borderRadius: preview.radius || "10px",
                            backdropFilter: preview.cardBlur || "none",
                            WebkitBackdropFilter: preview.cardBlur || "none",
                            color: preview.text,
                          }}
                        >
                          {/* Mini Form row: Input & Button */}
                          <div className="d-flex gap-2 align-items-center mb-2">
                            <div
                              className="px-2 py-1 flex-grow-1"
                              style={{
                                background: preview.inputBg,
                                border: `1px solid ${preview.inputBorder}`,
                                boxShadow: preview.inputShadow || "none",
                                borderRadius: preview.radius ? "12px" : "6px",
                                color: preview.text,
                              }}
                            >
                              <i className="bi bi-search me-1 opacity-50"></i>
                              <span>Farmer search...</span>
                            </div>
                            <div
                              className="px-2 py-1 fw-semibold text-center"
                              style={{
                                background: preview.btnBg,
                                color: preview.btnText,
                                boxShadow: preview.btnShadow || "none",
                                borderRadius: preview.radius ? "20px" : "6px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              + Submit
                            </div>
                          </div>

                          {/* Mini Table Data Row */}
                          <div
                            className="d-flex justify-content-between align-items-center px-2 py-1 rounded-1"
                            style={{
                              background: preview.tableHeaderBg,
                              color: preview.tableText,
                              fontSize: "10.5px",
                            }}
                          >
                            <span className="fw-semibold">Cow Milk (A-101)</span>
                            <span>5.20 L</span>
                            <span className="fw-bold text-success">₹260.00</span>
                          </div>
                        </div>

                        {/* Status bar */}
                        <div className="d-flex justify-content-between align-items-center px-1">
                          <span style={{ color: preview.textMuted, fontSize: "10px" }}>
                            Preview: Background, Nav, Cards, Buttons, Inputs, Tables
                          </span>
                          {isSelected && (
                            <span className="badge bg-success small px-2">Active</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top p-2 bg-light d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Current: <strong>{THEME_CONFIGS.find((t) => t.id === currentTheme)?.name || currentTheme}</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeSelectorModal;
