import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearNotifications,
  formatNotificationTime,
  getRealtimeNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../data/store";

export default function RealtimeNotificationBell({ onNavigate }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getRealtimeNotifications());
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Synchronize notifications across storage & custom events
  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getRealtimeNotifications());
    };
    const handleStorage = (e) => {
      if (e.key === "mushroomhub_cultivator_notifications") {
        setNotifications(getRealtimeNotifications());
      }
    };

    window.addEventListener("mushroomhub-notifications-updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("mushroomhub-notifications-updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = (e) => {
    if (e) e.stopPropagation();
    const updated = markAllNotificationsAsRead();
    setNotifications(updated || []);
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    const updated = clearNotifications();
    setNotifications(updated || []);
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setNotifOpen(false);
    if (onNavigate) {
      onNavigate(notif);
    } else if (notif.orderId) {
      navigate("/portal/cultivator");
    } else if (notif.bargainId) {
      navigate("/portal/cultivator");
    }
  };

  return (
    <div className="notif-wrapper" ref={notifRef} style={{ position: "relative" }}>
      {/* Real-Time Bell Button */}
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setNotifOpen(!notifOpen)}
        aria-label="Real-time Notifications"
        title="Real-time Notifications"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "1px solid #d7e2d2",
          background: "#ffffff",
          color: "#1e3a24",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          transition: "all 0.2s ease"
        }}
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span className="notif-unread-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {unreadCount > 0 && <span className="notif-pulse-ring"></span>}
      </button>

      {/* Real-Time Popover Dropdown */}
      {notifOpen && (
        <div className="notif-dropdown">
          {/* Header */}
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
                  onClick={handleClearAll}
                  title="Clear all notifications"
                >
                  🗑️ Clear all
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="notif-dropdown-body">
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#6a7b68" }}>
                <span style={{ fontSize: 38, display: "block", marginBottom: 10 }}>🔔</span>
                <strong style={{ fontSize: 14, color: "#193520", display: "block" }}>All Caught Up!</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6a7b68" }}>
                  No new notifications right now. Order, harvest, and audit alerts will appear here in real-time.
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

          {/* Footer with Clear All Option */}
          {notifications.length > 0 && (
            <div className="notif-dropdown-footer" style={{ padding: "10px 14px", borderTop: "1px solid #eef2ed", background: "#fbfcfb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {notifications.length} notification{notifications.length === 1 ? "" : "s"} total
              </span>
              <button
                type="button"
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#dc2626",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.18s ease"
                }}
                onClick={handleClearAll}
                title="Remove all notifications"
              >
                <span>🗑️</span> Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
