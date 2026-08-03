import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { Theme } from "~/domain/theme/abstractions.js";
import { ThemeNotAuthorizedError, ThemePersistenceError } from "~/domain/theme/errors.js";

export interface IListThemesParams {
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string | null;
    search?: string;
}

export interface IListThemesMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface IListThemesResult {
    themes: Theme[];
    meta: IListThemesMeta;
}

export interface IListThemesRepository {
    execute(params: IListThemesParams): Promise<Result<IListThemesResult, RepositoryError>>;
}

export interface IListThemesRepositoryErrors {
    persistence: ThemePersistenceError;
}

type RepositoryError = IListThemesRepositoryErrors[keyof IListThemesRepositoryErrors];

export const ListThemesRepository = createAbstraction<IListThemesRepository>(
    "Theme/ListThemesRepository"
);

export namespace ListThemesRepository {
    export type Interface = IListThemesRepository;
    export type Params = IListThemesParams;
    export type Return = Promise<Result<IListThemesResult, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IListThemesUseCase {
    execute(params?: IListThemesParams): Promise<Result<IListThemesResult, UseCaseError>>;
}

export interface IListThemesUseCaseErrors {
    notAuthorized: ThemeNotAuthorizedError;
    persistence: ThemePersistenceError;
}

type UseCaseError = IListThemesUseCaseErrors[keyof IListThemesUseCaseErrors];

/** List the tenant's themes — the latest revision of each. */
export const ListThemesUseCase = createAbstraction<IListThemesUseCase>("Theme/ListThemesUseCase");

export namespace ListThemesUseCase {
    export type Interface = IListThemesUseCase;
    export type Params = IListThemesParams;
    export type Return = Promise<Result<IListThemesResult, UseCaseError>>;
    export type Error = UseCaseError;
}
