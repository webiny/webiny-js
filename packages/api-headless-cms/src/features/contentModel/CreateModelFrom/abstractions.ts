import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel, CmsModelCreateFromInput } from "~/types/index.js";
import {
    ModelAlreadyExistsError,
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelPersistenceError,
    type ModelValidationError
} from "~/domain/contentModel/errors.js";
import {
    type GroupNotAuthorizedError,
    type GroupNotFoundError
} from "~/domain/contentModelGroup/errors.js";

/**
 * CreateModelFrom Use Case (Clone/Copy Model)
 */
export interface ICreateModelFromUseCase {
    execute(
        modelId: string,
        input: CmsModelCreateFromInput
    ): Promise<Result<CmsModel, UseCaseError>>;
}

export interface ICreateModelFromUseCaseErrors {
    notFound: ModelNotFoundError;
    notAuthorized: ModelNotAuthorizedError;
    validation: ModelValidationError;
    alreadyExists: ModelAlreadyExistsError;
    persistence: ModelPersistenceError;
    groupNotFound: GroupNotFoundError;
    groupNotAccessible: GroupNotAuthorizedError;
}

type UseCaseError = ICreateModelFromUseCaseErrors[keyof ICreateModelFromUseCaseErrors];

/** Create a content model by cloning an existing one. */
export const CreateModelFromUseCase =
    createAbstraction<ICreateModelFromUseCase>("CreateModelFromUseCase");

export namespace CreateModelFromUseCase {
    export type Interface = ICreateModelFromUseCase;
    export type Input = CmsModelCreateFromInput;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsModel, UseCaseError>>;
}

/**
 * CreateModelFromRepository - Validates domain rules and persists cloned model.
 */
export interface ICreateModelFromRepository {
    execute(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface ICreateModelFromRepositoryErrors {
    alreadyExists: ModelAlreadyExistsError;
    validation: ModelValidationError;
    persistence: ModelPersistenceError;
}

type RepositoryError = ICreateModelFromRepositoryErrors[keyof ICreateModelFromRepositoryErrors];

export const CreateModelFromRepository = createAbstraction<ICreateModelFromRepository>(
    "CreateModelFromRepository"
);

export namespace CreateModelFromRepository {
    export type Interface = ICreateModelFromRepository;
    export type Error = RepositoryError;
}
