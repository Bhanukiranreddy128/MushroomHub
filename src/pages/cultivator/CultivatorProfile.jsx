import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCultivatorProfile, saveCultivatorProfile } from "../../data/store";

export default function CultivatorProfile({ onToast, user: propUser }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [profile, setProfile] = useState(() => getCultivatorProfile(user));
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    const updated = getCultivatorProfile(user);
    setProfile(updated);
    setFormData({ ...updated });
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    saveCultivatorProfile(formData, user);
    setProfile(formData);
    setIsEditing(false);
    onToast("🌱 Cultivator Profile updated! Farm attribution refreshed across all listings.");
  };

  return (
    <div>
      <div className="hub-card">
        <div className="hub-card-header">
          <div>
            <h2>Cultivator & Farm Operational Profile</h2>
            <p>Your official grower credentials, facility specs, and organic certifications.</p>
          </div>
          <button
            className="button button-green"
            onClick={() => {
              if (!isEditing) setFormData({ ...profile });
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? "Cancel" : "✎ Edit Profile"}
          </button>
        </div>

        {!isEditing ? (
          <div>
            {/* Top Grower Card */}
            <div style={{ display: "flex", gap: 20, alignItems: "center", background: "#f8fbf6", padding: 16, borderRadius: 10, border: "1px solid #dce8d8", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", overflow: "hidden", border: "2px solid #315f3a", background: "#e2edd9", display: "grid", placeItems: "center" }}>
                <img
                  src={profile.avatarPhoto || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"}
                  alt={profile.growerName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <span className="role-badge-pill" style={{ marginBottom: 6 }}>
                  Verified Commercial Cultivator · FSSAI Registered
                </span>
                <h3 style={{ font: "700 24px Manrope", color: "#1f3829", margin: "4px 0" }}>
                  {profile.farmName}
                </h3>
                <div style={{ fontSize: 13, color: "#546452", fontWeight: 600 }}>
                  Operated by {profile.growerName} ({profile.role}) · 📍 {profile.location}
                </div>
              </div>

              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ textAlign: "center", background: "white", padding: "10px 16px", borderRadius: 8, border: "1px solid #e1e9dc" }}>
                  <div style={{ font: "700 20px Manrope", color: "#25482e" }}>{profile.experienceYears}+</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#778576", fontWeight: 700 }}>Years Exp</div>
                </div>

                <div style={{ textAlign: "center", background: "white", padding: "10px 16px", borderRadius: 8, border: "1px solid #e1e9dc" }}>
                  <div style={{ font: "700 16px Manrope", color: "#25482e", marginTop: 3 }}>{profile.monthlyCapacityKg}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#778576", fontWeight: 700 }}>Harvest Output</div>
                </div>
              </div>
            </div>

            {/* Profile Detail Fields */}
            <div className="bank-detail-grid">
              <div className="bank-field-box">
                <span>Facility Architecture & Growing Method</span>
                <strong>{profile.farmType}</strong>
              </div>

              <div className="bank-field-box">
                <span>Growing Chamber Scale</span>
                <strong>{profile.scale}</strong>
              </div>

              <div className="bank-field-box">
                <span>Official Contact Email</span>
                <strong>{profile.email || user?.email || ""}</strong>
              </div>

              <div className="bank-field-box">
                <span>Dispatch / Farm Phone</span>
                <strong>{profile.phone}</strong>
              </div>
            </div>

            {/* Bio and Story */}
            <div style={{ margin: "20px 0" }}>
              <h4 style={{ font: "700 15px Manrope", color: "#26422d", margin: "0 0 8px" }}>
                Cultivator Mission & Agronomy Story
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#4c594c", background: "#fafbf9", padding: 18, borderRadius: 8, border: "1px solid #e8ede4", margin: 0 }}>
                {profile.bio}
              </p>
            </div>

            {/* Certifications */}
            <div>
              <h4 style={{ font: "700 15px Manrope", color: "#26422d", margin: "0 0 10px" }}>
                Active Quality & Organic Certifications
              </h4>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {profile.certifications && profile.certifications.map((cert) => (
                  <span key={cert} className="status-badge paid" style={{ padding: "6px 14px", fontSize: 12 }}>
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Avatar & Farm Photo Upload */}
            <div style={{ marginBottom: 20, padding: 16, background: "#f8fbf6", borderRadius: 8, border: "1px dashed #315f3a" }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#1f3829", marginBottom: 8 }}>
                📷 Farm / Cultivator Profile Photo (Upload or Drag from Device)
              </label>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", overflow: "hidden", border: "2px solid #315f3a", background: "#e2edd9", flexShrink: 0 }}>
                  <img
                    src={formData.avatarPhoto || profile.avatarPhoto || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-avatar-input"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          setFormData({ ...formData, avatarPhoto: loadEvent.target.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <label
                      htmlFor="profile-avatar-input"
                      className="button button-outline"
                      style={{ cursor: "pointer", fontSize: 12, padding: "6px 14px", margin: 0 }}
                    >
                      📁 Browse Photo from Device
                    </label>
                    <span style={{ fontSize: 11, color: "#666" }}>or paste image link below</span>
                  </div>
                  <input
                    className="form-control"
                    style={{ marginTop: 8, fontSize: 12, padding: "6px 10px" }}
                    placeholder="https://... direct image URL or base64 data"
                    value={formData.avatarPhoto || ""}
                    onChange={(e) => setFormData({ ...formData, avatarPhoto: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Farm / Mushroom Enterprise Name *</label>
                <input
                  className="form-control"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Grower / Cultivator Name *</label>
                <input
                  className="form-control"
                  value={formData.growerName}
                  onChange={(e) => setFormData({ ...formData, growerName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Cultivator Role / Title</label>
                <input
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Geographic Farm Location *</label>
                <input
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Contact Email Address *</label>
                <input
                  className="form-control"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Farm Contact Phone</label>
                <input
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Facility Type & Technology</label>
                <input
                  className="form-control"
                  value={formData.farmType}
                  onChange={(e) => setFormData({ ...formData, farmType: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Chamber Scale (sq ft / rooms)</label>
                <input
                  className="form-control"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Years of Commercial Cultivation</label>
                <input
                  className="form-control"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Monthly Harvest Capacity (kg)</label>
                <input
                  className="form-control"
                  value={formData.monthlyCapacityKg}
                  onChange={(e) => setFormData({ ...formData, monthlyCapacityKg: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Grower Bio & Sustainability Philosophy</label>
              <textarea
                className="form-control"
                rows="4"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              ></textarea>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-green">
                Save Cultivator Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
