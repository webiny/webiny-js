import { createAbstraction } from "@webiny/feature/admin";
import type {
    PublishWarning,
    ResolvedThemeSnapshot,
    ThemePolicy,
    ThemeSettings,
    TokenDocument
} from "@webiny/theme-common";

export interface ThemeIdentityDto {
    id: string;
    displayName: string | null;
    type: string;
}

export interface ThemeDto {
    id: string;
    entryId: string;
    status: string;
    version: number;
    locked: boolean;
    createdOn: string;
    savedOn: string;
    createdBy: ThemeIdentityDto | null;
    savedBy: ThemeIdentityDto | null;
    lastPublishedOn: string | null;
    properties: { name: string; description?: string };
    tokens: TokenDocument;
    policy: ThemePolicy;
    settings: ThemeSettings;
    resolved: ResolvedThemeSnapshot | null;
    metadata: Record<string, unknown>;
    extensions: Record<string, unknown>;
}

export interface ThemeRevisionDto {
    id: string;
    entryId: string;
    version: number;
    name: string;
    status: string;
    locked: boolean;
    savedOn: string;
    createdOn: string;
    createdBy: ThemeIdentityDto | null;
    lastPublishedOn: string | null;
    /** The author's note about this version, written at publish. Empty on an unpublished draft. */
    publishComment: string | null;
}

export interface ActiveThemePointerDto {
    entryId: string;
    id: string;
    version: number;
    activatedOn: string;
    activatedBy: ThemeIdentityDto | null;
}

export interface CreateThemeInputDto {
    properties: { name: string; description?: string };
}

export interface UpdateThemeInputDto {
    properties?: { name?: string; description?: string };
    tokens?: TokenDocument;
    policy?: ThemePolicy;
    settings?: ThemeSettings;
    metadata?: Record<string, unknown>;
}

export interface PublishThemeResultDto {
    theme: ThemeDto;
    warnings: PublishWarning[];
}

export interface ActivateThemeResultDto {
    theme: ThemeDto;
    pointer: ActiveThemePointerDto;
    previous: ActiveThemePointerDto | null;
}

/**
 * All Theme API calls in one place.
 *
 * A single multi-method gateway rather than one abstraction per operation: they all talk to the
 * same GraphQL namespace, share the same envelope handling, and splitting them would mean eleven
 * near-identical files.
 */
export interface ExtractThemeInputDto {
    url: string;
    name: string;
    crawlLimit?: number;
    force?: boolean;
}

export interface ExtractionStartedDto {
    taskId: string;
    /** Correlates the websocket progress messages for this run. */
    extractionId: string;
}

export type ExtractionStateDto = "pending" | "running" | "failed" | "success" | "aborted";

export interface ExtractionStatusDto {
    taskId: string;
    state: ExtractionStateDto;
    themeId: string | null;
    entryUrl: string | null;
    sampledUrls: string[] | null;
    error: string | null;
}

export interface IThemeGateway {
    list(): Promise<ThemeDto[]>;
    get(id: string): Promise<ThemeDto>;
    getRevisions(entryId: string): Promise<ThemeRevisionDto[]>;
    getActive(): Promise<{ theme: ThemeDto | null; pointer: ActiveThemePointerDto | null }>;
    create(data: CreateThemeInputDto): Promise<ThemeDto>;
    update(id: string, data: UpdateThemeInputDto): Promise<ThemeDto>;
    remove(id: string): Promise<void>;
    createRevisionFrom(id: string): Promise<ThemeDto>;
    publish(id: string, comment?: string): Promise<PublishThemeResultDto>;
    activate(id: string): Promise<ActivateThemeResultDto>;
    deactivate(): Promise<void>;
    /**
     * Whether the (opt-in) extraction backend is registered on this deployment. Lets the Admin hide
     * the "generate from a website" option when the feature is not installed.
     */
    isExtractionAvailable(): Promise<boolean>;
    extract(data: ExtractThemeInputDto): Promise<ExtractionStartedDto>;
    /** Recovers state after a page reload, when the websocket stream was missed. */
    getExtraction(taskId: string): Promise<ExtractionStatusDto>;
    abortExtraction(taskId: string): Promise<void>;
}

export const ThemeGateway = createAbstraction<IThemeGateway>("Theme/ThemeGateway");

export namespace ThemeGateway {
    export type Interface = IThemeGateway;
    export type Theme = ThemeDto;
    export type Revision = ThemeRevisionDto;
    export type ActivePointer = ActiveThemePointerDto;
}

/**
 * Carries the blocker list off a failed publish so the UI can render it as a checklist rather than
 * a single opaque message.
 */
export class ThemeGraphQLError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly data: Record<string, unknown> | null
    ) {
        super(message);
        this.name = "ThemeGraphQLError";
    }
}
