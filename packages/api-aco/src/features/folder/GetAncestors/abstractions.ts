import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";
import type { FolderNotAuthorizedError, FolderPersistenceError } from "~/domain/folder/errors.js";

/**
 * GetAncestors repository interface
 */
export interface IGetAncestorsRepository {
    execute(params: GetAncestorsParams): Promise<Result<Folder[], RepositoryError>>;
}

export interface IGetAncestorsRepositoryErrors {
    persistence: FolderPersistenceError;
}

type RepositoryError = IGetAncestorsRepositoryErrors[keyof IGetAncestorsRepositoryErrors];

export const GetAncestorsRepository =
    createAbstraction<IGetAncestorsRepository>("GetAncestorsRepository");

export namespace GetAncestorsRepository {
    export type Interface = IGetAncestorsRepository;
    export type Error = RepositoryError;
}

/**
 * GetAncestors use case interface
 */
export interface GetAncestorsParams {
    folder: Folder;
}

export interface IGetAncestorsUseCase {
    execute(params: GetAncestorsParams): Promise<Result<Folder[], UseCaseError>>;
}

export interface IGetAncestorsUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    persistence: FolderPersistenceError;
}

type UseCaseError = IGetAncestorsUseCaseErrors[keyof IGetAncestorsUseCaseErrors];

export const GetAncestorsUseCase = createAbstraction<IGetAncestorsUseCase>("GetAncestorsUseCase");

export namespace GetAncestorsUseCase {
    export type Interface = IGetAncestorsUseCase;
    export type Error = UseCaseError;
}
