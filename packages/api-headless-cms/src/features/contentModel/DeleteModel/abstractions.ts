import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import {
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelValidationError,
    type ModelPersistenceError,
    ModelCannotDeleteCodeModelError,
    ModelCannotDeleteHasEntriesError,
    ModelCannotDeleteHasEntriesInTrashError
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

export const DeleteModelUseCase = createAbstraction<IDeleteModelUseCase>("DeleteModelUseCase");

export namespace DeleteModelUseCase {
    export type Interface = IDeleteModelUseCase;
    export type Error = UseCaseError;
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
