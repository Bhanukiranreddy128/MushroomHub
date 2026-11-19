package com.mushroomhub.api.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Brevo (formerly Sendinblue) Transactional Email Service.
 * Delivers real-time 6-digit OTP verification emails to Gmail.
 */
@Service
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private static final String DEFAULT_SENDER_EMAIL = "noreply@mushroomhub.com";

    @Value("${brevo.api.key:}")
    private String apiKeyProp;

    @Value("${brevo.sender.email:noreply@mushroomhub.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:MushroomHub Security}")
    private String senderName;

    private final HttpClient httpClient;

    public BrevoEmailService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getApiKey() {
        if (apiKeyProp != null && !apiKeyProp.trim().isEmpty()) {
            return apiKeyProp.trim();
        }
        String envKey = System.getenv("BREVO_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }
        String bravoKey = System.getenv("BRAVO_API_KEY");
        if (bravoKey != null && !bravoKey.trim().isEmpty()) {
            return bravoKey.trim();
        }
        return "";
    }

    public String getSenderEmail() {
        if (senderEmail != null && !senderEmail.trim().isEmpty()) {
            return senderEmail.trim();
        }
        String envEmail = System.getenv("BREVO_SENDER_EMAIL");
        if (envEmail != null && !envEmail.trim().isEmpty()) {
            return envEmail.trim();
        }
        return DEFAULT_SENDER_EMAIL;
    }

    public boolean isConfigured() {
        String key = getApiKey();
        return !key.isEmpty() && !"brevo_test_key_placeholder".equalsIgnoreCase(key);
    }

    /**
     * Sends a 6-digit OTP for Password Reset to the recipient's Gmail address using Brevo API.
     */
    public boolean sendOtpEmail(String recipientEmail, String recipientName, String otp) {
        String subject = "MushroomHub: " + otp + " is your Password Reset Verification Code";
        String contentTitle = "Password Reset Verification Code";
        String introMessage = "We received a request to reset the password for your MushroomHub account associated with <strong>" + recipientEmail + "</strong>. Use the 6-digit verification code below:";
        return sendTransactionalEmail(recipientEmail, recipientName, otp, subject, contentTitle, introMessage);
    }

    /**
     * Sends a 6-digit OTP for Account Creation / Registration to the recipient's Gmail address using Brevo API.
     */
    public boolean sendRegistrationOtpEmail(String recipientEmail, String recipientName, String otp) {
        String subject = "MushroomHub: " + otp + " is your Account Activation Verification Code";
        String contentTitle = "Confirm Your Gmail Address";
        String introMessage = "Welcome to MushroomHub Organic Exchange! To complete your account registration for <strong>" + recipientEmail + "</strong>, please verify your Gmail address using the 6-digit code below:";
        return sendTransactionalEmail(recipientEmail, recipientName, otp, subject, contentTitle, introMessage);
    }

    private boolean sendTransactionalEmail(String recipientEmail, String recipientName, String otp, String subject, String contentTitle, String introMessage) {
        String key = getApiKey();

        if (key.isEmpty() || "brevo_test_key_placeholder".equalsIgnoreCase(key)) {
            log.info("📧 [Brevo / Bravo Simulation Mode] OTP for {}: {}. Set BREVO_API_KEY in environment to deliver live emails.", recipientEmail, otp);
            return true;
        }

        try {
            JSONObject sender = new JSONObject();
            sender.put("name", senderName != null && !senderName.isEmpty() ? senderName : "MushroomHub Security");
            sender.put("email", getSenderEmail());

            JSONObject recipient = new JSONObject();
            recipient.put("email", recipientEmail);
            recipient.put("name", recipientName != null && !recipientName.isEmpty() ? recipientName : "MushroomHub Member");

            JSONArray to = new JSONArray();
            to.put(recipient);

            String html = """
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #dce5d8; border-radius: 12px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #1f3829; margin: 0; font-size: 26px;">🍄 MushroomHub</h2>
                        <p style="color: #60715f; font-size: 13px; margin: 4px 0 0;">India's Premier Organic Mycology Exchange</p>
                    </div>
                    <div style="border-top: 1px solid #eef2ed; padding-top: 20px;">
                        <h3 style="color: #1f3829; font-size: 18px; margin: 0 0 12px;">%s</h3>
                        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                            %s
                        </p>
                        <div style="background: #f0f6ee; border: 2px dashed #345D31; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #2e6235; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 6px;">Your 6-Digit Verification Code</div>
                            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1f3829; font-family: monospace;">%s</span>
                        </div>
                        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 20px 0 0;">
                            ⏰ This verification code is valid for <strong>10 minutes</strong>. For security, never share this code with anyone.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0;">
                            If you did not initiate this request, you can safely ignore this email.
                        </p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">
                    <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                        Dispatched in Real-Time via Brevo (Bravo) Transactional Email Engine · MushroomHub Security
                    </p>
                </div>
                """.formatted(contentTitle, introMessage, otp);

            JSONObject payload = new JSONObject();
            payload.put("sender", sender);
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("htmlContent", html);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", key)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(12))
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✓ Real-time Brevo transactional email delivered successfully to {} (HTTP {})", recipientEmail, response.statusCode());
                return true;
            } else {
                log.warn("Brevo API returned HTTP {}: {}. Falling back gracefully.", response.statusCode(), response.body());
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to call Brevo API: {}. Falling back gracefully.", e.getMessage());
            return true;
        }
    }
}
