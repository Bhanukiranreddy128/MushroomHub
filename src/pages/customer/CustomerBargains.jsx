import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isCustomerAuthenticated } from "../../data";
import {
  addDealToCart,
  createCustomerOrder,
  DEFAULT_MUSHROOM_PHOTO,
  deleteBargainOffer,
  getBargainOffersForCustomer,
  updateBargainOfferStatus
} from "../../data/store";

export default function CustomerBargains({ onToast, onBrowseFeed }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCustomer = Boolean((user?.isLoggedIn && user?.role === "customer") || isCustomerAuthenticated());

  const [offers, setOffers] = useState(() => getBargainOffersForCustomer(user));
  const [filterStatus, setFilterStatus] = useState("all");

  // State for Customer 2nd-Round Counter-Offer
  const [counteringOfferId, setCounteringOfferId] = useState(null);
  const [customerCounterPrice, setCustomerCounterPrice] = useState("");
  const [customerCounterNote, setCustomerCounterNote] = useState("");

  useEffect(() => {
    if (!isCustomer) return;
    const handleUpdate = () => {
      setOffers(getBargainOffersForCustomer(user));
    };

    window.addEventListener("mushroomhub-bargains-updated", handleUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "mushroomhub_price_bargains") handleUpdate();
    });

    return () => {
      window.removeEventListener("mushroomhub-bargains-updated", handleUpdate);
    };
  }, [user, isCustomer]);

  if (!isCustomer) {
    return (
      <div className="hub-card" style={{ padding: "44px 28px", textAlign: "center", margin: "30px auto", maxWidth: 520, borderRadius: 14 }}>
        <span style={{ fontSize: 44 }}>🔒</span>
        <h3 style={{ font: "700 20px Manrope", color: "#1c4a79", margin: "14px 0 8px" }}>
          Customer Account Login Mandatory
        </h3>
        <p style={{ fontSize: 13.5, color: "#546855", lineHeight: 1.6, marginBottom: 20 }}>
          Direct price negotiations and active bargain counters are tied to your verified Customer Account. Please log in with your customer account to view your negotiations and submit counter-offers.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            to="/login/customer"
            className="button button-green"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14, background: "#1c4a79", borderColor: "#1c4a79" }}
          >
            Log In as Customer →
          </Link>
          <Link
            to="/signup?role=customer"
            className="button button-outline"
            style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13, borderColor: "#1c4a79", color: "#1c4a79" }}
          >
            Create Customer Account
          </Link>
        </div>
      </div>
    );
  }

  // Open inline customer counter-offer form (Round 2)
  const handleOpenCustomerCounter = (offer) => {
    setCounteringOfferId(offer.id);
    const prevProposed = Number(offer.proposedPrice) || Math.round(offer.originalPrice * 0.85);
    const cultCounter = Number(offer.counterPrice) || offer.originalPrice;
    const suggested = Math.round((prevProposed + cultCounter) / 2);
    setCustomerCounterPrice(String(suggested));
    setCustomerCounterNote(`Can we settle at ₹${suggested}/${offer.productUnit}? Ready to order ${offer.quantity} ${offer.productUnit} immediately.`);
  };

  // Submit Customer 2nd-round counter-offer
  const handleSubmitCustomerCounter = (offer) => {
    const priceNum = parseInt(customerCounterPrice, 10);
    if (!priceNum || priceNum <= 0) {
      alert("Please enter a valid positive price.");
      return;
    }
    if (offer.counterPrice && priceNum >= offer.counterPrice) {
      alert(`Your counter-offer should be lower than the grower's counter price (₹${offer.counterPrice}/${offer.productUnit}) to bargain.`);
      return;
    }

    const nextRound = Math.min(offer.maxRounds || 2, (offer.customerRound || 1) + 1);
    updateBargainOfferStatus(offer.id, "customer_countered", {
      proposedPrice: priceNum,
      customerNote: customerCounterNote.trim() || `Customer proposed Round ${nextRound} counter-offer at ₹${priceNum}/${offer.productUnit}.`,
      customerRound: nextRound,
      round: nextRound
    });

    setCounteringOfferId(null);
    if (onToast) {
      onToast(`🤝 Round ${nextRound} counter-offer of ₹${priceNum}/${offer.productUnit} submitted to ${offer.farmName}!`);
    }
  };

  // Handle Customer accepting Cultivator's Counter-Offer
  const handleAcceptCounter = (offer) => {
    const dealPrice = offer.counterPrice || offer.proposedPrice;
    updateBargainOfferStatus(offer.id, "accepted", {
      acceptedBy: "customer",
      finalDealPrice: dealPrice,
      cultivatorNote: `Customer accepted cultivator counter-price of ₹${dealPrice}/${offer.productUnit}.`
    });

    // Automatically add deal to cart
    addDealToCart({
      ...offer,
      finalDealPrice: dealPrice
    });

    if (onToast) {
      onToast(`🎉 Counter-offer of ₹${dealPrice}/${offer.productUnit} accepted! Added to your shopping basket.`);
    }
    navigate("/cart");
  };

  // Handle Customer declining Cultivator's Counter-Offer
  const handleDeclineCounter = (offer) => {
    updateBargainOfferStatus(offer.id, "declined", {
      declinedBy: "customer",
      cultivatorNote: "Customer decided not to proceed with the proposed counter-price."
    });
    if (onToast) {
      onToast(`Negotiation for "${offer.productName}" concluded.`);
    }
  };

  // Handle Add to Cart at Agreed Deal Price
  const handleAddToCartDeal = (offer) => {
    addDealToCart(offer);
    if (onToast) {
      onToast(`🛒 Added negotiated deal for "${offer.productName}" to your basket at ₹${offer.finalDealPrice || offer.proposedPrice}/${offer.productUnit}!`);
    }
    navigate("/cart");
  };

  // Handle 1-Click Instant Checkout at Agreed Deal Price
  const handleInstantBuyDeal = (offer) => {
    const dealPrice = Number(offer.finalDealPrice || offer.counterPrice || offer.proposedPrice);
    const qty = Number(offer.quantity) || 1;
    const total = dealPrice * qty;

    const customerPhone = user?.phone || offer.customerPhone || "+91 97120 44589";
    const customerCity = user?.city || user?.location || "Bengaluru";
    const customerEmail = user?.email || offer.customerEmail || "";

    const newOrd = createCustomerOrder({
      customerId: user?.id || (customerEmail ? `cust-${customerEmail}` : "user-customer-01"),
      customerName: user?.name || offer.customerName || "Verified Customer",
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
        name: `${offer.productName} (Negotiated Deal 🤝)`,
        category: "Negotiated Deal",
        price: dealPrice,
        quantity: qty,
        unit: offer.productUnit || "kg",
        total: total
      }],
      variety: `${offer.productName} (Bargained Deal @ ₹${dealPrice}/${offer.productUnit})`,
      quantity: qty,
      unit: offer.productUnit || "kg",
      unitPrice: dealPrice,
      total: total,
      paymentMethod: "UPI Instant Direct (Farmer Credit)",
      deliveryPartner: "Blue Dart Cold-Chain Air Express",
      estimatedDelivery: "Tomorrow by 11:30 AM",
      deliveryNotes: `Negotiated deal #${offer.id}. Cold-chain insulated packaging.`
    });

    // Mark offer as ordered
    updateBargainOfferStatus(offer.id, "ordered", {
      orderId: newOrd.orderId
    });

    if (onToast) {
      onToast(`🎉 Negotiated Deal Order #${newOrd.orderId} placed successfully at ₹${dealPrice}/${offer.productUnit}!`);
    }
  };

  const handleCancelOffer = (offerId) => {
    deleteBargainOffer(offerId);
    if (onToast) {
      onToast("Bargain offer cancelled.");
    }
  };

  // Computed summary stats
  const pendingCount = offers.filter((o) => o.status === "pending" || o.status === "customer_countered").length;
  const counteredCount = offers.filter((o) => o.status === "countered").length;
  const acceptedCount = offers.filter((o) => o.status === "accepted").length;
  const totalSavings = offers
    .filter((o) => o.status === "accepted" || o.status === "ordered")
    .reduce((sum, o) => sum + (Number(o.savingsAmount) || 0), 0);

  const filteredOffers = offers.filter((offer) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return offer.status === "pending" || offer.status === "customer_countered";
    if (filterStatus === "countered") return offer.status === "countered";
    if (filterStatus === "accepted") return offer.status === "accepted" || offer.status === "ordered";
    if (filterStatus === "declined") return offer.status === "declined";
    return true;
  });

  return (
    <div>
      {/* Overview Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#546a56", textTransform: "uppercase" }}>
              Total Negotiations
            </span>
            <span style={{ fontSize: 20 }}>🤝</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#18361e", marginTop: 8 }}>
            {offers.length}
          </div>
          <span style={{ fontSize: 11, color: "#6e806f" }}>
            {pendingCount} pending cultivator response
          </span>
        </div>

        <div
          className="hub-card"
          style={{
            padding: "18px 20px",
            border: counteredCount > 0 ? "1.5px solid #d99b26" : undefined,
            background: counteredCount > 0 ? "#fefdf6" : undefined
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#8a580a", textTransform: "uppercase" }}>
              Counter-Offers Waiting
            </span>
            <span style={{ fontSize: 20 }}>💬</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#8a580a", marginTop: 8 }}>
            {counteredCount}
          </div>
          <span style={{ fontSize: 11, color: "#926815" }}>
            Cultivator suggested alternate price
          </span>
        </div>

        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#236331", textTransform: "uppercase" }}>
              Approved Deals
            </span>
            <span style={{ fontSize: 20 }}>🎉</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d5e2a", marginTop: 8 }}>
            {acceptedCount}
          </div>
          <span style={{ fontSize: 11, color: "#4f7556" }}>
            Ready to checkout at discounted price
          </span>
        </div>

        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e5230", textTransform: "uppercase" }}>
              Total Money Saved
            </span>
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e5230", marginTop: 8 }}>
            ₹{totalSavings.toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: 11, color: "#507559" }}>
            Through live price bargaining
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "all", label: `All Offers (${offers.length})` },
          { id: "pending", label: `⏳ Pending (${pendingCount})` },
          { id: "countered", label: `💬 Counter-Offers (${counteredCount})`, highlight: counteredCount > 0 },
          { id: "accepted", label: `🎉 Approved Deals (${acceptedCount})` },
          { id: "declined", label: "Declined" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`filter-pill-btn ${filterStatus === tab.id ? "active" : ""}`}
            style={{
              fontSize: 12.5,
              padding: "7px 16px",
              borderColor: tab.highlight && filterStatus !== tab.id ? "#d99b26" : undefined,
              color: tab.highlight && filterStatus !== tab.id ? "#8a580a" : undefined
            }}
            onClick={() => setFilterStatus(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bargain Cards List */}
      {filteredOffers.length === 0 ? (
        <div
          className="hub-card"
          style={{
            textAlign: "center",
            padding: "54px 24px",
            background: "#fafbfa",
            border: "1px dashed #d5ded3"
          }}
        >
          <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🤝</span>
          <h3 style={{ font: "700 20px Manrope", color: "#1d3824", margin: "0 0 6px" }}>
            No Bargain Offers in this View
          </h3>
          <p style={{ color: "#6a7b69", fontSize: 13, maxWidth: 460, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Browse the Live Harvest Feed and click <strong>"🤝 Bargain"</strong> on any mushroom to propose a fair volume price directly to the grower.
          </p>
          <button
            type="button"
            className="button button-green"
            onClick={onBrowseFeed}
            style={{ fontSize: 13, padding: "9px 20px" }}
          >
            ← Browse Live Harvest Feed &amp; Make Offer
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredOffers.map((offer) => {
            const isCustomerCountered = offer.status === "customer_countered";
            const isCountered = offer.status === "countered";
            const isAccepted = offer.status === "accepted";
            const isOrdered = offer.status === "ordered";
            const isPending = offer.status === "pending" || isCustomerCountered;
            const isDeclined = offer.status === "declined";

            const customerRound = offer.customerRound || 1;
            const maxRounds = offer.maxRounds || 2;
            const canBargainAgain = customerRound < maxRounds;
            const isFormOpen = counteringOfferId === offer.id;

            const dealPrice = isAccepted || isOrdered
              ? offer.finalDealPrice || offer.proposedPrice
              : isCountered
                ? offer.counterPrice
                : offer.proposedPrice;

            return (
              <div
                key={offer.id}
                className="hub-card"
                style={{
                  padding: "22px 24px",
                  border: isCustomerCountered ? "1.5px solid #d99b26" : isCountered ? "1.5px solid #e2b659" : isAccepted ? "1.5px solid #a8d7b3" : undefined,
                  background: isCustomerCountered ? "#fffef9" : isCountered ? "#fffdf8" : "#ffffff"
                }}
              >
                {/* Header row: Product & Status Badge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                    borderBottom: "1px solid #edf2ec",
                    paddingBottom: 16,
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <img
                      src={offer.productImage || DEFAULT_MUSHROOM_PHOTO}
                      alt={offer.productName}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 10,
                        objectFit: "cover",
                        border: "1px solid #d5e0d4"
                      }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, font: "700 17px Manrope", color: "#193822" }}>
                          {offer.productName}
                        </h4>
                        <span style={{ fontSize: 11, color: "#6a7d6a" }}>#{offer.id}</span>
                        <span
                          className="status-badge"
                          style={{
                            background: "#eff6ff",
                            color: "#1e40af",
                            border: "1px solid #bfdbfe",
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 8px"
                          }}
                        >
                          🎯 Round {customerRound} of {maxRounds} {canBargainAgain ? "· 2nd Bargain Available" : "· Final Round"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#617562", marginTop: 2 }}>
                        🌱 {offer.farmName} · 📍 {offer.farmLocation || "India"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCustomerCountered && (
                      <span
                        className="status-badge"
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                          fontWeight: 800,
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span className="pulse-dot" style={{ background: "#d97706" }}></span>
                        💬 Round 2 Counter Dispatched · Awaiting Grower Review
                      </span>
                    )}
                    {isPending && !isCustomerCountered && (
                      <span className="status-badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
                        ⏳ Pending Cultivator Review (Round {customerRound} of {maxRounds})
                      </span>
                    )}
                    {isCountered && (
                      <span
                        className="status-badge"
                        style={{
                          background: "#fef0c7",
                          color: "#78350f",
                          border: "1px solid #fde68a",
                          fontWeight: 800,
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span className="pulse-dot" style={{ background: "#d97706" }}></span>
                        💬 Counter-Offer Received: ₹{offer.counterPrice}/{offer.productUnit}
                      </span>
                    )}
                    {isAccepted && (
                      <span className="status-badge paid" style={{ fontSize: 12, fontWeight: 700 }}>
                        ✓ Deal Agreed @ ₹{offer.finalDealPrice}/{offer.productUnit}
                      </span>
                    )}
                    {isOrdered && (
                      <span className="status-badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                        📦 Deal Purchased (In Delivery)
                      </span>
                    )}
                    {isDeclined && (
                      <span className="status-badge" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        ✕ Offer Declined {canBargainAgain ? `(Round ${customerRound} of ${maxRounds})` : "· Concluded"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Offer Comparison Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    background: "#f7f9f6",
                    borderRadius: 10,
                    padding: "14px 18px",
                    marginBottom: 16
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#6e806e", textTransform: "uppercase", fontWeight: 700 }}>
                      Official Listed Price
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3b24", marginTop: 2 }}>
                      ₹{offer.originalPrice} <span style={{ fontSize: 12, fontWeight: 400 }}>/{offer.productUnit}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#849784", textDecoration: "line-through" }}>
                      Retail: ₹{(offer.totalOriginal || offer.originalPrice * offer.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "#6e806e", textTransform: "uppercase", fontWeight: 700 }}>
                      {isCustomerCountered ? "Your Round 2 Offer" : "Your Proposed Offer"}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isCustomerCountered ? "#854d0e" : "#1e3b24", marginTop: 2 }}>
                      ₹{offer.proposedPrice} <span style={{ fontSize: 12, fontWeight: 400 }}>/{offer.productUnit}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#546e56" }}>
                      Qty: <strong>{offer.quantity} {offer.productUnit}</strong>
                    </span>
                  </div>

                  {isCountered && (
                    <div style={{ background: "#fef9ee", padding: "6px 12px", borderRadius: 8, border: "1px solid #f6e2b6" }}>
                      <span style={{ fontSize: 11, color: "#92520c", textTransform: "uppercase", fontWeight: 700 }}>
                        Cultivator Counter-Price
                      </span>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#92520c", marginTop: 2 }}>
                        ₹{offer.counterPrice} <span style={{ fontSize: 12, fontWeight: 400 }}>/{offer.productUnit}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#92520c" }}>
                        Deal Total: ₹{(offer.counterPrice * offer.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: 11, color: "#236331", textTransform: "uppercase", fontWeight: 700 }}>
                      Estimated Savings
                    </span>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#1d632c", marginTop: 2 }}>
                      ₹{offer.savingsAmount.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: 11, color: "#296636" }}>
                      Effective Deal Total: ₹{((dealPrice || offer.proposedPrice) * offer.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Cultivator Note / Counter message if present */}
                {offer.cultivatorNote && (
                  <div
                    style={{
                      background: isCountered ? "#fcf6e9" : "#f1f7f0",
                      border: isCountered ? "1px solid #fae2b1" : "1px solid #d2e6d1",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      marginBottom: 16
                    }}
                  >
                    <strong style={{ color: isCountered ? "#854d0e" : "#1e4d25" }}>
                      💬 Message from {offer.farmName}:
                    </strong>{" "}
                    <span style={{ color: "#2d3c2e" }}>"{offer.cultivatorNote}"</span>
                  </div>
                )}

                {/* Customer's current note */}
                {offer.customerNote && (
                  <div style={{ fontSize: 12, color: "#6a7d6a", marginBottom: 14 }}>
                    <strong>Your Note:</strong> "{offer.customerNote}"
                  </div>
                )}

                {/* Negotiation Trail History */}
                {offer.history && offer.history.length > 1 && (
                  <div style={{ background: "#f8faf7", border: "1px solid #e2ece0", borderRadius: 8, padding: "8px 14px", marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2d4a32", display: "block", marginBottom: 4 }}>
                      📜 Negotiation Trail ({offer.history.length} rounds/actions):
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {offer.history.map((h, idx) => (
                        <div key={idx} style={{ fontSize: 11, color: "#526353", display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                          <span>
                            {h.by === "customer" ? "👤 Buyer" : "🌱 Grower"}: <strong>{h.action}</strong> {h.price ? `(@ ₹${h.price}/${offer.productUnit})` : ""}
                          </span>
                          <span style={{ color: "#8a9a8b", fontSize: 10.5 }}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline 2nd-Round Counter-Offer Form */}
                {isFormOpen && (
                  <div
                    style={{
                      background: "#fffdf7",
                      border: "1.5px solid #e1be67",
                      borderRadius: 12,
                      padding: "16px 18px",
                      marginBottom: 14
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>🤝</span>
                      <strong style={{ fontSize: 14, color: "#78350f" }}>
                        Propose 2nd Bargain Counter-Offer (Round {customerRound + 1} of {maxRounds})
                      </strong>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>
                      {isDeclined
                        ? `Grower declined your initial offer of ₹${offer.proposedPrice}. Submit a revised price closer to listed rate (₹${offer.originalPrice}/${offer.productUnit}) for a second attempt.`
                        : `Grower countered at ₹${offer.counterPrice}/${offer.productUnit}. Propose your 2nd round counter-price to meet in the middle and finalize:`}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label
                          htmlFor={`cust-counter-price-${offer.id}`}
                          style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#451a03", marginBottom: 4 }}
                        >
                          Your Round 2 Offer (₹/{offer.productUnit})
                        </label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#78350f" }}>
                            ₹
                          </span>
                          <input
                            id={`cust-counter-price-${offer.id}`}
                            type="number"
                            min={1}
                            max={offer.counterPrice ? offer.counterPrice - 1 : offer.originalPrice - 1}
                            value={customerCounterPrice}
                            onChange={(e) => setCustomerCounterPrice(e.target.value)}
                            style={{
                              width: "100%",
                              height: 38,
                              paddingLeft: 24,
                              paddingRight: 8,
                              borderRadius: 8,
                              border: "1px solid #d99b26",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#78350f"
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`cust-counter-note-${offer.id}`}
                          style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#451a03", marginBottom: 4 }}
                        >
                          Note to Cultivator
                        </label>
                        <input
                          id={`cust-counter-note-${offer.id}`}
                          type="text"
                          value={customerCounterNote}
                          onChange={(e) => setCustomerCounterNote(e.target.value)}
                          placeholder="e.g. Can we meet in the middle? Ready to order immediately."
                          style={{
                            width: "100%",
                            height: 38,
                            padding: "0 12px",
                            borderRadius: 8,
                            border: "1px solid #d99b26",
                            fontSize: 13,
                            color: "#1f2937"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setCounteringOfferId(null)}
                        style={{ padding: "7px 14px", fontSize: 12 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-green"
                        onClick={() => handleSubmitCustomerCounter(offer)}
                        style={{ padding: "7px 18px", fontSize: 12.5, fontWeight: 700, background: "#854d0e" }}
                      >
                        Submit Round 2 Bargain ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    borderTop: "1px solid #edf2ec",
                    paddingTop: 14
                  }}
                >
                  <span style={{ fontSize: 11.5, color: "#7a8c7b" }}>
                    Last update: {offer.history?.[offer.history.length - 1]?.time || "Recently"}
                  </span>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Counter-Offer Actions */}
                    {isCountered && !isFormOpen && (
                      <>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() => handleDeclineCounter(offer)}
                          style={{ padding: "8px 14px", fontSize: 12, borderColor: "#d0dbcf", color: "#667866" }}
                        >
                          ✕ Decline Counter
                        </button>
                        {canBargainAgain && (
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => handleOpenCustomerCounter(offer)}
                            style={{
                              padding: "8px 16px",
                              fontSize: 12.5,
                              fontWeight: 700,
                              borderColor: "#d99b26",
                              color: "#854d0e",
                              background: "#fff9ec"
                            }}
                            title="Propose your 2nd and final bargain price"
                          >
                            🤝 Counter-Offer / Bargain Again (Round 2 of 2)
                          </button>
                        )}
                        <button
                          type="button"
                          className="button button-green"
                          onClick={() => handleAcceptCounter(offer)}
                          style={{
                            padding: "8px 18px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "#1f652f"
                          }}
                        >
                          <span>✓</span> Accept Counter ₹{offer.counterPrice}/{offer.productUnit} &amp; Add to Cart
                        </button>
                      </>
                    )}

                    {/* Declined Actions with Re-Bargain */}
                    {isDeclined && canBargainAgain && !isFormOpen && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleOpenCustomerCounter(offer)}
                        style={{
                          padding: "8px 16px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          borderColor: "#d99b26",
                          color: "#854d0e",
                          background: "#fff9ec"
                        }}
                        title="Try a 2nd bargain with a revised price"
                      >
                        🔄 Re-Bargain / 2nd Attempt (Round 2 of 2)
                      </button>
                    )}

                    {/* Accepted Deal Actions */}
                    {isAccepted && (
                      <>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() => handleAddToCartDeal(offer)}
                          style={{ padding: "8px 16px", fontSize: 12.5, borderColor: "#345D31", color: "#345D31" }}
                        >
                          ＋ Add to Basket (₹{dealPrice}/{offer.productUnit})
                        </button>
                        <button
                          type="button"
                          className="button button-green"
                          onClick={() => handleInstantBuyDeal(offer)}
                          style={{ padding: "8px 18px", fontSize: 12.5, fontWeight: 700 }}
                        >
                          ⚡ 1-Click Instant Buy @ ₹{dealPrice}
                        </button>
                      </>
                    )}

                    {/* Pending Actions */}
                    {isPending && !isFormOpen && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleCancelOffer(offer.id)}
                        style={{ padding: "7px 12px", fontSize: 11.5, borderColor: "#e4cecb", color: "#8d433b" }}
                      >
                        Cancel Offer
                      </button>
                    )}

                    {/* Ordered Actions */}
                    {isOrdered && (
                      <Link
                        to="/portal/customer?tab=orders"
                        className="button button-outline"
                        style={{ padding: "7px 14px", fontSize: 12, borderColor: "#345D31", color: "#345D31" }}
                      >
                        Track Delivery in Orders ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
