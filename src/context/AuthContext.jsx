/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { authenticateUser, getRegisteredUsers, registerUser, saveCustomerProfile, SYSTEM_ROLES } from "../data/store";
import { authenticateWithCloud, googleLoginWithCloud, registerWithCloud, updateProfileWithCloud, setAuthToken } from "../services/cloudAuth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mushroomhub_auth_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      } catch {
        /* fallback */
      }
    }
    return {
      role: null,
      name: "Guest Visitor",
      email: "",
      farmName: "",
      isLoggedIn: false
    };
  });

  const [currentRole, setCurrentRole] = useState(() => {
    const savedRole = localStorage.getItem("mushroomhub_active_role");
    if (savedRole && savedRole !== "guest") {
      return savedRole;
    }
    return user?.role || "guest";
  });

  useEffect(() => {
    if (user?.isLoggedIn && user?.role) {
      localStorage.setItem("mushroomhub_active_role", user.role);
      localStorage.setItem("mushroomhub_auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("mushroomhub_active_role");
      localStorage.removeItem("mushroomhub_auth_user");
    }
  }, [user]);

  const loginWithCredentials = async (roleId, email, password) => {
    const normalizedRole = roleId === "cultivator" ? "cultivater" : roleId;
    const roleObj = SYSTEM_ROLES.find((r) => r.id === normalizedRole) || SYSTEM_ROLES[0];

    // 1. Check Cloud PostgreSQL database first
    const cloudResult = await authenticateWithCloud(normalizedRole, email, password);
    if (cloudResult) {
      if (cloudResult.success) {
        const matchedUser = cloudResult.user;
        const activeUser = {
          id: matchedUser.id || `user-${matchedUser.email}`,
          role: roleObj.id,
          name: matchedUser.name,
          email: matchedUser.email,
          phone: matchedUser.phone || "",
          location: matchedUser.location || "",
          address: matchedUser.address || "",
          locality: matchedUser.locality || "",
          city: matchedUser.city || matchedUser.location || "",
          state: matchedUser.state || "",
          pincode: matchedUser.pincode || "",
          preferences: matchedUser.preferences || "",
          avatar: matchedUser.avatar || "",
          farmName: matchedUser.farmName || "",
          verificationStatus: matchedUser.verificationStatus || "APPROVED",
          source: "cloud",
          isLoggedIn: true
        };

        setCurrentRole(roleObj.id);
        setUser(activeUser);
        return { success: true, user: activeUser, portalPath: roleObj.portalPath, source: "cloud" };
      } else {
        // Cloud backend explicitly denied login (pending approval, wrong credentials, suspended)
        return cloudResult;
      }
    }

    // 2. Check local store fallback and auto-sync to cloud if missing
    const authResult = authenticateUser(normalizedRole, email, password);
    if (authResult.success) {
      const matchedUser = authResult.user;
      // Auto-sync locally registered user to Cloud PostgreSQL database
      try {
        const syncRes = await registerWithCloud({
          role: normalizedRole,
          email: matchedUser.email,
          name: matchedUser.name,
          password: matchedUser.password || password,
          farmName: matchedUser.farmName || "",
          phone: matchedUser.phone || "",
          location: matchedUser.location || ""
        });
        if (syncRes?.token) {
          setAuthToken(syncRes.token);
        }
      } catch (err) {
        console.warn("Auto-sync local user to cloud:", err.message);
      }

      const activeUser = {
        id: matchedUser.id || `user-${matchedUser.email}`,
        role: roleObj.id,
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone || "",
        location: matchedUser.location || "",
        address: matchedUser.address || "",
        locality: matchedUser.locality || "",
        city: matchedUser.city || matchedUser.location || "",
        state: matchedUser.state || "",
        pincode: matchedUser.pincode || "",
        preferences: matchedUser.preferences || "",
        avatar: matchedUser.avatar || "",
        farmName: matchedUser.farmName || "",
        isLoggedIn: true
      };

      setCurrentRole(roleObj.id);
      setUser(activeUser);
      return { success: true, user: activeUser, portalPath: roleObj.portalPath };
    }

    // 3. Neither cloud nor local matched: return cloud's error message if available
    if (cloudResult && !cloudResult.success) {
      return cloudResult;
    }

    return authResult;
  };

  const createAccount = async (userData) => {
    try {
      const normalizedRole = userData.role === "cultivator" ? "cultivater" : userData.role;
      const fullData = { ...userData, role: normalizedRole };

      // 1. Try registering in Cloud PostgreSQL
      const cloudRes = await registerWithCloud(fullData);
      if (cloudRes && !cloudRes.success) {
        return cloudRes;
      }

      // If cloud returned pending approval for cultivator, propagate pending state
      if (cloudRes?.pendingApproval) {
        return {
          success: true,
          pendingApproval: true,
          verificationStatus: "PENDING",
          message: cloudRes.message || "Account registered. Pending Admin verification.",
          user: cloudRes.user,
          source: "cloud"
        };
      }

      // 2. Also save to local storage to keep offline state in sync
      const created = registerUser(fullData);
      return { success: true, user: cloudRes?.user || created, source: cloudRes ? "cloud" : "local" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const loginWithGoogle = async (roleId, googleProfile) => {
    const normalizedRole = roleId === "cultivator" ? "cultivater" : roleId;
    const roleObj = SYSTEM_ROLES.find((r) => r.id === normalizedRole) || SYSTEM_ROLES[0];
    const registeredUsers = getRegisteredUsers();

    // Sync with Cloud
    const cloudRes = await googleLoginWithCloud(normalizedRole, googleProfile);
    if (cloudRes && !cloudRes.success) {
      return cloudRes;
    }
    if (cloudRes?.pendingApproval) {
      return {
        success: false,
        pendingApproval: true,
        verificationStatus: "PENDING",
        error: "Account Verification Pending: Your Cultivator account is awaiting review and approval by the Administrator. You will be able to log in once approved."
      };
    }

    let existing = registeredUsers.find(
      (u) =>
        (u.role === normalizedRole || (normalizedRole === "cultivater" && u.role === "cultivator")) &&
        u.email.toLowerCase() === googleProfile.email.toLowerCase()
    );

    if (!existing) {
      existing = {
        id: cloudRes?.user?.id || `user-google-${normalizedRole}-${Date.now()}`,
        role: normalizedRole,
        name: googleProfile.name || "Google User",
        email: googleProfile.email,
        phone: googleProfile.phone || "",
        farmName: googleProfile.farmName || (normalizedRole === "cultivater" ? `${googleProfile.name}'s Farm` : ""),
        location: googleProfile.location || "India",
        avatar: googleProfile.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        authProvider: "google",
        createdAt: new Date().toISOString()
      };
      try {
        registerUser(existing);
      } catch {
        // user already registered
      }
    }

    const activeUser = {
      id: existing.id || `user-${existing.email}`,
      role: roleObj.id,
      name: existing.name,
      email: existing.email,
      phone: existing.phone || "",
      location: existing.location || "",
      farmName: existing.farmName || "",
      avatar: existing.avatar || googleProfile.avatar,
      authProvider: "google",
      isLoggedIn: true
    };

    setCurrentRole(roleObj.id);
    setUser(activeUser);
    return { success: true, user: activeUser, portalPath: roleObj.portalPath };
  };

  // Direct role switching WITHOUT credentials is intentionally blocked!
  // Each account requires individual authentication with its own credentials.
  const switchRole = (roleId) => {
    const normalizedRole = roleId === "cultivator" ? "cultivater" : roleId;
    const roleObj = SYSTEM_ROLES.find((r) => r.id === normalizedRole) || SYSTEM_ROLES[0];
    logout();
    return roleObj;
  };

  // Update user / customer profile with Cloud Database sync
  const updateUserProfile = async (profileUpdates) => {
    const role = user?.role || "customer";
    const email = profileUpdates.email || user?.email;
    const fullPayload = {
      ...user,
      ...profileUpdates,
      role: role === "cultivator" ? "cultivater" : role,
      email
    };

    let cloudSuccess = false;
    let cloudMsg = "";
    let updatedData = { ...fullPayload };

    // 1. Persist to Cloud PostgreSQL database
    try {
      const cloudRes = await updateProfileWithCloud(fullPayload);
      if (cloudRes && cloudRes.success) {
        cloudSuccess = true;
        cloudMsg = cloudRes.message;
        if (cloudRes.user) {
          updatedData = {
            ...updatedData,
            ...cloudRes.user,
            isLoggedIn: true
          };
        }
      }
    } catch {
      // Cloud service offline or unreachable — local fallback handles it
    }

    // 2. Save locally for offline durability
    saveCustomerProfile(updatedData);

    const mergedUser = {
      ...user,
      ...updatedData,
      source: cloudSuccess ? "cloud" : (user?.source || "local"),
      isLoggedIn: true
    };

    setUser(mergedUser);
    localStorage.setItem("mushroomhub_auth_user", JSON.stringify(mergedUser));
    window.dispatchEvent(new CustomEvent("customer-profile-updated", { detail: mergedUser }));

    return {
      success: true,
      source: cloudSuccess ? "cloud" : "local",
      message: cloudSuccess
        ? (cloudMsg || "✨ Profile updated and synced to Cloud PostgreSQL database!")
        : "Profile saved locally. Cloud will sync on reconnection.",
      user: mergedUser
    };
  };

  const logout = () => {
    setAuthToken("");
    localStorage.removeItem("mushroomhub_auth_user");
    localStorage.removeItem("mushroomhub_active_role");
    localStorage.removeItem("mushroomhub_auth_token");
    setUser({
      role: null,
      name: "Guest Visitor",
      email: "",
      farmName: "",
      isLoggedIn: false
    });
    setCurrentRole("guest");

    // Clear stale account event queues so next user starts clean
    window.dispatchEvent(new CustomEvent("cultivator-orders-updated"));
    window.dispatchEvent(new CustomEvent("mushrooms-catalog-updated"));
    window.dispatchEvent(new CustomEvent("cultivator-sales-updated"));
    window.dispatchEvent(new CustomEvent("mushroomhub-bargains-updated"));
    window.dispatchEvent(new CustomEvent("cultivator-profile-updated"));
  };

  const activeRoleDetails = SYSTEM_ROLES.find((r) => r.id === currentRole) || SYSTEM_ROLES[0];

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        user,
        loginWithCredentials,
        loginWithGoogle,
        createAccount,
        updateUserProfile,
        switchRole,
        logout,
        activeRoleDetails,
        roles: SYSTEM_ROLES
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function getRolePortalPath(userOrRole) {
  if (!userOrRole) return null;
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === "cultivater" || normalized === "cultivator") return "/portal/cultivator";
  if (normalized === "customer") return "/portal/customer";
  if (normalized === "admin") return "/portal/admin";
  if (normalized === "superadmin") return "/portal/superadmin";
  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
