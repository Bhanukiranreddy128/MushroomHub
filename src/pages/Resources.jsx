import { Link } from "react-router-dom";

export default function Resources() {
  const guides = [
    {
      icon: "🍄",
      tag: "Culinary & Texture",
      title: "Gourmet Species & Skillet Guides",
      desc: "Flavor profiles, heat pairing, veil integrity timing, and butter-basting secrets for Oyster, Lion's Mane, and Shiitake.",
      linkText: "Explore Culinary Varieties →",
      linkTo: "/marketplace"
    },
    {
      icon: "🔬",
      tag: "Laboratory Science",
      title: "Cleanroom Agronomy & Climate Specs",
      desc: "Optimum temperature curves (16–24°C), relative humidity parameters (85–95% RH), CO2 levels, and enriched hardwood substrate recipes.",
      linkText: "Cultivator Agronomy Hub →",
      linkTo: "/portal/cultivator"
    },
    {
      icon: "🪵",
      tag: "Substrates & Inoculation",
      title: "Hardwood Log & Sawdust Inoculation",
      desc: "Sustainably harvested Himalayan oak, alder, and sterile wheat bran supplementation for high-potency fruiting bodies.",
      linkText: "Grower Knowledge Base →",
      linkTo: "/portal/cultivator"
    },
    {
      icon: "🧪",
      tag: "Bioactive Compounds",
      title: "Medicinal Mycology & Extracts",
      desc: "Nootropic hericenones in Lion's Mane, beta-glucans in Ganoderma Reishi, and adaptogenic cordycepin concentrations.",
      linkText: "View Medicinal Harvests →",
      linkTo: "/marketplace"
    },
    {
      icon: "📦",
      tag: "Packaging Science",
      title: "Cold-Chain Preservation & Transport",
      desc: "Preserving delicate morning flushes with breathable, insulated micro-perforated liners to prevent spore degradation.",
      linkText: "Delivery Logistics →",
      linkTo: "/buyers"
    },
    {
      icon: "👨🏽‍🏫",
      tag: "Academy Roster",
      title: "Master Cultivator Apprenticeship",
      desc: "Learn commercial spawn laboratory hygiene, liquid culture isolation, and cleanroom design from certified mycologists.",
      linkText: "Trainee Academy Portal →",
      linkTo: "/portal/trainee"
    }
  ];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">The Living Botanical Library</p>
          <h1>Field Guides, Climate Science & Culinary Wisdom.</h1>
          <p>
            Whether you are fine-tuning a 10,000 sq ft commercial cleanroom or preparing delicate Lion's Mane pom-poms in your skillet, our guides offer rigorous botanical clarity.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: "60px 0 90px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 26 }}>
          {guides.map((g) => (
            <article
              key={g.title}
              className="pillar-card"
              style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div className="pillar-icon-box" style={{ background: "var(--green-light)", border: "1px solid var(--line)", margin: 0 }}>
                  {g.icon}
                </div>
                <span className="art-pill" style={{ position: "static" }}>
                  {g.tag}
                </span>
              </div>

              <h3 style={{ color: "var(--ink)", margin: "0 0 10px", font: "700 20px var(--serif)" }}>
                {g.title}
              </h3>
              <p style={{ color: "var(--muted)", margin: "0 0 20px", flex: 1, lineHeight: 1.7 }}>
                {g.desc}
              </p>

              <Link className="text-link" to={g.linkTo} style={{ marginTop: "auto" }}>
                {g.linkText}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
