import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type {
    GroupCannotDeleteCodeDefinedError,
    GroupHasModelsError,
    GroupNotAuthorizedError,
    GroupNotFoundError,
    GroupPersistenceError
} from "~/domain/contentModelGroup/errors.js";

/**
 * DeleteGroup Use Case
 */
export interface IDeleteGroupUseCase {
    execute(groupId: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteGroupUseCaseErrors {
    notFound: GroupNotFoundError;
    notAuthorized: GroupNotAuthorizedError;
    repository: RepositoryError;
}

type UseCaseError = IDeleteGroupUseCaseErrors[keyof IDeleteGroupUseCaseErrors];

/** Delete a content model group. */
export const DeleteGroupUseCase = createAbstraction<IDeleteGroupUseCase>("DeleteGroupUseCase");

export namespace DeleteGroupUseCase {
    export type Interface = IDeleteGroupUseCase;

    export type Error = UseCaseError;
    export type Return = Promise<Result<void, UseCaseError>>;
}

/**
 * DeleteGroupRepository - Validates and persists group deletion.
 */
export interface IDeleteGroupRepository {
    execute(group: CmsGroup): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteGroupRepositoryErrors {
    cannotDelete: GroupCannotDeleteCodeDefinedError;
    hasModels: GroupHasModelsError;
    storage: GroupPersistenceError;
}

type RepositoryError = IDeleteGroupRepositoryErrors[keyof IDeleteGroupRepositoryErrors];

export const DeleteGroupRepository =
    createAbstraction<IDeleteGroupRepository>("DeleteGroupRepository");

export namespace DeleteGroupRepository {
    export type Interface = IDeleteGroupRepository;
    export type Error = RepositoryError;
}
