import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import MorningFlushSlider from "../../components/MorningFlushSlider";
import {
  addMushroomFeedItem,
  addRealtimeNotification,
  DEFAULT_MUSHROOM_PHOTO,
  deleteMushroomFeedItem,
  getMushroomFeed,
  MUSHROOM_PHOTO_PRESETS,
  updateMushroomFeedItem
} from "../../data/store";
import {
  getMyProducts,
  getMarketplaceProducts,
  createCultivatorProduct,
  updateCultivatorProduct,
  deleteCultivatorProduct,
  updateCultivatorStock
} from "../../services/cultivatorProductService";

export default function FeedManager({ onToast, autoOpenAddModal, onModalOpened }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState(() => getMushroomFeed());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalError, setModalError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and Drop state inside modal
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Form State for New or Edited Item
  const [formData, setFormData] = useState({
    name: "",
    type: "Oyster",
    price: 350,
    unit: "kg",
    stock: 25,
    tag: "Morning Harvest",
    color: "sage",
    imageUrl: DEFAULT_MUSHROOM_PHOTO,
    harvestDate: "Today, 6:00 AM",
    description: "",
    substrate: "Sterilized Oak Sawdust + 15% Organic Bran"
  });

  const loadFeed = useCallback(async () => {
    // 1. Fetch from Spring Boot PostgreSQL backend: all approved marketplace products and cultivator's own products
    try {
      const [marketplaceRes, myProductsRes] = await Promise.allSettled([
        getMarketplaceProducts(),
        getMyProducts()
      ]);

      const marketplaceProducts = marketplaceRes.status === "fulfilled" && Array.isArray(marketplaceRes.value)
        ? marketplaceRes.value
        : [];
      const myProducts = myProductsRes.status === "fulfilled" && Array.isArray(myProductsRes.value)
        ? myProductsRes.value
        : [];

      // Combine backend products deduplicated by productId
      const combinedRemoteMap = new Map();
      [...myProducts, ...marketplaceProducts].forEach((p) => {
        if (!p) return;
        const key = (p.productId || `prod-${p.id}` || "").toLowerCase().trim();
        if (key && !combinedRemoteMap.has(key)) {
          combinedRemoteMap.set(key, p);
        }
      });

      const remoteArray = Array.from(combinedRemoteMap.values());

      if (remoteArray.length > 0) {
        const mappedRemote = remoteArray.map((p) => ({
          id: p.productId || `prod-${p.id}`,
          productId: p.productId || `prod-${p.id}`,
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
          stock: Number(p.stockQuantity !== undefined ? p.stockQuantity : p.stock) || 0,
          stockQuantity: Number(p.stockQuantity !== undefined ? p.stockQuantity : p.stock) || 0,
          tag: "Fresh Harvest",
          color: "sage",
          imageUrl: p.imageUrl || DEFAULT_MUSHROOM_PHOTO,
          cultivatorId: p.cultivatorId || (p.farmerEmail ? `user-${p.farmerEmail}` : user?.id),
          harvestDate: p.harvestDate || "Today",
          description: p.moderationNotes || "Fresh morning harvest from fruiting chambers.",
          substrate: "Sterilized Hardwood Sawdust",
          status: (p.status === "OUT_OF_STOCK" || p.status === "Sold Out") ? "Sold Out" : "In Stock",
          createdAt: p.createdAt
        }));

        // Merge with local store items to preserve newly created local posts
        const localItems = getMushroomFeed();
        const mergedMap = new Map();

        // 1. Put mapped remote items
        mappedRemote.forEach((item) => {
          const key = (item.productId || item.id || "").toLowerCase().trim();
          mergedMap.set(key, item);
        });

        // 2. Merge local items if not already present in remote
        if (Array.isArray(localItems)) {
          localItems.forEach((localItem) => {
            const key = (localItem.productId || localItem.id || "").toLowerCase().trim();
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, localItem);
            }
          });
        }

        const mergedFeed = Array.from(mergedMap.values());
        setFeed(mergedFeed);
        return;
      }
    } catch (err) {
      console.warn("Backend feed sync error, falling back to local store:", err);
    }

    // 2. Fallback to resilient local store if backend unreachable or empty
    const local = getMushroomFeed();
    setFeed(Array.isArray(local) ? local : []);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        loadFeed();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadFeed]);

  useEffect(() => {
    const handleUpdate = () => loadFeed();
    window.addEventListener("mushrooms-catalog-updated", handleUpdate);
    return () => window.removeEventListener("mushrooms-catalog-updated", handleUpdate);
  }, [loadFeed]);

  const openAddModal = () => {
    setEditingItem(null);
    setModalError("");
    setFormData({
      name: "",
      type: "Oyster",
      price: 350,
      unit: "kg",
      stock: 25,
      tag: "Fresh Cultivator Feed",
      color: "sage",
      imageUrl: DEFAULT_MUSHROOM_PHOTO,
      harvestDate: "Today, Morning Pick",
      description: "Harvested fresh from our precision climate-controlled fruiting chambers.",
      substrate: "Sterilized Oak Sawdust + Organic Wheat Bran"
    });
    setIsDragging(false);
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalError("");
    setFormData({
      name: item.name || "",
      type: item.type || item.category || "Oyster",
      price: item.price || 350,
      unit: item.unit || "kg",
      stock: item.stock || item.stockQuantity || 20,
      tag: item.tag || "Fresh Harvest",
      color: item.color || "sage",
      imageUrl: item.imageUrl || DEFAULT_MUSHROOM_PHOTO,
      harvestDate: item.harvestDate || "Today",
      description: item.description || "",
      substrate: item.substrate || "Hardwood Sawdust"
    });
    setIsDragging(false);
    setShowAddModal(true);
  };

  // Direct prop trigger
  useEffect(() => {
    if (autoOpenAddModal) {
      const timer = setTimeout(() => {
        openAddModal();
        onModalOpened?.();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoOpenAddModal, onModalOpened]);

  // Auto-open Post Mushroom modal when event triggered from Topbar or Sidebar
  useEffect(() => {
    const handleOpen = () => openAddModal();
    window.addEventListener("open-mushroom-post-modal", handleOpen);
    return () => window.removeEventListener("open-mushroom-post-modal", handleOpen);
  }, []);

  useEffect(() => {
    const handleUpdate = () => loadFeed();
    window.addEventListener("mushrooms-catalog-updated", handleUpdate);
    return () => window.removeEventListener("mushrooms-catalog-updated", handleUpdate);
  }, [loadFeed]);

  // Lock body scroll when modal is open so modal scrolls smoothly on mobile & desktop
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal]);

  // Image File Handling with Client-Side HTML5 Canvas Compression
  // Resizes multi-MB camera/phone images to ~800x600 @ 0.78 JPEG (~40KB-60KB)
  // Prevents localStorage quota exceeded errors while retaining high visual sharpness
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setModalError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setModalError("");
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsProcessingImage(false);
      setModalError("Unable to read image file from device. Please try another photo.");
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to lightweight JPEG
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.78);
          setFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
          onToast?.("📸 Device photo optimized & attached!");
        } catch {
          // Graceful fallback if canvas drawing is restricted
          setFormData((prev) => ({ ...prev, imageUrl: rawDataUrl }));
          onToast?.("📸 Device photo attached.");
        } finally {
          setIsProcessingImage(false);
        }
      };

      img.onerror = () => {
        setIsProcessingImage(false);
        setFormData((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        onToast?.("📸 Photo attached.");
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const trimmedName = formData.name ? formData.name.trim() : "";
    if (!trimmedName) {
      setModalError("Please enter a valid mushroom variety name.");
      return;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Please enter a valid price in ₹ (INR).");
      return;
    }

    const stockNum = Number(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      setModalError("Please enter available stock quantity (must be 0 or more).");
      return;
    }

    setIsSubmitting(true);
    try {
      const cultivatorEmail = (user?.email || "cultivator@mushroomhub.com").toLowerCase().trim();
      const farmName = user?.farmName || "Himalayan Forest Spores Farm";
      const cultivatorId = user?.id || (cultivatorEmail ? `user-${cultivatorEmail}` : "user-cultivator-01");

      const payload = {
        name: trimmedName,
        category: formData.type || "Oyster",
        type: formData.type || "Oyster",
        price: Math.max(0, Math.round(priceNum)),
        stock: Math.max(0, Math.round(stockNum)),
        stockQuantity: Math.max(0, Math.round(stockNum)),
        unit: formData.unit || "kg",
        imageUrl: formData.imageUrl || DEFAULT_MUSHROOM_PHOTO,
        harvestDate: formData.harvestDate || "Today, Morning Pick",
        description: formData.description || "Fresh small-batch harvest from fruiting chambers.",
        substrate: formData.substrate || "Sterilized Oak Sawdust + Organic Bran",
        status: "In Stock",
        farmerEmail: cultivatorEmail,
        cultivatorEmail: cultivatorEmail,
        farm: farmName,
        farmName: farmName,
        cultivatorId: cultivatorId
      };

      if (editingItem) {
        const targetId = editingItem.productId || editingItem.id;
        const res = await updateCultivatorProduct(targetId, payload);
        if (res && res.status === 403) {
          setModalError("Forbidden: You do not have permission to modify another cultivator's product.");
          setIsSubmitting(false);
          return;
        }

        updateMushroomFeedItem(editingItem.id, payload, user);
        addRealtimeNotification({
          type: "feed",
          title: `✏️ Listing Updated: ${payload.name}`,
          message: `Cultivator edited ${payload.name} (₹${payload.price}/${payload.unit}) in real-time.`,
          icon: "✏️"
        });
        onToast?.(`✏️ Updated "${payload.name}" in your listings!`);
      } else {
        const res = await createCultivatorProduct(payload);
        const createdProd = res?.product || payload;
        const newProductItem = {
          ...payload,
          id: createdProd.productId || payload.id || `feed-${Date.now()}`,
          productId: createdProd.productId || payload.productId || `feed-${Date.now()}`
        };
        addMushroomFeedItem(newProductItem, user);

        // Optimistically update local feed state immediately so it appears instantly
        setFeed((prev) => [
          newProductItem,
          ...prev.filter(
            (p) =>
              (p.productId || p.id) !== (newProductItem.productId || newProductItem.id)
          )
        ]);

        addRealtimeNotification({
          type: "feed",
          title: `🍄 Fresh Harvest Live: ${payload.name}`,
          message: `Cultivator posted fresh harvest (${payload.stock} ${payload.unit} @ ₹${payload.price}/${payload.unit}). Live in feed!`,
          icon: "🍄"
        });
        onToast?.(`🎉 Added "${payload.name}" to your farm listings!`);
      }

      await loadFeed();
      setShowAddModal(false);
      setModalError("");
    } catch (err) {
      console.error("Mushroom post error:", err);
      setModalError("Failed to save post. Please verify connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isItemOwner = (item) => {
    if (user?.role === "admin" || user?.role === "superadmin") return true;
    const uEmail = (user?.email || "").toLowerCase().trim();
    const iEmail = (item.farmerEmail || item.cultivatorEmail || "").toLowerCase().trim();
    if (uEmail && iEmail && uEmail === iEmail) return true;

    const uId = user?.id ? String(user.id).toLowerCase().trim() : "";
    const iId = item.cultivatorId ? String(item.cultivatorId).toLowerCase().trim() : "";
    if (uId && iId && (uId === iId || iId === `user-${uEmail}`)) return true;

    if (!iEmail && !iId) return true;
    return false;
  };

  const handleDelete = async (item) => {
    const targetId = item.productId || item.id;
    if (window.confirm(`Are you sure you want to remove "${item.name}" from your listings?`)) {
      const res = await deleteCultivatorProduct(targetId);
      if (res && res.status === 403) {
        onToast?.("⚠️ Forbidden: You do not have permission to delete another cultivator's product.");
        return;
      }
      deleteMushroomFeedItem(item.id, user);
      addRealtimeNotification({
        type: "feed",
        title: `Harvest Listing Removed`,
        message: `Cultivator removed ${item.name} from active market feed.`,
        icon: "🗑️"
      });
      onToast?.(`Removed "${item.name}" from listings.`);
      await loadFeed();
    }
  };

  const toggleStock = async (item) => {
    const newStatus = item.status === "Sold Out" ? "In Stock" : "Sold Out";
    const targetId = item.productId || item.id;
    await updateCultivatorStock(targetId, item.stock, newStatus === "In Stock" ? "APPROVED" : "OUT_OF_STOCK");
    updateMushroomFeedItem(item.id, { status: newStatus }, user);
    onToast?.(`Marked "${item.name}" as ${newStatus}.`);
    await loadFeed();
  };

  return (
    <div>
      {/* Compact Top Action Bar - Direct Flow Without Excessive Space */}
      <div
        className="feed-actions-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "12px 18px",
          background: "#ffffff",
          borderRadius: 10,
          border: "1px solid #e1e9dd",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div>
          <div className="live-sync-pill" style={{ marginBottom: 3, display: "inline-flex" }}>
            <span className="pulse-dot"></span>
            <strong style={{ fontSize: 12 }}>Live Harvest Feed · Real-Time Cloud Sync (₹ INR)</strong>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#546452", lineHeight: 1.4 }}>
            Post fresh mushroom photos directly from your device (PC or mobile). Listings broadcast immediately across all Customer Accounts.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="button button-green"
            onClick={openAddModal}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px" }}
          >
            <span>＋</span>
            <span>Post New Mushroom</span>
          </button>
        </div>
      </div>

      {/* Live Storefront Showcase Preview Bar */}
      <div style={{ marginBottom: 24, background: "#ffffff", border: "1px solid #e1e9dd", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>☀️</span>
              <strong style={{ fontSize: 15, color: "#1f3829" }}>Live Customer Storefront Showcase (Side-Sliding)</strong>
              <span className="live-sync-pill" style={{ fontSize: 10 }}>● Live Sync</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667764" }}>
              This is the live interactive morning flush showcase active across Customer Accounts. New harvests posted below slide into this showcase immediately.
            </p>
          </div>
        </div>
        <MorningFlushSlider items={feed} onToast={onToast} />
      </div>

      {/* Feed Cards Grid or Empty State with Real-Time Pencil Edit Icons */}
      {feed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 12, border: "1px dashed #c8d6c4" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🍄</div>
          <h3 style={{ margin: "0 0 8px", color: "#223d29" }}>No Active Mushroom Listings Yet</h3>
          <p style={{ margin: "0 auto 16px", maxWidth: 460, fontSize: 13, color: "#61735e", lineHeight: 1.5 }}>
            Start broadcasting your fresh harvest! Upload a photo directly from your device (phone or computer) and set your price in INR (₹) to appear instantly across all Customer logins.
          </p>
          <button
            type="button"
            className="button button-green"
            onClick={openAddModal}
            style={{ fontSize: 13, padding: "8px 22px" }}
          >
            ＋ Post Your First Mushroom
          </button>
        </div>
      ) : (
        <div className="feed-grid">
          {feed.map((item) => (
            <div key={item.id} className="feed-card">
            {/* Real Uploaded Photo */}
            <div className="product-photo-wrap" style={{ height: 180, position: "relative", overflow: "hidden", background: "#e8ece5" }}>
              <img
                src={item.imageUrl || DEFAULT_MUSHROOM_PHOTO}
                alt={item.name}
                className="product-real-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span className="art-pill" style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
                {item.tag || "Fresh Flush"}
              </span>

              {/* REAL-TIME PENCIL EDIT ICON BUTTON ON POST (OWNER ONLY) */}
              {isItemOwner(item) && (
                <button
                  type="button"
                  className="post-pencil-btn"
                  onClick={() => openEditModal(item)}
                  title="✎ Edit this mushroom post in real time"
                  aria-label="Edit post in real time"
                >
                  ✎
                </button>
              )}

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

            <div className="feed-card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h4 style={{ margin: 0, flex: 1 }}>{item.name}</h4>
                {isItemOwner(item) && (
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#275b33",
                      fontSize: 14,
                      cursor: "pointer",
                      lineHeight: 1
                    }}
                    title="Edit post (pencil)"
                  >
                    ✎
                  </button>
                )}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: "#637462", textTransform: "uppercase", margin: "4px 0 8px" }}>
                {item.type} · {item.place || "Dehradun, Uttarakhand"}
              </p>
              <p style={{ fontSize: 12, color: "#5f6c5d", lineHeight: 1.5, margin: "0 0 10px" }}>
                {item.description || "Freshly harvested mushroom cluster ready for kitchen shipment."}
              </p>

              <div style={{ background: "#f6f8f4", padding: "7px 10px", borderRadius: 6, fontSize: 11, color: "#4f5e4e" }}>
                <div><strong>Harvested:</strong> {item.harvestDate || "Today"}</div>
                <div><strong>Substrate:</strong> {item.substrate || "Sterilized Sawdust"}</div>
              </div>
            </div>

            <div className="feed-card-footer">
              <strong style={{ font: "700 18px Manrope", color: "#1f3829" }}>
                ₹{item.price} <small style={{ fontWeight: 400, fontSize: 12, color: "#748272" }}>/ {item.unit}</small>
              </strong>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {isItemOwner(item) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleStock(item)}
                      style={{
                        padding: "5px 9px",
                        fontSize: 11,
                        borderRadius: 4,
                        border: "1px solid #d2dcd0",
                        background: item.status === "Sold Out" ? "#e4fae7" : "#fff",
                        color: "#28442d",
                        cursor: "pointer"
                      }}
                      title="Toggle In Stock / Sold Out"
                    >
                      {item.status === "Sold Out" ? "Restock" : "Mark Sold"}
                    </button>

                    {/* Real-time pencil edit button in card footer */}
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      style={{
                        padding: "5px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        border: "1px solid #315f3a",
                        background: "#f0f7ef",
                        color: "#1e4426",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3
                      }}
                      title="Edit mushroom listing in real time"
                    >
                      <span>✎</span> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: "5px 9px",
                        fontSize: 11,
                        borderRadius: 4,
                        border: "1px solid #eccbc4",
                        background: "#fdf4f2",
                        color: "#a43e2e",
                        cursor: "pointer"
                      }}
                      title="Delete post"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span
                    style={{
                      padding: "4px 9px",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      border: "1px solid #d2dcd0",
                      background: "#f6f8f4",
                      color: "#3a563d",
                      whiteSpace: "nowrap"
                    }}
                    title={`Cultivator: ${item.farm || item.farmName || "Verified Grower"}`}
                  >
                    🌱 {item.farm || item.farmName || "Verified Grower"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Add / Edit Feed Modal with Integrated Device Image Drop & File Picker */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 3000, pointerEvents: "auto" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div
            className="modal-dialog"
            style={{ width: "min(780px, 96%)", zIndex: 3001, pointerEvents: "auto", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                pointerEvents: "auto",
                border: "none",
                background: "transparent",
                boxShadow: "none",
                width: "100%",
                padding: 0
              }}
            >
              <div className="modal-header">
                <h2>{editingItem ? "✎ Edit Mushroom Listing in Real Time" : "Upload & Post Fresh Mushroom to Feed"}</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ pointerEvents: "auto" }}>
              {modalError && (
                <div
                  style={{
                    background: "#fde8e8",
                    color: "#9b1c1c",
                    border: "1px solid #f8b4b4",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              {isProcessingImage && (
                <div
                  style={{
                    background: "#eef6ec",
                    color: "#1c5127",
                    border: "1px solid #b7dfbc",
                    borderRadius: 8,
                    padding: "8px 14px",
                    marginBottom: 14,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <span className="pulse-dot"></span>
                  <span>Optimizing device image (compressing for smooth cloud sync)...</span>
                </div>
              )}

              {/* INTEGRATED DEVICE IMAGE DROPZONE - Works on PC & Mobile */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#253d2b", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>Mushroom Photograph (Drop Photo or Choose from Device / Mobile) *</span>
                  {formData.imageUrl && <span style={{ color: "#246132", fontWeight: 700 }}>✓ Photo Attached</span>}
                </label>

                <div
                  className={`modal-image-dropzone ${isDragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  {/* Single Native File Input - Works seamlessly on Mobile (Camera/Gallery) & PC */}
                  <input
                    type="file"
                    id="mushroom-harvest-file-input"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  {formData.imageUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        style={{ width: 130, height: 95, objectFit: "cover", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", border: "2px solid #315f3a" }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1f4426" }}>✓ Photo Ready for Broadcast</div>
                        <div style={{ fontSize: 11, color: "#6a7b68", margin: "4px 0 10px" }}>
                          Drag a different image here or select from device.
                        </div>
                        <label
                          htmlFor="mushroom-harvest-file-input"
                          className="button button-outline"
                          style={{ padding: "6px 14px", fontSize: 11, cursor: "pointer", display: "inline-block" }}
                        >
                          📁 Change Photo from Device (PC / Mobile)
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 34, marginBottom: 4 }}>📷</div>
                      <div style={{ font: "700 15px Manrope", color: "#1f3d25" }}>
                        Drag & drop harvest photo here, or tap below to choose
                      </div>
                      <p style={{ margin: "4px 0 10px", fontSize: 12, color: "#657663" }}>
                        Supports JPG, PNG, WEBP from your PC, laptop, or mobile camera & photo gallery.
                      </p>
                      <label
                        htmlFor="mushroom-harvest-file-input"
                        className="button button-green"
                        style={{ fontSize: 12, padding: "7px 18px", cursor: "pointer", display: "inline-block" }}
                      >
                        📁 Choose from Device / Take Photo
                      </label>
                    </div>
                  )}
                </div>

                {/* Preset Harvest Photos Quick Pick */}
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6a7968" }}>
                    Or pick from sample high-res harvest photos:
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {MUSHROOM_PHOTO_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: formData.imageUrl === p.url ? "2px solid var(--green)" : "1px solid #d5dfd1",
                          background: formData.imageUrl === p.url ? "#eff6eb" : "#fff",
                          cursor: "pointer",
                          fontSize: 11
                        }}
                      >
                        <img src={p.url} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Fields in INR (₹) */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="post-mushroom-name">Mushroom Variety Name *</label>
                  <input
                    id="post-mushroom-name"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Fresh Himalayan Blue Oyster"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="post-mushroom-type">Category / Species Group *</label>
                  <select
                    id="post-mushroom-type"
                    name="type"
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Oyster">Oyster (Pleurotus)</option>
                    <option value="Shiitake">Shiitake (Lentinula)</option>
                    <option value="Specialty">Specialty / Lion's Mane</option>
                    <option value="Button / Cremini">Button / Cremini</option>
                    <option value="Medicinal">Medicinal / Reishi / Cordyceps</option>
                    <option value="Wild / Exotic">Wild / Exotic</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="post-mushroom-price">Price in INR (₹ per unit) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: 9, font: "700 14px Manrope", color: "#315438", pointerEvents: "none" }}>₹</span>
                    <input
                      id="post-mushroom-price"
                      name="price"
                      type="number"
                      step="1"
                      min="0"
                      className="form-control"
                      style={{ paddingLeft: 28 }}
                      placeholder="e.g. 350"
                      value={formData.price ?? ""}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="post-mushroom-unit">Unit of Measure *</label>
                  <select
                    id="post-mushroom-unit"
                    name="unit"
                    className="form-control"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="500g box">500g Box</option>
                    <option value="250g punnet">250g Punnet</option>
                    <option value="5 kg crate">5 kg Wholesale Crate</option>
                    <option value="pack">pack (Dried/Medicinal)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="post-mushroom-stock">Available Stock / Harvest Quantity *</label>
                  <input
                    id="post-mushroom-stock"
                    name="stock"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="e.g. 35"
                    value={formData.stock ?? ""}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="post-mushroom-tag">Freshness Tag / Quality Badge</label>
                  <input
                    id="post-mushroom-tag"
                    name="tag"
                    className="form-control"
                    placeholder="e.g. Harvested 6:00 AM Today"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="post-mushroom-harvestDate">Harvest Batch & Time</label>
                  <input
                    id="post-mushroom-harvestDate"
                    name="harvestDate"
                    className="form-control"
                    placeholder="e.g. Morning Flush #4"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="post-mushroom-substrate">Growing Substrate Recipe</label>
                  <input
                    id="post-mushroom-substrate"
                    name="substrate"
                    className="form-control"
                    placeholder="e.g. Sterilized Oak Sawdust + Organic Wheat Bran"
                    value={formData.substrate}
                    onChange={(e) => setFormData({ ...formData, substrate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="post-mushroom-desc">Description & Culinary / Flavor Profile</label>
                <textarea
                  id="post-mushroom-desc"
                  name="description"
                  className="form-control"
                  rows="3"
                  placeholder="Describe aroma, firmness, cap diameter, and culinary tips..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-green"
                  disabled={isSubmitting || isProcessingImage}
                  style={{
                    opacity: isSubmitting || isProcessingImage ? 0.7 : 1,
                    cursor: isSubmitting || isProcessingImage ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  {isSubmitting
                    ? "Posting..."
                    : isProcessingImage
                    ? "Processing Photo..."
                    : editingItem
                    ? "✓ Update Listing in Real-Time"
                    : "Post Harvest to Customer Feed (₹)"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}