import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import type {
    EntryStorageError,
    EntryValidationError,
    EntryNotFoundError
} from "~/domain/contentEntry/errors.js";
import type { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * CreateEntryRevisionFrom Use Case - Creates a new revision from an existing entry.
 */
export interface ICreateEntryRevisionFromUseCase {
    execute(
        model: CmsModel,
        sourceId: string,
        input: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface ICreateEntryRevisionFromUseCaseErrors {
    notAuthorized: ContentEntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    storage: EntryStorageError;
}

type UseCaseError =
    ICreateEntryRevisionFromUseCaseErrors[keyof ICreateEntryRevisionFromUseCaseErrors];

export const CreateEntryRevisionFromUseCase =
    createAbstraction<ICreateEntryRevisionFromUseCase>("CreateEntryRevisionFromUseCase");

export namespace CreateEntryRevisionFromUseCase {
    export type Interface = ICreateEntryRevisionFromUseCase;
    export type Error = UseCaseError;
}

/**
 * Payload for before create revision event
 */
export interface EntryRevisionBeforeCreatePayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateCmsEntryInput;
    original: CmsEntry;
}

/**
 * Payload for after create revision event
 */
export interface EntryRevisionAfterCreatePayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateCmsEntryInput;
    original: CmsEntry;
}

/**
 * Payload for create revision error event
 */
export interface EntryRevisionCreateErrorPayload {
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
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<CmsEntry, RepositoryError>>;
}

export interface ICreateEntryRevisionFromRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError =
    ICreateEntryRevisionFromRepositoryErrors[keyof ICreateEntryRevisionFromRepositoryErrors];

export const CreateEntryRevisionFromRepository =
    createAbstraction<ICreateEntryRevisionFromRepository>("CreateEntryRevisionFromRepository");

export namespace CreateEntryRevisionFromRepository {
    export type Interface = ICreateEntryRevisionFromRepository;
    export type Error = RepositoryError;
}
