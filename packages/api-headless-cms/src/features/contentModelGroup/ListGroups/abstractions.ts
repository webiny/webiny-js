import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type { GroupStorageError } from "~/domain/contentModelGroup/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * ListGroups Use Case
 */
export interface IListGroupsUseCase {
    execute(): Promise<Result<CmsGroup[], UseCaseError>>;
}

export interface IListGroupsUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    repository: RepositoryError;
}

type UseCaseError = IListGroupsUseCaseErrors[keyof IListGroupsUseCaseErrors];

export const ListGroupsUseCase = createAbstraction<IListGroupsUseCase>("ListGroupsUseCase");

export namespace ListGroupsUseCase {
    export type Interface = IListGroupsUseCase;
    export type Error = UseCaseError;
}

/**
 * ListGroupsRepository - Fetches all groups from cache.
 */
export interface IListGroupsRepository {
    execute(): Promise<Result<CmsGroup[], RepositoryError>>;
}

export interface IListGroupsRepositoryErrors {
    storage: GroupStorageError;
}

type RepositoryError = IListGroupsRepositoryErrors[keyof IListGroupsRepositoryErrors];

export const ListGroupsRepository = createAbstraction<IListGroupsRepository>(
    "ListGroupsRepository"
);

export namespace ListGroupsRepository {
    export type Interface = IListGroupsRepository;
    export type Error = RepositoryError;
}
