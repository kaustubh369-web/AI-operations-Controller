package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.request.LoginRequest;
import com.cognora.lifeline.dto.request.RegisterRequest;
import com.cognora.lifeline.dto.response.AuthResponse;
import com.cognora.lifeline.entity.Role;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.exception.EmailAlreadyExistsException;
import com.cognora.lifeline.repository.UserRepository;
import com.cognora.lifeline.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        // Self-registration is always STUDENT — WARDEN/ADMIN accounts are provisioned by seed data / an admin.
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .hostelBlock(request.getHostelBlock())
                .floor(request.getFloor())
                .room(request.getRoom())
                .phone(request.getPhone())
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user, Map.of(
                "role", user.getRole().name(),
                "userId", user.getId().toString(),
                "fullName", user.getFullName()
        ));

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
