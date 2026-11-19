import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getBargainOffersForCultivator,
  getCultivatorProfile,
  getCustomerOrders
} from "../../data/store";
import "./AccountNavbars.css";

const CULTIVATOR_TABS = [
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "sales", label: "Sales Analytics", icon: "📊" },
  { id: "feed", label: "Harvest Feed", icon: "🍄" },
  { id: "knowledge", label: "Species Hub", icon: "📚" },
  { id: "bank", label: "Bank & UPI", icon: "🏦" },
  { id: "profile", label: "Farm Profile", icon: "👤" }
];

export default function CultivatorNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState(getCustomerOrders);
  const [bargains, setBargains] = useState(() => getBargainOffersForCultivator(user));
  const [profile, setProfile] = useState(getCultivatorProfile);

  // Listen for tab changes from portal and updates to orders
  useEffect(() => {
    const handleActiveTab = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    const handleOrders = () => setOrders(getCustomerOrders());
    const handleBargains = () => setBargains(getBargainOffersForCultivator(user));
    const handleProfile = () => setProfile(getCultivatorProfile());

    window.addEventListener("cultivator-active-tab-updated", handleActiveTab);
    window.addEventListener("cultivator-orders-updated", handleOrders);
    window.addEventListener("mushroomhub-bargains-updated", handleBargains);
    window.addEventListener("cultivator-profile-updated", handleProfile);

    return () => {
      window.removeEventListener("cultivator-active-tab-updated", handleActiveTab);
      window.removeEventListener("cultivator-orders-updated", handleOrders);
      window.removeEventListener("mushroomhub-bargains-updated", handleBargains);
      window.removeEventListener("cultivator-profile-updated", handleProfile);
    };
  }, [user]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (!window.location.pathname.startsWith("/portal/cultivator")) {
      navigate(`/portal/cultivator?tab=${tabId}`);
    } else {
      window.dispatchEvent(new CustomEvent("cultivator-tab-changed", { detail: tabId }));
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const pendingOrders = orders.filter((o) => o.deliveryStatus !== "Delivered").length;
  const pendingBargains = bargains.filter((b) => b.status === "pending" || b.status === "customer_countered").length;

  const cultivatorName = profile.growerName || user?.name || "Bhanukiran";
  const userInitials = cultivatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Top Announcement & Utility Context Bar */}
      <div className="top-utility-bar" data-purpose="top-utility-bar">
        <div className="top-utility-inner account-utility-inner">
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

      {/* Main Header */}
      <header className="site-header-modern">
        <div className="site-header-inner account-header-inner">
          {/* Brand & Identity Section: Positioned firmly at the left side */}
          <div className="brand-left-zone account-brand-zone" data-purpose="brand-logo">
            <Link to="/portal/cultivator" className="brand-footer-style-wrap" title="Cultivator Portal Home">
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
                  <span className="brand-footer-portal-name">Cultivator Portal</span>
                  <span className="buyer-view-pill">CULTIVATOR VIEW</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs (Center Pill Array) */}
          <nav className="center-pill-nav" data-purpose="main-navigation" aria-label="Cultivator Navigation Tabs">
            <ul className="pill-list">
              {CULTIVATOR_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      className={`pill-item ${isActive ? "active" : ""}`}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.id === "orders" && (pendingOrders > 0 || pendingBargains > 0) && (
                        <span className="basket-amber-badge">
                          {pendingOrders + pendingBargains}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right User Controls Section */}
          <div className="right-user-controls" data-purpose="user-actions">
            {/* User Identity Pill */}
            <div
              className="user-identity-pill"
              onClick={() => handleTabClick("profile")}
              role="button"
              tabIndex={0}
              title="Click to view cultivator profile"
            >
              <div className="user-avatar-wrap">
                <div className="user-avatar-circle">
                  {profile.avatarPhoto || user?.avatar ? (
                    <img src={profile.avatarPhoto || user?.avatar} alt="Grower" />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
                <span className="online-indicator"></span>
              </div>
              <div className="user-identity-text">
                <span className="user-identity-name">{cultivatorName}</span>
                <span className="user-identity-tier">Lead Cultivator Tier</span>
              </div>
              <svg className="chevron-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
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
