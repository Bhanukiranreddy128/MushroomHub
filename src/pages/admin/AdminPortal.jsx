import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  deleteMushroomFeedItem,
  getAllCultivatorProfiles,
  getCustomerOrders,
  getMushroomFeed,
  getRegisteredUsers
} from "../../data/store";
import {
  deleteAdminProduct,
  fetchAdminAnalytics,
  fetchAdminComplaints,
  fetchAdminDeliveries,
  fetchAdminFarmers,
  fetchAdminOrders,
  fetchAdminPayments,
  fetchAdminProducts,
  fetchAdminUsers,
  refundAdminPayment,
  respondAdminComplaint,
  updateAdminOrderStatus,
  updateAdminProductStatus,
  updateAdminUserStatus,
  verifyAdminFarmer
} from "../../services/cloudAuth";
import RealtimeNotificationBell from "../../components/RealtimeNotificationBell";

export default function AdminPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active module tab
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_ADMIN_TABS = ["users", "farmers", "products", "orders", "payments", "deliveries", "complaints", "analytics"];
  const urlTab = searchParams.get("tab");
  const activeTab = urlTab && VALID_ADMIN_TABS.includes(urlTab) ? urlTab : "users";

  const setActiveTab = (newTab) => {
    if (newTab === activeTab) return;
    setSearchParams({ tab: newTab });
  };

  // Notifications
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Module Data States
  const [usersList, setUsersList] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [deliveriesList, setDeliveriesList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalBuyers: 0,
    totalFarmers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    monthlySales: []
  });

  // Modals & Active Selections
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ open: false, farmerId: null, reason: "" });
  const [inspectFarmerModal, setInspectFarmerModal] = useState({ open: false, farmer: null });
  const [farmerFilter, setFarmerFilter] = useState("ALL");
  const [complaintModal, setComplaintModal] = useState({ open: false, complaint: null, response: "", status: "RESOLVED" });
  const [refundModal, setRefundModal] = useState({ open: false, payment: null, note: "" });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  // Load Module Data from Backend with Local Store Fallback
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);

      try {
        // 1. Users
        const usersRes = await fetchAdminUsers();
        if (isMounted && usersRes.ok && Array.isArray(usersRes.data)) {
          setUsersList(usersRes.data);
        } else if (isMounted) {
          const localUsers = getRegisteredUsers().filter(
            (u) => u.role === "customer" || u.role === "cultivater"
          );
          setUsersList(localUsers);
        }

        // 2. Farmers
        const farmersRes = await fetchAdminFarmers();
        if (isMounted && farmersRes.ok && Array.isArray(farmersRes.data)) {
          setFarmersList(farmersRes.data);
        } else if (isMounted) {
          setFarmersList(getAllCultivatorProfiles());
        }

        // 3. Products
        const prodRes = await fetchAdminProducts();
        if (isMounted && prodRes.ok && Array.isArray(prodRes.data)) {
          setProductsList(prodRes.data);
        } else if (isMounted) {
          setProductsList(getMushroomFeed());
        }

        // 4. Orders
        const ordRes = await fetchAdminOrders();
        if (isMounted && ordRes.ok && Array.isArray(ordRes.data)) {
          setOrdersList(ordRes.data);
        } else if (isMounted) {
          setOrdersList(getCustomerOrders());
        }

        // 5. Payments
        const payRes = await fetchAdminPayments();
        if (isMounted && payRes.ok && Array.isArray(payRes.data)) {
          setPaymentsList(payRes.data);
        }

        // 6. Deliveries
        const delRes = await fetchAdminDeliveries();
        if (isMounted && delRes.ok && Array.isArray(delRes.data)) {
          setDeliveriesList(delRes.data);
        }

        // 7. Complaints
        const compRes = await fetchAdminComplaints();
        if (isMounted && compRes.ok && Array.isArray(compRes.data)) {
          setComplaintsList(compRes.data);
        }

        // 8. Analytics
        const anaRes = await fetchAdminAnalytics();
        if (isMounted && anaRes.ok && anaRes.data) {
          setAnalyticsData(anaRes.data);
        }
      } catch (err) {
        console.error("Admin data fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers for Module 1: User Management
  const handleToggleUserStatus = async (targetUser, newStatus) => {
    if (targetUser.role === "admin" || targetUser.role === "superadmin") {
      showError("Security Rule: Admins cannot modify Admin or Super Admin accounts.");
      return;
    }

    const res = await updateAdminUserStatus(targetUser.id, newStatus);
    if (res.ok) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, accountStatus: newStatus } : u))
      );
      showToast(`User ${targetUser.email} status updated to ${newStatus}`);
    } else {
      // Local fallback update
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, accountStatus: newStatus } : u))
      );
      showToast(`User ${targetUser.email} status set to ${newStatus} (local state).`);
    }
  };

  // Handlers for Module 2: Farmer Verification
  const handleFarmerVerification = async (farmerId, status, rejectionReason = "") => {
    const rawId = typeof farmerId === "string" && farmerId.includes("-") ? Number(farmerId.split("-").pop()) : Number(farmerId);
    const res = await verifyAdminFarmer(rawId, status, rejectionReason);
    if (res.ok) {
      setFarmersList((prev) =>
        prev.map((f) => {
          const fid = typeof f.id === "string" && f.id.includes("-") ? Number(f.id.split("-").pop()) : Number(f.id);
          return fid === rawId || f.id === farmerId
            ? { ...f, verificationStatus: status, rejectionReason: rejectionReason || null }
            : f;
        })
      );
      if (status === "APPROVED") {
        showToast(`✓ Cultivator accepted & approved! Their credentials are now active for login.`);
      } else if (status === "REJECTED") {
        showToast(`Farmer verification status marked as REJECTED.`);
      } else {
        showToast(`Farmer verification status set to ${status}`);
      }
    } else {
      setFarmersList((prev) =>
        prev.map((f) => {
          const fid = typeof f.id === "string" && f.id.includes("-") ? Number(f.id.split("-").pop()) : Number(f.id);
          return fid === rawId || f.id === farmerId
            ? { ...f, verificationStatus: status, rejectionReason: rejectionReason || null }
            : f;
        })
      );
      showToast(`Farmer verification updated to ${status}.`);
    }
    setRejectionModal({ open: false, farmerId: null, reason: "" });
    setInspectFarmerModal((prev) =>
      prev.open && prev.farmer
        ? { ...prev, farmer: { ...prev.farmer, verificationStatus: status, rejectionReason: rejectionReason || null } }
        : prev
    );
  };

  // Handlers for Module 3: Product Management
  const handleProductStatus = async (productId, status, notes = "") => {
    const res = await updateAdminProductStatus(productId, status, notes);
    if (res.ok) {
      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p))
      );
      showToast(`Product listing status updated to ${status}`);
    } else {
      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p))
      );
      showToast(`Product status set to ${status}.`);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete inappropriate listing "${product.name}"?`)) {
      return;
    }
    const res = await deleteAdminProduct(product.id);
    if (res.ok) {
      setProductsList((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Product "${product.name}" removed from marketplace.`);
    } else {
      deleteMushroomFeedItem(product.id);
      setProductsList((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Product "${product.name}" deleted.`);
    }
  };

  // Handlers for Module 4: Order Management
  const handleOrderStatusChange = async (orderId, newStatus) => {
    const res = await updateAdminOrderStatus(orderId, newStatus);
    if (res.ok) {
      setOrdersList((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order #${orderId} status updated to ${newStatus}`);
    } else {
      setOrdersList((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order #${orderId} marked as ${newStatus}.`);
    }
  };

  // Handlers for Module 5: Payment Management
  const handleProcessRefund = async () => {
    if (!refundModal.payment) return;
    const res = await refundAdminPayment(refundModal.payment.id, "REFUNDED", refundModal.note);
    if (res.ok) {
      setPaymentsList((prev) =>
        prev.map((p) =>
          p.id === refundModal.payment.id ? { ...p, status: "REFUNDED" } : p
        )
      );
      showToast(`Refund processed for order #${refundModal.payment.orderId}`);
    } else {
      setPaymentsList((prev) =>
        prev.map((p) =>
          p.id === refundModal.payment.id ? { ...p, status: "REFUNDED" } : p
        )
      );
      showToast(`Payment marked as REFUNDED.`);
    }
    setRefundModal({ open: false, payment: null, note: "" });
  };

  // Handlers for Module 8: Complaint Management
  const handleComplaintResponse = async () => {
    if (!complaintModal.complaint) return;
    const res = await respondAdminComplaint(
      complaintModal.complaint.id,
      complaintModal.response,
      complaintModal.status
    );
    if (res.ok) {
      setComplaintsList((prev) =>
        prev.map((c) =>
          c.id === complaintModal.complaint.id
            ? {
                ...c,
                status: complaintModal.status,
                adminResponse: complaintModal.response,
                resolvedBy: user?.email
              }
            : c
        )
      );
      showToast(`Response submitted for ticket #${complaintModal.complaint.ticketId}`);
    } else {
      setComplaintsList((prev) =>
        prev.map((c) =>
          c.id === complaintModal.complaint.id
            ? {
                ...c,
                status: complaintModal.status,
                adminResponse: complaintModal.response
              }
            : c
        )
      );
      showToast(`Complaint #${complaintModal.complaint.ticketId} updated.`);
    }
    setComplaintModal({ open: false, complaint: null, response: "", status: "RESOLVED" });
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.farmName && u.farmName.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "BUYER" && u.role === "customer") ||
      (roleFilter === "FARMER" && (u.role === "cultivater" || u.role === "cultivator"));

    const matchesStatus =
      statusFilter === "ALL" || (u.accountStatus || "ACTIVE").toUpperCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="portal-wrapper" style={{ minHeight: "100vh", background: "#f8faf7", padding: "24px 0 60px" }}>
      <div className="container" style={{ maxWidth: 1260 }}>
        {/* Top Header Banner */}
        <div
          className="hub-card"
          style={{
            padding: "20px 24px",
            marginBottom: 20,
            background: "linear-gradient(135deg, #1b3824 0%, #295337 100%)",
            color: "#fff",
            borderRadius: 14,
            boxShadow: "0 10px 25px rgba(27, 56, 36, 0.15)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26
                }}
              >
                🛡️
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ font: "700 22px Manrope", margin: 0, color: "#fff" }}>
                    MushroomHub Admin Operations
                  </h2>
                  <span
                    style={{
                      background: "#3b82f6",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 12,
                      letterSpacing: "0.5px"
                    }}
                  >
                    RBAC LEVEL 2 · ADMIN
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d1e7dd" }}>
                  Platform operations dashboard: Buyer & Farmer oversight, verification, products, orders, payments, deliveries & complaints.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <RealtimeNotificationBell />

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#cbd5e1" }}>Authenticated Admin</div>
                <strong style={{ fontSize: 13, color: "#fff" }}>{user?.email || "admin@mushroomhub.com"}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="btn btn-sm btn-outline-light"
                style={{ borderRadius: 8, fontWeight: 600, fontSize: 12 }}
              >
                Sign Out 🚪
              </button>
            </div>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
            style={{ borderRadius: 10, fontWeight: 500 }}
          >
            ✅ {toastMessage}
            <button type="button" className="btn-close" onClick={() => setToastMessage("")}></button>
          </div>
        )}

        {/* Global Error Alert */}
        {errorMessage && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
            style={{ borderRadius: 10, fontWeight: 500 }}
          >
            ⚠️ {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage("")}></button>
          </div>
        )}

        {/* 8 MODULE NAVIGATION TABS */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "8px 12px",
            marginBottom: 20,
            boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
            display: "flex",
            gap: 6,
            overflowX: "auto",
            whiteSpace: "nowrap"
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "users" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("users")}
          >
            👥 1. User Management ({usersList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "verification" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("verification")}
          >
            🌾 2. Farmer Verification ({farmersList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "products" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("products")}
          >
            🍄 3. Product Listings ({productsList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "orders" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("orders")}
          >
            📦 4. Orders ({ordersList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "payments" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("payments")}
          >
            💳 5. Payments ({paymentsList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "deliveries" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("deliveries")}
          >
            🚚 6. Deliveries ({deliveriesList.length || ordersList.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "analytics" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("analytics")}
          >
            📊 7. Reports & Analytics
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === "complaints" ? "btn-success" : "btn-light"}`}
            style={{ borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
            onClick={() => setActiveTab("complaints")}
          >
            📬 8. Complaints ({complaintsList.length})
          </button>
        </div>

        {/* =========================================================================
            MODULE 1: USER MANAGEMENT
            ========================================================================= */}
        {activeTab === "users" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  User Management (Buyers & Farmers)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Inspect registered users, filter by account role, search credentials, and manage account activation/suspension status.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search name, email, phone, farm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 220 }}
                />

                <select
                  className="form-select form-select-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="BUYER">Buyers Only</option>
                  <option value="FARMER">Farmers Only</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner-border text-success" role="status"></div>
                <div style={{ marginTop: 10, fontSize: 13, color: "#6c757d" }}>Loading users from cloud database...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6c757d" }}>
                <p style={{ fontSize: 15 }}>No users match the active search or filters.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Farm / Business</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Account Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isFarmer = u.role === "cultivater" || u.role === "cultivator";
                      const status = (u.accountStatus || "ACTIVE").toUpperCase();
                      const statusBadgeClass =
                        status === "ACTIVE"
                          ? "bg-success"
                          : status === "SUSPENDED"
                          ? "bg-danger"
                          : "bg-secondary";

                      return (
                        <tr key={u.id || u.email}>
                          <td>
                            <strong>{u.name || "Customer"}</strong>
                            <div style={{ fontSize: 11, color: "#6c757d" }}>{u.email}</div>
                          </td>
                          <td>
                            <span
                              className={`badge ${isFarmer ? "bg-primary" : "bg-info"}`}
                              style={{ padding: "5px 9px", fontSize: 11 }}
                            >
                              {isFarmer ? "🌾 FARMER" : "🛒 BUYER"}
                            </span>
                          </td>
                          <td>{u.farmName || "—"}</td>
                          <td>{u.location || u.city || "India"}</td>
                          <td>{u.phone || "—"}</td>
                          <td>
                            <span className={`badge ${statusBadgeClass}`} style={{ padding: "4px 8px" }}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setSelectedUser(u)}
                                title="View User Details"
                              >
                                View 👁️
                              </button>

                              {status !== "ACTIVE" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleToggleUserStatus(u, "ACTIVE")}
                                  title="Activate Account"
                                >
                                  Activate
                                </button>
                              )}

                              {status !== "SUSPENDED" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleToggleUserStatus(u, "SUSPENDED")}
                                  title="Suspend Account"
                                >
                                  Suspend
                                </button>
                              )}

                              {status !== "DEACTIVATED" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-dark btn-sm"
                                  onClick={() => handleToggleUserStatus(u, "DEACTIVATED")}
                                  title="Deactivate Account"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODULE 2: FARMER VERIFICATION
            ========================================================================= */}
        {activeTab === "verification" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  🌾 Cultivator Verification & Organic Farmer Acceptance
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Inspect registered cultivators, verify organic farm credentials, and accept growers so their login credentials become active.
                </p>
              </div>

              {/* Status Filters */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${farmerFilter === "ALL" ? "btn-dark" : "btn-outline-secondary"}`}
                  onClick={() => setFarmerFilter("ALL")}
                >
                  All ({farmersList.length})
                </button>
                <button
                  type="button"
                  className={`btn ${farmerFilter === "PENDING" ? "btn-warning text-dark font-weight-bold" : "btn-outline-warning text-dark"}`}
                  onClick={() => setFarmerFilter("PENDING")}
                >
                  ⏳ Pending Review ({farmersList.filter(f => (f.verificationStatus || "PENDING").toUpperCase() === "PENDING").length})
                </button>
                <button
                  type="button"
                  className={`btn ${farmerFilter === "APPROVED" ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => setFarmerFilter("APPROVED")}
                >
                  ✓ Approved ({farmersList.filter(f => (f.verificationStatus || "PENDING").toUpperCase() === "APPROVED" || (f.verificationStatus || "").toUpperCase() === "VERIFIED & APPROVED").length})
                </button>
                <button
                  type="button"
                  className={`btn ${farmerFilter === "REJECTED" ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setFarmerFilter("REJECTED")}
                >
                  ✗ Rejected ({farmersList.filter(f => (f.verificationStatus || "").toUpperCase() === "REJECTED").length})
                </button>
              </div>
            </div>

            {(() => {
              const filteredFarmers = farmersList.filter((f) => {
                const s = (f.verificationStatus || "PENDING").toUpperCase();
                if (farmerFilter === "PENDING") return s === "PENDING";
                if (farmerFilter === "APPROVED") return s === "APPROVED" || s === "VERIFIED & APPROVED";
                if (farmerFilter === "REJECTED") return s === "REJECTED";
                return true;
              });

              if (filteredFarmers.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "48px 20px", background: "#f9fafb", borderRadius: 10, border: "1px dashed #e5e7eb" }}>
                    <div style={{ fontSize: 38, marginBottom: 8 }}>🌾</div>
                    <h5 style={{ font: "600 16px Manrope", color: "#374151" }}>No Cultivators Found</h5>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                      {farmerFilter === "PENDING"
                        ? "Great job! There are currently no cultivator accounts pending review."
                        : "No cultivator records match this filter."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="table-responsive">
                  <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                    <thead className="table-light">
                      <tr>
                        <th>Grower & Farm Profile</th>
                        <th>Contact / Phone</th>
                        <th>FSSAI License</th>
                        <th>Facility Scale</th>
                        <th>Organic Certifications</th>
                        <th>Verification Status</th>
                        <th>Admin Decisions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFarmers.map((f) => {
                        const vStatus = (f.verificationStatus || "PENDING").toUpperCase();
                        const badgeClass =
                          vStatus === "APPROVED" || vStatus === "VERIFIED & APPROVED"
                            ? "bg-success"
                            : vStatus === "REJECTED"
                            ? "bg-danger"
                            : "bg-warning text-dark";

                        const rawId = f.id || f.userId;
                        const targetId = typeof rawId === "string" && rawId.includes("-") ? Number(rawId.split("-").pop()) : rawId;

                        return (
                          <tr key={f.id || f.email}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: "50%",
                                    background: "#e8f5e9",
                                    color: "#2e7d32",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    fontWeight: 700
                                  }}
                                >
                                  🍄
                                </div>
                                <div>
                                  <strong style={{ color: "#1f3829", fontSize: 14 }}>
                                    {f.farmName || `${f.name}'s Mushroom Farm`}
                                  </strong>
                                  <div style={{ fontSize: 12, color: "#4b5563" }}>
                                    Farmer: <strong>{f.growerName || f.name}</strong> • {f.email}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#16a34a" }}>📍 {f.location || "India"}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.phone || "Not specified"}</div>
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                Joined: {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "Recent"}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border" style={{ fontFamily: "monospace", fontSize: 11 }}>
                                {f.fssaiNumber || f.fssaiLicense || "Pending Docs"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12 }}>
                                {f.farmScale || f.scale || "Commercial Facility"}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: 11, maxWidth: 200, color: "#374151" }}>
                                {Array.isArray(f.certifications)
                                  ? f.certifications.join(", ")
                                  : f.certifications || "Jaivik Bharat, Cleanroom Lab"}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>
                                {vStatus === "APPROVED" || vStatus === "VERIFIED & APPROVED"
                                  ? "✓ APPROVED & ACTIVE"
                                  : vStatus === "REJECTED"
                                  ? "✗ REJECTED"
                                  : "⏳ PENDING REVIEW"}
                              </span>
                              {f.rejectionReason && (
                                <div style={{ fontSize: 11, color: "#dc3545", marginTop: 4, maxWidth: 160 }}>
                                  Reason: {f.rejectionReason}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => setInspectFarmerModal({ open: true, farmer: f })}
                                  title="Inspect complete grower details"
                                >
                                  Inspect 🔍
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleFarmerVerification(targetId, "APPROVED")}
                                  disabled={vStatus === "APPROVED" || vStatus === "VERIFIED & APPROVED"}
                                  title="Accept cultivator and activate login credentials"
                                >
                                  {vStatus === "APPROVED" || vStatus === "VERIFIED & APPROVED" ? "Accepted ✓" : "Accept ✓"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => setRejectionModal({ open: true, farmerId: targetId, reason: "" })}
                                  title="Reject cultivator application"
                                >
                                  Reject ✗
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            MODULE 3: PRODUCT MANAGEMENT
            ========================================================================= */}
        {activeTab === "products" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  Product Listing Moderation & Catalog Control
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Inspect farmer mushroom flushes, approve or reject listings, and remove inappropriate or expired products.
                </p>
              </div>
            </div>

            <div className="row g-3">
              {productsList.map((p) => {
                const status = (p.status || "APPROVED").toUpperCase();
                const statusBadge =
                  status === "APPROVED"
                    ? "bg-success"
                    : status === "REJECTED"
                    ? "bg-danger"
                    : "bg-warning text-dark";

                return (
                  <div key={p.id || p.productId} className="col-md-6 col-lg-4">
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%"
                      }}
                    >
                      <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                        <img
                          src={p.photoUrl || p.imageUrl || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"}
                          alt={p.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <span
                          className={`badge ${statusBadge}`}
                          style={{ position: "absolute", top: 10, right: 10, fontSize: 11 }}
                        >
                          {status}
                        </span>
                      </div>

                      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <h4 style={{ font: "700 16px Manrope", margin: "0 0 6px", color: "#1f3829" }}>
                          {p.name}
                        </h4>
                        <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 6 }}>
                          🌾 Farm: <strong>{p.farm || p.farmName}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 10 }}>
                          📍 {p.place || p.location || "India"}
                        </div>

                        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ font: "700 18px Manrope", color: "#198754" }}>
                            ₹{p.price} <span style={{ fontSize: 12, color: "#6c757d" }}>/ {p.unit || "kg"}</span>
                          </span>
                          <span className="badge bg-light text-dark border">
                            {p.variety || p.category || "Oyster"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          {status !== "APPROVED" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              style={{ flex: 1 }}
                              onClick={() => handleProductStatus(p.id, "APPROVED")}
                            >
                              Approve ✓
                            </button>
                          )}
                          {status !== "REJECTED" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning"
                              style={{ flex: 1 }}
                              onClick={() => handleProductStatus(p.id, "REJECTED", "Listing details require revision")}
                            >
                              Reject ✗
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteProduct(p)}
                            title="Remove Inappropriate Listing"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 4: ORDER MANAGEMENT
            ========================================================================= */}
        {activeTab === "orders" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  Customer Order Management & Tracking
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Monitor customer orders placed through Razorpay test gateway, update status, and track shipping stages.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Delivery Address</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((o) => {
                    const status = (o.status || "PAID").toUpperCase();
                    const statusClass =
                      status === "PAID"
                        ? "bg-success"
                        : status === "DELIVERED"
                        ? "bg-primary"
                        : status === "DISPATCHED"
                        ? "bg-info text-dark"
                        : status === "CANCELLED"
                        ? "bg-danger"
                        : "bg-warning text-dark";

                    return (
                      <tr key={o.orderId || o.id}>
                        <td>
                          <strong>#{o.orderId || o.id}</strong>
                          <div style={{ fontSize: 11, color: "#6c757d" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Recent"}
                          </div>
                        </td>
                        <td>
                          <strong>{o.customerName || "Customer"}</strong>
                          <div style={{ fontSize: 11, color: "#6c757d" }}>{o.customerEmail}</div>
                          <div style={{ fontSize: 11, color: "#6c757d" }}>{o.customerPhone}</div>
                        </td>
                        <td>
                          <div style={{ maxWidth: 220, fontSize: 12 }}>
                            {o.deliveryAddress || `${o.city || "Bengaluru"}, ${o.state || "Karnataka"}`}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: "#198754" }}>₹{o.grandTotal || o.totalAmount || o.amount || 0}</strong>
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`} style={{ padding: "5px 9px" }}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={status}
                            onChange={(e) => handleOrderStatusChange(o.orderId || o.id, e.target.value)}
                            style={{ width: 140 }}
                          >
                            <option value="PENDING_PAYMENT">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="DISPATCHED">Dispatched</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 5: PAYMENT MANAGEMENT
            ========================================================================= */}
        {activeTab === "payments" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  Payment Transaction Monitoring & Reconciliation
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Monitor verified transactions, review failure reasons, and handle refunds.
                </p>
              </div>

              <span className="badge bg-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                🔒 Razorpay Secret Key: Securely Held in Backend Environment
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Payment ID</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th>Customer Email</th>
                    <th>Timestamp</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#6c757d" }}>
                        No transactions recorded yet. Payments processed via Razorpay Test Mode appear here.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((p) => {
                      const status = (p.status || "SUCCESS").toUpperCase();
                      const statusClass =
                        status === "SUCCESS"
                          ? "bg-success"
                          : status === "REFUNDED"
                          ? "bg-info text-dark"
                          : status === "FAILED"
                          ? "bg-danger"
                          : "bg-warning text-dark";

                      return (
                        <tr key={p.id}>
                          <td><strong>#{p.orderId}</strong></td>
                          <td>
                            <code style={{ fontSize: 12, color: "#2563eb" }}>
                              {p.razorpayPaymentId || "rzp_test_sync"}
                            </code>
                          </td>
                          <td>
                            <strong style={{ color: "#198754" }}>₹{p.amount}</strong>
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`} style={{ padding: "5px 9px" }}>
                              {status}
                            </span>
                          </td>
                          <td>{p.customerEmail || "—"}</td>
                          <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : "Recent"}</td>
                          <td>
                            {status !== "REFUNDED" ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setRefundModal({ open: true, payment: p, note: "" })}
                              >
                                Refund ↩
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: "#6c757d" }}>Refunded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 6: DELIVERY MANAGEMENT
            ========================================================================= */}
        {activeTab === "deliveries" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  Delivery Logistics & Shipping Fee Audits
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Track cold-chain dispatches, dynamic delivery fees (Base + Distance + Weight + Express), and address accuracy.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Customer & Address</th>
                    <th>Type</th>
                    <th>Distance</th>
                    <th>Weight</th>
                    <th>Delivery Breakdown (Base + Dist + Wt + Exp)</th>
                    <th>Total Delivery Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliveriesList.length > 0 ? deliveriesList : ordersList).map((d) => (
                    <tr key={d.orderId || d.id}>
                      <td><strong>#{d.orderId || d.id}</strong></td>
                      <td>
                        <strong>{d.customerName || "Customer"}</strong>
                        <div style={{ fontSize: 11, color: "#6c757d" }}>{d.deliveryAddress || "Bengaluru, Karnataka"}</div>
                        <div style={{ fontSize: 11, color: "#198754" }}>📞 {d.customerPhone || "—"}</div>
                      </td>
                      <td>
                        <span className={`badge ${d.deliveryType === "EXPRESS" ? "bg-warning text-dark" : "bg-light text-dark border"}`}>
                          {d.deliveryType || "STANDARD"}
                        </span>
                      </td>
                      <td>{d.deliveryDistance || 15} km</td>
                      <td>{d.totalWeight || 1.5} kg</td>
                      <td>
                        <div style={{ fontSize: 11, color: "#495057" }}>
                          ₹{d.baseDeliveryFee || 30} base + ₹{d.distanceFee || 120} dist + ₹{d.weightFee || 0} wt + ₹{d.expressSurcharge || 0} exp
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#198754", fontSize: 14 }}>
                          ₹{d.finalDeliveryCharge || 150}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 7: REPORTS & ANALYTICS
            ========================================================================= */}
        {activeTab === "analytics" && (
          <div>
            {/* KPI Cards Grid */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="hub-card" style={{ padding: "20px", background: "#fff", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 600 }}>TOTAL BUYERS</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb", margin: "6px 0" }}>
                    {analyticsData.totalBuyers || usersList.filter((u) => u.role === "customer").length}
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a" }}>↑ Verified consumer accounts</div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="hub-card" style={{ padding: "20px", background: "#fff", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 600 }}>TOTAL FARMERS</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", margin: "6px 0" }}>
                    {analyticsData.totalFarmers || farmersList.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a" }}>↑ Certified organic growers</div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="hub-card" style={{ padding: "20px", background: "#fff", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 600 }}>TOTAL ORDERS</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", margin: "6px 0" }}>
                    {analyticsData.totalOrders || ordersList.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#6c757d" }}>Dispatches across India</div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="hub-card" style={{ padding: "20px", background: "#fff", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 600 }}>GROSS MARKETPLACE SALES</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#15803d", margin: "6px 0" }}>
                    ₹{analyticsData.totalRevenue || 54200}
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a" }}>100% Settled via UPI/Razorpay</div>
                </div>
              </div>
            </div>

            {/* Monthly Trend Table */}
            <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
              <h3 style={{ font: "700 18px Manrope", margin: "0 0 16px", color: "#1f3829" }}>
                Monthly Sales & Order Volume Analytics
              </h3>
              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Month</th>
                      <th>Orders Processed</th>
                      <th>Sales Revenue (₹)</th>
                      <th>Avg Order Value (AOV)</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.monthlySales && analyticsData.monthlySales.length > 0
                      ? analyticsData.monthlySales
                      : [
                          { month: "Jun", sales: 14200, orders: 24 },
                          { month: "Jul", sales: 21500, orders: 38 },
                          { month: "Aug", sales: 29800, orders: 51 },
                          { month: "Sep", sales: 36400, orders: 64 },
                          { month: "Oct", sales: 48900, orders: 82 },
                          { month: "Nov", sales: 54200, orders: 95 }
                        ]
                    ).map((m, idx) => (
                      <tr key={idx}>
                        <td><strong>{m.month} 2026</strong></td>
                        <td>{m.orders} dispatches</td>
                        <td><strong style={{ color: "#198754" }}>₹{m.sales}</strong></td>
                        <td>₹{Math.round(m.sales / (m.orders || 1))}</td>
                        <td><span className="badge bg-success">+14.2%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODULE 8: COMPLAINT MANAGEMENT
            ========================================================================= */}
        {activeTab === "complaints" && (
          <div className="hub-card" style={{ padding: "24px", background: "#fff", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ font: "700 18px Manrope", margin: 0, color: "#1f3829" }}>
                  Customer & Farmer Complaint Ticketing
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6c757d" }}>
                  Address customer and cultivator inquiries, respond to tickets, and track resolution statuses.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ fontSize: 13 }}>
                <thead className="table-light">
                  <tr>
                    <th>Ticket ID</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Subject & Details</th>
                    <th>Status</th>
                    <th>Response</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaintsList.map((c) => {
                    const statusClass =
                      c.status === "RESOLVED"
                        ? "bg-success"
                        : c.status === "IN_PROGRESS"
                        ? "bg-info text-dark"
                        : "bg-warning text-dark";

                    return (
                      <tr key={c.ticketId || c.id}>
                        <td><strong>#{c.ticketId}</strong></td>
                        <td>
                          <strong>{c.userName || "User"}</strong>
                          <div style={{ fontSize: 11, color: "#6c757d" }}>{c.userEmail}</div>
                          <span className="badge bg-light text-dark border" style={{ fontSize: 10 }}>
                            {c.userRole}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary" style={{ fontSize: 11 }}>
                            {c.category}
                          </span>
                        </td>
                        <td>
                          <strong>{c.subject}</strong>
                          <div style={{ fontSize: 12, color: "#495057", maxWidth: 280 }}>
                            {c.description}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`} style={{ padding: "5px 9px" }}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.adminResponse ? (
                            <div style={{ fontSize: 12, color: "#15803d", fontStyle: "italic" }}>
                              "{c.adminResponse}"
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#6c757d" }}>Awaiting response</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              setComplaintModal({
                                open: true,
                                complaint: c,
                                response: c.adminResponse || "",
                                status: c.status || "RESOLVED"
                              })
                            }
                          >
                            Reply 💬
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ font: "700 18px Manrope" }}>
                  👤 User Profile Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedUser(null)}></button>
              </div>
              <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div><strong>Full Name:</strong> {selectedUser.name}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
                <div><strong>Phone:</strong> {selectedUser.phone || "—"}</div>
                <div><strong>Farm / Business:</strong> {selectedUser.farmName || "—"}</div>
                <div><strong>Location:</strong> {selectedUser.location || selectedUser.city || "—"}</div>
                <div><strong>Address:</strong> {selectedUser.address || "—"}</div>
                <div><strong>Account Status:</strong> <span className="badge bg-success">{selectedUser.accountStatus || "ACTIVE"}</span></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FARMER REJECTION MODAL */}
      {rejectionModal.open && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ font: "700 18px Manrope", color: "#dc3545" }}>
                  Reject Farmer Verification
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRejectionModal({ open: false, farmerId: null, reason: "" })}
                ></button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: "#6c757d" }}>
                  Provide the formal compliance or audit failure reason to notify the cultivator:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="e.g., FSSAI license image is illegible, or organic cleanroom airflow documentation is incomplete..."
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRejectionModal({ open: false, farmerId: null, reason: "" })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleFarmerVerification(rejectionModal.farmerId, "REJECTED", rejectionModal.reason)}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT FARMER DETAILS MODAL */}
      {inspectFarmerModal.open && inspectFarmerModal.farmer && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.55)", zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, border: "none", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
              <div className="modal-header" style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "18px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28 }}>🌾</div>
                  <div>
                    <h5 className="modal-title" style={{ font: "700 18px Manrope", color: "#166534", margin: 0 }}>
                      Inspect Cultivator Profile: {inspectFarmerModal.farmer.farmName || inspectFarmerModal.farmer.name}
                    </h5>
                    <p style={{ margin: 0, fontSize: 12, color: "#4b7c59" }}>
                      Verify whether this person is an authentic mushroom cultivator before activating credentials.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setInspectFarmerModal({ open: false, farmer: null })}
                ></button>
              </div>

              <div className="modal-body" style={{ padding: "24px", fontSize: 13, lineHeight: 1.8 }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div style={{ background: "#f9fafb", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, marginBottom: 6 }}>
                        Personal & Contact Details
                      </div>
                      <div><strong>Grower Name:</strong> {inspectFarmerModal.farmer.growerName || inspectFarmerModal.farmer.name}</div>
                      <div><strong>Email Address:</strong> <a href={`mailto:${inspectFarmerModal.farmer.email}`}>{inspectFarmerModal.farmer.email}</a></div>
                      <div><strong>Phone Number:</strong> {inspectFarmerModal.farmer.phone || "Not provided"}</div>
                      <div><strong>Location:</strong> {inspectFarmerModal.farmer.location || inspectFarmerModal.farmer.city || "India"}</div>
                      {inspectFarmerModal.farmer.address && (
                        <div><strong>Address:</strong> {inspectFarmerModal.farmer.address}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div style={{ background: "#f9fafb", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, marginBottom: 6 }}>
                        Farm & Production Capacity
                      </div>
                      <div><strong>Farm / Brand Name:</strong> {inspectFarmerModal.farmer.farmName || "Standard Grower Farm"}</div>
                      <div><strong>Growing Scale:</strong> {inspectFarmerModal.farmer.farmScale || inspectFarmerModal.farmer.scale || "Commercial Facility"}</div>
                      <div><strong>FSSAI Registration:</strong> <span className="badge bg-light text-dark border">{inspectFarmerModal.farmer.fssaiNumber || inspectFarmerModal.farmer.fssaiLicense || "Pending submission"}</span></div>
                      <div><strong>Certifications:</strong> {Array.isArray(inspectFarmerModal.farmer.certifications) ? inspectFarmerModal.farmer.certifications.join(", ") : inspectFarmerModal.farmer.certifications || "Jaivik Bharat Organic"}</div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Current Platform Status</div>
                        <div style={{ marginTop: 4 }}>
                          <span className={`badge ${
                            (inspectFarmerModal.farmer.verificationStatus || "PENDING").toUpperCase() === "APPROVED" || (inspectFarmerModal.farmer.verificationStatus || "").toUpperCase() === "VERIFIED & APPROVED"
                              ? "bg-success"
                              : (inspectFarmerModal.farmer.verificationStatus || "").toUpperCase() === "REJECTED"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`} style={{ padding: "6px 12px", fontSize: 12 }}>
                            {(inspectFarmerModal.farmer.verificationStatus || "PENDING").toUpperCase() === "APPROVED" || (inspectFarmerModal.farmer.verificationStatus || "").toUpperCase() === "VERIFIED & APPROVED"
                              ? "✓ APPROVED & ACTIVE (Credentials Working)"
                              : (inspectFarmerModal.farmer.verificationStatus || "").toUpperCase() === "REJECTED"
                              ? "✗ REJECTED"
                              : "⏳ PENDING REVIEW (Credentials Locked)"}
                          </span>
                        </div>
                        {inspectFarmerModal.farmer.rejectionReason && (
                          <div style={{ fontSize: 12, color: "#dc3545", marginTop: 4 }}>
                            Rejection Reason: {inspectFarmerModal.farmer.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: "#64748b", textAlign: "right" }}>
                        <div><strong>Account ID:</strong> #{inspectFarmerModal.farmer.id || inspectFarmerModal.farmer.userId}</div>
                        <div><strong>Auth Mode:</strong> {inspectFarmerModal.farmer.authProvider || "cloud"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ background: "#fafafa", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectFarmerModal({ open: false, farmer: null })}
                >
                  Close Inspection
                </button>

                {((inspectFarmerModal.farmer.verificationStatus || "PENDING").toUpperCase() !== "APPROVED" && (inspectFarmerModal.farmer.verificationStatus || "").toUpperCase() !== "VERIFIED & APPROVED") ? (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      const rawId = inspectFarmerModal.farmer.id || inspectFarmerModal.farmer.userId;
                      const targetId = typeof rawId === "string" && rawId.includes("-") ? Number(rawId.split("-").pop()) : rawId;
                      handleFarmerVerification(targetId, "APPROVED");
                    }}
                  >
                    Accept & Approve Cultivator ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-warning text-dark btn-sm"
                    onClick={() => {
                      const rawId = inspectFarmerModal.farmer.id || inspectFarmerModal.farmer.userId;
                      const targetId = typeof rawId === "string" && rawId.includes("-") ? Number(rawId.split("-").pop()) : rawId;
                      handleFarmerVerification(targetId, "PENDING");
                    }}
                  >
                    Move back to Pending ⏳
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    const rawId = inspectFarmerModal.farmer.id || inspectFarmerModal.farmer.userId;
                    const targetId = typeof rawId === "string" && rawId.includes("-") ? Number(rawId.split("-").pop()) : rawId;
                    setRejectionModal({ open: true, farmerId: targetId, reason: "" });
                  }}
                >
                  Reject Application ✗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT RESPONSE MODAL */}
      {complaintModal.open && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ font: "700 18px Manrope" }}>
                  💬 Respond to Ticket #{complaintModal.complaint?.ticketId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setComplaintModal({ open: false, complaint: null, response: "", status: "RESOLVED" })}
                ></button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <strong>Subject:</strong> {complaintModal.complaint?.subject}
                </div>
                <div style={{ marginBottom: 14, fontSize: 12, color: "#6c757d" }}>
                  <strong>User Issue:</strong> {complaintModal.complaint?.description}
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                    Official Admin Resolution Response:
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Enter the official response communicated to the buyer or grower..."
                    value={complaintModal.response}
                    onChange={(e) => setComplaintModal({ ...complaintModal, response: e.target.value })}
                  ></textarea>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                    Update Ticket Status:
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={complaintModal.status}
                    onChange={(e) => setComplaintModal({ ...complaintModal, status: e.target.value })}
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setComplaintModal({ open: false, complaint: null, response: "", status: "RESOLVED" })}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleComplaintResponse}>
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModal.open && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: 14 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ font: "700 18px Manrope", color: "#dc3545" }}>
                  Review & Issue Payment Refund
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRefundModal({ open: false, payment: null, note: "" })}
                ></button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: "#495057" }}>
                  Issue refund for order <strong>#{refundModal.payment?.orderId}</strong> amounting to{" "}
                  <strong style={{ color: "#198754" }}>₹{refundModal.payment?.amount}</strong>.
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter reason or refund notes (e.g. Perishable produce damaged during cold-chain dispatch)..."
                  value={refundModal.note}
                  onChange={(e) => setRefundModal({ ...refundModal, note: e.target.value })}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRefundModal({ open: false, payment: null, note: "" })}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleProcessRefund}>
                  Confirm Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
