import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * GetRevisionById Use Case - Fetches a specific entry revision by ID.
 * Returns the entry or fails with EntryNotFoundError if not found or deleted.
 */
export interface IGetRevisionByIdUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetRevisionByIdUseCaseErrors {
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetRevisionByIdUseCaseErrors[keyof IGetRevisionByIdUseCaseErrors];

export const GetRevisionByIdUseCase =
    createAbstraction<IGetRevisionByIdUseCase>("GetRevisionByIdUseCase");

export namespace GetRevisionByIdUseCase {
    export type Interface = IGetRevisionByIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetRevisionByIdRepository - Fetches entry revision from storage.
 * Returns the entry or fails with EntryNotFoundError if not found.
 */
export interface IGetRevisionByIdRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IGetRevisionByIdRepositoryErrors {
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type RepositoryError = IGetRevisionByIdRepositoryErrors[keyof IGetRevisionByIdRepositoryErrors];

export const GetRevisionByIdRepository = createAbstraction<IGetRevisionByIdRepository>(
    "GetRevisionByIdRepository"
);

export namespace GetRevisionByIdRepository {
    export type Interface = IGetRevisionByIdRepository;
    export type Error = RepositoryError;
}
