import { createAbstraction } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface ISearchIndexer {
    /**
     * Rebuilds the search rows of the given entries from the entries table. Called inside the write
     * transaction, so a search never sees an entry the entries table does not have (or vice versa).
     */
    syncEntries(db: Knex.Transaction, model: CmsModel, entryIds: string[]): Promise<void>;
    /**
     * Rebuilds the search rows of one batch of the model's entries, in order of entry id, in its
     * own transaction. For reindexing a model after its search settings changed (e.g. from a
     * background task): start with `after: null` and pass the returned cursor until it is null.
     * Entries are only read: every search row (latest and published) is rebuilt from them.
     */
    reindexEntries(model: CmsModel, params: IReindexEntriesParams): Promise<IReindexEntriesResult>;
}

export interface IReindexEntriesParams {
    /* The last entry id of the previous batch; null for the first batch. */
    after: string | null;
    /* Entries per batch. */
    limit: number;
}

export interface IReindexEntriesResult {
    /* Entries reindexed in this batch. */
    indexed: number;
    /* Pass as `after` for the next batch; null when the model is done. */
    cursor: string | null;
}

export const SearchIndexer = createAbstraction<ISearchIndexer>("Cms/Pg/SearchIndexer");

export namespace SearchIndexer {
    export type Interface = ISearchIndexer;
    export type ReindexParams = IReindexEntriesParams;
    export type ReindexResult = IReindexEntriesResult;
}

export interface IEntrySearch {
    list<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>>;
    uniqueValues(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ): Promise<CmsEntryUniqueValue[]>;
}

export const EntrySearch = createAbstraction<IEntrySearch>("Cms/Pg/EntrySearch");

export namespace EntrySearch {
    export type Interface = IEntrySearch;
}
