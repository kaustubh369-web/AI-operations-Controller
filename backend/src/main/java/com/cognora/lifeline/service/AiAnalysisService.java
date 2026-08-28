package com.cognora.lifeline.service;

import com.cognora.lifeline.entity.*;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

/**
 * Deterministic, rule-based "AI" analysis engine.
 *
 * This stands in for an LLM-backed diagnostic model for hackathon reliability —
 * same inputs always produce explainable, reproducible outputs. Swap the body of
 * {@link #analyze} for a real model call later; the contract (AnalysisResult) stays
 * the same, so nothing downstream (risk engine, controllers, frontend) needs to change.
 */
@Service
public class AiAnalysisService {

    private final SecureRandom random = new SecureRandom();

    public record ActionTemplate(
            String name, String description, int riskScore,
            String estimatedRecoveryTime, boolean reversible) {
    }

    public record AnalysisResult(
            Severity severity,
            int confidencePercent,
            String probableRootCause,
            String explanation,
            int impactScore,
            int probabilityScore,
            int affectedStudentsEstimate,
            int safetyRiskScore,
            int reversibilityScore,
            boolean telemetryDegraded,
            String telemetryNote,
            List<ActionTemplate> candidateActions
    ) {
    }

    public AnalysisResult analyze(ComplaintCategory category, String title, String description, String hostelBlock) {
        String text = ((title == null ? "" : title) + " " + (description == null ? "" : description)).toLowerCase();

        // Simulate telemetry availability per category (e.g. CCTV sensor down)
        boolean telemetryDegraded = category == ComplaintCategory.CCTV_SECURITY && random.nextInt(100) < 35;
        int confidencePenalty = telemetryDegraded ? 18 : 0;

        return switch (category) {
            case WALL_STRUCTURAL -> structural(text, telemetryDegraded, confidencePenalty);
            case FIRE_ALARM -> fireAlarm(text, telemetryDegraded, confidencePenalty);
            case CCTV_SECURITY -> cctv(text, telemetryDegraded, confidencePenalty);
            case WIFI_INTERNET -> wifi(text, telemetryDegraded, confidencePenalty);
            case AC_COOLING -> ac(text, telemetryDegraded, confidencePenalty);
            case WATER_COOLER -> waterCooler(text, telemetryDegraded, confidencePenalty);
            case WASHROOM -> washroom(text, telemetryDegraded, confidencePenalty);
            case ELECTRICAL -> electrical(text, telemetryDegraded, confidencePenalty);
            default -> other(text, telemetryDegraded, confidencePenalty);
        };
    }

    private boolean any(String text, String... keywords) {
        for (String k : keywords) if (text.contains(k)) return true;
        return false;
    }

    private AnalysisResult structural(String text, boolean deg, int penalty) {
        boolean severe = any(text, "large", "growing", "wide", "spreading", "collapse", "ceiling");
        Severity severity = severe ? Severity.CRITICAL : Severity.HIGH;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Cordon off affected area", "Rope off the zone and put up a hazard notice to prevent access.", 8, "10-15 min", true),
                new ActionTemplate("Dispatch civil engineer for inspection", "Send a structural engineer to assess crack depth and load-bearing risk.", 22, "2-6 hours", true),
                new ActionTemplate("Relocate affected residents", "Temporarily move students out of the room/wing as a precaution.", 48, "1-2 hours", true),
                new ActionTemplate("Initiate structural repair work", "Begin masonry/structural repair based on engineer's report.", 76, "3-10 days", false)
        );
        return new AnalysisResult(severity, 92 - penalty,
                "Physical structural degradation — likely settling, water ingress, or load stress on the wall/ceiling.",
                "Keyword and category signals indicate a physical structural hazard. Structural issues carry irreversible " +
                        "risk if untreated, so this is routed for mandatory physical inspection rather than any automated action.",
                severe ? 82 : 60, 55, severe ? 60 : 25, severe ? 90 : 65, 15, deg,
                deg ? "Structural sensor feed unavailable — assessment based on complaint text and historical block data only." : null,
                actions);
    }

    private AnalysisResult fireAlarm(String text, boolean deg, int penalty) {
        boolean activeTrigger = any(text, "triggered", "ringing", "went off", "smoke", "fire");
        Severity severity = Severity.CRITICAL;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Notify warden & security immediately", "Immediate escalation to on-duty warden and campus security.", 5, "Immediate", true),
                new ActionTemplate("Dispatch fire safety officer to verify", "Physical verification of alarm state (false alarm vs. active trigger).", 18, "5-10 min", true),
                new ActionTemplate("Test/replace alarm battery or sensor", "Routine maintenance fix if verified as a false alarm / low-battery chirp.", 30, "20-40 min", true),
                new ActionTemplate("Full evacuation protocol", "Executed only if fire/smoke is physically confirmed.", 65, "Immediate", true)
        );
        return new AnalysisResult(severity, 96 - penalty,
                activeTrigger ? "Active fire alarm trigger — potential fire or smoke event." : "Fire alarm system fault — likely low battery or sensor malfunction.",
                "Fire safety signals always route to CRITICAL regardless of confidence, per policy: any fire-related event " +
                        "requires immediate human escalation. This is never auto-executed.",
                95, activeTrigger ? 70 : 30, 120, 98, 5, deg,
                deg ? "Fire panel telemetry unavailable — treating as active until physically verified." : null,
                actions);
    }

    private AnalysisResult cctv(String text, boolean deg, int penalty) {
        boolean offline = any(text, "offline", "not working", "no feed", "blank", "black screen");
        Severity severity = offline ? Severity.HIGH : Severity.MEDIUM;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Check camera power supply", "Verify PoE/power at the junction box.", 10, "10-15 min", true),
                new ActionTemplate("Check network connection to NVR", "Ping the camera and inspect switch port status.", 16, "10-20 min", true),
                new ActionTemplate("Restart camera / NVR channel", "Soft restart of the affected camera or recording channel.", 24, "5-10 min", true),
                new ActionTemplate("Physical camera replacement", "Swap hardware if fault persists after restart.", 55, "1-3 days", false)
        );
        return new AnalysisResult(severity, (offline ? 88 : 74) - penalty,
                offline ? "Camera power or network connectivity failure." : "Intermittent CCTV signal degradation.",
                "Security camera downtime is treated as HIGH given safety/monitoring implications, especially at night. " +
                        "Diagnosis prioritizes power → network → hardware in that order.",
                offline ? 65 : 40, 50, 200, offline ? 55 : 30, 30, deg,
                deg ? "CCTV telemetry unavailable. Diagnosis confidence reduced, but analysis continues using complaint history and available infrastructure signals." : null,
                actions);
    }

    private AnalysisResult wifi(String text, boolean deg, int penalty) {
        boolean wholeArea = any(text, "whole", "entire", "everyone", "floor", "block", "building");
        Severity severity = wholeArea ? Severity.HIGH : Severity.MEDIUM;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Restart Wi-Fi Access Point", "Soft restart of the affected AP — first line of defense for AP-level faults.", 18, "2-4 min", true),
                new ActionTemplate("Switch to Backup AP", "Fail over client traffic to a redundant access point in the same zone.", 43, "3-5 min", true),
                new ActionTemplate("Restart Network Controller", "Restart the wing/block-level network controller — affects all APs downstream.", 76, "8-15 min", true),
                new ActionTemplate("Dispatch ISP/network vendor", "Escalate to external vendor if upstream link is down.", 40, "2-6 hours", true)
        );
        return new AnalysisResult(severity, 89 - penalty,
                wholeArea ? "Access point or network controller failure affecting multiple rooms." : "Localized access point fault.",
                "Connectivity scope (single room vs. whole floor/block) drives severity — a wider blast radius means the " +
                        "controller or uplink is more likely at fault, not just one AP.",
                wholeArea ? 60 : 30, 55, wholeArea ? 150 : 12, 10, 10, deg, null, actions);
    }

    private AnalysisResult ac(String text, boolean deg, int penalty) {
        boolean leaking = any(text, "leak", "leaking", "water", "dripping");
        boolean noCooling = any(text, "not cooling", "no cooling", "warm", "hot air", "not working");
        Severity severity = leaking ? Severity.MEDIUM : (noCooling ? Severity.MEDIUM : Severity.LOW);
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Check power supply & remote", "Rule out simple power/remote-battery causes first.", 6, "5 min", true),
                new ActionTemplate("Clean/unclog condensate drain", "Fixes most leaking-AC cases caused by drain blockage.", 15, "20-30 min", true),
                new ActionTemplate("Inspect refrigerant/gas level", "Check for gas leak causing poor cooling.", 28, "1-2 hours", true),
                new ActionTemplate("Compressor inspection/replacement", "Escalate to technician if compressor fault suspected.", 58, "1-2 days", false)
        );
        return new AnalysisResult(severity, 84 - penalty,
                leaking ? "Condensate drain blockage causing water leakage." : (noCooling ? "Possible refrigerant loss or compressor fault." : "Minor AC performance issue."),
                "AC faults are rarely safety-critical, so diagnosis proceeds from cheapest/safest checks (power, drain) " +
                        "toward more invasive ones (compressor) only if needed.",
                leaking ? 35 : 25, 40, 4, 8, 40, deg, null, actions);
    }

    private AnalysisResult waterCooler(String text, boolean deg, int penalty) {
        boolean noWater = any(text, "no water", "not dispensing", "dry");
        Severity severity = noWater ? Severity.MEDIUM : Severity.LOW;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Check power supply", "Confirm the unit is receiving power.", 5, "5 min", true),
                new ActionTemplate("Check water inlet valve/tank", "Confirm supply line is not blocked or empty.", 12, "15 min", true),
                new ActionTemplate("Inspect cooling compressor", "Escalate to technician if compressor is faulty.", 30, "1-2 hours", true),
                new ActionTemplate("Replace unit", "Last resort if repair is not cost-effective.", 50, "1-3 days", false)
        );
        return new AnalysisResult(severity, 80 - penalty,
                noWater ? "Water supply interruption to the cooler unit." : "Cooling performance degradation.",
                "Low safety impact — diagnosis is a simple funnel from power → water supply → compressor.",
                noWater ? 30 : 18, 35, 25, 5, 35, deg, null, actions);
    }

    private AnalysisResult washroom(String text, boolean deg, int penalty) {
        boolean severe = any(text, "flood", "burst", "sewage", "overflow");
        Severity severity = severe ? Severity.HIGH : Severity.MEDIUM;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Shut off local water valve", "Stop active leakage/flooding at the source.", 10, "5-10 min", true),
                new ActionTemplate("Clear blockage (plunger/drain rod)", "Standard fix for clogged drains/pipes.", 14, "20-30 min", true),
                new ActionTemplate("Inspect fixture/pipe joint", "Locate and repair the specific leak point.", 26, "1-2 hours", true),
                new ActionTemplate("Full pipe replacement", "Escalate if joint repair does not hold.", 50, "1-2 days", false)
        );
        return new AnalysisResult(severity, 86 - penalty,
                severe ? "Pipe burst or sewage backup causing active flooding." : "Fixture or plumbing joint leakage.",
                "Plumbing issues are ranked by whether water is actively spreading (higher urgency) or a slow, contained leak.",
                severe ? 55 : 30, 45, severe ? 40 : 15, severe ? 40 : 15, 30, deg, null, actions);
    }

    private AnalysisResult electrical(String text, boolean deg, int penalty) {
        boolean hazard = any(text, "spark", "shock", "smoke", "burning", "exposed wire", "live wire");
        Severity severity = hazard ? Severity.CRITICAL : Severity.MEDIUM;
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Cut power at breaker/DB", "Immediate isolation of the affected circuit — always first for hazard signals.", 8, "5 min", true),
                new ActionTemplate("Cordon off area", "Prevent access until an electrician confirms it's safe.", 6, "5-10 min", true),
                new ActionTemplate("Dispatch licensed electrician", "Full inspection and repair of wiring/switchgear.", 32, "1-3 hours", true),
                new ActionTemplate("Rewire/replace switchgear", "Escalation if inspection finds damaged wiring.", 60, "1-2 days", false)
        );
        return new AnalysisResult(severity, (hazard ? 94 : 78) - penalty,
                hazard ? "Exposed wiring or short circuit posing shock/fire risk." : "Faulty switch, socket, or minor wiring issue.",
                "Any spark/shock/burning-smell signal is treated as an immediate safety hazard and forces CRITICAL severity " +
                        "regardless of category baseline, per governance policy.",
                hazard ? 80 : 35, hazard ? 65 : 30, hazard ? 60 : 10, hazard ? 92 : 25, 20, deg, null, actions);
    }

    private AnalysisResult other(String text, boolean deg, int penalty) {
        List<ActionTemplate> actions = List.of(
                new ActionTemplate("Route to general maintenance for triage", "No category-specific rule matched — a human reviews and reclassifies.", 10, "Within 24 hours", true),
                new ActionTemplate("Request additional details from student", "Ask for a photo/more description to improve classification.", 4, "N/A", true)
        );
        return new AnalysisResult(Severity.LOW, 55 - penalty,
                "Unclassified issue — insufficient signal for a specific root-cause rule.",
                "This complaint did not match any category-specific keyword rules. Confidence is intentionally kept low " +
                        "so a human reviewer double-checks before any action is ranked.",
                20, 20, 5, 10, 50, deg, null, actions);
    }
}
