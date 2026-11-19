package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.CustomerOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    Optional<CustomerOrder> findByOrderId(String orderId);
    Optional<CustomerOrder> findByRazorpayOrderId(String razorpayOrderId);
    List<CustomerOrder> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
    List<CustomerOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    List<CustomerOrder> findByStatus(String status);
}
