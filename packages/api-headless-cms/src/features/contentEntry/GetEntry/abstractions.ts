import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryGetParams, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError, EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { ContentEntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * GetEntry Use Case - Gets a single entry by query parameters (where + sort).
 * Uses list operation with limit 1 and returns first result or NotFoundError.
 */
export interface IGetEntryUseCase {
    execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryGetParams
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetEntryUseCaseErrors {
    notAuthorized: ContentEntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetEntryUseCaseErrors[keyof IGetEntryUseCaseErrors];

export const GetEntryUseCase = createAbstraction<IGetEntryUseCase>("GetEntryUseCase");

export namespace GetEntryUseCase {
    export type Interface = IGetEntryUseCase;
    export type Error = UseCaseError;
}
