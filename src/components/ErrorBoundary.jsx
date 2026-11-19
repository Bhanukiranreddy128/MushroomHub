import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fbf7",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#233324"
        }}>
          <div style={{
            maxWidth: "540px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "36px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid #e1e9dd",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🍄</div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px", color: "#1c2b1d" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "15px", color: "#5a6e5b", lineHeight: "1.6", marginBottom: "24px" }}>
              MushroomHub encountered an unexpected rendering error. You can reload this view or navigate back to the home page.
            </p>

            {this.state.error && (
              <div style={{
                background: "#f5f7f3",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#c0392b",
                textAlign: "left",
                marginBottom: "24px",
                overflowX: "auto",
                border: "1px solid #e8eee4"
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2e6f40",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid #cfdbcc",
                  background: "#ffffff",
                  color: "#2e6f40",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
