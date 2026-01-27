import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * MoveEntry Use Case - Moves an entry to a different folder.
 */
export interface IMoveEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        folderId: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IMoveEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IMoveEntryUseCaseErrors[keyof IMoveEntryUseCaseErrors];

export const MoveEntryUseCase = createAbstraction<IMoveEntryUseCase>("MoveEntryUseCase");

export namespace MoveEntryUseCase {
    export type Interface = IMoveEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before move event
 */
export interface EntryBeforeMoveEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    folderId: string;
}

/**
 * Payload for after move event
 */
export interface EntryAfterMoveEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    folderId: string;
}

/**
 * Payload for move error event
 */
export interface EntryMoveErrorEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    folderId: string;
    error: Error;
}

/**
 * MoveEntryRepository - Handles storage operations for moving entries.
 */
export interface IMoveEntryRepository {
    execute(model: CmsModel, id: string, folderId: string): Promise<Result<void, RepositoryError>>;
}

export interface IMoveEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IMoveEntryRepositoryErrors[keyof IMoveEntryRepositoryErrors];

export const MoveEntryRepository = createAbstraction<IMoveEntryRepository>("MoveEntryRepository");

export namespace MoveEntryRepository {
    export type Interface = IMoveEntryRepository;
    export type Error = RepositoryError;
}
