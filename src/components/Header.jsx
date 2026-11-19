import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isCustomerAuthenticated } from "../data";
import AdminNavbar from "./navbars/AdminNavbar";
import CultivatorNavbar from "./navbars/CultivatorNavbar";
import CustomerNavbar from "./navbars/CustomerNavbar";
import PublicNavbar from "./navbars/PublicNavbar";
import SuperAdminNavbar from "./navbars/SuperAdminNavbar";

/**
 * Intelligent RBAC Navigation Controller
 * Renders an INDIVIDUAL, custom-tailored navigation bar for the 4 core roles:
 * - Cultivator (Farmer): Harvest tabs, Post Mushroom, Customer Orders, Notifications, Sign Out
 * - Customer (Buyer): Fresh Harvest Feed, Marketplace, Cart, Customer profile, Sign Out
 * - Administrator: User management, Farmer verification, Product moderation, Orders, Payments, Deliveries, Complaints, Analytics
 * - Super Administrator: Admin management, Role & permissions, Platform config, Gateway config, Audit logs, Master analytics
 * - Public: Home, Marketplace, Guides, About, Cart, and Login + Join
 */
export default function Header() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const { user } = useAuth();

  // 1. Separate role portals always render their dedicated portal navbar
  if (path.startsWith("/portal/cultivator")) {
    return <CultivatorNavbar />;
  }

  if (path.startsWith("/portal/customer")) {
    return <CustomerNavbar />;
  }

  if (path.startsWith("/portal/admin")) {
    return <AdminNavbar />;
  }

  if (path.startsWith("/portal/superadmin")) {
    return <SuperAdminNavbar />;
  }

  // 2. Active Customer session across store pages
  const isCustomer = Boolean(
    (user?.isLoggedIn && user?.role === "customer") ||
    isCustomerAuthenticated()
  );

  if (isCustomer) {
    return <CustomerNavbar />;
  }

  // 3. Persistent role sessions on other pages
  if (user?.isLoggedIn) {
    if (user.role === "admin") {
      return <AdminNavbar />;
    }
    if (user.role === "superadmin") {
      return <SuperAdminNavbar />;
    }
    if (user.role === "cultivater") {
      return <CultivatorNavbar />;
    }
  }

  // 4. Default: PublicNavbar for guests
  return <PublicNavbar />;
}
