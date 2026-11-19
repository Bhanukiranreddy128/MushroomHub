import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BargainModal from "../../components/BargainModal";
import { useAuth } from "../../context/AuthContext";
import { addToCart, isCustomerAuthenticated } from "../../data";
import {
  createCustomerOrder,
  DEFAULT_MUSHROOM_PHOTO,
  getBargainOffersForCustomer,
  getCustomerOrdersForUser,
  getMushroomFeed
} from "../../data/store";
import { getMarketplaceProducts } from "../../services/cultivatorProductService";
import CustomerBargains from "./CustomerBargains";
import CustomerProfile from "./CustomerProfile";
import CustomerShowcase from "./CustomerShowcase";

export default function CustomerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [feed, setFeed] = useState(() => {
    const initial = getMushroomFeed();
    return Array.isArray(initial) ? initial : [];
  });
  const [selectedType, setSelectedType] = useState("All");
  const urlTab = searchParams.get("tab");
  const VALID_TABS = ["feed", "orders", "bargains", "profile"];
  const activeTab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : "feed";

  const syncCustomerFeed = useCallback(async () => {
    try {
      const remote = await getMarketplaceProducts();
      if (remote && Array.isArray(remote) && remote.length > 0) {
        setFeed(remote.map((p) => ({
          id: p.productId || `prod-${p.id}`,
          productId: p.productId,
          name: p.name,
          type: p.category || "Oyster",
          category: p.category || "Oyster",
          farm: p.farmName,
          farmName: p.farmName,
          place: p.location,
          location: p.location,
          farmerEmail: p.farmerEmail,
          cultivatorEmail: p.farmerEmail,
          price: Number(p.price) || 0,
          unit: p.unit || "kg",
          stock: Number(p.stockQuantity) || 0,
          imageUrl: p.imageUrl || DEFAULT_MUSHROOM_PHOTO,
          status: p.status === "OUT_OF_STOCK" ? "Sold Out" : "In Stock",
          tag: "Fresh Harvest",
          color: "sage",
          description: p.moderationNotes || "Fresh small-batch harvest directly from precision climate fruiting chambers."
        })));
        return;
      }
    } catch {
      // Backend error fallback
    }
    const local = getMushroomFeed();
    setFeed(Array.isArray(local) ? local : []);
  }, []);

  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const [myOrders, setMyOrders] = useState(() => getCustomerOrdersForUser(user));
  const [myBargains, setMyBargains] = useState(() => getBargainOffersForCustomer(user));
  const [bargainModalProduct, setBargainModalProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const isCustomerRole = Boolean((user?.role === "customer" && user?.isLoggedIn) || isCustomerAuthenticated());

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) syncCustomerFeed();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [syncCustomerFeed]);

  useEffect(() => {
    const valid = ["feed", "orders", "bargains", "profile"];
    const handleTabChange = (e) => {
      if (e.detail && valid.includes(e.detail)) {
        setSearchParams({ tab: e.detail });
      }
    };
    const handleOpenProfile = () => {
      setSearchParams({ tab: "profile" });
    };

    window.addEventListener("customer-tab-changed", handleTabChange);
    window.addEventListener("open-customer-profile", handleOpenProfile);

    return () => {
      window.removeEventListener("customer-tab-changed", handleTabChange);
      window.removeEventListener("open-customer-profile", handleOpenProfile);
    };
  }, [setSearchParams]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("customer-active-tab-updated", { detail: activeTab }));
  }, [activeTab]);

  useEffect(() => {
    const handleCatalogUpdate = () => syncCustomerFeed();
    const handleOrdersUpdate = () => setMyOrders(getCustomerOrdersForUser(user));
    const handleBargainsUpdate = () => setMyBargains(getBargainOffersForCustomer(user));
    const handleStorage = (e) => {
      if (e.key === "mushroomhub_customer_orders") setMyOrders(getCustomerOrdersForUser(user));
      if (e.key === "mushroomhub_feed_catalog" || e.key === "mushroomhub_catalog_feed") syncCustomerFeed();
      if (e.key === "mushroomhub_price_bargains") setMyBargains(getBargainOffersForCustomer(user));
    };

    window.addEventListener("mushrooms-catalog-updated", handleCatalogUpdate);
    window.addEventListener("cultivator-orders-updated", handleOrdersUpdate);
    window.addEventListener("mushroomhub-bargains-updated", handleBargainsUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("mushrooms-catalog-updated", handleCatalogUpdate);
      window.removeEventListener("cultivator-orders-updated", handleOrdersUpdate);
      window.removeEventListener("mushroomhub-bargains-updated", handleBargainsUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user, syncCustomerFeed]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const handleQuickBuy = (item) => {
    const customerPhone = user?.phone || "+91 97120 44589";
    const customerCity = user?.city || user?.location || "Bengaluru";
    const customerEmail = user?.email || "";
    const customerId = user?.id || (customerEmail ? `cust-${customerEmail}` : "guest-customer");

    const newOrd = createCustomerOrder({
      customerId,
      customerName: user?.name || "Verified Customer",
      businessName: user?.farmName || "Retail Buyer",
      customerPhone,
      customerEmail,
      deliveryAddress: {
        street: user?.address || "Flat 402, Green Glen Layout, Outer Ring Road",
        locality: user?.locality || "Bellandur",
        city: customerCity,
        state: user?.state || "Karnataka",
        pincode: user?.pincode || "560103"
      },
      items: [{
        name: item.name,
        category: item.type || "Oyster",
        price: Number(item.price) || 350,
        quantity: 1,
        unit: item.unit || "kg",
        total: Number(item.price) || 350
      }],
      variety: item.name,
      quantity: 1,
      unit: item.unit || "kg",
      unitPrice: Number(item.price) || 350,
      total: Number(item.price) || 350,
      paymentMethod: "UPI Instant Direct (Bank)",
      deliveryPartner: "Blue Dart Cold-Chain Air Express",
      estimatedDelivery: "Tomorrow by 11:30 AM",
      deliveryNotes: "Call customer 15 minutes before dropping at apartment security."
    });

    setMyOrders(getCustomerOrdersForUser(user));
    showToast(`🎉 Order #${newOrd.orderId} placed for 1 ${item.unit} of "${item.name}"! Reflected in Cultivator account in real-time.`);
  };

  const filteredFeed = selectedType === "All"
    ? feed
    : feed.filter((item) => item.type === selectedType);

  const categories = ["All", ...new Set(feed.map((i) => i.type))];

  if (!isCustomerRole) {
    return (
      <div className="portal-wrapper">
        <div className="container" style={{ maxWidth: 540, margin: "50px auto 90px" }}>
          <div className="hub-card" style={{ padding: "40px 32px", textAlign: "center", boxShadow: "0 16px 45px rgba(25, 45, 30, 0.08)" }}>
            <span style={{ fontSize: 48 }}>🛒</span>
            <h2 style={{ font: "700 24px Manrope", color: "#1f3829", margin: "14px 0 8px" }}>
              Customer Sign In Required
            </h2>
            <div className="status-badge" style={{ background: "#e8eff7", color: "#1c4a79", display: "inline-block", marginBottom: 16 }}>
              Protected Buyer Portal
            </div>
            <p style={{ fontSize: 14, color: "#607261", lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 440 }}>
              Please sign in with your customer account credentials to view live harvest feeds, add items to your basket, and place direct farm orders.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                to="/login/customer"
                className="button button-green"
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14 }}
              >
                Log In With Customer Credentials →
              </Link>
              <Link
                to="/signup"
                className="button button-outline"
                style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13 }}
              >
                Create New Customer Account
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
            <span style={{ fontSize: 32 }}>🛒</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 17, color: "#1f3829" }}>Customer Portal & Live Cultivator Feed</strong>
                <span className="role-badge-pill" style={{ background: "#e8eff7", color: "#1c4a79" }}>
                  Consumer & Buyer View (INR ₹)
                </span>
                <span className="status-badge paid" style={{ fontSize: 10 }}>
                  ✓ Logged in as {user?.name || "Customer"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6a7767" }}>
                Browse live harvests posted directly by independent cultivators with real harvest photographs.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="button button-outline"
              style={{ fontSize: 12, padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: 6, borderColor: "#345D31", color: "#345D31" }}
              title="Click to view and edit customer profile"
            >
              <span>👤</span>
              <span>Profile: <strong>{(user?.name || "Customer").split(" ")[0]}</strong></span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login/customer");
              }}
              className="button button-outline"
              style={{ fontSize: 12, padding: "7px 12px", borderColor: "#c47a74", color: "#8d3e33" }}
              title="Securely sign out of customer portal"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </div>

        {/* Verified Independent Cultivators Feed Banner */}
        <div style={{ background: "#edf7ee", border: "1px solid #c8e4cc", borderRadius: 10, padding: "16px 20px", marginBottom: 26, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pulse-dot"></span>
            <div>
              <strong style={{ fontSize: 13, color: "#23572d" }}>Direct From Verified Independent Cultivators · Real-Time Cloud Sync</strong>
              <div style={{ fontSize: 12, color: "#4f6a54" }}>
                All harvests are supplied directly by verified commercial growers with certified cleanrooms across India.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="button button-outline"
              style={{ fontSize: 12, padding: "8px 14px", borderColor: "#345D31", color: "#345D31" }}
            >
              <span>👤</span> Edit Profile Options
            </button>
            <Link to="/cart" className="button button-green" style={{ fontSize: 12, padding: "8px 16px" }}>
              View Cart / Checkout (₹) ↗
            </Link>
          </div>
        </div>

        {/* Navigation Tabs: Live Feed vs My Orders vs Profile */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22, borderBottom: "1px solid #dce4d7", paddingBottom: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`filter-pill-btn ${activeTab === "feed" ? "active" : ""}`}
            style={{ fontSize: 13, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
            onClick={() => setActiveTab("feed")}
          >
            <span>🍄 Live Harvest Feed</span>
          </button>

          <button
            type="button"
            className={`filter-pill-btn ${activeTab === "orders" ? "active" : ""}`}
            style={{ fontSize: 13, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
            onClick={() => setActiveTab("orders")}
          >
            <span>📦 My Orders & Live Tracking</span>
            <span style={{
              background: myOrders.length > 0 ? "var(--green)" : "#e2e8df",
              color: myOrders.length > 0 ? "#fff" : "#445543",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700
            }}>
              {myOrders.length}
            </span>
          </button>

          <button
            type="button"
            className={`filter-pill-btn ${activeTab === "bargains" ? "active" : ""}`}
            style={{
              fontSize: 13,
              padding: "8px 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderColor: myBargains.some((b) => b.status === "countered") ? "#d99b26" : undefined
            }}
            onClick={() => setActiveTab("bargains")}
          >
            <span>🤝 Price Bargains &amp; Offers</span>
            <span style={{
              background: myBargains.some((b) => b.status === "countered")
                ? "#d99b26"
                : myBargains.length > 0
                  ? "#28527a"
                  : "#e2e8df",
              color: myBargains.length > 0 ? "#fff" : "#445543",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700
            }}>
              {myBargains.length}
            </span>
          </button>

          <button
            type="button"
            className={`filter-pill-btn ${activeTab === "profile" ? "active" : ""}`}
            style={{ fontSize: 13, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
            onClick={() => setActiveTab("profile")}
          >
            <span>👤 My Profile & Delivery Details</span>
          </button>
        </div>

        {activeTab === "profile" ? (
          <CustomerProfile onToast={showToast} />
        ) : activeTab === "bargains" ? (
          <CustomerBargains
            onToast={showToast}
            onBrowseFeed={() => setActiveTab("feed")}
          />
        ) : activeTab === "orders" ? (
          <div>
            {myOrders.length === 0 ? (
              <div className="hub-card" style={{ textAlign: "center", padding: "50px 24px", background: "#fbfcf9", border: "1px dashed #d5dfce" }}>
                <span style={{ fontSize: 44 }}>📦</span>
                <h3 style={{ font: "700 20px Manrope", color: "#1f3928", margin: "12px 0 6px" }}>
                  You Have Not Placed Any Orders Yet
                </h3>
                <p style={{ color: "#6a7767", fontSize: 13, maxWidth: 480, margin: "auto", lineHeight: 1.6 }}>
                  Click <strong>"Instant Buy"</strong> on any mushroom in the Live Harvest Feed or checkout from your cart to place an order. It will immediately reflect in the Cultivator's portal in real-time!
                </p>
                <button
                  type="button"
                  className="button button-green"
                  style={{ marginTop: 16, fontSize: 13 }}
                  onClick={() => setActiveTab("feed")}
                >
                  ← Browse Live Harvest Feed
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {myOrders.map((ord) => (
                  <div key={ord.orderId} className="hub-card" style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid #edf0ea", paddingBottom: 14, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <strong style={{ font: "700 17px Manrope", color: "#1f3928" }}>#{ord.orderId}</strong>
                          <span className="status-badge paid" style={{ fontSize: 11 }}>
                            ✓ {ord.paymentMethod || "UPI Direct"} (₹{Number(ord.total).toLocaleString("en-IN")})
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#657664", marginTop: 4 }}>
                          Ordered: {ord.orderDate} · Tracking: <strong>{ord.trackingNumber || "Assigned on Dispatch"}</strong>
                        </div>
                      </div>

                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 12,
                            background:
                              ord.deliveryStatus === "Delivered"
                                ? "#e3f4e6"
                                : ord.deliveryStatus === "In Transit" || ord.deliveryStatus === "Out for Delivery"
                                ? "#e5f0fa"
                                : "#fef3e2",
                            color:
                              ord.deliveryStatus === "Delivered"
                                ? "#1a602c"
                                : ord.deliveryStatus === "In Transit" || ord.deliveryStatus === "Out for Delivery"
                                ? "#1b4f8a"
                                : "#945407"
                          }}
                        >
                          {ord.deliveryStatus === "Pending Dispatch" && "🕒 "}
                          {ord.deliveryStatus === "In Transit" && "✈️ "}
                          {ord.deliveryStatus === "Out for Delivery" && "🛵 "}
                          {ord.deliveryStatus === "Delivered" && "✓ "}
                          {ord.deliveryStatus}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#748573", textTransform: "uppercase", marginBottom: 4 }}>
                          Items Ordered
                        </div>
                        <div style={{ font: "700 14px Manrope", color: "#233d2a" }}>
                          {ord.variety}
                        </div>
                        <div style={{ fontSize: 12, color: "#546653" }}>
                          Total Quantity: {ord.quantity} {ord.unit} · ₹{Number(ord.total).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#748573", textTransform: "uppercase", marginBottom: 4 }}>
                          Delivery Destination
                        </div>
                        <div style={{ fontSize: 12, color: "#364a38" }}>
                          {ord.deliveryAddress?.street}, {ord.deliveryAddress?.locality}
                        </div>
                        <div style={{ fontSize: 12, color: "#364a38" }}>
                          {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state} - {ord.deliveryAddress?.pincode}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#748573", textTransform: "uppercase", marginBottom: 4 }}>
                          Courier & Milestone
                        </div>
                        <div style={{ fontSize: 12, color: "#364a38" }}>
                          🚚 {ord.deliveryPartner || "Blue Dart Express"}
                        </div>
                        <div style={{ fontSize: 11, color: "#5d705c", marginTop: 2 }}>
                          {ord.statusUpdates?.[ord.statusUpdates.length - 1]?.note || "Order confirmed with farm"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* First Section Hero Showcase with Live Morning Flush Side-Sliding Card */}
            <CustomerShowcase
              onToast={showToast}
              onBrowseFeed={() => {
                const el = document.getElementById("customer-feed-grid");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              onViewOrders={() => setActiveTab("orders")}
              orderCount={myOrders.length}
            />

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill-btn ${selectedType === cat ? "active" : ""}`}
                  onClick={() => setSelectedType(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Live Feed Grid */}
            <div id="customer-feed-grid" className="product-grid">
              {filteredFeed.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", background: "#fbfcf9", borderRadius: 12, border: "1px dashed #c9d8c6" }}>
                  <span style={{ fontSize: 40 }}>🛒</span>
                  <h3 style={{ font: "700 18px Manrope", color: "#1f3928", margin: "12px 0 6px" }}>
                    No Active Harvest Listings in Database
                  </h3>
                  <p style={{ color: "#6a7767", fontSize: 13, maxWidth: 460, margin: "auto", lineHeight: 1.6 }}>
                    There are currently no active mushroom listings in the Aiven database. When a cultivator creates an account and publishes a new morning flush, it will appear here in real time!
                  </p>
                </div>
              ) : (
                filteredFeed.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-photo-wrap" style={{ height: 180, position: "relative", overflow: "hidden", background: "#e8ece5" }}>
                <img
                  src={item.imageUrl || DEFAULT_MUSHROOM_PHOTO}
                  alt={item.name}
                  className="product-real-img"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span className="art-pill" style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
                  {item.tag || "Fresh Harvest"}
                </span>
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    background: item.status === "Sold Out" ? "#b23b3b" : "#246132",
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: 12
                  }}
                >
                  ● {item.status || "In Stock"} ({item.stock || 0} {item.unit})
                </span>
              </div>

              <div className="product-info">
                <h3>{item.name}</h3>
                <p className="product-location">🌱 {item.farm} · 📍 {item.place}</p>
                <p className="product-desc" style={{ fontSize: 12, color: "#617160", lineHeight: 1.4, margin: "6px 0 10px" }}>
                  {item.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <strong className="product-price">₹{item.price} <span style={{ fontSize: 12, color: "#6e7f6e", fontWeight: 400 }}>/ {item.unit}</span></strong>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="button button-outline"
                      style={{ padding: "6px 8px", fontSize: 11, borderColor: "#d99b26", color: "#8a580a" }}
                      onClick={() => setBargainModalProduct(item)}
                      title="Propose a custom price or bulk bargain"
                    >
                      🤝 Bargain
                    </button>
                    <button
                      className="button button-outline"
                      style={{ padding: "6px 10px", fontSize: 11 }}
                      onClick={() => {
                        addToCart({
                          id: item.id,
                          name: item.name,
                          farm: item.farm,
                          price: item.price,
                          unit: item.unit
                        });
                        showToast(`Added ${item.name} to cart!`);
                      }}
                    >
                      + Cart
                    </button>
                    <button
                      className="button button-green"
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => handleQuickBuy(item)}
                    >
                      Instant Buy (₹)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
              )}
        </div>
        </>
        )}
      </div>

      {bargainModalProduct && (
        <BargainModal
          product={bargainModalProduct}
          isOpen={Boolean(bargainModalProduct)}
          onClose={() => setBargainModalProduct(null)}
          onSuccess={(newOffer) => {
            showToast(`🤝 Bargain offer #${newOffer.id} placed for ${newOffer.productName}!`);
          }}
        />
      )}

      {toastMessage && (
        <div className="toast-notice">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
