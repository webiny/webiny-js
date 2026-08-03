import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Theme } from "~/domain/theme/abstractions.js";
import {
    ThemeNotAuthorizedError,
    ThemeNotFoundError,
    ThemePersistenceError
} from "~/domain/theme/errors.js";

export interface IGetThemeByIdRepository {
    execute(id: string): Promise<Result<Theme, RepositoryError>>;
}

export interface IGetThemeByIdRepositoryErrors {
    notFound: ThemeNotFoundError;
    persistence: ThemePersistenceError;
}

type RepositoryError = IGetThemeByIdRepositoryErrors[keyof IGetThemeByIdRepositoryErrors];

export const GetThemeByIdRepository = createAbstraction<IGetThemeByIdRepository>(
    "Theme/GetThemeByIdRepository"
);

export namespace GetThemeByIdRepository {
    export type Interface = IGetThemeByIdRepository;
    export type Return = Promise<Result<Theme, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGetThemeByIdUseCase {
    execute(id: string): Promise<Result<Theme, UseCaseError>>;
}

export interface IGetThemeByIdUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    notFound: ThemeNotFoundError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IGetThemeByIdUseCaseErrors[keyof IGetThemeByIdUseCaseErrors];

/**
 * Read one theme by revision id. This is the read gate: mutation use cases fetch through it, so
 * they inherit its authorization check rather than repeating it.
 */
export const GetThemeByIdUseCase = createAbstraction<IGetThemeByIdUseCase>(
    "Theme/GetThemeByIdUseCase"
);

export namespace GetThemeByIdUseCase {
    export type Interface = IGetThemeByIdUseCase;
    export type Return = Promise<Result<Theme, UseCaseError>>;
    export type Error = UseCaseError;
}
