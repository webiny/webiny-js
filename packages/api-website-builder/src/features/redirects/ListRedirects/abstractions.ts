import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import type {
    RedirectPersistenceError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

// ============================================================================
// Type Definitions
// ============================================================================

export interface IListWbRedirectsWhere {
    latest?: boolean;
    createdBy?: string;
    redirectFrom?: string;
    redirectFrom_not?: string;
    redirectFrom_in?: string[];
    redirectFrom_not_in?: string[];

    redirectTo?: string;
    redirectTo_not?: string;
    redirectTo_in?: string[];
    redirectTo_not_in?: string[];

    redirectType?: string;
    redirectType_not?: string;
    redirectType_in?: string[];
    redirectType_not_in?: string[];

    isEnabled?: boolean;
}

export interface ListWbRedirectsParams {
    where?: IListWbRedirectsWhere;
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string | null;
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

export const ListRedirectsRepository = createAbstraction<IListRedirectsRepository>(
    "Wb/ListRedirectsRepository"
);

export namespace ListRedirectsRepository {
    export type Interface = IListRedirectsRepository;
    export type Params = ListWbRedirectsParams;
    export type Return = Promise<Result<ListRedirectsResult, RepositoryError>>;
    export type Error = RepositoryError;
    export type Redirect = WbRedirect;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListRedirectsUseCase {
    execute(params: ListWbRedirectsParams): Promise<Result<ListRedirectsResult, UseCaseError>>;
}

export interface IListRedirectsUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IListRedirectsUseCaseErrors[keyof IListRedirectsUseCaseErrors];

export const ListRedirectsUseCase =
    createAbstraction<IListRedirectsUseCase>("Wb/ListRedirectsUseCase");

export namespace ListRedirectsUseCase {
    export type Interface = IListRedirectsUseCase;
    export type Params = ListWbRedirectsParams;
    export type Return = Promise<Result<ListRedirectsResult, UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}
