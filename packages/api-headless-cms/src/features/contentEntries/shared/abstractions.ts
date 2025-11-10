import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryMeta, CmsEntryListParams, CmsModel } from "~/types/index.js";
import type {
    EntryNotFoundError,
    EntryStorageError,
    EntryValidationError
} from "~/domains/contentEntries/errors.js";
import { NotAuthorizedError } from "~/utils/errors.js";

export interface IEntriesRepositoryErrors {
    base: EntryNotFoundError | EntryStorageError | EntryValidationError;
    notAuthorized: NotAuthorizedError;
}

type RepositoryError = IEntriesRepositoryErrors[keyof IEntriesRepositoryErrors];

/**
 * EntriesRepository follows CQS (Command-Query Separation):
 * - Queries (get, list, getRevisions, etc.): Return data wrapped in Result
 * - Commands (create, update, delete, publish, etc.): Return Result<void, Error>
 */
export interface IEntriesRepository {
    /**
     * Get a specific entry revision by ID.
     */
    getById(model: CmsModel, id: string): Promise<Result<CmsEntry, RepositoryError>>;

    /**
     * Get the latest revision of an entry by entry ID.
     */
    getLatestRevision(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry | null, RepositoryError>>;

    /**
     * Get the published revision of an entry by entry ID.
     */
    getPublishedRevision(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry | null, RepositoryError>>;

    /**
     * Get the previous revision of an entry.
     */
    getPreviousRevision(
        model: CmsModel,
        entryId: string,
        version: number
    ): Promise<Result<CmsEntry | null, RepositoryError>>;

    /**
     * List entries with filtering and pagination.
     */
    list(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<Result<[CmsEntry[], CmsEntryMeta], RepositoryError>>;

    /**
     * Get all revisions of an entry.
     */
    getRevisions(model: CmsModel, entryId: string): Promise<Result<CmsEntry[], RepositoryError>>;

    /**
     * Get multiple entries by their IDs.
     */
    getByIds(model: CmsModel, ids: string[]): Promise<Result<CmsEntry[], RepositoryError>>;

    /**
     * Create a new entry.
     */
    create(model: CmsModel, entry: CmsEntry): Promise<Result<void, RepositoryError>>;

    /**
     * Create a new revision from an existing entry.
     */
    createRevisionFrom(
        model: CmsModel,
        entry: CmsEntry
    ): Promise<Result<void, RepositoryError>>;

    /**
     * Update an existing entry.
     */
    update(
        model: CmsModel,
        entry: CmsEntry,
    ): Promise<Result<void, RepositoryError>>;

    /**
     * Delete an entry (hard delete with all revisions).
     */
    delete(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;

    /**
     * Delete a specific revision.
     */
    deleteRevision(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;

    /**
     * Publish an entry.
     */
    publish(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;

    /**
     * Unpublish an entry.
     */
    unpublish(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;

    /**
     * Move an entry to a folder/location.
     */
    move(model: CmsModel, id: string, folderId: string): Promise<Result<void, RepositoryError>>;

    /**
     * Move an entry to bin (soft delete).
     */
    moveToBin(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;

    /**
     * Restore an entry from bin.
     */
    restoreFromBin(model: CmsModel, id: string): Promise<Result<void, RepositoryError>>;
}

export const EntriesRepository = createAbstraction<IEntriesRepository>("EntriesRepository");

export namespace EntriesRepository {
    export type Interface = IEntriesRepository;
    export type Error = RepositoryError;
}
