import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

/**
 * GetPageByPath repository interface
 */
export interface IGetPageByPathRepository {
    execute(path: string): Promise<Result<WbPage, RepositoryError>>;
}

export interface IGetPageByPathRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError = IGetPageByPathRepositoryErrors[keyof IGetPageByPathRepositoryErrors];

export const GetPageByPathRepository =
    createAbstraction<IGetPageByPathRepository>("GetPageByPathRepository");

export namespace GetPageByPathRepository {
    export type Interface = IGetPageByPathRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
}

/**
 * GetPageByPath use case interface
 */
export interface IGetPageByPathUseCase {
    execute(path: string): Promise<Result<WbPage, UseCaseError>>;
}

export interface IGetPageByPathUseCaseErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetPageByPathUseCaseErrors[keyof IGetPageByPathUseCaseErrors];

export const GetPageByPathUseCase =
    createAbstraction<IGetPageByPathUseCase>("GetPageByPathUseCase");

export namespace GetPageByPathUseCase {
    export type Interface = IGetPageByPathUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Page = WbPage;
}
