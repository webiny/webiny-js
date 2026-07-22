import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { CollabThreadType, ICollabThread } from "~/domain/thread/abstractions.js";
import type { CollabThreadPersistenceError } from "~/domain/thread/errors.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";
import type { IMeta } from "~/types.js";

export interface IListThreadsWhere {
    contentType: string;
    contentId: string;
    type?: CollabThreadType;
    resolved?: boolean;
}

export interface IListThreadsParams {
    where: IListThreadsWhere;
    limit?: number;
    after?: string | null;
    sort?: string[];
}

/**
 * ListThreads repository — lists raw threads for a content target.
 */
export interface IListThreadsRepository {
    execute(params: IListThreadsParams): Promise<Result<IListThreadsResult, RepositoryError>>;
}

export interface IListThreadsResult {
    items: ICollabThread[];
    meta: IMeta;
}

export interface IListThreadsRepositoryErrors {
    persistence: CollabThreadPersistenceError;
}

type RepositoryError = IListThreadsRepositoryErrors[keyof IListThreadsRepositoryErrors];

export const ListThreadsRepository =
    createAbstraction<IListThreadsRepository>("ListThreadsRepository");

export namespace ListThreadsRepository {
    export type Interface = IListThreadsRepository;
    export type Params = IListThreadsParams;
    export type Return = Promise<Result<IListThreadsResult, RepositoryError>>;
    export type Error = RepositoryError;
}

/**
 * ListThreads use case — returns each thread paired with its resolved anchor.
 */
export interface IListThreadsViewResult {
    items: ICollabThreadView[];
    meta: IMeta;
}

export interface IListThreadsUseCase {
    execute(params: IListThreadsParams): Promise<Result<IListThreadsViewResult, RepositoryError>>;
}

export const ListThreadsUseCase = createAbstraction<IListThreadsUseCase>("ListThreadsUseCase");

export namespace ListThreadsUseCase {
    export type Interface = IListThreadsUseCase;
    export type Params = IListThreadsParams;
    export type Return = Promise<Result<IListThreadsViewResult, RepositoryError>>;
    export type Error = RepositoryError;
}
