import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * MoveEntry Use Case - Moves an entry to a different folder.
 */
export interface IMoveEntryUseCase {
    execute(model: CmsModel, id: string, folderId: string): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IMoveEntryUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
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
export interface EntryBeforeMovePayload {
    entry: CmsEntry;
    model: CmsModel;
    folderId: string;
}

/**
 * Payload for after move event
 */
export interface EntryAfterMovePayload {
    entry: CmsEntry;
    model: CmsModel;
    folderId: string;
}

/**
 * Payload for move error event
 */
export interface EntryMoveErrorPayload {
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
    storage: EntryStorageError;
}

type RepositoryError = IMoveEntryRepositoryErrors[keyof IMoveEntryRepositoryErrors];

export const MoveEntryRepository = createAbstraction<IMoveEntryRepository>("MoveEntryRepository");

export namespace MoveEntryRepository {
    export type Interface = IMoveEntryRepository;
    export type Error = RepositoryError;
}
