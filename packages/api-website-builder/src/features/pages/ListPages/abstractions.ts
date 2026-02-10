import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PagePersistenceError } from "~/domain/page/errors.js";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";

export interface IListPagesParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface IListPagesMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export type IListPagesResult = { pages: WbPage[]; meta: IListPagesMeta };

/**
 * ListPages repository interface
 */
export interface IListPagesRepository {
    execute(params: IListPagesParams): Promise<Result<IListPagesResult, RepositoryError>>;
}

export interface IListPagesRepositoryErrors {
    persistence: PagePersistenceError;
}

type RepositoryError = IListPagesRepositoryErrors[keyof IListPagesRepositoryErrors];

export const ListPagesRepository = createAbstraction<IListPagesRepository>("Wb/ListPagesRepository");

export namespace ListPagesRepository {
    export type Interface = IListPagesRepository;
    export type Error = RepositoryError;
    export type Params = IListPagesParams;
    export type Return = Promise<Result<IListPagesResult, RepositoryError>>;
}

/**
 * ListPages use case interface
 */
export interface IListPagesUseCase {
    execute(params: IListPagesParams): Promise<Result<IListPagesResult, UseCaseError>>;
}

export interface IListPagesUseCaseErrors {
    persistence: PagePersistenceError;
}

type UseCaseError = IListPagesUseCaseErrors[keyof IListPagesUseCaseErrors];

export const ListPagesUseCase = createAbstraction<IListPagesUseCase>("Wb/ListPagesUseCase");

export namespace ListPagesUseCase {
    export type Interface = IListPagesUseCase;
    export type Error = UseCaseError;
    export type Params = IListPagesParams;
    export type Return = Promise<Result<IListPagesResult, UseCaseError>>;
}
