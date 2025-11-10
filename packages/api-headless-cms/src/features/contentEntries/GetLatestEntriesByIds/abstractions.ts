import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

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
    notAuthorized: NotAuthorizedError;
    storage: EntryStorageError;
}

type UseCaseError = IGetLatestEntriesByIdsUseCaseErrors[keyof IGetLatestEntriesByIdsUseCaseErrors];

export const GetLatestEntriesByIdsUseCase = createAbstraction<IGetLatestEntriesByIdsUseCase>(
    "GetLatestEntriesByIdsUseCase"
);

export namespace GetLatestEntriesByIdsUseCase {
    export type Interface = IGetLatestEntriesByIdsUseCase;
    export type Error = UseCaseError;
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
    storage: EntryStorageError;
}

type RepositoryError = IGetLatestEntriesByIdsRepositoryErrors[keyof IGetLatestEntriesByIdsRepositoryErrors];

export const GetLatestEntriesByIdsRepository = createAbstraction<IGetLatestEntriesByIdsRepository>(
    "GetLatestEntriesByIdsRepository"
);

export namespace GetLatestEntriesByIdsRepository {
    export type Interface = IGetLatestEntriesByIdsRepository;
    export type Error = RepositoryError;
}
