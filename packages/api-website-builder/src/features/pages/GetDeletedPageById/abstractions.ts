import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type {
    PageNotAuthorizedError,
    PageNotFoundError,
    PageNotFoundTrashedError,
    PagePersistenceError
} from "~/domain/page/errors.js";

/**
 * GetDeletedPageById repository interface
 */
export interface IGetDeletedPageByIdRepository {
    execute(id: string): Promise<Result<WbPage, RepositoryError>>;
}

export interface IGetDeletedPageByIdRepositoryErrors {
    notFound: PageNotFoundError;
    trashedNotFound: PageNotFoundTrashedError;
    persistence: PagePersistenceError;
}

type RepositoryError =
    IGetDeletedPageByIdRepositoryErrors[keyof IGetDeletedPageByIdRepositoryErrors];

export const GetDeletedPageByIdRepository = createAbstraction<IGetDeletedPageByIdRepository>(
    "Wb/GetDeletedPageByIdRepository"
);

export namespace GetDeletedPageByIdRepository {
    export type Interface = IGetDeletedPageByIdRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
}

/**
 * GetDeletedPageById use case interface
 */
export interface IGetDeletedPageByIdUseCase {
    execute(id: string): Promise<Result<WbPage, UseCaseError>>;
}

export interface IGetDeletedPageByIdUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: PageNotFoundError;
    trashedNotFound: PageNotFoundTrashedError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetDeletedPageByIdUseCaseErrors[keyof IGetDeletedPageByIdUseCaseErrors];

export const GetDeletedPageByIdUseCase = createAbstraction<IGetDeletedPageByIdUseCase>(
    "Wb/GetDeletedPageByIdUseCase"
);

export namespace GetDeletedPageByIdUseCase {
    export type Interface = IGetDeletedPageByIdUseCase;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}
