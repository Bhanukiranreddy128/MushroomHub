import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCart } from "../../data";
import { getSystemVersion } from "../../data/store";
import "../Header.css";

export default function PublicNavbar() {
  const [count, setCount] = useState(() => getCart().reduce((n, p) => n + p.quantity, 0));
  const [open, setOpen] = useState(false);
  const [versionData, setVersionData] = useState(getSystemVersion);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => setCount(getCart().reduce((n, p) => n + p.quantity, 0));
    const updateVersion = () => setVersionData(getSystemVersion());

    window.addEventListener("cart-updated", update);
    window.addEventListener("storage", update);
    window.addEventListener("system-version-updated", updateVersion);

    return () => {
      window.removeEventListener("cart-updated", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("system-version-updated", updateVersion);
    };
  }, []);

  const close = () => {
    setOpen(false);
  };

  const getPortalPath = () => {
    if (!user?.role) return "/";
    const r = user.role.toLowerCase();
    if (r === "cultivater" || r === "cultivator") return "/portal/cultivator";
    if (r === "customer") return "/portal/customer";
    if (r === "admin") return "/portal/admin";
    if (r === "superadmin") return "/portal/superadmin";
    if (r === "trainee") return "/portal/trainee";
    if (r === "trainer") return "/portal/trainer";
    return "/";
  };

  const getRoleDisplayName = () => {
    if (!user?.role) return "User";
    const r = user.role.toLowerCase();
    if (r === "cultivater" || r === "cultivator") return "Cultivator";
    if (r === "customer") return "Customer";
    if (r === "admin") return "Admin";
    if (r === "superadmin") return "Super Admin";
    if (r === "trainee") return "Trainee";
    if (r === "trainer") return "Trainer";
    return "Member";
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Super Admin Global Version Broadcast Announcement Ribbon */}
      {versionData.announcement && !bannerDismissed && (
        <div className="superadmin-top-ribbon">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ribbon-pulse-dot"></span>
              <span style={{ fontWeight: 600 }}>{versionData.announcement}</span>
              <span className="ribbon-version-pill">v{versionData.version}</span>
            </div>
            <button
              type="button"
              className="ribbon-close-btn"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Public / Guest Site Navigation Bar */}
      <header className="main-site-header">
        <div className="container modern-nav-wrap">
          {/* Brand Logo with Version Pill */}
          <Link className="modern-brand" to="/" onClick={close}>
            <div className="brand-logo-icon">🍄</div>
            <div className="brand-text-wrap">
              <span className="brand-title">
                Mushroom<span className="brand-accent">Hub</span>
              </span>
              <span className="brand-badge-version">v{versionData.version}</span>
            </div>
          </Link>

          {/* Central Main Site Nav Links */}
          <nav className={`modern-nav-menu ${open ? "open" : ""}`}>
            <NavLink to="/" end onClick={close} className="animated-nav-item">
              Home
            </NavLink>
            <NavLink to="/marketplace" onClick={close} className="animated-nav-item">
              Marketplace
            </NavLink>
            <NavLink to="/resources" onClick={close} className="animated-nav-item">
              Guides
            </NavLink>
            <NavLink to="/about" onClick={close} className="animated-nav-item">
              About
            </NavLink>

            {/* Mobile Drawer Auth Actions */}
            <div className="mobile-drawer-auth-actions">
              {user?.isLoggedIn ? (
                <>
                  <Link
                    to={getPortalPath()}
                    onClick={close}
                    className="button button-green"
                    style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13, fontWeight: 700 }}
                  >
                    🌿 Go to {getRoleDisplayName()} Portal →
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      handleSignOut();
                    }}
                    className="button button-outline"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "10px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#b83333",
                      borderColor: "#e89898"
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={close}
                    className="button button-outline"
                    style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, fontWeight: 700 }}
                  >
                    🔑 Login (Choose Account)
                  </Link>
                  <Link
                    to="/signup"
                    onClick={close}
                    className="button button-green"
                    style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, fontWeight: 700 }}
                  >
                    ✨ Join (Create Account)
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Right-Hand Actions: Cart, Login/Join or User Portal */}
          <div className="modern-nav-actions">
            {/* Cart Link with Badge */}
            <Link
              className="modern-cart-btn"
              to="/cart"
              aria-label={`Shopping cart with ${count} items`}
              title="View your shopping basket"
            >
              <span>🛒</span>
              {count > 0 && <span className="modern-cart-counter">{count}</span>}
            </Link>

            {/* When Logged In: Show User Portal Pill & Sign Out */}
            {user?.isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link
                  to={getPortalPath()}
                  title={`Open ${getRoleDisplayName()} Portal`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 15px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%)",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "1px solid rgba(203, 161, 77, 0.45)",
                    boxShadow: "0 2px 8px rgba(12, 36, 23, 0.15)"
                  }}
                >
                  <span style={{ fontSize: 14 }}>🌿</span>
                  <span>{user.name ? `${user.name.split(" ")[0]}'s Portal` : "My Portal"} →</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out of Session"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(200, 50, 50, 0.1)",
                    border: "1px solid rgba(200, 50, 50, 0.3)",
                    color: "#b83333",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  className="nav-login-btn"
                  to="/login"
                  title="Log in to your account (Select Cultivator, Customer, Trainee, etc.)"
                >
                  Login
                </Link>

                <Link
                  className="nav-join-btn"
                  to="/signup"
                  title="Join MushroomHub & create a new account"
                >
                  Join
                </Link>
              </>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              className="modern-menu-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
