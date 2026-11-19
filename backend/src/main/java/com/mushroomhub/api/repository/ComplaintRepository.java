package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Optional<Complaint> findByTicketId(String ticketId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByUserEmailOrderByCreatedAtDesc(String email);
    List<Complaint> findByStatus(String status);
    long countByStatus(String status);
}
