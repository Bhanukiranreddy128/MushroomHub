import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AccountNavbars.css";

export default function TrainerNavbar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    logout();
    navigate("/login");
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "TN";

  return (
    <>
      {/* Top Announcement & Utility Context Bar */}
      <div className="top-utility-bar" data-purpose="top-utility-bar">
        <div className="top-utility-inner account-utility-inner">
          <div className="top-utility-left">
            <span className="live-exchange-badge" style={{ color: "#a855f7" }}>
              <span className="live-pulse-dot" style={{ background: "#a855f7", boxShadow: "0 0 8px #a855f7" }}></span>
              Instructor Curriculum &amp; Spore Culture Verification Active
            </span>
            <span className="utility-sep">•</span>
            <span className="dispatch-text">Next Masterclass Session: 03:00 PM IST (Sterile Cleanrooms)</span>
          </div>
          <div className="top-utility-right">
            <Link to="/resources" className="utility-link">Lab Assay Reports</Link>
            <span className="utility-sep">•</span>
            <span className="elevation-text">Research Lab: Grade-A Sterilized</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="site-header-modern">
        <div className="site-header-inner account-header-inner">
          {/* Brand & Identity Section: Firmly at Left Side */}
          <div className="brand-left-zone account-brand-zone" data-purpose="brand-logo">
            <Link to="/portal/trainer" className="brand-footer-style-wrap" title="Trainer Academy Portal">
              <div className="brand-footer-logo-icon">
                <span>📋</span>
              </div>
              <div className="brand-footer-text-col">
                <div className="brand-footer-title">
                  <span>Mushroom</span><span className="brand-footer-gold">Hub</span>
                </div>
                <div className="brand-footer-sub">
                  <span className="brand-footer-portal-name">Trainer Academy</span>
                  <span className="buyer-view-pill" style={{ background: "#f3e8ff", color: "#7e22ce", borderColor: "#e9d5ff" }}>
                    INSTRUCTOR VIEW
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs (Center Pill Array) */}
          <nav className="center-pill-nav" data-purpose="main-navigation" aria-label="Trainer Navigation Tabs">
            <ul className="pill-list">
              <li>
                <NavLink
                  to="/portal/trainer"
                  end
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span>👥</span>
                  <span>Trainee Roster</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/resources"
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span>📝</span>
                  <span>Curriculum &amp; Formulas</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/marketplace"
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span>🍄</span>
                  <span>Live Species Directory</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) => `pill-item ${isActive ? "active" : ""}`}
                >
                  <span style={{ fontSize: 13 }}>🏠</span>
                  <span>Main Home</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Right User Controls Section */}
          <div className="right-user-controls" data-purpose="user-actions">
            {/* User Identity Pill with Dropdown */}
            <div className="user-identity-wrap" ref={profileRef}>
              <div
                className="user-identity-pill"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                role="button"
                tabIndex={0}
                title="Trainer Account Menu"
              >
                <div className="user-avatar-wrap">
                  <div className="user-avatar-circle" style={{ background: "linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)" }}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="User" />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>
                  <span className="online-indicator"></span>
                </div>
                <div className="user-identity-text">
                  <span className="user-identity-name">{user?.name || "Trainer"}</span>
                  <span className="user-identity-tier">Senior Instructor Tier</span>
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
                    width: "270px",
                    background: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 14px 40px rgba(0, 0, 0, 0.14)",
                    border: "1px solid #e9d5ff",
                    overflow: "hidden",
                    zIndex: 1050,
                    animation: "fadeInDown 0.18s ease"
                  }}
                >
                  <div style={{ padding: "16px 18px", background: "#faf5ff", borderBottom: "1px solid #f3e8ff" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7e22ce" }}>
                      Authorized Instructor Session
                    </div>
                    <strong style={{ fontSize: 14, color: "#581c87", display: "block", marginTop: 2 }}>
                      {user?.name || "Mycologist Trainer"}
                    </strong>
                    <div style={{ fontSize: 12, color: "#9333ea", marginTop: 2 }}>
                      {user?.email || "trainer@mushroomhub.com"}
                    </div>
                  </div>

                  <div style={{ padding: "6px" }}>
                    <Link
                      to="/portal/trainer"
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
                        color: "#0f172a",
                        borderRadius: "8px"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>👥</span>
                      <span>Manage Trainee Roster</span>
                    </Link>

                    <Link
                      to="/resources"
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
                        color: "#0f172a",
                        borderRadius: "8px"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>📝</span>
                      <span>Substrate &amp; Climate Curricula</span>
                    </Link>
                  </div>

                  <div style={{ borderTop: "1px solid #f3e8ff", padding: "6px" }}>
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
                      <span>Sign Out of Trainer Account</span>
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
    </>
  );
}
