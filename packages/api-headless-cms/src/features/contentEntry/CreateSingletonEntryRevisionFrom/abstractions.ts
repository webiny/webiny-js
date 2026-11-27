import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";

/**
 * CreateSingletonEntryRevisionFrom Use Case
 *
 * Creates a new singleton entry revision from an existing one.
 */
export interface ICreateSingletonEntryRevisionFromUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string,
        data?: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface ICreateSingletonEntryRevisionFromUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: CreateEntryRevisionFromUseCase.Error;
}

type UseCaseError =
    ICreateSingletonEntryRevisionFromUseCaseErrors[keyof ICreateSingletonEntryRevisionFromUseCaseErrors];

/** Creates a new singleton entry revision from an existing one. */
export const CreateSingletonEntryRevisionFromUseCase =
    createAbstraction<ICreateSingletonEntryRevisionFromUseCase>(
        "CreateSingletonEntryRevisionFromUseCase"
    );

export namespace CreateSingletonEntryRevisionFromUseCase {
    export type Interface = ICreateSingletonEntryRevisionFromUseCase;
    export type Input<T extends CmsEntryValues = CmsEntryValues> = CreateCmsEntryInput<T>;
    export type Options = CreateCmsEntryOptionsInput;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
