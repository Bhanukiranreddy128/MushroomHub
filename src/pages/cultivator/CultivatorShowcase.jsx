import { Link } from "react-router-dom";
import MorningFlushSlider from "../../components/MorningFlushSlider";

export default function CultivatorShowcase({ onToast, onOpenPostModal, onNavigateTab }) {
  return (
    <div
      style={{
        background: "#f3f9f4",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",
        border: "1px solid #dce8dd",
        boxShadow: "0 8px 30px rgba(17, 56, 34, 0.04)",
        padding: "clamp(20px, 3.5vw, 40px) clamp(16px, 3.5vw, 36px)",
        marginBottom: "24px"
      }}
    >
      {/* Decorative Background Foliage */}
      {/* Top Left Foliage */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: "-30px",
          width: "220px",
          height: "220px",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 0
        }}
      >
        <svg style={{ width: "100%", height: "100%" }} fill="none" viewBox="0 0 200 200">
          <path d="M40,20 C80,10 130,50 140,110 C150,170 100,190 70,180 C40,170 20,130 20,80 Z" fill="#68bb76" opacity="0.35" />
          <path d="M10,90 C50,60 110,80 120,140 C100,170 50,160 20,130 Z" fill="#4ea85d" opacity="0.45" />
        </svg>
      </div>

      {/* Top Right Foliage */}
      <div
        style={{
          position: "absolute",
          top: "0",
          right: "-30px",
          width: "240px",
          height: "240px",
          opacity: 0.6,
          pointerEvents: "none",
          zIndex: 0
        }}
      >
        <svg style={{ width: "100%", height: "100%" }} fill="none" viewBox="0 0 200 200">
          <path d="M160,20 C110,10 60,60 50,120 C40,180 110,190 140,170 C170,150 190,100 180,50 Z" fill="#58ad67" opacity="0.35" />
          <path d="M190,80 C140,60 90,90 90,150 C120,180 170,160 190,120 Z" fill="#78c986" opacity="0.4" />
        </svg>
      </div>

      {/* Bottom Wavy Hills Background */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "140px",
          pointerEvents: "none",
          overflow: "hidden",
          lineHeight: 0,
          zIndex: 0
        }}
      >
        <svg style={{ width: "100%", height: "100%" }} fill="none" preserveAspectRatio="none" viewBox="0 0 1440 220">
          <path d="M0,130 C320,190 620,80 940,140 C1180,185 1350,110 1440,130 L1440,220 L0,220 Z" fill="#b9e3c0" opacity="0.5" />
          <path d="M0,165 C380,110 700,210 1020,145 C1240,105 1360,170 1440,150 L1440,220 L0,220 Z" fill="#8bc995" opacity="0.6" />
        </svg>
      </div>

      {/* Main Grid Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "clamp(24px, 4vw, 44px)",
          alignItems: "center"
        }}
      >
        {/* Left Column: Hero Content & Portals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Category Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "#e8f5eb",
              border: "1px solid #cbe7d1",
              color: "#1c6636",
              width: "fit-content",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <span style={{ fontSize: "14px" }}>🌱</span>
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              India's Premier Mycology & Harvest Exchange
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(28px, 3.2vw, 46px)",
              fontWeight: 800,
              color: "#113822",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: 0
            }}
          >
            Nature’s Finest Harvest.<br />
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 700,
                color: "#1a5531"
              }}
            >
              Handcrafted by True Artisans.
            </span>
          </h1>

          {/* Explanatory Subheading */}
          <p
            style={{
              fontSize: "14px",
              color: "#475569",
              lineHeight: 1.65,
              margin: 0,
              maxWidth: "520px"
            }}
          >
            Direct from sterilized Himalayan cleanrooms and high-altitude hardwood reserves. Discover small-batch gourmet culinary mushrooms, medicinal fungi, and organic spawn with 100% grower provenance.
          </p>

          {/* Call-to-Action Buttons Row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", paddingTop: "4px" }}>
            <Link
              to="/marketplace"
              style={{
                background: "#113822",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(17, 56, 34, 0.2)"
              }}
            >
              <span>Explore The Marketplace</span>
              <span>→</span>
            </Link>

            <button
              type="button"
              onClick={onOpenPostModal}
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                padding: "10px 18px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <span style={{ color: "#059669" }}>🌱</span>
              <span>Post New Mushroom</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.("feed")}
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                padding: "10px 18px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <span style={{ color: "#d97706" }}>🌾</span>
              <span>My Harvest Feed</span>
            </button>
          </div>

          {/* Social Proof & Review Ratings */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingTop: "10px" }}>
            <div style={{ display: "flex", marginLeft: "10px" }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF6UaBds61dM34B9mVcK4hTEbvNnekCcPCFeMK3OuUGFbFifxQrnLqCE8gHPN5CxjegmWYIIzYw0Aj8AthPYPNii2RjG0x6XAzXpPJ5nwiqLj3GQsARwzOqBlN8kj9G5fdNLFWHNri08ykiUOLxDMGtLb735JReWEupdxOCYDmloN87H1n14Tas-goKXbZ8SKa3OOB8w41qfZkgmdKTEanL_EJ5lCL4_bd8X2yj-w"
                alt="Cultivator 1"
                style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #fff", marginLeft: "-10px", objectFit: "cover" }}
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7_xJDp9U9qHCfRUa2-eRxD5UAFwj-cXrLCJMx1LyWozvVl7hRUdsoFg5sylsOV9YpV9phbgyRSJlL_toSGAwdED_jUopbaogV5d79igIluMqvkT1SpBcMkJsnGAe51N-86KNqJ8qZC3gKIPJIb1LEOcGPUCVFztVToidx8knC-JzWmrnp4h06y5hwTMBhNPmqP8OFkFnxCO8nmCpeC1Hd67A-gGF8L2dS5VlFMuw"
                alt="Cultivator 2"
                style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #fff", marginLeft: "-10px", objectFit: "cover" }}
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLHbiVdM8h-Z6JchbmWvSHvft-q6z6xa1utwo_SAo8eLh9tEjj1NgQ6lNQ6qnI3W2n0w5uNG-YDraHbf5JFqLmWv-nOn5vZ6wH5SGu0z-H4yZjhX8h2Kg0IKrSTDztlydLWhwgDnYAiao8EzdcCtNjeHMvHzkBao1_-KR2XRnW84LB-I6gqrwv485i_S_nGsFZH8cUc2iPHTQqGEAiB7A1I0_5uTFr5rw5K5fgUO8"
                alt="Cultivator 3"
                style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #fff", marginLeft: "-10px", objectFit: "cover" }}
              />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABtogi2ioI6SxcGh9Gc-gCwr1si1uEOfGbXLNSCOkgCWvNlVQdk8A-oHW-f27nUWMycBatkr4dOcD0GoVuyOUWr6aENoWvYC2eTXPHPTwJlLmYQQNtGSXv2OwiQL3NFT1IGTBoP-VtkKN8kZFE2hg-sJoipdSI58DcC_1YpFJk7kp_ei48THxZZIfT-YeOus_RrtIVgnTsMU6V7WI25v3WO6MYmkzEFumAJQuBnfY"
                alt="Cultivator 4"
                style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #fff", marginLeft: "-10px", objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{ color: "#f59e0b", fontSize: "13px", letterSpacing: "1px" }}>★★★★★</div>
              <div style={{ fontSize: "11.5px", color: "#475569", fontWeight: 600 }}>
                <strong style={{ color: "#0f172a" }}>4.9 / 5.0</strong> Trusted by 112+ independent cultivators, chefs, and mycologists
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Showcase Card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <MorningFlushSlider onToast={onToast} />
        </div>
      </div>
    </div>
  );
}
