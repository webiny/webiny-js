import { isCanonicalPath } from "~/canonical/index.js";
import { joinPath, splitPath } from "~/dtcg/traverse.js";
import type { FluidStepMeta, TokenPath, TokenType, TokenValue } from "~/dtcg/types.js";
import { CSS_VARIABLE_PREFIX, toCssVariableName } from "~/naming/cssVariable.js";
import type { ThemePolicy } from "~/policy/types.js";
import type { FontDefinition, ThemeSettings } from "~/theme/settings.js";
import type { ResolvedThemeSnapshot } from "~/snapshot.js";
import type { PublishWarning } from "~/validate/publish.js";
import { tokenToDeclarations } from "./values.js";

/**
 * The JSON artifact — see the design brief, section 6.2.
 *
 * This is the source of truth for Admin and the SDK. It carries token names, display names, group
 * structure, types, slot mapping, resolved values and the policy section. The CSS artifact is a
 * projection of the same snapshot, so the two can never disagree.
 */

export interface JsonArtifactToken {
    path: TokenPath;
    /** Last path segment. */
    name: string;
    displayName?: string;
    /** Usage guidance seeded on canonical slots; read by Admin and the generation manifest. */
    description?: string;
    /** Dot-path of the parent group, empty for a top-level token. */
    group: string;
    type?: TokenType;
    /**
     * Slot mapping: true for core-owned canonical slots, which are the only tokens Admin UI, Lexical
     * and the Tailwind adapter bind to.
     */
    canonical: boolean;
    /** Hidden from every selection surface, but still emitted so existing content renders. */
    deprecated?: boolean;
    /**
     * Every CSS custom property this token contributes. One entry for most types; five for a
     * composite typography token.
     */
    cssVariables: string[];
    values: {
        light: TokenValue;
        dark: TokenValue;
    };
    fluid?: FluidStepMeta;
}

export interface JsonArtifactGroup {
    path: string;
    /** Immediate child token paths, in declaration order. */
    tokens: TokenPath[];
    /** Immediate child group paths. */
    groups: string[];
}

export interface ThemeJsonArtifact {
    schemaVersion: 1;
    themeId: string;
    version: number;
    /** Copied from the snapshot, so the artifact and the version it came from stay tied together. */
    resolvedAt: string;
    cssVariablePrefix: string;
    tokens: JsonArtifactToken[];
    groups: JsonArtifactGroup[];
    policy: ThemePolicy;
    viewport: ThemeSettings["viewport"];
    /**
     * Font metadata for consumers that want it (Admin, tooling). Delivery itself no longer reads this
     * — fonts ship as an `@import` inside `tokens.css` (C9) rather than head links.
     */
    fonts: FontDefinition[];
    /** Advisory issues recorded when this version was published. */
    warnings: PublishWarning[];
}

export interface GenerateJsonOptions {
    themeId: string;
    version: number;
}

const buildGroups = (paths: TokenPath[]): JsonArtifactGroup[] => {
    const groups = new Map<string, JsonArtifactGroup>();

    const ensure = (path: string): JsonArtifactGroup => {
        let group = groups.get(path);
        if (!group) {
            group = { path, tokens: [], groups: [] };
            groups.set(path, group);
        }
        return group;
    };

    ensure("");

    for (const path of paths) {
        const segments = splitPath(path);
        const parent = joinPath(segments.slice(0, -1));

        ensure(parent).tokens.push(path);

        // Register every ancestor so the tree is complete even where a group holds only groups.
        for (let depth = segments.length - 1; depth > 0; depth--) {
            const groupPath = joinPath(segments.slice(0, depth));
            const parentPath = joinPath(segments.slice(0, depth - 1));
            const parentGroup = ensure(parentPath);
            ensure(groupPath);

            if (!parentGroup.groups.includes(groupPath)) {
                parentGroup.groups.push(groupPath);
            }
        }
    }

    return [...groups.values()];
};

export const generateJsonArtifact = (
    snapshot: ResolvedThemeSnapshot,
    { themeId, version }: GenerateJsonOptions
): ThemeJsonArtifact => {
    const darkByPath = new Map(snapshot.modes.dark.map(token => [token.path, token]));

    const tokens: JsonArtifactToken[] = snapshot.modes.light.map(token => {
        const segments = splitPath(token.path);
        const dark = darkByPath.get(token.path);

        return {
            path: token.path,
            name: segments[segments.length - 1],
            ...(token.displayName ? { displayName: token.displayName } : {}),
            ...(token.description ? { description: token.description } : {}),
            group: joinPath(segments.slice(0, -1)),
            type: token.type,
            canonical: isCanonicalPath(token.path),
            ...(token.deprecated ? { deprecated: true } : {}),
            cssVariables: tokenToDeclarations(token, toCssVariableName(token.path)).map(
                declaration => declaration.name
            ),
            values: {
                light: token.value,
                // A token with no dark override resolves identically in both modes.
                dark: dark ? dark.value : token.value
            },
            ...(token.fluid ? { fluid: token.fluid } : {})
        };
    });

    return {
        schemaVersion: 1,
        themeId,
        version,
        resolvedAt: snapshot.resolvedAt,
        cssVariablePrefix: CSS_VARIABLE_PREFIX,
        tokens,
        groups: buildGroups(tokens.map(token => token.path)),
        policy: snapshot.policy,
        viewport: snapshot.settings.viewport,
        fonts: snapshot.settings.fonts,
        warnings: snapshot.warnings
    };
};
