import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import type { ListMeta } from "~/types.js";
import type { FolderNotAuthorizedError, FolderPersistenceError } from "~/domain/folder/errors.js";

interface IListFoldersResult {
    folders: Folder[];
    meta: ListMeta;
}

/**
 * ListFolders repository interface
 */
export interface IListFoldersRepository {
    execute(params: ListFoldersParams): Promise<Result<IListFoldersResult, RepositoryError>>;
}

export interface IListFoldersRepositoryErrors {
    persistence: FolderPersistenceError;
}

type RepositoryError = IListFoldersRepositoryErrors[keyof IListFoldersRepositoryErrors];

export const ListFoldersRepository =
    createAbstraction<IListFoldersRepository>("ListFoldersRepository");

export namespace ListFoldersRepository {
    export type Interface = IListFoldersRepository;
    export type Return = Promise<Result<IListFoldersResult, RepositoryError>>;
    export type Error = RepositoryError;
}

/**
 * ListFolders use case interface
 */
export interface IListFoldersUseCase {
    execute(params: ListFoldersParams): Promise<Result<IListFoldersResult, UseCaseError>>;
}

export interface IListFoldersUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    persistence: FolderPersistenceError;
}

type UseCaseError = IListFoldersUseCaseErrors[keyof IListFoldersUseCaseErrors];

export const ListFoldersUseCase = createAbstraction<IListFoldersUseCase>("ListFoldersUseCase");

export namespace ListFoldersUseCase {
    export type Interface = IListFoldersUseCase;
    export type Return = Promise<Result<IListFoldersResult, UseCaseError>>;
    export type Error = UseCaseError;
}
