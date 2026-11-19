import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getRolePortalPath, useAuth } from "../context/AuthContext";
import { getRegisteredUsers, SYSTEM_ROLES, updateUserPassword } from "../data/store";
import { resetPasswordWithCloud, sendForgotPasswordOtp, verifyResetOtp } from "../services/cloudAuth";

export default function Login() {
  const { role: urlRole } = useParams();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const navigate = useNavigate();
  const { loginWithCredentials, user } = useAuth();

  const getDestination = (defaultPath) => {
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      redirectParam !== "/" &&
      !redirectParam.startsWith("/login") &&
      !redirectParam.startsWith("/signup") &&
      !redirectParam.startsWith("/join")
    ) {
      return redirectParam;
    }
    return defaultPath;
  };

  const normalizeRole = (r) => {
    if (!r) return null;
    const low = r.toLowerCase();
    if (low === "cultivator") return "cultivater";
    return SYSTEM_ROLES.some((item) => item.id === low) ? low : null;
  };

  const initialRole = normalizeRole(urlRole) || "cultivater";
  const [selectedRole, setSelectedRole] = useState(initialRole);
  // If url specifies a role (e.g. /login/customer), go straight to login card. Otherwise start at select.
  const [step, setStep] = useState(urlRole ? "login" : "select");

  const getInitialEmail = (role) => {
    const norm = (role || "").toLowerCase().trim();
    if (norm === "admin") return "admin@mushroomhub.com";
    if (norm === "superadmin") return "superadmin@mushroomhub.com";
    return "";
  };

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState(() => getInitialEmail(initialRole));
  const [loginPassword, setLoginPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password & Brevo OTP State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("request"); // "request" | "verify" | "success"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotTestOtp, setForgotTestOtp] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlRole) {
        const normalized = normalizeRole(urlRole);
        if (normalized) {
          setSelectedRole(normalized);
          setLoginEmail(getInitialEmail(normalized));
          setLoginPassword("");
          setStep("login");
        }
      } else {
        setStep("select");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [urlRole]);

  // If user is already authenticated, redirect to their role portal
  if (user?.isLoggedIn && user?.role) {
    const portal = getRolePortalPath(user);
    if (portal) {
      return <Navigate to={getDestination(portal)} replace />;
    }
  }

  const handleRoleSelect = (newRole) => {
    const normalized = normalizeRole(newRole) || newRole;
    setSelectedRole(normalized);
    setLoginEmail(getInitialEmail(normalized));
    setLoginPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleContinue = (roleToUse = selectedRole) => {
    const target = roleToUse || selectedRole;
    setSelectedRole(target);
    setLoginEmail(getInitialEmail(target));
    setLoginPassword("");
    setErrorMessage("");
    setSuccessMessage("");
    setStep("login");
    const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
    navigate(`/login/${target}${redirectQuery}`);
  };

  const handleBackToSelect = () => {
    setStep("select");
    setErrorMessage("");
    setSuccessMessage("");
    const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
    navigate(`/login${redirectQuery}`);
  };

  const activeRoleObj = SYSTEM_ROLES.find((r) => r.id === selectedRole) || SYSTEM_ROLES[0];

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const res = await loginWithCredentials(selectedRole, loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage("✅ Credentials verified in Cloud Database! Redirecting...");
        const targetPortal = res.portalPath || getRolePortalPath(res.user) || "/portal/cultivator";
        setTimeout(() => {
          navigate(getDestination(targetPortal), { replace: true });
        }, 350);
      } else {
        setErrorMessage(res.error || "Login failed. Please verify credentials or create an account.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred while verifying credentials. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Fast 1-click demo login
  const handleQuickDemo = async (roleId) => {
    const roleUsers = getRegisteredUsers().filter((u) => u.role === roleId);
    const targetUser = roleUsers[0] || { email: `${roleId}@mushroomhub.com`, password: "password123" };
    const res = await loginWithCredentials(roleId, targetUser.email, targetUser.password || "password123");
    if (res.success) {
      navigate(getDestination(res.portalPath), { replace: true });
    }
  };

  const handleOpenForgotPassword = () => {
    setForgotEmail(loginEmail || "");
    setForgotStep("request");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
    setForgotTestOtp("");
    setForgotModalOpen(true);
  };

  const handleSendForgotPasswordOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setForgotError("Please enter a valid Gmail / Email address.");
      return;
    }

    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const res = await sendForgotPasswordOtp(forgotEmail.trim(), selectedRole);
      if (res.success) {
        setForgotStep("verify");
        setForgotSuccess(res.message || "Verification code dispatched to your Gmail via Brevo!");
        if (res.testOtp) {
          setForgotTestOtp(res.testOtp);
        }
        setOtpCountdown(60);
      } else {
        setForgotError(res.error || "Failed to dispatch verification code. Please try again.");
      }
    } catch (err) {
      setForgotError("Network error sending OTP via Brevo: " + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError("Please enter the complete 6-digit OTP received in your Gmail.");
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.trim().length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setForgotLoading(true);

    try {
      // 1. Verify OTP code
      const vRes = await verifyResetOtp(forgotEmail.trim(), forgotOtp.trim());
      if (!vRes.success) {
        setForgotError(vRes.error || "Invalid verification code. Please check your Gmail or request a new code.");
        setForgotLoading(false);
        return;
      }

      // 2. Reset password on Spring Boot backend (PostgreSQL)
      await resetPasswordWithCloud(forgotEmail.trim(), selectedRole, forgotOtp.trim(), forgotNewPassword.trim());

      // 3. Also update in local storage store for offline resilience
      updateUserPassword(selectedRole, forgotEmail.trim(), forgotNewPassword.trim());

      setForgotStep("success");
      setForgotSuccess("🎉 Password reset successfully! Your new password is now active in database.");
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(forgotNewPassword.trim());
    } catch (err) {
      setForgotError("Failed to update password: " + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ background: "#fbfbfa", minHeight: "calc(100vh - 140px)", padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: 1060 }}>
        {step === "select" ? (
          <div>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p className="eyebrow" style={{ color: "#45764b" }}>MushroomHub Account Gateways</p>
              <h1 style={{ font: "700 clamp(30px, 4vw, 42px) var(--serif)", color: "#1f3829", margin: "0 0 10px" }}>
                Select Your Account to Continue
              </h1>
              <p style={{ color: "#687566", fontSize: 15, maxWidth: 680, margin: "auto" }}>
                Select your account workspace below and continue to log in. Need a new account?{" "}
                <Link
                  to={`/signup${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                  style={{ color: "#255c2f", fontWeight: 700, textDecoration: "underline" }}
                >
                  Join MushroomHub & create account →
                </Link>
              </p>
            </div>

            {/* 6 Account Role Selector Cards */}
            <div className="login-roles-grid" style={{ marginBottom: 28 }}>
              {SYSTEM_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <div
                    key={role.id}
                    className={`role-card-select ${isSelected ? "selected" : ""}`}
                    style={{
                      cursor: "pointer",
                      border: isSelected ? "2.5px solid var(--green)" : "1px solid #dce5d8",
                      boxShadow: isSelected ? "0 8px 24px rgba(43, 104, 56, 0.16)" : "0 2px 8px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column"
                    }}
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span className="role-icon-lg">{role.icon}</span>
                      <span className="role-card-badge" style={{ color: role.color, fontWeight: 700 }}>
                        {role.badge}
                      </span>
                    </div>

                    <h3 style={{ margin: "4px 0 6px", fontSize: 17 }}>{role.name} Account</h3>
                    <p style={{ fontSize: 12, color: "#60715f", lineHeight: 1.45, margin: "0 0 16px", flex: 1 }}>
                      {role.description}
                    </p>

                    <button
                      type="button"
                      className="button"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        fontSize: 12,
                        padding: "9px 12px",
                        fontWeight: 700,
                        background: isSelected ? "var(--green)" : "#f0f6ee",
                        color: isSelected ? "#ffffff" : "#24522c",
                        border: isSelected ? "none" : "1px solid #cce0ca"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinue(role.id);
                      }}
                    >
                      {isSelected ? "Continue to Log In →" : `Select & Continue →`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Account Continue Action Bar */}
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #c8dec4",
                borderRadius: 14,
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 10px 30px rgba(35, 75, 45, 0.08)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 34 }}>{activeRoleObj.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 16, color: "#1f3829" }}>{activeRoleObj.name} Account Selected</strong>
                    <span className="status-badge paid" style={{ fontSize: 11 }}>{activeRoleObj.badge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#60715f", marginTop: 2 }}>
                    {activeRoleObj.description}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="button button-green"
                style={{ padding: "12px 28px", fontSize: 14, fontWeight: 700 }}
                onClick={() => handleContinue(selectedRole)}
              >
                Continue to {activeRoleObj.name} Log In →
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: DEDICATED LOGIN CARD ONLY (NO JUNK OR BULKY CREATION SECTION BELOW) */
          <div style={{ maxWidth: 520, margin: "auto" }}>
            {/* Top Navigation: Back to Account Selector */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button
                type="button"
                onClick={handleBackToSelect}
                className="button button-outline"
                style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span>←</span> Change Account
              </button>
              <span style={{ fontSize: 12, color: "#60715f" }}>
                Active: <strong>{activeRoleObj.icon} {activeRoleObj.name}</strong>
              </span>
            </div>

            <div className="hub-card" style={{ boxShadow: "0 16px 45px rgba(25, 45, 30, 0.1)" }}>
              {/* Header Banner */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 44 }}>{activeRoleObj.icon}</span>
                <h2 style={{ font: "700 26px var(--serif)", color: "#1f3829", margin: "8px 0 4px" }}>
                  Log In to {activeRoleObj.name}
                </h2>
                <span className="status-badge paid">{activeRoleObj.badge} Portal</span>
                <p style={{ fontSize: 12, color: "#60715f", margin: "8px 0 0" }}>
                  {activeRoleObj.description}
                </p>
              </div>

              {/* Feedback Alerts */}
              {searchParams.get("pending") === "1" && !errorMessage && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "12px 14px", borderRadius: 8, fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⏳</span> Account Verification Pending Admin Review
                  </div>
                  Your Cultivator registration has been received! As per quality standards, an Administrator must review and approve your grower profile before you can log in. Once accepted, your credentials will become active.
                </div>
              )}

              {errorMessage && (
                <div style={{ background: errorMessage.includes("Pending") ? "#fffbeb" : "#fdf2f0", border: `1px solid ${errorMessage.includes("Pending") ? "#fde68a" : "#f3c9c2"}`, color: errorMessage.includes("Pending") ? "#92400e" : "#9c3022", padding: "12px 14px", borderRadius: 8, fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: errorMessage.includes("Pending") ? 700 : 500 }}>
                    {errorMessage.includes("Pending") ? "⏳ " : "⚠️ "}{errorMessage}
                  </div>
                </div>
              )}

              {successMessage && (
                <div style={{ background: "#edf8ef", border: "1px solid #cce8d2", color: "#236833", padding: "12px 14px", borderRadius: 8, fontSize: 13, marginBottom: 18 }}>
                  {successMessage}
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-email-input">Registered Email / Gmail Address *</label>
                  <input
                    id="login-email-input"
                    type="email"
                    className="form-control"
                    placeholder="name@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label htmlFor="login-password-input" style={{ margin: 0 }}>Password *</label>
                    <button
                      type="button"
                      onClick={handleOpenForgotPassword}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#255c2f",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "0 2px",
                        textDecoration: "underline"
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="login-password-input"
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="button button-green"
                  style={{ width: "100%", marginTop: 14, opacity: isSubmitting ? 0.75 : 1, cursor: isSubmitting ? "wait" : "pointer" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "🔍 Verifying Credentials in Database..." : `Log In as ${activeRoleObj.name} →`}
                </button>

                {/* Real-time verification notice */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "#476b4a", background: "#f2f8f2", padding: "6px 10px", borderRadius: 6, border: "1px solid #d4e7d4" }}>
                  <span>🔒</span>
                  <span><strong>Realtime Database Verification:</strong> Checks registered status &amp; password against Cloud PostgreSQL before access</span>
                </div>

                {/* Quick Demo Shortcut for Admin Roles only */}
                {(selectedRole === "admin" || selectedRole === "superadmin" || selectedRole === "trainer" || selectedRole === "trainee") && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #d8dfd3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#778575" }}>Quick testing demo:</span>
                    <button
                      type="button"
                      className="button button-outline"
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => handleQuickDemo(selectedRole)}
                    >
                      ⚡ Fast 1-Click Demo Login
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#6a7768" }}>
                  Don't have an account?{" "}
                  <Link
                    to={`/signup?role=${selectedRole}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                    style={{ color: "var(--green)", fontWeight: 700, textDecoration: "underline" }}
                  >
                    Create {activeRoleObj.name} Account →
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD & BREVO GMAIL OTP MODAL */}
      {forgotModalOpen && (
        <div className="modal-backdrop" onClick={() => !forgotLoading && setForgotModalOpen(false)}>
          <div className="google-modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header" style={{ borderBottom: "1px solid #eef2ed", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0f6ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid #cce0ca" }}>
                  🔑
                </div>
                <div>
                  <h3 style={{ font: "700 18px Manrope", color: "#1f2937", margin: 0 }}>Forgot Password</h3>
                  <div style={{ fontSize: 12, color: "#4b7752", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <span>📧 Gmail OTP via Brevo (Bravo)</span>
                    <span>·</span>
                    <span style={{ color: "#6b7280" }}>{activeRoleObj.name} Account</span>
                  </div>
                </div>
              </div>

              {!forgotLoading && (
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="google-modal-body" style={{ padding: "20px 24px" }}>
              {/* Error Alert */}
              {forgotError && (
                <div style={{ background: "#fdf2f0", border: "1px solid #f3c9c2", color: "#9c3022", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {forgotError}
                </div>
              )}

              {/* Success Alert */}
              {forgotSuccess && forgotStep !== "success" && (
                <div style={{ background: "#edf8ef", border: "1px solid #cce8d2", color: "#236833", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {forgotSuccess}
                </div>
              )}

              {/* STEP 1: Enter Gmail & Request OTP */}
              {forgotStep === "request" && (
                <form onSubmit={handleSendForgotPasswordOtp}>
                  <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, margin: "0 0 16px" }}>
                    Enter your registered Gmail address below. We will send a secure <strong>6-digit verification code (OTP)</strong> via <strong>Brevo (Bravo)</strong> transactional mailer to confirm your identity.
                  </p>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label htmlFor="forgot-email-input" style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 6, display: "block" }}>
                      Registered Gmail / Email Address *
                    </label>
                    <input
                      id="forgot-email-input"
                      type="email"
                      className="form-control"
                      placeholder="e.g. grower@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      style={{ fontSize: 14 }}
                      autoFocus
                    />
                  </div>

                  <div style={{ background: "#f8faf8", border: "1px solid #e2ede0", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#3e6a45" }}>
                    🛡️ <strong>Brevo Secure Delivery:</strong> OTP dispatched instantly to your Gmail inbox. Valid for 10 minutes.
                  </div>

                  <button
                    type="submit"
                    className="button button-green"
                    style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "⏳ Sending OTP via Brevo..." : "Send Verification OTP to Gmail →"}
                  </button>
                </form>
              )}

              {/* STEP 2: Verify OTP & Enter New Password */}
              {forgotStep === "verify" && (
                <form onSubmit={handleVerifyAndResetPassword}>
                  {/* Test Mode Helper Toast */}
                  {forgotTestOtp && (
                    <div style={{ background: "#fef7e9", border: "1px solid #f6d89e", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#925b06" }}>⚡ Brevo Test Mode OTP:</div>
                        <div style={{ font: "700 18px monospace", color: "#784600", letterSpacing: 3 }}>{forgotTestOtp}</div>
                      </div>
                      <button
                        type="button"
                        className="button button-outline"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => setForgotOtp(forgotTestOtp)}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label htmlFor="forgot-otp-input" style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                        Enter 6-Digit OTP *
                      </label>
                      <button
                        type="button"
                        onClick={handleSendForgotPasswordOtp}
                        disabled={otpCountdown > 0 || forgotLoading}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 12,
                          color: otpCountdown > 0 ? "#9ca3af" : "#255c2f",
                          cursor: otpCountdown > 0 ? "default" : "pointer",
                          fontWeight: 700,
                          padding: 0
                        }}
                      >
                        {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP via Brevo"}
                      </button>
                    </div>
                    <input
                      id="forgot-otp-input"
                      type="text"
                      className="form-control"
                      placeholder="123456"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      style={{ fontSize: 20, letterSpacing: 8, textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}
                      autoFocus
                    />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      Check your Gmail inbox (or spam) for email from MushroomHub Security
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label htmlFor="forgot-new-pass" style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                        New Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((s) => !s)}
                        style={{ background: "none", border: "none", color: "#6b7280", fontSize: 11, cursor: "pointer", padding: 0 }}
                      >
                        {showNewPassword ? "🙈 Hide" : "👁️ Show"}
                      </button>
                    </div>
                    <input
                      id="forgot-new-pass"
                      type={showNewPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="At least 6 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                      style={{ fontSize: 14 }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <label htmlFor="forgot-confirm-pass" style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 6, display: "block" }}>
                      Confirm New Password *
                    </label>
                    <input
                      id="forgot-confirm-pass"
                      type={showNewPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                      style={{ fontSize: 14 }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="button button-green"
                    style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "⏳ Verifying & Updating Password..." : "Verify OTP & Reset Password →"}
                  </button>

                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setForgotStep("request")}
                      style={{ background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer" }}
                    >
                      ← Change Email Address
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {forgotStep === "success" && (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eaf6ec", color: "#236833", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
                    ✓
                  </div>
                  <h3 style={{ font: "700 20px var(--serif)", color: "#1f3829", margin: "0 0 8px" }}>
                    Password Reset Successfully!
                  </h3>
                  <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, margin: "0 0 20px" }}>
                    Your password for <strong>{forgotEmail}</strong> has been updated in the cloud database. You can now log into your portal.
                  </p>

                  <button
                    type="button"
                    className="button button-green"
                    style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700 }}
                    onClick={() => {
                      setForgotModalOpen(false);
                    }}
                  >
                    Log In Now with New Password →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
