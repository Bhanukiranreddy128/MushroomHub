package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.AdminActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActivityLogRepository extends JpaRepository<AdminActivityLog, Long> {
    List<AdminActivityLog> findAllByOrderByTimestampDesc();
    List<AdminActivityLog> findTop50ByOrderByTimestampDesc();
}
