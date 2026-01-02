import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";
import type { FolderNotAuthorizedError, FolderPersistenceError } from "~/domain/folder/errors.js";

/**
 * GetFolderHierarchy repository interface
 */
export interface IGetFolderHierarchyRepository {
    execute(
        params: GetFolderHierarchyParams
    ): Promise<Result<GetFolderHierarchyResponse, RepositoryError>>;
}

export interface IGetFolderHierarchyRepositoryErrors {
    persistence: FolderPersistenceError;
}

type RepositoryError =
    IGetFolderHierarchyRepositoryErrors[keyof IGetFolderHierarchyRepositoryErrors];

export const GetFolderHierarchyRepository = createAbstraction<IGetFolderHierarchyRepository>(
    "GetFolderHierarchyRepository"
);

export namespace GetFolderHierarchyRepository {
    export type Interface = IGetFolderHierarchyRepository;
    export type Error = RepositoryError;
}

/**
 * GetFolderHierarchy use case interface
 */
export interface IGetFolderHierarchyUseCase {
    execute(
        params: GetFolderHierarchyParams
    ): Promise<Result<GetFolderHierarchyResponse, UseCaseError>>;
}

export interface IGetFolderHierarchyUseCaseErrors {
    notAuthorized: FolderNotAuthorizedError;
    persistence: FolderPersistenceError;
}

type UseCaseError = IGetFolderHierarchyUseCaseErrors[keyof IGetFolderHierarchyUseCaseErrors];

export const GetFolderHierarchyUseCase = createAbstraction<IGetFolderHierarchyUseCase>(
    "GetFolderHierarchyUseCase"
);

export namespace GetFolderHierarchyUseCase {
    export type Interface = IGetFolderHierarchyUseCase;
    export type Return = Promise<Result<GetFolderHierarchyResponse, UseCaseError>>;
    export type Error = UseCaseError;
}
