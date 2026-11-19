import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomerAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [authDetail, setAuthDetail] = useState({
    action: "order",
    product: null,
    message: ""
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRequireAuth = (e) => {
      setAuthDetail({
        action: e.detail?.action || "order",
        product: e.detail?.product || null,
        message: e.detail?.message || ""
      });
      setIsOpen(true);
    };

    window.addEventListener("require-customer-login", handleRequireAuth);
    return () => window.removeEventListener("require-customer-login", handleRequireAuth);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isBargain = authDetail.action === "bargain";
  const redirectTarget = isBargain
    ? (authDetail.product?.id ? `/mushrooms/${authDetail.product.id}` : "/marketplace")
    : "/cart";

  const handleLoginAsCustomer = () => {
    setIsOpen(false);
    navigate(`/login/customer?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const handleCreateCustomerAccount = () => {
    setIsOpen(false);
    navigate(`/signup?redirect=${encodeURIComponent(redirectTarget)}&role=customer`);
  };

  const isOtherRole = user?.isLoggedIn && user?.role !== "customer";
  const product = authDetail.product;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(18, 38, 24, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        className="modal-dialog"
        style={{
          width: "min(520px, 100%)",
          background: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "fadeInDown 0.25s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1c4a79 0%, #153b61 100%)",
            color: "#ffffff",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{isBargain ? "🤝" : "🛒"}</span>
            <div>
              <h3 style={{ margin: 0, font: "700 18px Manrope", color: "#ffffff" }}>
                {isBargain ? "Customer Login Mandatory to Bargain" : "Customer Login Required to Place Order"}
              </h3>
              <span style={{ fontSize: 11, color: "#a5d8ff", fontWeight: 600 }}>
                {isBargain
                  ? "Sign in to negotiate direct farm prices with verified growers"
                  : "Sign in to complete order & enable live delivery tracking"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          {/* Target Product Preview */}
          {product && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#f4f8fb",
                border: "1px solid #d5e6f3",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 18
              }}
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    objectFit: "cover",
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1c548a", textTransform: "uppercase" }}>
                  Selected Harvest:
                </span>
                <div style={{ font: "700 14px Manrope", color: "#1a2e20", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {product.name}
                </div>
                <div style={{ font: "700 13px Manrope", color: "#236332", marginTop: 2 }}>
                  ₹{product.price} <small style={{ color: "#666", fontWeight: 400 }}>/ {product.unit || "kg"}</small>
                </div>
              </div>
            </div>
          )}

          {/* Role Check Alert Notice */}
          {isOtherRole ? (
            <div
              style={{
                background: "#fff8f0",
                border: "1px solid #ffd8a8",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                color: "#884a0c",
                lineHeight: 1.5,
                marginBottom: 20
              }}
            >
              <strong>⚠️ Active Account: {user?.role.toUpperCase()} ({user?.name || user?.email})</strong>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                Commercial cultivators and internal staff require a separate <strong>Customer Account</strong> to {isBargain ? "propose price bargains and buy harvests" : "purchase mushrooms"}. Please log in as a Customer.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#f0f7ff",
                border: "1px solid #c9e3ff",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                color: "#1c4a79",
                lineHeight: 1.5,
                marginBottom: 20
              }}
            >
              <strong>🔒 Customer Verification Mandatory:</strong>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>
                {isBargain
                  ? "Direct price bargaining creates a commercial proposal with independent cultivators. Please sign in with your verified Customer Account to submit custom price offers, receive grower counter-offers, and lock in negotiated harvest rates."
                  : "Your items are safely held in your basket. To place your order with direct cultivator bank payment and live cold-chain delivery updates, please sign in with your Customer Account."}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              className="button button-green"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: 13,
                fontWeight: 700,
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#1c4a79",
                border: "none",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(28, 74, 121, 0.25)"
              }}
              onClick={handleLoginAsCustomer}
            >
              <span>🔑</span>
              <span>Log In as Customer →</span>
            </button>

            <button
              type="button"
              className="button button-outline"
              style={{
                width: "100%",
                padding: "11px",
                fontSize: 13,
                fontWeight: 700,
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderColor: "#1c4a79",
                color: "#1c4a79"
              }}
              onClick={handleCreateCustomerAccount}
            >
              <span>✨</span>
              <span>Join & Create Customer Account</span>
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: "#718473",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Cancel & Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
