import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";
import { EntryNotFoundError, type EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * Base internal use case - returns entry regardless of deleted state.
 * This is used internally by the three public variations.
 */
export interface IGetLatestRevisionByEntryIdBaseUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetLatestRevisionByEntryIdUseCaseErrors {
    notAuthorized: ContentEntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError =
    IGetLatestRevisionByEntryIdUseCaseErrors[keyof IGetLatestRevisionByEntryIdUseCaseErrors];

export const GetLatestRevisionByEntryIdBaseUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestRevisionByEntryIdBaseUseCase"
    );

export namespace GetLatestRevisionByEntryIdBaseUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

/**
 * Public variation 1: Returns non-deleted revision only
 */
export const GetLatestRevisionByEntryIdUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>("GetLatestRevisionByEntryIdUseCase");

export namespace GetLatestRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

/**
 * Public variation 2: Returns deleted revision only (wbyDeleted === true)
 */
export const GetLatestDeletedRevisionByEntryIdUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestDeletedRevisionByEntryIdUseCase"
    );

export namespace GetLatestDeletedRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

export namespace GetLatestNonDeletedRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

/**
 * Public variation 3: Returns any latest revision (both deleted and non-deleted)
 */
export const GetLatestRevisionByEntryIdIncludingDeletedUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestRevisionByEntryIdIncludingDeletedUseCase"
    );

export namespace GetLatestRevisionByEntryIdIncludingDeletedUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

/**
 * GetLatestRevisionByEntryIdRepository - Fetches latest revision from storage by entry ID.
 */
export interface IGetLatestRevisionByEntryIdRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IGetLatestRevisionByEntryIdRepositoryErrors {
    storage: EntryPersistenceError;
    notFound: EntryNotFoundError;
}

type RepositoryError =
    IGetLatestRevisionByEntryIdRepositoryErrors[keyof IGetLatestRevisionByEntryIdRepositoryErrors];

export const GetLatestRevisionByEntryIdRepository =
    createAbstraction<IGetLatestRevisionByEntryIdRepository>(
        "GetLatestRevisionByEntryIdRepository"
    );

export namespace GetLatestRevisionByEntryIdRepository {
    export type Interface = IGetLatestRevisionByEntryIdRepository;
    export type Error = RepositoryError;
}
