package com.cognora.lifeline.service;

import com.cognora.lifeline.entity.RiskLevel;
import org.springframework.stereotype.Service;

/**
 * Combines the AI engine's sub-factors into a single 0-100 risk score.
 * Weights: impact 30%, probability 20%, affected-students 15%, safety 25%, reversibility 10%.
 */
@Service
public class RiskEngineService {

    public int calculateRiskScore(int impact, int probability, int affectedStudentsEstimate,
                                   int safetyRisk, int reversibility) {
        double affectedNormalized = Math.min(100.0, affectedStudentsEstimate / 2.0);

        double score = (impact * 0.30)
                + (probability * 0.20)
                + (affectedNormalized * 0.15)
                + (safetyRisk * 0.25)
                + (reversibility * 0.10);

        int rounded = (int) Math.round(score);
        return Math.max(0, Math.min(100, rounded));
    }

    public RiskLevel levelFor(int riskScore) {
        return RiskLevel.fromScore(riskScore);
    }
}
