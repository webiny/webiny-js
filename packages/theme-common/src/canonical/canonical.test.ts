import { describe, expect, it } from "vitest";
import {
    CANONICAL_COLOR_SLOTS,
    CANONICAL_SLOTS,
    CANONICAL_TYPOGRAPHY_ROLES,
    getRamp,
    isCanonicalPath,
    isFluidByDefault,
    RADIUS_STEPS,
    RAMPS,
    SHADOW_STEPS,
    SPACING_STEPS,
    TEXT_STEPS
} from "./index.js";

describe("canonical registry", () => {
    it("declares exactly 29 colour slots", () => {
        expect(CANONICAL_COLOR_SLOTS).toHaveLength(29);
    });

    it("declares exactly 11 typography roles", () => {
        expect(CANONICAL_TYPOGRAPHY_ROLES).toHaveLength(11);
    });

    it("fixes ramp cardinality", () => {
        expect(SPACING_STEPS).toHaveLength(9);
        expect(TEXT_STEPS).toHaveLength(9);
        expect(RADIUS_STEPS).toHaveLength(5);
        expect(SHADOW_STEPS).toHaveLength(5);
    });

    it("has no duplicate paths", () => {
        const paths = CANONICAL_SLOTS.map(entry => entry.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it("covers colours, typography and every ramp step", () => {
        const rampStepCount = RAMPS.reduce((total, ramp) => total + ramp.steps.length, 0);
        expect(CANONICAL_SLOTS).toHaveLength(29 + 11 + rampStepCount);
    });

    it("groups the colour slots as the editor renders them", () => {
        const groups = [...new Set(CANONICAL_COLOR_SLOTS.map(slot => slot.group))];
        expect(groups).toEqual([
            "surface",
            "text",
            "border",
            "action.primary",
            "action.secondary",
            "feedback.info",
            "feedback.success",
            "feedback.warning",
            "feedback.danger"
        ]);
    });

    it("recognises canonical paths and rejects everything else", () => {
        expect(isCanonicalPath("color.surface.page")).toBe(true);
        expect(isCanonicalPath("type.heading.6")).toBe(true);
        expect(isCanonicalPath("space.3xl")).toBe(true);
        expect(isCanonicalPath("color.brand.neutral-500")).toBe(false);
        expect(isCanonicalPath("space.4xl")).toBe(false);
    });
});

describe("default fluid flags", () => {
    it("turns fluid on above the base step and off at or below it", () => {
        const ramp = getRamp("text");
        const baseIndex = ramp.baseStepIndex!;

        ramp.steps.forEach((step, index) => {
            expect(isFluidByDefault("text", step)).toBe(index > baseIndex);
        });
    });

    it("keeps the step body text maps to fixed", () => {
        expect(isFluidByDefault("text", "md")).toBe(false);
    });

    it("never marks a single-valued ramp fluid", () => {
        expect(isFluidByDefault("radius", "lg")).toBe(false);
        expect(isFluidByDefault("shadow", "xl")).toBe(false);
    });
});
