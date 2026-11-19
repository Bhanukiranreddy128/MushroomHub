package com.mushroomhub.api.controller;

import com.mushroomhub.api.config.DeliveryPricingConfig;
import com.mushroomhub.api.dto.DeliveryCalculateRequest;
import com.mushroomhub.api.dto.DeliveryCalculateResponse;
import com.mushroomhub.api.service.DeliveryChargeService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery")
@CrossOrigin(origins = "*")
public class DeliveryController {

    private final DeliveryChargeService deliveryChargeService;
    private final DeliveryPricingConfig pricingConfig;

    @Autowired
    public DeliveryController(DeliveryChargeService deliveryChargeService, DeliveryPricingConfig pricingConfig) {
        this.deliveryChargeService = deliveryChargeService;
        this.pricingConfig = pricingConfig;
    }

    @PostMapping("/calculate")
    public ResponseEntity<DeliveryCalculateResponse> calculateDelivery(@RequestBody DeliveryCalculateRequest request) {
        DeliveryCalculateResponse response = deliveryChargeService.calculateDeliveryCharge(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rules")
    public ResponseEntity<Map<String, Object>> getPricingRules() {
        return ResponseEntity.ok(Map.of(
            "baseFee", pricingConfig.getBaseFee(),
            "perKmFee", pricingConfig.getPerKmFee(),
            "weightThresholdKg", pricingConfig.getWeightThresholdKg(),
            "perExtraKgFee", pricingConfig.getPerExtraKgFee(),
            "expressSurcharge", pricingConfig.getExpressSurcharge(),
            "freeThreshold", pricingConfig.getFreeThreshold()
        ));
    }
}
