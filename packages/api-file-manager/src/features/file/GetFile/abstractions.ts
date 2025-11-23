import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";
import {
    type FilePersistenceError,
    type FileNotFoundError,
    FileNotAuthorizedError
} from "~/domain/file/errors.js";

/**
 * GetFile repository interface
 */
export interface IGetFileRepository {
    execute(id: string): Promise<Result<File, RepositoryError>>;
}

export interface IGetFileRepositoryErrors {
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type RepositoryError = IGetFileRepositoryErrors[keyof IGetFileRepositoryErrors];

export const GetFileRepository = createAbstraction<IGetFileRepository>("GetFileRepository");

export namespace GetFileRepository {
    export type Interface = IGetFileRepository;
    export type Error = RepositoryError;
}

/**
 * GetFile use case interface
 */
export interface IGetFileUseCase {
    execute(id: string): Promise<Result<File, UseCaseError>>;
}

export interface IGetFileUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type UseCaseError = IGetFileUseCaseErrors[keyof IGetFileUseCaseErrors];

export const GetFileUseCase = createAbstraction<IGetFileUseCase>("GetFileUseCase");

export namespace GetFileUseCase {
    export type Interface = IGetFileUseCase;
    export type Error = UseCaseError;
}
