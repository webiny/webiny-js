import { CANONICAL_SLOTS, getCanonicalDescription } from "~/canonical/index.js";
import { createDefaultThemeDocument } from "~/defaults/defaultTheme.js";
import { resolveDocumentModes } from "~/resolve/alias.js";
import { tokenToDeclarations } from "~/artifacts/values.js";
import { toCssVariableName } from "~/naming/cssVariable.js";
import { splitPath } from "~/dtcg/traverse.js";
import type { TokenPath } from "~/dtcg/types.js";
import type { SnapshotToken } from "~/snapshot.js";

/**
 * The authoring token catalog — the reference a component author (or the generation model) uses to
 * write `var(--wby-…, <fallback>)` instead of hardcoded style values.
 *
 * One entry per CSS custom property the theme emits for the canonical token set: colours, typography
 * roles (flattened to their sub-property variables), the non-colour semantic roles, and the ramp
 * steps. Brand primitives are deliberately excluded — they are theme-specific and pruned per theme,
 * so a component must never bind to them; it binds to the stable canonical names, which every theme
 * defines.
 */
export interface TokenCatalogEntry {
    /** The CSS custom property, e.g. `--wby-color-action-primary-background`. */
    variable: string;
    /**
     * The default theme's resolved value for this variable — used as the `var()` fallback so a
     * component still renders when no theme is active.
     */
    fallback: string;
    /** What the token is for. Empty for ramp steps, which are scale positions rather than roles. */
    description: string;
    /** Leading path segment, for grouping in a reference table: color | type | space | radius | … */
    group: string;
    /** The canonical token path the variable derives from. */
    path: TokenPath;
}

/**
 * Builds the catalog from the canonical set resolved against the default theme, so it stays in step
 * with the tokens automatically. Pure: no I/O, deterministic order (canonical order).
 */
export const getTokenCatalog = (): TokenCatalogEntry[] => {
    const resolved = resolveDocumentModes(createDefaultThemeDocument());
    const light = resolved.light.tokens;
    const entries: TokenCatalogEntry[] = [];

    for (const slot of CANONICAL_SLOTS) {
        const resolvedToken = light.get(slot.path);
        if (!resolvedToken) {
            continue;
        }

        const token: SnapshotToken = {
            path: slot.path,
            type: slot.type,
            value: resolvedToken.value
        };
        const description = getCanonicalDescription(slot.path) ?? "";
        const group = splitPath(slot.path)[0] ?? "";

        // A composite typography role flattens to one entry per sub-property variable; every other
        // token contributes a single entry.
        for (const declaration of tokenToDeclarations(token, toCssVariableName(slot.path))) {
            entries.push({
                variable: declaration.name,
                fallback: declaration.value,
                description,
                group,
                path: slot.path
            });
        }
    }

    return entries;
};
