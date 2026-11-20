import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutNotAuthorizedError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

export interface GetPageLayoutParams {
    // The entry id of the source layout, as a page references it in `properties.layout`.
    layoutId: string;
    // The page's language.
    language?: string | null;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetPublishedLayoutRepository {
    // The published revision of a layout, or `null` when it has none (or doesn't exist).
    execute(entryId: string): Promise<Result<WbLayout | null, RepositoryError>>;
}

export interface IGetPublishedLayoutRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError =
    IGetPublishedLayoutRepositoryErrors[keyof IGetPublishedLayoutRepositoryErrors];

/** Read the published revision of a layout from storage. Replace it to keep layouts elsewhere. */
export const GetPublishedLayoutRepository = createAbstraction<IGetPublishedLayoutRepository>(
    "Wb/GetPublishedLayoutRepository"
);

export namespace GetPublishedLayoutRepository {
    export type Interface = IGetPublishedLayoutRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout | null, RepositoryError>>;
    export type Layout = WbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetPageLayoutUseCase {
    execute(params: GetPageLayoutParams): Promise<Result<WbLayout | null, UseCaseError>>;
}

export interface IGetPageLayoutUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetPageLayoutUseCaseErrors[keyof IGetPageLayoutUseCaseErrors];

/**
 * The layout a page is rendered in: the published revision of the source layout's version in the page's
 * language, or else the published revision of the source layout, or else none (`null`). Returned raw.
 */
export const GetPageLayoutUseCase =
    createAbstraction<IGetPageLayoutUseCase>("Wb/GetPageLayoutUseCase");

export namespace GetPageLayoutUseCase {
    export type Interface = IGetPageLayoutUseCase;
    export type Error = UseCaseError;
    export type Params = GetPageLayoutParams;
    export type Return = Promise<Result<WbLayout | null, UseCaseError>>;
    export type Layout = WbLayout;
}
