package com.mushroomhub.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_config")
public class PlatformConfig {

    @Id
    private Long id = 1L; // Singleton config record

    private String platformName = "MushroomHub";

    // Dynamic Delivery Pricing Rules
    private Double baseDeliveryFee = 30.0;
    private Double distanceFeePerKm = 8.0;
    private Double weightFeePerKg = 5.0;
    private Double expressSurcharge = 40.0;
    private Double freeDeliveryThreshold = 1000.0;

    // Platform Commission
    private Double platformCommissionPercent = 0.0;

    // Platform Governance & Support
    private String supportEmail = "support@mushroomhub.com";
    private String supportPhone = "+91 98450 12890";
    private Boolean maintenanceMode = false;

    @Column(columnDefinition = "TEXT")
    private String refundPolicy = "Standard 24-hour perishable produce return window for damaged packaging or degraded freshness.";

    @Column(columnDefinition = "TEXT")
    private String farmerPolicy = "Mandatory FSSAI license compliance, organic substrate documentation, and daily morning veil harvesting standards.";

    @Column(columnDefinition = "TEXT")
    private String termsOfService = "MushroomHub operates as an organic marketplace connecting certified cultivators and buyers with cold-chain fulfillment.";

    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public PlatformConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPlatformName() { return platformName; }
    public void setPlatformName(String platformName) { this.platformName = platformName; }

    public Double getBaseDeliveryFee() { return baseDeliveryFee; }
    public void setBaseDeliveryFee(Double baseDeliveryFee) { this.baseDeliveryFee = baseDeliveryFee; }

    public Double getDistanceFeePerKm() { return distanceFeePerKm; }
    public void setDistanceFeePerKm(Double distanceFeePerKm) { this.distanceFeePerKm = distanceFeePerKm; }

    public Double getWeightFeePerKg() { return weightFeePerKg; }
    public void setWeightFeePerKg(Double weightFeePerKg) { this.weightFeePerKg = weightFeePerKg; }

    public Double getExpressSurcharge() { return expressSurcharge; }
    public void setExpressSurcharge(Double expressSurcharge) { this.expressSurcharge = expressSurcharge; }

    public Double getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
    public void setFreeDeliveryThreshold(Double freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }

    public Double getPlatformCommissionPercent() { return platformCommissionPercent; }
    public void setPlatformCommissionPercent(Double platformCommissionPercent) { this.platformCommissionPercent = platformCommissionPercent; }

    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }

    public String getSupportPhone() { return supportPhone; }
    public void setSupportPhone(String supportPhone) { this.supportPhone = supportPhone; }

    public Boolean getMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(Boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }

    public String getRefundPolicy() { return refundPolicy; }
    public void setRefundPolicy(String refundPolicy) { this.refundPolicy = refundPolicy; }

    public String getFarmerPolicy() { return farmerPolicy; }
    public void setFarmerPolicy(String farmerPolicy) { this.farmerPolicy = farmerPolicy; }

    public String getTermsOfService() { return termsOfService; }
    public void setTermsOfService(String termsOfService) { this.termsOfService = termsOfService; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
