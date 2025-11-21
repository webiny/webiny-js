import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";
import { type FilePersistenceError, FileNotAuthorizedError } from "~/domain/file/errors.js";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types";

export interface ListFilesInput {
    limit?: number;
    after?: string | null;
    where?: Record<string, any>;
    sort?: Array<`${string}_ASC` | `${string}_DESC`>;
    search?: string;
}

export interface ListFilesOutput {
    items: File[];
    meta: CmsEntryMeta;
}

/**
 * ListFiles repository interface
 */
export interface IListFilesRepository {
    execute(input: ListFilesInput): Promise<Result<ListFilesOutput, RepositoryError>>;
}

export interface IListFilesRepositoryErrors {
    persistence: FilePersistenceError;
}

type RepositoryError = IListFilesRepositoryErrors[keyof IListFilesRepositoryErrors];

export const ListFilesRepository = createAbstraction<IListFilesRepository>("ListFilesRepository");

export namespace ListFilesRepository {
    export type Interface = IListFilesRepository;
    export type Error = RepositoryError;
}

/**
 * ListFiles use case interface
 */
export interface IListFilesUseCase {
    execute(input: ListFilesInput): Promise<Result<ListFilesOutput, UseCaseError>>;
}

export interface IListFilesUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
}

type UseCaseError = IListFilesUseCaseErrors[keyof IListFilesUseCaseErrors];

export const ListFilesUseCase = createAbstraction<IListFilesUseCase>("ListFilesUseCase");

export namespace ListFilesUseCase {
    export type Interface = IListFilesUseCase;
    export type Error = UseCaseError;
}
