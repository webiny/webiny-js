// CMS SDK type declarations.
export const CMS_DECLARATIONS = `
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
    /** Full-text search term to filter entries across searchable fields. */
    search?: string;
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
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkError>>;

    /** List entries with optional filtering, sorting, and pagination. */
    listEntries<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkListEntriesParams
    ): Promise<SdkResult<SdkListEntriesResult<TValues>, SdkError>>;

    /** Create a new entry. */
    createEntry<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkCreateEntryParams<TValues>
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkError>>;

    /** Update an existing entry revision. */
    updateEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkUpdateEntryRevisionParams<TValues>
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkError>>;

    /** Delete an entry revision. */
    deleteEntryRevision(
        params: SdkDeleteEntryRevisionParams
    ): Promise<SdkResult<boolean, SdkError>>;

    /** Publish an entry revision. */
    publishEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkPublishEntryRevisionParams
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkError>>;

    /** Unpublish an entry revision. */
    unpublishEntryRevision<TValues extends SdkEntryValues = SdkEntryValues>(
        params: SdkUnpublishEntryRevisionParams
    ): Promise<SdkResult<SdkEntryData<TValues>, SdkError>>;
}
`;
