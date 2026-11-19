package com.mushroomhub.api.config;

import com.mushroomhub.api.model.User;
import com.mushroomhub.api.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else if (request.getHeader("X-Auth-Token") != null) {
            token = request.getHeader("X-Auth-Token").trim();
        }

        if (token != null && jwtUtil.validateToken(token)) {
            String email = jwtUtil.getEmail(token);
            String role = jwtUtil.getRole(token);

            if (email != null && role != null) {
                // Verify user account status in database (support both 'cultivater' and 'cultivator')
                Optional<User> userOpt = userRepository.findByEmailIgnoreCaseAndRole(email, role);
                if (userOpt.isEmpty() && ("cultivater".equalsIgnoreCase(role) || "cultivator".equalsIgnoreCase(role))) {
                    userOpt = userRepository.findByEmailIgnoreCaseAndRole(email, "cultivater".equalsIgnoreCase(role) ? "cultivator" : "cultivater");
                }
                if (userOpt.isEmpty()) {
                    userOpt = userRepository.findByEmailIgnoreCase(email);
                }
                if (userOpt.isPresent() && (userOpt.get().getAccountStatus() == null || "ACTIVE".equalsIgnoreCase(userOpt.get().getAccountStatus()))) {
                    String authority = JwtUtil.mapRoleToAuthority(userOpt.get().getRole());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.singletonList(new SimpleGrantedAuthority(authority))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } else {
            // Optional development/direct header fallback: X-User-Email and X-User-Role
            String headerEmail = request.getHeader("X-User-Email");
            String headerRole = request.getHeader("X-User-Role");

            if (headerEmail != null && headerRole != null) {
                Optional<User> userOpt = userRepository.findByEmailIgnoreCaseAndRole(headerEmail.trim().toLowerCase(), headerRole.trim().toLowerCase());
                if (userOpt.isEmpty() && ("cultivater".equalsIgnoreCase(headerRole) || "cultivator".equalsIgnoreCase(headerRole))) {
                    userOpt = userRepository.findByEmailIgnoreCaseAndRole(headerEmail.trim().toLowerCase(), "cultivater".equalsIgnoreCase(headerRole) ? "cultivator" : "cultivater");
                }
                if (userOpt.isEmpty()) {
                    userOpt = userRepository.findByEmailIgnoreCase(headerEmail.trim().toLowerCase());
                }
                if (userOpt.isPresent() && (userOpt.get().getAccountStatus() == null || "ACTIVE".equalsIgnoreCase(userOpt.get().getAccountStatus()))) {
                    String authority = JwtUtil.mapRoleToAuthority(userOpt.get().getRole());
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userOpt.get().getEmail(), null, Collections.singletonList(new SimpleGrantedAuthority(authority))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
