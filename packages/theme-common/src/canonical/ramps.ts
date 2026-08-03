import type { TokenPath, TokenType } from "~/dtcg/types.js";

/**
 * Ramp cardinality is fixed deliberately. Tailwind generates utilities at build time from variable
 * names, so runtime *values* are free but runtime *keys* are not — a ramp the customer can extend
 * would produce tokens the frontend cannot render.
 */

export const SPACING_STEPS = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;

export const TEXT_STEPS = SPACING_STEPS;

export const RADIUS_STEPS = ["none", "sm", "md", "lg", "full"] as const;

export const SHADOW_STEPS = ["none", "sm", "md", "lg", "xl"] as const;

export type SpacingStep = (typeof SPACING_STEPS)[number];
export type TextStep = (typeof TEXT_STEPS)[number];
export type RadiusStep = (typeof RADIUS_STEPS)[number];
export type ShadowStep = (typeof SHADOW_STEPS)[number];

export type RampId = "space" | "text" | "radius" | "shadow";

export interface RampDefinition {
    id: RampId;
    label: string;
    /** Path prefix, which is also the leading CSS variable segment. */
    pathPrefix: string;
    steps: readonly string[];
    type: TokenType;
    /** Fluid-capable ramps hold a min/max pair per step; single-valued ramps hold one value. */
    fluidCapable: boolean;
    /**
     * Index of the step the generator treats as the base when producing a ramp from a base size
     * and a ratio. `null` for single-valued ramps, which are not generated.
     */
    baseStepIndex: number | null;
}

/**
 * `md` is the base for both generated ramps: it sits at the centre of the nine steps, and it is the
 * step body text maps to — which the design brief requires to stay fixed.
 */
const GENERATED_BASE_INDEX = SPACING_STEPS.indexOf("md");

export const RAMPS: readonly RampDefinition[] = [
    {
        id: "space",
        label: "Spacing",
        pathPrefix: "space",
        steps: SPACING_STEPS,
        type: "dimension",
        fluidCapable: true,
        baseStepIndex: GENERATED_BASE_INDEX
    },
    {
        id: "text",
        label: "Type sizes",
        pathPrefix: "text",
        steps: TEXT_STEPS,
        type: "dimension",
        fluidCapable: true,
        baseStepIndex: GENERATED_BASE_INDEX
    },
    {
        id: "radius",
        label: "Radius",
        pathPrefix: "radius",
        steps: RADIUS_STEPS,
        type: "dimension",
        fluidCapable: false,
        baseStepIndex: null
    },
    {
        id: "shadow",
        label: "Shadow",
        pathPrefix: "shadow",
        steps: SHADOW_STEPS,
        type: "shadow",
        fluidCapable: false,
        baseStepIndex: null
    }
];

export const getRamp = (id: RampId): RampDefinition => {
    const ramp = RAMPS.find(candidate => candidate.id === id);
    if (!ramp) {
        throw new Error(`Unknown ramp "${id}".`);
    }
    return ramp;
};

export const rampStepPath = (id: RampId, step: string): TokenPath => {
    return `${getRamp(id).pathPrefix}.${step}`;
};

export const rampStepPaths = (id: RampId): TokenPath[] => {
    const ramp = getRamp(id);
    return ramp.steps.map(step => `${ramp.pathPrefix}.${step}`);
};

/**
 * Default fluid state: on for the upper half of each fluid-capable ramp, off for `md` and below.
 * This keeps body text — which maps to `md` — fixed, as the design brief requires.
 */
export const isFluidByDefault = (id: RampId, step: string): boolean => {
    const ramp = getRamp(id);
    if (!ramp.fluidCapable || ramp.baseStepIndex === null) {
        return false;
    }
    return ramp.steps.indexOf(step) > ramp.baseStepIndex;
};
