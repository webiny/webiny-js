import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Language } from "~/api/domain/Language.js";
import type {
    DefaultLanguageNotFoundError,
    LanguagePersistenceError
} from "~/api/domain/errors.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetDefaultLanguageRepository {
    execute(): Promise<Result<Language, RepositoryError>>;
}

export interface IGetDefaultLanguageRepositoryErrors {
    notFound: DefaultLanguageNotFoundError;
    persistence: LanguagePersistenceError;
}

type RepositoryError =
    IGetDefaultLanguageRepositoryErrors[keyof IGetDefaultLanguageRepositoryErrors];

export const GetDefaultLanguageRepository = createAbstraction<IGetDefaultLanguageRepository>(
    "Languages/GetDefaultLanguageRepository"
);

export namespace GetDefaultLanguageRepository {
    export type Interface = IGetDefaultLanguageRepository;
    export type Return = Promise<Result<Language, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetDefaultLanguageUseCase {
    execute(): Promise<Result<Language, UseCaseError>>;
}

export interface IGetDefaultLanguageUseCaseErrors {
    notFound: DefaultLanguageNotFoundError;
    persistence: LanguagePersistenceError;
}

type UseCaseError = IGetDefaultLanguageUseCaseErrors[keyof IGetDefaultLanguageUseCaseErrors];

/** Get the default language. */
export const GetDefaultLanguageUseCase = createAbstraction<IGetDefaultLanguageUseCase>(
    "Languages/GetDefaultLanguageUseCase"
);

export namespace GetDefaultLanguageUseCase {
    export type Interface = IGetDefaultLanguageUseCase;
    export type Return = Promise<Result<Language, UseCaseError>>;
    export type Error = UseCaseError;
}
