import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateInput } from "~/types/index.js";
import {
    type ModelSlugTakenError,
    ModelNotAuthorizedError,
    type ModelValidationError,
    type ModelPersistenceError
} from "~/domain/contentModel/errors.js";
import {
    type GroupNotFoundError,
    type GroupNotAuthorizedError
} from "~/domain/contentModelGroup/errors.js";

/**
 * CreateModel Use Case
 */
export interface ICreateModelUseCase {
    execute(input: CmsModelCreateInput): Promise<Result<CmsModel, UseCaseError>>;
}

export interface ICreateModelUseCaseErrors {
    notAuthorized: ModelNotAuthorizedError;
    validation: ModelValidationError;
    alreadyExists: ModelSlugTakenError;
    persistence: ModelPersistenceError;
    groupNotFound: GroupNotFoundError;          // Reused from Group domain
    groupNotAccessible: GroupNotAuthorizedError; // Reused from Group domain
}

type UseCaseError = ICreateModelUseCaseErrors[keyof ICreateModelUseCaseErrors];

export const CreateModelUseCase = createAbstraction<ICreateModelUseCase>("CreateModelUseCase");

export namespace CreateModelUseCase {
    export type Interface = ICreateModelUseCase;
    export type Error = UseCaseError;
}

/**
 * CreateModelRepository - Validates domain rules and persists a new model to storage.
 */
export interface ICreateModelRepository {
    execute(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface ICreateModelRepositoryErrors {
    alreadyExists: ModelSlugTakenError;
    validation: ModelValidationError;
    persistence: ModelPersistenceError;
}

type RepositoryError = ICreateModelRepositoryErrors[keyof ICreateModelRepositoryErrors];

export const CreateModelRepository =
    createAbstraction<ICreateModelRepository>("CreateModelRepository");

export namespace CreateModelRepository {
    export type Interface = ICreateModelRepository;
    export type Error = RepositoryError;
}
