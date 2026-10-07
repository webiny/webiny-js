import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * DuplicateEntry Use Case - Creates a new entry (version 1, draft) from an existing entry revision.
 */
export interface IDuplicateEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IDuplicateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    storage: EntryPersistenceError;
}

type UseCaseError = IDuplicateEntryUseCaseErrors[keyof IDuplicateEntryUseCaseErrors];

/** Duplicate an existing entry revision into a new draft entry. */
export const DuplicateEntryUseCase =
    createAbstraction<IDuplicateEntryUseCase>("DuplicateEntryUseCase");

export namespace DuplicateEntryUseCase {
    export type Interface = IDuplicateEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}

/**
 * Payload for before duplicate event
 */
export interface EntryBeforeDuplicateEventPayload {
    model: CmsModel;
    original: CmsEntry;
}

/**
 * Payload for after duplicate event
 */
export interface EntryAfterDuplicateEventPayload {
    model: CmsModel;
    original: CmsEntry;
    entry: CmsEntry;
}

/**
 * Payload for duplicate error event
 */
export interface EntryDuplicateErrorEventPayload {
    model: CmsModel;
    original: CmsEntry;
    error: Error;
}
