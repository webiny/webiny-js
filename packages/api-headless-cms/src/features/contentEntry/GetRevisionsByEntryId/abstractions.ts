import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetRevisionsByEntryId Use Case - Fetches all revisions for a given entry ID.
 * Returns array of entry revisions.
 */
export interface IGetRevisionsByEntryIdUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

export interface IGetRevisionsByEntryIdUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetRevisionsByEntryIdUseCaseErrors[keyof IGetRevisionsByEntryIdUseCaseErrors];

export const GetRevisionsByEntryIdUseCase = createAbstraction<IGetRevisionsByEntryIdUseCase>(
    "GetRevisionsByEntryIdUseCase"
);

export namespace GetRevisionsByEntryIdUseCase {
    export type Interface = IGetRevisionsByEntryIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetRevisionsByEntryIdRepository - Fetches entry revisions from storage.
 */
export interface IGetRevisionsByEntryIdRepository {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], RepositoryError>>;
}

export interface IGetRevisionsByEntryIdRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IGetRevisionsByEntryIdRepositoryErrors[keyof IGetRevisionsByEntryIdRepositoryErrors];

export const GetRevisionsByEntryIdRepository = createAbstraction<IGetRevisionsByEntryIdRepository>(
    "GetRevisionsByEntryIdRepository"
);

export namespace GetRevisionsByEntryIdRepository {
    export type Interface = IGetRevisionsByEntryIdRepository;
    export type Error = RepositoryError;
}
