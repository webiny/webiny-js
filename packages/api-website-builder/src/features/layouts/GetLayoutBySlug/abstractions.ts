import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutNotAuthorizedError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

export interface GetLayoutBySlugParams {
    slug: string;
    // The language of the content rendered in the layout.
    language?: string | null;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetPublishedLayoutBySlugRepository {
    // The published revision of the source layout whose published revision has the slug, or `null`.
    execute(slug: string): Promise<Result<WbLayout | null, RepositoryError>>;
}

export interface IGetPublishedLayoutBySlugRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError =
    IGetPublishedLayoutBySlugRepositoryErrors[keyof IGetPublishedLayoutBySlugRepositoryErrors];

/** Find a published source layout by its slug. Replace it to keep layouts elsewhere. */
export const GetPublishedLayoutBySlugRepository =
    createAbstraction<IGetPublishedLayoutBySlugRepository>("Wb/GetPublishedLayoutBySlugRepository");

export namespace GetPublishedLayoutBySlugRepository {
    export type Interface = IGetPublishedLayoutBySlugRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout | null, RepositoryError>>;
    export type Layout = WbLayout;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLayoutBySlugUseCase {
    execute(params: GetLayoutBySlugParams): Promise<Result<WbLayout | null, UseCaseError>>;
}

export interface IGetLayoutBySlugUseCaseErrors {
    notAuthorized: LayoutNotAuthorizedError;
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetLayoutBySlugUseCaseErrors[keyof IGetLayoutBySlugUseCaseErrors];

/**
 * The layout code renders content in by slug (e.g. a CMS model's `layout` setting): the published source
 * layout with the slug, in its published version in `language`, or else as the source, or else none
 * (`null`). Returned raw. Needs page read permission.
 */
export const GetLayoutBySlugUseCase = createAbstraction<IGetLayoutBySlugUseCase>(
    "Wb/GetLayoutBySlugUseCase"
);

export namespace GetLayoutBySlugUseCase {
    export type Interface = IGetLayoutBySlugUseCase;
    export type Error = UseCaseError;
    export type Params = GetLayoutBySlugParams;
    export type Return = Promise<Result<WbLayout | null, UseCaseError>>;
    export type Layout = WbLayout;
}
