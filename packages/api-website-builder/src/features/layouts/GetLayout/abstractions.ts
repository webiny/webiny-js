import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    LayoutNotAuthorizedError,
    LayoutNotFoundError,
    LayoutPersistenceError
} from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetLayoutRepository {
    // A revision id (e.g. `abc#0001`) reads that revision; an entry id reads the latest revision.
    execute(id: string): Promise<Result<WbLayout, RepositoryError>>;
}

export interface IGetLayoutRepositoryErrors {
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type RepositoryError = IGetLayoutRepositoryErrors[keyof IGetLayoutRepositoryErrors];

/** Read one layout revision from storage. Replace it to keep layouts elsewhere. */
export const GetLayoutRepository =
    createAbstraction<IGetLayoutRepository>("Wb/GetLayoutRepository");

export namespace GetLayoutRepository {
    export type Interface = IGetLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout, RepositoryError>>;
    export type Layout = WbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLayoutUseCase {
    execute(id: string): Promise<Result<WbLayout, UseCaseError>>;
}

export interface IGetLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    notFound: LayoutNotFoundError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetLayoutUseCaseErrors[keyof IGetLayoutUseCaseErrors];

/**
 * Retrieve a layout revision as stored: by its revision id, or the latest revision by the entry id.
 * Global component instances are never part of it; bindings under their ids are the layout's overrides.
 */
export const GetLayoutUseCase = createAbstraction<IGetLayoutUseCase>("Wb/GetLayoutUseCase");

export namespace GetLayoutUseCase {
    export type Interface = IGetLayoutUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbLayout, UseCaseError>>;
    export type Layout = WbLayout;
}
