import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PagePersistenceError, PageNotAuthorizedError } from "~/domain/page/errors.js";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";

export interface IListDeletedPagesParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface IListDeletedPagesMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export type IListDeletedPagesResult = { pages: WbPage[]; meta: IListDeletedPagesMeta };

/**
 * ListDeletedPages repository interface
 */
export interface IListDeletedPagesRepository {
    execute(
        params: IListDeletedPagesParams
    ): Promise<Result<IListDeletedPagesResult, RepositoryError>>;
}

export interface IListDeletedPagesRepositoryErrors {
    persistence: PagePersistenceError;
}

type RepositoryError = IListDeletedPagesRepositoryErrors[keyof IListDeletedPagesRepositoryErrors];

export const ListDeletedPagesRepository = createAbstraction<IListDeletedPagesRepository>(
    "Wb/ListDeletedPagesRepository"
);

export namespace ListDeletedPagesRepository {
    export type Interface = IListDeletedPagesRepository;
    export type Error = RepositoryError;
    export type Params = IListDeletedPagesParams;
    export type Return = Promise<Result<IListDeletedPagesResult, RepositoryError>>;
}

/**
 * ListDeletedPages use case interface
 */
export interface IListDeletedPagesUseCase {
    execute(
        params: IListDeletedPagesParams
    ): Promise<Result<IListDeletedPagesResult, UseCaseError>>;
}

export interface IListDeletedPagesUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    persistence: PagePersistenceError;
}

type UseCaseError = IListDeletedPagesUseCaseErrors[keyof IListDeletedPagesUseCaseErrors];

export const ListDeletedPagesUseCase = createAbstraction<IListDeletedPagesUseCase>(
    "Wb/ListDeletedPagesUseCase"
);

export namespace ListDeletedPagesUseCase {
    export type Interface = IListDeletedPagesUseCase;
    export type Error = UseCaseError;
    export type Params = IListDeletedPagesParams;
    export type Return = Promise<Result<IListDeletedPagesResult, UseCaseError>>;
}
