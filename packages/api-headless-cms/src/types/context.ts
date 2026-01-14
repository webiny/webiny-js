import type { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser.js";
import type {
    CmsDeleteEntryOptions,
    CmsEntry,
    CmsEntryGetParams,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryUniqueValue,
    CmsEntryValidateResponse,
    CmsEntryValues,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput,
    CreateFromCmsEntryInput,
    CreateRevisionCmsEntryOptionsInput,
    DeleteMultipleEntriesParams,
    DeleteMultipleEntriesResponse,
    GetUniqueFieldValuesParams,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "./types.js";
import type { CmsModel } from "./model.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Cms Entry CRUD methods in the context.
 *
 * @category Context
 * @category CmsEntry
 */
export interface CmsEntryContext {
    /**
     * Get content entry traverser.
     */
    getEntryTraverser: (modelId: string) => Promise<ContentEntryTraverser>;
    /**
     * Get a single content entry for a model.
     */
    getEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryGetParams
    ) => Promise<CmsEntry<T>>;
    /**
     * Get a list of entries for a model by a given ID (revision).
     */
    getEntriesByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revisions: string[]
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Get the entry for a model by a given ID.
     */
    getEntryById<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<CmsEntry<T>>;
    /**
     * List entries for a model. Internal method used by get, listLatest and listPublished.
     */
    listEntries: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Lists the latest entries. Used for manage API.
     */
    listLatestEntries: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List published entries. Used for read API.
     */
    listPublishedEntries: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Lists the deleted entries. Used for manage API.
     */
    listDeletedEntries: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List published entries by IDs.
     */
    getPublishedEntriesByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ) => Promise<CmsEntry<T>[]>;
    /**
     * List latest entries by IDs.
     */
    getLatestEntriesByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Create a new content entry.
     */
    createEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ) => Promise<CmsEntry<T>>;
    /**
     * Create a new entry from already existing entry.
     */
    createEntryRevisionFrom: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: CreateFromCmsEntryInput<T>,
        options?: CreateRevisionCmsEntryOptionsInput
    ) => Promise<CmsEntry<T>>;
    /**
     * Update existing entry.
     */
    updateEntry: <TInput extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput<TInput>,
        meta?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ) => Promise<CmsEntry<TInput>>;
    /**
     * Validate the entry - either new one or existing one.
     */
    validateEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id?: string,
        input?: UpdateCmsEntryInput<T>
    ) => Promise<CmsEntryValidateResponse>;
    /**
     * Move entry, and all its revisions, to a new folder.
     */
    moveEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        folderId: string
    ) => Promise<CmsEntry<T>>;
    /**
     * Method that republishes entry with given identifier.
     * @internal
     */
    republishEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => Promise<CmsEntry<T>>;
    /**
     * Delete only a certain revision of the entry.
     */
    deleteEntryRevision: (model: CmsModel, id: string) => Promise<void>;
    /**
     * Delete entry with all its revisions.
     */
    deleteEntry: (model: CmsModel, id: string, options?: CmsDeleteEntryOptions) => Promise<void>;
    /**
     * Restore entry from trash bin with all its revisions.
     */
    restoreEntryFromBin: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => Promise<CmsEntry<T>>;
    /**
     * Delete multiple entries
     */
    deleteMultipleEntries: (
        model: CmsModel,
        params: DeleteMultipleEntriesParams
    ) => Promise<DeleteMultipleEntriesResponse>;
    /**
     * Publish entry.
     */
    publishEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => Promise<CmsEntry<T>>;
    /**
     * Unpublish entry.
     */
    unpublishEntry: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => Promise<CmsEntry<T>>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => Promise<CmsEntry<T>[]>;
    /**
     * List all unique values for a given field.
     *
     * @internal
     */
    getUniqueFieldValues: (
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ) => Promise<CmsEntryUniqueValue[]>;
}
