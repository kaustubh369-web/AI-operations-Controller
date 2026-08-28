package com.cognora.lifeline.controller;

import com.cognora.lifeline.entity.Role;
import com.cognora.lifeline.entity.User;
import com.cognora.lifeline.exception.ResourceNotFoundException;
import com.cognora.lifeline.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Full-access user & role management. Admin only (enforced in SecurityConfig).")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> changeRole(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setRole(Role.valueOf(body.get("role")));
        return ResponseEntity.ok(userRepository.save(user));
    }
}
