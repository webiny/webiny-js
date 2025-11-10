import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel, CmsDeleteEntryOptions } from "~/types/index.js";
import type { EntryNotFoundError, EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * DeleteEntry Use Case - Permanently deletes an entry from the database.
 * This is a hard delete that removes all traces of the entry.
 */
export interface IDeleteEntryUseCase {
    execute(
        model: CmsModel,
        id: string,
        options?: CmsDeleteEntryOptions
    ): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteEntryUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type UseCaseError = IDeleteEntryUseCaseErrors[keyof IDeleteEntryUseCaseErrors];

export const DeleteEntryUseCase = createAbstraction<IDeleteEntryUseCase>("DeleteEntryUseCase");

export namespace DeleteEntryUseCase {
    export type Interface = IDeleteEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before delete event
 */
export interface EntryBeforeDeletePayload {
    entry: CmsEntry;
    model: CmsModel;
    permanent: boolean;
}

/**
 * Payload for after delete event
 */
export interface EntryAfterDeletePayload {
    entry: CmsEntry;
    model: CmsModel;
    permanent: boolean;
}

/**
 * Payload for delete error event
 */
export interface EntryDeleteErrorPayload {
    entry: CmsEntry;
    model: CmsModel;
    permanent: boolean;
    error: Error;
}

/**
 * DeleteEntryRepository - Handles storage operations for permanently deleting entries.
 */
export interface IDeleteEntryRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteEntryRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IDeleteEntryRepositoryErrors[keyof IDeleteEntryRepositoryErrors];

export const DeleteEntryRepository =
    createAbstraction<IDeleteEntryRepository>("DeleteEntryRepository");

export namespace DeleteEntryRepository {
    export type Interface = IDeleteEntryRepository;
    export type Error = RepositoryError;
}

/**
 * MoveEntryToBin Use Case - Soft deletes an entry by marking it as deleted.
 * This moves the entry to the bin (trash) instead of permanently deleting it.
 */
export interface IMoveEntryToBinUseCase {
    execute(model: CmsModel, id: string): Promise<Result<void, UseCaseError>>;
}

export const MoveEntryToBinUseCase =
    createAbstraction<IMoveEntryToBinUseCase>("MoveEntryToBinUseCase");

export namespace MoveEntryToBinUseCase {
    export type Interface = IMoveEntryToBinUseCase;
    export type Error = UseCaseError;
}

/**
 * MoveEntryToBinRepository - Handles storage operations for soft deleting entries.
 */
export interface IMoveEntryToBinRepository {
    execute(params: { model: CmsModel; entry: CmsEntry }): Promise<Result<void, RepositoryError>>;
}

export const MoveEntryToBinRepository = createAbstraction<IMoveEntryToBinRepository>(
    "MoveEntryToBinRepository"
);

export namespace MoveEntryToBinRepository {
    export type Interface = IMoveEntryToBinRepository;
    export type Error = RepositoryError;
}
