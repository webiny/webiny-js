import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { PagePersistenceError, PageNotAuthorizedError } from "~/domain/page/errors.js";

/**
 * GetPageRevisions repository interface
 */
export interface IGetPageRevisionsRepository {
    execute(entryId: string): Promise<Result<WbPage[], RepositoryError>>;
}

export interface IGetPageRevisionsRepositoryErrors {
    persistence: PagePersistenceError;
}

type RepositoryError = IGetPageRevisionsRepositoryErrors[keyof IGetPageRevisionsRepositoryErrors];

export const GetPageRevisionsRepository = createAbstraction<IGetPageRevisionsRepository>(
    "Wb/GetPageRevisionsRepository"
);

export namespace GetPageRevisionsRepository {
    export type Interface = IGetPageRevisionsRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<WbPage[], RepositoryError>>;
}

/**
 * GetPageRevisions use case interface
 */
export interface IGetPageRevisionsUseCase {
    execute(entryId: string): Promise<Result<WbPage[], UseCaseError>>;
}

export interface IGetPageRevisionsUseCaseErrors {
    notAuthorized: PageNotAuthorizedError;
    persistence: PagePersistenceError;
}

type UseCaseError = IGetPageRevisionsUseCaseErrors[keyof IGetPageRevisionsUseCaseErrors];

/** Retrieve all revisions of a page. */
export const GetPageRevisionsUseCase = createAbstraction<IGetPageRevisionsUseCase>(
    "Wb/GetPageRevisionsUseCase"
);

export namespace GetPageRevisionsUseCase {
    export type Interface = IGetPageRevisionsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WbPage[], UseCaseError>>;
    export type Page = WbPage;
}
