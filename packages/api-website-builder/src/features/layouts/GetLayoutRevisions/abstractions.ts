import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutNotAuthorizedError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetLayoutRevisionsRepository {
    execute(entryId: string): Promise<Result<WbLayout[], RepositoryError>>;
}

export interface IGetLayoutRevisionsRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError =
    IGetLayoutRevisionsRepositoryErrors[keyof IGetLayoutRevisionsRepositoryErrors];

/** Read every revision of a layout from storage. Replace it to keep layouts elsewhere. */
export const GetLayoutRevisionsRepository = createAbstraction<IGetLayoutRevisionsRepository>(
    "Wb/GetLayoutRevisionsRepository"
);

export namespace GetLayoutRevisionsRepository {
    export type Interface = IGetLayoutRevisionsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout[], RepositoryError>>;
    export type Layout = WbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLayoutRevisionsUseCase {
    // Takes the entry id, or any revision id of the layout.
    execute(entryId: string): Promise<Result<WbLayout[], UseCaseError>>;
}

export interface IGetLayoutRevisionsUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetLayoutRevisionsUseCaseErrors[keyof IGetLayoutRevisionsUseCaseErrors];

/** List every revision of a layout. */
export const GetLayoutRevisionsUseCase = createAbstraction<IGetLayoutRevisionsUseCase>(
    "Wb/GetLayoutRevisionsUseCase"
);

export namespace GetLayoutRevisionsUseCase {
    export type Interface = IGetLayoutRevisionsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbLayout[], UseCaseError>>;
    export type Layout = WbLayout;
}
