package com.mushroomhub.api.controller;

import com.mushroomhub.api.config.RazorpayConfig;
import com.mushroomhub.api.dto.CreatePaymentOrderRequest;
import com.mushroomhub.api.dto.CreatePaymentOrderResponse;
import com.mushroomhub.api.dto.PaymentFailureRequest;
import com.mushroomhub.api.dto.PaymentVerificationRequest;
import com.mushroomhub.api.service.RazorpayService;
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
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final RazorpayService razorpayService;
    private final RazorpayConfig razorpayConfig;

    @Autowired
    public PaymentController(RazorpayService razorpayService, RazorpayConfig razorpayConfig) {
        this.razorpayService = razorpayService;
        this.razorpayConfig = razorpayConfig;
    }

    /**
     * Exposes ONLY the public Razorpay Key ID (never the Secret Key).
     */
    @GetMapping("/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        return ResponseEntity.ok(Map.of(
            "keyId", razorpayConfig.getKeyId(),
            "mode", "TEST_MODE"
        ));
    }

    /**
     * Creates a verified Razorpay order using server-side computed grand total.
     */
    @PostMapping("/create-order")
    public ResponseEntity<CreatePaymentOrderResponse> createOrder(@RequestBody CreatePaymentOrderRequest request) {
        CreatePaymentOrderResponse response = razorpayService.createRazorpayOrder(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verifies HMAC-SHA256 signature and updates order + payment status in PostgreSQL.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        boolean verified = razorpayService.verifyPaymentSignature(request);
        return ResponseEntity.ok(Map.of(
            "verified", verified,
            "orderId", request.getOrderId() != null ? request.getOrderId() : "",
            "message", verified ? "Payment verified successfully. Order confirmed!" : "Payment signature verification failed."
        ));
    }

    /**
     * Records payment failure or user cancellation.
     */
    @PostMapping("/failure")
    public ResponseEntity<Map<String, String>> handlePaymentFailure(@RequestBody PaymentFailureRequest request) {
        razorpayService.recordPaymentFailure(request);
        return ResponseEntity.ok(Map.of("status", "recorded"));
    }
}
