package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.ProductListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductListingRepository extends JpaRepository<ProductListing, Long> {
    Optional<ProductListing> findByProductId(String productId);
    List<ProductListing> findAllByOrderByCreatedAtDesc();
    List<ProductListing> findByFarmerEmail(String farmerEmail);
    List<ProductListing> findByFarmerEmailIgnoreCaseOrderByCreatedAtDesc(String farmerEmail);
    List<ProductListing> findByStatus(String status);
    List<ProductListing> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
