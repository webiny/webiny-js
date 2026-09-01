export type {
    Asset,
    AssetImage,
    AssetCrop,
    AssetFocalPoint,
    AssetDocument,
    AssetVideo
} from "@webiny/sdk";

export interface CmsSdkConfig {
    apiHost: string;
    apiKey: string;
    apiTenant?: string;
    preview?: boolean;
    fetch?: typeof fetch;
}

export interface CmsEntryValues {
    [key: string]: unknown;
}

export interface CmsEntry<T extends CmsEntryValues = CmsEntryValues> {
    id: string;
    entryId: string;
    createdOn?: string;
    modifiedOn?: string;
    savedOn?: string;
    values: T;
}

export interface CmsListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface CmsListResult<T extends CmsEntryValues = CmsEntryValues> {
    data: CmsEntry<T>[];
    meta: CmsListMeta;
}

export interface GetEntryParams {
    modelId: string;
    entryId: string;
}

export interface ListEntriesParams {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    after?: string;
    search?: string;
}

export interface IEnvironment {
    isClient(): boolean;
    isServer(): boolean;
    isEditing(): boolean;
}

export interface CmsRefModelMetadata {
    valuesSelection: string;
}

export interface CmsModelMetadata {
    valuesSelection?: string;
    componentMap?: Record<string, string>;
    refModels?: Record<string, CmsRefModelMetadata>;
}

export interface CmsModelDefinition {
    name: string;
    modelId: string;
    fields: Array<{
        fieldId: string;
        type: string;
        list?: boolean;
        settings?: Record<string, unknown>;
    }>;
    settings?: Record<string, unknown>;
    metadata?: CmsModelMetadata;
}

export interface IContentSdk {
    getModel(modelId: string): Promise<CmsModelDefinition | null>;
    getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null>;
    listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>>;
}
