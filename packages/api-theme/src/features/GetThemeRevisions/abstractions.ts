import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ThemeRevision } from "~/domain/theme/abstractions.js";
import { ThemeNotAuthorizedError, ThemePersistenceError } from "~/domain/theme/errors.js";

export interface IGetThemeRevisionsRepository {
    execute(entryId: string): Promise<Result<ThemeRevision[], RepositoryError>>;
}

export interface IGetThemeRevisionsRepositoryErrors {
    persistence: ThemePersistenceError;
}

type RepositoryError = IGetThemeRevisionsRepositoryErrors[keyof IGetThemeRevisionsRepositoryErrors];

export const GetThemeRevisionsRepository = createAbstraction<IGetThemeRevisionsRepository>(
    "Theme/GetThemeRevisionsRepository"
);

export namespace GetThemeRevisionsRepository {
    export type Interface = IGetThemeRevisionsRepository;
    export type Return = Promise<Result<ThemeRevision[], RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGetThemeRevisionsUseCase {
    execute(entryId: string): Promise<Result<ThemeRevision[], UseCaseError>>;
}

export interface IGetThemeRevisionsUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IGetThemeRevisionsUseCaseErrors[keyof IGetThemeRevisionsUseCaseErrors];

/** The version history for one theme, newest first. Rollback picks a row from this list. */
export const GetThemeRevisionsUseCase = createAbstraction<IGetThemeRevisionsUseCase>(
    "Theme/GetThemeRevisionsUseCase"
);

export namespace GetThemeRevisionsUseCase {
    export type Interface = IGetThemeRevisionsUseCase;
    export type Return = Promise<Result<ThemeRevision[], UseCaseError>>;
    export type Error = UseCaseError;
}
