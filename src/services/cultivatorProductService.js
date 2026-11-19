// Dedicated Cultivator & Marketplace Product Service for MushroomHub
// Connects to Spring Boot backend APIs backed by PostgreSQL (Aiven)

import { getAuthHeaders } from "./cloudAuth";

const BACKEND_BASE = "http://localhost:8080/api";
const REQUEST_TIMEOUT_MS = 6000;

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Fetch ONLY the currently authenticated cultivator's products.
 * Authenticated user identity is resolved on the Spring Boot backend.
 */
export async function getMyProducts() {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch cultivator products from backend:", err);
    return null;
  }
}

/**
 * Fetch details of a single product owned by the authenticated cultivator.
 */
export async function getProductById(productId) {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products/${productId}`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch product details:", err);
    return null;
  }
}

/**
 * Create a new product listing linked strictly to the authenticated cultivator.
 */
export async function createCultivatorProduct(productData) {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, product: data.product, message: data.message };
    }
    return {
      success: false,
      error: data.error || `Server returned error (${res.status})`
    };
  } catch (err) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Update a product owned by the authenticated cultivator.
 * Blocked on backend with 403 Forbidden if not the product owner.
 */
export async function updateCultivatorProduct(productId, productData) {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products/${productId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, product: data.product, message: data.message };
    }
    return {
      success: false,
      status: res.status,
      error: data.error || `Update failed with status ${res.status}`
    };
  } catch (err) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Delete a product owned by the authenticated cultivator.
 * Blocked on backend with 403 Forbidden if not the product owner.
 */
export async function deleteCultivatorProduct(productId) {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return {
      success: false,
      status: res.status,
      error: data.error || `Delete failed with status ${res.status}`
    };
  } catch (err) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Update stock and active status of a cultivator product.
 */
export async function updateCultivatorStock(productId, stockQuantity, status) {
  try {
    const payload = {};
    if (stockQuantity !== undefined) payload.stockQuantity = stockQuantity;
    if (status !== undefined) payload.status = status;

    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/products/${productId}/stock`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, product: data.product };
    }
    return { success: false, error: data.error };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Public Marketplace: Fetch approved products from ALL cultivators.
 */
export async function getMarketplaceProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.search) query.set("search", params.search);

    const url = `${BACKEND_BASE}/products/marketplace${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetchWithTimeout(url, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return null;
  } catch (err) {
    console.warn("Marketplace fetch error:", err);
    return null;
  }
}

/**
 * Fetch orders relevant to the currently logged in cultivator.
 */
export async function getCultivatorOrders() {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/orders`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch dashboard KPI metrics for the cultivator.
 */
export async function getCultivatorDashboardStats() {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}/cultivator/dashboard-stats`, {
      method: "GET",
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}
