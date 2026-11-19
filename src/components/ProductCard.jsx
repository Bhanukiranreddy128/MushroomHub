import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addToCart, isCustomerAuthenticated } from "../data";
import { DEFAULT_MUSHROOM_PHOTO } from "../data/store";
import BargainModal from "./BargainModal";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const [justAdded, setJustAdded] = useState(false);
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const photoUrl = product.imageUrl || product.image || DEFAULT_MUSHROOM_PHOTO;

  const isCustomer = Boolean(
    (user?.isLoggedIn && user?.role === "customer") || isCustomerAuthenticated()
  );

  const handleOpenBargain = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCustomer) {
      window.dispatchEvent(
        new CustomEvent("require-customer-login", {
          detail: {
            action: "bargain",
            product,
            message: "Customer account login is mandatory to propose price bargains and negotiate directly with cultivators."
          }
        })
      );
      return;
    }
    setIsBargainOpen(true);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="product-card">
      <Link to={`/mushrooms/${product.id}`} className="product-photo-wrap">
        <img
          src={photoUrl}
          alt={product.name}
          className="product-real-img"
        />
        <span className="art-pill">
          {product.tag || "Fresh Harvest"}
        </span>
        <span className="art-caption">
          VERIFIED CULTIVATOR
        </span>
      </Link>

      <div className="product-info">
        <p className="eyebrow">{product.type} · 📍 {product.place || "India"}</p>
        <h3>
          <Link to={`/mushrooms/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="farm-name">by {product.farm || "Verified Cleanroom Farm"}</p>

        <div className="product-bottom">
          <strong>
            ₹{product.price}
            <small> / {product.unit || "kg"}</small>
          </strong>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className="button button-outline"
              onClick={handleOpenBargain}
              style={{
                padding: "4px 8px",
                fontSize: 11,
                borderColor: "#d99b26",
                color: "#8a580a",
                borderRadius: "var(--radius-sm, 6px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontWeight: 700
              }}
              title={isCustomer ? `Propose price bargain for ${product.name}` : `Customer login required to bargain on ${product.name}`}
            >
              <span>{isCustomer ? "🤝" : "🔒"}</span>
              <span>Bargain</span>
            </button>
            <button
              className="add-button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              title={justAdded ? "Added to basket!" : `Add ${product.name} to cart`}
              style={justAdded ? { background: "var(--green)", color: "#fff", transform: "scale(1.12)" } : {}}
            >
              {justAdded ? "✓" : "＋"}
            </button>
          </div>
        </div>
      </div>

      {isBargainOpen && (
        <BargainModal
          product={product}
          isOpen={isBargainOpen}
          onClose={() => setIsBargainOpen(false)}
        />
      )}
    </article>
  );
}
