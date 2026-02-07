export interface GetEntryArgs {
    modelId: string;
    where: Record<string, unknown>;
    fields?: string[];
    preview?: boolean;
}

export interface ListEntriesArgs {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    limit?: number;
    after?: string;
    include?: string[];
    exclude?: string[];
    excludeType?: string[];
    fields?: string[];
    preview?: boolean;
}

export interface CreateEntryArgs {
    modelId: string;
    values: Record<string, unknown>;
}

export interface UpdateEntryArgs {
    modelId: string;
    id: string;
    values: Record<string, unknown>;
}

export interface DeleteEntryArgs {
    modelId: string;
    id: string;
    permanent?: boolean;
}

export interface PublishEntryArgs {
    modelId: string;
    id: string;
}

export interface UnpublishEntryArgs {
    modelId: string;
    id: string;
}
