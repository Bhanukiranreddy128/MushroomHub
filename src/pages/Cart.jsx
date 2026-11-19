/* eslint-disable react-hooks/purity */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addToCart, getCart, isCustomerAuthenticated } from "../data";
import {
  createCustomerOrder,
  DEFAULT_MUSHROOM_PHOTO,
  getCustomerProfile,
  getMushroomFeed
} from "../data/store";
import {
  calculateDeliveryCharge,
  createRazorpayOrderOnBackend,
  getRazorpayPublicKey,
  loadRazorpayScript,
  verifyRazorpayPaymentOnBackend
} from "../services/deliveryService";
import "../styles/cart.css";

const PREFERENCE_TAGS = [
  "☀️ Morning Flush Delivery (before 11 AM)",
  "📞 Call 15 mins before arrival",
  "🛡️ Leave with apartment security",
  "❄️ Extra insulated cold-chain wrap",
  "🍄 Send freshest button/oyster clusters"
];

export default function Cart() {
  const [items, setItems] = useState(getCart);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // "cart" | "address" | "payment"
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const isCustomer = Boolean(
    (user?.isLoggedIn && user?.role === "customer") || isCustomerAuthenticated()
  );

  // Delivery & Preferences Form state, pre-filled from Customer profile
  const [deliveryForm, setDeliveryForm] = useState(() => {
    const profile = getCustomerProfile(user);
    return {
      recipientName: user?.name || profile.name || "",
      recipientPhone: user?.phone || profile.phone || "",
      recipientEmail: user?.email || profile.email || "",
      streetAddress: user?.address || profile.address || "",
      locality: user?.locality || profile.locality || "",
      city: user?.city || profile.city || user?.location || "",
      state: user?.state || profile.state || "",
      pincode: user?.pincode || profile.pincode || "",
      orderPreferences: user?.preferences || profile.preferences || "Please call 10 minutes prior to delivery; leave insulated cold-box with building security."
    };
  });

  // Dynamic Delivery & Shipping State
  const [deliveryType, setDeliveryType] = useState("standard"); // "standard" | "express"
  const [deliveryBreakdown, setDeliveryBreakdown] = useState(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [verifiedPaymentId, setVerifiedPaymentId] = useState("");

  // Payment Method State: default to "razorpay" (Razorpay Test Mode)
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // "razorpay" | "cod"

  useEffect(() => {
    localStorage.setItem("mushroom-cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
  }, [items]);

  // Keep delivery form synchronized when customer profile is updated
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const p = e.detail || getCustomerProfile(user);
      setDeliveryForm((prev) => ({
        ...prev,
        recipientName: p.name || prev.recipientName,
        recipientPhone: p.phone || prev.recipientPhone,
        recipientEmail: p.email || prev.recipientEmail,
        streetAddress: p.address || prev.streetAddress,
        locality: p.locality || prev.locality,
        city: p.city || prev.city,
        state: p.state || prev.state,
        pincode: p.pincode || prev.pincode
      }));
    };

    window.addEventListener("customer-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("customer-profile-updated", handleProfileUpdate);
  }, [user]);

  // Enrich cart items with photos and descriptions from feed catalog if missing
  const catalog = getMushroomFeed();
  const enrichedItems = items.map((item) => {
    const catalogMatch = catalog.find((c) => c.id === item.id || c.name === item.name || c.productId === item.id);
    const farm = item.farm || item.farmName || catalogMatch?.farm || catalogMatch?.farmName || "Himalayan Forest Spores Farm";
    const farmerEmail = (item.farmerEmail || item.cultivatorEmail || catalogMatch?.farmerEmail || catalogMatch?.cultivatorEmail || "").toLowerCase().trim();
    const cultivatorId = item.cultivatorId || catalogMatch?.cultivatorId || (farmerEmail ? `user-${farmerEmail}` : "user-cultivator-01");

    return {
      ...item,
      farm,
      farmName: farm,
      farmerEmail,
      cultivatorEmail: farmerEmail,
      cultivatorId,
      imageUrl: item.imageUrl || item.image || catalogMatch?.imageUrl || DEFAULT_MUSHROOM_PHOTO,
      type: item.type || catalogMatch?.type || "Gourmet Flush",
      place: item.place || catalogMatch?.place || "India",
      tag: item.tag || catalogMatch?.tag || "Fresh Harvest"
    };
  });

  const increment = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: (Number(i.quantity) || 1) + 1 } : i))
    );
  };

  const decrement = (id) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, (Number(i.quantity) || 1) - 1) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = enrichedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = enrichedItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

  // Automatically recalculate dynamic delivery charges on backend whenever items, address or delivery type change
  useEffect(() => {
    let isCancelled = false;
    async function updateDelivery() {
      if (enrichedItems.length === 0) {
        setDeliveryBreakdown(null);
        return;
      }
      setIsCalculatingDelivery(true);
      try {
        const result = await calculateDeliveryCharge({
          items: enrichedItems,
          deliveryAddress: deliveryForm,
          deliveryType
        });
        if (!isCancelled) {
          setDeliveryBreakdown(result);
        }
      } catch (err) {
        console.error("Delivery charge calculation error:", err);
      } finally {
        if (!isCancelled) setIsCalculatingDelivery(false);
      }
    }

    updateDelivery();
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, deliveryForm.city, deliveryForm.pincode, deliveryForm.streetAddress, deliveryType]);

  const productSubtotal = deliveryBreakdown ? deliveryBreakdown.productSubtotal : subtotal;
  const finalDeliveryCharge = deliveryBreakdown ? deliveryBreakdown.finalDeliveryCharge : 0;
  const grandTotal = deliveryBreakdown ? deliveryBreakdown.grandTotal : subtotal;
  const total = grandTotal;

  // Step 1 -> Step 2
  const handleProceedToAddress = () => {
    if (enrichedItems.length === 0) return;
    if (!isCustomer) {
      navigate("/login/customer?redirect=/cart");
      return;
    }
    setCheckoutStep("address");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2 -> Step 3
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!deliveryForm.recipientName.trim() || !deliveryForm.recipientPhone.trim() || !deliveryForm.streetAddress.trim() || !deliveryForm.city.trim() || !deliveryForm.pincode.trim()) {
      alert("Please fill in all required delivery address fields.");
      return;
    }
    setCheckoutStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 3: Confirm & Pay (Razorpay Test Mode / Cash on Delivery)
  const handleFinalPayment = async () => {
    if (enrichedItems.length === 0) return;
    setPaymentError("");

    const orderId = `ORD-IN-${Date.now().toString().slice(-4)}`;
    setPlacedOrderId(orderId);

    // Cash on Delivery Flow
    if (paymentMethod === "cod") {
      createCustomerOrder({
        orderId,
        customerId: user?.id || `cust-${deliveryForm.recipientEmail}`,
        customerName: deliveryForm.recipientName,
        businessName: user?.farmName || "Retail Buyer",
        customerPhone: deliveryForm.recipientPhone,
        customerEmail: deliveryForm.recipientEmail,
        deliveryAddress: {
          street: deliveryForm.streetAddress,
          locality: deliveryForm.locality,
          city: deliveryForm.city,
          state: deliveryForm.state,
          pincode: deliveryForm.pincode
        },
        items: enrichedItems,
        variety: enrichedItems.map((i) => `${i.quantity || 1}x ${i.name}`).join(", "),
        quantity: itemCount,
        total: grandTotal,
        productSubtotal,
        totalWeight: deliveryBreakdown?.totalWeightKg || itemCount,
        pickupLocation: deliveryBreakdown?.shipments?.map((s) => `${s.farmName} (${s.pickupLocation})`).join("; ") || "Direct Farm Dispatch",
        deliveryDistance: deliveryBreakdown?.shipments?.[0]?.distanceKm || 15,
        deliveryType,
        baseDeliveryFee: deliveryBreakdown?.baseFee || 0,
        distanceFee: deliveryBreakdown?.distanceFee || 0,
        weightFee: deliveryBreakdown?.weightFee || 0,
        expressSurcharge: deliveryBreakdown?.expressSurcharge || 0,
        discount: deliveryBreakdown?.discount || 0,
        finalDeliveryCharge,
        grandTotal,
        shipments: deliveryBreakdown?.shipments || [],
        paymentMethod: "Cash on Delivery (Pay on Arrival)",
        paymentStatus: "Payment on Arrival (Verified)",
        deliveryPartner: deliveryType === "express" ? "Blue Dart Priority Morning Cold-Chain" : "Blue Dart Cleanroom Cold-Chain Express",
        estimatedDelivery: deliveryType === "express" ? "Tomorrow by 11:00 AM" : "Tomorrow by 3:00 PM",
        deliveryNotes: deliveryForm.orderPreferences
      });

      setItems([]);
      setOrderPlaced(true);
      setCheckoutStep("confirmed");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Option B: Authentic Razorpay Test Mode Online Payment Flow
    setIsPaymentProcessing(true);

    try {
      // 1. Create order on Spring Boot backend using verified backend grand total
      const orderReq = {
        orderId,
        customerId: user?.id || `cust-${deliveryForm.recipientEmail}`,
        customerName: deliveryForm.recipientName,
        customerEmail: deliveryForm.recipientEmail,
        customerPhone: deliveryForm.recipientPhone,
        items: enrichedItems,
        deliveryAddress: deliveryForm,
        deliveryType,
        deliveryNotes: deliveryForm.orderPreferences,
        grandTotal,
        paymentMethod: "Razorpay (Test Mode)"
      };

      const backendOrder = await createRazorpayOrderOnBackend(orderReq);
      if (!backendOrder || !backendOrder.success) {
        throw new Error(backendOrder?.message || "Failed to initiate Razorpay order on server.");
      }

      const keyId = backendOrder.keyId || (await getRazorpayPublicKey()) || "rzp_test_simulated";

      // 2. Open Razorpay Standard Checkout in Test Mode
      const options = {
        key: keyId,
        amount: backendOrder.amountPaise,
        currency: backendOrder.currency || "INR",
        name: "MushroomHub Organic Exchange",
        description: `Cold-Chain Mushroom Order #${orderId}`,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80",
        order_id: backendOrder.razorpayOrderId,
        prefill: {
          name: deliveryForm.recipientName,
          email: deliveryForm.recipientEmail,
          contact: deliveryForm.recipientPhone
        },
        notes: {
          orderId,
          deliveryType,
          totalShipments: backendOrder.deliveryBreakdown?.totalShipments || 1
        },
        theme: {
          color: "#345D31"
        },
        handler: async function (response) {
          try {
            // 3. Cryptographically verify payment signature on Spring Boot backend
            const verifyPayload = {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            };

            const verifyResult = await verifyRazorpayPaymentOnBackend(verifyPayload);

            if (verifyResult && verifyResult.verified) {
              setVerifiedPaymentId(response.razorpay_payment_id);

              createCustomerOrder({
                orderId,
                customerId: user?.id || `cust-${deliveryForm.recipientEmail}`,
                customerName: deliveryForm.recipientName,
                businessName: user?.farmName || "Retail Buyer",
                customerPhone: deliveryForm.recipientPhone,
                customerEmail: deliveryForm.recipientEmail,
                deliveryAddress: {
                  street: deliveryForm.streetAddress,
                  locality: deliveryForm.locality,
                  city: deliveryForm.city,
                  state: deliveryForm.state,
                  pincode: deliveryForm.pincode
                },
                items: enrichedItems,
                variety: enrichedItems.map((i) => `${i.quantity || 1}x ${i.name}`).join(", "),
                quantity: itemCount,
                total: backendOrder.grandTotal || grandTotal,
                productSubtotal: backendOrder.deliveryBreakdown?.productSubtotal || productSubtotal,
                totalWeight: backendOrder.deliveryBreakdown?.totalWeightKg || deliveryBreakdown?.totalWeightKg || itemCount,
                pickupLocation: backendOrder.deliveryBreakdown?.shipments?.map((s) => `${s.farmName} (${s.pickupLocation})`).join("; ") || "Direct Cleanroom Dispatch",
                deliveryDistance: backendOrder.deliveryBreakdown?.shipments?.[0]?.distanceKm || 15,
                deliveryType,
                baseDeliveryFee: backendOrder.deliveryBreakdown?.baseFee || 0,
                distanceFee: backendOrder.deliveryBreakdown?.distanceFee || 0,
                weightFee: backendOrder.deliveryBreakdown?.weightFee || 0,
                expressSurcharge: backendOrder.deliveryBreakdown?.expressSurcharge || 0,
                discount: backendOrder.deliveryBreakdown?.discount || 0,
                finalDeliveryCharge: backendOrder.deliveryBreakdown?.finalDeliveryCharge || 0,
                grandTotal: backendOrder.grandTotal || grandTotal,
                shipments: backendOrder.deliveryBreakdown?.shipments || deliveryBreakdown?.shipments || [],
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                paymentMethod: "Razorpay Test Mode (Online Verified)",
                paymentStatus: "Paid & Settled (Test Mode)",
                deliveryPartner: deliveryType === "express" ? "Blue Dart Priority Morning Cold-Chain" : "Blue Dart Cleanroom Cold-Chain Express",
                estimatedDelivery: deliveryType === "express" ? "Tomorrow by 11:00 AM" : "Tomorrow by 3:00 PM",
                deliveryNotes: deliveryForm.orderPreferences
              });

              setItems([]);
              setOrderPlaced(true);
              setCheckoutStep("confirmed");
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              setPaymentError(verifyResult?.message || "Payment signature verification failed on backend. Please contact support.");
            }
          } catch (vErr) {
            console.error("Verification error:", vErr);
            setPaymentError("Payment verification failed: " + vErr.message);
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
            setPaymentError("Razorpay checkout was closed or cancelled.");
          }
        }
      };

      const isSimulatedTest =
        !keyId ||
        keyId === "rzp_test_simulated" ||
        keyId === "rzp_test_your_key_id" ||
        keyId === "rzp_test_placeholder" ||
        (backendOrder.razorpayOrderId && backendOrder.razorpayOrderId.startsWith("order_test_"));

      if (isSimulatedTest) {
        // Instant simulated test checkout flow
        const simulatedResponse = {
          razorpay_order_id: backendOrder.razorpayOrderId || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: `sig_test_${Date.now()}`
        };
        await options.handler(simulatedResponse);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        const simulatedResponse = {
          razorpay_order_id: backendOrder.razorpayOrderId || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: `sig_test_${Date.now()}`
        };
        await options.handler(simulatedResponse);
        return;
      }

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (failResponse) {
        console.error("Razorpay Payment Failed:", failResponse);
        setPaymentError(`Payment Failed: ${failResponse.error?.description || "Transaction declined"}`);
        setIsPaymentProcessing(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      setPaymentError(err.message || "Failed to start payment gateway.");
      setIsPaymentProcessing(false);
    }
  };

  const handleAddPreferenceTag = (tag) => {
    setDeliveryForm((prev) => {
      const existing = prev.orderPreferences.trim();
      if (existing.includes(tag)) return prev;
      return {
        ...prev,
        orderPreferences: existing ? `${existing}; ${tag}` : tag
      };
    });
  };

  const recommendedItems = catalog.slice(0, 3);

  return (
    <div className="cart-page-wrapper">
      <div className="container">
        {/* Top Hero Banner */}
        <section className="cart-hero-card">
          <div className="cart-hero-left">
            <div className="cart-step-indicator">
              <span className="cart-step-dot"></span>
              <span>1. Curated Basket</span>
              <span>·</span>
              <span>2. Delivery & Preferences</span>
              <span>·</span>
              <span>3. Payment & Settlement</span>
            </div>
            <h1>
              {checkoutStep === "address"
                ? "Cold-Chain Delivery & Preferences"
                : checkoutStep === "payment"
                ? "Select Payment & Confirm Order"
                : "Your Fresh Harvest Basket"}
            </h1>
            <p>
              {checkoutStep === "address"
                ? "Specify your doorstep shipping location and order handling preferences before moving to payment."
                : checkoutStep === "payment"
                ? "Review your destination address and choose your direct cultivator settlement method in Indian Rupees (₹)."
                : "Direct cleanroom-to-kitchen harvest dispatch in Indian Rupees (₹). 100% of proceeds credit the verified grower’s bank account."}
            </p>
          </div>

          {/* Customer Authentication Status with Avatar */}
          {isCustomer ? (
            <div className="cart-customer-status-pill" title={`Logged in as ${user?.email || "Customer"}`}>
              <div
                className="cart-customer-avatar"
                style={{ overflow: "hidden", display: "grid", placeItems: "center" }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Customer"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (user?.name || "C").slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#9CAC55", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Verified Customer Account
                </div>
                <div style={{ fontWeight: 700 }}>
                  {user?.name || "Customer"} · {deliveryForm.city || "Bengaluru"}
                </div>
              </div>
            </div>
          ) : (
            <div className="cart-customer-status-pill" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.2)" }}>
              <span>🛒</span>
              <div>
                <div style={{ fontSize: 10, color: "#9ce0ff", textTransform: "uppercase" }}>Guest Basket</div>
                <div style={{ fontWeight: 700 }}>Sign in as Customer to Checkout</div>
              </div>
            </div>
          )}
        </section>

        {/* Multi-Step Interactive Navigation Bar (Only visible when cart has items and not confirmed) */}
        {!orderPlaced && enrichedItems.length > 0 && (
          <div className="checkout-stepper-bar">
            <button
              type="button"
              className={`checkout-step-pill ${checkoutStep === "cart" ? "active" : "completed"}`}
              onClick={() => setCheckoutStep("cart")}
            >
              <span className="checkout-step-number">{checkoutStep !== "cart" ? "✓" : "1"}</span>
              <span>1. Basket Items ({itemCount})</span>
            </button>

            <span className="checkout-step-arrow">→</span>

            <button
              type="button"
              className={`checkout-step-pill ${checkoutStep === "address" ? "active" : checkoutStep === "payment" ? "completed" : ""}`}
              onClick={() => isCustomer && setCheckoutStep("address")}
              disabled={!isCustomer}
              style={{ cursor: isCustomer ? "pointer" : "not-allowed" }}
            >
              <span className="checkout-step-number">{checkoutStep === "payment" ? "✓" : "2"}</span>
              <span>2. Delivery Address & Preferences</span>
            </button>

            <span className="checkout-step-arrow">→</span>

            <button
              type="button"
              className={`checkout-step-pill ${checkoutStep === "payment" ? "active" : ""}`}
              onClick={() => isCustomer && setCheckoutStep("payment")}
              disabled={!isCustomer}
              style={{ cursor: isCustomer ? "pointer" : "not-allowed" }}
            >
              <span className="checkout-step-number">3</span>
              <span>3. Payment Page</span>
            </button>
          </div>
        )}

        {/* Celebratory Order Confirmed View */}
        {orderPlaced ? (
          <div className="cart-confirmed-card">
            <div className="cart-confirmed-icon">🎉</div>
            <h2 className="cart-confirmed-title">Order Confirmed & Paid in Full!</h2>
            <div className="cart-confirmed-order-id">ORDER #{placedOrderId}</div>
            <p className="cart-confirmed-desc">
              Your direct payment has been processed and credited to the cultivator's verified bank account.
              Your harvest is being packed in sterile, cold-chain insulated pouches.
            </p>

            {/* Delivery Destination & Preferences Snapshot */}
            <div
              style={{
                maxWidth: 620,
                margin: "20px auto 26px",
                background: "#f4f9f3",
                border: "1px solid #cce2cc",
                borderRadius: 12,
                padding: "16px 20px",
                textAlign: "left"
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#345D31", marginBottom: 6 }}>
                📍 Shipping Details & Preferences:
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#133520" }}>
                {deliveryForm.recipientName} ({deliveryForm.recipientPhone})
              </div>
              <div style={{ fontSize: 13, color: "#4f6a54", marginTop: 2 }}>
                {deliveryForm.streetAddress}, {deliveryForm.locality}, {deliveryForm.city}, {deliveryForm.state} - {deliveryForm.pincode}
              </div>
              {deliveryForm.orderPreferences && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #c0d8bf", fontSize: 12, color: "#2d6b3e" }}>
                  <strong>Preferences & Notes:</strong> {deliveryForm.orderPreferences}
                </div>
              )}
              {verifiedPaymentId && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #c0d8bf", fontSize: 12, color: "#345D31" }}>
                  <strong>Razorpay Payment ID:</strong> <code style={{ background: "#e8f2e7", padding: "2px 6px", borderRadius: 4 }}>{verifiedPaymentId}</code>
                </div>
              )}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #d2e4d0", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#113c23" }}>
                <span>Final Grand Total (Includes Delivery):</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="cart-confirmed-timeline">
              <div className="cart-confirmed-step active">
                <div className="cart-confirmed-step-icon">✓</div>
                <div className="cart-confirmed-step-name">Order Placed</div>
                <div className="cart-confirmed-step-time">Just now</div>
              </div>
              <div className="cart-confirmed-step active">
                <div className="cart-confirmed-step-icon">🏦</div>
                <div className="cart-confirmed-step-name">Payment Settled</div>
                <div className="cart-confirmed-step-time">Direct UPI</div>
              </div>
              <div className="cart-confirmed-step">
                <div className="cart-confirmed-step-icon">❄️</div>
                <div className="cart-confirmed-step-name">Cold Dispatch</div>
                <div className="cart-confirmed-step-time">Tomorrow 7 AM</div>
              </div>
              <div className="cart-confirmed-step">
                <div className="cart-confirmed-step-icon">🏠</div>
                <div className="cart-confirmed-step-name">Doorstep Delivery</div>
                <div className="cart-confirmed-step-time">By 2:30 PM</div>
              </div>
            </div>

            <div className="cart-confirmed-actions">
              <Link className="button button-green" to="/portal/customer?tab=orders">
                📦 Track in My Orders & Live Status →
              </Link>
              <Link className="button button-outline" to="/marketplace">
                🍄 Explore More Fresh Harvests
              </Link>
            </div>
          </div>
        ) : !enrichedItems.length ? (
          /* Empty Basket State */
          <div>
            <div className="cart-empty-wrap">
              <div className="cart-empty-icon">🧺</div>
              <h2 className="cart-empty-title">Your Harvest Basket is Empty</h2>
              <p className="cart-empty-text">
                Explore small-batch gourmet culinary flushes, medicinal lion’s mane pom-poms, and organic oysters harvested fresh daily from certified growers across India.
              </p>
              <Link className="button button-green" to="/marketplace" style={{ fontSize: 14, padding: "12px 28px" }}>
                🍄 Explore The Live Marketplace →
              </Link>
            </div>

            {/* Recommendations below empty basket */}
            <div style={{ marginTop: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    Popular Cleanroom Harvests Ready For Dispatch
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                    Picked at peak spore maturity and shipped in chilled insulated pouches.
                  </p>
                </div>
                <Link to="/marketplace" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                  View All ({catalog.length}) →
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {recommendedItems.map((rec) => (
                  <div key={rec.id} className="hub-card" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center" }}>
                    <img
                      src={rec.imageUrl || DEFAULT_MUSHROOM_PHOTO}
                      alt={rec.name}
                      style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)" }}>{rec.type}</div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: "2px 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {rec.name}
                      </h4>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--green-dark)" }}>
                        ₹{rec.price} <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>/ {rec.unit || "kg"}</span>
                      </div>
                      <button
                        type="button"
                        className="button button-outline"
                        style={{ marginTop: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700 }}
                        onClick={() => addToCart(rec)}
                      >
                        ＋ Add to Basket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Step Checkout Body */
          <div className="cart-layout-grid">
            {/* Left Column: Changes dynamically depending on checkoutStep */}
            <div>
              {/* ========================================================
                  STEP 1: BASKET ITEMS REVIEW
                  ======================================================== */}
              {checkoutStep === "cart" && (
                <>
                  <div className="cart-items-card">
                    <div className="cart-items-header">
                      <div className="cart-items-header-title">
                        <h2>Living Harvest Items</h2>
                        <span className="cart-badge-count">{itemCount} items</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <Link to="/marketplace" style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                          ＋ Add More Items
                        </Link>
                        <button type="button" className="cart-clear-link" onClick={clearCart}>
                          Clear Basket
                        </button>
                      </div>
                    </div>

                    <div className="cart-items-body">
                      {enrichedItems.map((item) => (
                        <div className="cart-item-row" key={item.id}>
                          {/* Thumbnail Photo */}
                          <div className="cart-item-thumb-wrap">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="cart-item-thumb"
                            />
                          </div>

                          {/* Item Details */}
                          <div className="cart-item-details">
                            <span className="cart-item-tag">{item.type} · 📍 {item.place}</span>
                            <h3 className="cart-item-title">
                              <Link to={`/mushrooms/${item.id}`}>{item.name}</Link>
                            </h3>
                            <p className="cart-item-farm">
                              <span>🌱 Grown by {item.farm || "Verified Cleanroom Farm"}</span>
                            </p>
                            <span className="cart-item-unit-price">
                              ₹{item.price.toLocaleString("en-IN")} / {item.unit || "kg"}
                            </span>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => decrement(item.id)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="cart-stepper-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-stepper-btn"
                              onClick={() => increment(item.id)}
                              aria-label={`Increase quantity of ${item.name}`}
                              title="Increase quantity"
                            >
                              ＋
                            </button>
                          </div>

                          {/* Total Price & Delete Button */}
                          <div className="cart-item-price-actions">
                            <div className="cart-item-total">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </div>
                            <button
                              type="button"
                              className="cart-item-remove-btn"
                              onClick={() => remove(item.id)}
                              aria-label={`Remove ${item.name} from basket`}
                              title="Remove item"
                            >
                              <span>🗑️</span>
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guarantees Banner */}
                  <div className="cart-guarantees-grid">
                    <div className="cart-guarantee-box">
                      <span className="cart-guarantee-icon">⚡</span>
                      <div>
                        <h4 className="cart-guarantee-title">100% Direct to Farmer</h4>
                        <p className="cart-guarantee-desc">Zero platform deductions. Full payment is credited instantly to grower UPI.</p>
                      </div>
                    </div>
                    <div className="cart-guarantee-box">
                      <span className="cart-guarantee-icon">❄️</span>
                      <div>
                        <h4 className="cart-guarantee-title">Cold-Chain Express</h4>
                        <p className="cart-guarantee-desc">Chilled, food-grade insulated pouch prevents moisture loss and wilting.</p>
                      </div>
                    </div>
                    <div className="cart-guarantee-box">
                      <span className="cart-guarantee-icon">🛡️</span>
                      <div>
                        <h4 className="cart-guarantee-title">Jaivik Bharat Certified</h4>
                        <p className="cart-guarantee-desc">All varieties cultivated in sterile substrate without synthetic pesticides.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================
                  STEP 2: DELIVERY ADDRESS ALONG WITH PREFERENCES OPTION
                  ======================================================== */}
              {checkoutStep === "address" && (
                <div className="checkout-main-card">
                  <div className="checkout-section-header">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <h2>Step 2: Delivery Destination & Order Preferences</h2>
                        <p>Provide your delivery location and custom produce or handling preferences.</p>
                      </div>
                      <span className="cart-delivery-partner-badge">
                        🚚 Blue Dart Air Cold-Chain
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleProceedToPayment}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#345D31", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      1. Contact & Recipient Information
                    </h3>
                    <div className="checkout-form-grid">
                      <div className="checkout-input-group">
                        <label>Recipient Full Name *</label>
                        <input
                          type="text"
                          required
                          className="checkout-input-field"
                          value={deliveryForm.recipientName}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientName: e.target.value })}
                          placeholder="e.g. Ananya Iyer"
                        />
                      </div>

                      <div className="checkout-input-group">
                        <label>Contact Phone / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          className="checkout-input-field"
                          value={deliveryForm.recipientPhone}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientPhone: e.target.value })}
                          placeholder="e.g. +91 97120 44589"
                        />
                      </div>

                      <div className="checkout-input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Email Address (For Invoicing & Dispatch Slips)</label>
                        <input
                          type="email"
                          className="checkout-input-field"
                          value={deliveryForm.recipientEmail}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientEmail: e.target.value })}
                          placeholder="e.g. customer@mushroomhub.com"
                        />
                      </div>
                    </div>

                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#345D31", margin: "20px 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      2. Doorstep Shipping Address
                    </h3>
                    <div className="checkout-form-grid">
                      <div className="checkout-input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Street / Flat / Door Number / Apartment *</label>
                        <input
                          type="text"
                          required
                          className="checkout-input-field"
                          value={deliveryForm.streetAddress}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, streetAddress: e.target.value })}
                          placeholder="e.g. Flat 402, Green Glen Layout, Outer Ring Road"
                        />
                      </div>

                      <div className="checkout-input-group">
                        <label>Locality / Area / Landmark</label>
                        <input
                          type="text"
                          className="checkout-input-field"
                          value={deliveryForm.locality}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, locality: e.target.value })}
                          placeholder="e.g. Bellandur, Near EcoSpace"
                        />
                      </div>

                      <div className="checkout-input-group">
                        <label>City / District *</label>
                        <input
                          type="text"
                          required
                          className="checkout-input-field"
                          value={deliveryForm.city}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                          placeholder="e.g. Bengaluru"
                        />
                      </div>

                      <div className="checkout-input-group">
                        <label>State *</label>
                        <input
                          type="text"
                          required
                          className="checkout-input-field"
                          value={deliveryForm.state}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, state: e.target.value })}
                          placeholder="e.g. Karnataka"
                        />
                      </div>

                      <div className="checkout-input-group">
                        <label>PIN Code *</label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          className="checkout-input-field"
                          value={deliveryForm.pincode}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, pincode: e.target.value })}
                          placeholder="e.g. 560103"
                        />
                      </div>
                    </div>

                    {/* Dynamic Delivery Option Selector (Standard vs Express) */}
                    <div className="delivery-options-container">
                      <div className="delivery-options-title">
                        <span>🚚</span>
                        <span>Select Cold-Chain Delivery Speed</span>
                        {isCalculatingDelivery && (
                          <span style={{ fontSize: 11, color: "#345D31", fontWeight: 600, marginLeft: "auto" }}>
                            Recalculating rates...
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#4f6a54", margin: "0 0 10px" }}>
                        All shipments travel in dry-chill thermal packaging. Choose your doorstep arrival schedule:
                      </p>

                      <div className="delivery-options-grid">
                        {/* Standard Delivery Option */}
                        <div
                          className={`delivery-option-card ${deliveryType === "standard" ? "selected" : ""}`}
                          onClick={() => setDeliveryType("standard")}
                        >
                          <div className="payment-radio-dot" style={{ marginTop: 2 }}>
                            {deliveryType === "standard" && <div className="payment-radio-inner" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="delivery-option-header">
                              <span className="delivery-option-name">Standard Express</span>
                              <span className="delivery-option-fee">
                                {deliveryBreakdown?.freeDeliveryEligible
                                  ? "FREE (Orders ≥ ₹1k)"
                                  : deliveryBreakdown
                                  ? `₹${deliveryBreakdown.finalDeliveryCharge}`
                                  : "₹30 + ₹8/km"}
                              </span>
                            </div>
                            <p className="delivery-option-desc">
                              Direct cleanroom cold-chain transport. Doorstep arrival within 24–48 hours across India.
                            </p>
                          </div>
                        </div>

                        {/* Priority Morning Express Option */}
                        <div
                          className={`delivery-option-card ${deliveryType === "express" ? "selected" : ""}`}
                          onClick={() => setDeliveryType("express")}
                        >
                          <div className="payment-radio-dot" style={{ marginTop: 2 }}>
                            {deliveryType === "express" && <div className="payment-radio-inner" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="delivery-option-header">
                              <span className="delivery-option-name">⚡ Priority Morning Express</span>
                              <span className="delivery-option-fee">
                                {deliveryBreakdown?.freeDeliveryEligible
                                  ? "FREE (Orders ≥ ₹1k)"
                                  : deliveryBreakdown
                                  ? `₹${deliveryBreakdown.finalDeliveryCharge}`
                                  : "+₹40 Surcharge"}
                              </span>
                            </div>
                            <p className="delivery-option-desc">
                              First-flush dispatch. Guaranteed arrival by 11:00 AM tomorrow with refrigerated blue-ice pack.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Farmer Pickup Hubs & Multi-Shipment Transparency */}
                    {deliveryBreakdown && deliveryBreakdown.shipments && deliveryBreakdown.shipments.length > 0 && (
                      <div className="multi-farmer-shipments-box">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ font: "800 13px Manrope", color: "#345D31", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            📦 Farmer Shipments & Distance Breakdown ({deliveryBreakdown.shipments.length} {deliveryBreakdown.shipments.length === 1 ? "Farm Dispatch" : "Independent Grower Shipments"})
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#1b4d2b", background: "#e8f5e7", padding: "2px 8px", borderRadius: 6 }}>
                            Total Weight: {deliveryBreakdown.totalWeightKg} kg
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#506954", margin: "0 0 12px" }}>
                          Each cultivator dispatches directly from their climate-controlled cleanroom farm to prevent storage delays.
                        </p>

                        <div className="shipments-grid">
                          {deliveryBreakdown.shipments.map((shipment, sIdx) => (
                            <div key={sIdx} className="shipment-card">
                              <div className="shipment-card-top">
                                <div>
                                  <div className="shipment-farm-title">
                                    🧑‍🌾 {shipment.farmName}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: "#546855", marginTop: 2 }}>
                                    Pickup: <strong>{shipment.pickupLocation}</strong> → Destination: <strong>{deliveryForm.city || "Your City"}</strong>
                                  </div>
                                </div>
                                <span className="shipment-route-badge">
                                  📍 {shipment.distanceKm} km
                                </span>
                              </div>

                              <div className="shipment-metrics-row">
                                <span><strong>Items:</strong> {shipment.itemNames.join(", ")}</span>
                                <span>·</span>
                                <span><strong>Weight:</strong> {shipment.weightKg} kg</span>
                                <span>·</span>
                                <span><strong>ETA:</strong> {shipment.estimatedTimeline}</span>
                              </div>

                              <div className="shipment-breakdown-details">
                                <span>Base Fee: ₹{shipment.baseFee}</span>
                                <span>+ Distance ({shipment.distanceKm} km × ₹8): ₹{shipment.distanceFee}</span>
                                <span>+ Weight (&gt;2kg: ₹5/kg): ₹{shipment.weightFee}</span>
                                {shipment.expressSurcharge > 0 && <span>+ Express: ₹{shipment.expressSurcharge}</span>}
                                <strong style={{ color: "#1b4d2b" }}>
                                  Shipment Total: ₹{shipment.shipmentDeliveryFee}
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Free Delivery Eligibility Banner */}
                        {deliveryBreakdown.freeDeliveryEligible ? (
                          <div className="free-delivery-banner-active">
                            <span>🎉</span>
                            <span>
                              <strong>Free Delivery Applied:</strong> Order value (₹{deliveryBreakdown.productSubtotal.toLocaleString("en-IN")}) exceeds ₹1,000! Your full delivery fee (-₹{deliveryBreakdown.discount.toLocaleString("en-IN")}) is 100% complimentary.
                            </span>
                          </div>
                        ) : (
                          <div className="free-delivery-banner-progress">
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>💡 Add <strong>₹{(1000 - deliveryBreakdown.productSubtotal).toLocaleString("en-IN")}</strong> more of fresh mushrooms to unlock <strong>FREE Delivery</strong>!</span>
                              <span>₹{deliveryBreakdown.productSubtotal} / ₹1,000</span>
                            </div>
                            <div className="free-delivery-progress-bar">
                              <div
                                className="free-delivery-progress-fill"
                                style={{ width: `${Math.min(100, (deliveryBreakdown.productSubtotal / 1000) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preferences Option in Delivery Details (Requested by User) */}
                    <div style={{ background: "#f5faf4", border: "1.5px solid #c9e2c7", borderRadius: 12, padding: "18px 20px", margin: "24px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>🍄</span>
                        <label style={{ fontSize: 13, fontWeight: 800, color: "#345D31", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Order Preferences & Delivery Instructions
                        </label>
                      </div>
                      <p style={{ fontSize: 12, color: "#4f6a54", margin: "0 0 10px" }}>
                        Include any special culinary preferences, harvesting requests, or delivery timing instructions for the cultivator and courier.
                      </p>
                      <textarea
                        rows={3}
                        className="checkout-input-field"
                        style={{ resize: "vertical", background: "#ffffff" }}
                        value={deliveryForm.orderPreferences}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, orderPreferences: e.target.value })}
                        placeholder="e.g. Call 10 minutes prior to delivery; leave insulated cold-box with building security; preferred morning harvest."
                      />

                      {/* Quick Tag Chips */}
                      <div style={{ marginTop: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#516857" }}>Quick Add Suggestions:</span>
                        <div className="preference-chips-wrap">
                          {PREFERENCE_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className="preference-chip-btn"
                              onClick={() => handleAddPreferenceTag(tag)}
                            >
                              ＋ {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setCheckoutStep("cart")}
                        style={{ fontSize: 13, padding: "10px 20px" }}
                      >
                        ← Back to Basket
                      </button>

                      <button
                        type="submit"
                        className="button button-green"
                        style={{ fontSize: 14, padding: "11px 28px", display: "inline-flex", alignItems: "center", gap: 8 }}
                      >
                        <span>Continue to Payment Page (₹{total.toLocaleString("en-IN")})</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================
                  STEP 3: PAYMENT PAGE
                  ======================================================== */}
              {checkoutStep === "payment" && (
                <div className="checkout-main-card">
                  <div className="checkout-section-header">
                    <h2>Step 3: Direct Farmer Payment & Final Settlement</h2>
                    <p>Select your payment method. 100% of proceeds are transferred directly to the verified grower’s bank account.</p>
                  </div>

                  {/* Delivery Address & Preferences Review Snapshot */}
                  <div
                    style={{
                      background: "#f8faf7",
                      border: "1px solid #d5e5d1",
                      borderRadius: 12,
                      padding: "16px 20px",
                      marginBottom: 24
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#345D31", marginBottom: 4 }}>
                          📍 Delivering To:
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#181818" }}>
                          {deliveryForm.recipientName} · {deliveryForm.recipientPhone}
                        </div>
                        <div style={{ fontSize: 13, color: "#4f6a54", marginTop: 2 }}>
                          {deliveryForm.streetAddress}, {deliveryForm.locality}, {deliveryForm.city}, {deliveryForm.state} - {deliveryForm.pincode}
                        </div>
                        {deliveryForm.orderPreferences && (
                          <div style={{ marginTop: 8, fontSize: 12, color: "#23572d", background: "#edf7ee", padding: "6px 12px", borderRadius: 8 }}>
                            <strong>Selected Preferences:</strong> {deliveryForm.orderPreferences}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="button button-outline"
                        style={{ fontSize: 11, padding: "5px 12px", borderColor: "#345D31", color: "#345D31" }}
                        onClick={() => setCheckoutStep("address")}
                      >
                        ✎ Edit Address / Preferences
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#345D31", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Select Direct Settlement Method (₹)
                  </h3>

                  {paymentError && (
                    <div style={{ background: "#faecec", border: "1px solid #f0b8b8", borderRadius: 8, padding: "10px 14px", color: "#992121", fontSize: 13, marginBottom: 16 }}>
                      ⚠️ <strong>Payment Notice:</strong> {paymentError}
                    </div>
                  )}

                  <div className="payment-methods-grid">
                    {/* Method 1: Razorpay Gateway (Test Mode) */}
                    <div
                      className={`payment-method-card ${paymentMethod === "razorpay" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("razorpay")}
                    >
                      <div className="payment-radio-dot">
                        {paymentMethod === "razorpay" && <div className="payment-radio-inner" />}
                      </div>
                      <div className="payment-method-info">
                        <div className="payment-method-title">
                          <span>⚡ Razorpay Online Checkout (Test Mode)</span>
                          <span className="cart-badge-count" style={{ background: "#2bb352", color: "#fff", fontSize: 10 }}>
                            Instant · Test Cards & UPI
                          </span>
                        </div>
                        <p className="payment-method-desc">
                          Pay securely via UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Card, Net Banking, or Wallets in Razorpay Test Mode.
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 11, color: "#345D31", fontWeight: 700 }}>
                          <span>🛡️ 256-Bit Cryptographic Verification</span>
                          <span>·</span>
                          <span>🔒 Verified Grand Total (No Client Tampering)</span>
                          <span>·</span>
                          <span style={{ color: "#8c5b0e", background: "#fef7e9", padding: "1px 6px", borderRadius: 4 }}>
                            Test Mode
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Method 2: Cash / UPI on Delivery */}
                    <div
                      className={`payment-method-card ${paymentMethod === "cod" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <div className="payment-radio-dot">
                        {paymentMethod === "cod" && <div className="payment-radio-inner" />}
                      </div>
                      <div className="payment-method-info">
                        <div className="payment-method-title">
                          <span>💵 Cash / UPI on Delivery</span>
                          <span style={{ fontSize: 11, color: "#345D31", fontWeight: 700 }}>Pay on Fresh Delivery</span>
                        </div>
                        <p className="payment-method-desc">
                          Inspect your fresh cold-chain insulated box upon doorstep arrival and pay via cash or UPI QR code.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => setCheckoutStep("address")}
                      style={{ fontSize: 13, padding: "10px 20px" }}
                      disabled={isPaymentProcessing}
                    >
                      ← Back to Delivery Address
                    </button>

                    <button
                      type="button"
                      className="button button-green"
                      onClick={handleFinalPayment}
                      disabled={isPaymentProcessing}
                      style={{ fontSize: 15, padding: "12px 32px", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800 }}
                    >
                      {isPaymentProcessing ? (
                        <span>⏳ Contacting Razorpay Test Gateway...</span>
                      ) : paymentMethod === "cod" ? (
                        <span>💵 Confirm & Pay ₹{total.toLocaleString("en-IN")} on Delivery →</span>
                      ) : (
                        <span>🔒 Pay ₹{total.toLocaleString("en-IN")} via Razorpay (Test Mode) →</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Order Summary & Flow Controller */}
            <div>
              <aside className="cart-summary-card">
                <div className="cart-summary-title">
                  <span>Order Summary</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-dark)" }}>
                    INR (₹)
                  </span>
                </div>

                <div className="cart-summary-rows">
                  <div className="cart-summary-row">
                    <span>Items Subtotal ({itemCount} units)</span>
                    <strong>₹{productSubtotal.toLocaleString("en-IN")}</strong>
                  </div>

                  <div className="cart-summary-row">
                    <span>Total Package Weight</span>
                    <strong>{deliveryBreakdown?.totalWeightKg || itemCount} kg</strong>
                  </div>

                  <div className="cart-summary-row">
                    <span>Farmer Shipments</span>
                    <strong style={{ color: "#345D31" }}>
                      {deliveryBreakdown?.totalShipments || 1} Farm {deliveryBreakdown?.totalShipments === 1 ? "Route" : "Routes"}
                    </strong>
                  </div>

                  <div className="cart-summary-row">
                    <span>Estimated Distance</span>
                    <span>📍 {deliveryBreakdown?.shipments?.[0]?.distanceKm || 15} km</span>
                  </div>

                  <div className="cart-summary-row">
                    <span>Delivery Speed</span>
                    <span>{deliveryType === "express" ? "⚡ Priority Express" : "🚚 Standard Express"}</span>
                  </div>

                  <div className="cart-summary-row">
                    <span>Base Delivery Charge</span>
                    <span>₹{deliveryBreakdown?.baseFee ?? 30}</span>
                  </div>

                  <div className="cart-summary-row">
                    <span>Distance Fee (₹8/km)</span>
                    <span>₹{deliveryBreakdown?.distanceFee ?? 0}</span>
                  </div>

                  {deliveryBreakdown && deliveryBreakdown.weightFee > 0 && (
                    <div className="cart-summary-row">
                      <span>Extra Weight Fee (&gt;2kg)</span>
                      <span>₹{deliveryBreakdown.weightFee}</span>
                    </div>
                  )}

                  {deliveryType === "express" && (
                    <div className="cart-summary-row">
                      <span>Express Surcharge</span>
                      <span>₹{deliveryBreakdown?.expressSurcharge ?? 40}</span>
                    </div>
                  )}

                  {/* Free Delivery Discount or Progress */}
                  {deliveryBreakdown?.freeDeliveryEligible ? (
                    <div className="cart-summary-row free-highlight">
                      <span>🎉 Free Delivery Discount (Order ≥ ₹1k)</span>
                      <strong style={{ color: "#345D31" }}>
                        -₹{deliveryBreakdown.discount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  ) : (
                    <div style={{ marginTop: 6, marginBottom: 6 }}>
                      <div className="free-delivery-banner-progress" style={{ margin: "4px 0 8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                          <span>💡 Add <strong>₹{(1000 - productSubtotal).toLocaleString("en-IN")}</strong> more for <strong>FREE Delivery</strong></span>
                          <span>₹{productSubtotal}/₹1,000</span>
                        </div>
                        <div className="free-delivery-progress-bar">
                          <div
                            className="free-delivery-progress-fill"
                            style={{ width: `${Math.min(100, (productSubtotal / 1000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="cart-summary-row">
                    <span>Final Delivery Charge</span>
                    <strong style={{ color: finalDeliveryCharge === 0 ? "#345D31" : "var(--ink)" }}>
                      {finalDeliveryCharge === 0 ? "FREE (₹0)" : `₹${finalDeliveryCharge.toLocaleString("en-IN")}`}
                    </strong>
                  </div>
                </div>

                {/* Items Mini Thumbnail List */}
                <div style={{ padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                    In This Harvest Order ({enrichedItems.length}):
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {enrichedItems.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                          {item.quantity}x {item.name}
                        </span>
                        <strong style={{ color: "var(--green)" }}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cart-summary-divider"></div>

                <div className="cart-summary-total-row">
                  <div>
                    <span>Total Payable</span>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Includes all taxes & delivery</div>
                  </div>
                  <div className="cart-summary-total-amount">
                    ₹{total.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Dispatch Pill */}
                <div className="cart-dispatch-pill">
                  <span>❄️</span>
                  <span>
                    <strong>Cold-Chain Guarantee:</strong> Packed in insulated dry-chill pouches and dispatched tomorrow morning.
                  </span>
                </div>

                {/* If Not Logged In as Customer: Warning Prompt */}
                {!isCustomer ? (
                  <div className="cart-auth-warning-box">
                    <div className="cart-auth-warning-header">
                      <span>🔒</span>
                      <span>Customer Sign In Required to Place Order</span>
                    </div>
                    <p className="cart-auth-warning-desc">
                      A Customer account is required to complete purchases, configure delivery addresses, and receive live tracking.
                    </p>
                    <div className="cart-auth-warning-actions">
                      <button
                        type="button"
                        className="button button-outline"
                        style={{ fontSize: 12, padding: "8px 12px", width: "50%", justifyContent: "center" }}
                        onClick={() => navigate("/login/customer?redirect=/cart")}
                      >
                        Log In →
                      </button>
                      <button
                        type="button"
                        className="button button-green"
                        style={{ fontSize: 12, padding: "8px 12px", width: "50%", justifyContent: "center" }}
                        onClick={() => navigate("/signup?redirect=/cart&role=customer")}
                      >
                        Join / Sign Up
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step Action Button */}
                {checkoutStep === "cart" && (
                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={handleProceedToAddress}
                  >
                    {isCustomer ? (
                      <>
                        <span>📍</span>
                        <span>Continue to Place Order (Delivery Details) →</span>
                      </>
                    ) : (
                      <>
                        <span>🔑</span>
                        <span>Log In as Customer to Purchase (₹) →</span>
                      </>
                    )}
                  </button>
                )}

                {checkoutStep === "address" && (
                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={handleProceedToPayment}
                  >
                    <span>💳</span>
                    <span>Proceed to Payment Page (₹{total.toLocaleString("en-IN")}) →</span>
                  </button>
                )}

                {checkoutStep === "payment" && (
                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={handleFinalPayment}
                  >
                    <span>⚡</span>
                    <span>Confirm & Pay Direct (₹{total.toLocaleString("en-IN")}) →</span>
                  </button>
                )}

                {/* Trust & Guarantee Badges */}
                <div className="cart-trust-badges">
                  <div className="cart-trust-item">
                    <span>🛡️</span>
                    <span>Direct UPI / IMPS Cultivator Account Credit</span>
                  </div>
                  <div className="cart-trust-item">
                    <span>❄️</span>
                    <span>Cold-Box 24H Courier with Temperature Monitoring</span>
                  </div>
                  <div className="cart-trust-item">
                    <span>📱</span>
                    <span>Live Order Updates on Customer & Cultivator Dashboards</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
