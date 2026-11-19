package com.mushroomhub.api.controller;

import com.mushroomhub.api.model.ProductListing;
import com.mushroomhub.api.repository.ProductListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class MarketplaceProductController {

    private final ProductListingRepository productRepository;

    public MarketplaceProductController(ProductListingRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Public Marketplace Endpoint: Accessible to all buyers and public users.
     * Returns approved, active products from ALL cultivators.
     */
    @GetMapping("/marketplace")
    public ResponseEntity<List<ProductListing>> getMarketplaceProducts(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search) {

        List<ProductListing> products = productRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc("APPROVED");

        if (category != null && !category.trim().isEmpty() && !"all".equalsIgnoreCase(category)) {
            String cat = category.trim().toLowerCase();
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().toLowerCase().contains(cat))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            products = products.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(q)) ||
                                 (p.getFarmName() != null && p.getFarmName().toLowerCase().contains(q)) ||
                                 (p.getLocation() != null && p.getLocation().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(products);
    }

    /**
     * Public Product Details: Anyone can view a product's public information.
     */
    @GetMapping("/marketplace/{productId}")
    public ResponseEntity<?> getMarketplaceProductDetails(@PathVariable("productId") String productId) {
        Optional<ProductListing> opt = productRepository.findByProductId(productId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", "Product not found"));
        }
        return ResponseEntity.ok(opt.get());
    }
}
