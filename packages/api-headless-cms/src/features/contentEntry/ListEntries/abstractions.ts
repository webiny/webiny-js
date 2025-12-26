import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

export interface IListEntriesResult<T extends CmsEntryValues = CmsEntryValues> {
    entries: CmsEntry<T>[];
    meta: CmsEntryMeta;
}

/**
 * Base ListEntries Use Case - Internal base use case for listing entries.
 * Used by specific variants (Latest, Published, Deleted).
 */
export interface IListEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<IListEntriesResult<T>, UseCaseError>>;
}

export interface IListEntriesUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IListEntriesUseCaseErrors[keyof IListEntriesUseCaseErrors];

export const ListEntriesUseCase = createAbstraction<IListEntriesUseCase>("ListEntriesUseCase");

export namespace ListEntriesUseCase {
    export type Interface = IListEntriesUseCase;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;
    export type Error = UseCaseError;
}

/**
 * ListLatestEntries Use Case - Lists latest entries (manage API).
 */
export interface IListLatestEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<IListEntriesResult<T>, UseCaseError>>;
}

export const ListLatestEntriesUseCase = createAbstraction<IListLatestEntriesUseCase>(
    "ListLatestEntriesUseCase"
);

export namespace ListLatestEntriesUseCase {
    export type Interface = IListLatestEntriesUseCase;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;
    export type Error = UseCaseError;
}

/**
 * ListPublishedEntries Use Case - Lists published entries (read API).
 */
export interface IListPublishedEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<IListEntriesResult<T>, UseCaseError>>;
}

export const ListPublishedEntriesUseCase = createAbstraction<IListPublishedEntriesUseCase>(
    "ListPublishedEntriesUseCase"
);

export namespace ListPublishedEntriesUseCase {
    export type Interface = IListPublishedEntriesUseCase;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;
    export type Error = UseCaseError;
}

/**
 * ListDeletedEntries Use Case - Lists deleted entries (manage API).
 */
export interface IListDeletedEntriesUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<IListEntriesResult<T>, UseCaseError>>;
}

export const ListDeletedEntriesUseCase = createAbstraction<IListDeletedEntriesUseCase>(
    "ListDeletedEntriesUseCase"
);

export namespace ListDeletedEntriesUseCase {
    export type Interface = IListDeletedEntriesUseCase;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;
    export type Error = UseCaseError;
}

/**
 * ListEntriesRepository - Fetches entries from storage with filtering and pagination.
 */
export interface IListEntriesRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<Result<IListEntriesResult<T>, RepositoryError>>;
}

export interface IListEntriesRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IListEntriesRepositoryErrors[keyof IListEntriesRepositoryErrors];

export const ListEntriesRepository =
    createAbstraction<IListEntriesRepository>("ListEntriesRepository");

export namespace ListEntriesRepository {
    export type Interface = IListEntriesRepository;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListEntriesResult<T>, RepositoryError>
    >;
    export type Error = RepositoryError;
}
