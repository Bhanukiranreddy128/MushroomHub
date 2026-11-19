import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import BargainModal from "../components/BargainModal";
import { useAuth } from "../context/AuthContext";
import { addToCart, isCustomerAuthenticated, products } from "../data";
import { DEFAULT_MUSHROOM_PHOTO, getMushroomFeed } from "../data/store";

export default function MushroomDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [addedToast, setAddedToast] = useState("");
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const feed = getMushroomFeed();
  const p = feed.find((x) => x.id === id) || products.find((x) => x.id === id);

  const isCustomer = Boolean(
    (user?.isLoggedIn && user?.role === "customer") || isCustomerAuthenticated()
  );

  const handleOpenBargain = () => {
    if (!isCustomer) {
      window.dispatchEvent(
        new CustomEvent("require-customer-login", {
          detail: {
            action: "bargain",
            product: p,
            message: "Customer account login is mandatory to propose price bargains and negotiate directly with cultivators."
          }
        })
      );
      return;
    }
    setIsBargainOpen(true);
  };

  if (!p) {
    return (
      <section className="container section" style={{ textAlign: "center", padding: "80px 0" }}>
        <h1 style={{ font: "700 36px var(--serif)" }}>Mushroom Not Found</h1>
        <p style={{ color: "var(--muted)", margin: "10px 0 24px" }}>The selected harvest flush is no longer active in the cultivator feed.</p>
        <Link className="button button-green" to="/marketplace">Back to marketplace →</Link>
      </section>
    );
  }

  const photoUrl = p.imageUrl || p.image || DEFAULT_MUSHROOM_PHOTO;

  const handleAdd = () => {
    const success = addToCart(p);
    if (success) {
      setAddedToast(`✓ Added 1 ${p.unit || "kg"} of "${p.name}" to your basket!`);
      setTimeout(() => setAddedToast(""), 3500);
    }
  };

  return (
    <div className="container detail-layout" style={{ padding: "60px 0 90px" }}>
      {/* Real Harvest Photograph */}
      <div className="detail-art" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#e8ede4", boxShadow: "var(--shadow-lg)", height: 440 }}>
        <img
          src={photoUrl}
          alt={p.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div>
        <div className="classic-badge-pill" style={{ marginBottom: 12 }}>
          <span className="dot"></span>
          <span>{p.type} · {p.tag || "Fresh Harvest"}</span>
        </div>
        <h1 style={{ font: "700 clamp(32px, 3.5vw, 44px) var(--serif)", color: "var(--ink)", margin: "0 0 8px", lineHeight: 1.15 }}>
          {p.name}
        </h1>
        <p className="farm-name" style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px" }}>
          Grown with care by <strong>{p.farm}</strong> · 📍 {p.place || "India"}
        </p>

        <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 15, margin: "0 0 22px" }}>
          {p.description || p.note || "Fresh, hand-picked mushroom clusters grown with precision climate controls."} Each order directly supports an independent commercial cultivator and helps keep our regional food ecosystem thriving.
        </p>

        {p.substrate && (
          <div style={{ background: "var(--green-light)", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: 10, fontSize: 13, color: "var(--green-dark)", margin: "0 0 22px" }}>
            🌱 <strong>Cultivation Substrate:</strong> {p.substrate} · 🕒 <strong>Batch:</strong> {p.harvestDate || "Morning Flush"}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "0 0 24px" }}>
          <span className="detail-price" style={{ font: "700 32px var(--serif)", color: "var(--ink)" }}>
            ₹{p.price}
          </span>
          <small style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}> / {p.unit || "kg"} (INR)</small>
          <span className="art-pill" style={{ position: "static", background: "#edf7ed", color: "#1e5c26", fontWeight: 700 }}>
            In Stock & Skillet Ready
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <button
            className="button button-green"
            onClick={handleAdd}
            style={{ padding: "14px 32px", fontSize: 14 }}
            title="Add to basket (₹)"
          >
            Add to Basket (₹)&nbsp; +
          </button>
          <button
            type="button"
            className="button button-outline"
            onClick={handleOpenBargain}
            style={{
              padding: "14px 22px",
              fontSize: 14,
              borderColor: "#d99b26",
              color: "#8a580a",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700
            }}
            title={isCustomer ? "Propose a custom price or bulk volume bargain" : "Customer account login mandatory to bargain"}
          >
            <span>{isCustomer ? "🤝" : "🔒"}</span> Bargain / Make Offer
          </button>
          <Link className="button button-outline" to="/cart">
            Go to Basket 🛒
          </Link>
        </div>

        {addedToast && (
          <div style={{ marginTop: 12, padding: "10px 16px", background: "#edf7ed", border: "1px solid #c8e6c9", borderRadius: 8, color: "#1e4620", fontSize: 13, fontWeight: 600 }}>
            {addedToast}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
          <div style={{ marginBottom: 4 }}>
            🛡️ <strong>Direct Farm Settlement:</strong> 100% of order value goes directly to grower bank account via UPI.
          </div>
          <div>
            ❄️ <strong>Cold-Chain Protection:</strong> Delivered in temperature-stabilized insulated packaging.
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Link className="text-link" to="/marketplace">
            ← Back to all fresh mushrooms
          </Link>
        </div>
      </div>

      {isBargainOpen && (
        <BargainModal
          product={p}
          isOpen={isBargainOpen}
          onClose={() => setIsBargainOpen(false)}
          onSuccess={(offer) => {
            setAddedToast(`✓ Bargain offer #${offer.id} submitted for "${offer.productName}"!`);
            setTimeout(() => setAddedToast(""), 4500);
          }}
        />
      )}
    </div>
  );
}
