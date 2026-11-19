package com.mushroomhub.api.config;

import com.mushroomhub.api.model.*;
import com.mushroomhub.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository,
                                   ProductListingRepository productRepository,
                                   PlatformConfigRepository configRepository,
                                   ComplaintRepository complaintRepository,
                                   AdminActivityLogRepository activityLogRepository) {
        return args -> {
            // 1. Seed strictly the 4 allowed RBAC roles (BUYER, FARMER, ADMIN, SUPER_ADMIN)
            List<User> defaults = List.of(
                    new User("cultivater", "Bhanu Kiran Reddy", "bhanukiranreddy128@gmail.com", "password123", "Bhanu Kiran Reddy Mushroom Farm", "+91 98450 12890", "Dehradun, Uttarakhand", "cloud"),
                    new User("cultivater", "Vikram R. Sharma", "cultivator@mushroomhub.com", "password123", "Himalayan Forest Spores & Myco Farm", "+91 98450 12890", "Dehradun, Uttarakhand", "cloud"),
                    new User("customer", "Ananya Iyer", "customer@mushroomhub.com", "password123", "Gourmet Kitchens & Retail", "+91 97120 44589", "Bengaluru, Karnataka", "Flat 402, Green Glen Layout, Outer Ring Road", "Bengaluru", "Karnataka", "560103", "Prefers fresh Blue Oyster & Lion's Mane, morning delivery", "cloud"),
                    new User("admin", "Siddharth Sen", "admin@mushroomhub.com", "password123", "", "+91 98110 44321", "New Delhi, Operations Center", "cloud"),
                    new User("superadmin", "Chief Administrator", "superadmin@mushroomhub.com", "password123", "", "+91 98100 00001", "National HQ, Security Center", "cloud")
            );

            for (User def : defaults) {
                def.setAccountStatus("ACTIVE");
                def.setVerificationStatus("APPROVED");
                if ("cultivater".equalsIgnoreCase(def.getRole())) {
                    def.setFssaiNumber("10022011002341");
                    def.setFarmScale("14,000 sq ft Commercial Units");
                    def.setCertifications("Jaivik Bharat Organic, FSSAI Food Safety, GAP Harmonized");
                }
                if (!userRepository.existsByEmailIgnoreCaseAndRole(def.getEmail(), def.getRole())) {
                    userRepository.save(def);
                }
            }

            // 2. Seed Platform Config if missing
            if (configRepository.count() == 0) {
                PlatformConfig config = new PlatformConfig();
                config.setId(1L);
                config.setPlatformName("MushroomHub");
                config.setBaseDeliveryFee(30.0);
                config.setDistanceFeePerKm(8.0);
                config.setWeightFeePerKg(5.0);
                config.setExpressSurcharge(40.0);
                config.setFreeDeliveryThreshold(1000.0);
                config.setPlatformCommissionPercent(0.0);
                configRepository.save(config);
            }

            // 3. Seed Products if empty
            if (productRepository.count() == 0) {
                productRepository.saveAll(List.of(
                        new ProductListing("prod-oyster", "Blue Oyster Mushrooms", "Oyster", "Himalayan Forest Spores & Myco Farm", "cultivator@mushroomhub.com", "Dehradun, Uttarakhand", 350.0, "kg", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"),
                        new ProductListing("prod-shiitake", "Forest Shiitake", "Shiitake", "Nilgiri Mist Mycology Highlands", "anita.myco@nilgirifungi.in", "Ooty, Tamil Nadu", 550.0, "kg", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"),
                        new ProductListing("prod-lion-mane", "Lion's Mane Pom-Pom", "Specialty", "Himalayan Forest Spores & Myco Farm", "cultivator@mushroomhub.com", "Dehradun, Uttarakhand", 650.0, "kg", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"),
                        new ProductListing("prod-cremini", "Cremini & Button Caps", "Cremini", "Sahyadri Precision Button & Cremini Agro", "patil.grower@sahyadrifarms.com", "Pune, Maharashtra", 240.0, "kg", "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&auto=format&fit=crop&q=80")
                ));
            }

            // 4. Seed Sample Complaints if empty
            if (complaintRepository.count() == 0) {
                complaintRepository.save(new Complaint(
                        "CMP-1001",
                        "customer@mushroomhub.com",
                        "Ananya Iyer",
                        "customer",
                        "DELIVERY",
                        "Cold-chain temperature check on express delivery",
                        "The delivery was delivered promptly, but we wanted to confirm temperature logger compliance during transit."
                ));
            }

            // 5. Seed Initial System Audit Log
            if (activityLogRepository.count() == 0) {
                activityLogRepository.save(new AdminActivityLog(
                        "superadmin@mushroomhub.com",
                        "superadmin",
                        "SYSTEM_INITIALIZATION",
                        "CONFIG",
                        "1",
                        "RBAC System initialized with strict 4 roles (BUYER, FARMER, ADMIN, SUPER_ADMIN)"
                ));
            }
        };
    }
}
