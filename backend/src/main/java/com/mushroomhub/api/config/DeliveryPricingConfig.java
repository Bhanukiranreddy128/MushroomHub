package com.mushroomhub.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "delivery.pricing")
public class DeliveryPricingConfig {

    private double baseFee = 30.0;
    private double perKmFee = 8.0;
    private double weightThresholdKg = 2.0;
    private double perExtraKgFee = 5.0;
    private double expressSurcharge = 40.0;
    private double freeThreshold = 1000.0;

    public double getBaseFee() {
        return baseFee;
    }

    public void setBaseFee(double baseFee) {
        this.baseFee = baseFee;
    }

    public double getPerKmFee() {
        return perKmFee;
    }

    public void setPerKmFee(double perKmFee) {
        this.perKmFee = perKmFee;
    }

    public double getWeightThresholdKg() {
        return weightThresholdKg;
    }

    public void setWeightThresholdKg(double weightThresholdKg) {
        this.weightThresholdKg = weightThresholdKg;
    }

    public double getPerExtraKgFee() {
        return perExtraKgFee;
    }

    public void setPerExtraKgFee(double perExtraKgFee) {
        this.perExtraKgFee = perExtraKgFee;
    }

    public double getExpressSurcharge() {
        return expressSurcharge;
    }

    public void setExpressSurcharge(double expressSurcharge) {
        this.expressSurcharge = expressSurcharge;
    }

    public double getFreeThreshold() {
        return freeThreshold;
    }

    public void setFreeThreshold(double freeThreshold) {
        this.freeThreshold = freeThreshold;
    }
}
