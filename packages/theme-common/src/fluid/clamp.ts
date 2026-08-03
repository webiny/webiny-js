import type { FluidStepMeta, FluidViewportRange } from "~/dtcg/types.js";
import {
    DEFAULT_ROOT_FONT_SIZE,
    formatRem,
    formatVw,
    parseLength,
    round,
    toRem
} from "./length.js";

/**
 * Fluid sizing — see the design brief, section 4.5.
 *
 * Two constraints are enforced here rather than left to convention:
 *
 * 1. Every clamp middle term carries a `rem` component alongside the viewport unit. Viewport units
 *    alone do not respond to browser zoom, so a `vw`-only middle term makes text unzoomable.
 * 2. Every fluid declaration is preceded by a plain fallback declaration carrying the minimum, so a
 *    browser that cannot parse the expression still gets a usable value.
 *
 * A `rem` component is necessary but not sufficient for zoom conformance — the cap itself can block
 * WCAG 1.4.4's 200% requirement. That is checked separately, in `a11y/zoom.ts`.
 */

/** The theme-level viewport range. One range shared by every fluid token keeps vertical rhythm from drifting. */
export const DEFAULT_VIEWPORT_RANGE: FluidViewportRange = { minWidth: 375, maxWidth: 1440 };

export interface FluidDeclaration {
    /**
     * Plain fallback carrying the minimum. Emit this declaration immediately before `value`, under
     * the same custom property name.
     */
    fallback: string;
    /** A plain length when the step is not fluid, otherwise a `clamp()` expression. */
    value: string;
    fluid: boolean;
}

export interface GenerateFluidValueParams {
    step: FluidStepMeta;
    viewport?: FluidViewportRange;
    rootFontSize?: number;
}

export class InvalidFluidStepError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidFluidStepError";
    }
}

const requireLength = (input: string, label: string, rootFontSize: number): number => {
    const parsed = parseLength(input);
    if (!parsed) {
        throw new InvalidFluidStepError(
            `${label} must be a plain px or rem length, received "${input}".`
        );
    }
    return toRem(parsed, rootFontSize);
};

/**
 * Produces the fallback/value pair for one ramp step.
 *
 * Throws {@link InvalidFluidStepError} on input that cannot produce valid CSS. Publish validation
 * runs {@link validateFluidStep} first, so this throw is a last-resort guard rather than a path
 * users can reach through the editor.
 */
export const generateFluidValue = ({
    step,
    viewport = DEFAULT_VIEWPORT_RANGE,
    rootFontSize = DEFAULT_ROOT_FONT_SIZE
}: GenerateFluidValueParams): FluidDeclaration => {
    const minRem = requireLength(step.min, "Minimum", rootFontSize);
    const maxRem = requireLength(step.max, "Maximum", rootFontSize);

    if (!step.enabled || round(minRem) === round(maxRem)) {
        const value = formatRem(minRem);
        return { fallback: value, value, fluid: false };
    }

    if (maxRem < minRem) {
        throw new InvalidFluidStepError(
            `Maximum (${step.max}) must not be smaller than minimum (${step.min}).`
        );
    }

    if (viewport.maxWidth <= viewport.minWidth) {
        throw new InvalidFluidStepError(
            `Viewport maximum (${viewport.maxWidth}) must be greater than viewport minimum (${viewport.minWidth}).`
        );
    }

    const minWidthRem = viewport.minWidth / rootFontSize;
    const maxWidthRem = viewport.maxWidth / rootFontSize;

    const slope = (maxRem - minRem) / (maxWidthRem - minWidthRem);
    const intercept = minRem - slope * minWidthRem;

    // Constraint 1: the rem term is always emitted, even when its coefficient rounds to zero.
    const middle = `${formatRem(intercept)} + ${formatVw(slope * 100)}`;

    return {
        // Constraint 2: the fallback always carries the minimum.
        fallback: formatRem(minRem),
        value: `clamp(${formatRem(minRem)}, ${middle}, ${formatRem(maxRem)})`,
        fluid: true
    };
};

/**
 * Emits the CSS declarations for one custom property, fallback first. Returns a single declaration
 * for non-fluid steps, where a fallback would be a duplicate of the value.
 */
export const toCssDeclarations = (
    variableName: string,
    declaration: FluidDeclaration
): string[] => {
    if (!declaration.fluid) {
        return [`${variableName}: ${declaration.value};`];
    }

    return [`${variableName}: ${declaration.fallback};`, `${variableName}: ${declaration.value};`];
};

export interface FluidStepValidationError {
    code: "Fluid/InvalidLength" | "Fluid/MaxBelowMin" | "Fluid/InvalidViewportRange";
    message: string;
}

/** Non-throwing input check, run by publish validation before artifacts are generated. */
export const validateFluidStep = (
    step: FluidStepMeta,
    viewport: FluidViewportRange = DEFAULT_VIEWPORT_RANGE,
    rootFontSize = DEFAULT_ROOT_FONT_SIZE
): FluidStepValidationError[] => {
    const errors: FluidStepValidationError[] = [];

    const min = parseLength(step.min);
    const max = parseLength(step.max);

    if (!min) {
        errors.push({
            code: "Fluid/InvalidLength",
            message: `Minimum must be a plain px or rem length, received "${step.min}".`
        });
    }
    if (!max) {
        errors.push({
            code: "Fluid/InvalidLength",
            message: `Maximum must be a plain px or rem length, received "${step.max}".`
        });
    }

    if (min && max && toRem(max, rootFontSize) < toRem(min, rootFontSize)) {
        errors.push({
            code: "Fluid/MaxBelowMin",
            message: `Maximum (${step.max}) must not be smaller than minimum (${step.min}).`
        });
    }

    if (step.enabled && viewport.maxWidth <= viewport.minWidth) {
        errors.push({
            code: "Fluid/InvalidViewportRange",
            message: `Viewport maximum (${viewport.maxWidth}) must be greater than viewport minimum (${viewport.minWidth}).`
        });
    }

    return errors;
};
