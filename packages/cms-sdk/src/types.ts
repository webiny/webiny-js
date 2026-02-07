export interface CmsSdkConfig {
    apiToken: string;
    apiHost: string;
    apiTenant: string;
    fetch?: typeof fetch;
}

export interface GetEntryParams {
    modelId: string;
    where: Record<string, any>;
    fields?: string[];
}

export interface ListEntriesParams {
    modelId: string;
    where?: Record<string, any>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    after?: string;
    include?: string[];
    exclude?: string[];
    excludeType?: string[];
}

export interface CreateEntryParams {
    modelId: string;
    values: Record<string, any>;
}

export interface UpdateEntryParams {
    modelId: string;
    id: string;
    values: Record<string, any>;
}

export interface DeleteEntryParams {
    modelId: string;
    id: string;
    permanent?: boolean;
}

export interface PublishEntryParams {
    modelId: string;
    id: string;
}

export interface UnpublishEntryParams {
    modelId: string;
    id: string;
}

export interface CmsEntry {
    id: string;
    entryId: string;
    [key: string]: any;
}

export interface ListEntriesResult {
    items: CmsEntry[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}
