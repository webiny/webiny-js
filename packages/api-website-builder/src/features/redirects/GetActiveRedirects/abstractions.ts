import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import type {
    RedirectPersistenceError,
    RedirectNotAuthorizedError
} from "~/domain/redirect/errors.js";

/**
 * GetActiveRedirects repository interface
 */
export interface IGetActiveRedirectsRepository {
    execute(): Promise<Result<WbRedirect[], RepositoryError>>;
}

export interface IGetActiveRedirectsRepositoryErrors {
    persistence: RedirectPersistenceError;
}

type RepositoryError =
    IGetActiveRedirectsRepositoryErrors[keyof IGetActiveRedirectsRepositoryErrors];

export const GetActiveRedirectsRepository = createAbstraction<IGetActiveRedirectsRepository>(
    "Wb/GetActiveRedirectsRepository"
);

export namespace GetActiveRedirectsRepository {
    export type Interface = IGetActiveRedirectsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbRedirect[], RepositoryError>>;
    export type Redirect = WbRedirect;
}

/**
 * GetActiveRedirects use case interface
 */
export interface IGetActiveRedirectsUseCase {
    execute(): Promise<Result<WbRedirect[], UseCaseError>>;
}

export interface IGetActiveRedirectsUseCaseErrors {
    notAuthorized: RedirectNotAuthorizedError;
    persistence: RedirectPersistenceError;
}

type UseCaseError = IGetActiveRedirectsUseCaseErrors[keyof IGetActiveRedirectsUseCaseErrors];

export const GetActiveRedirectsUseCase = createAbstraction<IGetActiveRedirectsUseCase>(
    "Wb/GetActiveRedirectsUseCase"
);

export namespace GetActiveRedirectsUseCase {
    export type Interface = IGetActiveRedirectsUseCase;
    export type Return = Promise<Result<WbRedirect[], UseCaseError>>;
    export type Error = UseCaseError;
    export type Redirect = WbRedirect;
}
