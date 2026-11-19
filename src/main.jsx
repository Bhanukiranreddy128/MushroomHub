import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Purge legacy mock cultivators, mock customers, and mock posts from browser localStorage
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const purgeFlag = "mushroomhub_purged_v3";
    if (!localStorage.getItem(purgeFlag)) {
      localStorage.removeItem("mushroomhub_registered_users");
      localStorage.removeItem("mushroomhub_catalog_feed");
      localStorage.removeItem("mushroomhub_feed_catalog");
      localStorage.removeItem("mushroomhub_all_cultivators");
      localStorage.removeItem("mushroomhub_cultivator_profile");
      localStorage.removeItem("mushroomhub_customer_profile");
      localStorage.removeItem("mushroomhub_customer_orders");
      localStorage.removeItem("mushroomhub_cultivator_orders");
      localStorage.removeItem("mushroomhub_sales_ledger");
      localStorage.removeItem("mushroomhub_price_bargains");
      localStorage.removeItem("mushroom-cart");
      const authUserStr = localStorage.getItem("mushroomhub_auth_user");
      if (authUserStr) {
        try {
          const authUser = JSON.parse(authUserStr);
          if (authUser?.role === "cultivater" || authUser?.role === "cultivator" || authUser?.role === "customer") {
            localStorage.removeItem("mushroomhub_auth_user");
            localStorage.removeItem("mushroomhub_active_role");
            localStorage.removeItem("mushroomhub_auth_token");
          }
        } catch {
          /* ignore */
        }
      }
      localStorage.setItem(purgeFlag, "true");
    }
  } catch {
    /* ignore */
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
