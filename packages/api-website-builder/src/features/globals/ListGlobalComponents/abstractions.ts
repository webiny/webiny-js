import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";
import type { GlobalComponentPersistenceError } from "~/domain/globals/errors.js";
import type { GlobalComponent as WbGlobalComponent } from "~/domain/globals/abstractions.js";

export interface ListGlobalComponentsParams {
    // The language to list; `"default"` (or nothing) lists the records of pages without a language.
    language?: string | null;
    // Also list every global that has no record in `language`: in the site's default language, else in `"default"`.
    fallback?: boolean;
}

export interface ListGlobalComponentsRepositoryParams {
    // The exact language to list.
    language: string;
    // The records' scope (see `GlobalComponent.scope`). Without one, only the records that have no scope are listed.
    scope?: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListGlobalComponentsRepository {
    // Every global component stored in the language. Those never saved in it are not listed.
    execute(
        params: ListGlobalComponentsRepositoryParams
    ): Promise<Result<WbGlobalComponent[], RepositoryError>>;
}

export interface IListGlobalComponentsRepositoryErrors {
    persistence: GlobalComponentPersistenceError;
}

type RepositoryError =
    IListGlobalComponentsRepositoryErrors[keyof IListGlobalComponentsRepositoryErrors];

/** Read every global component stored in one language. Replace it to keep global components elsewhere. */
export const ListGlobalComponentsRepository = createAbstraction<IListGlobalComponentsRepository>(
    "Wb/ListGlobalComponentsRepository"
);

export namespace ListGlobalComponentsRepository {
    export type Interface = IListGlobalComponentsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbGlobalComponent[], RepositoryError>>;
    export type Params = ListGlobalComponentsRepositoryParams;
    export type GlobalComponent = WbGlobalComponent;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListGlobalComponentsUseCase {
    execute(params: ListGlobalComponentsParams): Promise<Result<WbGlobalComponent[], UseCaseError>>;
}

export interface IListGlobalComponentsUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    persistence: GlobalComponentPersistenceError;
}

type UseCaseError = IListGlobalComponentsUseCaseErrors[keyof IListGlobalComponentsUseCaseErrors];

/**
 * List every global component stored in one language. With `fallback`, globals without a record in the
 * language come in their record of the site's default language, else in their `"default"` record.
 */
export const ListGlobalComponentsUseCase = createAbstraction<IListGlobalComponentsUseCase>(
    "Wb/ListGlobalComponentsUseCase"
);

export namespace ListGlobalComponentsUseCase {
    export type Interface = IListGlobalComponentsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbGlobalComponent[], UseCaseError>>;
    export type Params = ListGlobalComponentsParams;
    export type GlobalComponent = WbGlobalComponent;
}
