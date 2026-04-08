import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Language } from "~/api/domain/Language.js";
import type { LanguagePersistenceError } from "~/api/domain/errors.js";

// ============================================================================
// Repository Abstraction
// ============================================================================

export interface IListLanguagesRepository {
    execute(): Promise<Result<Language[], RepositoryError>>;
}

export interface IListLanguagesRepositoryErrors {
    persistence: LanguagePersistenceError;
}

type RepositoryError = IListLanguagesRepositoryErrors[keyof IListLanguagesRepositoryErrors];

export const ListLanguagesRepository = createAbstraction<IListLanguagesRepository>(
    "Languages/ListLanguagesRepository"
);

export namespace ListLanguagesRepository {
    export type Interface = IListLanguagesRepository;
    export type Return = Promise<Result<Language[], RepositoryError>>;
    export type Error = RepositoryError;
}

// ============================================================================
// Use Case Abstraction
// ============================================================================

export interface IListLanguagesUseCase {
    execute(): Promise<Result<Language[], UseCaseError>>;
}

export interface IListLanguagesUseCaseErrors {
    persistence: LanguagePersistenceError;
}

type UseCaseError = IListLanguagesUseCaseErrors[keyof IListLanguagesUseCaseErrors];

/** List all language entries. */
export const ListLanguagesUseCase = createAbstraction<IListLanguagesUseCase>(
    "Languages/ListLanguagesUseCase"
);

export namespace ListLanguagesUseCase {
    export type Interface = IListLanguagesUseCase;
    export type Return = Promise<Result<Language[], UseCaseError>>;
    export type Error = UseCaseError;
}
