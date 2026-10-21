import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutPersistenceError } from "~/domain/layout/errors.js";
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
 * that reference its source), and as the tenant's default layout. It is not authorized: callers are.
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
