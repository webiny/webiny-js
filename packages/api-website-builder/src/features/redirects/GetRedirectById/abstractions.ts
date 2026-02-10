import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import type { RedirectNotFoundError, RedirectPersistenceError } from "~/domain/redirect/errors.js";

/**
 * GetRedirectById repository interface
 */
export interface IGetRedirectByIdRepository {
    execute(id: string): Promise<Result<WbRedirect, RepositoryError>>;
}

export interface IGetRedirectByIdRepositoryErrors {
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type RepositoryError = IGetRedirectByIdRepositoryErrors[keyof IGetRedirectByIdRepositoryErrors];

export const GetRedirectByIdRepository = createAbstraction<IGetRedirectByIdRepository>(
    "GetRedirectByIdRepository"
);

export namespace GetRedirectByIdRepository {
    export type Interface = IGetRedirectByIdRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbRedirect, RepositoryError>>;
    export type Redirect = WbRedirect;
}

/**
 * GetRedirectById use case interface
 */
export interface IGetRedirectByIdUseCase {
    execute(id: string): Promise<Result<WbRedirect, UseCaseError>>;
}

export interface IGetRedirectByIdUseCaseErrors {
    notFound: RedirectNotFoundError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IGetRedirectByIdUseCaseErrors[keyof IGetRedirectByIdUseCaseErrors];

export const GetRedirectByIdUseCase =
    createAbstraction<IGetRedirectByIdUseCase>("GetRedirectByIdUseCase");

export namespace GetRedirectByIdUseCase {
    export type Interface = IGetRedirectByIdUseCase;
    export type Return = Promise<Result<WbRedirect, UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}
