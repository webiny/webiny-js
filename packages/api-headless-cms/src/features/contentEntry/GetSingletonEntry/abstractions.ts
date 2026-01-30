import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    type EntryNotAuthorizedError,
    type EntryNotFoundError,
    type EntryPersistenceError,
    type EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * GetSingletonEntry Use Case
 *
 * Gets the singleton entry for a model, creating it if it doesn't exist.
 */
export interface IGetSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    notAuthorized: EntryNotAuthorizedError;
    validation: EntryValidationError;
    persistence: EntryPersistenceError;
}

type UseCaseError = IGetSingletonEntryUseCaseErrors[keyof IGetSingletonEntryUseCaseErrors];

export const GetSingletonEntryUseCase = createAbstraction<IGetSingletonEntryUseCase>(
    "GetSingletonEntryUseCase"
);

export namespace GetSingletonEntryUseCase {
    export type Interface = IGetSingletonEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
