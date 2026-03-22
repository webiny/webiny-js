import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel, CmsModelCreateInput } from "~/types/index.js";
import {
    ModelAlreadyExistsError,
    ModelNotAuthorizedError,
    type ModelPersistenceError,
    type ModelSlugTakenError,
    type ModelValidationError
} from "~/domain/contentModel/errors.js";
import {
    type GroupNotAuthorizedError,
    type GroupNotFoundError
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
    slugTaken: ModelSlugTakenError;
    alreadyExists: ModelAlreadyExistsError;
    persistence: ModelPersistenceError;
    groupNotFound: GroupNotFoundError; // Reused from Group domain
    groupNotAccessible: GroupNotAuthorizedError; // Reused from Group domain
}

type UseCaseError = ICreateModelUseCaseErrors[keyof ICreateModelUseCaseErrors];

/** Create a new content model. */
export const CreateModelUseCase = createAbstraction<ICreateModelUseCase>("CreateModelUseCase");

export namespace CreateModelUseCase {
    export type Interface = ICreateModelUseCase;
    export type Input = CmsModelCreateInput;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsModel, UseCaseError>>;
}

/**
 * CreateModelRepository - Validates domain rules and persists a new model to storage.
 */
export interface ICreateModelRepository {
    execute(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface ICreateModelRepositoryErrors {
    alreadyExists: ModelAlreadyExistsError;
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
