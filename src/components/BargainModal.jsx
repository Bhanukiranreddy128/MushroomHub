import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isCustomerAuthenticated } from "../data";
import { createBargainOffer, DEFAULT_MUSHROOM_PHOTO } from "../data/store";

function BargainModalDialog({ product, onClose, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCustomer = Boolean((user?.isLoggedIn && user?.role === "customer") || isCustomerAuthenticated());

  const originalPrice = Number(product?.price) || 350;
  const unit = product?.unit || "kg";
  const defaultQuantity = originalPrice >= 600 ? 2 : 5;

  const [quantity, setQuantity] = useState(defaultQuantity);
  const [proposedPrice, setProposedPrice] = useState(() => Math.round(originalPrice * 0.85));
  const [customerNote, setCustomerNote] = useState("Regular buyer looking for bulk partnership on fresh cleanroom harvests.");
  const [contactName, setContactName] = useState(() => user?.name || "");
  const [contactPhone, setContactPhone] = useState(() => user?.phone || "");
  const [contactCity, setContactCity] = useState(() => user?.city || user?.location || "Bengaluru");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const totalRetail = originalPrice * quantity;
  const totalBargain = proposedPrice * quantity;
  const savingsTotal = Math.max(0, totalRetail - totalBargain);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - proposedPrice) / originalPrice) * 100) : 0;

  // Feasibility status badge
  let feasibilityBadge = {
    color: "#286036",
    bg: "#eaf5ec",
    border: "#bfe1c6",
    label: "🟢 High Acceptance Chance · Fair & reasonable commercial bulk offer"
  };
  if (discountPercent > 28) {
    feasibilityBadge = {
      color: "#972b2b",
      bg: "#faecec",
      border: "#f0c4c4",
      label: "🔴 Aggressive Bargain · Cultivator may counter-offer or decline"
    };
  } else if (discountPercent > 16) {
    feasibilityBadge = {
      color: "#92520c",
      bg: "#fef7ea",
      border: "#fae1b4",
      label: "🟡 Moderate Bargain · Cultivator may propose an intermediate counter-price"
    };
  } else if (discountPercent <= 0) {
    feasibilityBadge = {
      color: "#1f4a74",
      bg: "#eef5fc",
      border: "#cae0f7",
      label: "ℹ️ Full Listed Retail Price"
    };
  }

  const handleApplyDiscountPreset = (pct) => {
    const discounted = Math.max(10, Math.round(originalPrice * (1 - pct / 100)));
    setProposedPrice(discounted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isCustomer) {
      setErrorMsg("Customer account login is mandatory to propose price bargains.");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("Please specify a valid quantity (minimum 1).");
      return;
    }
    if (proposedPrice <= 0) {
      setErrorMsg("Please propose a positive price per unit.");
      return;
    }
    if (proposedPrice >= originalPrice) {
      setErrorMsg(`Proposed price must be lower than listed retail price (₹${originalPrice}/${unit}) to bargain.`);
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg("Please enter your name or business name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const farmerEmail = (product.cultivatorEmail || product.farmerEmail || "").toLowerCase().trim();
      const farmName = product.farmName || product.farm || "Himalayan Forest Spores & Myco Farm";
      const cultivatorId = product.cultivatorId || (farmerEmail ? `user-${farmerEmail}` : "user-cultivator-01");

      const offerData = {
        productId: product.id || product.productId,
        productName: product.name,
        productImage: product.imageUrl || product.image || DEFAULT_MUSHROOM_PHOTO,
        productUnit: unit,
        originalPrice: originalPrice,
        cultivatorId: cultivatorId,
        cultivatorEmail: farmerEmail,
        farmerEmail: farmerEmail,
        cultivatorName: product.cultivatorName || product.farm || product.farmName || "Vikram R. Sharma",
        farmName: farmName,
        farmLocation: product.place || product.location || "Dehradun, Uttarakhand",

        customerId: user?.id || (user?.email ? `cust-${user.email}` : "customer-verified"),
        customerName: contactName.trim() || user?.name || "Verified Customer",
        customerEmail: user?.email || "",
        customerPhone: contactPhone.trim() || user?.phone || "",
        customerAddress: user?.address || `${contactCity.trim()}, India`,

        quantity: Number(quantity),
        proposedPrice: Number(proposedPrice),
        customerNote: customerNote.trim() || "Regular customer bulk order inquiry."
      };

      const newOffer = createBargainOffer(offerData);
      setSubmittedOffer(newOffer);
      if (onSuccess) {
        onSuccess(newOffer);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit bargain offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToBargains = () => {
    onClose();
    navigate("/portal/customer?tab=bargains");
    window.dispatchEvent(new CustomEvent("customer-tab-changed", { detail: "bargains" }));
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(18, 30, 22, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          width: "min(680px, 98%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(10, 30, 18, 0.28)",
          border: "1px solid #dce8db",
          position: "relative",
          zIndex: 100000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid #e7efe5",
            background: "linear-gradient(to right, #f7faf6, #ffffff)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🤝</span>
            <div>
              <h2 style={{ margin: 0, font: "700 18px Manrope", color: "#193822" }}>
                Make a Price Bargain / Offer
              </h2>
              <span style={{ fontSize: 12, color: "#617762" }}>
                Directly negotiate pricing with grower · Round 1 of 2 (At least 2 bargaining attempts supported)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "#edf3ec",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 14,
              color: "#475c49",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {!isCustomer ? (
            /* Mandatory Customer Account Gate */
            <div style={{ textAlign: "center", padding: "24px 12px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#eaf2fb",
                  color: "#1c4a79",
                  fontSize: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}
              >
                🔒
              </div>
              <h3 style={{ font: "700 20px Manrope", color: "#1c4a79", margin: "0 0 8px" }}>
                Customer Account Login Mandatory
              </h3>
              <p style={{ fontSize: 13.5, color: "#546a56", maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.6 }}>
                Direct price bargaining creates a formal commercial offer with verified cultivators. You must be signed in with an active <strong>Customer Account</strong> to propose custom pricing, negotiate delivery terms, and lock in agreed deals.
              </p>

              {user?.isLoggedIn && user?.role !== "customer" && (
                <div
                  style={{
                    background: "#fff8f0",
                    border: "1px solid #ffd8a8",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12.5,
                    color: "#884a0c",
                    marginBottom: 16,
                    textAlign: "left"
                  }}
                >
                  <strong>⚠️ Active Account: {user?.role.toUpperCase()} ({user?.name || user?.email})</strong>
                  <div style={{ marginTop: 2 }}>
                    Growers, trainees, and staff cannot bargain on wholesale listings. Please switch to a dedicated <strong>Customer Account</strong>.
                  </div>
                </div>
              )}

              {/* Target Harvest Preview */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#f7faf7",
                  border: "1px solid #e1ebe0",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 20,
                  textAlign: "left"
                }}
              >
                <img
                  src={product.imageUrl || product.image || DEFAULT_MUSHROOM_PHOTO}
                  alt={product.name}
                  style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: 10.5, color: "#5f7661", fontWeight: 700, textTransform: "uppercase" }}>
                    Harvest Negotiation Item:
                  </div>
                  <strong style={{ fontSize: 14, color: "#173a21" }}>{product.name}</strong>
                  <div style={{ fontSize: 12, color: "#2d6338" }}>
                    Standard List Price: ₹{originalPrice} / {unit}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  className="button button-green"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 700,
                    background: "#1c4a79",
                    borderColor: "#1c4a79",
                    justifyContent: "center"
                  }}
                  onClick={() => {
                    onClose();
                    navigate(`/login/customer?redirect=${encodeURIComponent(window.location.pathname)}`);
                  }}
                >
                  🔑 Log In With Customer Account →
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  style={{
                    width: "100%",
                    padding: "11px",
                    fontSize: 13,
                    fontWeight: 700,
                    borderColor: "#1c4a79",
                    color: "#1c4a79",
                    justifyContent: "center"
                  }}
                  onClick={() => {
                    onClose();
                    navigate(`/signup?role=customer&redirect=${encodeURIComponent(window.location.pathname)}`);
                  }}
                >
                  ✨ Register New Customer Account
                </button>
              </div>
            </div>
          ) : submittedOffer ? (
            /* Success confirmation screen */
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#e4fae8",
                  color: "#1e6b2c",
                  fontSize: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}
              >
                ✓
              </div>
              <h3 style={{ font: "700 22px Manrope", color: "#173a21", margin: "0 0 8px" }}>
                Bargain Offer Sent to Cultivator!
              </h3>
              <p style={{ fontSize: 14, color: "#546a56", maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.6 }}>
                Your proposal (Round 1 of 2) of <strong>₹{submittedOffer.proposedPrice}/{unit}</strong> for{" "}
                <strong>{submittedOffer.quantity} {unit}</strong> of <strong>{submittedOffer.productName}</strong> has been transmitted to <strong>{submittedOffer.farmName}</strong> in real-time. If the grower counters or declines, you have a 2nd bargaining attempt to reach an agreement!
              </p>

              <div
                style={{
                  background: "#f4f8f3",
                  border: "1px solid #d5e6d4",
                  borderRadius: 12,
                  padding: "16px 20px",
                  textAlign: "left",
                  maxWidth: 500,
                  margin: "0 auto 24px",
                  fontSize: 13
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#6a7d6a" }}>Bargaining Phase:</span>
                  <span className="status-badge" style={{ background: "#eff6ff", color: "#1e40af", fontWeight: 700 }}>
                    🎯 Round 1 of 2 (1 Re-offer Available)
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#6a7d6a" }}>Status:</span>
                  <span className="status-badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
                    ⏳ Pending Cultivator Review
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#6a7d6a" }}>Offer ID:</span>
                  <strong style={{ color: "#193822" }}>#{submittedOffer.id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#6a7d6a" }}>Proposed Total:</span>
                  <strong style={{ color: "#193822" }}>
                    ₹{submittedOffer.totalOffered.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6a7d6a" }}>Potential Savings:</span>
                  <strong style={{ color: "#1c6628" }}>
                    Save ₹{submittedOffer.savingsAmount.toLocaleString("en-IN")} ({discountPercent}%)
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="button button-green"
                  onClick={handleGoToBargains}
                  style={{ padding: "10px 22px", fontSize: 13 }}
                >
                  Track in My Bargains ↗
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={onClose}
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Active Bargain Form */
            <form onSubmit={handleSubmit}>
              {/* Product Preview Card */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  background: "#f7f9f5",
                  border: "1px solid #e2ebe0",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 20
                }}
              >
                <img
                  src={product.imageUrl || product.image || DEFAULT_MUSHROOM_PHOTO}
                  alt={product.name}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid #d3ded0",
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, font: "700 16px Manrope", color: "#1b3521" }}>
                      {product.name}
                    </h4>
                    <span className="art-pill" style={{ position: "static", fontSize: 10, padding: "2px 8px" }}>
                      {product.tag || "Fresh Harvest"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#667a66", marginTop: 2 }}>
                    🌱 {product.farm || "Verified Cleanroom Farm"} · 📍 {product.place || "India"}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    <span style={{ color: "#6a7b69" }}>Official Retail Price: </span>
                    <strong style={{ color: "#17341e" }}>₹{originalPrice} / {unit}</strong>
                    {product.stock && (
                      <span style={{ marginLeft: 10, fontSize: 11, color: "#2d6335", fontWeight: 600 }}>
                        ● {product.stock} {unit} available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: "#fde8e8",
                    color: "#9b1c1c",
                    border: "1px solid #f8b4b4",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    marginBottom: 16
                  }}
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Quantity Stepper & Desired Price Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: 16, marginBottom: 18 }}>
                {/* Desired Quantity */}
                <div>
                  <label
                    htmlFor="bargain-qty-input"
                    style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1c3822", marginBottom: 6 }}
                  >
                    Desired Quantity ({unit})
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #cfded0",
                        background: "#f0f6ee",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#27482d",
                        cursor: "pointer"
                      }}
                    >
                      −
                    </button>
                    <input
                      id="bargain-qty-input"
                      type="number"
                      min={1}
                      max={product.stock || 200}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #cfded0",
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#18361f"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: "1px solid #cfded0",
                        background: "#f0f6ee",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#27482d",
                        cursor: "pointer"
                      }}
                    >
                      ＋
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: "#718371", marginTop: 4, display: "block" }}>
                    Cultivators prefer larger volume for deeper price cuts
                  </span>
                </div>

                {/* Proposed Offer Price */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <label
                      htmlFor="bargain-price-input"
                      style={{ fontSize: 12.5, fontWeight: 700, color: "#1c3822" }}
                    >
                      Your Offer Price (₹/{unit})
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: discountPercent > 0 ? "#1c6628" : "#6c7d6c",
                        background: discountPercent > 0 ? "#e7f6e8" : "#edf2ec",
                        padding: "1px 7px",
                        borderRadius: 10
                      }}
                    >
                      {discountPercent > 0 ? `-${discountPercent}% off` : "Retail"}
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#4f6551"
                      }}
                    >
                      ₹
                    </span>
                    <input
                      id="bargain-price-input"
                      type="number"
                      min={10}
                      max={originalPrice}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(parseInt(e.target.value, 10) || 0)}
                      style={{
                        width: "100%",
                        height: 38,
                        paddingLeft: 28,
                        paddingRight: 10,
                        borderRadius: 8,
                        border: "1px solid #cfded0",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#18361f"
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "#718371", marginTop: 4, display: "block" }}>
                    Original listed: ₹{originalPrice}/{unit}
                  </span>
                </div>
              </div>

              {/* Quick Preset Discount Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#546855" }}>Quick Bargain Targets:</span>
                {[10, 15, 20, 25].map((pct) => {
                  const targetVal = Math.round(originalPrice * (1 - pct / 100));
                  const isActive = proposedPrice === targetVal;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyDiscountPreset(pct)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 14,
                        border: isActive ? "1px solid #2a5833" : "1px solid #d8e4d7",
                        background: isActive ? "#2a5833" : "#f2f7f1",
                        color: isActive ? "#ffffff" : "#284a2f",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      -{pct}% (₹{targetVal})
                    </button>
                  );
                })}
              </div>

              {/* Live Savings Calculator Card */}
              <div
                style={{
                  background: "#fbfdfa",
                  border: "1px solid #dce8da",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: "#6a7b69" }}>Standard Retail Total ({quantity} {unit} @ ₹{originalPrice}):</span>
                  <span style={{ fontSize: 13, textDecoration: "line-through", color: "#8a9a89" }}>
                    ₹{totalRetail.toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16341d" }}>
                    Your Negotiated Bulk Offer:
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#195624" }}>
                    ₹{totalBargain.toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed #d5e2d3",
                    paddingTop: 8
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2d6335" }}>
                    🎉 Estimated Buyer Savings:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#22702d" }}>
                    ₹{savingsTotal.toLocaleString("en-IN")} ({discountPercent}% total discount)
                  </span>
                </div>
              </div>

              {/* Acceptance Feasibility Meter */}
              <div
                style={{
                  background: feasibilityBadge.bg,
                  border: `1px solid ${feasibilityBadge.border}`,
                  color: feasibilityBadge.color,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16
                }}
              >
                {feasibilityBadge.label}
              </div>

              {/* Customer Note / Custom Pitch */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="bargain-note-input"
                  style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#1c3822", marginBottom: 6 }}
                >
                  Message to Cultivator (Helpful for closing the deal)
                </label>
                <textarea
                  id="bargain-note-input"
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="e.g. Sourcing for weekend catering menu; will order 10kg weekly if quality and price match..."
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid #cfded0",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#1c3822",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Customer Contact Inputs */}
              <div
                style={{
                  background: "#f5f8f4",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 20,
                  border: "1px solid #e1e9df"
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#234928", marginBottom: 8 }}>
                  Your Contact &amp; Delivery Location
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))", gap: 10 }}>
                  <div>
                    <label htmlFor="bargain-contact-name" style={{ display: "block", fontSize: 11, color: "#546855", marginBottom: 3 }}>
                      Your Name
                    </label>
                    <input
                      id="bargain-contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      style={{ width: "100%", height: 32, padding: "0 8px", borderRadius: 6, border: "1px solid #ccd8ca", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label htmlFor="bargain-contact-phone" style={{ display: "block", fontSize: 11, color: "#546855", marginBottom: 3 }}>
                      Phone Number
                    </label>
                    <input
                      id="bargain-contact-phone"
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      style={{ width: "100%", height: 32, padding: "0 8px", borderRadius: 6, border: "1px solid #ccd8ca", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label htmlFor="bargain-contact-city" style={{ display: "block", fontSize: 11, color: "#546855", marginBottom: 3 }}>
                      Delivery City
                    </label>
                    <input
                      id="bargain-contact-city"
                      type="text"
                      value={contactCity}
                      onChange={(e) => setContactCity(e.target.value)}
                      style={{ width: "100%", height: 32, padding: "0 8px", borderRadius: 6, border: "1px solid #ccd8ca", fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{ padding: "10px 18px", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-green"
                  disabled={isSubmitting}
                  style={{ padding: "10px 24px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  {isSubmitting ? "Transmitting Offer..." : "Submit Bargain Offer 🤝"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BargainModal({ product, isOpen, onClose, onSuccess }) {
  if (!isOpen || !product || typeof document === "undefined") return null;

  return createPortal(
    <BargainModalDialog
      key={product.id || "bargain-dialog"}
      product={product}
      onClose={onClose}
      onSuccess={onSuccess}
    />,
    document.body
  );
}
