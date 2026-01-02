import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import type { RedirectPersistenceError } from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ListWbRedirectsParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface WbListMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export type ListRedirectsResult = { redirects: WbRedirect[]; meta: WbListMeta };

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListRedirectsRepository {
    execute(params: ListWbRedirectsParams): Promise<Result<ListRedirectsResult, RepositoryError>>;
}

export interface IListRedirectsRepositoryErrors {
    persistence: RedirectPersistenceError;
}

type RepositoryError = IListRedirectsRepositoryErrors[keyof IListRedirectsRepositoryErrors];

export const ListRedirectsRepository =
    createAbstraction<IListRedirectsRepository>("ListRedirectsRepository");

export namespace ListRedirectsRepository {
    export type Interface = IListRedirectsRepository;
    export type Params = ListWbRedirectsParams;
    export type Return = Promise<Result<ListRedirectsResult, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListRedirectsUseCase {
    execute(params: ListWbRedirectsParams): Promise<Result<ListRedirectsResult, UseCaseError>>;
}

export interface IListRedirectsUseCaseErrors {
    persistence: RedirectPersistenceError;
}

type UseCaseError = IListRedirectsUseCaseErrors[keyof IListRedirectsUseCaseErrors];

export const ListRedirectsUseCase =
    createAbstraction<IListRedirectsUseCase>("ListRedirectsUseCase");

export namespace ListRedirectsUseCase {
    export type Interface = IListRedirectsUseCase;
    export type Params = ListWbRedirectsParams;
    export type Return = Promise<Result<ListRedirectsResult, UseCaseError>>;
    export type Error = UseCaseError;
}
