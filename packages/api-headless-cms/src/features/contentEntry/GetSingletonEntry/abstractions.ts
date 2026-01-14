import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import {
    type EntryNotFoundError,
    type EntryNotAuthorizedError,
    type EntryValidationError,
    type EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

/**
 * GetSingletonEntry Use Case
 *
 * Gets the singleton entry for a model, creating it if it doesn't exist.
 */
export interface IGetSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(model: CmsModel): Promise<Result<CmsEntry<T>, UseCaseError>>;
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
}
