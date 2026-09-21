import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, ICmsEntryLive } from "@webiny/api-headless-cms/types/index.js";
import type {
    ResolvedThemeSnapshot,
    ThemePolicy,
    ThemeSettings,
    TokenDocument
} from "@webiny/theme-common";

export interface ThemeIdentity {
    id: string;
    displayName: string | null;
    type: string;
}

export interface ThemeProperties {
    name: string;
    description?: string;
}

/** The values stored on the CMS entry. */
export interface CmsEntryTheme {
    /** The document's shape version (see `THEME_SCHEMA_VERSION`); 0 for a pre-versioning document. */
    schemaVersion: number;
    properties: ThemeProperties;
    /** The DTCG draft document. Aliases are still unresolved here. */
    tokens: TokenDocument;
    policy: ThemePolicy;
    settings: ThemeSettings;
    /**
     * Frozen at publish. Null on a draft that has never been published. Both artifacts are static
     * projections of this, so it — not `tokens` — is what consumers read.
     */
    resolved: ResolvedThemeSnapshot | null;
    /** Provenance and editor state: extraction source URLs, sampled pages, review status. */
    metadata: Record<string, unknown>;
    /** Third-party token groups and policy sections registered by extensions. */
    extensions: Record<string, unknown>;
}

export interface Theme extends CmsEntryTheme {
    id: string;
    entryId: string;
    status: string;
    version: number;
    locked: boolean;
    live: ICmsEntryLive | null;
    createdOn: string;
    createdBy: ThemeIdentity;
    savedOn: string;
    savedBy: ThemeIdentity;
    modifiedOn: string | null;
    modifiedBy: ThemeIdentity | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    tenant: string;
}

/** A row in the version history panel. Deliberately smaller than the full theme. */
export interface ThemeRevision {
    id: string;
    entryId: string;
    version: number;
    name: string;
    status: string;
    locked: boolean;
    savedOn: string;
    createdOn: string;
    createdBy: ThemeIdentity;
    lastPublishedOn: string | null;
    /** The author's note about this version, written at publish. Empty on an unpublished draft. */
    publishComment: string | null;
}

/** The tenant's active theme pointer. Written by activation, read by delivery. */
export interface ActiveThemePointer {
    /** Stable across revisions — the theme, not the version. */
    entryId: string;
    /** Revision id (`entryId#0003`) of the published version that is live. */
    id: string;
    version: number;
    activatedOn: string;
    activatedBy: ThemeIdentity;
}

/**
 * Resolves the Theme CMS model on demand. Repositories inject this rather than the model itself:
 * fetching a model is asynchronous and tenant-dependent, and DI resolution is synchronous, so an
 * already-resolved `CmsModel` could only come from a per-request hook that had to run before any
 * consumer. Consumers `await get()` where they already have an async method, which makes
 * resolution order irrelevant — see `ai-context/code-style/prefer-provider-over-resolved-value.md`.
 */
export interface IThemeModelProvider {
    get(): Promise<CmsModel>;
}

export const ThemeModelProvider = createAbstraction<IThemeModelProvider>(
    "Theme/ThemeModelProvider"
);

export namespace ThemeModelProvider {
    export type Interface = IThemeModelProvider;
}
