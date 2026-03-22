import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

/**
 * GetEntryById Use Case - Fetches a single entry by its exact revision ID.
 * Returns entry or fails with EntryNotFoundError if not found or deleted.
 */
export interface IGetEntryByIdUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetEntryByIdUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetEntryByIdUseCaseErrors[keyof IGetEntryByIdUseCaseErrors];

/** Retrieve a content entry by its exact revision ID. */
export const GetEntryByIdUseCase = createAbstraction<IGetEntryByIdUseCase>("GetEntryByIdUseCase");

export namespace GetEntryByIdUseCase {
    export type Interface = IGetEntryByIdUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}
