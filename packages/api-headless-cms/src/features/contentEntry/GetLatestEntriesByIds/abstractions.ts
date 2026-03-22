import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

/**
 * GetLatestEntriesByIds Use Case - Fetches latest revisions by entry IDs.
 * Returns array of latest entries (excludes deleted entries via decorator).
 */
export interface IGetLatestEntriesByIdsUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

export interface IGetLatestEntriesByIdsUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetLatestEntriesByIdsUseCaseErrors[keyof IGetLatestEntriesByIdsUseCaseErrors];

/** Retrieve the latest revisions for multiple entries. */
export const GetLatestEntriesByIdsUseCase = createAbstraction<IGetLatestEntriesByIdsUseCase>(
    "GetLatestEntriesByIdsUseCase"
);

export namespace GetLatestEntriesByIdsUseCase {
    export type Interface = IGetLatestEntriesByIdsUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

/**
 * GetLatestEntriesByIdsRepository - Fetches latest entries from storage by entry IDs.
 */
export interface IGetLatestEntriesByIdsRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryError>>;
}

export interface IGetLatestEntriesByIdsRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError =
    IGetLatestEntriesByIdsRepositoryErrors[keyof IGetLatestEntriesByIdsRepositoryErrors];

export const GetLatestEntriesByIdsRepository = createAbstraction<IGetLatestEntriesByIdsRepository>(
    "GetLatestEntriesByIdsRepository"
);

export namespace GetLatestEntriesByIdsRepository {
    export type Interface = IGetLatestEntriesByIdsRepository;
    export type Error = RepositoryError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>[], RepositoryError>>;
}
