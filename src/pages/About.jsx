import { Link } from "react-router-dom";

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">The Mycology Heritage</p>
          <h1>Good Food Starts With Honest Cultivation.</h1>
          <p>
            MushroomHub was founded to honor the delicate science of mycology and empower independent regional cultivators with a modern, direct-to-consumer exchange.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: "60px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "clamp(24px, 4vw, 50px)", alignItems: "center", marginBottom: 70 }}>
          <div>
            <p className="eyebrow">Rooted In Community</p>
            <h2 style={{ font: "700 36px var(--serif)", color: "var(--ink)", lineHeight: 1.25, margin: "0 0 18px" }}>
              Independent Cleanrooms. Remarkable Fungi. A Direct Exchange.
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, margin: "0 0 16px" }}>
              Commercial mushroom cultivation is an exacting craft requiring precise humidity chambers, HEPA-filtered clean air, and enriched hardwood substrates. Yet traditional food supply chains compromise fresh flushes through days of unrefrigerated transit and opaque middlemen margins.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, margin: "0 0 28px" }}>
              MushroomHub bridges this gap by giving cultivators direct digital storefronts linked to automated UPI/bank settlements and cold-chain door delivery. Every purchase strengthens regional farming resilience and guarantees gourmet chefs and home cooks the freshest fungi possible.
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              <Link className="button button-green" to="/marketplace">
                Explore Fresh Harvests →
              </Link>
              <Link className="button button-outline" to="/portal/cultivator">
                🍄 Cultivator Portal
              </Link>
            </div>
          </div>

          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-lg)", height: 420 }}>
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80"
              alt="Mushroom Cultivation Lab"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* 4 Classic Values Grid */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 50 }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 40px" }}>
            <p className="eyebrow" style={{ justifyContent: "center" }}>Our Guiding Principles</p>
            <h3 style={{ font: "700 28px var(--serif)", color: "var(--ink)", margin: 0 }}>The MushroomHub Pledge</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", padding: 28, borderRadius: 14, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: 32 }}>🔬</span>
              <h4 style={{ font: "700 18px var(--serif)", color: "var(--ink)", margin: "14px 0 8px" }}>Cleanroom Science</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Pure culture isolation, sterilized grain spawns, and strict moisture control for maximum bioactivity.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 14, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: 32 }}>🌱</span>
              <h4 style={{ font: "700 18px var(--serif)", color: "var(--ink)", margin: "14px 0 8px" }}>Zero Chemical Additives</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Grown on organic Himalayan hardwood, wheat bran, and natural gypsum. 100% pesticide and synthetic-free.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 14, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: 32 }}>⚡</span>
              <h4 style={{ font: "700 18px var(--serif)", color: "var(--ink)", margin: "14px 0 8px" }}>Farmer Economic Justice</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Zero commission deductions on harvest sales. Direct UPI and IMPS settlements to growers' verified bank accounts.
              </p>
            </div>

            <div style={{ background: "#ffffff", padding: 28, borderRadius: 14, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: 32 }}>❄️</span>
              <h4 style={{ font: "700 18px var(--serif)", color: "var(--ink)", margin: "14px 0 8px" }}>Peak Veil Integrity</h4>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.7 }}>
                Picked at dawn before spores drop, protecting cellular structure, flavor profile, and culinary texture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
