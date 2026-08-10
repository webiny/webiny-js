import { CANONICAL_SLOTS, toCssVariableName } from "@webiny/theme-common";

/**
 * A Tailwind preset that binds utility classes to a Webiny theme's design tokens — see the Theme design
 * brief, section 8.3.
 *
 * The insight that makes this static: the canonical token set is fixed and known (`CANONICAL_SLOTS`), so
 * Tailwind only ever needs the *names* mapped to their CSS variables. The values arrive at runtime from
 * the theme's `tokens.css` — so `bg-surface-page` always compiles to
 * `background-color: var(--wby-color-surface-page)`, and swapping the active theme swaps the colour with
 * no rebuild. That is why this needs no build-time fetch of the JSON artifact, and why it is pure.
 *
 * Only the canonical slots are bound (the JSON artifact flags the same set as `canonical`). The
 * composite `type.*` typography roles are deliberately excluded: they are five properties at once, not a
 * single Tailwind scale, and are applied through the rich-text/structural class map instead.
 */

export interface WebinyThemeScales {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    fontSize: Record<string, string>;
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    borderWidth: Record<string, string>;
}

/**
 * Which Tailwind scale each canonical path prefix feeds.
 *
 * A prefix absent from here (i.e. `type`) is skipped. Routing on the path prefix rather than the token's
 * `$type` is deliberate: `space`, `text` and `radius` are all `dimension`-typed but belong to three
 * different Tailwind scales.
 */
const SCALE_BY_PREFIX: Readonly<Record<string, keyof WebinyThemeScales>> = {
    color: "colors",
    space: "spacing",
    text: "fontSize",
    radius: "borderRadius",
    shadow: "boxShadow",
    border: "borderWidth"
};

/**
 * The Tailwind key for a token path: the path minus its scale prefix, dot-segments joined with `-`.
 *
 *   color.surface.page            → surface-page
 *   color.action.primary.background → action-primary-background
 *   space.md                      → md
 */
const toScaleKey = (path: string): string => path.split(".").slice(1).join("-");

/**
 * The theme scales, each key mapped to its `var(--wby-*)` reference.
 *
 * Spread into `theme.extend` (or into `theme` to replace Tailwind's defaults). Derived from
 * `CANONICAL_SLOTS`, so it stays in step with the token set automatically.
 */
export const webinyThemeTokens = (): WebinyThemeScales => {
    const scales: WebinyThemeScales = {
        colors: {},
        spacing: {},
        fontSize: {},
        borderRadius: {},
        boxShadow: {},
        borderWidth: {}
    };

    for (const slot of CANONICAL_SLOTS) {
        const prefix = slot.path.split(".")[0];
        const scale = SCALE_BY_PREFIX[prefix];
        if (!scale) {
            continue;
        }

        scales[scale][toScaleKey(slot.path)] = `var(${toCssVariableName(slot.path)})`;
    }

    return scales;
};

/** The shape of a Tailwind preset carrying only the parts this package sets. */
export interface WebinyThemePreset {
    theme: {
        extend: WebinyThemeScales;
    };
}

/**
 * A ready Tailwind preset. Add it to `presets` in `tailwind.config`.
 *
 * Uses `theme.extend`, so Tailwind's built-in utilities remain — the theme's scales are added, and
 * override the built-ins only where a key collides (e.g. `text-lg` becomes the theme's `text.lg`, which
 * is the point of adopting the theme's type scale). To replace a scale wholesale instead, spread
 * `webinyThemeTokens()` into `theme` rather than using this preset.
 *
 *   // tailwind.config.js
 *   const { webinyThemePreset } = require("@webiny/theme-tailwind");
 *   module.exports = { presets: [webinyThemePreset()], content: [...] };
 */
export const webinyThemePreset = (): WebinyThemePreset => ({
    theme: {
        extend: webinyThemeTokens()
    }
});
