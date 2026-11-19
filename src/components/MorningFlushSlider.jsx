import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addToCart } from "../data";
import { DEFAULT_MUSHROOM_PHOTO, getMushroomFeed } from "../data/store";
import "./MorningFlushSlider.css";

/**
 * MorningFlushSlider
 * Interactive side-sliding showcase of live morning flush harvests.
 * Matches exact UI/Tailwind specifications with:
 * - Top Left: LIVE MORNING FULFILL pulsing badge
 * - Top Right: Dynamic Slide Counter (e.g. 5 / 6)
 * - Navigation: Left & Right floating circular arrows
 * - Bottom Left: Stock availability badge
 * - Bottom Right: Pill price badge (₹380 /kg)
 * - Specifications grid: Substrate & Harvest Batch
 * - Location & Farm provenance
 * - Add to Basket & Details CTA buttons
 * - Pagination indicator dots & slide story helper
 */
export default function MorningFlushSlider({ items: propItems, onToast, className = "" }) {
  const [storeCatalog, setStoreCatalog] = useState(getMushroomFeed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedId, setAddedId] = useState(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Real-time catalog update listener
  useEffect(() => {
    const handleUpdate = () => {
      const fresh = getMushroomFeed();
      if (fresh && fresh.length > 0) {
        setStoreCatalog(fresh);
      }
    };
    const handleStorage = (e) => {
      if (e.key === "mushroomhub_feed_catalog" || e.key === "mushroomhub_catalog_feed") {
        handleUpdate();
      }
    };

    window.addEventListener("mushrooms-catalog-updated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("mushrooms-catalog-updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const catalog = propItems && propItems.length > 0 ? propItems : storeCatalog;
  const safeIndex = catalog.length > 0 ? currentIndex % catalog.length : 0;

  // Auto-play interval: slides one after another every 4 seconds
  useEffect(() => {
    if (isPaused || catalog.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % catalog.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, catalog.length]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => {
      const current = prev % catalog.length;
      return current <= 0 ? catalog.length - 1 : current - 1;
    });
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % catalog.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Touch Swipe Handlers for Mobile & Trackpads
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handleAddToCart = (mushroom, e) => {
    e?.preventDefault();
    e?.stopPropagation();

    addToCart({
      id: mushroom.id,
      name: mushroom.name,
      farm: mushroom.farm,
      price: Number(mushroom.price) || 350,
      unit: mushroom.unit || "kg",
      imageUrl: mushroom.imageUrl || DEFAULT_MUSHROOM_PHOTO
    });

    setAddedId(mushroom.id);
    setTimeout(() => setAddedId(null), 2200);

    const msg = `🎉 Added 1 ${mushroom.unit || "kg"} of "${mushroom.name}" to cart!`;
    if (typeof onToast === "function") {
      onToast(msg);
    }
  };

  if (!catalog || catalog.length === 0) {
    return null;
  }

  return (
    <div
      className={`morning-flush-slider-card ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Live Morning Flush Harvest Showcase"
    >
      {/* Side-Sliding Viewport */}
      <div className="spotlight-carousel-viewport">
        {/* Floating Left Navigation Arrow */}
        {catalog.length > 1 && (
          <button
            type="button"
            className="spotlight-nav-btn prev"
            onClick={handlePrev}
            aria-label="Previous Slide"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </button>
        )}

        {/* Floating Right Navigation Arrow */}
        {catalog.length > 1 && (
          <button
            type="button"
            className="spotlight-nav-btn next"
            onClick={handleNext}
            aria-label="Next Slide"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </button>
        )}

        <div
          className="spotlight-carousel-track"
          style={{
            transform: `translateX(-${safeIndex * 100}%)`
          }}
        >
          {catalog.map((item, index) => {
            const photo = item.imageUrl || DEFAULT_MUSHROOM_PHOTO;
            const price = Number(item.price) || 380;
            const unit = item.unit || "kg";
            const isAdded = addedId === item.id;
            const stockQty = item.stock || 20;

            return (
              <div
                key={item.id || index}
                className="spotlight-slide"
                aria-hidden={index !== safeIndex}
              >
                {/* Image Container with Overlays */}
                <div className="spotlight-media-wrap">
                  <img
                    src={photo}
                    alt={item.name}
                    loading={index === 0 ? "eager" : "lazy"}
                  />

                  {/* Overlay Badge: Top Left Live Status */}
                  <div className="spotlight-floating-badge">
                    <span className="pulse-dot-green"></span>
                    <span>LIVE MORNING FULFILL</span>
                  </div>

                  {/* Overlay Badge: Top Right Counter */}
                  <div className="spotlight-floating-count">
                    {index + 1} / {catalog.length}
                  </div>

                  {/* Overlay Badge: Bottom Left Stock */}
                  <div className="spotlight-floating-stock">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    <span>{stockQty} {unit} in stock</span>
                  </div>

                  {/* Overlay Badge: Bottom Right Pricing */}
                  <div className="spotlight-floating-price">
                    ₹{price} <small>/{unit}</small>
                  </div>
                </div>

                {/* Product Details Row 1: Tags & Provenance */}
                <div className="spotlight-info">
                  <div className="spotlight-tag-row">
                    <div className="spotlight-tag-left">
                      <span>{item.type ? `${item.type.toUpperCase()} MUSHROOM` : "OYSTER MUSHROOM"}</span>
                      <span className="spotlight-dot-sep"></span>
                      <span>{item.tag ? item.tag.toUpperCase() : "LIMITED BATCH"}</span>
                    </div>
                    <div className="spotlight-tag-organic">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      <span>100% Organic</span>
                    </div>
                  </div>

                  {/* Product Title */}
                  <h2 className="spotlight-title">{item.name}</h2>

                  {/* Product Description */}
                  <p className="spotlight-desc">
                    {item.description || "Vibrant harvest bouquet clusters with roasted notes and silky texture when crisped."}
                  </p>

                  {/* Specifications Badge Row (2 Columns) */}
                  <div className="spotlight-specs-grid">
                    <div className="spotlight-spec-box">
                      <span>🌱</span>
                      <span><strong>Substrate:</strong> {item.substrate || "Pasteurized Straw & Oat Hull"}</span>
                    </div>
                    <div className="spotlight-spec-box">
                      <span style={{ color: "#f43f5e" }}>📍</span>
                      <span><strong>Batch:</strong> {item.harvestDate || "Today, 7:00 AM"}</span>
                    </div>
                  </div>

                  {/* Location & Farm Row */}
                  <div className="spotlight-meta-row">
                    <div className="spotlight-meta-item">
                      <span style={{ color: "#f43f5e" }}>📍</span>
                      <span>{item.place || "Dehradun, Uttarakhand"}</span>
                    </div>
                    <div className="spotlight-meta-item">
                      <span style={{ color: "#047857" }}>🌲</span>
                      <span>{item.farm || "Himalayan Forest Spores & Myco Farm"}</span>
                    </div>
                  </div>

                  {/* Card Primary Actions Row */}
                  <div className="spotlight-actions-row">
                    <button
                      type="button"
                      className={`spotlight-add-btn ${isAdded ? "added" : ""}`}
                      onClick={(e) => handleAddToCart(item, e)}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      <span>{isAdded ? "Added to Basket!" : `Add to Basket (₹${price})`}</span>
                    </button>
                    <Link to={`/mushrooms/${item.id}`} className="spotlight-details-link">
                      <span>Details</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Dots & Harvest Story Footnote */}
      {catalog.length > 1 && (
        <div className="spotlight-dots-container">
          <div className="spotlight-dots-bar" role="tablist" aria-label="Pagination Indicator Dots">
            {catalog.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`spotlight-dot ${idx === safeIndex ? "active" : ""}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
          <span className="spotlight-story-helper">
            &gt; Sliding through daily harvest stories • Slide {safeIndex + 1} of {catalog.length}
          </span>
        </div>
      )}
    </div>
  );
}
