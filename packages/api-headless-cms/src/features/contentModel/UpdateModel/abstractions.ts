import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelUpdateInput } from "~/types/index.js";
import {
    type ModelSlugTakenError,
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelValidationError,
    type ModelPersistenceError, ModelCannotUpdateCodeModelError
} from "~/domain/contentModel/errors.js";
import {
    type GroupNotFoundError,
    type GroupNotAuthorizedError
} from "~/domain/contentModelGroup/errors.js";

/**
 * UpdateModel Use Case
 */
export interface IUpdateModelUseCase {
    execute(modelId: string, input: CmsModelUpdateInput): Promise<Result<CmsModel, UseCaseError>>;
}

export interface IUpdateModelUseCaseErrors {
    notFound: ModelNotFoundError;
    notAuthorized: ModelNotAuthorizedError;
    validation: ModelValidationError;
    alreadyExists: ModelSlugTakenError;
    persistence: ModelPersistenceError;
    updateCodeModel: ModelCannotUpdateCodeModelError;
    groupNotFound: GroupNotFoundError;
    groupNotAccessible: GroupNotAuthorizedError;
}

type UseCaseError = IUpdateModelUseCaseErrors[keyof IUpdateModelUseCaseErrors];

export const UpdateModelUseCase = createAbstraction<IUpdateModelUseCase>("UpdateModelUseCase");

export namespace UpdateModelUseCase {
    export type Interface = IUpdateModelUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateModelRepository - Validates domain rules and persists model updates.
 */
export interface IUpdateModelRepository {
    execute(model: CmsModel, original: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface IUpdateModelRepositoryErrors {
    alreadyExists: ModelSlugTakenError;
    validation: ModelValidationError;
    persistence: ModelPersistenceError;
    updateCodeModel: ModelCannotUpdateCodeModelError;
}

type RepositoryError = IUpdateModelRepositoryErrors[keyof IUpdateModelRepositoryErrors];

export const UpdateModelRepository =
    createAbstraction<IUpdateModelRepository>("UpdateModelRepository");

export namespace UpdateModelRepository {
    export type Interface = IUpdateModelRepository;
    export type Error = RepositoryError;
}
