import {
    getCanonicalDescription,
    getCanonicalDisplayName,
    getCanonicalSlot
} from "~/canonical/index.js";
import { splitPath } from "~/dtcg/traverse.js";
import type { TokenPath, TokenValue } from "~/dtcg/types.js";
import { CSS_VARIABLE_PREFIX, toCssVariableName } from "~/naming/cssVariable.js";
import type { DefaultModeBehaviour } from "~/policy/types.js";
import type { ResolvedThemeSnapshot, SnapshotToken } from "~/snapshot.js";
import { tokenToDeclarations } from "./values.js";

/**
 * The generation manifest — see the change brief, C6.
 *
 * A filtered projection of the resolved snapshot, and the interface the component-generation module
 * programs against. It answers "which token should this bind to" — so it carries only the bindable,
 * semantic layer: every canonical semantic slot, plus custom semantic tokens that opted in. It
 * excludes primitives, ramp steps, deprecated tokens and component tokens, each for a reason: a model
 * that can see `blue-500` uses it directly and breaks dark mode; one that can see `radius.md` binds a
 * button to a ramp step, which is the problem the semantic layer exists to solve.
 *
 * It carries its OWN version so the component module can evolve against it independently of the token
 * schema.
 */

export interface ManifestSlot {
    path: TokenPath;
    /** Human-readable, group-qualified so a repeated label stays unambiguous. */
    displayName: string;
    /** Usage guidance the model reads to decide when to bind this token. */
    description: string;
    /** The CSS custom properties this slot contributes — what generated code references. */
    cssVariables: string[];
    /** Resolved values in both modes, so the model can judge light-vs-dark and pick a foreground. */
    values: { light: TokenValue; dark: TokenValue };
}

/** The generation-relevant slice of policy — kept small and stable, not the whole policy tree. */
export interface ManifestPolicy {
    allowArbitraryColor: boolean;
    allowArbitraryFontSize: boolean;
    defaultMode: DefaultModeBehaviour;
}

export interface ThemeManifest {
    /**
     * The manifest's own contract version, independent of the token/JSON schema version. Lets the
     * component module adapt to manifest changes without being coupled to the token schema.
     */
    manifestVersion: 1;
    themeId: string;
    version: number;
    resolvedAt: string;
    cssVariablePrefix: string;
    slots: ManifestSlot[];
    policy: ManifestPolicy;
}

export interface GenerateManifestOptions {
    themeId: string;
    version: number;
}

/** Bindable semantic tokens only: canonical semantic slots, or custom tokens that opted in. */
const isManifestSlot = (token: SnapshotToken): boolean => {
    if (token.deprecated) {
        return false;
    }
    const canonical = getCanonicalSlot(token.path);
    if (canonical) {
        return canonical.kind === "semantic";
    }
    // Not canonical: a primitive, ramp step or component token — in only if explicitly opted in.
    return token.includeInManifest === true;
};

export const generateManifestArtifact = (
    snapshot: ResolvedThemeSnapshot,
    { themeId, version }: GenerateManifestOptions
): ThemeManifest => {
    const darkByPath = new Map(snapshot.modes.dark.map(token => [token.path, token]));

    const slots: ManifestSlot[] = snapshot.modes.light.filter(isManifestSlot).map(token => {
        const dark = darkByPath.get(token.path);
        return {
            path: token.path,
            displayName:
                token.displayName ??
                getCanonicalDisplayName(token.path) ??
                splitPath(token.path).pop() ??
                token.path,
            description: token.description ?? getCanonicalDescription(token.path) ?? "",
            cssVariables: tokenToDeclarations(token, toCssVariableName(token.path)).map(
                declaration => declaration.name
            ),
            values: {
                light: token.value,
                dark: dark ? dark.value : token.value
            }
        };
    });

    return {
        manifestVersion: 1,
        themeId,
        version,
        resolvedAt: snapshot.resolvedAt,
        cssVariablePrefix: CSS_VARIABLE_PREFIX,
        slots,
        policy: {
            allowArbitraryColor: snapshot.policy.color.entry === "open",
            allowArbitraryFontSize: snapshot.policy.fontSize.entry === "open",
            defaultMode: snapshot.policy.defaultMode
        }
    };
};
