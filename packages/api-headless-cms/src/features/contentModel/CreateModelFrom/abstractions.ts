import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateFromInput } from "~/types/index.js";
import {
    type ModelSlugTakenError,
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelValidationError,
    type ModelPersistenceError
} from "~/domain/contentModel/errors.js";
import {
    type GroupNotFoundError,
    type GroupNotAuthorizedError
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
    alreadyExists: ModelSlugTakenError;
    persistence: ModelPersistenceError;
    groupNotFound: GroupNotFoundError;
    groupNotAccessible: GroupNotAuthorizedError;
}

type UseCaseError = ICreateModelFromUseCaseErrors[keyof ICreateModelFromUseCaseErrors];

export const CreateModelFromUseCase = createAbstraction<ICreateModelFromUseCase>(
    "CreateModelFromUseCase"
);

export namespace CreateModelFromUseCase {
    export type Interface = ICreateModelFromUseCase;
    export type Error = UseCaseError;
}

/**
 * CreateModelFromRepository - Validates domain rules and persists cloned model.
 */
export interface ICreateModelFromRepository {
    execute(model: CmsModel): Promise<Result<void, RepositoryError>>;
}

export interface ICreateModelFromRepositoryErrors {
    alreadyExists: ModelSlugTakenError;
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
