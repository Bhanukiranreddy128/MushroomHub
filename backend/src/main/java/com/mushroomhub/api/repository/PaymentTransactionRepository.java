package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.PaymentTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentTransaction> findByRazorpayPaymentId(String razorpayPaymentId);
    List<PaymentTransaction> findByOrderId(String orderId);
    List<PaymentTransaction> findByStatus(String status);
    long countByStatus(String status);
    boolean existsByRazorpayPaymentIdAndStatus(String razorpayPaymentId, String status);
}
