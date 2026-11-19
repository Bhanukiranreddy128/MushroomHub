package com.mushroomhub.api.dto;

import java.util.ArrayList;
import java.util.List;

public class DeliveryCalculateRequest {
    private List<CartItemInput> items = new ArrayList<>();
    private DeliveryAddressInput deliveryAddress;
    private String deliveryType = "standard"; // standard or express

    public DeliveryCalculateRequest() {}

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
}
