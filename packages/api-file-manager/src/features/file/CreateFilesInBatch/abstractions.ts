import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File, FileInput } from "~/domain/file/types.js";
import {
    type FilePersistenceError,
    type InvalidFileSizeError,
    FileNotAuthorizedError
} from "~/domain/file/errors.js";

export interface CreateFilesInBatchInput {
    files: FileInput[];
    meta?: Record<string, any>;
}

/**
 * CreateFilesInBatch repository interface
 */
export interface ICreateFilesInBatchRepository {
    createBatch(files: FileInput[]): Promise<Result<File[], RepositoryError>>;
}

export interface ICreateFilesInBatchRepositoryErrors {
    persistence: FilePersistenceError;
}

type RepositoryError = ICreateFilesInBatchRepositoryErrors[keyof ICreateFilesInBatchRepositoryErrors];

export const CreateFilesInBatchRepository = createAbstraction<ICreateFilesInBatchRepository>(
    "CreateFilesInBatchRepository"
);

export namespace CreateFilesInBatchRepository {
    export type Interface = ICreateFilesInBatchRepository;
    export type Error = RepositoryError;
}

/**
 * CreateFilesInBatch use case interface
 */
export interface ICreateFilesInBatchUseCase {
    execute(input: CreateFilesInBatchInput): Promise<Result<File[], UseCaseError>>;
}

export interface ICreateFilesInBatchUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
    invalidSize: InvalidFileSizeError;
}

type UseCaseError = ICreateFilesInBatchUseCaseErrors[keyof ICreateFilesInBatchUseCaseErrors];

export const CreateFilesInBatchUseCase = createAbstraction<ICreateFilesInBatchUseCase>(
    "CreateFilesInBatchUseCase"
);

export namespace CreateFilesInBatchUseCase {
    export type Interface = ICreateFilesInBatchUseCase;
    export type Error = UseCaseError;
}
