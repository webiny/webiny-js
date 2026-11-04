import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutPersistenceError, LayoutUsedByModel } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";

export interface CountLayoutPagesParams {
    // The entry id of the source layout, as pages reference it.
    layoutId: string;
    // Count only the pages in this language.
    language?: string;
}

export interface LayoutUsage {
    // The number of pages (not in the trash) rendered with the layout.
    pages: number;
    // Whether the layout is the tenant's default layout.
    isDefault: boolean;
    // The CMS models whose `layout` setting names the layout's slug: they render their entries in it.
    models: LayoutUsedByModel[];
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface ICountLayoutPagesRepository {
    execute(params: CountLayoutPagesParams): Promise<Result<number, RepositoryError>>;
}

export interface ICountLayoutPagesRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError = ICountLayoutPagesRepositoryErrors[keyof ICountLayoutPagesRepositoryErrors];

/** Count the pages (not in the trash) that reference a layout. */
export const CountLayoutPagesRepository = createAbstraction<ICountLayoutPagesRepository>(
    "Wb/CountLayoutPagesRepository"
);

export namespace CountLayoutPagesRepository {
    export type Interface = ICountLayoutPagesRepository;
    export type Error = RepositoryError;
    export type Params = CountLayoutPagesParams;
    export type Return = Promise<Result<number, RepositoryError>>;
}

export interface IListLayoutModelsRepository {
    // The CMS models whose `layout` setting is the slug.
    execute(slug: string): Promise<Result<LayoutUsedByModel[], ListLayoutModelsError>>;
}

export interface IListLayoutModelsRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type ListLayoutModelsError =
    IListLayoutModelsRepositoryErrors[keyof IListLayoutModelsRepositoryErrors];

/**
 * List the CMS models that render their entries in a layout: those whose `layout` setting names its slug.
 * All of the tenant's models count, including ones the identity can't read.
 */
export const ListLayoutModelsRepository = createAbstraction<IListLayoutModelsRepository>(
    "Wb/ListLayoutModelsRepository"
);

export namespace ListLayoutModelsRepository {
    export type Interface = IListLayoutModelsRepository;
    export type Error = ListLayoutModelsError;
    export type Return = Promise<Result<LayoutUsedByModel[], ListLayoutModelsError>>;
    export type Model = LayoutUsedByModel;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLayoutUsageUseCase {
    execute(layout: WbLayout): Promise<Result<LayoutUsage, UseCaseError>>;
}

export interface IGetLayoutUsageUseCaseErrors {
    persistence: LayoutPersistenceError;
}

type UseCaseError = IGetLayoutUsageUseCaseErrors[keyof IGetLayoutUsageUseCaseErrors];

/**
 * How a layout is used: by the pages that reference it (for a language version, the pages in its language
 * that reference its source), as the tenant's default layout, and by the CMS models that name its slug (a
 * source layout's: a language version has no slug, and a model's entries fall back to the source without it).
 * It is not authorized: callers are.
 */
export const GetLayoutUsageUseCase = createAbstraction<IGetLayoutUsageUseCase>(
    "Wb/GetLayoutUsageUseCase"
);

export namespace GetLayoutUsageUseCase {
    export type Interface = IGetLayoutUsageUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<LayoutUsage, UseCaseError>>;
    export type Usage = LayoutUsage;
}
