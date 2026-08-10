import { describe, expect, it } from "vitest";
import {
    BORDER_WIDTH_STEPS,
    CANONICAL_COLOR_SLOTS,
    CANONICAL_DESCRIPTIONS,
    CANONICAL_SEMANTIC_SLOTS,
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
    it("declares exactly 40 colour slots", () => {
        expect(CANONICAL_COLOR_SLOTS).toHaveLength(40);
    });

    it("declares exactly 11 typography roles", () => {
        expect(CANONICAL_TYPOGRAPHY_ROLES).toHaveLength(11);
    });

    it("declares exactly 16 non-colour semantic slots", () => {
        expect(CANONICAL_SEMANTIC_SLOTS).toHaveLength(16);
    });

    it("fixes ramp cardinality", () => {
        expect(SPACING_STEPS).toHaveLength(9);
        expect(TEXT_STEPS).toHaveLength(9);
        expect(RADIUS_STEPS).toHaveLength(5);
        expect(SHADOW_STEPS).toHaveLength(5);
        expect(BORDER_WIDTH_STEPS).toHaveLength(3);
    });

    it("has no duplicate paths", () => {
        const paths = CANONICAL_SLOTS.map(entry => entry.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it("covers colours, typography, non-colour semantic slots and every ramp step", () => {
        const rampStepCount = RAMPS.reduce((total, ramp) => total + ramp.steps.length, 0);
        expect(CANONICAL_SLOTS).toHaveLength(40 + 11 + 16 + rampStepCount);
    });

    it("tags semantic slots and ramp steps distinctly", () => {
        // Everything bindable is `semantic`; ramp steps are values nothing binds to directly.
        expect(getSlotKind("color.action.ghost.background")).toBe("semantic");
        expect(getSlotKind("radius.control")).toBe("semantic");
        expect(getSlotKind("type.body")).toBe("semantic");
        expect(getSlotKind("radius.md")).toBe("ramp-step");
        expect(getSlotKind("border.default")).toBe("ramp-step");
    });

    it("describes every semantic slot and no ramp step", () => {
        for (const slot of CANONICAL_SLOTS) {
            if (slot.kind === "semantic") {
                expect(CANONICAL_DESCRIPTIONS.get(slot.path)?.length).toBeGreaterThan(0);
            } else {
                expect(CANONICAL_DESCRIPTIONS.has(slot.path)).toBe(false);
            }
        }
    });

    it("groups the colour slots as the editor renders them", () => {
        const groups = [...new Set(CANONICAL_COLOR_SLOTS.map(slot => slot.group))];
        expect(groups).toEqual([
            "surface",
            "text",
            "border",
            "action.primary",
            "action.secondary",
            "action.ghost",
            "action.destructive",
            "action.disabled",
            "feedback.info",
            "feedback.success",
            "feedback.warning",
            "feedback.danger"
        ]);
    });

    it("recognises canonical paths and rejects everything else", () => {
        expect(isCanonicalPath("color.surface.page")).toBe(true);
        expect(isCanonicalPath("color.surface.scrim")).toBe(true);
        expect(isCanonicalPath("type.heading.6")).toBe(true);
        expect(isCanonicalPath("space.3xl")).toBe(true);
        expect(isCanonicalPath("radius.control")).toBe(true);
        expect(isCanonicalPath("border.focus-ring")).toBe(true);
        expect(isCanonicalPath("color.brand.neutral-500")).toBe(false);
        expect(isCanonicalPath("space.4xl")).toBe(false);
    });
});

const getSlotKind = (path: string) => CANONICAL_SLOTS.find(slot => slot.path === path)?.kind;

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
