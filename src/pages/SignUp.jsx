import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { getRolePortalPath, useAuth } from "../context/AuthContext";
import { SYSTEM_ROLES } from "../data/store";
import { sendRegistrationOtp, verifyRegistrationOtp } from "../services/cloudAuth";
import "../styles/join.css";

const ROLE_PREVIEWS = {
  cultivater: {
    title: "Cultivator & Commercial Grower",
    badge: "Farmer & Producer",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    tag: "🍄 Fresh Morning Flush",
    guarantee: "100% Direct Bank Settlements",
    desc: "Direct farm-to-table access. List your live flushes, print automated cold-chain labels, and receive same-day UPI payouts.",
    perks: [
      "List daily morning flushes (Oyster, Lion's Mane, Shiitake, Ganoderma)",
      "Zero platform commission: 100% customer payments settled to your bank",
      "Automated cold-chain shipping labels & Blue Dart / Shadowfax tracking",
      "Real-time customer orders dashboard with instant push notifications"
    ],
    quote: "“Listing our morning oyster flushes on MushroomHub transformed our cash flow. Direct chef orders and same-day bank settlements without brokers.”",
    author: "Vikram R. Sharma",
    authorRole: "Director, Himalayan Forest Spores Farm"
  },
  customer: {
    title: "Gourmet Customer & Chef",
    badge: "Consumer & Buyer",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    tag: "🍽️ Farm-Fresh Gourmet",
    guarantee: "24H Cold-Chain Doorstep Delivery",
    desc: "Order small-batch gourmet and medicinal mushrooms harvested hours before dispatch from certified cleanroom growers.",
    perks: [
      "100% Certified Organic & FSSAI food-safe gourmet varieties",
      "Delivered in refrigerated packaging to keep cap veils and texture intact",
      "Full transparency: view the grower, harvest timestamp, and substrate lab",
      "Direct chat & transparent digital order receipts with live tracking"
    ],
    quote: "“The quality of Lion’s Mane and King Trumpets arriving from MushroomHub growers is unmatched in any standard market. Exceptional culinary texture.”",
    author: "Chef Arjun Nair",
    authorRole: "Executive Chef, The Woodfire Pantry"
  }
};

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const initialRoleParam = searchParams.get("role");

  const { createAccount, loginWithCredentials, user } = useAuth();

  const normalizeRole = (r) => {
    if (!r) return "cultivater";
    const low = r.toLowerCase();
    if (low === "cultivator" || low === "farmer") return "cultivater";
    if (low === "customer" || low === "buyer") return "customer";
    return "cultivater";
  };

  const [role, setRole] = useState(() => {
    if (initialRoleParam) return normalizeRole(initialRoleParam);
    if (redirectParam === "/cart") return "customer";
    return "cultivater";
  });

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Dehradun, Uttarakhand");
  const [farmName, setFarmName] = useState("");
  const [farmScale, setFarmScale] = useState("Commercial Unit (500 - 2,500 kg/mo)");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [certifications, setCertifications] = useState("Jaivik Bharat Organic, GAP Harmonized");
  const [buyerType, setBuyerType] = useState("Fine Dining Chef / Culinary Restaurant");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Brevo Real-Time Gmail OTP Verification States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [testOtpNotice, setTestOtpNotice] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Compute password strength
  const pwdStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Enter password", cls: "" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak (add letters/numbers)", cls: "weak" };
      case 2:
        return { score: 2, label: "Fair (combine symbols)", cls: "fair" };
      case 3:
        return { score: 3, label: "Good password", cls: "good" };
      case 4:
        return { score: 4, label: "Strong & secure ✨", cls: "strong" };
      default:
        return { score: 1, label: "Weak", cls: "weak" };
    }
  }, [password]);

  const activeRoleData = ROLE_PREVIEWS[role] || ROLE_PREVIEWS.cultivater;
  const availableRoles = SYSTEM_ROLES.filter((r) => r.id !== "admin" && r.id !== "superadmin");

  const getDestination = (portalPath) => {
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam;
    }
    return portalPath;
  };

  // If user is already authenticated, redirect immediately to their portal
  if (user?.isLoggedIn && user?.role) {
    const portal = getRolePortalPath(user);
    if (portal) {
      return <Navigate to={getDestination(portal)} replace />;
    }
  }

  // Submit standard email registration with real-time Brevo Gmail OTP verification
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!agreeTerms) {
      setError("Please agree to MushroomHub's Terms & Organic Standards pledge to continue.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid Gmail / Email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password confirmation.");
      return;
    }

    setSubmitting(true);

    const payload = {
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      password,
      farmName: role === "cultivater" ? (farmName.trim() || `${name.trim()}'s Mushroom Farm`) : "",
      farmScale: role === "cultivater" ? farmScale : undefined,
      fssaiNumber: role === "cultivater" ? fssaiNumber.trim() : undefined,
      certifications: role === "cultivater" ? certifications.trim() : undefined,
      buyerType: role === "customer" ? buyerType : undefined
    };

    setPendingPayload(payload);

    try {
      const res = await sendRegistrationOtp(payload.email, payload.name, role);
      setSubmitting(false);

      if (res.success) {
        setOtpModalOpen(true);
        setSignupOtp("");
        setOtpError("");
        setOtpSuccess(res.message || `A 6-digit verification code has been dispatched to your Gmail (${payload.email}) via Brevo.`);
        if (res.testOtp) {
          setTestOtpNotice(res.testOtp);
        } else {
          setTestOtpNotice("");
        }
        setOtpCountdown(60);
      } else {
        setError(res.error || "Failed to dispatch verification code to Gmail. Please try again.");
      }
    } catch (err) {
      setSubmitting(false);
      setError("Failed to connect to email verification service: " + err.message);
    }
  };

  const handleVerifySignupOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpError("");
    setOtpSuccess("");

    if (!signupOtp || signupOtp.trim().length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code received in your Gmail.");
      return;
    }

    if (!pendingPayload) {
      setOtpError("Session expired. Please fill out the registration form again.");
      return;
    }

    setOtpLoading(true);

    try {
      // 1. Verify 6-digit OTP code with Brevo backend
      const vRes = await verifyRegistrationOtp(pendingPayload.email, signupOtp.trim());
      if (!vRes.success) {
        setOtpError(vRes.error || "Invalid or expired verification code. Please check your Gmail or request a new code.");
        setOtpLoading(false);
        return;
      }

      // 2. Create Account in database
      const res = await createAccount(pendingPayload);

      if (res.success) {
        // For Cultivators: Admin must review & approve before credentials can be used to log in
        if (role === "cultivater" || res.pendingApproval) {
          setOtpSuccess("🌱 Cultivator account registered successfully! Your account is currently PENDING Admin Verification. An administrator will inspect your farm details and verify your cultivator credentials. Once accepted, your credentials will become active for login.");
          setOtpLoading(false);
          setTimeout(() => {
            setOtpModalOpen(false);
            navigate(`/login/cultivater?pending=1`);
          }, 2800);
          return;
        }

        setOtpSuccess("✨ Gmail verified! Account created & stored in Cloud Database! Logging into your portal...");
        // Auto-login newly created credentials for customers
        const loginRes = await loginWithCredentials(role, pendingPayload.email, pendingPayload.password);
        setTimeout(() => {
          setOtpModalOpen(false);
          if (loginRes.success) {
            navigate(getDestination(loginRes.portalPath), { replace: true });
          } else {
            const dest = `/login/${role}${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`;
            navigate(dest, { replace: true });
          }
        }, 650);
      } else {
        setOtpError(res.error || "Failed to create account. Please check the details and try again.");
        setOtpLoading(false);
      }
    } catch (err) {
      setOtpError(err.message || "An unexpected error occurred during account creation.");
      setOtpLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (otpCountdown > 0 || !pendingPayload) return;
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await sendRegistrationOtp(pendingPayload.email, pendingPayload.name, role);
      if (res.success) {
        setOtpSuccess("A fresh 6-digit code has been dispatched to your Gmail via Brevo!");
        if (res.testOtp) setTestOtpNotice(res.testOtp);
        setOtpCountdown(60);
      } else {
        setOtpError(res.error || "Failed to resend verification code.");
      }
    } catch (err) {
      setOtpError("Network error: " + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="join-page-wrapper">
      <div className="join-container">
        <div className="join-grid">
          {/* ========================================================
             LEFT COLUMN: INSPIRING BRAND SHOWCASE & COMMUNITY VALUE
             ======================================================== */}
          <div className="join-showcase">
            <div className="join-pill">
              <span className="dot"></span>
              <span>🌿 India’s Premier Mycology Alliance</span>
            </div>

            <h1 className="join-hero-title">
              Cultivate. Connect.<br />
              <em>Grow Without Limits.</em>
            </h1>

            <p className="join-hero-subtitle">
              Join hundreds of independent organic mushroom growers, Michelin-calibre chefs, and certified mycology researchers on India’s dedicated digital exchange.
            </p>

            {/* Dynamic Role Showcase Card */}
            <div className="join-preview-card">
              <div className="join-preview-image-wrap">
                <img src={activeRoleData.image} alt={activeRoleData.title} />
                <span className="join-preview-overlay-tag">
                  {activeRoleData.tag}
                </span>
                <span className="join-preview-overlay-badge">
                  {activeRoleData.guarantee}
                </span>
              </div>

              <div className="join-preview-body">
                <div className="join-preview-header">
                  <div className="join-preview-role-name">
                    <span>{SYSTEM_ROLES.find((r) => r.id === role)?.icon || "🍄"}</span>
                    <span>{activeRoleData.title}</span>
                  </div>
                  <span className="status-badge paid" style={{ fontSize: 11 }}>
                    {activeRoleData.badge}
                  </span>
                </div>

                <p className="join-preview-desc">
                  {activeRoleData.desc}
                </p>

                <ul className="join-perks-list">
                  {activeRoleData.perks.map((perk, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Community Testimonial & Trust Bar */}
            <div className="join-trust-box">
              <div className="join-trust-stat">
                <strong>500+</strong>
                <span>Verified Growers & Chefs</span>
              </div>
              <div className="join-trust-divider"></div>
              <div className="join-trust-stat">
                <strong>₹48L+</strong>
                <span>Direct Farmer Settlements</span>
              </div>
              <div className="join-trust-divider"></div>
              <div className="join-trust-stat">
                <strong>4.9 / 5.0</strong>
                <span>Gourmet Satisfaction</span>
              </div>
            </div>

            {/* Quote Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(6px)",
                border: "1px dashed #c8dec4",
                borderRadius: 14,
                padding: "16px 20px",
                fontSize: 12.5,
                color: "#284430",
                lineHeight: 1.55
              }}
            >
              <div style={{ fontStyle: "italic", marginBottom: 8 }}>
                {activeRoleData.quote}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "#143b20" }}>{activeRoleData.author}</strong>
                <span style={{ color: "#748a77" }}>·</span>
                <span style={{ color: "#5d7362", fontSize: 11 }}>{activeRoleData.authorRole}</span>
              </div>
            </div>
          </div>

          {/* ========================================================
             RIGHT COLUMN: ATTRACTIVE, CLEAN & INTUITIVE JOIN FORM
             ======================================================== */}
          <div className="join-card">
            <div className="join-card-header">
              <div className="join-card-eyebrow">
                <span>✨</span>
                <span>Get Started in Under 60 Seconds</span>
              </div>
              <h2 className="join-card-title">Create your account</h2>
              <p className="join-card-subtitle">
                Select your community role below to unlock your personalized portal workspace and dashboard tools.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="join-alert-error">
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="join-alert-success">
                <span style={{ fontSize: 18 }}>🌿</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={submit}>
              {/* STEP 1: ROLE SELECTION */}
              <div className="join-step-header">
                <h3 className="join-step-title">Step 1: Choose Your Account Type</h3>
                <span className="join-step-badge">Required</span>
              </div>

              <div className="join-roles-grid">
                {availableRoles.map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`join-role-card ${isSelected ? "active" : ""}`}
                      onClick={() => {
                        setRole(r.id);
                        setError("");
                      }}
                    >
                      <span className="join-role-icon">{r.icon}</span>
                      <div className="join-role-info">
                        <div className="join-role-name-row">
                          <span className="join-role-name">{r.name}</span>
                          <span className="join-role-badge">{r.badge.split(" ")[0]}</span>
                        </div>
                        <div className="join-role-tagline">
                          {r.id === "cultivater" && "Sell harvest & manage farm"}
                          {r.id === "customer" && "Order fresh gourmet fungi"}
                          {r.id === "trainee" && "Study mycology & sterile lab"}
                          {r.id === "trainer" && "Host workshops & research"}
                        </div>
                      </div>
                      <div className="join-role-check">
                        {isSelected ? "✓" : ""}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* STEP 2: CREDENTIALS & DETAILS */}
              <div className="join-step-header">
                <h3 className="join-step-title">Step 2: Enter Account Credentials</h3>
                <span className="join-step-badge">
                  {role === "cultivater" ? "Cultivator Profile" : `${activeRoleData.badge} Details`}
                </span>
              </div>

              <div className="join-fields-grid">
                {/* Full Name */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-name">
                    <span>Full Name <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">👤</span>
                    <input
                      id="join-name"
                      type="text"
                      className="join-input"
                      placeholder="e.g. Vikram Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-email">
                    <span>Email Address <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">✉️</span>
                    <input
                      id="join-email"
                      type="email"
                      className="join-input"
                      placeholder="grower@farm.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-phone">
                    <span>Phone / WhatsApp <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">📱</span>
                    <input
                      id="join-phone"
                      type="tel"
                      className="join-input"
                      placeholder="+91 98450 12890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* City / State */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-location">
                    <span>City / State <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">📍</span>
                    <input
                      id="join-location"
                      type="text"
                      className="join-input"
                      placeholder="e.g. Dehradun, Uttarakhand"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ROLE SPECIFIC FIELDS */}
                {role === "cultivater" && (
                  <>
                    <div className="join-field-group join-field-full">
                      <label className="join-field-label" htmlFor="join-farm">
                        <span>Farm / Mushroom Brand Name <span className="req">*</span></span>
                      </label>
                      <div className="join-input-wrapper">
                        <span className="join-input-icon">🏡</span>
                        <input
                          id="join-farm"
                          type="text"
                          className="join-input"
                          placeholder="e.g. Himalayan Forest Spores & Myco Farm"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="join-field-group join-field-full">
                      <label className="join-field-label" htmlFor="join-scale">
                        <span>Current Growing Scale & Capacity <span className="opt">(Optional)</span></span>
                      </label>
                      <div className="join-input-wrapper">
                        <span className="join-input-icon">⚖️</span>
                        <select
                          id="join-scale"
                          className="join-input"
                          value={farmScale}
                          onChange={(e) => setFarmScale(e.target.value)}
                        >
                          <option value="Boutique Indoor (100 - 500 kg/mo)">Boutique Indoor Setup (100 - 500 kg/month)</option>
                          <option value="Commercial Unit (500 - 2,500 kg/mo)">Commercial Facility (500 - 2,500 kg/month)</option>
                          <option value="Industrial Enterprise (2,500+ kg/mo)">Industrial Enterprise (2,500+ kg/month)</option>
                          <option value="New Setup in Progress">New Cleanroom / Setup in Progress</option>
                        </select>
                      </div>
                    </div>

                    <div className="join-field-group">
                      <label className="join-field-label" htmlFor="join-fssai">
                        <span>FSSAI License / Registration # <span className="opt">(Optional)</span></span>
                      </label>
                      <div className="join-input-wrapper">
                        <span className="join-input-icon">📜</span>
                        <input
                          id="join-fssai"
                          type="text"
                          className="join-input"
                          placeholder="e.g. 10022011002341"
                          value={fssaiNumber}
                          onChange={(e) => setFssaiNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="join-field-group">
                      <label className="join-field-label" htmlFor="join-certs">
                        <span>Organic / GAP Certifications <span className="opt">(Optional)</span></span>
                      </label>
                      <div className="join-input-wrapper">
                        <span className="join-input-icon">🌱</span>
                        <input
                          id="join-certs"
                          type="text"
                          className="join-input"
                          placeholder="e.g. Jaivik Bharat, USDA Organic"
                          value={certifications}
                          onChange={(e) => setCertifications(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === "customer" && (
                  <div className="join-field-group join-field-full">
                    <label className="join-field-label" htmlFor="join-buyer-type">
                      <span>Buyer Profile & Preference <span className="opt">(Optional)</span></span>
                    </label>
                    <div className="join-input-wrapper">
                      <span className="join-input-icon">🍽️</span>
                      <select
                        id="join-buyer-type"
                        className="join-input"
                        value={buyerType}
                        onChange={(e) => setBuyerType(e.target.value)}
                      >
                        <option value="Fine Dining Chef / Culinary Restaurant">Fine Dining Chef / Hotel Restaurant</option>
                        <option value="Artisanal Household & Gourmet Foodie">Artisanal Household & Gourmet Foodie</option>
                        <option value="Specialty Organic Retailer / Market">Specialty Organic Retailer / Market</option>
                        <option value="Medicinal & Wellness Practitioner">Medicinal & Wellness Practitioner</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password Field with Toggle */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-password">
                    <span>Create Password <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">🔒</span>
                    <input
                      id="join-password"
                      type={showPassword ? "text" : "password"}
                      className="join-input"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="join-pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  {password && (
                    <div className="join-pwd-meter">
                      <div className="join-pwd-bars">
                        <div className={`join-pwd-bar-segment ${pwdStrength.score >= 1 ? pwdStrength.cls : ""}`}></div>
                        <div className={`join-pwd-bar-segment ${pwdStrength.score >= 2 ? pwdStrength.cls : ""}`}></div>
                        <div className={`join-pwd-bar-segment ${pwdStrength.score >= 3 ? pwdStrength.cls : ""}`}></div>
                        <div className={`join-pwd-bar-segment ${pwdStrength.score >= 4 ? pwdStrength.cls : ""}`}></div>
                      </div>
                      <div className="join-pwd-meter-text">
                        <span>Strength: {pwdStrength.label}</span>
                        {password.length < 6 && <span style={{ color: "#e04f44" }}>Need 6+ chars</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="join-field-group">
                  <label className="join-field-label" htmlFor="join-confirm-password">
                    <span>Confirm Password <span className="req">*</span></span>
                  </label>
                  <div className="join-input-wrapper">
                    <span className="join-input-icon">🔑</span>
                    <input
                      id="join-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="join-input"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="join-pwd-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      {password === confirmPassword ? (
                        <span style={{ color: "#345D31", fontWeight: 700 }}>✓ Passwords match</span>
                      ) : (
                        <span style={{ color: "#d93829", fontWeight: 600 }}>✗ Passwords do not match</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="join-terms-row">
                <input
                  type="checkbox"
                  id="join-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="join-terms" style={{ cursor: "pointer" }}>
                  I agree to MushroomHub’s <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and pledge to support 100% organic, sterile food safety standards.
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="join-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Creating Your Account & Setting Up Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Create {SYSTEM_ROLES.find((r) => r.id === role)?.name} Account & Enter Portal</span>
                    <span style={{ fontSize: 18 }}>→</span>
                  </>
                )}
              </button>

              {/* Already registered footer */}
              <div className="join-card-footer">
                Already registered with MushroomHub?
                <Link
                  to={`/login/${role}${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
                >
                  Log in to your account →
                </Link>
              </div>

              {/* Security Trust Badges */}
              <div className="join-guarantees-row">
                <span className="join-guarantee-item">
                  <span>🔒</span> 256-bit Cloud Security
                </span>
                <span>·</span>
                <span className="join-guarantee-item">
                  <span>⚡</span> Direct Bank UPI
                </span>
                <span>·</span>
                <span className="join-guarantee-item">
                  <span>🌿</span> FSSAI & Jaivik Bharat
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================
         BREVO REAL-TIME GMAIL OTP VERIFICATION MODAL
         ======================================================== */}
      {otpModalOpen && (
        <div className="modal-backdrop" onClick={() => !otpLoading && setOtpModalOpen(false)}>
          <div className="google-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            {/* Modal Header */}
            <div className="google-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#eaf6ec", color: "#236833", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  ✉️
                </div>
                <div>
                  <h3 style={{ font: "700 18px var(--serif, sans-serif)", color: "#1f2937", margin: 0 }}>
                    Verify Your Gmail Address
                  </h3>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Brevo Real-Time Security • MushroomHub
                  </div>
                </div>
              </div>

              {!otpLoading && (
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="google-modal-body">
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, margin: "0 0 14px" }}>
                We sent a 6-digit verification code to <strong>{pendingPayload?.email}</strong>. Enter the code below to activate your {SYSTEM_ROLES.find((r) => r.id === role)?.name} account.
              </p>

              {otpError && (
                <div className="join-alert-error" style={{ marginBottom: 14 }}>
                  <span>⚠️</span>
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div className="join-alert-success" style={{ marginBottom: 14 }}>
                  <span>🌿</span>
                  <span>{otpSuccess}</span>
                </div>
              )}

              {testOtpNotice && (
                <div style={{ background: "#fef7e9", border: "1px solid #f6d89e", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#925b06" }}>⚡ Brevo Test Mode OTP:</div>
                    <div style={{ font: "700 18px monospace", color: "#784600", letterSpacing: 3 }}>{testOtpNotice}</div>
                  </div>
                  <button
                    type="button"
                    className="button button-outline"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => setSignupOtp(testOtpNotice)}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifySignupOtp}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label htmlFor="signup-otp-input" style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                      Enter 6-Digit Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleResendSignupOtp}
                      disabled={otpCountdown > 0 || otpLoading}
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
                    id="signup-otp-input"
                    type="text"
                    className="form-control"
                    placeholder="123456"
                    maxLength={6}
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    style={{ fontSize: 22, letterSpacing: 8, textAlign: "center", fontFamily: "monospace", fontWeight: 700, padding: "10px" }}
                    autoFocus
                  />
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
                    Check your Gmail inbox or spam folder for verification code from MushroomHub Security.
                  </div>
                </div>

                <div style={{ background: "#f8faf8", border: "1px solid #e2ede0", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#3e6a45" }}>
                  🛡️ <strong>Brevo Real-Time Protection:</strong> Verifying your Gmail protects your account and transactions.
                </div>

                <button
                  type="submit"
                  className="button button-green"
                  style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700 }}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: 8 }}></span>
                      <span>Verifying & Setting Up Account...</span>
                    </>
                  ) : (
                    <span>Verify Code & Complete Account Creation →</span>
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setOtpModalOpen(false)}
                    disabled={otpLoading}
                    style={{ background: "none", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer" }}
                  >
                    ← Edit Registration Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
