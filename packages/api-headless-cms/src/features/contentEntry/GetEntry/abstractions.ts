import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryGetParams, CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

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
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    storage: EntryPersistenceError;
}

type UseCaseError = IGetEntryUseCaseErrors[keyof IGetEntryUseCaseErrors];

export const GetEntryUseCase = createAbstraction<IGetEntryUseCase>("GetEntryUseCase");

export namespace GetEntryUseCase {
    export type Interface = IGetEntryUseCase;
    export type Error = UseCaseError;
    export type Params = CmsEntryGetParams;
    export type Return<T extends CmsEntryValues> = Promise<Result<CmsEntry<T>, UseCaseError>>;
}
