import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel, ICmsModelListParams } from "~/types/index.js";
import {
    ModelNotAuthorizedError,
    type ModelPersistenceError
} from "~/domain/contentModel/errors.js";

/**
 * ListModels Use Case
 */
export interface IListModelsUseCase {
    execute(params?: ICmsModelListParams): Promise<Result<CmsModel[], UseCaseError>>;
}

export interface IListModelsUseCaseErrors {
    notAuthorized: ModelNotAuthorizedError;
    persistence: ModelPersistenceError;
}

type UseCaseError = IListModelsUseCaseErrors[keyof IListModelsUseCaseErrors];

/** List all content models. */
export const ListModelsUseCase = createAbstraction<IListModelsUseCase>("ListModelsUseCase");

export namespace ListModelsUseCase {
    export type Interface = IListModelsUseCase;
    export type Params = ICmsModelListParams;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsModel[], UseCaseError>>;
}

/**
 * ListModelsRepository - Fetches all models from cache.
 */
export interface IListModelsRepository {
    execute(params?: ICmsModelListParams): Promise<Result<CmsModel[], RepositoryError>>;
}

export interface IListModelsRepositoryErrors {
    persistence: ModelPersistenceError;
}

type RepositoryError = IListModelsRepositoryErrors[keyof IListModelsRepositoryErrors];

export const ListModelsRepository =
    createAbstraction<IListModelsRepository>("ListModelsRepository");

export namespace ListModelsRepository {
    export type Interface = IListModelsRepository;
    export type Error = RepositoryError;
}
