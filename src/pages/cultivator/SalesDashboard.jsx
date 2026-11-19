import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSalesData } from "../../data/store";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState(() => getSalesData(user));
  const [timeFilter, setTimeFilter] = useState("All Time");

  const refreshSales = useCallback(() => {
    setSalesData(getSalesData(user));
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSales();
  }, [refreshSales]);

  useEffect(() => {
    const handleUpdate = () => refreshSales();
    const handleStorageChange = (e) => {
      if (e.key === "mushroomhub_sales_ledger") {
        refreshSales();
      }
    };

    window.addEventListener("cultivator-sales-updated", handleUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cultivator-sales-updated", handleUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshSales]);

  const totalEarnings = salesData.totalEarnings || 1;

  return (
    <div>
      {/* Top Controls / Simulation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ font: "700 20px Manrope", color: "#1d3626", margin: "0 0 2px" }}>
            Cultivator Sales & Revenue Dashboard (INR ₹)
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#6a7767" }}>
            Total harvest earnings, category-by-category revenue, and direct customer settlement logs.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="form-control"
            style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Week">This Week</option>
          </select>

          <div className="live-sync-pill" style={{ background: "#edf7ec", padding: "6px 14px", borderRadius: 20, fontSize: 12, color: "#2b5633", fontWeight: 600 }}>
            <span className="pulse-dot"></span>
            <span>Live Sales Sync Active</span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards in INR (₹) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Earned</div>
          <div className="kpi-val" style={{ color: "#1f4b2a" }}>
            ₹{salesData.totalEarnings.toLocaleString("en-IN")}
          </div>
          <div className="kpi-sub">↑ +18.4% growth this month</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Completed Sales</div>
          <div className="kpi-val">{salesData.totalSalesCount} Orders</div>
          <div className="kpi-sub">100% direct bank settled</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Harvest Volume Sold</div>
          <div className="kpi-val">{salesData.totalVolumeSold} kg</div>
          <div className="kpi-sub">Fresh farm harvest output</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average Order Value</div>
          <div className="kpi-val">
            ₹{salesData.totalSalesCount > 0 ? Math.round(salesData.totalEarnings / salesData.totalSalesCount).toLocaleString("en-IN") : "0"}
          </div>
          <div className="kpi-sub">Across wholesale & restaurants</div>
        </div>
      </div>

      {/* Sales Done in Different Categories in INR (₹) */}
      <div className="hub-card">
        <div className="hub-card-header">
          <div>
            <h2>Sales Breakdown by Mushroom Category (INR ₹)</h2>
            <p>Direct view of how much you earned in each category: Oyster, Shiitake, Specialty, and Medicinal.</p>
          </div>
          <span className="role-badge-pill" style={{ background: "#edf5ea", color: "#2d6037" }}>
            {salesData.categoryBreakdown.length} Active Categories
          </span>
        </div>

        <div className="cat-breakdown-grid">
          {salesData.categoryBreakdown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 18px", color: "#6a7767", fontSize: 13, gridColumn: "1 / -1" }}>
              🌱 No category revenue recorded yet. As customers order different mushroom varieties, category analytics will graph automatically.
            </div>
          ) : (
            salesData.categoryBreakdown.map((cat) => {
              const percent = Math.round((cat.revenue / totalEarnings) * 100);
              return (
                <div key={cat.category} className="cat-breakdown-card">
                  <div className="cat-header">
                    <span>{cat.category} Varieties</span>
                    <span className="status-badge paid">{cat.orders} Orders</span>
                  </div>

                  <div className="cat-amount" style={{ color: "#1b4426" }}>
                    ₹{cat.revenue.toLocaleString("en-IN")}
                  </div>

                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  <div className="cat-sub">
                    <span>{cat.volume} kg harvested & sold</span>
                    <strong>{percent}% of farm revenue</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Customer Sales Transactions */}
      <div className="hub-card">
        <div className="hub-card-header">
          <div>
            <h2>Recent Customer Transactions & Orders Ledger</h2>
            <p>Live chronological ledger of customer orders, quantities, and direct payment receipts in ₹.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer / Buyer</th>
                <th>Mushroom Variety</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Rate (₹)</th>
                <th>Total Earned (₹)</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.ledger.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "36px 18px", color: "#6a7767" }}>
                    📦 No customer orders recorded yet. Orders placed by customers in their customer account will automatically record here in real-time.
                  </td>
                </tr>
              ) : (
                salesData.ledger.map((tx) => (
                  <tr key={tx.orderId}>
                    <td><strong>{tx.orderId}</strong></td>
                    <td>{tx.customerName}</td>
                    <td>{tx.variety}</td>
                    <td>
                      <span className="status-badge paid" style={{ fontSize: 10 }}>{tx.category}</span>
                    </td>
                    <td>{tx.quantity} {tx.unit}</td>
                    <td>₹{tx.unitPrice}</td>
                    <td><strong style={{ color: "#22592f" }}>₹{tx.total.toLocaleString("en-IN")}</strong></td>
                    <td style={{ fontSize: 11, color: "#6a7569" }}>{tx.date}</td>
                    <td>
                      <span className="status-badge paid">✓ {tx.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
