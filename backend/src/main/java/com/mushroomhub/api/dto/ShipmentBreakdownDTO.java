package com.mushroomhub.api.dto;

import java.util.ArrayList;
import java.util.List;

public class ShipmentBreakdownDTO {
    private String farmerId;
    private String farmerName;
    private String farmName;
    private String pickupLocation;
    private List<String> itemNames = new ArrayList<>();
    private int itemCount;
    private double weightKg;
    private double distanceKm;
    private double baseFee;
    private double distanceFee;
    private double weightFee;
    private double expressSurcharge;
    private double shipmentDeliveryFee;
    private double shipmentSubtotal;
    private String estimatedTimeline;

    public ShipmentBreakdownDTO() {}

    public String getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getFarmName() {
        return farmName;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public List<String> getItemNames() {
        return itemNames;
    }

    public void setItemNames(List<String> itemNames) {
        this.itemNames = itemNames;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(double weightKg) {
        this.weightKg = weightKg;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public double getBaseFee() {
        return baseFee;
    }

    public void setBaseFee(double baseFee) {
        this.baseFee = baseFee;
    }

    public double getDistanceFee() {
        return distanceFee;
    }

    public void setDistanceFee(double distanceFee) {
        this.distanceFee = distanceFee;
    }

    public double getWeightFee() {
        return weightFee;
    }

    public void setWeightFee(double weightFee) {
        this.weightFee = weightFee;
    }

    public double getExpressSurcharge() {
        return expressSurcharge;
    }

    public void setExpressSurcharge(double expressSurcharge) {
        this.expressSurcharge = expressSurcharge;
    }

    public double getShipmentDeliveryFee() {
        return shipmentDeliveryFee;
    }

    public void setShipmentDeliveryFee(double shipmentDeliveryFee) {
        this.shipmentDeliveryFee = shipmentDeliveryFee;
    }

    public double getShipmentSubtotal() {
        return shipmentSubtotal;
    }

    public void setShipmentSubtotal(double shipmentSubtotal) {
        this.shipmentSubtotal = shipmentSubtotal;
    }

    public String getEstimatedTimeline() {
        return estimatedTimeline;
    }

    public void setEstimatedTimeline(String estimatedTimeline) {
        this.estimatedTimeline = estimatedTimeline;
    }
}
