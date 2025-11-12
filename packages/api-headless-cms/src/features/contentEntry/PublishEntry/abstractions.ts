import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryStorageError, EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";

/**
 * PublishEntry Use Case - Publishes an entry revision.
 */
export interface IPublishEntryUseCase {
    execute(model: CmsModel, id: string): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IPublishEntryUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    storage: EntryStorageError;
}

type UseCaseError = IPublishEntryUseCaseErrors[keyof IPublishEntryUseCaseErrors];

export const PublishEntryUseCase = createAbstraction<IPublishEntryUseCase>("PublishEntryUseCase");

export namespace PublishEntryUseCase {
    export type Interface = IPublishEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before publish event
 */
export interface EntryBeforePublishPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for after publish event
 */
export interface EntryAfterPublishPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

/**
 * Payload for publish error event
 */
export interface EntryPublishErrorPayload {
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
    error: Error;
}

/**
 * PublishEntryRepository - Handles storage operations for publishing entries.
 */
export interface IPublishEntryRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<CmsEntry, RepositoryError>>;
}

export interface IPublishEntryRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IPublishEntryRepositoryErrors[keyof IPublishEntryRepositoryErrors];

export const PublishEntryRepository = createAbstraction<IPublishEntryRepository>(
    "PublishEntryRepository"
);

export namespace PublishEntryRepository {
    export type Interface = IPublishEntryRepository;
    export type Error = RepositoryError;
}
