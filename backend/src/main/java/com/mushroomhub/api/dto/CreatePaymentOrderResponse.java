package com.mushroomhub.api.dto;

public class CreatePaymentOrderResponse {
    private boolean success;
    private String message;
    private String orderId;
    private String razorpayOrderId;
    private String keyId;
    private Long amountPaise;
    private Double grandTotal;
    private String currency = "INR";
    private DeliveryCalculateResponse deliveryBreakdown;

    public CreatePaymentOrderResponse() {}

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public Long getAmountPaise() {
        return amountPaise;
    }

    public void setAmountPaise(Long amountPaise) {
        this.amountPaise = amountPaise;
    }

    public Double getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(Double grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public DeliveryCalculateResponse getDeliveryBreakdown() {
        return deliveryBreakdown;
    }

    public void setDeliveryBreakdown(DeliveryCalculateResponse deliveryBreakdown) {
        this.deliveryBreakdown = deliveryBreakdown;
    }
}
