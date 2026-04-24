import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * PublishEntry Use Case - Publishes an entry revision.
 */
export interface IPublishEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IPublishEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    storage: EntryPersistenceError;
}

type UseCaseError = IPublishEntryUseCaseErrors[keyof IPublishEntryUseCaseErrors];

/** Publish a content entry. */
export const PublishEntryUseCase = createAbstraction<IPublishEntryUseCase>("PublishEntryUseCase");

export namespace PublishEntryUseCase {
    export type Interface = IPublishEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}

/**
 * Payload for before publish event
 */
export interface EntryBeforePublishEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after publish event
 */
export interface EntryAfterPublishEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for publish error event
 */
export interface EntryPublishErrorEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * PublishEntryRepository - Handles storage operations for publishing entries.
 */
export interface IPublishEntryRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IPublishEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IPublishEntryRepositoryErrors[keyof IPublishEntryRepositoryErrors];

export const PublishEntryRepository =
    createAbstraction<IPublishEntryRepository>("PublishEntryRepository");

export namespace PublishEntryRepository {
    export type Interface = IPublishEntryRepository;
    export type Error = RepositoryError;
}
