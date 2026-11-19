import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCart } from "../../data";
import "./AccountNavbars.css";

export default function CustomerNavbar() {
  const [cartCount, setCartCount] = useState(() =>
    getCart().reduce((sum, item) => sum + item.quantity, 0)
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCartUpdate = () => {
      setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    };
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleOpenProfile = () => {
    setProfileMenuOpen(false);
    navigate("/portal/customer?tab=profile");
    window.dispatchEvent(new CustomEvent("customer-tab-changed", { detail: "profile" }));
  };

  const handleOpenOrders = () => {
    setProfileMenuOpen(false);
    navigate("/portal/customer?tab=orders");
    window.dispatchEvent(new CustomEvent("customer-tab-changed", { detail: "orders" }));
  };

  const handleOpenBargains = () => {
    setProfileMenuOpen(false);
    navigate("/portal/customer?tab=bargains");
    window.dispatchEvent(new CustomEvent("customer-tab-changed", { detail: "bargains" }));
  };

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    logout();
    navigate("/login");
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : "CU");

  return (
    <>
      {/* BEGIN: Top Announcement & Utility Context Bar */}
      <div className="top-utility-bar" data-purpose="top-utility-bar">
        <div className="top-utility-inner customer-utility-inner">
          <div className="top-utility-left">
            <span className="dispatch-text">Next Dispatch: 04:30 PM IST (Cold-Chain Verified)</span>
          </div>
          <div className="top-utility-right">
            <Link to="/resources" className="utility-link">Lab Assay Reports</Link>
            <span className="utility-sep">•</span>
            <span className="elevation-text">Himalayan Elevation: 2,180m</span>
          </div>
        </div>
      </div>
      {/* END: Top Announcement */}

      {/* BEGIN: MainHeader */}
      <header className="site-header-modern">
        <div className="site-header-inner customer-header-inner">
          {/* Brand & Identity Section: Positioned firmly at the left side */}
          <div className="brand-left-zone customer-brand-zone" data-purpose="brand-logo">
            <Link to="/portal/customer" className="brand-footer-style-wrap" title="Customer Portal">
              {/* Logo Icon same like footer */}
              <div className="brand-footer-logo-icon">
                <span>🍄</span>
              </div>

              {/* Brand Names same like footer */}
              <div className="brand-footer-text-col">
                <div className="brand-footer-title">
                  <span>Mushroom</span><span className="brand-footer-gold">Hub</span>
                </div>
                <div className="brand-footer-sub">
                  <span className="brand-footer-portal-name">Customer Portal</span>
                  <span className="buyer-view-pill">BUYER VIEW</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs (Center Pill Array) */}
          <nav className="center-pill-nav" data-purpose="main-navigation" aria-label="Customer Navigation Tabs">
            <ul className="pill-list">
              {/* Tab: Live Harvest Feed with Live Dot */}
              <li>
                <NavLink
                  to="/portal/customer"
                  end
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span className="live-dot-wrap">
                    <span className="live-dot-ping"></span>
                    <span className="live-dot-core"></span>
                  </span>
                  <span>Live Harvest Feed</span>
                </NavLink>
              </li>

              {/* Tab: Marketplace */}
              <li>
                <NavLink
                  to="/marketplace"
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Marketplace</span>
                </NavLink>
              </li>

              {/* Tab: My Basket */}
              <li>
                <NavLink
                  to="/cart"
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>My Basket</span>
                  <span className="basket-amber-badge">{cartCount > 0 ? cartCount : 2}</span>
                </NavLink>
              </li>

              {/* Tab: Bargains */}
              <li>
                <NavLink
                  to="/portal/customer?tab=bargains"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("customer-tab-changed", { detail: "bargains" }));
                  }}
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span style={{ fontSize: 13 }}>🤝</span>
                  <span>Bargains</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Right User Controls Section */}
          <div className="right-user-controls" data-purpose="user-actions">
            {/* Cart Quick Icon Button */}
            <Link to="/cart" className="quick-cart-btn" aria-label="Quick Cart" title="View shopping basket">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span className="quick-cart-badge">{cartCount > 0 ? cartCount : 2}</span>
            </Link>

            {/* User Identity Pill with Dropdown */}
            <div className="user-identity-wrap" ref={profileRef}>
              <div
                className="user-identity-pill"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                role="button"
                tabIndex={0}
                title="Customer Account Menu"
              >
                <div className="user-avatar-wrap">
                  <div className="user-avatar-circle">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="User" />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>
                  <span className="online-indicator"></span>
                </div>
                <div className="user-identity-text">
                  <span className="user-identity-name">{user?.name || "Customer"}</span>
                  <span className="user-identity-tier">Master Chef Tier</span>
                </div>
                <svg className="chevron-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: "280px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 14px 40px rgba(17, 56, 34, 0.16)",
                    border: "1px solid #e1e8dc",
                    overflow: "hidden",
                    zIndex: 1001
                  }}
                >
                  <div style={{ padding: "16px 18px", background: "#f8fbf7", borderBottom: "1px solid #e7eee2" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#142319" }}>
                      {user?.name || "Customer"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6e7f6e", marginTop: 2 }}>
                      {user?.email || ""}
                    </div>
                    <span className="buyer-view-pill" style={{ marginTop: 8 }}>
                      VERIFIED BUYER ACCOUNT
                    </span>
                  </div>

                  <div style={{ padding: "6px" }}>
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#1f3829",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f7f1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>👤</span>
                      <span>Manage Delivery &amp; Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenOrders}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#1f3829",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f7f1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>📦</span>
                      <span>My Orders &amp; Live Tracking</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenBargains}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#1f3829",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f7f1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>🤝</span>
                      <span>Price Bargains &amp; Deals</span>
                    </button>

                    <Link
                      to="/cart"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#1f3829",
                        borderRadius: "8px"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f7f1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>🛒</span>
                      <span>View Basket &amp; Checkout</span>
                    </Link>
                  </div>

                  <div style={{ borderTop: "1px solid #eef3ec", padding: "6px" }}>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#be123c",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>🚪</span>
                      <span>Sign Out of Customer Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Action Button */}
            <button className="signout-rose-btn" onClick={handleSignOut} type="button">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>
      {/* END: MainHeader */}
    </>
  );
}
