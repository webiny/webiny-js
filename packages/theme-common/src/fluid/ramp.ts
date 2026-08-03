import { getRamp, isFluidByDefault, type RampId } from "~/canonical/ramps.js";
import type { FluidStepMeta } from "~/dtcg/types.js";
import { round } from "./length.js";

/**
 * Ramps are generated from a base size and a ratio at each end of the viewport range, with
 * per-step override. Base, ratio and flags are editor metadata; the resolved min/max pair is what
 * gets stored in the token document.
 */

export interface RampEndConfig {
    /** Value of the base step, in rem. */
    base: number;
    /** Modular scale ratio, e.g. 1.25 for a major third. */
    ratio: number;
}

export interface RampGeneratorConfig {
    min: RampEndConfig;
    max: RampEndConfig;
    /** Per-step overrides applied after generation, keyed by step name. */
    overrides?: Partial<Record<string, Partial<FluidStepMeta>>>;
}

export interface GeneratedRampStep extends FluidStepMeta {
    step: string;
    /** True when the value came from an override rather than the generator. */
    overridden: boolean;
}

const scaleAt = (end: RampEndConfig, distanceFromBase: number): number => {
    return round(end.base * end.ratio ** distanceFromBase);
};

/**
 * Generates every step of a fluid-capable ramp.
 *
 * Defaults follow the design brief: fluid on for the upper half of the ramp, off for `md` and
 * below, which keeps body text fixed. When a step is not fluid its maximum equals its minimum, so
 * it emits a plain length.
 */
export const generateRamp = (rampId: RampId, config: RampGeneratorConfig): GeneratedRampStep[] => {
    const ramp = getRamp(rampId);

    if (!ramp.fluidCapable || ramp.baseStepIndex === null) {
        throw new Error(`Ramp "${rampId}" is single-valued and is not generated from a scale.`);
    }

    return ramp.steps.map((step, index) => {
        const distance = index - ramp.baseStepIndex!;
        const override = config.overrides?.[step];

        const enabled = override?.enabled ?? isFluidByDefault(rampId, step);
        const generatedMin = `${scaleAt(config.min, distance)}rem`;
        const generatedMax = enabled ? `${scaleAt(config.max, distance)}rem` : generatedMin;

        const min = override?.min ?? generatedMin;
        const max = override?.max ?? (enabled ? generatedMax : min);

        return {
            step,
            min,
            max: enabled ? max : min,
            enabled,
            overridden: override !== undefined
        };
    });
};

/** Sensible starting scales, used when seeding a new theme. */
export const DEFAULT_RAMP_CONFIG: Readonly<Record<"space" | "text", RampGeneratorConfig>> = {
    space: {
        min: { base: 1, ratio: 1.5 },
        max: { base: 1.25, ratio: 1.6 }
    },
    text: {
        min: { base: 1, ratio: 1.2 },
        max: { base: 1.125, ratio: 1.25 }
    }
};
