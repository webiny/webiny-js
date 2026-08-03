import { splitPath } from "~/dtcg/traverse.js";
import type { TokenPath } from "~/dtcg/types.js";
import type { TypographySubProperty } from "~/dtcg/guards.js";

/**
 * Variable naming — see the design brief, section 4.9.
 *
 * The prefix is `--wby-`, deliberately not the existing `--wb-`. Both will be in scope on the same
 * page during the coexistence period (`--wb-theme-color1` from the starter kit, `--wb-spacing-*`
 * from the editor chrome), and a distinct prefix removes any shadowing risk.
 */
export const CSS_VARIABLE_PREFIX = "--wby-";

/** camelCase and PascalCase segments become hyphenated: `bodySmall` -> `body-small`. */
export const kebabCase = (segment: string): string => {
    return segment
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
};

/**
 * Derives a CSS custom property name from a token path.
 *
 * ```
 * color.surface.page              -> --wby-color-surface-page
 * color.action.primary.background -> --wby-color-action-primary-background
 * space.lg                        -> --wby-space-lg
 * type.bodySmall                  -> --wby-type-body-small
 * ```
 *
 * Mode is deliberately not part of the name — dark values reuse the same names under the dark
 * selector.
 */
export const toCssVariableName = (path: TokenPath): string => {
    const segments = splitPath(path).map(kebabCase);
    if (segments.length === 0) {
        throw new Error(`Cannot derive a CSS variable name from an empty token path.`);
    }
    return `${CSS_VARIABLE_PREFIX}${segments.join("-")}`;
};

/**
 * Composite typography tokens flatten to one variable per sub-property. The CSS segment is
 * deliberately shorter than the DTCG property name (`fontFamily` -> `family`) so the emitted names
 * read as `--wby-type-heading-1-family`.
 */
export const TYPOGRAPHY_CSS_SEGMENTS: Readonly<Record<TypographySubProperty, string>> = {
    fontFamily: "family",
    fontSize: "size",
    fontWeight: "weight",
    lineHeight: "line-height",
    letterSpacing: "letter-spacing"
};

export const toTypographyCssVariableName = (
    path: TokenPath,
    subProperty: TypographySubProperty
): string => {
    return `${toCssVariableName(path)}-${TYPOGRAPHY_CSS_SEGMENTS[subProperty]}`;
};

/** Wraps a variable name for use as a value: `var(--wby-color-surface-page)`. */
export const toCssVariableReference = (variableName: string): string => `var(${variableName})`;
