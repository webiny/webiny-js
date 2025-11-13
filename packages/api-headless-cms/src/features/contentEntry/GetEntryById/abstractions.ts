import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryStorageError } from "~/domain/contentEntry/errors.js";
import type { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

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
    notAuthorized: ContentEntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryStorageError;
}

type UseCaseError = IGetEntryByIdUseCaseErrors[keyof IGetEntryByIdUseCaseErrors];

export const GetEntryByIdUseCase = createAbstraction<IGetEntryByIdUseCase>("GetEntryByIdUseCase");

export namespace GetEntryByIdUseCase {
    export type Interface = IGetEntryByIdUseCase;
    export type Error = UseCaseError;
}
