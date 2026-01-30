import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import {
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelPersistenceError
} from "~/domain/contentModel/errors.js";

/**
 * GetModel Use Case
 */
export interface IGetModelUseCase {
    execute(modelId: string): Promise<Result<CmsModel, UseCaseError>>;
}

export interface IGetModelUseCaseErrors {
    notFound: ModelNotFoundError;
    notAuthorized: ModelNotAuthorizedError;
    persistence: ModelPersistenceError;
}

type UseCaseError = IGetModelUseCaseErrors[keyof IGetModelUseCaseErrors];

export const GetModelUseCase = createAbstraction<IGetModelUseCase>("GetModelUseCase");

export namespace GetModelUseCase {
    export type Interface = IGetModelUseCase;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsModel, UseCaseError>>;
}

/**
 * GetModelRepository - Fetches a single model by ID from cache.
 */
export interface IGetModelRepository {
    execute(modelId: string): Promise<Result<CmsModel, RepositoryError>>;
}

export interface IGetModelRepositoryErrors {
    notFound: ModelNotFoundError;
    persistence: ModelPersistenceError;
}

type RepositoryError = IGetModelRepositoryErrors[keyof IGetModelRepositoryErrors];

export const GetModelRepository = createAbstraction<IGetModelRepository>("GetModelRepository");

export namespace GetModelRepository {
    export type Interface = IGetModelRepository;
    export type Error = RepositoryError;
}
