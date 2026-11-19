import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MorningFlushSlider from "../components/MorningFlushSlider";
import ProductCard from "../components/ProductCard";
import { DEFAULT_MUSHROOM_PHOTO, getMushroomFeed } from "../data/store";
import { getMarketplaceProducts } from "../services/cultivatorProductService";

export default function Home() {
  const { user } = useAuth();

  // If currently authenticated as a cultivator, redirect to dedicated cultivator portal
  if (user?.isLoggedIn && (user.role === "cultivater" || user.role === "cultivator")) {
    return <Navigate to="/portal/cultivator" replace />;
  }

  const [liveMushrooms, setLiveMushrooms] = useState(() => {
    const feed = getMushroomFeed();
    return Array.isArray(feed) ? feed : [];
  });
  const [activeCategory, setActiveCategory] = useState("All");

  const loadLiveMushrooms = useCallback(async () => {
    try {
      const remote = await getMarketplaceProducts();
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const mappedRemote = remote.map((p) => ({
          id: p.productId || `prod-${p.id}`,
          productId: p.productId || `prod-${p.id}`,
          name: p.name,
          type: p.category || "Oyster",
          farm: p.farmName,
          place: p.location,
          farmerEmail: p.farmerEmail,
          price: Number(p.price) || 0,
          unit: p.unit || "kg",
          stock: Number(p.stockQuantity !== undefined ? p.stockQuantity : p.stock) || 0,
          imageUrl: p.imageUrl || DEFAULT_MUSHROOM_PHOTO,
          status: p.status === "OUT_OF_STOCK" ? "Sold Out" : "In Stock",
          tag: "Fresh Harvest",
          color: "sage"
        }));

        const localFeed = getMushroomFeed();
        const mergedMap = new Map();
        mappedRemote.forEach((m) => mergedMap.set((m.productId || m.id).toLowerCase(), m));
        if (Array.isArray(localFeed)) {
          localFeed.forEach((l) => {
            const k = (l.productId || l.id).toLowerCase();
            if (!mergedMap.has(k)) mergedMap.set(k, l);
          });
        }
        setLiveMushrooms(Array.from(mergedMap.values()));
        return;
      }
    } catch {
      // Fallback to local store feed
    }
    const localFeed = getMushroomFeed();
    if (Array.isArray(localFeed) && localFeed.length > 0) {
      setLiveMushrooms(localFeed);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        loadLiveMushrooms();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadLiveMushrooms]);

  useEffect(() => {
    const handleUpdate = () => loadLiveMushrooms();
    window.addEventListener("mushrooms-catalog-updated", handleUpdate);
    return () => window.removeEventListener("mushrooms-catalog-updated", handleUpdate);
  }, [loadLiveMushrooms]);

  const categories = [
    { id: "All", name: "All Harvests", icon: "🧺" },
    { id: "Oyster", name: "Oyster Clusters", icon: "🍄" },
    { id: "Specialty", name: "Lion's Mane & Exotics", icon: "🦁" },
    { id: "Shiitake", name: "Oak Shiitake", icon: "🪵" },
    { id: "Cremini", name: "Cremini & Button", icon: "🤎" }
  ];

  const featuredList = activeCategory === "All"
    ? liveMushrooms.slice(0, 8)
    : liveMushrooms.filter((m) => m.type === activeCategory || m.tag?.includes(activeCategory)).slice(0, 8);

  return (
    <>
      {/* ATTRACTIVE & CLASSIC EDITORIAL HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-layout-grid">
            {/* Left Content */}
            <div className="hero-content">
              <div className="classic-badge-pill">
                <span className="dot"></span>
                <span>🌿 India's Premier Mycology & Harvest Exchange</span>
              </div>

              <h1>
                Nature’s Finest Harvest.<br />
                <em>Handcrafted by True Artisans.</em>
              </h1>

              <p className="hero-copy">
                Direct from sterilized Himalayan cleanrooms and high-altitude hardwood reserves. Discover small-batch gourmet culinary mushrooms, medicinal fungi, and organic spawn with 100% grower provenance.
              </p>

              <div className="hero-buttons">
                <Link className="button button-green" to="/marketplace">
                  <span>Explore The Marketplace</span>
                  <span>↗</span>
                </Link>
                <Link className="button button-outline" to="/portal/cultivator">
                  <span>🍄 Cultivator Portal</span>
                </Link>
                <Link className="button button-outline" to="/login">
                  <span>🔑 Role Gateways (6 Portals)</span>
                </Link>
              </div>

              <div className="hero-trust">
                <span className="avatar-stack">
                  <i>👩🏽‍🌾</i>
                  <i>👨🏻‍🌾</i>
                  <i>👩🏼‍🍳</i>
                  <i>🔬</i>
                </span>
                <div>
                  <span className="trust-stars">★★★★★</span>
                  <div style={{ marginTop: 2 }}>
                    <strong>4.9 / 5.0</strong> · Trusted by 120+ independent cultivators, chefs, and mycologists
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Daily Spotlight Harvest Showcase Card with Interactive Side-Sliding */}
            <MorningFlushSlider items={liveMushrooms} />
          </div>
        </div>
      </section>

      {/* CLASSIC STATS BAR */}
      <section className="stats-bar">
        <div className="container stats-inner">
          <div className="stat">
            <span className="stat-icon">🍄</span>
            <div>
              <strong>120+</strong>
              <span>Independent<br />Certified Cultivators</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">🧪</span>
            <div>
              <strong>16+</strong>
              <span>World Species &<br />Climate Lab Guides</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">⚡</span>
            <div>
              <strong>100%</strong>
              <span>Direct Bank Payouts<br />in INR (₹) to Farmers</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">❄️</span>
            <div>
              <strong>24h</strong>
              <span>Cold-Chain Express<br />Harvest Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* CURATED HARVEST CATEGORIES */}
      <section className="categories-showcase">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p className="eyebrow">Botanical Heritage</p>
              <h2 style={{ font: "700 24px var(--serif)", margin: 0, color: "var(--ink)" }}>
                Curated Mushroom Varieties
              </h2>
            </div>
            <div className="category-chips-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TODAY'S FRESH HARVEST SECTION */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fresh From The Farm Cleanrooms</p>
              <h2>Today's Living Harvest Feed</h2>
              <p>Small batches, uncompromising freshness. Straight from regional growers to your kitchen.</p>
            </div>
            <Link className="text-link" to="/marketplace">
              <span>View All Varieties in Marketplace</span>
              <span>→</span>
            </Link>
          </div>

          <div className="product-grid">
            {featuredList.length > 0 ? (
              featuredList.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : liveMushrooms.length > 0 ? (
              liveMushrooms.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", background: "#fbfcf9", borderRadius: 12, border: "1px dashed #c9d8c6" }}>
                <span style={{ fontSize: 40 }}>🍄</span>
                <h3 style={{ font: "700 18px Manrope", color: "#1f3928", margin: "12px 0 6px" }}>
                  Awaiting Fresh Harvests from Verified Cultivators
                </h3>
                <p style={{ color: "#6a7767", fontSize: 13, maxWidth: 440, margin: "auto" }}>
                  No mushroom posts currently in database. Log into your Cultivator Portal to publish the first fresh harvest listing!
                </p>
                <div style={{ marginTop: 16 }}>
                  <Link to="/portal/cultivator" className="button button-green" style={{ fontSize: 13 }}>
                    Post New Harvest as Cultivator →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THE MYCOLOGY HERITAGE — 3 CLASSIC PILLARS */}
      <section className="feature-band">
        <div className="container">
          <div className="feature-band-header">
            <p className="eyebrow">The Mycology Standard</p>
            <h2>Built On Scientific Precision & Agricultural Honor</h2>
            <p>
              We connect passionate growers and mindful culinary lovers through radical transparency, scientific climate control, and direct farmer economic empowerment.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box">🔬</div>
              <h3>Lab-Sterilized Cleanrooms</h3>
              <p>
                Every harvest originates from HEPA-filtered fruiting chambers utilizing certified organic substrates—sterilized Himalayan oak sawdust and organic wheat bran.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">🤝</div>
              <h3>Zero Middlemen Markups</h3>
              <p>
                Payments credit the cultivator’s bank account directly via UPI and IMPS in INR (₹). Growers retain full value for their labor and harvest craft.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box">❄️</div>
              <h3>Harvested At Veil Integrity</h3>
              <p>
                Fruiting bodies are hand-cut at peak morning veil closure and sealed inside insulated temperature-controlled packaging within hours of picking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 ROLE GATEWAYS ACCESS BANNER */}
      <section style={{ background: "#ffffff", padding: "50px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: 840 }}>
          <p className="eyebrow" style={{ justifyContent: "center" }}>Unified Ecosystem</p>
          <h2 style={{ font: "700 32px var(--serif)", margin: "0 0 12px", color: "var(--ink)" }}>
            A Dedicated Workspace For Every Role
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 30px" }}>
            Whether you are cultivating crops, cooking in fine restaurants, studying spawn preparation, or managing regional logistics, MushroomHub provides a tailored portal.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/portal/cultivator" className="button button-outline" style={{ padding: "10px 18px", fontSize: 13 }}>
              🍄 Cultivator Portal
            </Link>
            <Link to="/portal/customer" className="button button-outline" style={{ padding: "10px 18px", fontSize: 13 }}>
              🛒 Customer Portal
            </Link>
            <Link to="/login" className="button button-green" style={{ padding: "10px 22px", fontSize: 13 }}>
              🔑 Enter Role Login Gateways →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
