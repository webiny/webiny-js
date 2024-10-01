import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser";
import { Topic } from "@webiny/pubsub/types";
import {
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
    EntryBeforeListTopicParams,
    GetUniqueFieldValuesParams,
    OnEntryAfterCreateTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryAfterMoveTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterRepublishTopicParams,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    OnEntryBeforeMoveTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryBeforeRepublishTopicParams,
    OnEntryBeforeRestoreFromBinTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryMoveErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryRepublishErrorTopicParams,
    OnEntryRestoreFromBinErrorTopicParams,
    OnEntryRevisionAfterCreateTopicParams,
    OnEntryRevisionAfterDeleteTopicParams,
    OnEntryRevisionBeforeCreateTopicParams,
    OnEntryRevisionBeforeDeleteTopicParams,
    OnEntryRevisionDeleteErrorTopicParams,
    OnEntryUnpublishErrorTopicParams,
    OnEntryUpdateErrorTopicParams,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "./types";
import { CmsModel } from "./model";

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
    getEntry: <T = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryGetParams
    ) => Promise<CmsEntry<T>>;
    /**
     * Get a list of entries for a model by a given ID (revision).
     */
    getEntriesByIds: (model: CmsModel, revisions: string[]) => Promise<CmsEntry[]>;
    /**
     * Get the entry for a model by a given ID.
     */
    getEntryById: (model: CmsModel, revision: string) => Promise<CmsEntry>;
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
    getPublishedEntriesByIds: (model: CmsModel, ids: string[]) => Promise<CmsEntry[]>;
    /**
     * List latest entries by IDs.
     */
    getLatestEntriesByIds: (model: CmsModel, ids: string[]) => Promise<CmsEntry[]>;
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
    createEntryRevisionFrom: (
        model: CmsModel,
        id: string,
        input: CreateFromCmsEntryInput,
        options?: CreateRevisionCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
    /**
     * Update existing entry.
     */
    updateEntry: <TInput = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput<TInput>,
        meta?: Record<string, any>,
        options?: UpdateCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
    /**
     * Validate the entry - either new one or existing one.
     */
    validateEntry: (
        model: CmsModel,
        id?: string,
        input?: UpdateCmsEntryInput
    ) => Promise<CmsEntryValidateResponse>;
    /**
     * Move entry, and all its revisions, to a new folder.
     */
    moveEntry: (model: CmsModel, id: string, folderId: string) => Promise<CmsEntry>;
    /**
     * Method that republishes entry with given identifier.
     * @internal
     */
    republishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
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
    restoreEntryFromBin: (model: CmsModel, id: string) => Promise<CmsEntry>;
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
    publishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Unpublish entry.
     */
    unpublishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions: (model: CmsModel, id: string) => Promise<CmsEntry[]>;
    /**
     * List all unique values for a given field.
     *
     * @internal
     */
    getUniqueFieldValues: (
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ) => Promise<CmsEntryUniqueValue[]>;
    /**
     * Lifecycle Events
     */
    onEntryBeforeCreate: Topic<OnEntryBeforeCreateTopicParams>;
    onEntryAfterCreate: Topic<OnEntryAfterCreateTopicParams>;
    onEntryCreateError: Topic<OnEntryCreateErrorTopicParams>;

    onEntryRevisionBeforeCreate: Topic<OnEntryRevisionBeforeCreateTopicParams>;
    onEntryRevisionAfterCreate: Topic<OnEntryRevisionAfterCreateTopicParams>;
    onEntryRevisionCreateError: Topic<OnEntryCreateRevisionErrorTopicParams>;

    onEntryBeforeUpdate: Topic<OnEntryBeforeUpdateTopicParams>;
    onEntryAfterUpdate: Topic<OnEntryAfterUpdateTopicParams>;
    onEntryUpdateError: Topic<OnEntryUpdateErrorTopicParams>;

    onEntryBeforeMove: Topic<OnEntryBeforeMoveTopicParams>;
    onEntryAfterMove: Topic<OnEntryAfterMoveTopicParams>;
    onEntryMoveError: Topic<OnEntryMoveErrorTopicParams>;

    onEntryBeforeDelete: Topic<OnEntryBeforeDeleteTopicParams>;
    onEntryAfterDelete: Topic<OnEntryAfterDeleteTopicParams>;
    onEntryDeleteError: Topic<OnEntryDeleteErrorTopicParams>;

    onEntryBeforeRestoreFromBin: Topic<OnEntryBeforeRestoreFromBinTopicParams>;
    onEntryAfterRestoreFromBin: Topic<OnEntryAfterRestoreFromBinTopicParams>;
    onEntryRestoreFromBinError: Topic<OnEntryRestoreFromBinErrorTopicParams>;

    onEntryRevisionBeforeDelete: Topic<OnEntryRevisionBeforeDeleteTopicParams>;
    onEntryRevisionAfterDelete: Topic<OnEntryRevisionAfterDeleteTopicParams>;
    onEntryRevisionDeleteError: Topic<OnEntryRevisionDeleteErrorTopicParams>;

    onEntryBeforePublish: Topic<OnEntryBeforePublishTopicParams>;
    onEntryAfterPublish: Topic<OnEntryAfterPublishTopicParams>;
    onEntryPublishError: Topic<OnEntryPublishErrorTopicParams>;

    onEntryBeforeRepublish: Topic<OnEntryBeforeRepublishTopicParams>;
    onEntryAfterRepublish: Topic<OnEntryAfterRepublishTopicParams>;
    onEntryRepublishError: Topic<OnEntryRepublishErrorTopicParams>;

    onEntryBeforeUnpublish: Topic<OnEntryBeforeUnpublishTopicParams>;
    onEntryAfterUnpublish: Topic<OnEntryAfterUnpublishTopicParams>;
    onEntryUnpublishError: Topic<OnEntryUnpublishErrorTopicParams>;

    onEntryBeforeGet: Topic<OnEntryBeforeGetTopicParams>;
    onEntryBeforeList: Topic<EntryBeforeListTopicParams>;
}
