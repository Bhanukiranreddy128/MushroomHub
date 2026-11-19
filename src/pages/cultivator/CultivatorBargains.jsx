import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  DEFAULT_MUSHROOM_PHOTO,
  getBargainOffersForCultivator,
  updateBargainOfferStatus
} from "../../data/store";

export default function CultivatorBargains({ onToast }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState(() => getBargainOffersForCultivator(user));
  const [filterTab, setFilterTab] = useState("pending");

  // State for inline counter-offer drafting { [offerId]: { counterPrice, cultivatorNote } }
  const [activeCounterOfferId, setActiveCounterOfferId] = useState(null);
  const [counterPriceInput, setCounterPriceInput] = useState("");
  const [counterNoteInput, setCounterNoteInput] = useState("");
  const [declineOfferId, setDeclineOfferId] = useState(null);
  const [declineReasonInput, setDeclineReasonInput] = useState("");

  useEffect(() => {
    const handleUpdate = () => {
      setOffers(getBargainOffersForCultivator(user));
    };

    window.addEventListener("mushroomhub-bargains-updated", handleUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "mushroomhub_price_bargains") handleUpdate();
    });

    return () => {
      window.removeEventListener("mushroomhub-bargains-updated", handleUpdate);
    };
  }, [user]);

  // Handle Cultivator 1-Click Accepting Customer's Offer
  const handleAcceptOffer = (offer) => {
    updateBargainOfferStatus(offer.id, "accepted", {
      acceptedBy: "cultivator",
      finalDealPrice: offer.proposedPrice,
      cultivatorNote: "Offer accepted! Deal finalized. You can add to basket or checkout."
    });
    if (onToast) {
      onToast(`🎉 Accepted bargain offer for "${offer.productName}" at ₹${offer.proposedPrice}/${offer.productUnit} from ${offer.customerName}!`);
    }
  };

  // Open inline counter-offer form
  const handleOpenCounterForm = (offer) => {
    setActiveCounterOfferId(offer.id);
    const midPoint = Math.round((Number(offer.originalPrice) + Number(offer.proposedPrice)) / 2);
    setCounterPriceInput(offer.counterPrice ? String(offer.counterPrice) : String(midPoint));
    setCounterNoteInput(
      offer.cultivatorNote || `We can supply ${offer.quantity} ${offer.productUnit} at ₹${midPoint}/${offer.productUnit} with fresh harvest cold-chain packaging.`
    );
  };

  // Submit counter-offer to Customer
  const handleSubmitCounter = (offer) => {
    const priceNum = parseInt(counterPriceInput, 10);
    if (!priceNum || priceNum <= 0) {
      alert("Please enter a valid positive counter price.");
      return;
    }

    updateBargainOfferStatus(offer.id, "countered", {
      counterPrice: priceNum,
      cultivatorNote: counterNoteInput.trim() || `Counter-offer proposed at ₹${priceNum}/${offer.productUnit}.`
    });

    setActiveCounterOfferId(null);
    if (onToast) {
      onToast(`💬 Counter-offer of ₹${priceNum}/${offer.productUnit} dispatched to ${offer.customerName}!`);
    }
  };

  // Handle decline
  const handleConfirmDecline = (offer) => {
    updateBargainOfferStatus(offer.id, "declined", {
      declinedBy: "cultivator",
      cultivatorNote: declineReasonInput.trim() || "Unable to fulfill at this price due to current cleanroom production costs."
    });
    setDeclineOfferId(null);
    setDeclineReasonInput("");
    if (onToast) {
      onToast(`Offer for "${offer.productName}" declined.`);
    }
  };

  // Metrics
  const pendingCount = offers.filter((o) => o.status === "pending" || o.status === "customer_countered").length;
  const counteredCount = offers.filter((o) => o.status === "countered").length;
  const acceptedCount = offers.filter((o) => o.status === "accepted" || o.status === "ordered").length;
  const totalVolumeKg = offers.reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);

  const filteredOffers = offers.filter((offer) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return offer.status === "pending" || offer.status === "customer_countered";
    if (filterTab === "countered") return offer.status === "countered";
    if (filterTab === "accepted") return offer.status === "accepted" || offer.status === "ordered";
    if (filterTab === "declined") return offer.status === "declined";
    return true;
  });

  return (
    <div>
      {/* Metric Cards Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div
          className="hub-card"
          style={{
            padding: "18px 20px",
            border: pendingCount > 0 ? "1.5px solid #d99b26" : undefined,
            background: pendingCount > 0 ? "#fefdf6" : undefined
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#8a580a", textTransform: "uppercase" }}>
              Needs Review
            </span>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#8a580a", marginTop: 8 }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: 11, color: "#926815" }}>
            Incoming offers waiting for your response
          </span>
        </div>

        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#28527a", textTransform: "uppercase" }}>
              Counter-Offers Out
            </span>
            <span style={{ fontSize: 20 }}>💬</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#214e7a", marginTop: 8 }}>
            {counteredCount}
          </div>
          <span style={{ fontSize: 11, color: "#547597" }}>
            Awaiting customer acceptance
          </span>
        </div>

        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#236331", textTransform: "uppercase" }}>
              Agreed Deals Closed
            </span>
            <span style={{ fontSize: 20 }}>🎉</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e5e2b", marginTop: 8 }}>
            {acceptedCount}
          </div>
          <span style={{ fontSize: 11, color: "#507856" }}>
            Successfully negotiated sales
          </span>
        </div>

        <div className="hub-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1f3b25", textTransform: "uppercase" }}>
              Total Negotiated Volume
            </span>
            <span style={{ fontSize: 20 }}>⚖️</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1f3b25", marginTop: 8 }}>
            {totalVolumeKg} kg
          </div>
          <span style={{ fontSize: 11, color: "#5c7161" }}>
            Across all customer negotiations
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "pending", label: `⏳ Needs Review (${pendingCount})`, highlight: pendingCount > 0 },
          { id: "countered", label: `💬 Counter-Offers Out (${counteredCount})` },
          { id: "accepted", label: `🎉 Agreed Deals (${acceptedCount})` },
          { id: "all", label: `All Requests (${offers.length})` },
          { id: "declined", label: "Declined" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`filter-pill-btn ${filterTab === tab.id ? "active" : ""}`}
            style={{
              fontSize: 12.5,
              padding: "7px 16px",
              borderColor: tab.highlight && filterTab !== tab.id ? "#d99b26" : undefined,
              color: tab.highlight && filterTab !== tab.id ? "#8a580a" : undefined
            }}
            onClick={() => setFilterTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div
          className="hub-card"
          style={{
            textAlign: "center",
            padding: "50px 24px",
            background: "#fbfcfb",
            border: "1px dashed #d6e0d4"
          }}
        >
          <span style={{ fontSize: 44, display: "block", marginBottom: 10 }}>🤝</span>
          <h3 style={{ font: "700 18px Manrope", color: "#193822", margin: "0 0 6px" }}>
            No Bargain Requests In This Category
          </h3>
          <p style={{ color: "#6a7b69", fontSize: 13, maxWidth: 460, margin: "auto", lineHeight: 1.6 }}>
            When customers make bulk purchase offers on your live harvest listings, they will appear here with instant 1-click accept, counter-offer, or decline options.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredOffers.map((offer) => {
            const isCustomerCountered = offer.status === "customer_countered";
            const isPending = offer.status === "pending" || isCustomerCountered;
            const isCountered = offer.status === "countered";
            const isAccepted = offer.status === "accepted";
            const isOrdered = offer.status === "ordered";
            const isDeclined = offer.status === "declined";

            const customerRound = offer.customerRound || 1;
            const maxRounds = offer.maxRounds || 2;

            const discountPct = offer.originalPrice > 0
              ? Math.round(((offer.originalPrice - offer.proposedPrice) / offer.originalPrice) * 100)
              : 0;

            const isCounterOpen = activeCounterOfferId === offer.id;
            const isDeclineOpen = declineOfferId === offer.id;

            return (
              <div
                key={offer.id}
                className="hub-card"
                style={{
                  padding: "22px 24px",
                  border: isCustomerCountered ? "1.5px solid #d99b26" : isPending ? "1.5px solid #e1be67" : isCountered ? "1px solid #bfdbfe" : undefined,
                  background: isCustomerCountered ? "#fffef8" : isPending ? "#fffefc" : "#ffffff"
                }}
              >
                {/* Header row: Customer identity & Status badge */}
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
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#e8f1e7",
                        color: "#1c562a",
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700
                      }}
                    >
                      {(offer.customerName || "C").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ font: "700 16px Manrope", color: "#193822" }}>
                          {offer.customerName}
                        </strong>
                        <span className="role-badge-pill" style={{ background: "#e8eff7", color: "#1c4a79", fontSize: 10 }}>
                          Buyer
                        </span>
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
                          🎯 Bargain Round {customerRound} of {maxRounds}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#617562", marginTop: 2 }}>
                        📞 {offer.customerPhone || "Phone unlisted"} · 📍 {offer.customerAddress || "India"} · ✉️ {offer.customerEmail}
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
                          border: "1.5px solid #d99b26",
                          fontWeight: 800,
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span className="pulse-dot" style={{ background: "#d97706" }}></span>
                        ⏳ Action Required · Buyer Counter-Offer (Round {customerRound} of {maxRounds})
                      </span>
                    )}
                    {isPending && !isCustomerCountered && (
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
                        ⏳ Action Required · Initial Buyer Offer (Round 1 of {maxRounds})
                      </span>
                    )}
                    {isCountered && (
                      <span className="status-badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                        💬 Counter Dispatched: ₹{offer.counterPrice}/{offer.productUnit}
                      </span>
                    )}
                    {isAccepted && (
                      <span className="status-badge paid" style={{ fontWeight: 700 }}>
                        ✓ Deal Agreed @ ₹{offer.finalDealPrice}/{offer.productUnit}
                      </span>
                    )}
                    {isOrdered && (
                      <span className="status-badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                        📦 Deal Purchased &amp; Paid
                      </span>
                    )}
                    {isDeclined && (
                      <span className="status-badge" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        ✕ Offer Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Offer Details Grid */}
                <div
                  className="cultivator-bargain-offer-row"
                  style={{
                    alignItems: "center",
                    marginBottom: 16
                  }}
                >
                  <img
                    src={offer.productImage || DEFAULT_MUSHROOM_PHOTO}
                    alt={offer.productName}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      objectFit: "cover",
                      border: "1px solid #d4ded3"
                    }}
                  />

                  <div>
                    <span style={{ fontSize: 11, color: "#6e806e", textTransform: "uppercase", fontWeight: 700 }}>
                      Product &amp; Stock
                    </span>
                    <h5 style={{ margin: "2px 0 0", fontSize: 14, color: "#1a3821" }}>
                      {offer.productName}
                    </h5>
                    <span style={{ fontSize: 11.5, color: "#667a67" }}>
                      Listed: ₹{offer.originalPrice}/{offer.productUnit}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: isCustomerCountered ? "#92400e" : "#6e806e", textTransform: "uppercase", fontWeight: 700 }}>
                      {isCustomerCountered ? `Buyer Round ${customerRound} Counter` : "Buyer Requested"}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1a3821", marginTop: 2 }}>
                      {offer.quantity} {offer.productUnit} @ ₹{offer.proposedPrice}/{offer.productUnit}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: discountPct > 20 ? "#962b2b" : "#226a2e",
                          fontWeight: 700
                        }}
                      >
                        {discountPct}% under retail
                      </span>
                      {offer.counterPrice && (
                        <span style={{ fontSize: 10.5, color: "#78350f" }}>
                          (Prev Counter: ₹{offer.counterPrice})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "#236331", textTransform: "uppercase", fontWeight: 700 }}>
                      Gross Order Revenue
                    </span>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#1c612b", marginTop: 2 }}>
                      ₹{offer.totalOffered.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: 11, color: "#546e56" }}>
                      Direct UPI to your account
                    </span>
                  </div>
                </div>

                {/* Customer's note/pitch */}
                {offer.customerNote && (
                  <div
                    style={{
                      background: "#fbfcfb",
                      border: "1px solid #e1e9e0",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      marginBottom: 16
                    }}
                  >
                    <strong style={{ color: "#2a4c31" }}>Buyer Note:</strong> "{offer.customerNote}"
                  </div>
                )}

                {/* Cultivator's past counter/response */}
                {offer.cultivatorNote && (
                  <div
                    style={{
                      background: "#f0f6ef",
                      border: "1px solid #cbe0cb",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      marginBottom: 16
                    }}
                  >
                    <strong style={{ color: "#1e5229" }}>Your Response:</strong> "{offer.cultivatorNote}"
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
                            {h.by === "customer" ? "👤 Buyer" : "🌱 You (Grower)"}: <strong>{h.action}</strong> {h.price ? `(@ ₹${h.price}/${offer.productUnit})` : ""}
                          </span>
                          <span style={{ color: "#8a9a8b", fontSize: 10.5 }}>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Counter-Offer Editor */}
                {isCounterOpen && (
                  <div
                    style={{
                      background: "#fefdf8",
                      border: "1.5px solid #e2b659",
                      borderRadius: 12,
                      padding: "18px 20px",
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>💬</span>
                      <strong style={{ fontSize: 14, color: "#78350f" }}>
                        Propose Counter-Offer to {offer.customerName} {isCustomerCountered ? "(Final Round)" : "(Round 1 of 2)"}
                      </strong>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 14, marginBottom: 14 }}>
                      <div>
                        <label
                          htmlFor={`counter-price-${offer.id}`}
                          style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#451a03", marginBottom: 4 }}
                        >
                          Counter Price (₹/{offer.productUnit})
                        </label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#78350f" }}>
                            ₹
                          </span>
                          <input
                            id={`counter-price-${offer.id}`}
                            type="number"
                            min={1}
                            max={offer.originalPrice}
                            value={counterPriceInput}
                            onChange={(e) => setCounterPriceInput(e.target.value)}
                            style={{
                              width: "100%",
                              height: 38,
                              paddingLeft: 26,
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
                          htmlFor={`counter-note-${offer.id}`}
                          style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#451a03", marginBottom: 4 }}
                        >
                          Note to Buyer
                        </label>
                        <input
                          id={`counter-note-${offer.id}`}
                          type="text"
                          value={counterNoteInput}
                          onChange={(e) => setCounterNoteInput(e.target.value)}
                          placeholder="e.g. Can do ₹320/kg with refrigerated packaging for 5kg."
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
                        onClick={() => setActiveCounterOfferId(null)}
                        style={{ padding: "7px 14px", fontSize: 12 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-green"
                        onClick={() => handleSubmitCounter(offer)}
                        style={{
                          padding: "7px 18px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          background: "#854d0e"
                        }}
                      >
                        Send Counter-Offer to Buyer ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Decline Editor */}
                {isDeclineOpen && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      padding: "14px 18px",
                      marginBottom: 16
                    }}
                  >
                    <label
                      htmlFor={`decline-reason-${offer.id}`}
                      style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}
                    >
                      Reason for Declining (Optional note to buyer)
                    </label>
                    <input
                      id={`decline-reason-${offer.id}`}
                      type="text"
                      value={declineReasonInput}
                      onChange={(e) => setDeclineReasonInput(e.target.value)}
                      placeholder="e.g. Current flush committed to restaurant contracts; unable to discount."
                      style={{
                        width: "100%",
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 6,
                        border: "1px solid #fca5a5",
                        fontSize: 12.5,
                        marginBottom: 10
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setDeclineOfferId(null)}
                        style={{ padding: "6px 12px", fontSize: 11.5 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDecline(offer)}
                        style={{
                          padding: "6px 14px",
                          fontSize: 11.5,
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Confirm Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
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
                    Received: {offer.history?.[0]?.time || "Today"}
                  </span>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {isPending && !isCounterOpen && !isDeclineOpen && (
                      <>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() => {
                            setDeclineOfferId(offer.id);
                            setActiveCounterOfferId(null);
                          }}
                          style={{ padding: "7px 14px", fontSize: 12, borderColor: "#e5d1cf", color: "#8b3c34" }}
                        >
                          ✕ Decline
                        </button>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() => {
                            handleOpenCounterForm(offer);
                            setDeclineOfferId(null);
                          }}
                          style={{ padding: "7px 16px", fontSize: 12, borderColor: "#d99b26", color: "#8a580a" }}
                        >
                          💬 {isCustomerCountered ? "Propose Final Counter" : "Counter-Offer"}
                        </button>
                        <button
                          type="button"
                          className="button button-green"
                          onClick={() => handleAcceptOffer(offer)}
                          style={{
                            padding: "7px 20px",
                            fontSize: 12.5,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <span>✓</span> Accept Offer (₹{offer.proposedPrice}/{offer.productUnit})
                        </button>
                      </>
                    )}

                    {isCountered && (
                      <span style={{ fontSize: 12, color: "#78350f", fontWeight: 600 }}>
                        Waiting for customer response on counter ₹{offer.counterPrice}/{offer.productUnit} (Buyer can accept, counter back, or decline)
                      </span>
                    )}

                    {isAccepted && (
                      <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                        ✓ Deal confirmed at ₹{offer.finalDealPrice}/{offer.productUnit}. Awaiting customer checkout.
                      </span>
                    )}

                    {isOrdered && (
                      <span style={{ fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
                        📦 Customer completed order. Fulfill in Customer Orders section.
                      </span>
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
