import {
    META_EXTENSION,
    type FluidStepMeta,
    type ThemeMode,
    type TokenDocument,
    type TokenPath,
    type TokenType,
    type TokenValue
} from "./dtcg/types.js";
import { collectTokens } from "./dtcg/traverse.js";
import { resolveDocumentModes } from "./resolve/alias.js";
import type { ThemePolicy } from "./policy/types.js";
import type { ThemeSettings } from "./theme/settings.js";
import { validateForPublish, type PublishWarning } from "./validate/publish.js";

/**
 * The resolved snapshot — see the design brief, section 4.8.
 *
 * Aliases are resolved at publish, never at read. On publish we walk the graph, resolve everything
 * to literals and freeze the result onto the version. Both artifacts are static projections of this
 * snapshot, so no consumer resolves anything at runtime and a published version is genuinely
 * immutable: later edits to a primitive cannot change what a published version renders.
 */

export interface SnapshotToken {
    path: TokenPath;
    type: TokenType | undefined;
    value: TokenValue;
    /** Free-text label. Carried so the JSON artifact can show what the editor showed. */
    displayName?: string;
    /**
     * Deprecated tokens are absent from every selection surface but stay in the snapshot, so
     * published output keeps emitting their variables and existing content renders unchanged.
     */
    deprecated?: boolean;
    /**
     * Fluid state for a ramp step. Carried because the CSS artifact needs both ends to emit
     * `clamp()`, and the artifact must be derivable from the snapshot alone.
     */
    fluid?: FluidStepMeta;
}

export interface ResolvedThemeSnapshot {
    /** Bumped when the snapshot shape changes, so consumers can detect an older payload. */
    schemaVersion: 1;
    resolvedAt: string;
    modes: Record<ThemeMode, SnapshotToken[]>;
    policy: ThemePolicy;
    settings: ThemeSettings;
    /** Advisory issues recorded at publish time, so the version carries what it was warned about. */
    warnings: PublishWarning[];
}

export interface CreateSnapshotParams {
    document: TokenDocument;
    policy: ThemePolicy;
    settings: ThemeSettings;
    /** Injected so snapshots are reproducible in tests. */
    now?: Date;
}

export class ThemeNotPublishableError extends Error {
    constructor(public readonly blockers: ReturnType<typeof validateForPublish>["blockers"]) {
        super(
            `Theme cannot be published — ${blockers.length} issue(s) must be fixed first:\n` +
                blockers.map(blocker => `  • ${blocker.message}`).join("\n")
        );
        this.name = "ThemeNotPublishableError";
    }
}

/**
 * Validates and freezes a draft into a resolved snapshot.
 *
 * Throws {@link ThemeNotPublishableError} when the document has blockers. Callers that want the
 * list without the throw should run `validateForPublish` first — the publish use case does exactly
 * that, so it can return the blockers as a domain error instead of an exception.
 */
export const createResolvedSnapshot = ({
    document,
    policy,
    settings,
    now = new Date()
}: CreateSnapshotParams): ResolvedThemeSnapshot => {
    const validation = validateForPublish(document, settings);

    if (validation.blockers.length > 0) {
        throw new ThemeNotPublishableError(validation.blockers);
    }

    const resolved = resolveDocumentModes(document);

    // Editor metadata lives on the draft document, not on the resolved values, so it is read once
    // here and copied onto the snapshot — the artifacts must be derivable from the snapshot alone.
    const meta = collectTokens(document);

    const toTokens = (mode: ThemeMode): SnapshotToken[] => {
        return [...resolved[mode].tokens.values()].map(token => {
            const extensions = meta.get(token.path)?.token.$extensions?.[META_EXTENSION];

            return {
                path: token.path,
                type: token.type,
                value: token.value,
                ...(extensions?.displayName ? { displayName: extensions.displayName } : {}),
                ...(extensions?.deprecated ? { deprecated: true } : {}),
                ...(extensions?.fluid ? { fluid: extensions.fluid } : {})
            };
        });
    };

    return {
        schemaVersion: 1,
        resolvedAt: now.toISOString(),
        modes: { light: toTokens("light"), dark: toTokens("dark") },
        policy,
        settings,
        warnings: validation.warnings
    };
};

/** Looks a resolved value up by path. Consumers read the snapshot, never the draft document. */
export const getSnapshotValue = (
    snapshot: ResolvedThemeSnapshot,
    mode: ThemeMode,
    path: TokenPath
): TokenValue | undefined => {
    return snapshot.modes[mode].find(token => token.path === path)?.value;
};
