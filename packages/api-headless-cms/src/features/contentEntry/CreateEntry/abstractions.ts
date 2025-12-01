import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import type { EntryPersistenceError, EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * CreateEntry Use Case
 */
export interface ICreateEntryUseCase {
    execute(
        model: CmsModel,
        input: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface ICreateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    validation: EntryValidationError;
    repository: RepositoryError;
}

type UseCaseError = ICreateEntryUseCaseErrors[keyof ICreateEntryUseCaseErrors];

export const CreateEntryUseCase = createAbstraction<ICreateEntryUseCase>("CreateEntryUseCase");

export namespace CreateEntryUseCase {
    export type Interface = ICreateEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * CreateEntryRepository - Persists a new entry to storage.
 * Takes a domain CmsEntry object and stores it.
 */
export interface ICreateEntryRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<void, RepositoryError>>;
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
