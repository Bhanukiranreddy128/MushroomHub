package com.mushroomhub.api.repository;

import com.mushroomhub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCaseAndRole(String email, String role);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findAllByRole(String role);
    List<User> findAllByRoleIn(List<String> roles);
    boolean existsByEmailIgnoreCaseAndRole(String email, String role);
    boolean existsByEmailIgnoreCase(String email);
    long countByRole(String role);
}
