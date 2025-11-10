import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * DeleteEntryRevision Use Case - Deletes a specific revision of an entry.
 * Handles special cases like deleting the latest revision.
 */
export interface IDeleteEntryRevisionUseCase {
    execute(model: CmsModel, revisionId: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteEntryRevisionUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type UseCaseError = IDeleteEntryRevisionUseCaseErrors[keyof IDeleteEntryRevisionUseCaseErrors];

export const DeleteEntryRevisionUseCase = createAbstraction<IDeleteEntryRevisionUseCase>(
    "DeleteEntryRevisionUseCase"
);

export namespace DeleteEntryRevisionUseCase {
    export type Interface = IDeleteEntryRevisionUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before delete event
 */
export interface EntryRevisionBeforeDeletePayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after delete event
 */
export interface EntryRevisionAfterDeletePayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for delete error event
 */
export interface EntryRevisionDeleteErrorPayload {
    entry: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * DeleteEntryRevisionRepository - Handles storage operations for deleting entry revisions.
 */
export interface IDeleteEntryRevisionRepository {
    execute(params: {
        model: CmsModel;
        entry: CmsEntry;
        latestEntry: CmsEntry | null;
    }): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteEntryRevisionRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IDeleteEntryRevisionRepositoryErrors[keyof IDeleteEntryRevisionRepositoryErrors];

export const DeleteEntryRevisionRepository = createAbstraction<IDeleteEntryRevisionRepository>(
    "DeleteEntryRevisionRepository"
);

export namespace DeleteEntryRevisionRepository {
    export type Interface = IDeleteEntryRevisionRepository;
    export type Error = RepositoryError;
}
