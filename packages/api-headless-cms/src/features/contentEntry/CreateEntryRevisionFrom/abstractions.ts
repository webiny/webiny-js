import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * CreateEntryRevisionFrom Use Case - Creates a new revision from an existing entry.
 */
export interface ICreateEntryRevisionFromUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string,
        input: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface ICreateEntryRevisionFromUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    storage: EntryPersistenceError;
}

type UseCaseError =
    ICreateEntryRevisionFromUseCaseErrors[keyof ICreateEntryRevisionFromUseCaseErrors];

/** Create a new entry revision from an existing one. */
export const CreateEntryRevisionFromUseCase = createAbstraction<ICreateEntryRevisionFromUseCase>(
    "CreateEntryRevisionFromUseCase"
);

export namespace CreateEntryRevisionFromUseCase {
    export type Interface = ICreateEntryRevisionFromUseCase;
    export type Input<T extends CmsEntryValues = CmsEntryValues> = CreateCmsEntryInput<T>;
    export type Options = CreateCmsEntryOptionsInput;

    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
    export type Error = UseCaseError;
}

/**
 * Payload for before create revision event
 */
export interface EntryRevisionBeforeCreateEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateCmsEntryInput;
    original: CmsEntry;
}

/**
 * Payload for after create revision event
 */
export interface EntryRevisionAfterCreateEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateCmsEntryInput;
    original: CmsEntry;
}

/**
 * Payload for create revision error event
 */
export interface EntryRevisionCreateErrorEventPayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateCmsEntryInput;
    original: CmsEntry;
    error: Error;
}

/**
 * CreateEntryRevisionFromRepository - Handles storage operations for creating entry revisions.
 */
export interface ICreateEntryRevisionFromRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface ICreateEntryRevisionFromRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError =
    ICreateEntryRevisionFromRepositoryErrors[keyof ICreateEntryRevisionFromRepositoryErrors];

export const CreateEntryRevisionFromRepository =
    createAbstraction<ICreateEntryRevisionFromRepository>("CreateEntryRevisionFromRepository");

export namespace CreateEntryRevisionFromRepository {
    export type Interface = ICreateEntryRevisionFromRepository;
    export type Error = RepositoryError;
}
