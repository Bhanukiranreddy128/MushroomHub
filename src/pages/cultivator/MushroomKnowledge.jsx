import { useMemo, useState } from "react";
import {
  CLIMATE_TYPES,
  MUSHROOM_CATEGORIES,
  WORLD_MUSHROOMS
} from "../../data/mushroomEncyclopedia";

export default function MushroomKnowledge() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedClimate, setSelectedClimate] = useState("All Climates");
  const [activeMushroom, setActiveMushroom] = useState(null);

  // Filtered Mushrooms
  const filtered = useMemo(() => {
    return WORLD_MUSHROOMS.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.scientificName.toLowerCase().includes(search.toLowerCase()) ||
        m.origin.toLowerCase().includes(search.toLowerCase()) ||
        m.cultivationRequirements.preferredSubstrates.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "All Categories" || m.category === selectedCategory;

      let matchClimate = true;
      if (selectedClimate === "Cool Climate (< 18°C)") {
        matchClimate =
          m.climaticConditions.fruitingTemp.includes("10°C") ||
          m.climaticConditions.fruitingTemp.includes("12°C") ||
          m.climaticConditions.fruitingTemp.includes("14°C") ||
          m.climaticConditions.fruitingTemp.includes("15°C") ||
          m.climaticConditions.fruitingTemp.includes("16°C");
      } else if (selectedClimate === "Temperate (18°C – 23°C)") {
        matchClimate =
          m.climaticConditions.fruitingTemp.includes("18°C") ||
          m.climaticConditions.fruitingTemp.includes("20°C") ||
          m.climaticConditions.fruitingTemp.includes("21°C") ||
          m.climaticConditions.fruitingTemp.includes("22°C");
      } else if (selectedClimate === "Warm / Tropical (> 24°C)") {
        matchClimate =
          m.climaticConditions.fruitingTemp.includes("25°C") ||
          m.climaticConditions.fruitingTemp.includes("28°C") ||
          m.climaticConditions.fruitingTemp.includes("30°C") ||
          m.climaticConditions.fruitingTemp.includes("32°C");
      }

      return matchSearch && matchCategory && matchClimate;
    });
  }, [search, selectedCategory, selectedClimate]);

  return (
    <div>
      {/* Intro Header */}
      <div className="hub-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 15 }}>
          <div>
            <span className="role-badge-pill" style={{ background: "#eef6ea", color: "#2d5e38", marginBottom: 6 }}>
              📖 Master Cultivator Encyclopedia & Agronomy Guide
            </span>
            <h2 style={{ font: "700 20px Manrope", color: "#1e3828", margin: "4px 0" }}>
              World Mushroom History, Climatic Conditions & Cultivation Handbook
            </h2>
            <p style={{ fontSize: 12, color: "#667464", maxWidth: 780, lineHeight: 1.5, margin: 0 }}>
              Historical origins, botanical classifications, and precision growing parameters for the world's most 
              prominent mushrooms. Compare temperature curves, relative humidity (% RH), carbon dioxide tolerances, substrate formulations, and pinning triggers.
            </p>
          </div>
          <div style={{ background: "#f5f8f2", padding: "8px 16px", borderRadius: 8, border: "1px solid #dfe9d9", textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#667865", textTransform: "uppercase" }}>Knowledge Catalog</span>
            <div style={{ font: "700 20px Manrope", color: "#223d2b" }}>{WORLD_MUSHROOMS.length} World Species</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="hub-card" style={{ padding: "14px 20px", marginBottom: 16 }}>
        <div className="knowledge-filters" style={{ marginBottom: 14 }}>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search mushroom by common name, scientific name, substrate, or origin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#526350" }}>Climate:</label>
            <select
              className="form-control"
              style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}
              value={selectedClimate}
              onChange={(e) => setSelectedClimate(e.target.value)}
            >
              {CLIMATE_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="category-pill-group">
          {MUSHROOM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-pill-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Knowledge Cards */}
      <div className="knowledge-grid">
        {filtered.map((m) => (
          <div key={m.id} className="knowledge-card">
            <div className={`knowledge-card-top ${m.colorTheme}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span className="status-badge paid" style={{ fontSize: 10 }}>{m.category}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#60745f" }}>{m.badge}</span>
              </div>

              <h3 style={{ font: "700 18px Manrope", color: "#213928", margin: "4px 0 2px" }}>{m.name}</h3>
              <div className="scientific-badge">{m.scientificName}</div>
              <div style={{ fontSize: 11, color: "#6f7b6d" }}>📍 Origin: <strong>{m.origin}</strong></div>

              {/* Climate preview chips */}
              <div className="climate-specs-preview">
                <div>
                  <div className="spec-chip-label">Fruiting Temp</div>
                  <div className="spec-chip-val">{m.climaticConditions.fruitingTemp.split(" ")[0]}</div>
                </div>
                <div>
                  <div className="spec-chip-label">Humidity (RH)</div>
                  <div className="spec-chip-val">{m.climaticConditions.fruitingHumidity.split(" ")[0]} RH</div>
                </div>
              </div>
            </div>

            <div className="knowledge-body">
              <p className="knowledge-history-snippet">
                {m.history.slice(0, 160)}...
              </p>

              <div style={{ fontSize: 11, color: "#546452", background: "#f8faf6", padding: "8px 10px", borderRadius: 6, marginBottom: 14 }}>
                <strong>Substrate:</strong> {m.cultivationRequirements.preferredSubstrates.slice(0, 70)}...
              </div>

              <button
                className="button button-green"
                style={{ width: "100%", padding: "9px 12px", fontSize: 12 }}
                onClick={() => setActiveMushroom(m)}
              >
                View Complete History & Specs →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h3>No mushrooms found matching "{search}"</h3>
          <p style={{ color: "#778375" }}>Try clearing filters or searching by substrate (e.g. "sawdust", "straw", "oak").</p>
          <button
            className="button button-outline"
            onClick={() => { setSearch(""); setSelectedCategory("All Categories"); setSelectedClimate("All Climates"); }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Deep Encyclopedia Detail Modal */}
      {activeMushroom && (
        <div className="modal-backdrop" onClick={() => setActiveMushroom(null)}>
          <div className="modal-dialog" style={{ width: "min(860px, 98%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="status-badge paid" style={{ marginBottom: 6 }}>{activeMushroom.category}</span>
                <h2 style={{ font: "700 26px Manrope", color: "#1f3829", margin: "4px 0 2px" }}>
                  {activeMushroom.name}
                </h2>
                <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: "#4d604e" }}>
                  {activeMushroom.scientificName} · Origin: {activeMushroom.origin}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveMushroom(null)}>✕</button>
            </div>

            {/* Section 1: History */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ font: "700 16px Manrope", color: "#274330", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                📜 Historical Origins & Evolutionary Background
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#4c594b", background: "#f9faf6", padding: 16, borderRadius: 8, border: "1px solid #e5ebe0" }}>
                {activeMushroom.history}
              </p>
            </div>

            {/* Section 2: Climatic Conditions */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ font: "700 16px Manrope", color: "#274330", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                🌡️ Precision Climatic & Atmospheric Requirements
              </h3>
              <table className="specs-detail-table">
                <tbody>
                  <tr>
                    <th>Spawn Run (Colonization) Temp</th>
                    <td><strong>{activeMushroom.climaticConditions.colonizationTemp}</strong></td>
                  </tr>
                  <tr>
                    <th>Fruiting Chamber Temp</th>
                    <td><strong>{activeMushroom.climaticConditions.fruitingTemp}</strong></td>
                  </tr>
                  <tr>
                    <th>Incubation Relative Humidity</th>
                    <td>{activeMushroom.climaticConditions.colonizationHumidity}</td>
                  </tr>
                  <tr>
                    <th>Fruiting Relative Humidity</th>
                    <td><strong>{activeMushroom.climaticConditions.fruitingHumidity}</strong></td>
                  </tr>
                  <tr>
                    <th>CO₂ Tolerance (Colonization)</th>
                    <td>{activeMushroom.climaticConditions.co2Colonization}</td>
                  </tr>
                  <tr>
                    <th>CO₂ Tolerance (Fruiting Chamber)</th>
                    <td><strong>{activeMushroom.climaticConditions.co2Fruiting}</strong></td>
                  </tr>
                  <tr>
                    <th>Lighting & Photoperiod</th>
                    <td>{activeMushroom.climaticConditions.lightRequirements}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Cultivation & Substrate Requirements */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ font: "700 16px Manrope", color: "#274330", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                🌾 Agronomic Substrate & Cultivation Protocols
              </h3>
              <table className="specs-detail-table">
                <tbody>
                  <tr>
                    <th>Preferred Substrate Recipe</th>
                    <td><strong>{activeMushroom.cultivationRequirements.preferredSubstrates}</strong></td>
                  </tr>
                  <tr>
                    <th>Casing Layer Requirement</th>
                    <td>
                      {activeMushroom.cultivationRequirements.casingLayerRequired ? (
                        <span style={{ color: "#226a35", fontWeight: 700 }}>Mandatory: {activeMushroom.cultivationRequirements.casingSpecs}</span>
                      ) : (
                        <span style={{ color: "#6e796c" }}>Not required (Fruits directly from substrate block/bag)</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Spawn Inoculation</th>
                    <td>{activeMushroom.cultivationRequirements.spawnType}</td>
                  </tr>
                  <tr>
                    <th>Incubation & Colonization Timeline</th>
                    <td><strong>{activeMushroom.cultivationRequirements.incubationTime}</strong></td>
                  </tr>
                  <tr>
                    <th>Pinning Initiation Triggers</th>
                    <td>{activeMushroom.cultivationRequirements.pinningTriggers}</td>
                  </tr>
                  <tr>
                    <th>Biological Efficiency (BE %)</th>
                    <td><strong>{activeMushroom.cultivationRequirements.biologicalEfficiency}</strong></td>
                  </tr>
                  <tr>
                    <th>Harvesting Maturity Window</th>
                    <td>{activeMushroom.cultivationRequirements.harvestWindow}</td>
                  </tr>
                  <tr>
                    <th>Cultivation Difficulty</th>
                    <td>
                      <span className="status-badge paid">{activeMushroom.cultivationRequirements.difficulty}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Sanitation & Contamination Risks</th>
                    <td style={{ color: "#8a4529" }}>{activeMushroom.cultivationRequirements.commonChallenges}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Culinary / Medicinal profile */}
            <div style={{ background: "#edf4ea", padding: "14px 18px", borderRadius: 8, border: "1px solid #d5e5cf" }}>
              <strong style={{ fontSize: 13, color: "#204627" }}>🍽️ Gastronomy & Bioactive Potency:</strong>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#37503c", lineHeight: 1.5 }}>
                {activeMushroom.flavorAndUses}
              </p>
            </div>

            <div style={{ textAlign: "right", marginTop: 22 }}>
              <button className="button button-green" onClick={() => setActiveMushroom(null)}>
                Close Knowledge Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
