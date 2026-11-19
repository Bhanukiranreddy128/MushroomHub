package com.mushroomhub.api.service;

import com.mushroomhub.api.config.DeliveryPricingConfig;
import com.mushroomhub.api.dto.CartItemInput;
import com.mushroomhub.api.dto.DeliveryAddressInput;
import com.mushroomhub.api.dto.DeliveryCalculateRequest;
import com.mushroomhub.api.dto.DeliveryCalculateResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class DeliveryChargeServiceTest {

    private DeliveryChargeService service;
    private DeliveryPricingConfig config;

    @BeforeEach
    void setUp() {
        config = new DeliveryPricingConfig();
        config.setBaseFee(30.0);
        config.setPerKmFee(8.0);
        config.setWeightThresholdKg(2.0);
        config.setPerExtraKgFee(5.0);
        config.setExpressSurcharge(40.0);
        config.setFreeThreshold(1000.0);

        service = new DeliveryChargeService(config);
    }

    @Test
    void testStandardDelivery_Under1000_Under2kg() {
        DeliveryCalculateRequest request = new DeliveryCalculateRequest();
        request.setDeliveryType("standard");

        CartItemInput item = new CartItemInput();
        item.setId("oyster");
        item.setName("Blue Oyster Mushrooms");
        item.setQuantity(1); // 1kg
        item.setPrice(350.0); // Subtotal = 350 (< 1000)
        item.setUnit("kg");
        request.setItems(List.of(item));

        DeliveryAddressInput address = new DeliveryAddressInput();
        address.setCity("Dehradun"); // Same city = 15 km local delivery
        request.setDeliveryAddress(address);

        DeliveryCalculateResponse response = service.calculateDeliveryCharge(request);

        assertTrue(response.isValid());
        assertEquals(350.0, response.getProductSubtotal());
        assertEquals(1.0, response.getTotalWeightKg());
        assertEquals(1, response.getTotalShipments());

        // Base Fee: 30
        assertEquals(30.0, response.getBaseFee());
        // Distance Fee: 15 km * 8 = 120
        assertEquals(120.0, response.getDistanceFee());
        // Weight Fee (1kg <= 2kg): 0
        assertEquals(0.0, response.getWeightFee());
        // Express Fee: 0
        assertEquals(0.0, response.getExpressSurcharge());
        // Total Delivery Fee: 30 + 120 = 150
        assertEquals(150.0, response.getTotalCalculatedDeliveryFee());

        assertFalse(response.isFreeDeliveryEligible());
        assertEquals(0.0, response.getDiscount());
        assertEquals(150.0, response.getFinalDeliveryCharge());
        assertEquals(500.0, response.getGrandTotal()); // 350 + 150 = 500
    }

    @Test
    void testExtraWeightCharge_Above2kg() {
        DeliveryCalculateRequest request = new DeliveryCalculateRequest();
        request.setDeliveryType("standard");

        CartItemInput item = new CartItemInput();
        item.setId("cremini");
        item.setName("Cremini & Button");
        item.setQuantity(3); // 3kg -> 1kg extra above 2kg threshold
        item.setPrice(240.0); // Trusted price: 3 * 240 = 720 (< 1000 free threshold)
        item.setUnit("kg");
        request.setItems(List.of(item));

        DeliveryAddressInput address = new DeliveryAddressInput();
        address.setCity("Pune"); // Local Pune delivery = 15 km
        request.setDeliveryAddress(address);

        DeliveryCalculateResponse response = service.calculateDeliveryCharge(request);

        assertEquals(3.0, response.getTotalWeightKg());
        assertEquals(720.0, response.getProductSubtotal());
        // Extra weight = 3 - 2 = 1kg -> 1 * 5 = 5
        assertEquals(5.0, response.getWeightFee());
        // Base Fee = 30, Distance Fee = 15 * 8 = 120
        // Final Delivery Charge = 30 + 120 + 5 = 155
        assertEquals(155.0, response.getFinalDeliveryCharge());
        assertEquals(875.0, response.getGrandTotal()); // 720 + 155 = 875
    }

    @Test
    void testExpressDeliverySurcharge() {
        DeliveryCalculateRequest request = new DeliveryCalculateRequest();
        request.setDeliveryType("express"); // Express selected

        CartItemInput item = new CartItemInput();
        item.setId("oyster");
        item.setName("Blue Oyster Mushrooms");
        item.setQuantity(1);
        item.setPrice(350.0);
        item.setUnit("kg");
        request.setItems(List.of(item));

        DeliveryAddressInput address = new DeliveryAddressInput();
        address.setCity("Dehradun");
        request.setDeliveryAddress(address);

        DeliveryCalculateResponse response = service.calculateDeliveryCharge(request);

        assertEquals(40.0, response.getExpressSurcharge());
        // Delivery Fee = 30 (base) + 120 (dist) + 0 (wt) + 40 (express) = 190
        assertEquals(190.0, response.getFinalDeliveryCharge());
    }

    @Test
    void testFreeDelivery_OrdersAbove1000() {
        DeliveryCalculateRequest request = new DeliveryCalculateRequest();
        request.setDeliveryType("express");

        CartItemInput item = new CartItemInput();
        item.setId("lion-mane");
        item.setName("Lion’s Mane");
        item.setQuantity(2); // 2 * 650 = 1300 (> 1000)
        item.setPrice(650.0);
        item.setUnit("kg");
        request.setItems(List.of(item));

        DeliveryAddressInput address = new DeliveryAddressInput();
        address.setCity("Bengaluru");
        request.setDeliveryAddress(address);

        DeliveryCalculateResponse response = service.calculateDeliveryCharge(request);

        assertEquals(1300.0, response.getProductSubtotal());
        assertTrue(response.isFreeDeliveryEligible());
        assertTrue(response.getTotalCalculatedDeliveryFee() > 0);
        // Discount equals full calculated delivery fee
        assertEquals(response.getTotalCalculatedDeliveryFee(), response.getDiscount());
        assertEquals(0.0, response.getFinalDeliveryCharge());
        assertEquals(1300.0, response.getGrandTotal());
    }

    @Test
    void testMultiFarmerShipments_SeparateShipmentCharges() {
        DeliveryCalculateRequest request = new DeliveryCalculateRequest();
        request.setDeliveryType("standard");

        // Farmer 1: Himalayan Forest Spores Farm (Dehradun)
        CartItemInput item1 = new CartItemInput();
        item1.setId("oyster");
        item1.setName("Blue Oyster Mushrooms");
        item1.setQuantity(1);
        item1.setPrice(350.0);
        item1.setFarm("Himalayan Forest Spores Farm");
        item1.setPlace("Dehradun, Uttarakhand");

        // Farmer 2: Nilgiri Mycelium Growers (Ooty)
        CartItemInput item2 = new CartItemInput();
        item2.setId("shiitake");
        item2.setName("Forest Shiitake");
        item2.setQuantity(1);
        item2.setPrice(550.0);
        item2.setFarm("Nilgiri Mycelium Growers");
        item2.setPlace("Ooty, Tamil Nadu");

        request.setItems(List.of(item1, item2)); // Total subtotal = 350 + 550 = 900 (< 1000)

        DeliveryAddressInput address = new DeliveryAddressInput();
        address.setCity("Bengaluru");
        request.setDeliveryAddress(address);

        DeliveryCalculateResponse response = service.calculateDeliveryCharge(request);

        // Expect exactly 2 separate farmer shipments
        assertEquals(2, response.getTotalShipments());
        assertEquals(2, response.getShipments().size());

        // Each shipment has its own base fee (2 * 30 = 60)
        assertEquals(60.0, response.getBaseFee());
        assertTrue(response.getDistanceFee() > 0);
        assertEquals(900.0, response.getProductSubtotal());
        assertFalse(response.isFreeDeliveryEligible());
        assertEquals(response.getProductSubtotal() + response.getFinalDeliveryCharge(), response.getGrandTotal());
    }
}
