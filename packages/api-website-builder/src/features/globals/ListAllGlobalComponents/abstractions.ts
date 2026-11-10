import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";
import type { GlobalComponentPersistenceError } from "~/domain/globals/errors.js";
import type { GlobalComponent as WbGlobalComponent } from "~/domain/globals/abstractions.js";

export interface ListAllGlobalComponentsParams {
    // The records' scope (see `GlobalComponent.scope`). Without one, only the records that have no scope are listed.
    scope?: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListAllGlobalComponentsRepository {
    // Every global component record of the scope, in every language.
    execute(
        params: ListAllGlobalComponentsParams
    ): Promise<Result<WbGlobalComponent[], RepositoryError>>;
}

export interface IListAllGlobalComponentsRepositoryErrors {
    persistence: GlobalComponentPersistenceError;
}

type RepositoryError =
    IListAllGlobalComponentsRepositoryErrors[keyof IListAllGlobalComponentsRepositoryErrors];

/** Read every global component record of one scope, whatever its language. Replace it to keep global components elsewhere. */
export const ListAllGlobalComponentsRepository =
    createAbstraction<IListAllGlobalComponentsRepository>("Wb/ListAllGlobalComponentsRepository");

export namespace ListAllGlobalComponentsRepository {
    export type Interface = IListAllGlobalComponentsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbGlobalComponent[], RepositoryError>>;
    export type Params = ListAllGlobalComponentsParams;
    export type GlobalComponent = WbGlobalComponent;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListAllGlobalComponentsUseCase {
    execute(
        params?: ListAllGlobalComponentsParams
    ): Promise<Result<WbGlobalComponent[], UseCaseError>>;
}

export interface IListAllGlobalComponentsUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    persistence: GlobalComponentPersistenceError;
}

type UseCaseError =
    IListAllGlobalComponentsUseCaseErrors[keyof IListAllGlobalComponentsUseCaseErrors];

/**
 * List every stored global component record of one scope in all languages, each with its `language`
 * (e.g. to copy or move a scope's records). No fallback: only what is stored.
 */
export const ListAllGlobalComponentsUseCase = createAbstraction<IListAllGlobalComponentsUseCase>(
    "Wb/ListAllGlobalComponentsUseCase"
);

export namespace ListAllGlobalComponentsUseCase {
    export type Interface = IListAllGlobalComponentsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbGlobalComponent[], UseCaseError>>;
    export type Params = ListAllGlobalComponentsParams;
    export type GlobalComponent = WbGlobalComponent;
}
