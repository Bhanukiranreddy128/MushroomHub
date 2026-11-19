package com.mushroomhub.api.dto;

public class DeliveryAddressInput {
    private String recipientName;
    private String recipientPhone;
    private String recipientEmail;
    private String streetAddress;
    private String locality;
    private String city;
    private String state;
    private String pincode;

    public DeliveryAddressInput() {}

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String toFullAddressString() {
        StringBuilder sb = new StringBuilder();
        if (streetAddress != null && !streetAddress.trim().isEmpty()) sb.append(streetAddress.trim()).append(", ");
        if (locality != null && !locality.trim().isEmpty()) sb.append(locality.trim()).append(", ");
        if (city != null && !city.trim().isEmpty()) sb.append(city.trim());
        if (state != null && !state.trim().isEmpty()) sb.append(", ").append(state.trim());
        if (pincode != null && !pincode.trim().isEmpty()) sb.append(" - ").append(pincode.trim());
        return sb.toString();
    }
}
