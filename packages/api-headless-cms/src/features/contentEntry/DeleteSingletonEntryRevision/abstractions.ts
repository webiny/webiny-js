import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { DeleteEntryRevisionUseCase } from "~/features/contentEntry/DeleteEntryRevision/index.js";

/**
 * DeleteSingletonEntryRevision Use Case
 *
 * Deletes a singleton entry revision.
 */
export interface IDeleteSingletonEntryRevisionUseCase {
    execute(model: CmsModel, revision: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteSingletonEntryRevisionUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: DeleteEntryRevisionUseCase.Error;
}

type UseCaseError =
    IDeleteSingletonEntryRevisionUseCaseErrors[keyof IDeleteSingletonEntryRevisionUseCaseErrors];

/** Deletes a singleton entry revision. */
export const DeleteSingletonEntryRevisionUseCase =
    createAbstraction<IDeleteSingletonEntryRevisionUseCase>("DeleteSingletonEntryRevisionUseCase");

export namespace DeleteSingletonEntryRevisionUseCase {
    export type Interface = IDeleteSingletonEntryRevisionUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<void, UseCaseError>>;
}
