import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import {
    type FilePersistenceError,
    type FileNotFoundError,
    FileNotAuthorizedError
} from "~/domain/file/errors.js";
import { File } from "~/domain/file/types.js";

export interface DeleteFileInput {
    id: string;
}

/**
 * DeleteFile repository interface
 */
export interface IDeleteFileRepository {
    delete(file: File): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteFileRepositoryErrors {
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type RepositoryError = IDeleteFileRepositoryErrors[keyof IDeleteFileRepositoryErrors];

export const DeleteFileRepository = createAbstraction<IDeleteFileRepository>("DeleteFileRepository");

export namespace DeleteFileRepository {
    export type Interface = IDeleteFileRepository;
    export type Error = RepositoryError;
}

/**
 * DeleteFile use case interface
 */
export interface IDeleteFileUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteFileUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type UseCaseError = IDeleteFileUseCaseErrors[keyof IDeleteFileUseCaseErrors];

export const DeleteFileUseCase = createAbstraction<IDeleteFileUseCase>("DeleteFileUseCase");

export namespace DeleteFileUseCase {
    export type Interface = IDeleteFileUseCase;
    export type Error = UseCaseError;
}
