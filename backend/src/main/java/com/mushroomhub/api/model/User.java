package com.mushroomhub.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String role; // cultivater (FARMER), customer (BUYER), admin (ADMIN), superadmin (SUPER_ADMIN)

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String farmName;
    private String phone;
    private String location;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String preferences;
    private String avatar;
    private String authProvider; // cloud, google

    // RBAC & Account Lifecycle States
    @Column(nullable = false)
    private String accountStatus = "ACTIVE"; // ACTIVE, DEACTIVATED, SUSPENDED

    private String verificationStatus = "APPROVED"; // PENDING, APPROVED, REJECTED (for farmers)
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private String fssaiNumber;
    private String farmScale;

    @Column(columnDefinition = "TEXT")
    private String certifications;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.accountStatus == null) this.accountStatus = "ACTIVE";
        if (this.verificationStatus == null) {
            this.verificationStatus = ("cultivater".equalsIgnoreCase(this.role) || "cultivator".equalsIgnoreCase(this.role) || "farmer".equalsIgnoreCase(this.role)) ? "PENDING" : "APPROVED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public User() {}

    public User(String role, String name, String email, String password, String farmName, String phone, String location, String authProvider) {
        this.role = role;
        this.name = name;
        this.email = email;
        this.password = password;
        this.farmName = farmName;
        this.phone = phone;
        this.location = location;
        this.authProvider = authProvider;
        this.accountStatus = "ACTIVE";
        this.verificationStatus = ("cultivater".equalsIgnoreCase(role) || "cultivator".equalsIgnoreCase(role) || "farmer".equalsIgnoreCase(role)) ? "PENDING" : "APPROVED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String role, String name, String email, String password, String farmName, String phone, String location, String address, String city, String state, String pincode, String preferences, String authProvider) {
        this.role = role;
        this.name = name;
        this.email = email;
        this.password = password;
        this.farmName = farmName;
        this.phone = phone;
        this.location = location;
        this.address = address;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
        this.preferences = preferences;
        this.authProvider = authProvider;
        this.accountStatus = "ACTIVE";
        this.verificationStatus = ("cultivater".equalsIgnoreCase(role) || "cultivator".equalsIgnoreCase(role) || "farmer".equalsIgnoreCase(role)) ? "PENDING" : "APPROVED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFarmName() { return farmName; }
    public void setFarmName(String farmName) { this.farmName = farmName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getFssaiNumber() { return fssaiNumber; }
    public void setFssaiNumber(String fssaiNumber) { this.fssaiNumber = fssaiNumber; }

    public String getFarmScale() { return farmScale; }
    public void setFarmScale(String farmScale) { this.farmScale = farmScale; }

    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
