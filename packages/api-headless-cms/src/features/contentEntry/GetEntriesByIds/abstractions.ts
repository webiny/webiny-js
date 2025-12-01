import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetEntriesByIds Use Case - Fetches multiple entries by their exact revision IDs.
 * Returns array of entries (excludes deleted entries via decorator).
 */
export interface IGetEntriesByIdsUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

export interface IGetEntriesByIdsUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetEntriesByIdsUseCaseErrors[keyof IGetEntriesByIdsUseCaseErrors];

export const GetEntriesByIdsUseCase =
    createAbstraction<IGetEntriesByIdsUseCase>("GetEntriesByIdsUseCase");

export namespace GetEntriesByIdsUseCase {
    export type Interface = IGetEntriesByIdsUseCase;
    export type Error = UseCaseError;
}

/**
 * GetEntriesByIdsRepository - Fetches entries from storage by IDs and transforms them.
 */
export interface IGetEntriesByIdsRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryError>>;
}

export interface IGetEntriesByIdsRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IGetEntriesByIdsRepositoryErrors[keyof IGetEntriesByIdsRepositoryErrors];

export const GetEntriesByIdsRepository = createAbstraction<IGetEntriesByIdsRepository>(
    "GetEntriesByIdsRepository"
);

export namespace GetEntriesByIdsRepository {
    export type Interface = IGetEntriesByIdsRepository;
    export type Error = RepositoryError;
}
