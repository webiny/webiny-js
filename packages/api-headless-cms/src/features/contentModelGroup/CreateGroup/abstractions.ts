import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsGroup } from "~/types/index.js";
import type { CmsGroupCreateInput } from "~/types/index.js";
import {
    type GroupSlugTakenError,
    GroupNotAuthorizedError
} from "~/domain/contentModelGroup/errors.js";
import type { GroupValidationError } from "~/domain/contentModelGroup/errors.js";
import type { GroupStorageError } from "~/domain/contentModelGroup/errors.js";

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

export const CreateGroupUseCase = createAbstraction<ICreateGroupUseCase>("CreateGroupUseCase");

export namespace CreateGroupUseCase {
    export type Interface = ICreateGroupUseCase;
    export type Error = UseCaseError;
}

/**
 * CreateGroupRepository - Persists a new group to storage.
 */
export interface ICreateGroupRepository {
    execute(group: CmsGroup): Promise<Result<void, RepositoryError>>;
}

export interface ICreateGroupRepositoryErrors {
    alreadyExists: GroupSlugTakenError;
    storage: GroupStorageError;
}

type RepositoryError = ICreateGroupRepositoryErrors[keyof ICreateGroupRepositoryErrors];

export const CreateGroupRepository =
    createAbstraction<ICreateGroupRepository>("CreateGroupRepository");

export namespace CreateGroupRepository {
    export type Interface = ICreateGroupRepository;
    export type Error = RepositoryError;
}
