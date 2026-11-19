package com.mushroomhub.api.dto;

import java.util.ArrayList;
import java.util.List;

public class CreatePaymentOrderRequest {
    private String orderId;
    private String customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private List<CartItemInput> items = new ArrayList<>();
    private DeliveryAddressInput deliveryAddress;
    private String deliveryType = "standard";
    private String deliveryNotes;
    private String paymentMethod = "razorpay";

    public CreatePaymentOrderRequest() {}

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public List<CartItemInput> getItems() {
        return items;
    }

    public void setItems(List<CartItemInput> items) {
        this.items = items;
    }

    public DeliveryAddressInput getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(DeliveryAddressInput deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getDeliveryType() {
        return deliveryType != null ? deliveryType.toLowerCase().trim() : "standard";
    }

    public void setDeliveryType(String deliveryType) {
        this.deliveryType = deliveryType;
    }

    public String getDeliveryNotes() {
        return deliveryNotes;
    }

    public void setDeliveryNotes(String deliveryNotes) {
        this.deliveryNotes = deliveryNotes;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
