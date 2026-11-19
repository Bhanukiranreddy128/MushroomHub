import { useEffect, useMemo, useState, useCallback } from "react";
import ProductCard from "../components/ProductCard";
import { DEFAULT_MUSHROOM_PHOTO, getMushroomFeed } from "../data/store";
import { getMarketplaceProducts } from "../services/cultivatorProductService";

export default function Marketplace() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All varieties");
  const [sort, setSort] = useState("Recommended");
  const [catalog, setCatalog] = useState(getMushroomFeed);

  const syncMarketplace = useCallback(async () => {
    try {
      const remote = await getMarketplaceProducts();
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const mapped = remote.map((p) => ({
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
          tag: "Verified Farm Harvest",
          color: "sage"
        }));

        const localFeed = getMushroomFeed();
        const mergedMap = new Map();
        mapped.forEach((m) => mergedMap.set((m.productId || m.id).toLowerCase(), m));
        if (Array.isArray(localFeed)) {
          localFeed.forEach((l) => {
            const k = (l.productId || l.id).toLowerCase();
            if (!mergedMap.has(k)) mergedMap.set(k, l);
          });
        }
        setCatalog(Array.from(mergedMap.values()));
        return;
      }
    } catch {
      // Fallback
    }
    setCatalog(getMushroomFeed());
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        syncMarketplace();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [syncMarketplace]);

  useEffect(() => {
    const handleFeedUpdate = () => {
      syncMarketplace();
    };

    window.addEventListener("mushrooms-catalog-updated", handleFeedUpdate);
    return () => window.removeEventListener("mushrooms-catalog-updated", handleFeedUpdate);
  }, [syncMarketplace]);

  const filtered = useMemo(() => {
    let list = catalog.filter(
      (p) =>
        (type === "All varieties" || p.type === type) &&
        `${p.name} ${p.type} ${p.farm} ${p.place || ""}`.toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "Price: low to high") {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: high to low") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [catalog, query, type, sort]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">The Living Botanical Exchange</p>
          <h1>The Mushroom Marketplace</h1>
          <p>
            Direct access to small-batch gourmet culinary flushes, medicinal extracts, and certified spawn. Cleanroom-grown with 100% grower provenance.
          </p>
        </div>
      </section>

      <div className="container market-layout">
        <aside className="filter-panel">
          <h3>Filter By Heritage</h3>
          <label htmlFor="variety">Variety</label>
          <select id="variety" value={type} onChange={(e) => setType(e.target.value)}>
            <option>All varieties</option>
            {[...new Set(catalog.map((p) => p.type))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recommended</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
          </select>

          <div style={{ marginTop: 24, padding: 16, background: "var(--gold-light)", borderRadius: 10, border: "1px solid rgba(191, 161, 95, 0.3)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3eb454", display: "inline-block" }}></span>
              Live Cultivator Feed
            </span>
            <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: "6px 0 0" }}>
              Listings published by certified growers in their Cultivator Portals reflect here in real-time.
            </p>
          </div>
        </aside>

        <main>
          <div className="market-toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                aria-label="Search mushrooms or farms"
                placeholder="Search mushroom species, farms, or locations (e.g. Dehradun, Ooty)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="result-count" style={{ fontWeight: 600 }}>{filtered.length} Living Harvests</span>
          </div>

          <div className="market-grid">
            {filtered.length ? (
              filtered.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="no-results">
                No mushrooms match that search. Try searching for "Oyster", "Lion", "Shiitake", or reset filters.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
