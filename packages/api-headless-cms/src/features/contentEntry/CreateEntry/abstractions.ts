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
    EntryPersistenceError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * CreateEntry Use Case
 */
export interface ICreateEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface ICreateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    validation: EntryValidationError;
    repository: RepositoryError;
}

type UseCaseError = ICreateEntryUseCaseErrors[keyof ICreateEntryUseCaseErrors];

/** Create a new content entry. */
export const CreateEntryUseCase = createAbstraction<ICreateEntryUseCase>("CreateEntryUseCase");

export namespace CreateEntryUseCase {
    export type Interface = ICreateEntryUseCase;
    export type Input<T extends CmsEntryValues = CmsEntryValues> = CreateCmsEntryInput<T>;
    export type Options = CreateCmsEntryOptionsInput;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}

/**
 * CreateEntryRepository - Persists a new entry to storage.
 * Takes a domain CmsEntry object and stores it.
 */
export interface ICreateEntryRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<void, RepositoryError>>;
}

export interface ICreateEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = ICreateEntryRepositoryErrors[keyof ICreateEntryRepositoryErrors];

export const CreateEntryRepository =
    createAbstraction<ICreateEntryRepository>("CreateEntryRepository");

export namespace CreateEntryRepository {
    export type Interface = ICreateEntryRepository;
    export type Error = RepositoryError;
}
