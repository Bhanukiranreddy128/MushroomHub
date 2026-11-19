package com.mushroomhub.api.dto;

import java.util.ArrayList;
import java.util.List;

public class DeliveryCalculateResponse {
    private boolean valid;
    private String message;
    private String deliveryType; // standard or express
    private double productSubtotal;
    private double totalWeightKg;
    private int totalShipments;
    private List<ShipmentBreakdownDTO> shipments = new ArrayList<>();

    private double baseFee;
    private double distanceFee;
    private double weightFee;
    private double expressSurcharge;

    private double totalCalculatedDeliveryFee;
    private boolean freeDeliveryEligible;
    private double freeDeliveryThreshold;
    private double discount;
    private double finalDeliveryCharge;
    private double grandTotal;

    public DeliveryCalculateResponse() {}

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(String deliveryType) {
        this.deliveryType = deliveryType;
    }

    public double getProductSubtotal() {
        return productSubtotal;
    }

    public void setProductSubtotal(double productSubtotal) {
        this.productSubtotal = productSubtotal;
    }

    public double getTotalWeightKg() {
        return totalWeightKg;
    }

    public void setTotalWeightKg(double totalWeightKg) {
        this.totalWeightKg = totalWeightKg;
    }

    public int getTotalShipments() {
        return totalShipments;
    }

    public void setTotalShipments(int totalShipments) {
        this.totalShipments = totalShipments;
    }

    public List<ShipmentBreakdownDTO> getShipments() {
        return shipments;
    }

    public void setShipments(List<ShipmentBreakdownDTO> shipments) {
        this.shipments = shipments;
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

    public double getTotalCalculatedDeliveryFee() {
        return totalCalculatedDeliveryFee;
    }

    public void setTotalCalculatedDeliveryFee(double totalCalculatedDeliveryFee) {
        this.totalCalculatedDeliveryFee = totalCalculatedDeliveryFee;
    }

    public boolean isFreeDeliveryEligible() {
        return freeDeliveryEligible;
    }

    public void setFreeDeliveryEligible(boolean freeDeliveryEligible) {
        this.freeDeliveryEligible = freeDeliveryEligible;
    }

    public double getFreeDeliveryThreshold() {
        return freeDeliveryThreshold;
    }

    public void setFreeDeliveryThreshold(double freeDeliveryThreshold) {
        this.freeDeliveryThreshold = freeDeliveryThreshold;
    }

    public double getDiscount() {
        return discount;
    }

    public void setDiscount(double discount) {
        this.discount = discount;
    }

    public double getFinalDeliveryCharge() {
        return finalDeliveryCharge;
    }

    public void setFinalDeliveryCharge(double finalDeliveryCharge) {
        this.finalDeliveryCharge = finalDeliveryCharge;
    }

    public double getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(double grandTotal) {
        this.grandTotal = grandTotal;
    }
}
