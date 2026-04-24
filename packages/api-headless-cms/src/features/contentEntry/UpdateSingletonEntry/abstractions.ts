import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import type {
    EntryLockedError,
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";

/**
 * UpdateSingletonEntry Use Case
 *
 * Updates the singleton entry for a model.
 */
export interface IUpdateSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        data: UpdateCmsEntryInput<T>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    notAuthorized: EntryNotAuthorizedError;
    validation: EntryValidationError;
    persistence: EntryPersistenceError;
    locked: EntryLockedError;
}

type UseCaseError = IUpdateSingletonEntryUseCaseErrors[keyof IUpdateSingletonEntryUseCaseErrors];

/** Update a singleton content entry. */
export const UpdateSingletonEntryUseCase = createAbstraction<IUpdateSingletonEntryUseCase>(
    "UpdateSingletonEntryUseCase"
);

export namespace UpdateSingletonEntryUseCase {
    export type Interface = IUpdateSingletonEntryUseCase;
    export type Input<T extends CmsEntryValues = CmsEntryValues> = UpdateCmsEntryInput<T>;
    export type Options = UpdateCmsEntryOptionsInput;

    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
