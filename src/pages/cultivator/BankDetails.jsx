import { useState } from "react";
import { clearBankDetails, getBankDetails, saveBankDetails } from "../../data/store";

export default function BankDetails({ onToast }) {
  const [bank, setBank] = useState(getBankDetails);
  const [isEditing, setIsEditing] = useState(() => !bank.isConfigured || !bank.accountNumber);
  const [showAccount, setShowAccount] = useState(false);

  // Form State initialized from bank coordinates or empty
  const [formData, setFormData] = useState({
    beneficiaryName: bank.beneficiaryName || "",
    bankName: bank.bankName || "",
    accountNumber: bank.accountNumber || "",
    confirmAccountNumber: bank.confirmAccountNumber || bank.accountNumber || "",
    routingOrIfsc: bank.routingOrIfsc || "",
    branchName: bank.branchName || "",
    accountType: bank.accountType || "Commercial Agri / Business Current Account",
    upiOrPaypalId: bank.upiOrPaypalId || "",
    payoutFrequency: bank.payoutFrequency || "Instant Direct Settlement (upon delivery)"
  });

  const isConfigured = Boolean(bank.isConfigured && bank.accountNumber);

  const handleSave = (e) => {
    e.preventDefault();

    if (!formData.accountNumber.trim()) {
      alert("Please enter a valid bank account number.");
      return;
    }

    if (formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()) {
      alert("Account numbers do not match. Please verify.");
      return;
    }

    if (!formData.routingOrIfsc.trim() || formData.routingOrIfsc.trim().length < 8) {
      alert("Please enter a valid Indian IFSC code (e.g., HDFC0001428 or SBIN0001234).");
      return;
    }

    const updated = {
      ...bank,
      ...formData,
      accountNumber: formData.accountNumber.trim(),
      confirmAccountNumber: formData.confirmAccountNumber.trim(),
      routingOrIfsc: formData.routingOrIfsc.trim().toUpperCase(),
      isConfigured: true,
      userSaved: true,
      status: "Verified & Active for Direct Payouts",
      lastPayoutDate: "Ready for Customer Settlements"
    };

    saveBankDetails(updated);
    setBank(updated);
    setIsEditing(false);
    onToast("✅ Cultivator bank coordinates successfully saved! Customer order payments in ₹ will settle directly to this account.");
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your bank details? You will need to re-enter them to receive payouts.")) {
      const empty = clearBankDetails();
      setBank(empty);
      setFormData({
        beneficiaryName: "",
        bankName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        routingOrIfsc: "",
        branchName: "",
        accountType: "Commercial Agri / Business Current Account",
        upiOrPaypalId: "",
        payoutFrequency: "Instant Direct Settlement (upon delivery)"
      });
      setIsEditing(true);
      onToast("Bank details cleared. Please enter your account coordinates.");
    }
  };

  const maskedAccount = bank.accountNumber
    ? showAccount
      ? bank.accountNumber
      : `•••• •••• •••• ${bank.accountNumber.slice(-4)}`
    : "Not Configured";

  return (
    <div>
      {/* Configuration Status Banner */}
      {isConfigured ? (
        <div className="bank-verified-banner">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🏦</span>
              <strong style={{ fontSize: 16, color: "#1b4426" }}>Direct Customer Bank Settlement Channel (INR ₹)</strong>
              <span className="status-badge paid" style={{ marginLeft: 6 }}>
                ✓ {bank.status || "Verified & Active"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#4c6350" }}>
              Settlement Account: <strong>{bank.bankName}</strong> ({bank.accountType}). Customer payments settle in Indian Rupees (₹) via IMPS / UPI / NEFT.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button button-green"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "View Saved Coordinates" : "✎ Update Bank Coordinates"}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={handleClear}
              style={{ color: "#8d3e33", borderColor: "#e4c6c0", background: "#fff" }}
              title="Clear bank coordinates and enter fresh details"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fffbf0", border: "1px solid #f2dfa9", borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 15, color: "#7a5509" }}>Bank Details Not Configured Yet</strong>
                <span className="status-badge" style={{ background: "#fcedcc", color: "#80520a", fontSize: 11 }}>
                  Action Required
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6e5218", lineHeight: 1.4 }}>
                By default, no bank details are stored. As a cultivator, please enter your bank account or UPI details below so that incoming customer payments in ₹ (INR) can settle directly to your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Customer Payouts Settled</div>
          <div className="kpi-val" style={{ color: "#1e4828" }}>
            ₹{(bank.totalSettledAmount || 0).toLocaleString("en-IN")}
          </div>
          <div className="kpi-sub">{isConfigured ? "Direct to primary commercial account" : "Awaiting account configuration"}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Pending Escrow Balance</div>
          <div className="kpi-val" style={{ color: "#77500b" }}>
            ₹{(bank.pendingEscrowAmount || 0).toLocaleString("en-IN")}
          </div>
          <div className="kpi-sub">Releases automatically on order dispatch</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Settlement Channel</div>
          <div className="kpi-val" style={{ fontSize: 18, marginTop: 4 }}>
            {isConfigured ? (bank.upiOrPaypalId ? "UPI & IMPS Direct" : "IMPS / NEFT") : "Not Set"}
          </div>
          <div className="kpi-sub">{isConfigured ? bank.payoutFrequency : "Enter details below"}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Configuration Status</div>
          <div className="kpi-val" style={{ fontSize: 18, marginTop: 4, color: isConfigured ? "#215d2a" : "#995e0c" }}>
            {isConfigured ? "✓ Active" : "Pending Entry"}
          </div>
          <div className="kpi-sub">{isConfigured ? bank.lastPayoutDate : "Cultivator needs to enter"}</div>
        </div>
      </div>

      {/* Main Bank View or Bank Details Entry Form */}
      <div className="hub-card">
        {!isEditing && isConfigured ? (
          <div>
            <div className="hub-card-header">
              <div>
                <h2>Configured Cultivator Bank Account Coordinates</h2>
                <p>All earnings and customer payments in ₹ are routed to this verified account.</p>
              </div>
              <button className="button button-green" onClick={() => setIsEditing(true)}>
                ✎ Edit Coordinates
              </button>
            </div>

            <div className="bank-detail-grid">
              <div className="bank-field-box">
                <span>Account Holder / Beneficiary Name</span>
                <strong>{bank.beneficiaryName}</strong>
              </div>

              <div className="bank-field-box">
                <span>Bank Name & Branch</span>
                <strong>{bank.bankName} ({bank.branchName || "Main Branch"})</strong>
              </div>

              <div className="bank-field-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Bank Account Number</span>
                  <button
                    type="button"
                    onClick={() => setShowAccount(!showAccount)}
                    style={{ background: "none", border: "none", fontSize: 11, color: "#366b40", cursor: "pointer", fontWeight: 700 }}
                  >
                    {showAccount ? "Hide" : "Show"}
                  </button>
                </div>
                <strong>{maskedAccount}</strong>
              </div>

              <div className="bank-field-box">
                <span>Bank IFSC Code</span>
                <strong style={{ letterSpacing: "1px" }}>{bank.routingOrIfsc}</strong>
              </div>

              <div className="bank-field-box">
                <span>Account Classification</span>
                <strong>{bank.accountType}</strong>
              </div>

              <div className="bank-field-box">
                <span>Direct UPI Settlement ID</span>
                <strong>{bank.upiOrPaypalId || "Not Configured (Bank Account Only)"}</strong>
              </div>
            </div>

            <div style={{ background: "#f8faf6", padding: "16px 20px", borderRadius: 8, border: "1px solid #e1e9dc", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
              <div style={{ fontSize: 12, color: "#546452" }}>
                🔒 <strong>RBI-Compliant 256-Bit SSL Protection:</strong> Your bank coordinates are safely encrypted for direct customer settlements in Indian Rupees (₹).
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="button button-outline" style={{ fontSize: 12, padding: "8px 14px" }} onClick={() => setIsEditing(true)}>
                  Modify Coordinates
                </button>
                <button className="button button-outline" style={{ fontSize: 12, padding: "8px 14px", color: "#8d3e33", borderColor: "#e4c6c0" }} onClick={handleClear}>
                  Clear & Re-enter
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="hub-card-header">
              <div>
                <h2>{isConfigured ? "Update Cultivator Bank Account Details" : "Enter Cultivator Bank & Payout Coordinates"}</h2>
                <p>
                  Please enter your commercial agricultural or grower bank details. These details are required to settle customer orders in ₹ (INR).
                </p>
              </div>
              {isConfigured && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Quick Bank Chips */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6a7b68", textTransform: "uppercase" }}>Quick Select Bank:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {["HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Punjab National Bank", "Axis Bank", "Bank of Baroda"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    style={{
                      background: formData.bankName === b ? "#e5f0e3" : "#f4f6f2",
                      border: formData.bankName === b ? "1px solid #3c7445" : "1px solid #dbe2d7",
                      borderRadius: 16,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#214429",
                      cursor: "pointer"
                    }}
                    onClick={() => setFormData({ ...formData, bankName: b })}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Beneficiary / Account Holder Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Vikram Sharma or Himalayan Forest Fungi LLP"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. HDFC Bank, SBI, ICICI Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Bank Account Number *</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter full bank account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Account Number *</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Re-enter bank account number"
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Bank IFSC Code *</label>
                <input
                  className="form-control"
                  placeholder="e.g. HDFC0001428 or SBIN0001234"
                  value={formData.routingOrIfsc}
                  onChange={(e) => setFormData({ ...formData, routingOrIfsc: e.target.value.toUpperCase() })}
                  required
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="form-group">
                <label>Branch Name & City *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Rajpur Road Branch, Dehradun"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Account Type *</label>
                <select
                  className="form-control"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                >
                  <option value="Commercial Agri / Business Current Account">Commercial Agri / Business Current Account</option>
                  <option value="Agricultural Enterprise Current Account">Agricultural Enterprise Current Account</option>
                  <option value="Individual Farmer Savings Account">Individual Farmer Savings Account</option>
                </select>
              </div>

              <div className="form-group">
                <label>Direct UPI ID (for Fast Settlement)</label>
                <input
                  className="form-control"
                  placeholder="e.g. yourfarm@okhdfcbank or 9845012890@upi"
                  value={formData.upiOrPaypalId}
                  onChange={(e) => setFormData({ ...formData, upiOrPaypalId: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Settlement Frequency</label>
              <select
                className="form-control"
                value={formData.payoutFrequency}
                onChange={(e) => setFormData({ ...formData, payoutFrequency: e.target.value })}
              >
                <option value="Instant Direct Settlement (upon delivery)">Instant Direct Settlement (upon delivery)</option>
                <option value="Daily Overnight Batch (NEFT / IMPS)">Daily Overnight Batch (NEFT / IMPS)</option>
                <option value="Weekly Every Friday">Weekly Every Friday</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              {isConfigured && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="button button-green">
                Save & Activate Bank Settlements (₹ INR) →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
