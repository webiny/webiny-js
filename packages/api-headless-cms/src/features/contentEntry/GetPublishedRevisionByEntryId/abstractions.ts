import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { EntryNotFoundError, type EntryPersistenceError } from "~/domain/contentEntry/errors.js";

/**
 * GetPublishedRevisionByEntryId Use Case
 */
export interface IGetPublishedRevisionByEntryIdUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T> | null, UseCaseError>>;
}

export interface IGetPublishedRevisionByEntryIdUseCaseErrors {
    repository: RepositoryError;
}

type UseCaseError =
    IGetPublishedRevisionByEntryIdUseCaseErrors[keyof IGetPublishedRevisionByEntryIdUseCaseErrors];

/** Retrieve the published revision of an entry. */
export const GetPublishedRevisionByEntryIdUseCase =
    createAbstraction<IGetPublishedRevisionByEntryIdUseCase>(
        "GetPublishedRevisionByEntryIdUseCase"
    );

export namespace GetPublishedRevisionByEntryIdUseCase {
    export type Interface = IGetPublishedRevisionByEntryIdUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T> | null, UseCaseError>
    >;
}

/**
 * GetPublishedRevisionByEntryIdRepository - Fetches published revision from storage.
 */
export interface IGetPublishedRevisionByEntryIdRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T> | null, RepositoryError>>;
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
