import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsGroup, CmsGroupCreateInput } from "~/types/index.js";
import type {
    GroupPersistenceError,
    GroupValidationError
} from "~/domain/contentModelGroup/errors.js";
import {
    GroupNotAuthorizedError,
    type GroupSlugTakenError
} from "~/domain/contentModelGroup/errors.js";

/**
 * CreateGroup Use Case
 */
export interface ICreateGroupUseCase {
    execute(input: CmsGroupCreateInput): Promise<Result<CmsGroup, UseCaseError>>;
}

export interface ICreateGroupUseCaseErrors {
    notAuthorized: GroupNotAuthorizedError;
    validation: GroupValidationError;
    repository: RepositoryError;
}

type UseCaseError = ICreateGroupUseCaseErrors[keyof ICreateGroupUseCaseErrors];

/** Create a new content model group. */
export const CreateGroupUseCase = createAbstraction<ICreateGroupUseCase>("CreateGroupUseCase");

export namespace CreateGroupUseCase {
    export type Interface = ICreateGroupUseCase;
    export type Input = CmsGroupCreateInput;

    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsGroup, UseCaseError>>;
}

/**
 * CreateGroupRepository - Persists a new group to storage.
 */
export interface ICreateGroupRepository {
    execute(group: CmsGroup): Promise<Result<void, RepositoryError>>;
}

export interface ICreateGroupRepositoryErrors {
    alreadyExists: GroupSlugTakenError;
    storage: GroupPersistenceError;
}

type RepositoryError = ICreateGroupRepositoryErrors[keyof ICreateGroupRepositoryErrors];

export const CreateGroupRepository =
    createAbstraction<ICreateGroupRepository>("CreateGroupRepository");

export namespace CreateGroupRepository {
    export type Interface = ICreateGroupRepository;
    export type Error = RepositoryError;
}
