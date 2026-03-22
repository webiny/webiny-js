import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError, type EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * Base internal use case - returns entry regardless of deleted state.
 * This is used internally by the public variation.
 */
export interface IGetPreviousRevisionByEntryIdBaseUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetPreviousRevisionByEntryIdUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError =
    IGetPreviousRevisionByEntryIdUseCaseErrors[keyof IGetPreviousRevisionByEntryIdUseCaseErrors];

/** Base use case for retrieving the previous entry revision. */
export const GetPreviousRevisionByEntryIdBaseUseCase =
    createAbstraction<IGetPreviousRevisionByEntryIdBaseUseCase>(
        "GetPreviousRevisionByEntryIdBaseUseCase"
    );

export namespace GetPreviousRevisionByEntryIdBaseUseCase {
    export type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetPreviousRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

/** Retrieve the previous revision of an entry. */
export const GetPreviousRevisionByEntryIdUseCase =
    createAbstraction<IGetPreviousRevisionByEntryIdBaseUseCase>(
        "GetPreviousRevisionByEntryIdUseCase"
    );

export namespace GetPreviousRevisionByEntryIdUseCase {
    export type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;
    export type Params = CmsEntryStorageOperationsGetPreviousRevisionParams;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}

/**
 * GetPreviousRevisionByEntryIdRepository - Fetches previous revision from storage by entry ID and version.
 */
export interface IGetPreviousRevisionByEntryIdRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IGetPreviousRevisionByEntryIdRepositoryErrors {
    storage: EntryPersistenceError;
    notFound: EntryNotFoundError;
}

type RepositoryError =
    IGetPreviousRevisionByEntryIdRepositoryErrors[keyof IGetPreviousRevisionByEntryIdRepositoryErrors];

export const GetPreviousRevisionByEntryIdRepository =
    createAbstraction<IGetPreviousRevisionByEntryIdRepository>(
        "GetPreviousRevisionByEntryIdRepository"
    );

export namespace GetPreviousRevisionByEntryIdRepository {
    export type Interface = IGetPreviousRevisionByEntryIdRepository;
    export type Error = RepositoryError;
}
