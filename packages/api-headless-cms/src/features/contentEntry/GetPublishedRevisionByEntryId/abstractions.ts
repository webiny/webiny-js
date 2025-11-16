import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsEntryStorageOperationsGetPublishedRevisionParams } from "~/types/index.js";
import { EntryNotFoundError, type EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * GetPublishedRevisionByEntryId Use Case
 */
export interface IGetPublishedRevisionByEntryIdUseCase {
    execute(model: CmsModel, entryId: string): Promise<Result<CmsEntry | null, UseCaseError>>;
}

export interface IGetPublishedRevisionByEntryIdUseCaseErrors {
    repository: RepositoryError;
}

type UseCaseError =
    IGetPublishedRevisionByEntryIdUseCaseErrors[keyof IGetPublishedRevisionByEntryIdUseCaseErrors];

export const GetPublishedRevisionByEntryIdUseCase =
    createAbstraction<IGetPublishedRevisionByEntryIdUseCase>(
        "GetPublishedRevisionByEntryIdUseCase"
    );

export namespace GetPublishedRevisionByEntryIdUseCase {
    export type Interface = IGetPublishedRevisionByEntryIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetPublishedRevisionByEntryIdRepository - Fetches published revision from storage.
 */
export interface IGetPublishedRevisionByEntryIdRepository {
    execute(model: CmsModel, entryId: string): Promise<Result<CmsEntry | null, RepositoryError>>;
}

export interface IGetPublishedRevisionByEntryIdRepositoryErrors {
    storage: EntryPersistenceError;
    notFound: EntryNotFoundError;
}

type RepositoryError =
    IGetPublishedRevisionByEntryIdRepositoryErrors[keyof IGetPublishedRevisionByEntryIdRepositoryErrors];

export const GetPublishedRevisionByEntryIdRepository =
    createAbstraction<IGetPublishedRevisionByEntryIdRepository>(
        "GetPublishedRevisionByEntryIdRepository"
    );

export namespace GetPublishedRevisionByEntryIdRepository {
    export type Interface = IGetPublishedRevisionByEntryIdRepository;
    export type Error = RepositoryError;
}
