import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";

/**
 * GetSingletonEntryRevision Use Case
 *
 * Gets a revision of the singleton entry.
 */
export interface IGetSingletonEntryRevisionUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetSingletonEntryRevisionUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: GetRevisionByIdUseCase.Error;
}

type UseCaseError =
    IGetSingletonEntryRevisionUseCaseErrors[keyof IGetSingletonEntryRevisionUseCaseErrors];

/** Gets a revision of the singleton entry. */
export const GetSingletonEntryRevisionUseCase =
    createAbstraction<IGetSingletonEntryRevisionUseCase>("GetSingletonEntryRevisionUseCase");

export namespace GetSingletonEntryRevisionUseCase {
    export type Interface = IGetSingletonEntryRevisionUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
