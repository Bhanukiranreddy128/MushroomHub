package com.mushroomhub.api.dto;

public class CartItemInput {
    private String id;
    private String name;
    private Integer quantity;
    private String unit;
    private Double price;
    private String farm;
    private String farmName;
    private String place;
    private String farmerEmail;
    private String cultivatorEmail;
    private String cultivatorId;
    private String category;

    public CartItemInput() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getQuantity() {
        return quantity != null && quantity > 0 ? quantity : 1;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getFarm() {
        return farm != null ? farm : farmName;
    }

    public void setFarm(String farm) {
        this.farm = farm;
    }

    public String getFarmName() {
        return farmName != null ? farmName : farm;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
    }

    public String getFarmerEmail() {
        return farmerEmail != null ? farmerEmail : cultivatorEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public String getCultivatorEmail() {
        return cultivatorEmail != null ? cultivatorEmail : farmerEmail;
    }

    public void setCultivatorEmail(String cultivatorEmail) {
        this.cultivatorEmail = cultivatorEmail;
    }

    public String getCultivatorId() {
        return cultivatorId;
    }

    public void setCultivatorId(String cultivatorId) {
        this.cultivatorId = cultivatorId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPlace() {
        return place;
    }

    public void setPlace(String place) {
        this.place = place;
    }
}
