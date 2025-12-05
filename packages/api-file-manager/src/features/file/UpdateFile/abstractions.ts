import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CreatedBy, File } from "~/domain/file/types.js";
import {
    type FilePersistenceError,
    type FileNotFoundError,
    FileNotAuthorizedError
} from "~/domain/file/errors.js";

export interface UpdateFileInput {
    id: string;
    name?: string;
    meta?: Record<string, any>;
    tags?: string[];
    location?: { folderId: string };
    aliases?: string[];
    createdOn?: string;
    modifiedOn?: string;
    savedOn?: string;
    createdBy?: CreatedBy;
    modifiedBy?: CreatedBy;
    savedBy?: CreatedBy;
}

/**
 * UpdateFile repository interface
 */
export interface IUpdateFileRepository {
    update(file: File): Promise<Result<void, RepositoryError>>;
}

export interface IUpdateFileRepositoryErrors {
    notFound: FileNotFoundError;
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
}

type RepositoryError = IUpdateFileRepositoryErrors[keyof IUpdateFileRepositoryErrors];

export const UpdateFileRepository =
    createAbstraction<IUpdateFileRepository>("UpdateFileRepository");

export namespace UpdateFileRepository {
    export type Interface = IUpdateFileRepository;
    export type Error = RepositoryError;
}

/**
 * UpdateFile use case interface
 */
export interface IUpdateFileUseCase {
    execute(input: UpdateFileInput): Promise<Result<File, UseCaseError>>;
}

export interface IUpdateFileUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type UseCaseError = IUpdateFileUseCaseErrors[keyof IUpdateFileUseCaseErrors];

export const UpdateFileUseCase = createAbstraction<IUpdateFileUseCase>("UpdateFileUseCase");

export namespace UpdateFileUseCase {
    export type Interface = IUpdateFileUseCase;
    export type Error = UseCaseError;
}
