package com.cognora.lifeline.repository;

import com.cognora.lifeline.entity.InfrastructureAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InfrastructureAssetRepository extends JpaRepository<InfrastructureAsset, UUID> {
    List<InfrastructureAsset> findAllByOrderByNameAsc();
}
