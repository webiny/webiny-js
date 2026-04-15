import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { PagePersistenceError } from "~/domain/page/errors.js";

export type PageLanguagePaths = Record<string, string>;

export interface IGetPageLanguagePathsRepository {
    execute(rootEntryId: string): Promise<Result<PageLanguagePaths, PagePersistenceError>>;
}

export const GetPageLanguagePathsRepository = createAbstraction<IGetPageLanguagePathsRepository>(
    "Wb/GetPageLanguagePathsRepository"
);

export namespace GetPageLanguagePathsRepository {
    export type Interface = IGetPageLanguagePathsRepository;
    export type Return = Promise<Result<PageLanguagePaths, PagePersistenceError>>;
}

export interface IGetPageLanguagePathsUseCase {
    execute(rootEntryId: string): Promise<Result<PageLanguagePaths, PagePersistenceError>>;
}

/** Retrieve all published language paths of a page as { languageCode: path }. */
export const GetPageLanguagePathsUseCase = createAbstraction<IGetPageLanguagePathsUseCase>(
    "Wb/GetPageLanguagePathsUseCase"
);

export namespace GetPageLanguagePathsUseCase {
    export type Interface = IGetPageLanguagePathsUseCase;
    export type Return = Promise<Result<PageLanguagePaths, PagePersistenceError>>;
}
