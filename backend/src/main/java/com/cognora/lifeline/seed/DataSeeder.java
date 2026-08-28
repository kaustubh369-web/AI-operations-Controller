package com.cognora.lifeline.seed;

import com.cognora.lifeline.dto.request.ComplaintRequest;
import com.cognora.lifeline.entity.*;
import com.cognora.lifeline.repository.InfrastructureAssetRepository;
import com.cognora.lifeline.repository.UserRepository;
import com.cognora.lifeline.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds demo accounts, infrastructure assets, and a handful of realistic complaints
 * so the app is immediately demo-ready. Controlled by lifeline.seed.enabled (default true).
 * Safe to re-run — skips if data already exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    public static final String DEMO_PASSWORD = "Lifeline@123";

    private final UserRepository userRepository;
    private final InfrastructureAssetRepository infrastructureAssetRepository;
    private final PasswordEncoder passwordEncoder;
    private final ComplaintService complaintService;

    @Override
    public void run(String... args) {
        if (!userRepository.findAll().isEmpty()) {
            log.info("LifeLine: existing data found — skipping demo seed.");
            return;
        }

        log.info("LifeLine: seeding demo accounts, infrastructure assets, and complaints...");

        User student = userRepository.save(User.builder()
                .fullName("Asha Verma")
                .email("student@lifeline.demo")
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .role(Role.STUDENT)
                .hostelBlock("Block A")
                .floor("2nd Floor")
                .room("A-214")
                .phone("+91 90000 00001")
                .build());

        userRepository.save(User.builder()
                .fullName("Rakesh Menon")
                .email("warden@lifeline.demo")
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .role(Role.WARDEN)
                .hostelBlock("Block A")
                .build());

        userRepository.save(User.builder()
                .fullName("Priya Nair")
                .email("admin@lifeline.demo")
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .role(Role.ADMIN)
                .build());

        seedInfrastructure();
        seedComplaints(student);

        log.info("LifeLine: demo seed complete. Login with student@lifeline.demo / warden@lifeline.demo / admin@lifeline.demo — password: {}", DEMO_PASSWORD);
    }

    private void seedInfrastructure() {
        record Asset(String name, ComplaintCategory category, int health, AssetStatus status, String block) {}
        var assets = new Asset[]{
                new Asset("Wi-Fi", ComplaintCategory.WIFI_INTERNET, 76, AssetStatus.DEGRADED, "Block A"),
                new Asset("AC / Cooling", ComplaintCategory.AC_COOLING, 91, AssetStatus.HEALTHY, "Block B"),
                new Asset("Water Supply", ComplaintCategory.WATER_COOLER, 88, AssetStatus.HEALTHY, "Block C"),
                new Asset("Washrooms", ComplaintCategory.WASHROOM, 82, AssetStatus.HEALTHY, "Block C"),
                new Asset("CCTV / Security", ComplaintCategory.CCTV_SECURITY, 64, AssetStatus.DEGRADED, "Block D"),
                new Asset("Fire Safety", ComplaintCategory.FIRE_ALARM, 97, AssetStatus.HEALTHY, "All Blocks"),
                new Asset("Structural", ComplaintCategory.WALL_STRUCTURAL, 71, AssetStatus.DEGRADED, "Block C"),
                new Asset("Electrical", ComplaintCategory.ELECTRICAL, 85, AssetStatus.HEALTHY, "All Blocks"),
        };
        for (Asset a : assets) {
            infrastructureAssetRepository.save(InfrastructureAsset.builder()
                    .name(a.name()).category(a.category()).healthPercent(a.health())
                    .status(a.status()).hostelBlock(a.block()).build());
        }
    }

    private void seedComplaints(User student) {
        seedOne(student, ComplaintCategory.WIFI_INTERNET, "Wi-Fi unavailable in Block A",
                "Wi-Fi has been completely down on the whole 2nd floor since this morning, everyone on the floor is affected.",
                "Block A", "2nd Floor", "A-214");

        seedOne(student, ComplaintCategory.AC_COOLING, "AC leaking water in Block B",
                "The AC unit in the common room is leaking water steadily and pooling on the floor.",
                "Block B", "1st Floor", "B-110");

        seedOne(student, ComplaintCategory.WALL_STRUCTURAL, "Large wall crack in Block C",
                "There's a large, growing crack running along the wall near the stairwell on the 3rd floor.",
                "Block C", "3rd Floor", "Stairwell");

        seedOne(student, ComplaintCategory.WATER_COOLER, "Water cooler not cooling",
                "The water cooler near the mess hall is dispensing water but it isn't cold anymore.",
                "Block C", "Ground Floor", "Mess Hall");

        seedOne(student, ComplaintCategory.WASHROOM, "Washroom pipe leakage",
                "A pipe under the common washroom sink has been leaking for two days, water pooling on the floor.",
                "Block C", "2nd Floor", "Common Washroom");

        seedOne(student, ComplaintCategory.CCTV_SECURITY, "CCTV offline near main gate",
                "The CCTV camera covering the main gate has had no feed since last night — screen is blank.",
                "Block D", "Ground Floor", "Main Gate");

        seedOne(student, ComplaintCategory.FIRE_ALARM, "Fire alarm battery warning",
                "The fire alarm panel in the corridor has been beeping intermittently, looks like a low battery warning.",
                "Block A", "1st Floor", "Corridor");
    }

    private void seedOne(User student, ComplaintCategory category, String title, String description,
                          String block, String floor, String room) {
        ComplaintRequest request = new ComplaintRequest();
        request.setCategory(category);
        request.setTitle(title);
        request.setDescription(description);
        request.setHostelBlock(block);
        request.setFloor(floor);
        request.setRoom(room);
        complaintService.submitComplaint(student, request);
    }
}
