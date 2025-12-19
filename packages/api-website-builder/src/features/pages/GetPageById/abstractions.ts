import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/context/pages/pages.types.js";
import type { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

/**
 * GetPageById repository interface
 */
export interface IGetPageByIdRepository {
    execute(id: string): Promise<Result<WbPage, RepositoryError>>;
}

export interface IGetPageByIdRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IGetPageByIdRepositoryErrors[keyof IGetPageByIdRepositoryErrors];

export const GetPageByIdRepository =
    createAbstraction<IGetPageByIdRepository>("GetPageByIdRepository");

export namespace GetPageByIdRepository {
    export type Interface = IGetPageByIdRepository;
    export type Error = RepositoryError;
}

/**
 * GetPageById use case interface
 */
export interface IGetPageByIdUseCase {
    execute(id: string): Promise<Result<WbPage, UseCaseError>>;
}

export interface IGetPageByIdUseCaseErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetPageByIdUseCaseErrors[keyof IGetPageByIdUseCaseErrors];

export const GetPageByIdUseCase = createAbstraction<IGetPageByIdUseCase>("GetPageByIdUseCase");

export namespace GetPageByIdUseCase {
    export type Interface = IGetPageByIdUseCase;
    export type Error = UseCaseError;
}
