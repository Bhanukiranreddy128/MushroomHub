package com.mushroomhub.api.config;

import com.razorpay.RazorpayClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    @Value("${razorpay.key.id:}")
    private String keyIdProp;

    @Value("${razorpay.key.secret:}")
    private String keySecretProp;

    public String getKeyId() {
        if (keyIdProp != null && !keyIdProp.trim().isEmpty()) {
            return keyIdProp.trim();
        }
        String env = System.getenv("RAZORPAY_KEY_ID");
        return env != null ? env.trim() : "";
    }

    public String getKeySecret() {
        if (keySecretProp != null && !keySecretProp.trim().isEmpty()) {
            return keySecretProp.trim();
        }
        String env = System.getenv("RAZORPAY_KEY_SECRET");
        return env != null ? env.trim() : "";
    }

    public boolean isConfigured() {
        return !getKeyId().isEmpty() && !getKeySecret().isEmpty();
    }

    @Bean
    public RazorpayClient razorpayClient() {
        String key = getKeyId();
        String secret = getKeySecret();

        if (key.isEmpty() || secret.isEmpty() || "rzp_test_placeholder".equalsIgnoreCase(key)) {
            log.warn("⚠️ Razorpay Key ID or Secret is not configured. RazorpayClient bean will be null.");
            return null;
        }

        try {
            log.info("✓ Initializing Razorpay Client in TEST MODE (Key ID: {}...)", key.substring(0, Math.min(12, key.length())));
            return new RazorpayClient(key, secret);
        } catch (Exception e) {
            log.error("Failed to initialize RazorpayClient: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize Razorpay client", e);
        }
    }
}
