import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryStorageError } from "~/domain/contentEntry/errors.js";

/**
 * GetRevisionById Use Case - Fetches a specific entry revision by ID.
 * Returns the entry or fails with EntryNotFoundError if not found or deleted.
 */
export interface IGetRevisionByIdUseCase {
    execute(model: CmsModel, id: string): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IGetRevisionByIdUseCaseErrors {
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type UseCaseError = IGetRevisionByIdUseCaseErrors[keyof IGetRevisionByIdUseCaseErrors];

export const GetRevisionByIdUseCase = createAbstraction<IGetRevisionByIdUseCase>(
    "GetRevisionByIdUseCase"
);

export namespace GetRevisionByIdUseCase {
    export type Interface = IGetRevisionByIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetRevisionByIdRepository - Fetches entry revision from storage.
 * Returns the entry or fails with EntryNotFoundError if not found.
 */
export interface IGetRevisionByIdRepository {
    execute(model: CmsModel, id: string): Promise<Result<CmsEntry, RepositoryError>>;
}

export interface IGetRevisionByIdRepositoryErrors {
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type RepositoryError = IGetRevisionByIdRepositoryErrors[keyof IGetRevisionByIdRepositoryErrors];

export const GetRevisionByIdRepository = createAbstraction<IGetRevisionByIdRepository>(
    "GetRevisionByIdRepository"
);

export namespace GetRevisionByIdRepository {
    export type Interface = IGetRevisionByIdRepository;
    export type Error = RepositoryError;
}
