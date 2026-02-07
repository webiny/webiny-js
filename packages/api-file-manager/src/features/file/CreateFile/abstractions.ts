import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CreatedBy, File, FileInput } from "~/domain/file/types.js";
import {
    type FilePersistenceError,
    type InvalidFileSizeError,
    type FileAlreadyExistsError,
    FileNotAuthorizedError
} from "~/domain/file/errors.js";

export interface CreateFileInput {
    id?: string;
    key: string;
    size: number;
    type: string;
    name: string;
    metadata?: Record<string, any>;
    extensions?: Record<string, any>;
    tags?: string[];
    location?: { folderId: string };
    // System attributes
    createdOn?: string;
    createdBy?: CreatedBy;
    modifiedOn?: string;
    modifiedBy?: CreatedBy;
    savedOn?: string;
    savedBy?: CreatedBy;
}

/**
 * CreateFile repository interface
 */
export interface ICreateFileRepository {
    execute(data: FileInput): Promise<Result<File, RepositoryError>>;
}

export interface ICreateFileRepositoryErrors {
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
}

type RepositoryError = ICreateFileRepositoryErrors[keyof ICreateFileRepositoryErrors];

export const CreateFileRepository =
    createAbstraction<ICreateFileRepository>("CreateFileRepository");

export namespace CreateFileRepository {
    export type Interface = ICreateFileRepository;
    export type Error = RepositoryError;
}

/**
 * CreateFile use case interface
 */
export interface ICreateFileUseCase {
    execute(
        input: CreateFileInput,
        meta?: Record<string, any>
    ): Promise<Result<File, UseCaseError>>;
}

export interface ICreateFileUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
    invalidSize: InvalidFileSizeError;
    alreadyExists: FileAlreadyExistsError;
}

type UseCaseError = ICreateFileUseCaseErrors[keyof ICreateFileUseCaseErrors];

export const CreateFileUseCase = createAbstraction<ICreateFileUseCase>("CreateFileUseCase");

export namespace CreateFileUseCase {
    export type Interface = ICreateFileUseCase;
    export type Error = UseCaseError;
}
