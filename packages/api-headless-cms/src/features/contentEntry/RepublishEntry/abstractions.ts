import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

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

/** Republish a content entry. */
export const RepublishEntryUseCase =
    createAbstraction<IRepublishEntryUseCase>("RepublishEntryUseCase");

export namespace RepublishEntryUseCase {
    export type Interface = IRepublishEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}

/**
 * Payload for before republish event
 */
export interface EntryBeforeRepublishEventPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after republish event
 */
export interface EntryAfterRepublishEventPayload {
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for republish error event
 */
export interface EntryRepublishErrorEventPayload {
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
