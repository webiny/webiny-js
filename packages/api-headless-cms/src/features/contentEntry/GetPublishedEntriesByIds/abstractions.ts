import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * GetPublishedEntriesByIds Use Case - Fetches published revisions by entry IDs.
 * Returns array of published entries (excludes deleted entries via decorator).
 */
export interface IGetPublishedEntriesByIdsUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

export interface IGetPublishedEntriesByIdsUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    storage: EntryStorageError;
}

type UseCaseError = IGetPublishedEntriesByIdsUseCaseErrors[keyof IGetPublishedEntriesByIdsUseCaseErrors];

export const GetPublishedEntriesByIdsUseCase = createAbstraction<IGetPublishedEntriesByIdsUseCase>(
    "GetPublishedEntriesByIdsUseCase"
);

export namespace GetPublishedEntriesByIdsUseCase {
    export type Interface = IGetPublishedEntriesByIdsUseCase;
    export type Error = UseCaseError;
}

/**
 * GetPublishedEntriesByIdsRepository - Fetches published entries from storage by entry IDs.
 */
export interface IGetPublishedEntriesByIdsRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], RepositoryError>>;
}

export interface IGetPublishedEntriesByIdsRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IGetPublishedEntriesByIdsRepositoryErrors[keyof IGetPublishedEntriesByIdsRepositoryErrors];

export const GetPublishedEntriesByIdsRepository = createAbstraction<IGetPublishedEntriesByIdsRepository>(
    "GetPublishedEntriesByIdsRepository"
);

export namespace GetPublishedEntriesByIdsRepository {
    export type Interface = IGetPublishedEntriesByIdsRepository;
    export type Error = RepositoryError;
}
