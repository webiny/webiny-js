import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * DeleteMultipleEntries Use Case - Deletes multiple entries at once.
 */
export interface IDeleteMultipleEntriesUseCase {
    execute(
        model: CmsModel,
        params: { entries: string[] }
    ): Promise<Result<Array<{ id: string }>, UseCaseError>>;
}

export interface IDeleteMultipleEntriesUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IDeleteMultipleEntriesUseCaseErrors[keyof IDeleteMultipleEntriesUseCaseErrors];

export const DeleteMultipleEntriesUseCase = createAbstraction<IDeleteMultipleEntriesUseCase>(
    "DeleteMultipleEntriesUseCase"
);

export namespace DeleteMultipleEntriesUseCase {
    export type Interface = IDeleteMultipleEntriesUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before delete multiple event
 */
export interface EntryBeforeDeleteMultipleEventPayload {
    entries: CmsEntry[];
    ids: string[];
    model: CmsModel;
}

/**
 * Payload for after delete multiple event
 */
export interface EntryAfterDeleteMultipleEventPayload {
    entries: CmsEntry[];
    ids: string[];
    model: CmsModel;
}

/**
 * Payload for delete multiple error event
 */
export interface EntryDeleteMultipleErrorEventPayload {
    entries: CmsEntry[];
    ids: string[];
    model: CmsModel;
    error: Error;
}

/**
 * DeleteMultipleEntriesRepository - Handles storage operations for deleting multiple entries.
 */
export interface IDeleteMultipleEntriesRepository {
    execute(model: CmsModel, entryIds: string[]): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteMultipleEntriesRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError =
    IDeleteMultipleEntriesRepositoryErrors[keyof IDeleteMultipleEntriesRepositoryErrors];

export const DeleteMultipleEntriesRepository = createAbstraction<IDeleteMultipleEntriesRepository>(
    "DeleteMultipleEntriesRepository"
);

export namespace DeleteMultipleEntriesRepository {
    export type Interface = IDeleteMultipleEntriesRepository;
    export type Error = RepositoryError;
}
