import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutNotAuthorizedError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListLayoutsRepositoryWhere {
    // Only layouts created by this identity.
    createdBy?: string;
}

export interface IListLayoutsRepository {
    // The latest revision of every layout: source layouts and their language versions.
    execute(where?: IListLayoutsRepositoryWhere): Promise<Result<WbLayout[], RepositoryError>>;
}

export interface IListLayoutsRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError = IListLayoutsRepositoryErrors[keyof IListLayoutsRepositoryErrors];

/** Read every layout from storage. Replace it to keep layouts elsewhere. */
export const ListLayoutsRepository = createAbstraction<IListLayoutsRepository>(
    "Wb/ListLayoutsRepository"
);

export namespace ListLayoutsRepository {
    export type Interface = IListLayoutsRepository;
    export type Where = IListLayoutsRepositoryWhere;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout[], RepositoryError>>;
    export type Layout = WbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListLayoutsUseCase {
    execute(): Promise<Result<WbLayout[], UseCaseError>>;
}

export interface IListLayoutsUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IListLayoutsUseCaseErrors[keyof IListLayoutsUseCaseErrors];

/** List the latest revision of every layout (sources and language versions), sorted by title. */
export const ListLayoutsUseCase = createAbstraction<IListLayoutsUseCase>("Wb/ListLayoutsUseCase");

export namespace ListLayoutsUseCase {
    export type Interface = IListLayoutsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbLayout[], UseCaseError>>;
    export type Layout = WbLayout;
}
