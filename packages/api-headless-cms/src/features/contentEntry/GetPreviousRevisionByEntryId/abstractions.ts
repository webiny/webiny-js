import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";
import { EntryNotFoundError, type EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

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
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type UseCaseError =
    IGetPreviousRevisionByEntryIdUseCaseErrors[keyof IGetPreviousRevisionByEntryIdUseCaseErrors];

export const GetPreviousRevisionByEntryIdBaseUseCase =
    createAbstraction<IGetPreviousRevisionByEntryIdBaseUseCase>(
        "GetPreviousRevisionByEntryIdBaseUseCase"
    );

export namespace GetPreviousRevisionByEntryIdBaseUseCase {
    export type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
}

/**
 * Public use case: Returns non-deleted revision only (default behavior)
 */
export const GetPreviousRevisionByEntryIdUseCase =
    createAbstraction<IGetPreviousRevisionByEntryIdBaseUseCase>(
        "GetPreviousRevisionByEntryIdUseCase"
    );

export namespace GetPreviousRevisionByEntryIdUseCase {
    export type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;
    export type Error = UseCaseError;
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
    storage: EntryStorageError;
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
