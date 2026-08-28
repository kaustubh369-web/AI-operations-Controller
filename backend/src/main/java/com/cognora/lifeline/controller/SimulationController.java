package com.cognora.lifeline.controller;

import com.cognora.lifeline.dto.response.SimulationResponse;
import com.cognora.lifeline.entity.Complaint;
import com.cognora.lifeline.entity.RecommendedAction;
import com.cognora.lifeline.service.ComplaintService;
import com.cognora.lifeline.service.SimulationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/simulations")
@RequiredArgsConstructor
@Tag(name = "Simulations", description = "Sandbox simulation of a recommended action before it is ever approved/executed. Warden/Admin only.")
public class SimulationController {

    private final SimulationService simulationService;
    private final ComplaintService complaintService;

    @PostMapping("/run")
    public ResponseEntity<SimulationResponse> run(@RequestParam UUID complaintId, @RequestParam UUID actionId) {
        Complaint complaint = complaintService.requireComplaint(complaintId);
        RecommendedAction action = simulationService.requireAction(actionId);
        var simulation = simulationService.runSimulation(complaint, action, 0);
        return ResponseEntity.ok(simulationService.toResponse(simulation));
    }

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<List<SimulationResponse>> forComplaint(@PathVariable UUID complaintId) {
        return ResponseEntity.ok(simulationService.getForComplaint(complaintId));
    }
}
