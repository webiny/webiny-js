import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { LayoutPersistenceError, LayoutSlugTakenError } from "~/domain/layout/errors.js";
import type { Layout as WbLayout } from "~/domain/layout/abstractions.js";
import type { LayoutSlug } from "~/domain/layout/LayoutSlug.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListLayoutsBySlugRepository {
    // The latest and the published revisions of the layouts with the slug.
    execute(slug: string): Promise<Result<WbLayout[], RepositoryError>>;
}

export interface IListLayoutsBySlugRepositoryErrors {
    persistence: LayoutPersistenceError;
}

type RepositoryError = IListLayoutsBySlugRepositoryErrors[keyof IListLayoutsBySlugRepositoryErrors];

/** Find layouts by their slug. Replace it to keep layouts elsewhere. */
export const ListLayoutsBySlugRepository = createAbstraction<IListLayoutsBySlugRepository>(
    "Wb/ListLayoutsBySlugRepository"
);

export namespace ListLayoutsBySlugRepository {
    export type Interface = IListLayoutsBySlugRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbLayout[], RepositoryError>>;
}

// ============================================================================
// Service Abstraction
// ============================================================================

export interface ILayoutSlugAvailability {
    /**
     * Fails with `LayoutSlugTakenError` when another source layout has the slug, in its latest or its published
     * revision. `entryId` is the layout the slug is for, when it exists.
     */
    ensureAvailable(slug: LayoutSlug, entryId?: string): Promise<Result<void, ServiceError>>;
    // The first of `slug`, `slug-2`, `slug-3`, ... that no layout has.
    firstAvailable(slug: LayoutSlug): Promise<Result<LayoutSlug, LayoutPersistenceError>>;
}

export interface ILayoutSlugAvailabilityErrors {
    slugTaken: LayoutSlugTakenError;
    persistence: LayoutPersistenceError;
}

type ServiceError = ILayoutSlugAvailabilityErrors[keyof ILayoutSlugAvailabilityErrors];

/**
 * Keeps layout slugs unique among the tenant's source layouts. It is not authorized: callers are.
 */
export const LayoutSlugAvailability = createAbstraction<ILayoutSlugAvailability>(
    "Wb/LayoutSlugAvailability"
);

export namespace LayoutSlugAvailability {
    export type Interface = ILayoutSlugAvailability;
    export type Error = ServiceError;
}
