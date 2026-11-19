package com.mushroomhub.api.controller;

import com.mushroomhub.api.model.CustomerOrder;
import com.mushroomhub.api.model.ProductListing;
import com.mushroomhub.api.model.User;
import com.mushroomhub.api.repository.CustomerOrderRepository;
import com.mushroomhub.api.repository.ProductListingRepository;
import com.mushroomhub.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cultivator")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('FARMER', 'ADMIN', 'SUPER_ADMIN')")
public class CultivatorProductController {

    private final ProductListingRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerOrderRepository orderRepository;

    public CultivatorProductController(ProductListingRepository productRepository,
                                       UserRepository userRepository,
                                       CustomerOrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Obtains the authenticated cultivator from the Spring Security context.
     * The farmer identity is NEVER trusted from client payload.
     */
    private User getAuthenticatedCultivator() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized: Authentication required.");
        }

        String principal = auth.getPrincipal().toString().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(principal);

        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found in database.");
        }

        User user = userOpt.get();
        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
        if (!"cultivater".equals(role) && !"cultivator".equals(role) && !"admin".equals(role) && !"superadmin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: User does not have cultivator access.");
        }

        return user;
    }

    // =========================================================================
    // CULTIVATOR PRODUCT OPERATIONS (STRICTLY ISOLATED TO OWNER)
    // =========================================================================

    /**
     * Lists ONLY the products belonging to the authenticated cultivator.
     */
    @GetMapping("/products")
    public ResponseEntity<?> getMyProducts() {
        User cultivator = getAuthenticatedCultivator();
        List<ProductListing> products = productRepository.findByFarmerEmailIgnoreCaseOrderByCreatedAtDesc(cultivator.getEmail());
        return ResponseEntity.ok(products);
    }

    /**
     * Retrieves details of a specific product with backend ownership validation.
     */
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductById(@PathVariable("productId") String productId) {
        User cultivator = getAuthenticatedCultivator();
        Optional<ProductListing> opt = productRepository.findByProductId(productId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Product listing not found."));
        }

        ProductListing product = opt.get();
        // Strict ownership check: Cultivator A cannot view Cultivator B's product details in private portal
        if (!cultivator.getEmail().equalsIgnoreCase(product.getFarmerEmail()) &&
                !"admin".equalsIgnoreCase(cultivator.getRole()) &&
                !"superadmin".equalsIgnoreCase(cultivator.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Forbidden: You do not own this product listing."));
        }

        return ResponseEntity.ok(product);
    }

    /**
     * Adds a new product linked strictly to the authenticated cultivator.
     * Overwrites any client-supplied farmer ID or email with authenticated identity.
     */
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Map<String, Object> body) {
        User cultivator = getAuthenticatedCultivator();

        String name = body.get("name") != null ? body.get("name").toString().trim() : "";
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Product variety name is required."));
        }

        Double price = 350.0;
        if (body.get("price") != null) {
            try { price = Double.parseDouble(body.get("price").toString()); } catch (NumberFormatException ignored) {}
        }

        Double stock = 25.0;
        if (body.get("stockQuantity") != null) {
            try { stock = Double.parseDouble(body.get("stockQuantity").toString()); } catch (NumberFormatException ignored) {}
        } else if (body.get("stock") != null) {
            try { stock = Double.parseDouble(body.get("stock").toString()); } catch (NumberFormatException ignored) {}
        }

        String unit = body.get("unit") != null ? body.get("unit").toString().trim() : "kg";
        String category = body.get("category") != null ? body.get("category").toString().trim()
                : (body.get("type") != null ? body.get("type").toString().trim() : "Oyster");
        String imageUrl = body.get("imageUrl") != null ? body.get("imageUrl").toString() : null;
        String harvestDate = body.get("harvestDate") != null ? body.get("harvestDate").toString() : "Today, Morning Pick";

        String productId = "prod-" + UUID.randomUUID().toString().substring(0, 8);

        ProductListing listing = new ProductListing();
        listing.setProductId(productId);
        listing.setName(name);
        listing.setCategory(category);

        // BACKEND ENFORCED OWNERSHIP: Always derived from the authenticated User entity
        listing.setFarmerEmail(cultivator.getEmail());
        String effectiveFarm = cultivator.getFarmName() != null && !cultivator.getFarmName().isEmpty()
                ? cultivator.getFarmName()
                : (body.get("farmName") != null && !body.get("farmName").toString().trim().isEmpty()
                    ? body.get("farmName").toString().trim()
                    : cultivator.getName() + " Farm");
        listing.setFarmName(effectiveFarm);
        listing.setFarmerPhone(cultivator.getPhone() != null ? cultivator.getPhone() : "");
        String effectiveLocation = cultivator.getLocation() != null && !cultivator.getLocation().isEmpty()
                ? cultivator.getLocation()
                : (body.get("location") != null && !body.get("location").toString().trim().isEmpty()
                    ? body.get("location").toString().trim()
                    : "India");
        listing.setLocation(effectiveLocation);

        if (body.get("description") != null) {
            listing.setModerationNotes(body.get("description").toString().trim());
        }

        listing.setPrice(price);
        listing.setStockQuantity(stock);
        listing.setUnit(unit);
        listing.setImageUrl(imageUrl);
        listing.setHarvestDate(harvestDate);
        listing.setStatus("APPROVED");
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());

        ProductListing saved = productRepository.save(listing);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Product listed successfully and linked to your farm.",
                "product", saved
        ));
    }

    /**
     * Updates an existing product with backend ownership validation.
     */
    @PutMapping("/products/{productId}")
    public ResponseEntity<?> updateProduct(@PathVariable("productId") String productId, @RequestBody Map<String, Object> body) {
        User cultivator = getAuthenticatedCultivator();
        Optional<ProductListing> opt = productRepository.findByProductId(productId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Product listing not found."));
        }

        ProductListing product = opt.get();
        // Strict ownership check
        if (!cultivator.getEmail().equalsIgnoreCase(product.getFarmerEmail()) &&
                !"admin".equalsIgnoreCase(cultivator.getRole()) &&
                !"superadmin".equalsIgnoreCase(cultivator.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Forbidden: You do not have permission to modify another cultivator's product."));
        }

        if (body.containsKey("name")) product.setName(body.get("name").toString().trim());
        if (body.containsKey("category")) product.setCategory(body.get("category").toString().trim());
        else if (body.containsKey("type")) product.setCategory(body.get("type").toString().trim());

        if (body.containsKey("price")) {
            try { product.setPrice(Double.parseDouble(body.get("price").toString())); } catch (NumberFormatException ignored) {}
        }
        if (body.containsKey("stockQuantity")) {
            try { product.setStockQuantity(Double.parseDouble(body.get("stockQuantity").toString())); } catch (NumberFormatException ignored) {}
        } else if (body.containsKey("stock")) {
            try { product.setStockQuantity(Double.parseDouble(body.get("stock").toString())); } catch (NumberFormatException ignored) {}
        }
        if (body.containsKey("unit")) product.setUnit(body.get("unit").toString().trim());
        if (body.containsKey("imageUrl")) product.setImageUrl(body.get("imageUrl").toString());
        if (body.containsKey("harvestDate")) product.setHarvestDate(body.get("harvestDate").toString());
        if (body.containsKey("description")) product.setModerationNotes(body.get("description").toString().trim());

        if (body.containsKey("status")) {
            String s = body.get("status").toString().trim();
            if ("Sold Out".equalsIgnoreCase(s) || "OUT_OF_STOCK".equalsIgnoreCase(s)) {
                product.setStatus("OUT_OF_STOCK");
            } else if ("In Stock".equalsIgnoreCase(s) || "APPROVED".equalsIgnoreCase(s)) {
                product.setStatus("APPROVED");
            }
        }

        product.setUpdatedAt(LocalDateTime.now());
        ProductListing updated = productRepository.save(product);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product updated successfully.",
                "product", updated
        ));
    }

    /**
     * Deletes a product with backend ownership validation.
     */
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<?> deleteProduct(@PathVariable("productId") String productId) {
        User cultivator = getAuthenticatedCultivator();
        Optional<ProductListing> opt = productRepository.findByProductId(productId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Product listing not found."));
        }

        ProductListing product = opt.get();
        // Strict ownership check
        if (!cultivator.getEmail().equalsIgnoreCase(product.getFarmerEmail()) &&
                !"admin".equalsIgnoreCase(cultivator.getRole()) &&
                !"superadmin".equalsIgnoreCase(cultivator.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Forbidden: You do not have permission to delete another cultivator's product."));
        }

        productRepository.delete(product);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product deleted successfully from your farm listings."
        ));
    }

    /**
     * Updates stock and availability with backend ownership validation.
     */
    @PatchMapping("/products/{productId}/stock")
    public ResponseEntity<?> updateStock(@PathVariable("productId") String productId, @RequestBody Map<String, Object> body) {
        User cultivator = getAuthenticatedCultivator();
        Optional<ProductListing> opt = productRepository.findByProductId(productId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Product listing not found."));
        }

        ProductListing product = opt.get();
        if (!cultivator.getEmail().equalsIgnoreCase(product.getFarmerEmail()) &&
                !"admin".equalsIgnoreCase(cultivator.getRole()) &&
                !"superadmin".equalsIgnoreCase(cultivator.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "error", "Forbidden: You cannot modify stock for another cultivator's product."));
        }

        if (body.containsKey("stockQuantity")) {
            try { product.setStockQuantity(Double.parseDouble(body.get("stockQuantity").toString())); } catch (NumberFormatException ignored) {}
        } else if (body.containsKey("stock")) {
            try { product.setStockQuantity(Double.parseDouble(body.get("stock").toString())); } catch (NumberFormatException ignored) {}
        }

        if (body.containsKey("status")) {
            String s = body.get("status").toString().trim();
            if ("Sold Out".equalsIgnoreCase(s) || "OUT_OF_STOCK".equalsIgnoreCase(s)) {
                product.setStatus("OUT_OF_STOCK");
            } else if ("In Stock".equalsIgnoreCase(s) || "APPROVED".equalsIgnoreCase(s)) {
                product.setStatus("APPROVED");
            }
        }

        product.setUpdatedAt(LocalDateTime.now());
        ProductListing updated = productRepository.save(product);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Stock updated successfully.",
                "product", updated
        ));
    }

    // =========================================================================
    // CULTIVATOR ORDERS & DASHBOARD ANALYTICS (STRICTLY ISOLATED)
    // =========================================================================

    /**
     * Lists ONLY orders belonging to this cultivator's farm shipments.
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getMyOrders() {
        User cultivator = getAuthenticatedCultivator();
        String farmName = cultivator.getFarmName() != null ? cultivator.getFarmName().trim().toLowerCase() : "";
        String email = cultivator.getEmail() != null ? cultivator.getEmail().trim().toLowerCase() : "";
        String name = cultivator.getName() != null ? cultivator.getName().trim().toLowerCase() : "";
        String role = cultivator.getRole() != null ? cultivator.getRole().trim().toLowerCase() : "";

        List<CustomerOrder> allOrders = orderRepository.findAll();
        if ("admin".equalsIgnoreCase(role) || "superadmin".equalsIgnoreCase(role)) {
            return ResponseEntity.ok(allOrders);
        }

        List<CustomerOrder> myOrders = allOrders.stream().filter(order -> {
            if (farmName.length() > 2 && order.getPickupLocation() != null && order.getPickupLocation().toLowerCase().contains(farmName)) {
                return true;
            }
            if (farmName.length() > 2 && order.getShipmentsJson() != null && order.getShipmentsJson().toLowerCase().contains(farmName)) {
                return true;
            }
            if (order.getItemsJson() != null && (order.getItemsJson().toLowerCase().contains(email) ||
                    (farmName.length() > 2 && order.getItemsJson().toLowerCase().contains(farmName)))) {
                return true;
            }
            if (name.length() > 2 && order.getItemsJson() != null && order.getItemsJson().toLowerCase().contains(name)) {
                return true;
            }
            // Fallback for default demo orders / default farm
            if (order.getPickupLocation() != null && order.getPickupLocation().toLowerCase().contains("himalayan") &&
                    ("cultivator@mushroomhub.com".equalsIgnoreCase(email) || farmName.isEmpty() || farmName.contains("himalayan"))) {
                return true;
            }
            return false;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(myOrders);
    }

    /**
     * Dashboard summary metrics strictly scoped to the logged-in cultivator.
     */
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        User cultivator = getAuthenticatedCultivator();
        List<ProductListing> products = productRepository.findByFarmerEmailIgnoreCaseOrderByCreatedAtDesc(cultivator.getEmail());

        long totalListings = products.size();
        long inStockCount = products.stream().filter(p -> "APPROVED".equalsIgnoreCase(p.getStatus()) && p.getStockQuantity() > 0).count();
        double totalStockKg = products.stream().mapToDouble(ProductListing::getStockQuantity).sum();

        return ResponseEntity.ok(Map.of(
                "farmName", cultivator.getFarmName() != null ? cultivator.getFarmName() : cultivator.getName() + " Farm",
                "farmerEmail", cultivator.getEmail(),
                "totalListings", totalListings,
                "inStockCount", inStockCount,
                "totalStockKg", totalStockKg,
                "verificationStatus", cultivator.getVerificationStatus() != null ? cultivator.getVerificationStatus() : "APPROVED"
        ));
    }
}
