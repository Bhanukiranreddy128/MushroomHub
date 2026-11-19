import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  clearNotifications,
  createCustomerOrder,
  formatNotificationTime,
  getBargainOffersForCultivator,
  getCultivatorProfile,
  getCustomerOrdersForCultivator,
  getRealtimeNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../../data/store";
import BankDetails from "./BankDetails";
import CultivatorProfile from "./CultivatorProfile";
import CustomerOrders from "./CustomerOrders";
import FeedManager from "./FeedManager";
import MushroomKnowledge from "./MushroomKnowledge";
import SalesDashboard from "./SalesDashboard";

export default function CultivatorPortal() {
  const { user, logout, loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_CULTIVATOR_TABS = ["orders", "sales", "feed", "knowledge", "bank", "profile"];
  const urlTab = searchParams.get("tab");
  const activeTab = urlTab && VALID_CULTIVATOR_TABS.includes(urlTab) ? urlTab : "orders";

  const setActiveTab = (newTab) => {
    if (newTab === activeTab) return;
    setSearchParams({ tab: newTab });
  };

  const [openPostModalOnMount, setOpenPostModalOnMount] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [orders, setOrders] = useState(() => getCustomerOrdersForCultivator(user));
  const [notifications, setNotifications] = useState(getRealtimeNotifications);
  const [bargains, setBargains] = useState(() => getBargainOffersForCultivator(user));
  const [cultivatorProfile, setCultivatorProfile] = useState(() => getCultivatorProfile(user));
  const notifRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const handleOpenPostModal = () => {
    setActiveTab("feed");
    setOpenPostModalOnMount(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-mushroom-post-modal"));
    }, 40);
    setMobileMenuOpen(false);
  };

  // Listen for tab changes from Cultivator Navbar and broadcast active tab
  useEffect(() => {
    const handleTabChange = (e) => {
      if (e.detail && VALID_CULTIVATOR_TABS.includes(e.detail)) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("cultivator-tab-changed", handleTabChange);
    return () => window.removeEventListener("cultivator-tab-changed", handleTabChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cultivator-active-tab-updated", { detail: activeTab }));
  }, [activeTab]);

  // Listen for real-time order, notification, and profile events
  useEffect(() => {
    const handleOrdersUpdate = (e) => {
      const freshOrders = getCustomerOrdersForCultivator(user);
      setOrders(freshOrders);
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        const latest = e.detail[0];
        if (latest && latest.orderId) {
          showToast(`🔔 Real-time order #${latest.orderId} received from ${latest.customerName}!`);
        }
      }
    };
    const handleNotifsUpdate = () => setNotifications(getRealtimeNotifications());
    const handleProfileUpdate = () => setCultivatorProfile(getCultivatorProfile(user));
    const handleBargainsUpdate = () => setBargains(getBargainOffersForCultivator(user));

    const handleStorageChange = (e) => {
      if (e.key === "mushroomhub_customer_orders") {
        setOrders(getCustomerOrdersForCultivator(user));
      } else if (e.key === "mushroomhub_realtime_notifications" || e.key === "mushroomhub_cultivator_notifications") {
        setNotifications(getRealtimeNotifications());
      } else if (e.key === "mushroomhub_price_bargains") {
        setBargains(getBargainOffersForCultivator(user));
      }
    };

    window.addEventListener("cultivator-orders-updated", handleOrdersUpdate);
    window.addEventListener("mushroomhub-notifications-updated", handleNotifsUpdate);
    window.addEventListener("cultivator-profile-updated", handleProfileUpdate);
    window.addEventListener("mushroomhub-bargains-updated", handleBargainsUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cultivator-orders-updated", handleOrdersUpdate);
      window.removeEventListener("mushroomhub-notifications-updated", handleNotifsUpdate);
      window.removeEventListener("cultivator-profile-updated", handleProfileUpdate);
      window.removeEventListener("mushroomhub-bargains-updated", handleBargainsUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user]);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
    showToast("All notifications marked as read.");
  };

  const handleClearAllNotifications = () => {
    const updated = clearNotifications();
    setNotifications(updated || []);
    showToast("All real-time notifications cleared.");
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setNotifOpen(false);
    if (notif.bargainId || notif.type === "bargain") {
      setActiveTab("orders");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cultivator-orders-view-mode-changed", { detail: "bargains" }));
      }, 40);
    } else if (notif.orderId || notif.type === "order" || notif.type === "delivery") {
      setActiveTab("orders");
    } else if (notif.type === "feed") {
      setActiveTab("feed");
    } else if (notif.type === "payment") {
      setActiveTab("bank");
    }
  };

  const handleSimulateIncomingOrder = () => {
    const profile = getCultivatorProfile(user);
    const farmName = user?.farmName || profile?.farmName || "Himalayan Forest Spores & Myco Farm";
    const userEmail = (user?.email || profile?.email || "cultivator@mushroomhub.com").toLowerCase().trim();
    const userId = user?.id || (userEmail ? `user-${userEmail}` : "user-cultivator-01");
    const farmLocation = user?.location || profile?.location || "Dehradun, Uttarakhand";

    const sample = {
      customerName: "Chef Ranveer (The Spice Bistro)",
      customerPhone: "+91 98450 11990",
      farmName,
      farmerEmail: userEmail,
      cultivatorEmail: userEmail,
      cultivatorId: userId,
      pickupLocation: `${farmName} (${farmLocation})`,
      deliveryAddress: {
        street: "Plot 88, Mussoorie Diversion Road",
        locality: "Rajpur",
        city: "Dehradun",
        state: "Uttarakhand",
        pincode: "248009"
      },
      items: [
        {
          name: "Fresh Blue Oyster Clusters",
          category: "Oyster",
          quantity: 6,
          unit: "kg",
          unitPrice: 350,
          total: 2100,
          farm: farmName,
          farmName: farmName,
          farmerEmail: userEmail,
          cultivatorEmail: userEmail,
          cultivatorId: userId
        }
      ],
      shipments: [
        {
          farmName,
          farmerEmail: userEmail,
          cultivatorEmail: userEmail,
          pickupLocation: `${farmName} (${farmLocation})`,
          itemNames: ["6x Fresh Blue Oyster Clusters"],
          itemCount: 1,
          weightKg: 6
        }
      ],
      variety: "Fresh Blue Oyster Clusters",
      quantity: 6,
      total: 2100,
      deliveryPartner: "Blue Dart Cold-Chain Express",
      estimatedDelivery: "Today by 6:00 PM",
      deliveryNotes: "Call driver upon reaching gate #2."
    };

    const newOrd = createCustomerOrder(sample);
    showToast(`🔔 Real-time order #${newOrd.orderId} received from ${newOrd.customerName}!`);
  };

  const isCultivatorRole = user?.role === "cultivater" || user?.role === "cultivator";
  const isCultivatorAuthenticated = isCultivatorRole && user?.isLoggedIn;

  const unreadNotifs = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifs.length;
  const pendingOrdersCount = orders.filter((o) => o.deliveryStatus === "Pending Dispatch").length;
  const pendingBargainsCount = bargains.filter((b) => b.status === "pending" || b.status === "customer_countered").length;

  if (!isCultivatorAuthenticated) {
    return (
      <div className="portal-wrapper">
        <div className="container" style={{ maxWidth: 540, margin: "50px auto 90px" }}>
          <div className="hub-card" style={{ padding: "40px 32px", textAlign: "center", boxShadow: "0 16px 45px rgba(25, 45, 30, 0.08)" }}>
            <span style={{ fontSize: 48 }}>🛡️</span>
            <h2 style={{ font: "700 24px Manrope", color: "#1f3829", margin: "14px 0 8px" }}>
              Cultivator Authentication Required
            </h2>
            <div className="status-badge" style={{ background: "#fef3c7", color: "#92400e", display: "inline-block", marginBottom: 16 }}>
              Protected Commercial Grower Workspace
            </div>
            <p style={{ fontSize: 14, color: "#607261", lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 440 }}>
              To post fresh mushroom harvests, manage your feed, and review customer delivery orders, you must be logged into a verified <strong>Cultivator</strong> account.
            </p>

            <div style={{ background: "#f6f8f5", border: "1px solid #e1e9dc", borderRadius: 10, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#315438", marginBottom: 6 }}>
                Current session status:
              </div>
              <div style={{ fontSize: 13, color: "#1f3829", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{user?.isLoggedIn ? "👤" : "🔒"}</span>
                <span>Active as <strong>{user?.isLoggedIn ? user?.name : "Not Logged In (Guest)"}</strong></span>
                {user?.role && (
                  <span className="role-badge-pill" style={{ background: "#e8eff7", color: "#1c4a79", fontSize: 10 }}>
                    {user?.role}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6e7f6e", marginTop: 8 }}>
                Grower credentials: <strong>cultivator@mushroomhub.com</strong> / <strong>password123</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="button button-green"
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14 }}
                onClick={() => {
                  loginWithCredentials("cultivater", "cultivator@mushroomhub.com", "password123");
                }}
              >
                ⚡ Sign In with Cultivator Credentials (1-Click) →
              </button>
              <Link
                to="/login/cultivater"
                className="button button-outline"
                style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13 }}
              >
                Log In With Custom Account Credentials
              </Link>
              <Link
                to="/"
                className="button button-outline"
                style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13, borderColor: "#ddd", color: "#666" }}
              >
                ← Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      id: "orders",
      label: "Customer Orders & Delivery",
      icon: "📦",
      subtitle: "Live Customer Orders & Tracking",
      badge: (pendingOrdersCount + pendingBargainsCount) > 0 ? `${pendingOrdersCount + pendingBargainsCount} Pending` : `${orders.length} Orders`
    },
    { id: "sales", label: "Sales Dashboard", icon: "📊", subtitle: "Earnings & Category Sales in ₹" },
    { id: "feed", label: "Mushroom Feed & Listings", icon: "🌾", subtitle: "Upload Device Photo & Live Customer Sync" },
    { id: "knowledge", label: "Mushroom History & Climates", icon: "📚", subtitle: "16 World Species Guide" },
    { id: "bank", label: "Bank Details & Payouts", icon: "🏦", subtitle: "Enter Coordinates & Direct UPI" },
    { id: "profile", label: "Cultivator Profile", icon: "🌱", subtitle: "Farm Specs & Organic Certs" }
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="cultivator-layout">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999
          }}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`cultivator-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        {/* Farm & Grower Identity (Reflects Cultivator Profile Live) */}
        <div className="sidebar-farm-identity">
          <div className="sidebar-avatar-wrap">
            <img
              src={cultivatorProfile.avatarPhoto || user?.avatar || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"}
              alt="Farm"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className="sidebar-farm-info">
            <span className="sidebar-grower-role">
              {user?.authProvider === "google" ? "Google Verified Cultivator" : "Lead Cultivator"}
            </span>
            <h3 className="sidebar-farm-name">
              {cultivatorProfile.farmName || user?.farmName || "Himalayan Forest Spores Farm"}
            </h3>
            <span className="status-badge paid" style={{ fontSize: 10, padding: "2px 8px" }}>
              ✓ {cultivatorProfile.growerName || user?.name || "Verified Grower"}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-heading">Cultivator Workspace</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div className="sidebar-nav-label">{item.label}</div>
                  <div className="sidebar-nav-sub">{item.subtitle}</div>
                </div>
                {item.badge && (
                  <span
                    className="tab-badge"
                    style={{
                      fontSize: 10,
                      background: item.id === "orders" && pendingOrdersCount > 0 ? "#e75034" : "#e8efe5",
                      color: item.id === "orders" && pendingOrdersCount > 0 ? "#fff" : "#244a2b"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Post Action in Sidebar */}
        <div style={{ padding: "16px 18px", borderTop: "1px solid #e1e8dc" }}>
          <button
            className="button button-green"
            style={{ width: "100%", fontSize: 12, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onClick={handleOpenPostModal}
          >
            <span>＋</span>
            <span>Post Mushroom (PC / Mobile)</span>
          </button>
        </div>

        {/* Sidebar Footer: Cultivator Account & Sign Out */}
        <div className="sidebar-footer" style={{ borderTop: "1px solid #e1e9dc", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#315f3a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0
              }}
            >
              {(cultivatorProfile.growerName || user?.name || "C").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1f3829", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cultivatorProfile.growerName || user?.name || "Cultivator"}
              </div>
              <div style={{ fontSize: 10, color: "#6e7f6e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email || "cultivator@mushroomhub.com"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login/cultivater");
            }}
            className="button button-outline"
            style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 10px", borderColor: "#c47a74", color: "#8d3e33" }}
            title="Securely sign out of cultivator workspace"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="cultivator-main-content">
        {/* Top Navbar with Realtime Notification Icon */}
        <div className="cultivator-topbar">
          <button
            className="cultivator-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Sidebar"
          >
            ☰ Menu
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{currentNav.icon}</span>
              <h1 style={{ font: "700 22px Manrope", color: "#1f3829", margin: 0 }}>
                {currentNav.label}
              </h1>
            </div>
            <div style={{ fontSize: 12, color: "#697767", marginTop: 2 }}>
              {currentNav.subtitle}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Live Sync Pill */}
            <div className="live-sync-pill" style={{ background: "#edf7ec", padding: "6px 12px", borderRadius: 20 }}>
              <span className="pulse-dot"></span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#23592c" }}>
                Live Cloud Sync (₹ INR)
              </span>
            </div>

            {/* REAL-TIME NOTIFICATION ICON AT TOP */}
            <div className="notif-wrapper" ref={notifRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Real-time Notifications"
                title="Real-time Order & Delivery Notifications"
              >
                <span style={{ fontSize: 19 }}>🔔</span>
                {unreadCount > 0 && (
                  <span className="notif-unread-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {unreadCount > 0 && <span className="notif-pulse-ring"></span>}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <div className="notif-header-title-wrap">
                      <span className="notif-header-title">Real-time Notifications</span>
                      <span className="notif-live-pill">
                        <span className="notif-live-dot"></span>
                        <span>Live Sync</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notif-clear-btn"
                          onClick={handleMarkAllRead}
                          title="Mark all notifications as read"
                        >
                          ✓ Read all
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          className="notif-clear-btn"
                          style={{
                            background: "rgba(239, 68, 68, 0.25)",
                            borderColor: "rgba(239, 68, 68, 0.5)",
                            color: "#ffffff"
                          }}
                          onClick={handleClearAllNotifications}
                          title="Clear all notifications"
                        >
                          🗑️ Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="notif-dropdown-body">
                    {notifications.length === 0 ? (
                      <div style={{ padding: "36px 20px", textAlign: "center", color: "#6a7b68" }}>
                        <span style={{ fontSize: 38, display: "block", marginBottom: 10 }}>🔔</span>
                        <strong style={{ fontSize: 14, color: "#193520", display: "block" }}>All Caught Up!</strong>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6a7b68" }}>
                          New incoming customer orders and harvest updates will alert here in real-time.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notif-card-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className={`notif-card-icon-wrap ${notif.type || "system"}`}>
                            {notif.icon || (notif.orderId ? "📦" : "🔔")}
                          </div>

                          <div className="notif-card-content">
                            <div className="notif-card-header">
                              <h4 className="notif-card-title">{notif.title}</h4>
                              {!notif.read && <span className="notif-card-unread-badge">NEW</span>}
                            </div>

                            <p className="notif-card-message">{notif.message}</p>

                            <div className="notif-card-footer">
                              <span className="notif-card-time" title={notif.createdAt || notif.timestamp}>
                                <span>🕒</span>
                                <span>{formatNotificationTime(notif)}</span>
                              </span>
                              <span className="notif-card-action-hint">
                                {notif.orderId ? "View Order →" : "Details →"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notif-dropdown-footer" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="button button-outline"
                        style={{
                          flex: 1,
                          fontSize: 11.5,
                          padding: "8px 10px",
                          color: "#dc2626",
                          borderColor: "#fca5a5",
                          background: "#fff5f5",
                          display: "inline-flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 5,
                          fontWeight: 700
                        }}
                        onClick={handleClearAllNotifications}
                        title="Remove all notifications"
                      >
                        <span>🗑️</span> Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      className="button button-outline"
                      style={{
                        flex: notifications.length > 0 ? 1 : 2,
                        fontSize: 11.5,
                        padding: "8px 10px",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 700
                      }}
                      onClick={handleSimulateIncomingOrder}
                    >
                      <span>⚡</span> Test Alert
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Post Fresh Mushroom Action in Topbar */}
            <button
              type="button"
              className="button button-green"
              style={{ padding: "7px 15px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
              onClick={handleOpenPostModal}
              title="Post fresh mushroom to feed"
            >
              <span>＋</span>
              <span>Post Mushroom</span>
            </button>
          </div>
        </div>

        {/* Dynamic Section Content */}
        <div className="cultivator-content-body">
          {activeTab === "orders" && <CustomerOrders onToast={showToast} />}
          {activeTab === "sales" && <SalesDashboard onToast={showToast} />}
          {activeTab === "feed" && (
            <FeedManager
              onToast={showToast}
              autoOpenAddModal={openPostModalOnMount}
              onModalOpened={() => setOpenPostModalOnMount(false)}
            />
          )}
          {activeTab === "knowledge" && <MushroomKnowledge />}
          {activeTab === "bank" && <BankDetails onToast={showToast} />}
          {activeTab === "profile" && <CultivatorProfile onToast={showToast} />}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
