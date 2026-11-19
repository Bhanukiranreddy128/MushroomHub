import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getBargainOffersForCultivator,
  getCustomerOrdersForCultivator,
  saveCustomerOrders,
  updateOrderDeliveryStatus
} from "../../data/store";
import { getCultivatorOrders } from "../../services/cultivatorProductService";
import CultivatorBargains from "./CultivatorBargains";

export default function CustomerOrders({ onToast }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(() => getCustomerOrdersForCultivator(user));
  const [bargains, setBargains] = useState(() => getBargainOffersForCultivator(user));
  const [viewMode, setViewMode] = useState("orders"); // "orders" | "bargains"
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSlipOrder, setActiveSlipOrder] = useState(null);

  const syncOrders = useCallback(async () => {
    const local = getCustomerOrdersForCultivator(user);
    let merged = [...local];

    try {
      // 1. Fetch remote orders from Spring Boot PostgreSQL backend
      const remote = await getCultivatorOrders();
      if (remote && Array.isArray(remote) && remote.length > 0) {
        // Map remote orders
        const mappedRemote = remote.map((o) => {
          let parsedItems = [];
          let parsedShipments = [];
          try { if (o.itemsJson) parsedItems = JSON.parse(o.itemsJson); } catch { /* ignore */ }
          try { if (o.shipmentsJson) parsedShipments = JSON.parse(o.shipmentsJson); } catch { /* ignore */ }

          return {
            orderId: o.orderId,
            customerName: o.customerName || "Verified Customer",
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            variety: parsedItems.length > 0 ? parsedItems.map(i => i.name).join(", ") : "Farm Harvest",
            quantity: o.totalWeight || 1,
            unit: "kg",
            unitPrice: o.productSubtotal || 0,
            total: o.grandTotal || 0,
            deliveryAddress: {
              street: o.streetAddress || o.deliveryAddress,
              locality: o.locality || "",
              city: o.city || "",
              state: o.state || "",
              pincode: o.pincode || ""
            },
            deliveryStatus: o.status === "PAID" ? "Pending Dispatch" : o.status,
            deliveryNotes: o.deliveryNotes || "",
            items: parsedItems,
            shipments: parsedShipments,
            orderDate: o.createdAt || "Recent"
          };
        });

        // Merge: remote orders take precedence, keep local orders that are not on remote
        const orderMap = new Map();
        mappedRemote.forEach((o) => orderMap.set(o.orderId, o));
        local.forEach((o) => {
          if (!orderMap.has(o.orderId)) {
            orderMap.set(o.orderId, o);
          }
        });
        merged = Array.from(orderMap.values());
      }
    } catch (err) {
      console.warn("Could not fetch remote orders, using local:", err);
    }

    setOrders(merged);
    setBargains(getBargainOffersForCultivator(user));
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncOrders();
  }, [syncOrders]);

  useEffect(() => {
    const handleUpdate = () => syncOrders();
    const handleBargains = () => setBargains(getBargainOffersForCultivator(user));
    const handleViewMode = (e) => {
      if (e.detail === "bargains" || e.detail === "orders") {
        setViewMode(e.detail);
      }
    };
    const handleStorageChange = (e) => {
      if (
        e.key === "mushroomhub_customer_orders" ||
        e.key === "mushroomhub_realtime_notifications" ||
        e.key === "mushroomhub_price_bargains"
      ) {
        syncOrders();
        handleBargains();
      }
    };

    window.addEventListener("cultivator-orders-updated", handleUpdate);
    window.addEventListener("mushroomhub-bargains-updated", handleBargains);
    window.addEventListener("mushroomhub-notifications-updated", handleUpdate);
    window.addEventListener("cultivator-orders-view-mode-changed", handleViewMode);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cultivator-orders-updated", handleUpdate);
      window.removeEventListener("mushroomhub-bargains-updated", handleBargains);
      window.removeEventListener("mushroomhub-notifications-updated", handleUpdate);
      window.removeEventListener("cultivator-orders-view-mode-changed", handleViewMode);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, syncOrders]);

  // Update order delivery status
  const handleStatusChange = (orderId, newStatus) => {
    const updated = updateOrderDeliveryStatus(orderId, newStatus);
    setOrders(updated);
    onToast(`🚚 Order ${orderId} status updated to "${newStatus}"! Remaining counts refreshed.`);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "All" ? true : order.deliveryStatus.toLowerCase() === statusFilter.toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      order.orderId.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      (order.businessName && order.businessName.toLowerCase().includes(query)) ||
      order.variety.toLowerCase().includes(query) ||
      order.deliveryAddress?.city.toLowerCase().includes(query) ||
      order.deliveryAddress?.street.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter((o) => o.deliveryStatus === "Pending Dispatch").length;
  const inTransitCount = orders.filter((o) => o.deliveryStatus === "In Transit" || o.deliveryStatus === "Out for Delivery").length;
  const deliveredCount = orders.filter((o) => o.deliveryStatus === "Delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingBargainsCount = bargains.filter((b) => b.status === "pending" || b.status === "customer_countered").length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending Dispatch":
        return "order-status-pending";
      case "Out for Delivery":
        return "order-status-out";
      case "In Transit":
        return "order-status-transit";
      case "Delivered":
        return "order-status-delivered";
      default:
        return "order-status-pending";
    }
  };

  return (
    <div>
      {/* Switcher: Orders vs Bargains */}
      <div
        style={{
          display: "inline-flex",
          gap: 6,
          background: "#edf4eb",
          padding: "5px",
          borderRadius: "12px",
          marginBottom: 18,
          border: "1px solid #dbe6d6"
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("orders")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: "9px",
            border: "none",
            cursor: "pointer",
            background: viewMode === "orders" ? "#345D31" : "transparent",
            color: viewMode === "orders" ? "#ffffff" : "#2d4b35",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: viewMode === "orders" ? "0 2px 6px rgba(52, 93, 49, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <span>📦 Customer Delivery Orders</span>
          <span
            style={{
              fontSize: 11,
              padding: "1px 7px",
              borderRadius: 10,
              background: viewMode === "orders" ? "rgba(255,255,255,0.25)" : "#d5e4cf",
              color: viewMode === "orders" ? "#ffffff" : "#345D31",
              fontWeight: 800
            }}
          >
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("bargains")}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: "9px",
            border: "none",
            cursor: "pointer",
            background: viewMode === "bargains" ? "#345D31" : "transparent",
            color: viewMode === "bargains" ? "#ffffff" : "#2d4b35",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: viewMode === "bargains" ? "0 2px 6px rgba(52, 93, 49, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <span>🤝 Customer Price Bargains</span>
          {pendingBargainsCount > 0 ? (
            <span
              style={{
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 10,
                background: "#d94826",
                color: "#ffffff",
                fontWeight: 800
              }}
            >
              {pendingBargainsCount} Pending
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 10,
                background: viewMode === "bargains" ? "rgba(255,255,255,0.25)" : "#d5e4cf",
                color: viewMode === "bargains" ? "#ffffff" : "#345D31",
                fontWeight: 800
              }}
            >
              {bargains.length}
            </span>
          )}
        </button>
      </div>

      {viewMode === "bargains" ? (
        <CultivatorBargains onToast={onToast} />
      ) : (
        <>
          {/* Top Header & Simulation Action */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ font: "700 20px Manrope", color: "#1d3626", margin: "0 0 2px" }}>
            Customer Orders & Delivery Logistics (₹ INR)
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#6a7767" }}>
            Manage delivery addresses, live Blue Dart cold-chain courier tracking, and dispatch milestones.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="live-sync-pill" style={{ background: "#edf7ec", padding: "6px 14px", borderRadius: 20, fontSize: 12, color: "#2b5633", fontWeight: 600 }}>
            <span className="pulse-dot"></span>
            <span>Live Real-Time Sync Active</span>
          </div>
          {orders.length > 0 && (
            <button
              type="button"
              className="button button-outline"
              style={{ fontSize: 11, padding: "5px 10px", borderColor: "#e4c2bc", color: "#92382c" }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all orders history?")) {
                  saveCustomerOrders([]);
                  setOrders([]);
                  onToast?.("🗑️ Orders list cleared.");
                }
              }}
              title="Clear all orders history"
            >
              Clear Orders
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Customer Orders</div>
          <div className="kpi-val" style={{ color: "#1e4828" }}>
            {totalOrdersCount}
          </div>
          <div className="kpi-sub">Across all regions & restaurants</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Pending Dispatch</div>
          <div className="kpi-val" style={{ color: "#a5590c" }}>
            {pendingCount}
          </div>
          <div className="kpi-sub">Awaiting harvest packaging</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">In Transit & Out for Delivery</div>
          <div className="kpi-val" style={{ color: "#23497d" }}>
            {inTransitCount}
          </div>
          <div className="kpi-sub">Cold-chain couriers en route</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Delivered & Completed</div>
          <div className="kpi-val" style={{ color: "#22592d" }}>
            {deliveredCount}
          </div>
          <div className="kpi-sub">Direct bank settled in INR</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Order Value</div>
          <div className="kpi-val" style={{ color: "#1c4323" }}>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
          <div className="kpi-sub">100% direct cultivator payout</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="hub-card" style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "All", label: "All Orders", count: totalOrdersCount },
              { id: "Pending Dispatch", label: "Pending Dispatch", count: pendingCount },
              { id: "In Transit", label: "In Transit", count: orders.filter((o) => o.deliveryStatus === "In Transit").length },
              { id: "Out for Delivery", label: "Out for Delivery", count: orders.filter((o) => o.deliveryStatus === "Out for Delivery").length },
              { id: "Delivered", label: "Delivered", count: deliveredCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-pill-btn ${statusFilter === tab.id ? "active" : ""}`}
                style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 700 }}>({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: 200, flex: 1, maxWidth: 360 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Order ID, customer, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: 12, padding: "8px 12px 8px 32px" }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#8a9688" }}>
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Orders List with Full Delivery Details */}
      {orders.length === 0 ? (
        <div className="hub-card" style={{ textAlign: "center", padding: "54px 24px", background: "#fbfcf9", border: "1px dashed #d5dfce" }}>
          <span style={{ fontSize: 48 }}>📦</span>
          <h3 style={{ font: "700 20px Manrope", color: "#1f3928", margin: "14px 0 6px" }}>
            No Customer Orders Placed Yet
          </h3>
          <p style={{ color: "#6a7767", fontSize: 13, maxWidth: 520, margin: "auto", lineHeight: 1.6 }}>
            When a customer places an order from their <strong>Customer Account</strong> or <strong>Marketplace</strong>, it will automatically reflect here in <strong>real-time</strong> with full delivery address, tracking milestones, and direct UPI settlement!
          </p>
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, background: "#edf7ec", padding: "6px 16px", borderRadius: 20, fontSize: 12, color: "#2b5633", fontWeight: 600 }}>
            <span className="pulse-dot"></span>
            <span>Listening for live customer orders across tabs...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="hub-card" style={{ textAlign: "center", padding: "36px 20px" }}>
          <span style={{ fontSize: 36 }}>🔍</span>
          <h3 style={{ font: "700 18px Manrope", color: "#1f3928", margin: "10px 0 4px" }}>
            No Orders Matching Filter "{statusFilter}"
          </h3>
          <p style={{ color: "#6a7767", fontSize: 12 }}>
            Try switching status tabs to view other active or completed orders.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredOrders.map((order) => {
            const statusClass = getStatusBadgeClass(order.deliveryStatus);
            const address = order.deliveryAddress || {
              street: "Central Delivery Address",
              locality: "Main District",
              city: "Dehradun",
              state: "Uttarakhand",
              pincode: "248001"
            };

            return (
              <div key={order.orderId} className="order-detail-card">
                {/* Order Top Ribbon */}
                <div className="order-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="order-id-badge">#{order.orderId}</span>
                    <span style={{ fontSize: 12, color: "#627261" }}>
                      Placed: <strong>{order.orderDate}</strong>
                    </span>
                    <span className="status-badge paid" style={{ fontSize: 11 }}>
                      ✓ {order.paymentMethod || "UPI Paid"} (₹{Number(order.total).toLocaleString("en-IN")})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`order-status-pill ${statusClass}`}>
                      {order.deliveryStatus === "Pending Dispatch" && "🕒 "}
                      {order.deliveryStatus === "In Transit" && "✈️ "}
                      {order.deliveryStatus === "Out for Delivery" && "🛵 "}
                      {order.deliveryStatus === "Delivered" && "✓ "}
                      {order.deliveryStatus}
                    </span>
                    <button
                      type="button"
                      className="button button-outline"
                      style={{ fontSize: 11, padding: "5px 11px", display: "inline-flex", alignItems: "center", gap: 4 }}
                      onClick={() => setActiveSlipOrder(order)}
                    >
                      <span>📄</span> Delivery Slip
                    </button>
                  </div>
                </div>

                {/* 3-Column Detailed Information Grid */}
                <div className="order-info-columns">
                  {/* Column 1: Customer & Delivery Address */}
                  <div className="order-info-col">
                    <div className="order-col-heading">
                      <span>📍</span> Customer & Delivery Destination
                    </div>
                    <div style={{ font: "700 15px Manrope", color: "#193822", marginBottom: 2 }}>
                      {order.customerName}
                    </div>
                    {order.businessName && (
                      <div style={{ fontSize: 12, color: "#4f6551", fontWeight: 600, marginBottom: 4 }}>
                        {order.businessName}
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: "#3e4f41", lineHeight: 1.5, marginTop: 6, background: "#f8fbf6", padding: "8px 10px", borderRadius: 6, border: "1px solid #e1e9dc" }}>
                      <strong>Delivery Address:</strong><br />
                      {address.street}, {address.locality}<br />
                      {address.city}, {address.state} - <strong>{address.pincode}</strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "#5d6d5c" }}>📞 {order.customerPhone}</span>
                      <a
                        href={`https://wa.me/${(order.customerPhone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="order-contact-btn"
                        title="Chat on WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>

                    {order.deliveryNotes && (
                      <div style={{ fontSize: 11, color: "#775612", marginTop: 8, fontStyle: "italic", background: "#fef8ea", padding: "6px 8px", borderRadius: 4 }}>
                        📝 <strong>Instructions:</strong> {order.deliveryNotes}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Harvest & Order Contents */}
                  <div className="order-info-col">
                    <div className="order-col-heading">
                      <span>🍄</span> Fresh Harvest Contents
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, borderBottom: "1px dashed #e5ece0", paddingBottom: 6 }}>
                            <div>
                              <strong style={{ color: "#22472b" }}>{it.name}</strong>
                              <div style={{ fontSize: 11, color: "#697968" }}>
                                {it.quantity} {it.unit || "kg"} @ ₹{it.unitPrice || it.price} / {it.unit || "kg"}
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: "#1e4428" }}>
                              ₹{(it.total || it.price * it.quantity).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                          <div>
                            <strong style={{ color: "#22472b" }}>{order.variety}</strong>
                            <div style={{ fontSize: 11, color: "#697968" }}>
                              {order.quantity} {order.unit || "kg"} @ ₹{order.unitPrice} / {order.unit || "kg"}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, color: "#1e4428" }}>
                            ₹{Number(order.total).toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "2px solid #e1e9dc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#546452", fontWeight: 700 }}>Total Order Value:</span>
                      <strong style={{ font: "700 18px Manrope", color: "#1f4b2a" }}>
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div style={{ fontSize: 11, color: "#5d735f", marginTop: 4 }}>
                      Direct Payout Channel: <strong>{order.paymentMethod || "UPI Direct"}</strong>
                    </div>
                  </div>

                  {/* Column 3: Logistics & Courier Tracking */}
                  <div className="order-info-col">
                    <div className="order-col-heading">
                      <span>🚚</span> Cold-Chain Logistics & Tracking
                    </div>

                    <div className="logistics-detail-item">
                      <span className="logistics-label">Logistics Partner:</span>
                      <strong style={{ color: "#1c3c24" }}>{order.deliveryPartner}</strong>
                    </div>

                    <div className="logistics-detail-item">
                      <span className="logistics-label">Tracking / AWB Number:</span>
                      <span className="tracking-number-pill">{order.trackingNumber}</span>
                    </div>

                    <div className="logistics-detail-item">
                      <span className="logistics-label">Estimated Delivery:</span>
                      <strong style={{ color: "#2d6338" }}>{order.estimatedDelivery}</strong>
                    </div>

                    <div style={{ marginTop: 10, background: "#edf5ea", border: "1px solid #c9dec6", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#285231" }}>
                      ❄️ <strong>Cold-Chain Integrity:</strong> 2-4°C Insulated Pack. Veil preservation guaranteed on delivery.
                    </div>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="order-timeline-bar">
                  <div className="timeline-title">Delivery Milestones:</div>
                  <div className="timeline-steps">
                    {[
                      { key: "Order Placed", label: "1. Order Placed", isDone: true },
                      { key: "Harvest Packed", label: "2. Harvest Packed", isDone: order.deliveryStatus !== "Pending Dispatch" },
                      { key: "In Transit", label: "3. Dispatched / In Transit", isDone: order.deliveryStatus === "In Transit" || order.deliveryStatus === "Out for Delivery" || order.deliveryStatus === "Delivered" },
                      { key: "Delivered", label: "4. Delivered & Signed", isDone: order.deliveryStatus === "Delivered" }
                    ].map((step, idx) => (
                      <div key={idx} className={`timeline-step ${step.isDone ? "completed" : ""}`}>
                        <div className="step-circle">{step.isDone ? "✓" : idx + 1}</div>
                        <div className="step-label">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Changer Actions */}
                <div className="order-actions-bar">
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#546452" }}>
                    Cultivator Delivery Status:
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Instant Status Dropdown for Full Flexibility */}
                    <select
                      value={order.deliveryStatus}
                      onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                      className="form-control"
                      style={{ fontSize: 11, padding: "6px 10px", width: "auto", fontWeight: 700, background: "#f8fbf6", borderColor: "#c8d8c4" }}
                    >
                      <option value="Pending Dispatch">⏳ Pending Dispatch</option>
                      <option value="In Transit">✈️ In Transit</option>
                      <option value="Out for Delivery">🛵 Out for Delivery</option>
                      <option value="Delivered">✓ Delivered</option>
                    </select>

                    {/* Quick 1-Click Status Advancement Buttons */}
                    {order.deliveryStatus === "Pending Dispatch" && (
                      <button
                        type="button"
                        className="button button-green"
                        style={{ fontSize: 11, padding: "6px 12px" }}
                        onClick={() => handleStatusChange(order.orderId, "In Transit")}
                      >
                        ✈️ Mark Dispatched (In Transit)
                      </button>
                    )}

                    {(order.deliveryStatus === "Pending Dispatch" || order.deliveryStatus === "In Transit") && (
                      <button
                        type="button"
                        className="button button-green"
                        style={{ fontSize: 11, padding: "6px 12px", background: "#255c8a" }}
                        onClick={() => handleStatusChange(order.orderId, "Out for Delivery")}
                      >
                        🛵 Mark Out for Delivery
                      </button>
                    )}

                    {order.deliveryStatus !== "Delivered" && (
                      <button
                        type="button"
                        className="button button-green"
                        style={{ fontSize: 11, padding: "6px 12px", background: "#1f6230" }}
                        onClick={() => handleStatusChange(order.orderId, "Delivered")}
                      >
                        ✓ Mark Order Delivered
                      </button>
                    )}

                    <button
                      type="button"
                      className="button button-outline"
                      style={{ fontSize: 11, padding: "6px 12px" }}
                      onClick={() => setActiveSlipOrder(order)}
                    >
                      Print Packing Slip 🖨️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Delivery Slip Modal */}
      {activeSlipOrder && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSlipOrder(null);
          }}
        >
          <div className="delivery-slip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="slip-header">
              <div>
                <span className="brand" style={{ fontSize: 20 }}>
                  🍄 Mushroom<span style={{ color: "#367643" }}>Hub</span>
                </span>
                <div style={{ fontSize: 11, color: "#697867" }}>Official Harvest Consignment & Delivery Slip</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <strong style={{ fontSize: 16, color: "#1d3e26" }}>#{activeSlipOrder.orderId}</strong>
                <div style={{ fontSize: 11, color: "#667765" }}>Date: {activeSlipOrder.orderDate}</div>
              </div>
            </div>

            <div className="slip-grid-2">
              <div className="slip-box">
                <span className="slip-box-label">Shipper / Cultivator Farm:</span>
                <strong>Himalayan Forest Spores & Myco Farm</strong>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#4d5d4c" }}>
                  Plot 14, Oak Forest Substrate Facility<br />
                  Dehradun, Uttarakhand - 248001<br />
                  FSSAI Food Safety Lic #10022011002341
                </p>
              </div>

              <div className="slip-box">
                <span className="slip-box-label">Consignee / Customer Delivery Address:</span>
                <strong>{activeSlipOrder.customerName} {activeSlipOrder.businessName ? `(${activeSlipOrder.businessName})` : ""}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#4d5d4c" }}>
                  {activeSlipOrder.deliveryAddress?.street}, {activeSlipOrder.deliveryAddress?.locality}<br />
                  {activeSlipOrder.deliveryAddress?.city}, {activeSlipOrder.deliveryAddress?.state} - {activeSlipOrder.deliveryAddress?.pincode}<br />
                  Contact: {activeSlipOrder.customerPhone}
                </p>
              </div>
            </div>

            <div className="slip-box" style={{ margin: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
                <span><strong>Logistics Courier:</strong> {activeSlipOrder.deliveryPartner}</span>
                <span><strong>AWB Tracking:</strong> {activeSlipOrder.trackingNumber}</span>
                <span><strong>Status:</strong> {activeSlipOrder.deliveryStatus}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="slip-table">
                <thead>
                  <tr>
                    <th>Mushroom Variety</th>
                    <th>Quantity</th>
                    <th>Rate (₹)</th>
                    <th>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSlipOrder.items && activeSlipOrder.items.length > 0 ? (
                    activeSlipOrder.items.map((it, i) => (
                      <tr key={i}>
                        <td><strong>{it.name}</strong></td>
                        <td>{it.quantity} {it.unit || "kg"}</td>
                        <td>₹{it.unitPrice || it.price}</td>
                        <td>₹{(it.total || it.price * it.quantity).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td><strong>{activeSlipOrder.variety}</strong></td>
                      <td>{activeSlipOrder.quantity} {activeSlipOrder.unit || "kg"}</td>
                      <td>₹{activeSlipOrder.unitPrice}</td>
                      <td>₹{Number(activeSlipOrder.total).toLocaleString("en-IN")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 11, color: "#5d6d5c" }}>
                ❄️ Cold-chain temperature: 2-4°C. Handle fresh harvest with extreme care.
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#697968" }}>Total Order Amount:</div>
                <strong style={{ font: "700 20px Manrope", color: "#1d4726" }}>
                  ₹{Number(activeSlipOrder.total).toLocaleString("en-IN")}
                </strong>
                <div style={{ fontSize: 11, color: "#255a2f" }}>Paid via {activeSlipOrder.paymentMethod}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, borderTop: "1px solid #e1e9dc", paddingTop: 14 }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setActiveSlipOrder(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-green"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print Dispatch Note
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
