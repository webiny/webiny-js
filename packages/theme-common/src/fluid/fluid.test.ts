import { describe, expect, it } from "vitest";
import {
    DEFAULT_VIEWPORT_RANGE,
    generateFluidValue,
    InvalidFluidStepError,
    toCssDeclarations,
    validateFluidStep
} from "./clamp.js";
import { DEFAULT_RAMP_CONFIG, generateRamp } from "./ramp.js";
import { parseLength, toRem } from "./length.js";

const fluidStep = { min: "1rem", max: "2rem", enabled: true };

describe("generateFluidValue", () => {
    it("emits a plain length when the step is not fluid", () => {
        const result = generateFluidValue({ step: { min: "1rem", max: "1rem", enabled: false } });

        expect(result.fluid).toBe(false);
        expect(result.value).toBe("1rem");
        expect(result.value).not.toContain("clamp(");
    });

    it("emits a plain length when min and max are equal even with the flag on", () => {
        const result = generateFluidValue({ step: { min: "1rem", max: "1rem", enabled: true } });
        expect(result.fluid).toBe(false);
    });

    it("always includes a rem component in the clamp middle term", () => {
        // Constraint 1 from the design brief: viewport units alone do not respond to browser zoom.
        const result = generateFluidValue({ step: fluidStep });

        const middle = result.value.slice("clamp(".length, -1).split(", ")[1];
        expect(middle).toMatch(/rem/);
        expect(middle).toMatch(/vw/);
    });

    it("includes a rem component even when the intercept is zero", () => {
        // A ramp whose line passes through the origin still has to carry the rem term.
        const viewport = { minWidth: 320, maxWidth: 640 };
        const result = generateFluidValue({
            step: { min: "1rem", max: "2rem", enabled: true },
            viewport
        });

        const middle = result.value.slice("clamp(".length, -1).split(", ")[1];
        expect(middle.startsWith("0rem")).toBe(true);
        expect(middle).toContain("vw");
    });

    it("carries the minimum in the fallback declaration", () => {
        // Constraint 2 from the design brief.
        const result = generateFluidValue({ step: fluidStep });
        expect(result.fallback).toBe("1rem");
    });

    it("hits the minimum at the minimum viewport and the maximum at the maximum viewport", () => {
        const viewport = DEFAULT_VIEWPORT_RANGE;
        const result = generateFluidValue({ step: fluidStep, viewport });

        const middle = result.value.slice("clamp(".length, -1).split(", ")[1];
        const [remPart, vwPart] = middle.split(" + ");
        const intercept = Number.parseFloat(remPart);
        const vwCoefficient = Number.parseFloat(vwPart);

        const at = (viewportPx: number) => intercept + (vwCoefficient / 100) * (viewportPx / 16);

        expect(at(viewport.minWidth)).toBeCloseTo(1, 4);
        expect(at(viewport.maxWidth)).toBeCloseTo(2, 4);
    });

    it("converts px inputs through the root font size", () => {
        const result = generateFluidValue({ step: { min: "16px", max: "32px", enabled: true } });
        expect(result.fallback).toBe("1rem");
        expect(result.value).toContain("2rem)");
    });

    it("throws on an unparseable length", () => {
        expect(() =>
            generateFluidValue({ step: { min: "medium", max: "2rem", enabled: true } })
        ).toThrow(InvalidFluidStepError);
    });

    it("throws when the maximum is below the minimum", () => {
        expect(() =>
            generateFluidValue({ step: { min: "2rem", max: "1rem", enabled: true } })
        ).toThrow(InvalidFluidStepError);
    });

    it("throws on an inverted viewport range", () => {
        expect(() =>
            generateFluidValue({ step: fluidStep, viewport: { minWidth: 1440, maxWidth: 375 } })
        ).toThrow(InvalidFluidStepError);
    });
});

describe("toCssDeclarations", () => {
    it("emits the fallback immediately before the fluid value", () => {
        const declaration = generateFluidValue({ step: fluidStep });
        const lines = toCssDeclarations("--wby-text-lg", declaration);

        expect(lines).toHaveLength(2);
        expect(lines[0]).toBe("--wby-text-lg: 1rem;");
        expect(lines[1].startsWith("--wby-text-lg: clamp(")).toBe(true);
    });

    it("emits a single declaration for a fixed step", () => {
        const declaration = generateFluidValue({
            step: { min: "1rem", max: "1rem", enabled: false }
        });

        expect(toCssDeclarations("--wby-text-md", declaration)).toEqual(["--wby-text-md: 1rem;"]);
    });
});

describe("validateFluidStep", () => {
    it("passes a well-formed step", () => {
        expect(validateFluidStep(fluidStep)).toEqual([]);
    });

    it("reports an unparseable length without throwing", () => {
        const errors = validateFluidStep({ min: "big", max: "2rem", enabled: true });
        expect(errors.map(error => error.code)).toEqual(["Fluid/InvalidLength"]);
    });

    it("reports an inverted range", () => {
        const errors = validateFluidStep({ min: "2rem", max: "1rem", enabled: true });
        expect(errors.map(error => error.code)).toEqual(["Fluid/MaxBelowMin"]);
    });
});

describe("generateRamp", () => {
    it("produces one entry per step", () => {
        const steps = generateRamp("text", DEFAULT_RAMP_CONFIG.text);
        expect(steps.map(step => step.step)).toEqual([
            "3xs",
            "2xs",
            "xs",
            "sm",
            "md",
            "lg",
            "xl",
            "2xl",
            "3xl"
        ]);
    });

    it("places the configured base size at the base step", () => {
        const steps = generateRamp("text", DEFAULT_RAMP_CONFIG.text);
        const md = steps.find(step => step.step === "md");
        expect(md?.min).toBe("1rem");
    });

    it("increases monotonically", () => {
        const steps = generateRamp("text", DEFAULT_RAMP_CONFIG.text);
        const values = steps.map(step => toRem(parseLength(step.min)!));

        for (let index = 1; index < values.length; index++) {
            expect(values[index]).toBeGreaterThan(values[index - 1]);
        }
    });

    it("turns fluid on for the upper half only", () => {
        const steps = generateRamp("space", DEFAULT_RAMP_CONFIG.space);
        const fluid = steps.filter(step => step.enabled).map(step => step.step);

        expect(fluid).toEqual(["lg", "xl", "2xl", "3xl"]);
    });

    it("keeps max equal to min on fixed steps", () => {
        const steps = generateRamp("text", DEFAULT_RAMP_CONFIG.text);
        for (const step of steps.filter(candidate => !candidate.enabled)) {
            expect(step.max).toBe(step.min);
        }
    });

    it("applies per-step overrides", () => {
        const steps = generateRamp("text", {
            ...DEFAULT_RAMP_CONFIG.text,
            overrides: { xl: { min: "1.5rem", max: "2rem", enabled: true } }
        });

        const xl = steps.find(step => step.step === "xl");
        expect(xl).toMatchObject({ min: "1.5rem", max: "2rem", enabled: true, overridden: true });
    });

    it("lets an override switch a step from fluid to fixed", () => {
        const steps = generateRamp("text", {
            ...DEFAULT_RAMP_CONFIG.text,
            overrides: { "3xl": { enabled: false } }
        });

        const step = steps.find(candidate => candidate.step === "3xl")!;
        expect(step.enabled).toBe(false);
        expect(step.max).toBe(step.min);
    });

    it("refuses to generate a single-valued ramp", () => {
        expect(() => generateRamp("radius" as never, DEFAULT_RAMP_CONFIG.text)).toThrow(
            /single-valued/
        );
    });
});
