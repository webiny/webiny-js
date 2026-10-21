import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { PageNotAuthorizedError } from "~/domain/page/errors.js";
import type {
    GlobalComponentNotFoundError,
    GlobalComponentPersistenceError
} from "~/domain/globals/errors.js";
import type { GlobalComponent as WbGlobalComponent } from "~/domain/globals/abstractions.js";

export interface GetGlobalComponentParams {
    name: string;
    // The exact language to read; `"default"` (or nothing) reads the record of pages without a language. There is no fallback.
    language?: string | null;
}

export interface GetGlobalComponentRepositoryParams {
    name: string;
    language: string;
}

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetGlobalComponentRepository {
    execute(
        params: GetGlobalComponentRepositoryParams
    ): Promise<Result<WbGlobalComponent, RepositoryError>>;
}

export interface IGetGlobalComponentRepositoryErrors {
    notFound: GlobalComponentNotFoundError;
    persistence: GlobalComponentPersistenceError;
}

type RepositoryError =
    IGetGlobalComponentRepositoryErrors[keyof IGetGlobalComponentRepositoryErrors];

/** Read one global component in one language from storage. Replace it to keep global components elsewhere. */
export const GetGlobalComponentRepository = createAbstraction<IGetGlobalComponentRepository>(
    "Wb/GetGlobalComponentRepository"
);

export namespace GetGlobalComponentRepository {
    export type Interface = IGetGlobalComponentRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbGlobalComponent, RepositoryError>>;
    export type Params = GetGlobalComponentRepositoryParams;
    export type GlobalComponent = WbGlobalComponent;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetGlobalComponentUseCase {
    execute(params: GetGlobalComponentParams): Promise<Result<WbGlobalComponent, UseCaseError>>;
}

export interface IGetGlobalComponentUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    notFound: GlobalComponentNotFoundError;
    persistence: GlobalComponentPersistenceError;
}

type UseCaseError = IGetGlobalComponentUseCaseErrors[keyof IGetGlobalComponentUseCaseErrors];

/**
 * Retrieve the stored instance of one global component in one language.
 * Fails with a not-found error if it was never saved in that language.
 */
export const GetGlobalComponentUseCase = createAbstraction<IGetGlobalComponentUseCase>(
    "Wb/GetGlobalComponentUseCase"
);

export namespace GetGlobalComponentUseCase {
    export type Interface = IGetGlobalComponentUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbGlobalComponent, UseCaseError>>;
    export type Params = GetGlobalComponentParams;
    export type GlobalComponent = WbGlobalComponent;
}
