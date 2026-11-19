import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import CustomerAuthModal from "./components/CustomerAuthModal";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import About from "./pages/About";
import AdminPortal from "./pages/admin/AdminPortal";
import Cart from "./pages/Cart";
import CultivatorPortal from "./pages/cultivator/CultivatorPortal";
import CustomerPortal from "./pages/customer/CustomerPortal";
import ForBuyers from "./pages/ForBuyers";
import ForFarmers from "./pages/ForFarmers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Marketplace from "./pages/MarketPlace";
import MushroomDetails from "./pages/MushroomDetails";
import Resources from "./pages/Resources";
import SignUp from "./pages/SignUp";
import SuperAdminPortal from "./pages/superadmin/SuperAdminPortal";
import "./styles/portal.css";

function AppFooter() {
  const location = useLocation();
  if (location.pathname.startsWith("/portal/")) {
    return null;
  }
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link className="footer-brand-title" to="/">
              <span>🍄</span>
              <span>Mushroom<span style={{ color: "var(--gold)" }}>Hub</span></span>
            </Link>
            <p>
              India’s premier organic mycology exchange. Connecting independent commercial cultivators and culinary chefs through live harvest feeds, cleanroom transparency, and direct bank settlements.
            </p>
            <div className="footer-badges-row">
              <span className="footer-cert-pill">🌿 Jaivik Bharat Organic</span>
              <span className="footer-cert-pill">🛡️ FSSAI Food Safety #10022011002341</span>
              <span className="footer-cert-pill">⚡ Direct Farmer UPI</span>
            </div>
          </div>

          {/* Quick Links: Varieties */}
          <div className="footer-col">
            <h4>Live Varieties</h4>
            <ul className="footer-links-list">
              <li><Link to="/marketplace">Blue Oyster Clusters</Link></li>
              <li><Link to="/marketplace">Lion’s Mane Pom-Poms</Link></li>
              <li><Link to="/marketplace">Oak Forest Shiitake</Link></li>
              <li><Link to="/marketplace">Royal King Trumpets</Link></li>
              <li><Link to="/marketplace">Medicinal Ganoderma</Link></li>
            </ul>
          </div>

          {/* Gateways & Ecosystem */}
          <div className="footer-col">
            <h4>Workspaces</h4>
            <ul className="footer-links-list">
              <li><Link to="/portal/cultivator">🍄 Cultivator Portal</Link></li>
              <li><Link to="/portal/customer">🛒 Customer Portal</Link></li>
              <li><Link to="/resources">📚 Species & Climate Guides</Link></li>
              <li><Link to="/about">🌱 Our Growing Heritage</Link></li>
              <li><Link to="/login">🔑 Role Login Gateways</Link></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="footer-col">
            <h4>The Fungi Dispatch</h4>
            <div className="footer-newsletter-box">
              <p>Subscribe for rare harvest announcements, fresh flush releases, and cultivator stories.</p>
              <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("✨ Thank you for subscribing to The Fungi Dispatch!"); }}>
                <input type="email" placeholder="chef@restaurant.com" required />
                <button type="submit">Join</button>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>
            © 2026 MushroomHub Organic Ecosystem. Handcrafted with scientific precision and agricultural care.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>🔒 Secure Cloud PostgreSQL Architecture</span>
            <span>·</span>
            <span>❄️ Cold-Chain 24H Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <CustomerAuthModal />
        <Routes>
          {/* Main Website Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/farmers" element={<ForFarmers />} />
          <Route path="/buyers" element={<ForBuyers />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/mushrooms/:id" element={<MushroomDetails />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/mushroom-guide" element={<Resources />} />
          <Route path="/farming-tips" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/join" element={<SignUp />} />
          <Route path="/cart" element={<Cart />} />

          {/* Role Login Gateways */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/:role" element={<Login />} />

          {/* Dedicated Role Portals with Strict RBAC Route Guards */}
          <Route
            path="/portal/cultivator"
            element={
              <ProtectedRoute allowedRoles={["cultivater", "cultivator", "superadmin"]}>
                <CultivatorPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/customer"
            element={
              <ProtectedRoute allowedRoles={["customer", "superadmin"]}>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/superadmin"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <SuperAdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Quick Route Aliases */}
          <Route path="/admin" element={<Navigate to="/portal/admin" replace />} />
          <Route path="/cultivator" element={<Navigate to="/portal/cultivator" replace />} />
          <Route path="/cultivater" element={<Navigate to="/portal/cultivator" replace />} />
          <Route path="/farmer" element={<Navigate to="/portal/cultivator" replace />} />
          <Route path="/customer" element={<Navigate to="/portal/customer" replace />} />
          <Route path="/superadmin" element={<Navigate to="/portal/superadmin" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
        <AppFooter />
      </BrowserRouter>
    </AuthProvider>
  );
}
