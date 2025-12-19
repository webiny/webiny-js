import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage, ListPagesParams, ListPagesMeta } from "~/domain/page/abstractions.js";
import type { PagePersistenceError } from "~/domain/page/errors.js";

export type ListPagesResult = [WbPage[], ListPagesMeta];

/**
 * ListPages repository interface
 */
export interface IListPagesRepository {
    execute(params: ListPagesParams): Promise<Result<ListPagesResult, RepositoryError>>;
}

export interface IListPagesRepositoryErrors {
    persistence: PagePersistenceError;
}

type RepositoryError = IListPagesRepositoryErrors[keyof IListPagesRepositoryErrors];

export const ListPagesRepository = createAbstraction<IListPagesRepository>("ListPagesRepository");

export namespace ListPagesRepository {
    export type Interface = IListPagesRepository;
    export type Error = RepositoryError;
}

/**
 * ListPages use case interface
 */
export interface IListPagesUseCase {
    execute(params: ListPagesParams): Promise<Result<ListPagesResult, UseCaseError>>;
}

export interface IListPagesUseCaseErrors {
    persistence: PagePersistenceError;
}

type UseCaseError = IListPagesUseCaseErrors[keyof IListPagesUseCaseErrors];

export const ListPagesUseCase = createAbstraction<IListPagesUseCase>("ListPagesUseCase");

export namespace ListPagesUseCase {
    export type Interface = IListPagesUseCase;
    export type Error = UseCaseError;
}
