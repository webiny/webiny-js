import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { UpdateCmsEntryInput } from "~/types/index.js";
import type { UpdateCmsEntryOptionsInput } from "~/types/index.js";
import {
    type EntryNotFoundError,
    type EntryNotAuthorizedError,
    type EntryValidationError,
    type EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

/**
 * UpdateSingletonEntry Use Case
 *
 * Updates the singleton entry for a model.
 */
export interface IUpdateSingletonEntryUseCase {
    execute(
        model: CmsModel,
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IUpdateSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    notAuthorized: EntryNotAuthorizedError;
    validation: EntryValidationError;
    persistence: EntryPersistenceError;
}

type UseCaseError = IUpdateSingletonEntryUseCaseErrors[keyof IUpdateSingletonEntryUseCaseErrors];

export const UpdateSingletonEntryUseCase = createAbstraction<IUpdateSingletonEntryUseCase>(
    "UpdateSingletonEntryUseCase"
);

export namespace UpdateSingletonEntryUseCase {
    export type Interface = IUpdateSingletonEntryUseCase;
    export type Error = UseCaseError;
}
