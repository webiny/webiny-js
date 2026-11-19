import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type {
    PageNotFoundError,
    PagePersistenceError,
    PageNotAuthorizedError
} from "~/domain/page/errors.js";

/**
 * GetLatestPageByPath repository interface
 */
export interface IGetLatestPageByPathRepository {
    execute(path: string): Promise<Result<WbPage, RepositoryError>>;
}

export interface IGetLatestPageByPathRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    IGetLatestPageByPathRepositoryErrors[keyof IGetLatestPageByPathRepositoryErrors];

export const GetLatestPageByPathRepository = createAbstraction<IGetLatestPageByPathRepository>(
    "Wb/GetLatestPageByPathRepository"
);

export namespace GetLatestPageByPathRepository {
    export type Interface = IGetLatestPageByPathRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
}

/**
 * GetLatestPageByPath use case interface
 */
export interface IGetLatestPageByPathUseCase {
    execute(path: string): Promise<Result<WbPage, UseCaseError>>;
}

export interface IGetLatestPageByPathUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetLatestPageByPathUseCaseErrors[keyof IGetLatestPageByPathUseCaseErrors];

/** Retrieve the latest revision of a page by its URL path, whatever its status. */
export const GetLatestPageByPathUseCase = createAbstraction<IGetLatestPageByPathUseCase>(
    "Wb/GetLatestPageByPathUseCase"
);

export namespace GetLatestPageByPathUseCase {
    export type Interface = IGetLatestPageByPathUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Page = WbPage;
}
