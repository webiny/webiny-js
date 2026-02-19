// CDN URLs for Monaco editor.
export const MONACO_LOADER_URL =
    "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/loader.js";

// SDK TypeScript definition files that will be loaded into Monaco.
// These will be generated from the @webiny/sdk package.
export const SDK_TYPE_DEFINITIONS: Record<string, string> = {
    "sdk-types.ts": `
declare global {
    interface Window {
        sdk: Sdk;
    }
}

export interface WebinyConfig {
    token: string;
    endpoint: string;
    tenant: string;
    fetch?: typeof fetch;
}

export class Webiny {
    readonly cms: CmsSdk;
    constructor(config: WebinyConfig);
}

export { Webiny as Sdk };
export type { WebinyConfig as SdkConfig };

export interface CmsEntryValues {
    [key: string]: any;
}

export type CmsEntryStatus = "published" | "unpublished" | "draft";

export interface CmsIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IEntryState {
    state: string;
    workflowId: string;
    stepId: string;
    stepName: string;
}

export interface CmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id: string;
    entryId: string;
    modelId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    firstPublishedOn?: string;
    lastPublishedOn?: string;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    revisionFirstPublishedOn?: string;
    revisionLastPublishedOn?: string;
    createdBy: CmsIdentity;
    modifiedBy: CmsIdentity;
    savedBy: CmsIdentity;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;
    revisionCreatedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity;
    revisionSavedBy: CmsIdentity;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;
    version: number;
    revision: number;
    status: CmsEntryStatus;
    locked: boolean;
    location: {
        folderId: string;
    };
    values: TValues;
    meta?: {
        state?: IEntryState;
    };
}

export interface GetEntryWhere {
    id?: string;
    entryId?: string;
    version?: number;
}

export interface GetEntryParams {
    model: string;
    where: GetEntryWhere;
}

export interface ListEntriesParams {
    model: string;
    limit?: number;
    after?: string;
    where?: Record<string, any>;
    sort?: string[];
}

export interface ListEntriesResult<TValues extends CmsEntryValues = CmsEntryValues> {
    data: CmsEntryData<TValues>[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface CreateEntryParams<TValues extends CmsEntryValues = CmsEntryValues> {
    model: string;
    values: TValues;
    locale?: string;
    location?: {
        folderId?: string;
    };
}

export interface CreateCmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id: string;
    entryId: string;
    modelId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    createdBy: CmsIdentity;
    modifiedBy: CmsIdentity;
    savedBy: CmsIdentity;
    version: number;
    revision: number;
    status: CmsEntryStatus;
    locked: boolean;
    location: {
        folderId: string;
    };
    values: TValues;
}

export interface UpdateEntryRevisionParams<TValues extends CmsEntryValues = CmsEntryValues> {
    model: string;
    id: string;
    values: TValues;
}

export interface UpdateCmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id: string;
    entryId: string;
    modelId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    createdBy: CmsIdentity;
    modifiedBy: CmsIdentity;
    savedBy: CmsIdentity;
    revisionCreatedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity;
    revisionSavedBy: CmsIdentity;
    version: number;
    revision: number;
    status: CmsEntryStatus;
    locked: boolean;
    location: {
        folderId: string;
    };
    values: TValues;
}

export interface DeleteEntryRevisionParams {
    model: string;
    id: string;
}

export interface PublishEntryRevisionParams {
    model: string;
    id: string;
}

export interface UnpublishEntryRevisionParams {
    model: string;
    id: string;
}

export class CmsSdk {
    getEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<Result<CmsEntryData<TValues> | null, HttpError | GraphQLError | NetworkError>>;

    listEntries<TValues extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<Result<ListEntriesResult<TValues>, HttpError | GraphQLError | NetworkError>>;

    createEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        params: CreateEntryParams<TValues>
    ): Promise<Result<CreateCmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>>;

    updateEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: UpdateEntryRevisionParams<TValues>
    ): Promise<Result<UpdateCmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>>;

    deleteEntryRevision(
        params: DeleteEntryRevisionParams
    ): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>>;

    publishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: PublishEntryRevisionParams
    ): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>>;

    unpublishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
        params: UnpublishEntryRevisionParams
    ): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>>;
}

export interface HttpErrorData {
    status: number;
}

export interface GraphQLErrorData {
    code?: string;
    message: string;
}

export class BaseError<TData = void> extends Error {
    abstract readonly code: string;
    readonly data: TData;
    constructor(message: string, data: TData);
}

export class HttpError extends BaseError<HttpErrorData> {
    readonly code = "HTTP_ERROR";
    readonly data: HttpErrorData;
    constructor(message: string, status: number);
}

export class GraphQLError extends BaseError<GraphQLErrorData> {
    readonly code = "GRAPHQL_ERROR";
    readonly data: GraphQLErrorData;
    constructor(message: string, data: GraphQLErrorData);
}

export class NetworkError extends BaseError<void> {
    readonly code = "NETWORK_ERROR";
}

/**
 * A container type that represents either a successful result (ok) or a failure (fail).
 */
export class Result<TValue, TError = never> {
    static ok<T>(value: T): Result<T, never>;
    static ok(): Result<void, never>;
    
    static fail<E>(error: E): Result<never, E>;
    
    isOk(): this is { _value: TValue } & Result<TValue, TError>;
    isFail(): this is { _error: TError } & Result<TValue, TError>;
    
    get value(): TValue;
    get error(): TError;
    
    map<U>(fn: (value: TValue) => U): Result<U, TError>;
    mapError<F>(fn: (error: TError) => F): Result<TValue, F>;
    flatMap<U>(fn: (value: TValue) => Result<U, TError>): Result<U, TError>;
    match<U>(handlers: { ok: (value: TValue) => U; fail: (error: TError) => U }): U;
}
`
};
