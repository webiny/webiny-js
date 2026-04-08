import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Language } from "~/api/domain/Language.js";
import type { LanguageNotFoundError, LanguagePersistenceError } from "~/api/domain/errors.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IGetLanguageByCodeRepository {
    execute(code: string): Promise<Result<Language, RepositoryError>>;
}

export interface IGetLanguageByCodeRepositoryErrors {
    notFound: LanguageNotFoundError;
    persistence: LanguagePersistenceError;
}

type RepositoryError = IGetLanguageByCodeRepositoryErrors[keyof IGetLanguageByCodeRepositoryErrors];

export const GetLanguageByCodeRepository = createAbstraction<IGetLanguageByCodeRepository>(
    "Languages/GetLanguageByCodeRepository"
);

export namespace GetLanguageByCodeRepository {
    export type Interface = IGetLanguageByCodeRepository;
    export type Return = Promise<Result<Language, RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IGetLanguageByCodeUseCase {
    execute(code: string): Promise<Result<Language, UseCaseError>>;
}

export interface IGetLanguageByCodeUseCaseErrors {
    notFound: LanguageNotFoundError;
    persistence: LanguagePersistenceError;
}

type UseCaseError = IGetLanguageByCodeUseCaseErrors[keyof IGetLanguageByCodeUseCaseErrors];

/** Get a language entry by its code. */
export const GetLanguageByCodeUseCase = createAbstraction<IGetLanguageByCodeUseCase>(
    "Languages/GetLanguageByCodeUseCase"
);

export namespace GetLanguageByCodeUseCase {
    export type Interface = IGetLanguageByCodeUseCase;
    export type Return = Promise<Result<Language, UseCaseError>>;
    export type Error = UseCaseError;
}
