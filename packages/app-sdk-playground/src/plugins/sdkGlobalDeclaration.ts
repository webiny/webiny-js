// Global ambient declaration injected into Monaco's TypeScript language service.
//
// NOTE: This file contains TypeScript type declarations as a string literal.
// In the future, this can be auto-generated from a real .d.ts file.
//
// RULES (do not break these):
//   1. This string must contain NO top-level `import` or `export` statements.
//      Any import/export makes TypeScript treat the file as a module, scoping
//      all declarations locally instead of globally.
//   2. All types must be declared inline — no cross-file references.
//   3. Register this with addExtraLib using a "file:///" URI.
export const SDK_GLOBAL_DECLARATION = `
interface SdkIdentity {
    id: string;
    displayName: string;
    type: string;
}

type SdkEntryStatus = "published" | "unpublished" | "draft";

interface SdkEntryValues {
    [key: string]: any;
}

interface SdkEntryData<TValues extends SdkEntryValues = SdkEntryValues> {
    id?: string;
    entryId?: string;
    status?: SdkEntryStatus;
    createdOn?: string;
    modifiedOn?: string | null;
    savedOn?: string;
    deletedOn?: string | null;
    restoredOn?: string | null;
    createdBy?: SdkIdentity;
    modifiedBy?: SdkIdentity;
    savedBy?: SdkIdentity;
    firstPublishedOn?: string;
    lastPublishedOn?: string;
    firstPublishedBy?: SdkIdentity;
    lastPublishedBy?: SdkIdentity;
    revisionCreatedOn?: string;
    revisionModifiedOn?: string | null;
    revisionSavedOn?: string;
    revisionCreatedBy?: SdkIdentity;
    revisionModifiedBy?: SdkIdentity | null;
    revisionSavedBy?: SdkIdentity;
    revisionFirstPublishedOn?: string;
    revisionLastPublishedOn?: string;
    revisionFirstPublishedBy?: SdkIdentity;
    revisionLastPublishedBy?: SdkIdentity;
    location?: { folderId?: string | null };
    values?: TValues;
}

interface SdkListEntriesResult<TValues extends SdkEntryValues = SdkEntryValues> {
    data: SdkEntryData<TValues>[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

interface SdkResult<TValue, TError = unknown> {
    isOk(): boolean;
    isFail(): boolean;
    readonly value: TValue;
    readonly error: TError;
}

declare class SdkBaseError extends Error {
    readonly code: string;
    readonly message: string;
}

declare class SdkHttpError extends SdkBaseError {
    readonly code: "HTTP_ERROR";
    readonly data: { status: number };
}

declare class SdkGraphQLError extends SdkBaseError {
    readonly code: "GRAPHQL_ERROR";
    readonly data: { code?: string };
}

declare class SdkNetworkError extends SdkBaseError {
    readonly code: "NETWORK_ERROR";
}

type SdkCmsError = SdkHttpError | SdkGraphQLError | SdkNetworkError;

interface SdkGetEntryParams {
    /** The model ID to query. */
    modelId: string;
    where: {
        /** Revision ID, e.g. "abc#0001". */
        id?: string;
        /** Entry ID, e.g. "abc". */
        entryId?: string;
        /** Filter by entry field values. */
        values?: Record<string, unknown>;
    };
    /** Fields to include in the response. Use "values.fieldName" for entry values. */
    fields: string[];
    /** When true, returns unpublished/draft content. Defaults to false. */
    preview?: boolean;
}

interface SdkListEntriesParams {
    /** The model ID to query. */
    modelId: string;
    /** Filter conditions. */
    where?: Record<string, unknown>;
    /** Sort order per field, e.g. { createdOn: "desc" }. */
    sort?: Record<string, "asc" | "desc">;
    /** Maximum number of entries to return. Defaults to 10. */
    limit?: number;
    /** Pagination cursor from a previous response. */
    after?: string;
    /** Fields to include in the response. Use "values.fieldName" for entry values. */
    fields: string[];
    /** When true, returns unpublished/draft content. Defaults to false. */
    preview?: boolean;
}

interface SdkCreateEntryData<TValues extends SdkEntryValues = SdkEntryValues> {
    values: TValues | undefined;
    status?: SdkEntryStatus;
    location?: { folderId?: string | null };
}

interface SdkCreateEntryParams<TValues extends SdkEntryValues = SdkEntryValues> {
    /** The model ID. */
    modelId: string;
    /** The entry data to create. */
    data: SdkCreateEntryData<TValues>;
    /** Fields to include in the response. */
    fields: string[];
}

interface SdkUpdateEntryData<TValues extends SdkEntryValues = SdkEntryValues> {
    values?: Partial<TValues>;
    location?: { folderId?: string | null };
}

interface SdkUpdateEntryRevisionParams<TValues extends SdkEntryValues = SdkEntryValues> {
    /** The model ID. */
    modelId: string;
    /** The revision ID, e.g. "abc#0001". */
    revisionId: string;
    /** The fields to update. */
    data: SdkUpdateEntryData<TValues>;
    /** Fields to include in the response. */
    fields: string[];
}

interface SdkDeleteEntryRevisionParams {
    /** The model ID. */
    modelId: string;
    /** The revision ID, e.g. "abc#0001". */
    revisionId: string;
    /** When true, permanently deletes the entry. Defaults to false. */
    permanent?: boolean;
}

interface SdkPublishEntryRevisionParams {
    /** The model ID. */
    modelId: string;
    /** The revision ID, e.g. "abc#0001". */
    revisionId: string;
    /** Fields to include in the response. */
    fields: string[];
}

interface SdkUnpublishEntryRevisionParams {
    /** The model ID. */
    modelId: string;
    /** The revision ID, e.g. "abc#0001". */
    revisionId: string;
    /** Fields to include in the response. */
    fields: string[];
}

interface SdkCms {
    /** Get a single entry by ID or field values. */
    getEntry<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkGetEntryParams
    ): Promise<SdkResult<SdkEntryData<TValues> | null, SdkCmsError>>;

    /** List entries with optional filtering, sorting, and pagination. */
    listEntries<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkListEntriesParams
    ): Promise<SdkResult<SdkListEntriesResult<TValues>, SdkCmsError>>;

    /** Create a new entry. */
    createEntry<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkCreateEntryParams<TValues>
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkCmsError>>;

    /** Update an existing entry revision. */
    updateEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkUpdateEntryRevisionParams<TValues>
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkCmsError>>;

    /** Delete an entry revision. */
    deleteEntryRevision(
        params: SdkDeleteEntryRevisionParams
    ): Promise<SdkResult<boolean, SdkCmsError>>;

    /** Publish an entry revision. */
    publishEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkPublishEntryRevisionParams
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkCmsError>>;

    /** Unpublish an entry revision. */
    unpublishEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkUnpublishEntryRevisionParams
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkCmsError>>;
}

interface SdkWebiny {
    /** CMS operations: list, get, create, update, delete, publish entries. */
    readonly cms: SdkCms;
}

declare const sdk: SdkWebiny;
declare interface Window { sdk: SdkWebiny; }
`;
