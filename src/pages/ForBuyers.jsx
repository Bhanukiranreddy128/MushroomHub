import { Link, Navigate } from "react-router-dom";
import { getRolePortalPath, useAuth } from "../context/AuthContext";

export default function ForBuyers() {
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
          <p className="eyebrow">For Chefs, Specialty Retailers & Gourmet Cooks</p>
          <h1>Fresh Finds. Direct Cleanroom Farms.</h1>
          <p>
            Discover seasonal mushroom flushes you won’t find on standard supermarket shelves. Experience harvest-morning veil integrity and support independent cultivators directly.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <Link className="button button-green" to="/marketplace">
              Browse The Marketplace ↗
            </Link>
            <Link className="button button-outline" to="/portal/customer">
              Customer Portal
            </Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "60px 0 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, marginBottom: 50 }}>
          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>🧺</div>
            <h3 style={{ color: "var(--ink)" }}>Small-Batch Living Flushes</h3>
            <p style={{ color: "var(--muted)" }}>
              Explore seasonal varieties, from gourmet Blue Oysters and King Trumpets to nootropic Lion’s Mane and medicinal Reishi.
            </p>
          </article>

          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>📍</div>
            <h3 style={{ color: "var(--ink)" }}>100% Grower Traceability</h3>
            <p style={{ color: "var(--muted)" }}>
              Know exactly where and how your mushrooms were grown—inspect cleanroom specs, organic oak substrates, and grower certifications.
            </p>
          </article>

          <article className="pillar-card" style={{ background: "#ffffff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-sm)" }}>
            <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)" }}>❄️</div>
            <h3 style={{ color: "var(--ink)" }}>24h Cold-Chain Integrity</h3>
            <p style={{ color: "var(--muted)" }}>
              Packed at morning harvest in temperature-stabilized packaging to ensure delicate cap textures remain skillet-ready upon arrival.
            </p>
          </article>
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--green-light) 0%, #ffffff 100%)", border: "1.5px solid var(--line-strong)", borderRadius: "var(--radius-lg)", padding: "40px", textAlign: "center" }}>
          <h2 style={{ font: "700 30px var(--serif)", color: "var(--ink)", margin: "0 0 10px" }}>
            Ready to Taste the Difference?
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 540, margin: "0 auto 24px", fontSize: 15 }}>
            Place your order directly through our verified cleanroom growers. Your payment instantly credits the farmer's bank account.
          </p>
          <Link className="button button-green" to="/marketplace" style={{ padding: "12px 28px", fontSize: 14 }}>
            Explore Today’s Harvests ↗
          </Link>
        </div>
      </div>
    </>
  );
}
