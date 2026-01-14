import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * RepublishEntry Use Case - Republishes an already published entry.
 * This updates the entry and publishes it again.
 */
export interface IRepublishEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IRepublishEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IRepublishEntryUseCaseErrors[keyof IRepublishEntryUseCaseErrors];

export const RepublishEntryUseCase =
    createAbstraction<IRepublishEntryUseCase>("RepublishEntryUseCase");

export namespace RepublishEntryUseCase {
    export type Interface = IRepublishEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before republish event
 */
export interface EntryBeforeRepublishPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after republish event
 */
export interface EntryAfterRepublishPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for republish error event
 */
export interface EntryRepublishErrorPayload {
    entry: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * RepublishEntryRepository - Handles storage operations for republishing entries.
 */
export interface IRepublishEntryRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IRepublishEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IRepublishEntryRepositoryErrors[keyof IRepublishEntryRepositoryErrors];

export const RepublishEntryRepository = createAbstraction<IRepublishEntryRepository>(
    "RepublishEntryRepository"
);

export namespace RepublishEntryRepository {
    export type Interface = IRepublishEntryRepository;
    export type Error = RepositoryError;
}
