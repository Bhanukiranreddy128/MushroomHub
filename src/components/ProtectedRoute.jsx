import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Role-Based Access Control (RBAC) Route Guard
 * Enforces authenticated session and permitted roles on frontend routes.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated check
  if (!user || !user.isLoggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 2. Role verification
  const currentRole = (user.role || "").toLowerCase();
  const normalizedAllowed = (allowedRoles || []).map((r) => r.toLowerCase());

  const hasPermission = normalizedAllowed.includes(currentRole);

  if (!hasPermission) {
    const roleDisplayName = {
      customer: "Buyer (Customer)",
      cultivater: "Farmer (Cultivator)",
      admin: "Administrator",
      superadmin: "Super Administrator"
    }[currentRole] || currentRole;

    const allowedDisplayNames = normalizedAllowed.map(
      (r) =>
        ({
          customer: "Buyer",
          cultivater: "Farmer",
          admin: "Administrator",
          superadmin: "Super Administrator"
        }[r] || r)
    ).join(" or ");

    return (
      <div className="portal-wrapper" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="container" style={{ maxWidth: 580 }}>
          <div className="hub-card" style={{ padding: "44px 36px", textAlign: "center", borderRadius: 16, border: "1px solid rgba(220, 53, 69, 0.2)", background: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#fdf2f2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>
              🛡️
            </div>
            <span className="badge bg-danger" style={{ display: "inline-block", fontSize: 12, padding: "6px 12px", borderRadius: 20, marginBottom: 12 }}>
              403 · Access Denied
            </span>
            <h2 style={{ font: "700 24px Manrope", color: "#2d1515", margin: "10px 0 12px" }}>
              Unauthorized Role Access
            </h2>
            <p style={{ fontSize: 15, color: "#6c757d", lineHeight: 1.6, marginBottom: 24 }}>
              Your active account is authenticated as <strong style={{ color: "#198754" }}>{roleDisplayName}</strong>.
              This restricted portal requires <strong>{allowedDisplayNames}</strong> authority.
            </p>

            <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#495057", textAlign: "left", marginBottom: 28, borderLeft: "4px solid #dc3545" }}>
              <strong>🔒 Strict RBAC Security:</strong> MushroomHub implements backend-validated role boundaries. Privilege escalation attempts are recorded in system audit logs.
            </div>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/login" className="btn btn-outline-dark" style={{ padding: "10px 22px", borderRadius: 8, fontWeight: 600 }}>
                ← Switch Account
              </Link>
              <Link to="/" className="btn btn-success" style={{ padding: "10px 24px", borderRadius: 8, fontWeight: 600 }}>
                Go to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
