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
 * The Theme CMS model, registered per request. Repositories inject this rather than resolving the
 * model themselves — see `ThemeFeature`'s `RequestContextInitializer`.
 */
export const ThemeModel = createAbstraction<CmsModel>("Theme/ThemeModel");

export namespace ThemeModel {
    export type Interface = CmsModel;
}
