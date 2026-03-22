import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import {
    GroupNotAuthorizedError,
    type GroupNotFoundError
} from "~/domain/contentModelGroup/errors.js";

/**
 * GetGroup Use Case
 */
export interface IGetGroupUseCase {
    execute(groupId: string): Promise<Result<CmsGroup, UseCaseError>>;
}

export interface IGetGroupUseCaseErrors {
    notFound: GroupNotFoundError;
    notAuthorized: GroupNotAuthorizedError;
    repository: RepositoryError;
}

type UseCaseError = IGetGroupUseCaseErrors[keyof IGetGroupUseCaseErrors];

/** Retrieve a content model group. */
export const GetGroupUseCase = createAbstraction<IGetGroupUseCase>("GetGroupUseCase");

export namespace GetGroupUseCase {
    export type Interface = IGetGroupUseCase;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsGroup, UseCaseError>>;
}

/**
 * GetGroupRepository - Fetches a single group by ID from cache.
 */
export interface IGetGroupRepository {
    execute(groupId: string): Promise<Result<CmsGroup, RepositoryError>>;
}

export interface IGetGroupRepositoryErrors {
    notFound: GroupNotFoundError;
    storage: GroupPersistenceError;
}

type RepositoryError = IGetGroupRepositoryErrors[keyof IGetGroupRepositoryErrors];

export const GetGroupRepository = createAbstraction<IGetGroupRepository>("GetGroupRepository");

export namespace GetGroupRepository {
    export type Interface = IGetGroupRepository;
    export type Error = RepositoryError;
}
