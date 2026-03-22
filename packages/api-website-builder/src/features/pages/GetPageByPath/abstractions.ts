import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type {
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

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

export const GetPageByPathRepository = createAbstraction<IGetPageByPathRepository>(
    "Wb/GetPageByPathRepository"
);

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
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetPageByPathUseCaseErrors[keyof IGetPageByPathUseCaseErrors];

/** Retrieve a page by its URL path. */
export const GetPageByPathUseCase =
    createAbstraction<IGetPageByPathUseCase>("Wb/GetPageByPathUseCase");

export namespace GetPageByPathUseCase {
    export type Interface = IGetPageByPathUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Page = WbPage;
}
