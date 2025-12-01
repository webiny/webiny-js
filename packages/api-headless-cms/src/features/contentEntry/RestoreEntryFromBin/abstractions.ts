import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * RestoreEntryFromBin Use Case - Restores a soft-deleted entry from the bin.
 * This clears the wbyDeleted flag and restores the entry to its original folder.
 */
export interface IRestoreEntryFromBinUseCase {
    execute(model: CmsModel, id: string): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IRestoreEntryFromBinUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IRestoreEntryFromBinUseCaseErrors[keyof IRestoreEntryFromBinUseCaseErrors];

export const RestoreEntryFromBinUseCase = createAbstraction<IRestoreEntryFromBinUseCase>(
    "RestoreEntryFromBinUseCase"
);

export namespace RestoreEntryFromBinUseCase {
    export type Interface = IRestoreEntryFromBinUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before restore event
 */
export interface EntryBeforeRestoreFromBinPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after restore event
 */
export interface EntryAfterRestoreFromBinPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for restore error event
 */
export interface EntryRestoreFromBinErrorPayload {
    entry: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * RestoreEntryFromBinRepository - Handles storage operations for restoring entries from bin.
 */
export interface IRestoreEntryFromBinRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<CmsEntry, RepositoryError>>;
}

export interface IRestoreEntryFromBinRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError =
    IRestoreEntryFromBinRepositoryErrors[keyof IRestoreEntryFromBinRepositoryErrors];

export const RestoreEntryFromBinRepository = createAbstraction<IRestoreEntryFromBinRepository>(
    "RestoreEntryFromBinRepository"
);

export namespace RestoreEntryFromBinRepository {
    export type Interface = IRestoreEntryFromBinRepository;
    export type Error = RepositoryError;
}
