package com.cognora.lifeline.service;

import com.cognora.lifeline.dto.response.InfrastructureHealthResponse;
import com.cognora.lifeline.repository.InfrastructureAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InfrastructureService {

    private final InfrastructureAssetRepository infrastructureAssetRepository;

    public List<InfrastructureHealthResponse> getAll() {
        return infrastructureAssetRepository.findAllByOrderByNameAsc().stream()
                .map(a -> InfrastructureHealthResponse.builder()
                        .name(a.getName())
                        .healthPercent(a.getHealthPercent())
                        .status(a.getStatus())
                        .hostelBlock(a.getHostelBlock())
                        .build())
                .collect(Collectors.toList());
    }
}
