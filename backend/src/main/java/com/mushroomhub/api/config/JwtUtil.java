package com.mushroomhub.api.config;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Component
public class JwtUtil {

    private final String secretKey;
    private static final long EXPIRATION_TIME_MS = 7 * 24 * 60 * 60 * 1000L; // 7 days

    public JwtUtil(@Value("${jwt.secret:}") String secret) {
        if (secret != null && !secret.trim().isEmpty()) {
            this.secretKey = secret.trim();
        } else {
            String envSecret = System.getenv("JWT_SECRET");
            if (envSecret != null && !envSecret.trim().isEmpty()) {
                this.secretKey = envSecret.trim();
            } else {
                this.secretKey = "MushroomHub_Dev_Secret_Key_For_Jwt_Token_Signing_Only_Do_Not_Use_In_Prod_2026!";
            }
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Error signing JWT token", e);
        }
    }

    public String generateToken(String email, String role, String name, Long userId) {
        long now = System.currentTimeMillis();
        long exp = now + EXPIRATION_TIME_MS;

        JSONObject header = new JSONObject();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        JSONObject payload = new JSONObject();
        payload.put("sub", email);
        payload.put("email", email);
        payload.put("role", role);
        payload.put("name", name != null ? name : "");
        payload.put("userId", userId != null ? userId : 0L);
        payload.put("iat", now / 1000);
        payload.put("exp", exp / 1000);

        String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(header.toString().getBytes(StandardCharsets.UTF_8));
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.toString().getBytes(StandardCharsets.UTF_8));
        String unsignedToken = encodedHeader + "." + encodedPayload;
        String signature = sign(unsignedToken);

        return unsignedToken + "." + signature;
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            String unsignedToken = parts[0] + "." + parts[1];
            String expectedSignature = sign(unsignedToken);

            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            // Check expiration
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JSONObject payload = new JSONObject(payloadJson);
            long exp = payload.optLong("exp", 0);
            return exp * 1000 > System.currentTimeMillis();
        } catch (Exception e) {
            return false;
        }
    }

    public JSONObject parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            return new JSONObject(payloadJson);
        } catch (Exception e) {
            return null;
        }
    }

    public String getRole(String token) {
        JSONObject payload = parseToken(token);
        return payload != null ? payload.optString("role", null) : null;
    }

    public String getEmail(String token) {
        JSONObject payload = parseToken(token);
        return payload != null ? payload.optString("email", null) : null;
    }

    public String getName(String token) {
        JSONObject payload = parseToken(token);
        return payload != null ? payload.optString("name", null) : null;
    }

    public static String mapRoleToAuthority(String role) {
        if (role == null) return "ROLE_BUYER";
        String r = role.trim().toLowerCase();
        return switch (r) {
            case "superadmin" -> "ROLE_SUPER_ADMIN";
            case "admin" -> "ROLE_ADMIN";
            case "cultivater", "cultivator" -> "ROLE_FARMER";
            default -> "ROLE_BUYER";
        };
    }
}
