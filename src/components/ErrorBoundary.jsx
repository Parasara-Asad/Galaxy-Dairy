import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Galaxy Dairy] Uncaught UI Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) caches.delete(name);
        });
      }
    } catch (e) {
      console.warn("Storage clear failed:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center" style={{ maxWidth: "540px" }}>
          <div className="card border-0 shadow-lg p-4 rounded-4 mt-5">
            <div
              className="bg-danger-subtle text-danger rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
              style={{ width: "64px", height: "64px" }}
            >
              <i className="bi bi-exclamation-triangle-fill fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Something went wrong</h4>
            <p className="text-muted small mb-3">
              The application encountered an unexpected error while rendering.
            </p>
            {this.state.error?.message && (
              <div className="bg-light text-danger text-start p-3 rounded-3 small font-monospace mb-4 overflow-auto" style={{ maxHeight: "120px" }}>
                {this.state.error.message}
              </div>
            )}
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary rounded-pill flex-fill py-2 fw-semibold"
                onClick={this.handleReload}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Reload App
              </button>
              <button
                className="btn btn-outline-secondary rounded-pill flex-fill py-2 fw-semibold small"
                onClick={this.handleResetAndReload}
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
