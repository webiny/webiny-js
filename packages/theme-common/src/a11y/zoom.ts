import type { FluidStepMeta, TokenPath } from "~/dtcg/types.js";
import { DEFAULT_ROOT_FONT_SIZE, parseLength, round, toRem } from "~/fluid/length.js";

/**
 * Zoom conformance on fluid type steps.
 *
 * WCAG 1.4.4 requires text to reach 200% without loss of content or function. Capping the maximum
 * size with `clamp()` can prevent that: once the expression is pinned at its maximum, zooming no
 * longer enlarges the text. A `rem` component in the middle term is necessary but not sufficient,
 * because the cap itself can block 200%.
 *
 * The published rule of thumb is a ratio test — maximum no more than 2.5× minimum.
 *
 * UNVERIFIED. This threshold comes from a single analysis and depends on browser zoom ceilings,
 * which differ between Chrome, Safari and Firefox. It has NOT been checked against current
 * browsers. Treat the warning as advisory until it has been, and adjust
 * {@link MAX_FLUID_RATIO} rather than scattering the number through call sites.
 */
export const MAX_FLUID_RATIO = 2.5;

export interface ZoomWarning {
    path: TokenPath;
    /** Rounded to two decimals. */
    ratio: number;
    maxRatio: number;
    message: string;
}

export interface ZoomCheckInput {
    path: TokenPath;
    step: FluidStepMeta;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Checks one fluid step. Returns `null` when the step is fixed, unparseable, or within the ratio —
 * this check only ever produces warnings, never a pass record.
 */
export const checkZoomConformance = (
    { path, step }: ZoomCheckInput,
    maxRatio = MAX_FLUID_RATIO,
    rootFontSize = DEFAULT_ROOT_FONT_SIZE
): ZoomWarning | null => {
    if (!step.enabled) {
        return null;
    }

    const min = parseLength(step.min);
    const max = parseLength(step.max);
    if (!min || !max) {
        return null;
    }

    const minRem = toRem(min, rootFontSize);
    const maxRem = toRem(max, rootFontSize);

    if (round(minRem) <= 0) {
        return null;
    }

    const ratio = round2(maxRem / minRem);
    if (ratio <= maxRatio) {
        return null;
    }

    return {
        path,
        ratio,
        maxRatio,
        message:
            `"${path}" scales from ${step.min} to ${step.max}, a ratio of ${ratio}. Above ` +
            `${maxRatio} the maximum can stop people enlarging text to 200%.`
    };
};

export const findZoomWarnings = (
    steps: readonly ZoomCheckInput[],
    maxRatio = MAX_FLUID_RATIO
): ZoomWarning[] => {
    return steps
        .map(input => checkZoomConformance(input, maxRatio))
        .filter((warning): warning is ZoomWarning => warning !== null);
};
