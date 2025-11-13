import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import type { EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * Base ListEntries Use Case - Internal base use case for listing entries.
 * Used by specific variants (Latest, Published, Deleted).
 */
export interface IListEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseError>>;
}

export interface IListEntriesUseCaseErrors {
    notAuthorized: ContentEntryNotAuthorizedError;
    storage: EntryStorageError;
}

type UseCaseError = IListEntriesUseCaseErrors[keyof IListEntriesUseCaseErrors];

export const ListEntriesUseCase = createAbstraction<IListEntriesUseCase>("ListEntriesUseCase");

export namespace ListEntriesUseCase {
    export type Interface = IListEntriesUseCase;
    export type Error = UseCaseError;
}

/**
 * ListLatestEntries Use Case - Lists latest entries (manage API).
 */
export interface IListLatestEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseError>>;
}

export const ListLatestEntriesUseCase = createAbstraction<IListLatestEntriesUseCase>(
    "ListLatestEntriesUseCase"
);

export namespace ListLatestEntriesUseCase {
    export type Interface = IListLatestEntriesUseCase;
    export type Error = UseCaseError;
}

/**
 * ListPublishedEntries Use Case - Lists published entries (read API).
 */
export interface IListPublishedEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseError>>;
}

export const ListPublishedEntriesUseCase = createAbstraction<IListPublishedEntriesUseCase>(
    "ListPublishedEntriesUseCase"
);

export namespace ListPublishedEntriesUseCase {
    export type Interface = IListPublishedEntriesUseCase;
    export type Error = UseCaseError;
}

/**
 * ListDeletedEntries Use Case - Lists deleted entries (manage API).
 */
export interface IListDeletedEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseError>>;
}

export const ListDeletedEntriesUseCase = createAbstraction<IListDeletedEntriesUseCase>(
    "ListDeletedEntriesUseCase"
);

export namespace ListDeletedEntriesUseCase {
    export type Interface = IListDeletedEntriesUseCase;
    export type Error = UseCaseError;
}

/**
 * ListEntriesRepository - Fetches entries from storage with filtering and pagination.
 */
export interface IListEntriesRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], RepositoryError>>;
}

export interface IListEntriesRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IListEntriesRepositoryErrors[keyof IListEntriesRepositoryErrors];

export const ListEntriesRepository = createAbstraction<IListEntriesRepository>(
    "ListEntriesRepository"
);

export namespace ListEntriesRepository {
    export type Interface = IListEntriesRepository;
    export type Error = RepositoryError;
}
