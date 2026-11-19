package com.mushroomhub.api.service;

import com.mushroomhub.api.config.DeliveryPricingConfig;
import com.mushroomhub.api.dto.CartItemInput;
import com.mushroomhub.api.dto.DeliveryAddressInput;
import com.mushroomhub.api.dto.DeliveryCalculateRequest;
import com.mushroomhub.api.dto.DeliveryCalculateResponse;
import com.mushroomhub.api.dto.ShipmentBreakdownDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DeliveryChargeService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryChargeService.class);

    private final DeliveryPricingConfig pricingConfig;

    // Trusted Product Catalog Metadata (prices, units, farms, pickup places)
    private static final Map<String, ProductMetadata> CATALOG = new HashMap<>();

    // Internal Geographic Coordinates (latitude, longitude) for Indian cities
    private static final Map<String, double[]> CITY_COORDINATES = new HashMap<>();

    static {
        // Initialize Trusted Products
        registerProduct("oyster", "Blue Oyster Mushrooms", 350.0, "kg", 1.0, "Himalayan Forest Spores Farm", "Dehradun, Uttarakhand");
        registerProduct("shiitake", "Forest Shiitake", 550.0, "kg", 1.0, "Nilgiri Mycelium Growers", "Ooty, Tamil Nadu");
        registerProduct("lion-mane", "Lion’s Mane", 650.0, "kg", 1.0, "Himalayan Forest Spores Farm", "Dehradun, Uttarakhand");
        registerProduct("cremini", "Cremini & Button", 240.0, "kg", 1.0, "Valley Cap Farm", "Pune, Maharashtra");
        registerProduct("king-oyster", "Royal King Trumpet Oysters", 450.0, "kg", 1.0, "Himalayan Forest Spores Farm", "Dehradun, Uttarakhand");
        registerProduct("golden-oyster", "Sunshine Golden Oysters", 380.0, "kg", 1.0, "Nilgiri Mycelium Growers", "Ooty, Tamil Nadu");

        // Indian Major Hub Coordinates (Latitude, Longitude)
        CITY_COORDINATES.put("dehradun", new double[]{30.3165, 78.0322});
        CITY_COORDINATES.put("ooty", new double[]{11.4102, 76.6950});
        CITY_COORDINATES.put("pune", new double[]{18.5204, 73.8567});
        CITY_COORDINATES.put("solan", new double[]{30.9045, 77.0967});
        CITY_COORDINATES.put("bengaluru", new double[]{12.9716, 77.5946});
        CITY_COORDINATES.put("bangalore", new double[]{12.9716, 77.5946});
        CITY_COORDINATES.put("delhi", new double[]{28.6139, 77.2090});
        CITY_COORDINATES.put("new delhi", new double[]{28.6139, 77.2090});
        CITY_COORDINATES.put("mumbai", new double[]{19.0760, 72.8777});
        CITY_COORDINATES.put("hyderabad", new double[]{17.3850, 78.4867});
        CITY_COORDINATES.put("chennai", new double[]{13.0827, 80.2707});
        CITY_COORDINATES.put("kolkata", new double[]{22.5726, 88.3639});
        CITY_COORDINATES.put("ahmedabad", new double[]{23.0225, 72.5714});
        CITY_COORDINATES.put("jaipur", new double[]{26.9124, 75.7873});
        CITY_COORDINATES.put("chandigarh", new double[]{30.7333, 76.7794});
        CITY_COORDINATES.put("lucknow", new double[]{26.8467, 80.9462});
        CITY_COORDINATES.put("kochi", new double[]{9.9312, 76.2673});
        CITY_COORDINATES.put("coimbatore", new double[]{11.0168, 76.9558});
        CITY_COORDINATES.put("mysore", new double[]{12.2958, 76.6394});
        CITY_COORDINATES.put("mysuru", new double[]{12.2958, 76.6394});
        CITY_COORDINATES.put("nagpur", new double[]{21.1458, 79.0882});
        CITY_COORDINATES.put("indore", new double[]{22.7196, 75.8577});
        CITY_COORDINATES.put("bhopal", new double[]{23.2599, 77.4126});
        CITY_COORDINATES.put("surat", new double[]{21.1702, 72.8311});
        CITY_COORDINATES.put("vadodara", new double[]{22.3072, 73.1812});
        CITY_COORDINATES.put("shimla", new double[]{31.1048, 77.1734});
        CITY_COORDINATES.put("patna", new double[]{25.5941, 85.1376});
        CITY_COORDINATES.put("ranchi", new double[]{23.3441, 85.3096});
        CITY_COORDINATES.put("bhubaneswar", new double[]{20.2961, 85.8245});
        CITY_COORDINATES.put("guwahati", new double[]{26.1445, 91.7362});
        CITY_COORDINATES.put("thiruvananthapuram", new double[]{8.5241, 76.9366});
        CITY_COORDINATES.put("goa", new double[]{15.2993, 74.1240});
    }

    private static void registerProduct(String id, String name, double price, String unit, double weightKg, String farm, String place) {
        ProductMetadata meta = new ProductMetadata(id, name, price, unit, weightKg, farm, place);
        CATALOG.put(id.toLowerCase(), meta);
        CATALOG.put(name.toLowerCase(), meta);
    }

    @Autowired
    public DeliveryChargeService(DeliveryPricingConfig pricingConfig) {
        this.pricingConfig = pricingConfig;
    }

    /**
     * Calculates dynamic delivery charge using trusted catalog prices, weights,
     * accurate road distances from multiple farmer pickup hubs, and configurable pricing rules.
     */
    public DeliveryCalculateResponse calculateDeliveryCharge(DeliveryCalculateRequest request) {
        DeliveryCalculateResponse response = new DeliveryCalculateResponse();

        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            response.setValid(false);
            response.setMessage("Cart is empty.");
            return response;
        }

        boolean isExpress = "express".equalsIgnoreCase(request.getDeliveryType());
        response.setDeliveryType(isExpress ? "express" : "standard");

        DeliveryAddressInput address = request.getDeliveryAddress();
        String destinationCity = resolveCityFromAddress(address);

        // Group items by unique farmer/cultivator to handle multi-farmer shipments
        Map<String, FarmerShipmentAccumulator> farmerShipmentMap = new LinkedHashMap<>();

        double totalSubtotal = 0.0;
        double overallWeight = 0.0;

        for (CartItemInput input : request.getItems()) {
            int qty = input.getQuantity();
            ProductMetadata meta = resolveProductMetadata(input);

            double unitPrice = meta != null ? meta.price : (input.getPrice() != null && input.getPrice() > 0 ? input.getPrice() : 350.0);
            double unitWeight = meta != null ? meta.weightKg : parseWeightFromUnit(input.getUnit());
            String farmName = meta != null ? meta.farm : (input.getFarm() != null && !input.getFarm().trim().isEmpty() ? input.getFarm().trim() : "Verified Cleanroom Farm");
            String pickupPlace = meta != null ? meta.place : (input.getPlace() != null && !input.getPlace().trim().isEmpty() ? input.getPlace().trim() : "Dehradun, Uttarakhand");
            String productName = meta != null ? meta.name : (input.getName() != null ? input.getName() : "Fresh Harvest Mushroom");

            double itemLineTotal = unitPrice * qty;
            double itemTotalWeight = unitWeight * qty;

            totalSubtotal += itemLineTotal;
            overallWeight += itemTotalWeight;

            // Farmer grouping key: combine farm name and pickup location
            String farmerKey = (farmName + "|" + pickupPlace).toLowerCase(Locale.ROOT);

            FarmerShipmentAccumulator acc = farmerShipmentMap.computeIfAbsent(farmerKey, k -> {
                FarmerShipmentAccumulator a = new FarmerShipmentAccumulator();
                a.farmName = farmName;
                a.pickupLocation = pickupPlace;
                return a;
            });

            acc.items.add(qty + "x " + productName);
            acc.itemCount += qty;
            acc.weightKg += itemTotalWeight;
            acc.subtotal += itemLineTotal;
        }

        double combinedBaseFee = 0.0;
        double combinedDistanceFee = 0.0;
        double combinedWeightFee = 0.0;
        double combinedExpressSurcharge = 0.0;
        double combinedCalculatedDeliveryFee = 0.0;

        List<ShipmentBreakdownDTO> shipmentBreakdowns = new ArrayList<>();

        for (FarmerShipmentAccumulator shipment : farmerShipmentMap.values()) {
            double distanceKm = estimateRoadDistanceKm(shipment.pickupLocation, destinationCity, address != null ? address.getPincode() : null);

            // 1. Base Delivery Charge
            double baseFee = pricingConfig.getBaseFee();

            // 2. Distance Charge: ₹8 per km
            double distanceFee = Math.round(distanceKm * pricingConfig.getPerKmFee() * 100.0) / 100.0;

            // 3. Weight Charge: ₹5 per additional kg above 2 kg
            double extraWeightKg = Math.max(0.0, shipment.weightKg - pricingConfig.getWeightThresholdKg());
            double weightFee = Math.ceil(extraWeightKg) * pricingConfig.getPerExtraKgFee();

            // 4. Express Surcharge: ₹40 if express selected
            double expressFee = isExpress ? pricingConfig.getExpressSurcharge() : 0.0;

            // Shipment delivery charge formula
            double shipmentFee = baseFee + distanceFee + weightFee + expressFee;

            combinedBaseFee += baseFee;
            combinedDistanceFee += distanceFee;
            combinedWeightFee += weightFee;
            combinedExpressSurcharge += expressFee;
            combinedCalculatedDeliveryFee += shipmentFee;

            ShipmentBreakdownDTO dto = new ShipmentBreakdownDTO();
            dto.setFarmName(shipment.farmName);
            dto.setFarmerName(shipment.farmName);
            dto.setPickupLocation(shipment.pickupLocation);
            dto.setItemNames(shipment.items);
            dto.setItemCount(shipment.itemCount);
            dto.setWeightKg(Math.round(shipment.weightKg * 100.0) / 100.0);
            dto.setDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
            dto.setBaseFee(baseFee);
            dto.setDistanceFee(distanceFee);
            dto.setWeightFee(weightFee);
            dto.setExpressSurcharge(expressFee);
            dto.setShipmentDeliveryFee(shipmentFee);
            dto.setShipmentSubtotal(shipment.subtotal);
            dto.setEstimatedTimeline(isExpress ? "Tomorrow by 11:00 AM (Cold-Chain Priority)" : "Within 24-48 Hours (Insulated Express)");

            shipmentBreakdowns.add(dto);
        }

        // Free Delivery Rule: If order value is ₹1,000 or above, apply free delivery
        boolean isFreeEligible = totalSubtotal >= pricingConfig.getFreeThreshold();
        double discount = isFreeEligible ? combinedCalculatedDeliveryFee : 0.0;
        double finalDeliveryCharge = Math.max(0.0, combinedCalculatedDeliveryFee - discount);
        double grandTotal = Math.round((totalSubtotal + finalDeliveryCharge) * 100.0) / 100.0;

        response.setValid(true);
        response.setMessage("Delivery charges calculated successfully.");
        response.setProductSubtotal(Math.round(totalSubtotal * 100.0) / 100.0);
        response.setTotalWeightKg(Math.round(overallWeight * 100.0) / 100.0);
        response.setTotalShipments(shipmentBreakdowns.size());
        response.setShipments(shipmentBreakdowns);

        response.setBaseFee(combinedBaseFee);
        response.setDistanceFee(combinedDistanceFee);
        response.setWeightFee(combinedWeightFee);
        response.setExpressSurcharge(combinedExpressSurcharge);
        response.setTotalCalculatedDeliveryFee(combinedCalculatedDeliveryFee);

        response.setFreeDeliveryEligible(isFreeEligible);
        response.setFreeDeliveryThreshold(pricingConfig.getFreeThreshold());
        response.setDiscount(discount);
        response.setFinalDeliveryCharge(finalDeliveryCharge);
        response.setGrandTotal(grandTotal);

        return response;
    }

    /**
     * Resolves product metadata using ID or name from trusted catalog.
     */
    private ProductMetadata resolveProductMetadata(CartItemInput input) {
        if (input == null) return null;
        if (input.getId() != null && CATALOG.containsKey(input.getId().toLowerCase())) {
            return CATALOG.get(input.getId().toLowerCase());
        }
        if (input.getName() != null) {
            String lower = input.getName().toLowerCase();
            for (Map.Entry<String, ProductMetadata> e : CATALOG.entrySet()) {
                if (lower.contains(e.getKey()) || e.getKey().contains(lower)) {
                    return e.getValue();
                }
            }
        }
        return null;
    }

    private double parseWeightFromUnit(String unit) {
        if (unit == null) return 1.0;
        String lower = unit.toLowerCase();
        if (lower.contains("250g")) return 0.25;
        if (lower.contains("500g")) return 0.50;
        if (lower.contains("kg")) return 1.0;
        return 1.0;
    }

    private String resolveCityFromAddress(DeliveryAddressInput addr) {
        if (addr == null) return "Bengaluru";
        if (addr.getCity() != null && !addr.getCity().trim().isEmpty()) {
            return addr.getCity().trim();
        }
        if (addr.getState() != null && !addr.getState().trim().isEmpty()) {
            return addr.getState().trim();
        }
        return "Bengaluru";
    }

    /**
     * Estimates road distance in kilometres between origin and destination without paid APIs.
     * Uses Haversine spherical distance on city coordinates scaled by average highway curvature (1.25x).
     */
    public double estimateRoadDistanceKm(String originPlace, String destinationPlace, String pincode) {
        double[] originCoords = extractCoordinates(originPlace, "dehradun");
        double[] destCoords = extractCoordinates(destinationPlace, null);

        if (destCoords == null && pincode != null && pincode.trim().length() >= 2) {
            destCoords = getCoordsFromPincode(pincode.trim().substring(0, 2));
        }

        if (destCoords == null) {
            destCoords = CITY_COORDINATES.get("bengaluru");
        }

        // If origin and destination resolve to the same city / coordinates
        if (Math.abs(originCoords[0] - destCoords[0]) < 0.05 && Math.abs(originCoords[1] - destCoords[1]) < 0.05) {
            // Local intra-city fresh cold-chain delivery distance (typically 12 - 18 km)
            return 15.0;
        }

        double straightLineKm = haversineDistance(originCoords[0], originCoords[1], destCoords[0], destCoords[1]);
        // Highway road curvature multiplier
        double roadDistance = straightLineKm * 1.25;

        // Sensible clamp for realistic Indian road network
        return Math.max(10.0, Math.round(roadDistance * 10.0) / 10.0);
    }

    private double[] extractCoordinates(String place, String fallbackCity) {
        if (place == null || place.trim().isEmpty()) {
            return fallbackCity != null ? CITY_COORDINATES.get(fallbackCity) : null;
        }
        String clean = place.toLowerCase().replaceAll("[^a-z\\s]", " ").trim();
        for (Map.Entry<String, double[]> entry : CITY_COORDINATES.entrySet()) {
            if (clean.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return fallbackCity != null ? CITY_COORDINATES.get(fallbackCity) : null;
    }

    private double[] getCoordsFromPincode(String prefix) {
        switch (prefix) {
            case "56": // Bengaluru / Karnataka
            case "57":
            case "58":
            case "59":
                return CITY_COORDINATES.get("bengaluru");
            case "11": // Delhi
            case "12":
            case "13":
                return CITY_COORDINATES.get("delhi");
            case "40": // Mumbai
            case "41": // Pune
                return CITY_COORDINATES.get("pune");
            case "60": // Chennai
            case "64": // Coimbatore / Nilgiris / Ooty
                return CITY_COORDINATES.get("ooty");
            case "50": // Hyderabad
                return CITY_COORDINATES.get("hyderabad");
            case "24": // Dehradun / Uttarakhand
                return CITY_COORDINATES.get("dehradun");
            case "17": // Himachal Pradesh / Solan
                return CITY_COORDINATES.get("solan");
            case "70": // Kolkata
                return CITY_COORDINATES.get("kolkata");
            case "38": // Ahmedabad
                return CITY_COORDINATES.get("ahmedabad");
            case "30": // Jaipur
                return CITY_COORDINATES.get("jaipur");
            default:
                return CITY_COORDINATES.get("bengaluru");
        }
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static class ProductMetadata {
        final String id;
        final String name;
        final double price;
        final String unit;
        final double weightKg;
        final String farm;
        final String place;

        ProductMetadata(String id, String name, double price, String unit, double weightKg, String farm, String place) {
            this.id = id;
            this.name = name;
            this.price = price;
            this.unit = unit;
            this.weightKg = weightKg;
            this.farm = farm;
            this.place = place;
        }
    }

    private static class FarmerShipmentAccumulator {
        String farmName;
        String pickupLocation;
        List<String> items = new ArrayList<>();
        int itemCount = 0;
        double weightKg = 0.0;
        double subtotal = 0.0;
    }
}
