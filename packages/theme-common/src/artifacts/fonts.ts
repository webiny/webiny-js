import type { FontDefinition } from "~/theme/settings.js";

/**
 * Google Fonts delivery for the CSS artifact — see the change brief, C9.
 *
 * Fonts ship as an `@import` at the top of `tokens.css` rather than a `<link>` in the server-rendered
 * head. The stylesheet has a stable URL and a short TTL (C7), so a font swap follows the same refresh
 * as everything else; a head link would be baked into ISR-cached HTML and could serve the previous
 * typeface long after activation. Only the weights the theme actually uses are requested.
 */

export const GOOGLE_FONTS_ORIGIN = "https://fonts.googleapis.com";
export const GOOGLE_FONTS_STATIC_ORIGIN = "https://fonts.gstatic.com";

/** One `family=` parameter for a font: its weights, and italic axis when the theme uses it. */
const toFamilyParam = (font: FontDefinition): string | null => {
    const family = font.family.trim().replace(/\s+/g, "+");
    if (!family) {
        return null;
    }

    const weights = [...new Set(font.weights)].sort((a, b) => a - b);
    if (weights.length === 0) {
        // No explicit weights → let Google Fonts serve the family's default (400).
        return family;
    }

    const hasItalic = font.styles.some(style => style.toLowerCase() === "italic");
    if (!hasItalic) {
        return `${family}:wght@${weights.join(";")}`;
    }

    // css2 requires `ital,wght` tuples sorted ital-then-weight: 0,400;0,600;1,400;1,600.
    const tuples = [...weights.map(w => `0,${w}`), ...weights.map(w => `1,${w}`)];
    return `${family}:ital,wght@${tuples.join(";")}`;
};

/**
 * A single Google Fonts `css2` stylesheet URL for the theme's fonts, or null when there are none.
 *
 * `display=swap` so text paints immediately in a fallback and swaps when the web font arrives — the
 * default blocks rendering, which is a silent regression if missed.
 */
export const buildGoogleFontsUrl = (fonts: FontDefinition[], display = "swap"): string | null => {
    const families = fonts.map(toFamilyParam).filter((param): param is string => param !== null);
    if (families.length === 0) {
        return null;
    }

    const params = families.map(family => `family=${family}`).join("&");
    return `${GOOGLE_FONTS_ORIGIN}/css2?${params}&display=${display}`;
};

/**
 * The `@import` statement for the theme's fonts, or null when there are none.
 *
 * Placed after the `@layer` statement and before every other rule, which is where CSS requires an
 * `@import` to sit (only `@charset` and `@layer` may precede it).
 */
export const buildFontImport = (fonts: FontDefinition[]): string | null => {
    const url = buildGoogleFontsUrl(fonts);
    return url ? `@import url("${url}");` : null;
};
