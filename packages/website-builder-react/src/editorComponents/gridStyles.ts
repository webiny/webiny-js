import { viewportManager } from "@webiny/website-builder-sdk";

/**
 * Builds a stable, SSR-consistent class scoped to a single grid instance
 * (e.g. `wb-grid-<id>`), sanitized to a valid CSS class name.
 */
export const createGridClass = (elementId: string): string => {
    return `wb-grid-${String(elementId).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
};

interface CreateGridStackingCssParams {
    /** Scoped class applied to the grid container (from `createGridClass`). */
    gridClass: string;
    /** Breakpoint name at (and below) which columns stack, e.g. "mobile". */
    stackAtBreakpoint?: string;
    /** Reverse the visual order of columns when stacked. */
    reverseWhenStacked?: boolean;
}

/**
 * Builds the media query that stacks a grid's columns at (and below) the given
 * breakpoint's width.
 *
 * Stacking is expressed as CSS rather than JS so the layout is correct straight
 * from the SSR HTML — no hydration, no viewport JS, no flash — the browser
 * applies it by the real viewport width. The width comes from the theme's
 * breakpoint definition (populated on both server and client via ContentSdk.init).
 *
 * Returns an empty string when no stacking breakpoint is configured (or the
 * named breakpoint is unknown), in which case the grid never stacks.
 */
export const createGridStackingCss = ({
    gridClass,
    stackAtBreakpoint,
    reverseWhenStacked
}: CreateGridStackingCssParams): string => {
    if (!stackAtBreakpoint) {
        return "";
    }

    const breakpoint = viewportManager
        .getViewport()
        .breakpoints.find(bp => bp.name === stackAtBreakpoint);

    if (!breakpoint) {
        return "";
    }

    const direction = reverseWhenStacked ? "column-reverse" : "column";

    // `!important` overrides the inline base (row) styles set on the elements.
    return [
        `@media (max-width: ${breakpoint.maxWidth}px) {`,
        `  .${gridClass} { flex-direction: ${direction} !important; }`,
        `  .${gridClass} > .wb-grid-col { flex: 0 0 100% !important; max-width: 100% !important; }`,
        `}`
    ].join("\n");
};
