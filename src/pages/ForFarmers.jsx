import { Link, Navigate } from "react-router-dom";
import { getRolePortalPath, useAuth } from "../context/AuthContext";

export default function ForFarmers() {
  const { user } = useAuth();
  if (user?.isLoggedIn && user?.role) {
    const portal = getRolePortalPath(user);
    if (portal) {
      return <Navigate to={portal} replace />;
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">For Independent Cultivators & Commercial Growers</p>
          <h1>Your Harvest Deserves An Honest Return.</h1>
          <p>
            Connect directly with verified culinary buyers who value painstaking growing standards. Publish live harvest flushes, track INR revenue with sales analytics, and receive direct bank payments.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <Link className="button button-green" to="/portal/cultivator">
              Enter Cultivator Portal ↗
            </Link>
            <Link className="button button-outline" to="/login/cultivator">
              Cultivator Login Gateway
            </Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "60px 0 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, marginBottom: 50 }}>
          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>🌱</div>
            <h3 style={{ color: "var(--ink)" }}>Living Harvest Feed</h3>
            <p style={{ color: "var(--muted)" }}>
              Publish morning flushes with real photos. Listings sync instantly to the public marketplace and customer shopping baskets.
            </p>
          </article>

          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>📚</div>
            <h3 style={{ color: "var(--ink)" }}>World Species Guides</h3>
            <p style={{ color: "var(--muted)" }}>
              Access optimum temperature curves, relative humidity parameters, CO2 tolerances, and substrate formulations for 16+ species.
            </p>
          </article>

          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>📊</div>
            <h3 style={{ color: "var(--ink)" }}>Direct Bank Settlements</h3>
            <p style={{ color: "var(--muted)" }}>
              Configure your UPI ID or IFSC bank coordinates. Every customer order directly credits your verified account in INR (₹).
            </p>
          </article>
        </div>

        <section className="feature-band" style={{ borderRadius: "var(--radius-lg)" }}>
          <div className="container" style={{ textAlign: "center", maxWidth: 700 }}>
            <h2 style={{ font: "700 32px var(--serif)", margin: "0 0 14px", color: "#ffffff" }}>
              Precision Growing Deserves Agricultural Respect.
            </h2>
            <p style={{ color: "#c4d7c8", fontSize: 15, lineHeight: 1.7, margin: "0 auto 28px" }}>
              Join commercial cultivators across Uttarakhand, Tamil Nadu, and Maharashtra using MushroomHub to power their farm operations.
            </p>
            <Link className="button button-gold" to="/portal/cultivator" style={{ padding: "12px 28px", fontSize: 14 }}>
              Open Cultivator Portal ↗
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
