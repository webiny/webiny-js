import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError, type EntryPersistenceError } from "~/domain/contentEntry/errors.js";

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
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError =
    IGetLatestRevisionByEntryIdUseCaseErrors[keyof IGetLatestRevisionByEntryIdUseCaseErrors];

/** Base use case for retrieving the latest entry revision. */
export const GetLatestRevisionByEntryIdBaseUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestRevisionByEntryIdBaseUseCase"
    );

export namespace GetLatestRevisionByEntryIdBaseUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetLatestRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

/** Retrieve the latest revision of an entry. */
export const GetLatestRevisionByEntryIdUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>("GetLatestRevisionByEntryIdUseCase");

export namespace GetLatestRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetLatestRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

/** Retrieve the latest deleted revision of an entry. */
export const GetLatestDeletedRevisionByEntryIdUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestDeletedRevisionByEntryIdUseCase"
    );

export namespace GetLatestDeletedRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetLatestRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export namespace GetLatestNonDeletedRevisionByEntryIdUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetLatestRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

/** Retrieve the latest entry revision, including deleted ones. */
export const GetLatestRevisionByEntryIdIncludingDeletedUseCase =
    createAbstraction<IGetLatestRevisionByEntryIdBaseUseCase>(
        "GetLatestRevisionByEntryIdIncludingDeletedUseCase"
    );

export namespace GetLatestRevisionByEntryIdIncludingDeletedUseCase {
    export type Interface = IGetLatestRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetLatestRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
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
