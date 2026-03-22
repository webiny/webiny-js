import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import {
    ModelCannotDeleteCodeModelError,
    ModelCannotDeleteHasEntriesError,
    ModelCannotDeleteHasEntriesInTrashError,
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelPersistenceError,
    type ModelValidationError
} from "~/domain/contentModel/errors.js";

/**
 * DeleteModel Use Case
 */
export interface IDeleteModelUseCase {
    execute(modelId: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteModelUseCaseErrors {
    notFound: ModelNotFoundError;
    notAuthorized: ModelNotAuthorizedError;
    persistence: ModelPersistenceError;
    validation: ModelValidationError;
    codeModel: ModelCannotDeleteCodeModelError;
    hasEntries: ModelCannotDeleteHasEntriesError;
    hasEntriesInTrash: ModelCannotDeleteHasEntriesInTrashError;
}

type UseCaseError = IDeleteModelUseCaseErrors[keyof IDeleteModelUseCaseErrors];

/** Delete a content model. */
export const DeleteModelUseCase = createAbstraction<IDeleteModelUseCase>("DeleteModelUseCase");

export namespace DeleteModelUseCase {
    export type Interface = IDeleteModelUseCase;

    export type Error = UseCaseError;
    export type Return = Promise<Result<void, UseCaseError>>;
}

/**
 * DeleteModelRepository - Validates and deletes a model from storage.
 */
export interface IDeleteModelRepository {
    execute(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteModelRepositoryErrors {
    validation: ModelValidationError;
    persistence: ModelPersistenceError;
    codeModel: ModelCannotDeleteCodeModelError;
}

type RepositoryError = IDeleteModelRepositoryErrors[keyof IDeleteModelRepositoryErrors];

export const DeleteModelRepository =
    createAbstraction<IDeleteModelRepository>("DeleteModelRepository");

export namespace DeleteModelRepository {
    export type Interface = IDeleteModelRepository;
    export type Error = RepositoryError;
}
