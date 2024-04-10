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
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    OnEntryBeforeMoveTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryBeforeRepublishTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryMoveErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryRepublishErrorTopicParams,
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
    getEntry: (model: CmsModel, params: CmsEntryGetParams) => Promise<CmsEntry>;
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
    listEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Lists the latest entries. Used for manage API.
     */
    listLatestEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List published entries. Used for read API.
     */
    listPublishedEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Lists the deleted entries. Used for manage API.
     */
    listDeletedEntries: <T = CmsEntryValues>(
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
    createEntry: (
        model: CmsModel,
        input: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
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
    updateEntry: (
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput,
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
