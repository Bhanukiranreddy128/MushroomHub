package com.mushroomhub.api.controller;

import com.mushroomhub.api.model.*;
import com.mushroomhub.api.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final CustomerOrderRepository orderRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final ProductListingRepository productRepository;
    private final ComplaintRepository complaintRepository;
    private final AdminActivityLogRepository activityLogRepository;

    public AdminController(UserRepository userRepository,
                           CustomerOrderRepository orderRepository,
                           PaymentTransactionRepository paymentRepository,
                           ProductListingRepository productRepository,
                           ComplaintRepository complaintRepository,
                           AdminActivityLogRepository activityLogRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.complaintRepository = complaintRepository;
        this.activityLogRepository = activityLogRepository;
    }

    private String getCurrentAdminEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            return auth.getPrincipal().toString();
        }
        return "admin@mushroomhub.com";
    }

    private void logActivity(String action, String targetType, String targetId, String details) {
        try {
            AdminActivityLog log = new AdminActivityLog(
                    getCurrentAdminEmail(),
                    "admin",
                    action,
                    targetType,
                    targetId,
                    details
            );
            activityLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

    // =========================================================================
    // MODULE 1: USER MANAGEMENT (Buyers and Farmers only)
    // =========================================================================

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<User> list = userRepository.findAllByRoleIn(List.of("customer", "cultivater"));

        if (role != null && !role.trim().isEmpty()) {
            String norm = "cultivator".equalsIgnoreCase(role) ? "cultivater" : role.trim().toLowerCase();
            list = list.stream().filter(u -> norm.equalsIgnoreCase(u.getRole())).collect(Collectors.toList());
        }

        if (status != null && !status.trim().isEmpty()) {
            list = list.stream().filter(u -> status.equalsIgnoreCase(u.getAccountStatus())).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(u ->
                    (u.getName() != null && u.getName().toLowerCase().contains(q)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                    (u.getPhone() != null && u.getPhone().toLowerCase().contains(q)) ||
                    (u.getFarmName() != null && u.getFarmName().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(list);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "User not found"));
        }

        User targetUser = userOpt.get();

        // Security Restriction: Admin cannot modify Super Admin or Admin accounts!
        if ("superadmin".equalsIgnoreCase(targetUser.getRole()) || "admin".equalsIgnoreCase(targetUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "error", "Permission Denied: Admin cannot modify administrative or Super Admin accounts. Only Super Admin can manage Admins."
            ));
        }

        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equalsIgnoreCase("ACTIVE") &&
                !newStatus.equalsIgnoreCase("DEACTIVATED") &&
                !newStatus.equalsIgnoreCase("SUSPENDED"))) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid status. Allowed: ACTIVE, DEACTIVATED, SUSPENDED"));
        }

        targetUser.setAccountStatus(newStatus.toUpperCase());
        User saved = userRepository.save(targetUser);

        logActivity("UPDATE_USER_STATUS", "USER", String.valueOf(id),
                "Changed status of user " + saved.getEmail() + " (" + saved.getRole() + ") to " + saved.getAccountStatus());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User account status updated to " + saved.getAccountStatus(),
                "user", saved
        ));
    }

    // =========================================================================
    // MODULE 2: FARMER VERIFICATION
    // =========================================================================

    @GetMapping("/farmers")
    public ResponseEntity<?> getFarmers(
            @RequestParam(required = false) String verificationStatus,
            @RequestParam(required = false) String search) {

        List<User> farmers = userRepository.findAllByRoleIn(List.of("cultivater", "cultivator", "farmer"));

        if (verificationStatus != null && !verificationStatus.trim().isEmpty()) {
            farmers = farmers.stream()
                    .filter(f -> verificationStatus.equalsIgnoreCase(f.getVerificationStatus()))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            farmers = farmers.stream().filter(f ->
                    (f.getName() != null && f.getName().toLowerCase().contains(q)) ||
                    (f.getEmail() != null && f.getEmail().toLowerCase().contains(q)) ||
                    (f.getFarmName() != null && f.getFarmName().toLowerCase().contains(q)) ||
                    (f.getLocation() != null && f.getLocation().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(farmers);
    }

    @PostMapping({"/farmers/{id}/verify", "/farmers/verify"})
    public ResponseEntity<?> verifyFarmer(@PathVariable(required = false) Long id, @RequestBody Map<String, String> body) {
        Optional<User> userOpt = Optional.empty();
        if (id != null && id > 0) {
            userOpt = userRepository.findById(id);
        }
        if (userOpt.isEmpty() && body.get("email") != null && !body.get("email").trim().isEmpty()) {
            userOpt = userRepository.findByEmailIgnoreCase(body.get("email").trim());
        }
        if (userOpt.isEmpty() && body.get("id") != null) {
            try {
                Long parsedId = Long.parseLong(body.get("id").trim());
                userOpt = userRepository.findById(parsedId);
            } catch (Exception ignored) {}
        }

        if (userOpt.isEmpty() || (!"cultivater".equalsIgnoreCase(userOpt.get().getRole()) && !"cultivator".equalsIgnoreCase(userOpt.get().getRole()) && !"farmer".equalsIgnoreCase(userOpt.get().getRole()))) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Farmer account not found"));
        }

        User farmer = userOpt.get();
        String status = body.get("status"); // APPROVED, REJECTED, PENDING
        String reason = body.get("rejectionReason");

        if (status == null || (!status.equalsIgnoreCase("APPROVED") &&
                !status.equalsIgnoreCase("REJECTED") &&
                !status.equalsIgnoreCase("PENDING"))) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid verification status. Allowed: APPROVED, REJECTED, PENDING"));
        }

        farmer.setVerificationStatus(status.toUpperCase());
        if ("REJECTED".equalsIgnoreCase(status)) {
            farmer.setRejectionReason(reason != null ? reason.trim() : "Documents or farm standards do not comply with platform food safety policies.");
        } else {
            farmer.setRejectionReason(null);
        }

        User saved = userRepository.save(farmer);

        logActivity("VERIFY_FARMER", "FARMER", String.valueOf(saved.getId()),
                "Updated verification status for " + saved.getFarmName() + " (" + saved.getEmail() + ") to " + saved.getVerificationStatus());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Farmer verification status updated to " + saved.getVerificationStatus(),
                "farmer", saved
        ));
    }

    // =========================================================================
    // MODULE 3: PRODUCT MANAGEMENT
    // =========================================================================

    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<ProductListing> products = productRepository.findAllByOrderByCreatedAtDesc();

        if (status != null && !status.trim().isEmpty()) {
            products = products.stream().filter(p -> status.equalsIgnoreCase(p.getStatus())).collect(Collectors.toList());
        }

        if (category != null && !category.trim().isEmpty()) {
            products = products.stream().filter(p -> category.equalsIgnoreCase(p.getCategory())).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            products = products.stream().filter(p ->
                    (p.getName() != null && p.getName().toLowerCase().contains(q)) ||
                    (p.getFarmName() != null && p.getFarmName().toLowerCase().contains(q)) ||
                    (p.getLocation() != null && p.getLocation().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(products);
    }

    @PostMapping("/products/{id}/status")
    public ResponseEntity<?> updateProductStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<ProductListing> prodOpt = productRepository.findById(id);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Product listing not found"));
        }

        ProductListing product = prodOpt.get();
        String status = body.get("status");
        String notes = body.get("moderationNotes");

        if (status == null || (!status.equalsIgnoreCase("APPROVED") &&
                !status.equalsIgnoreCase("REJECTED") &&
                !status.equalsIgnoreCase("PENDING"))) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid status. Allowed: APPROVED, REJECTED, PENDING"));
        }

        product.setStatus(status.toUpperCase());
        if (notes != null) product.setModerationNotes(notes.trim());

        ProductListing saved = productRepository.save(product);

        logActivity("MODERATE_PRODUCT", "PRODUCT", String.valueOf(id),
                "Updated product status for '" + saved.getName() + "' to " + saved.getStatus());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product listing status updated to " + saved.getStatus(),
                "product", saved
        ));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Optional<ProductListing> prodOpt = productRepository.findById(id);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Product listing not found"));
        }

        ProductListing product = prodOpt.get();
        productRepository.delete(product);

        logActivity("DELETE_PRODUCT", "PRODUCT", String.valueOf(id),
                "Removed inappropriate or invalid listing '" + product.getName() + "' by " + product.getFarmName());

        return ResponseEntity.ok(Map.of("success", true, "message", "Product listing removed successfully"));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(List.of(
                Map.of("id", "oyster", "name", "Oyster Mushrooms", "description", "Blue, Golden, and King Oyster flushes"),
                Map.of("id", "shiitake", "name", "Oak Shiitake", "description", "Hardwood log grown aromatic shiitake"),
                Map.of("id", "specialty", "name", "Specialty & Lion's Mane", "description", "Exotic culinary & medicinal pom-poms"),
                Map.of("id", "cremini", "name", "Cremini & Button", "description", "Fresh white and brown culinary caps"),
                Map.of("id", "medicinal", "name", "Medicinal Ganoderma & Reishi", "description", "High potency adaptogenic extracts")
        ));
    }

    // =========================================================================
    // MODULE 4: ORDER MANAGEMENT
    // =========================================================================

    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<CustomerOrder> orders = orderRepository.findAll();

        if (status != null && !status.trim().isEmpty()) {
            orders = orders.stream().filter(o -> status.equalsIgnoreCase(o.getStatus())).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            orders = orders.stream().filter(o ->
                    (o.getOrderId() != null && o.getOrderId().toLowerCase().contains(q)) ||
                    (o.getCustomerName() != null && o.getCustomerName().toLowerCase().contains(q)) ||
                    (o.getCustomerEmail() != null && o.getCustomerEmail().toLowerCase().contains(q)) ||
                    (o.getCity() != null && o.getCity().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(orders);
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String orderId, @RequestBody Map<String, String> body) {
        Optional<CustomerOrder> orderOpt = orderRepository.findByOrderId(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Order not found"));
        }

        CustomerOrder order = orderOpt.get();
        String newStatus = body.get("status");

        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Status is required"));
        }

        String prev = order.getStatus();
        order.setStatus(newStatus.toUpperCase());
        if (body.containsKey("deliveryNotes")) {
            order.setDeliveryNotes(body.get("deliveryNotes"));
        }

        CustomerOrder saved = orderRepository.save(order);

        logActivity("UPDATE_ORDER_STATUS", "ORDER", orderId,
                "Updated order " + orderId + " status from " + prev + " to " + saved.getStatus());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Order status updated to " + saved.getStatus(),
                "order", saved
        ));
    }

    // =========================================================================
    // MODULE 5: PAYMENT MANAGEMENT (Never expose Razorpay secret keys!)
    // =========================================================================

    @GetMapping("/payments")
    public ResponseEntity<?> getAllPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<PaymentTransaction> payments = paymentRepository.findAll();

        if (status != null && !status.trim().isEmpty()) {
            payments = payments.stream().filter(p -> status.equalsIgnoreCase(p.getStatus())).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            payments = payments.stream().filter(p ->
                    (p.getOrderId() != null && p.getOrderId().toLowerCase().contains(q)) ||
                    (p.getRazorpayPaymentId() != null && p.getRazorpayPaymentId().toLowerCase().contains(q)) ||
                    (p.getCustomerEmail() != null && p.getCustomerEmail().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        // Return sanitized list (ensuring signature or internal keys are not exposed carelessly)
        List<Map<String, Object>> sanitized = payments.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("orderId", p.getOrderId());
            m.put("razorpayOrderId", p.getRazorpayOrderId());
            m.put("razorpayPaymentId", p.getRazorpayPaymentId() != null ? p.getRazorpayPaymentId() : "");
            m.put("amount", p.getAmount());
            m.put("amountPaise", p.getAmountPaise());
            m.put("currency", p.getCurrency() != null ? p.getCurrency() : "INR");
            m.put("status", p.getStatus());
            m.put("customerEmail", p.getCustomerEmail() != null ? p.getCustomerEmail() : "");
            m.put("customerPhone", p.getCustomerPhone() != null ? p.getCustomerPhone() : "");
            m.put("failureReason", p.getFailureReason() != null ? p.getFailureReason() : "");
            m.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(sanitized);
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<?> reviewRefund(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<PaymentTransaction> payOpt = paymentRepository.findById(id);
        if (payOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Payment transaction not found"));
        }

        PaymentTransaction pay = payOpt.get();
        String refundStatus = body.getOrDefault("refundStatus", "REFUNDED");
        String note = body.getOrDefault("note", "Refund processed under platform buyer protection.");

        pay.setStatus(refundStatus.toUpperCase());
        pay.setFailureReason("Refund Notice: " + note);
        paymentRepository.save(pay);

        logActivity("PROCESS_REFUND", "PAYMENT", String.valueOf(id),
                "Processed refund for order " + pay.getOrderId() + " (" + pay.getAmount() + " INR). Note: " + note);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment refund status marked as " + refundStatus,
                "payment", pay
        ));
    }

    // =========================================================================
    // MODULE 6: DELIVERY MANAGEMENT
    // =========================================================================

    @GetMapping("/deliveries")
    public ResponseEntity<?> getAllDeliveries(
            @RequestParam(required = false) String deliveryType,
            @RequestParam(required = false) String search) {

        List<CustomerOrder> orders = orderRepository.findAll();

        List<Map<String, Object>> deliveries = orders.stream().map(o -> {
            Map<String, Object> map = new HashMap<>();
            map.put("orderId", o.getOrderId());
            map.put("customerName", o.getCustomerName());
            map.put("customerEmail", o.getCustomerEmail());
            map.put("customerPhone", o.getCustomerPhone());
            map.put("pickupLocation", o.getPickupLocation());
            map.put("deliveryAddress", o.getDeliveryAddress());
            map.put("city", o.getCity());
            map.put("state", o.getState());
            map.put("pincode", o.getPincode());
            map.put("deliveryDistance", o.getDeliveryDistance() != null ? o.getDeliveryDistance() : 0.0);
            map.put("deliveryType", o.getDeliveryType() != null ? o.getDeliveryType() : "STANDARD");
            map.put("totalWeight", o.getTotalWeight() != null ? o.getTotalWeight() : 1.0);
            map.put("baseDeliveryFee", o.getBaseDeliveryFee() != null ? o.getBaseDeliveryFee() : 30.0);
            map.put("distanceFee", o.getDistanceFee() != null ? o.getDistanceFee() : 0.0);
            map.put("weightFee", o.getWeightFee() != null ? o.getWeightFee() : 0.0);
            map.put("expressSurcharge", o.getExpressSurcharge() != null ? o.getExpressSurcharge() : 0.0);
            map.put("finalDeliveryCharge", o.getFinalDeliveryCharge() != null ? o.getFinalDeliveryCharge() : 0.0);
            map.put("grandTotal", o.getGrandTotal() != null ? o.getGrandTotal() : 0.0);
            map.put("shipmentsJson", o.getShipmentsJson());
            map.put("orderStatus", o.getStatus());
            map.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
            return map;
        }).collect(Collectors.toList());

        if (deliveryType != null && !deliveryType.trim().isEmpty()) {
            deliveries = deliveries.stream().filter(d -> deliveryType.equalsIgnoreCase((String) d.get("deliveryType"))).collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            deliveries = deliveries.stream().filter(d ->
                    String.valueOf(d.get("orderId")).toLowerCase().contains(q) ||
                    String.valueOf(d.get("customerName")).toLowerCase().contains(q) ||
                    String.valueOf(d.get("city")).toLowerCase().contains(q)
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(deliveries);
    }

    // =========================================================================
    // MODULE 7: REPORTS AND ANALYTICS
    // =========================================================================

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        long totalBuyers = userRepository.countByRole("customer");
        long totalFarmers = userRepository.countByRole("cultivater");
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();

        List<CustomerOrder> paidOrders = orderRepository.findByStatus("PAID");
        double totalRevenue = paidOrders.stream().mapToDouble(o -> o.getGrandTotal() != null ? o.getGrandTotal() : 0.0).sum();

        long successfulPayments = paymentRepository.countByStatus("SUCCESS");
        long failedPayments = paymentRepository.countByStatus("FAILED");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBuyers", totalBuyers);
        stats.put("totalFarmers", totalFarmers);
        stats.put("totalProducts", totalProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        stats.put("successfulPayments", successfulPayments);
        stats.put("failedPayments", failedPayments);

        // Monthly mock/aggregated sales analytics
        List<Map<String, Object>> monthly = List.of(
                Map.of("month", "Jun", "sales", 14200, "orders", 24),
                Map.of("month", "Jul", "sales", 21500, "orders", 38),
                Map.of("month", "Aug", "sales", 29800, "orders", 51),
                Map.of("month", "Sep", "sales", 36400, "orders", 64),
                Map.of("month", "Oct", "sales", 48900, "orders", 82),
                Map.of("month", "Nov", "sales", Math.round(totalRevenue > 0 ? totalRevenue : 54200), "orders", totalOrders > 0 ? totalOrders : 95)
        );
        stats.put("monthlySales", monthly);

        return ResponseEntity.ok(stats);
    }

    // =========================================================================
    // MODULE 8: COMPLAINT MANAGEMENT
    // =========================================================================

    @GetMapping("/complaints")
    public ResponseEntity<?> getComplaints(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {

        List<Complaint> list = complaintRepository.findAllByOrderByCreatedAtDesc();

        if (status != null && !status.trim().isEmpty()) {
            list = list.stream().filter(c -> status.equalsIgnoreCase(c.getStatus())).collect(Collectors.toList());
        }

        if (category != null && !category.trim().isEmpty()) {
            list = list.stream().filter(c -> category.equalsIgnoreCase(c.getCategory())).collect(Collectors.toList());
        }

        return ResponseEntity.ok(list);
    }

    @PostMapping("/complaints")
    public ResponseEntity<?> createComplaint(@RequestBody Map<String, String> body) {
        String email = body.get("userEmail");
        String name = body.get("userName");
        String role = body.get("userRole");
        String category = body.get("category");
        String subject = body.get("subject");
        String description = body.get("description");

        if (email == null || subject == null || description == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Email, subject, and description are required"));
        }

        String ticketId = "CMP-" + (1000 + (int)(Math.random() * 9000));

        Complaint complaint = new Complaint(ticketId, email, name, role != null ? role : "customer", category != null ? category : "GENERAL", subject, description);
        Complaint saved = complaintRepository.save(complaint);

        return ResponseEntity.ok(Map.of("success", true, "ticketId", ticketId, "complaint", saved));
    }

    @PostMapping("/complaints/{id}/respond")
    public ResponseEntity<?> respondToComplaint(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Complaint> compOpt = complaintRepository.findById(id);
        if (compOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "Complaint ticket not found"));
        }

        Complaint complaint = compOpt.get();
        String responseText = body.get("response");
        String newStatus = body.getOrDefault("status", "RESOLVED");

        complaint.setAdminResponse(responseText);
        complaint.setStatus(newStatus.toUpperCase());
        complaint.setResolvedBy(getCurrentAdminEmail());

        Complaint saved = complaintRepository.save(complaint);

        logActivity("RESPOND_COMPLAINT", "COMPLAINT", String.valueOf(id),
                "Responded to complaint ticket " + saved.getTicketId() + " (" + saved.getStatus() + ")");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Complaint response saved and ticket status updated to " + saved.getStatus(),
                "complaint", saved
        ));
    }
}
