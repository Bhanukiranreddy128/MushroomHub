import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SYSTEM_ROLES } from "../../data/store";

export default function PlaceholderPortal({ roleId }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleObj = SYSTEM_ROLES.find((r) => r.id === roleId) || SYSTEM_ROLES[0];

  const isAuthenticated = user?.isLoggedIn && user?.role === roleId;

  if (!isAuthenticated) {
    return (
      <div className="portal-wrapper">
        <div className="container" style={{ maxWidth: 540, margin: "50px auto 90px" }}>
          <div className="hub-card" style={{ padding: "40px 32px", textAlign: "center", boxShadow: "0 16px 45px rgba(25, 45, 30, 0.08)" }}>
            <span style={{ fontSize: 48 }}>{roleObj.icon}</span>
            <h2 style={{ font: "700 24px Manrope", color: "#1f3829", margin: "14px 0 8px" }}>
              {roleObj.name} Sign In Required
            </h2>
            <div className="status-badge" style={{ background: "#fef3c7", color: "#92400e", display: "inline-block", marginBottom: 16 }}>
              {roleObj.badge} Protected Workspace
            </div>
            <p style={{ fontSize: 14, color: "#607261", lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 440 }}>
              Please sign in with your verified {roleObj.name.toLowerCase()} credentials to access this workspace.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                to={`/login/${roleId}`}
                className="button button-green"
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14 }}
              >
                Log In With {roleObj.name} Credentials →
              </Link>
              <Link
                to="/"
                className="button button-outline"
                style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13 }}
              >
                ← Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-wrapper">
      <div className="container">
        {/* Role Context Bar */}
        <div className="role-context-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 36 }}>{roleObj.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 18, color: "#1f3829" }}>{roleObj.name} Portal</strong>
                <span className="role-badge-pill" style={{ background: "#f2f4ec", color: "#37503b" }}>
                  {roleObj.badge} Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6a7767" }}>
                Official access panel for MushroomHub {roleObj.name} operations.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#546452" }}>
              Logged in as: <strong>{user?.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate(`/login/${roleId}`);
              }}
              className="button button-outline"
              style={{ fontSize: 12, padding: "7px 12px", borderColor: "#c47a74", color: "#8d3e33" }}
              title="Securely sign out"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>

        {/* Phase 2 Readiness Notice */}
        <div className="hub-card" style={{ padding: "36px 30px", borderLeft: "5px solid var(--green)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ maxWidth: 650 }}>
              <span className="role-badge-pill" style={{ marginBottom: 10 }}>
                Phase 1 Foundation Complete · Ready for Your Input
              </span>
              <h2 style={{ font: "700 26px Manrope", color: "#1d3626", margin: "6px 0 10px" }}>
                {roleObj.icon} {roleObj.name} Workspace
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#546252", margin: "0 0 20px" }}>
                {roleObj.description}
              </p>

              <h4 style={{ font: "700 14px Manrope", color: "#223d2b", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>
                Core Capabilities & Planned Phase 2 Modules:
              </h4>
              <ul style={{ paddingLeft: 20, margin: "0 0 24px", fontSize: 13, color: "#4f5f4e", lineHeight: 1.8 }}>
                {roleObj.features.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: "#f8faf6", border: "1px solid #dce8d8", borderRadius: 12, padding: "22px 26px", minWidth: 260, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{roleObj.icon}</div>
              <strong style={{ font: "700 16px Manrope", display: "block", color: "#1f3829" }}>
                {roleObj.name} Hub
              </strong>
              <div style={{ fontSize: 11, color: "#748373", margin: "6px 0 14px" }}>
                Status: Verified & Active
              </div>
              <div style={{ fontSize: 12, color: "#2d6338", background: "#e8f3e5", padding: "8px 12px", borderRadius: 6, fontWeight: 600 }}>
                Individual Role Authentication Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
