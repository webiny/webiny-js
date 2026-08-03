import { toCssVariableName } from "@webiny/theme-common/naming/cssVariable.js";
import type { TokenReference, ValueBinding } from "~/types.js";

/**
 * Design token references in element styles — see the Theme design brief, section 7.1.
 *
 * Content stores a *structured* reference, never a resolved value and never a raw CSS variable
 * string. Storing `var(--wby-color-surface-page)` would bake the naming convention into customer
 * data, making a prefix change a data migration; and Admin needs the structured form to show which
 * token is selected when a picker is reopened.
 *
 * The renderer converts a reference to `var(--wby-…)` at output time. That conversion lives here so
 * there is exactly one place that knows the mapping.
 */

export const isTokenBinding = (
    binding: ValueBinding | undefined
): binding is ValueBinding & { token: TokenReference } => {
    return Boolean(binding?.token?.path);
};

/**
 * Emits the CSS value for a reference.
 *
 * The stored fallback is emitted as the `var()` second argument. That matters when no theme is
 * active — a variable that resolves to nothing makes the browser drop the whole declaration, so
 * content authored under a theme would visibly lose its colour the moment the theme is deactivated.
 * With a fallback it keeps rendering the value it had when it was picked.
 */
export const tokenToCssValue = (reference: TokenReference): string => {
    const variable = toCssVariableName(reference.path);

    return reference.fallback ? `var(${variable}, ${reference.fallback})` : `var(${variable})`;
};

/** Builds a reference, capturing the currently resolved value as the fallback. */
export const createTokenReference = (path: string, fallback?: string): TokenReference => {
    return fallback ? { path, fallback } : { path };
};
