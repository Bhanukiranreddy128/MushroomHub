import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCustomerOrdersForUser, getCustomerProfile } from "../../data/store";

const AVATAR_PRESETS = [
  { id: "avatar-1", label: "Chef Ananya", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
  { id: "avatar-2", label: "Culinary Professional", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80" },
  { id: "avatar-3", label: "Organic Gourmet", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
  { id: "avatar-4", label: "Food Enthusiast", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80" },
  { id: "avatar-5", label: "Home Cook", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" }
];

export default function CustomerProfile({ onToast }) {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(() => getCustomerProfile(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const orders = getCustomerOrdersForUser(user);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setProfile(e.detail);
      } else {
        setProfile(getCustomerProfile(user));
      }
    };
    window.addEventListener("customer-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("customer-profile-updated", handleProfileUpdate);
  }, [user]);

  const [formData, setFormData] = useState({
    name: profile.name || user?.name || "Customer",
    email: profile.email || user?.email || "",
    phone: profile.phone || user?.phone || "",
    businessName: profile.businessName || user?.farmName || "Retail Buyer",
    address: profile.address || user?.address || "Flat 402, Green Glen Layout, Outer Ring Road",
    locality: profile.locality || user?.locality || "Bellandur",
    city: profile.city || user?.city || user?.location || "Bengaluru",
    state: profile.state || user?.state || "Karnataka",
    pincode: profile.pincode || user?.pincode || "560103",
    avatar: profile.avatar || user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  });

  const handleStartEdit = () => {
    setFormData({
      name: profile.name || user?.name || "Customer",
      email: profile.email || user?.email || "",
      phone: profile.phone || user?.phone || "",
      businessName: profile.businessName || user?.farmName || "Retail Buyer",
      address: profile.address || user?.address || "Flat 402, Green Glen Layout, Outer Ring Road",
      locality: profile.locality || user?.locality || "Bellandur",
      city: profile.city || user?.city || user?.location || "Bengaluru",
      state: profile.state || user?.state || "Karnataka",
      pincode: profile.pincode || user?.pincode || "560103",
      avatar: profile.avatar || user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
    });
    setIsEditing(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData((prev) => ({ ...prev, avatar: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        farmName: formData.businessName.trim(),
        businessName: formData.businessName.trim(),
        location: `${formData.city.trim()}, ${formData.state.trim()}`,
        address: formData.address.trim(),
        locality: formData.locality.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        avatar: formData.avatar
      };

      const result = await updateUserProfile(payload);
      setProfile({ ...formData, ...payload });
      setIsEditing(false);

      if (onToast) {
        onToast(result.message || "✨ Profile details & photo successfully updated in Cloud PostgreSQL database!");
      }
    } catch (err) {
      if (onToast) {
        onToast("⚠️ Could not sync changes: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalSpent = orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);

  return (
    <div>
      <div className="hub-card" style={{ marginBottom: 24, boxShadow: "0 12px 36px rgba(25, 45, 30, 0.06)" }}>
        <div className="hub-card-header" style={{ borderBottom: "1px solid #e1e9dc", paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ margin: 0, font: "700 22px Manrope", color: "#1f3829" }}>
                Customer Account & Delivery Profile
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#edf7ee",
                  color: "#23572d",
                  border: "1px solid #c8e4cc",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                <span className="pulse-dot" style={{ width: 6, height: 6 }}></span>
                <span>Cloud PostgreSQL Synced</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#5d705c" }}>
              Manage your personal credentials, profile picture, contact numbers, and default shipping addresses for fresh harvest dispatch.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              className="button button-green"
              onClick={handleStartEdit}
              style={{ fontSize: 13, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span>✎</span>
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              className="button button-outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              style={{ fontSize: 13, padding: "8px 18px" }}
            >
              Cancel
            </button>
          )}
        </div>

        {!isEditing ? (
          <div>
            {/* Top Customer Hero Card */}
            <div
              style={{
                display: "flex",
                gap: 22,
                alignItems: "center",
                background: "linear-gradient(135deg, #f8fcf7 0%, #eef6ed 100%)",
                padding: "20px 24px",
                borderRadius: 14,
                border: "1px solid #d2e4cf",
                marginBottom: 24,
                flexWrap: "wrap"
              }}
            >
              {/* Profile Photo Display */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #2d6b3e",
                  background: "#e2edd9",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 18px rgba(35, 87, 45, 0.18)",
                  flexShrink: 0,
                  position: "relative"
                }}
              >
                {profile.avatar || user?.avatar ? (
                  <img
                    src={profile.avatar || user?.avatar}
                    alt={profile.name || "Customer"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <span style={{ font: "700 30px Manrope", color: "#345D31" }}>
                    {(profile.name || user?.name || "C").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="role-badge-pill" style={{ background: "#e8eff7", color: "#1c4a79", margin: 0 }}>
                    Verified MushroomHub Consumer · Direct Farm Buyer
                  </span>
                  <span style={{ fontSize: 11, color: "#587154", fontWeight: 600 }}>
                    🛡️ Authenticated
                  </span>
                </div>
                <h3 style={{ font: "700 24px Manrope", color: "#173420", margin: "2px 0 6px" }}>
                  {profile.name || user?.name || "Customer"}
                </h3>
                <div style={{ fontSize: 13, color: "#4f6a54", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                  <span>📧 <strong>{profile.email || user?.email || "customer@mushroomhub.com"}</strong></span>
                  <span>📱 <strong>{profile.phone || user?.phone || "+91 97120 44589"}</strong></span>
                  <span>📍 <strong>{profile.city || user?.location || "Bengaluru"}, {profile.state || "Karnataka"}</strong></span>
                </div>
              </div>

              {/* Quick Consumer Stats */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", background: "#ffffff", padding: "10px 16px", borderRadius: 10, border: "1px solid #dbe6d7", minWidth: 90 }}>
                  <div style={{ font: "700 20px Manrope", color: "#1f5630" }}>{orders.length}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#6b7a69", fontWeight: 700 }}>Orders Placed</div>
                </div>
                <div style={{ textAlign: "center", background: "#ffffff", padding: "10px 16px", borderRadius: 10, border: "1px solid #dbe6d7", minWidth: 90 }}>
                  <div style={{ font: "700 18px Manrope", color: "#1f5630", marginTop: 2 }}>₹{totalSpent.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#6b7a69", fontWeight: 700 }}>Total Spent</div>
                </div>
              </div>
            </div>

            {/* Profile Detail Fields */}
            <h4 style={{ font: "700 15px Manrope", color: "#23492c", margin: "0 0 12px" }}>
              Primary Contact & Account Identity
            </h4>
            <div className="bank-detail-grid" style={{ marginBottom: 24 }}>
              <div className="bank-field-box">
                <span>Customer Full Name</span>
                <strong>{profile.name || user?.name || "Customer"}</strong>
              </div>

              <div className="bank-field-box">
                <span>Account Login Email (Cloud ID)</span>
                <strong>{profile.email || user?.email || "—"}</strong>
              </div>

              <div className="bank-field-box">
                <span>Contact Phone / WhatsApp</span>
                <strong>{profile.phone || user?.phone || "+91 97120 44589"}</strong>
              </div>

              <div className="bank-field-box">
                <span>Buyer / Kitchen Classification</span>
                <strong>{profile.businessName || user?.farmName || "Retail Gourmet Buyer"}</strong>
              </div>
            </div>

            {/* Delivery & Shipping Information */}
            <h4 style={{ font: "700 15px Manrope", color: "#23492c", margin: "0 0 12px" }}>
              Default Cold-Chain Delivery Address (Direct Dispatch)
            </h4>
            <div className="bank-detail-grid" style={{ marginBottom: 24 }}>
              <div className="bank-field-box" style={{ gridColumn: "span 2" }}>
                <span>Street / Flat / Door Number</span>
                <strong>{profile.address || user?.address || "Flat 402, Green Glen Layout, Outer Ring Road"}</strong>
              </div>

              <div className="bank-field-box">
                <span>Locality / Area / Landmark</span>
                <strong>{profile.locality || user?.locality || "Bellandur"}</strong>
              </div>

              <div className="bank-field-box">
                <span>City / District</span>
                <strong>{profile.city || user?.city || user?.location || "Bengaluru"}</strong>
              </div>

              <div className="bank-field-box">
                <span>State</span>
                <strong>{profile.state || user?.state || "Karnataka"}</strong>
              </div>

              <div className="bank-field-box">
                <span>Postal PIN Code</span>
                <strong>{profile.pincode || user?.pincode || "560103"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #e7efe4" }}>
              <span style={{ fontSize: 12, color: "#6a7b68" }}>
                🔒 Cloud Database: <strong>Aiven PostgreSQL defaultdb</strong> (SSL Encrypted)
              </span>
              <button
                type="button"
                className="button button-green"
                onClick={handleStartEdit}
                style={{ fontSize: 12, padding: "7px 16px" }}
              >
                ✎ Edit Profile Options
              </button>
            </div>
          </div>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSave}>
            <div
              style={{
                background: "#f0f7ef",
                border: "1px solid #c9e3cc",
                borderRadius: 10,
                padding: "12px 18px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              <span style={{ fontSize: 20 }}>☁️</span>
              <div style={{ fontSize: 12, color: "#23572d" }}>
                <strong>Cloud Database Sync Active:</strong> Changes and profile photo saved here are committed directly to your Cloud PostgreSQL database.
              </div>
            </div>

            {/* Profile Photo Editor Section */}
            <div
              style={{
                background: "#f5f9f4",
                border: "1px solid #d2e4cf",
                borderRadius: 12,
                padding: "18px 20px",
                marginBottom: 24
              }}
            >
              <h4 style={{ font: "700 14px Manrope", color: "#23492c", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📷</span>
                <span>Profile Photo (Stored in Cloud Database)</span>
              </h4>

              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                {/* Photo Preview */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2.5px solid #2d6b3e",
                    background: "#e2edd9",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 4px 12px rgba(35, 87, 45, 0.15)",
                    flexShrink: 0
                  }}
                >
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ font: "700 26px Manrope", color: "#345D31" }}>
                      {(formData.name || "C").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      className="button button-green"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: 12, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <span>📁</span>
                      <span>Upload from Device</span>
                    </button>

                    {formData.avatar && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setFormData({ ...formData, avatar: "" })}
                        style={{ fontSize: 12, padding: "7px 14px", borderColor: "#c47a74", color: "#8d3e33" }}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Preset Avatars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#5d705c", fontWeight: 600 }}>Or choose an avatar preset:</span>
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: preset.url })}
                        title={preset.label}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          padding: 0,
                          border: formData.avatar === preset.url ? "2.5px solid #2d6b3e" : "1.5px solid #c4d7c0",
                          overflow: "hidden",
                          cursor: "pointer",
                          transform: formData.avatar === preset.url ? "scale(1.15)" : "scale(1)",
                          boxShadow: formData.avatar === preset.url ? "0 2px 8px rgba(45, 107, 62, 0.4)" : "none",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <img src={preset.url} alt={preset.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ font: "700 14px Manrope", color: "#23492c", margin: "0 0 12px" }}>
              1. Personal & Contact Credentials
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Full Name <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ananya Iyer"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Registered Email (Cloud Account ID)
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={formData.email}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #d5ded2",
                    background: "#f2f5f1",
                    color: "#6b7b69",
                    fontSize: 13,
                    fontFamily: "inherit",
                    cursor: "not-allowed"
                  }}
                  title="Registered email cannot be modified directly"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Contact Phone / WhatsApp <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 97120 44589"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Buyer / Kitchen Classification
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Gourmet Retail Buyer, Home Chef"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>

            <h4 style={{ font: "700 14px Manrope", color: "#23492c", margin: "0 0 12px" }}>
              2. Shipping & Delivery Address Details
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Street / Flat / Door / Apartment Number <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Flat 402, Green Glen Layout, Outer Ring Road"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  Locality / Area / Landmark
                </label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="e.g. Bellandur, Near EcoSpace"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  City <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  State <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Karnataka"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#29462f", marginBottom: 5 }}>
                  PIN Code <span style={{ color: "#d94336" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 560103"
                  maxLength={10}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #c3d7bf",
                    fontSize: 13,
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center", marginTop: 24 }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                style={{ fontSize: 13, padding: "9px 20px" }}
              >
                Discard Changes
              </button>

              <button
                type="submit"
                className="button button-green"
                disabled={isSaving}
                style={{
                  fontSize: 13,
                  padding: "9px 24px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: isSaving ? 0.75 : 1
                }}
              >
                <span>{isSaving ? "⏳" : "💾"}</span>
                <span>{isSaving ? "Saving to Cloud..." : "Save Profile & Photo to Cloud"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
