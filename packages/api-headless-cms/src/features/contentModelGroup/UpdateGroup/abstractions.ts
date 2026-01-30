import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsGroup, CmsGroupUpdateInput } from "~/types/index.js";
import type {
    GroupCannotUpdateCodeDefinedError,
    GroupPersistenceError,
    GroupValidationError
} from "~/domain/contentModelGroup/errors.js";
import {
    GroupNotAuthorizedError,
    type GroupNotFoundError
} from "~/domain/contentModelGroup/errors.js";

/**
 * UpdateGroup Use Case
 */
export interface IUpdateGroupUseCase {
    execute(groupId: string, input: CmsGroupUpdateInput): Promise<Result<CmsGroup, UseCaseError>>;
}

export interface IUpdateGroupUseCaseErrors {
    notFound: GroupNotFoundError;
    notAuthorized: GroupNotAuthorizedError;
    validation: GroupValidationError;
    repository: RepositoryError;
}

type UseCaseError = IUpdateGroupUseCaseErrors[keyof IUpdateGroupUseCaseErrors];

export const UpdateGroupUseCase = createAbstraction<IUpdateGroupUseCase>("UpdateGroupUseCase");

export namespace UpdateGroupUseCase {
    export type Interface = IUpdateGroupUseCase;
    export type Input = CmsGroupUpdateInput;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsGroup, UseCaseError>>;
}

/**
 * UpdateGroupRepository - Persists group updates to storage.
 */
export interface IUpdateGroupRepository {
    execute(group: CmsGroup): Promise<Result<void, RepositoryError>>;
}

export interface IUpdateGroupRepositoryErrors {
    cannotUpdate: GroupCannotUpdateCodeDefinedError;
    storage: GroupPersistenceError;
}

type RepositoryError = IUpdateGroupRepositoryErrors[keyof IUpdateGroupRepositoryErrors];

export const UpdateGroupRepository =
    createAbstraction<IUpdateGroupRepository>("UpdateGroupRepository");

export namespace UpdateGroupRepository {
    export type Interface = IUpdateGroupRepository;
    export type Error = RepositoryError;
}
