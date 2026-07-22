import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabThread } from "~/domain/thread/abstractions.js";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/domain/thread/errors.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";

/**
 * GetThread repository — pure load by id.
 */
export interface IGetThreadRepository {
    execute(id: string): Promise<Result<ICollabThread, RepositoryError>>;
}

export interface IGetThreadRepositoryErrors {
    notFound: CollabThreadNotFoundError;
    persistence: CollabThreadPersistenceError;
}

type RepositoryError = IGetThreadRepositoryErrors[keyof IGetThreadRepositoryErrors];

export const GetThreadRepository = createAbstraction<IGetThreadRepository>("GetThreadRepository");

export namespace GetThreadRepository {
    export type Interface = IGetThreadRepository;
    export type Return = Promise<Result<ICollabThread, RepositoryError>>;
    export type Error = RepositoryError;
}

/**
 * GetThread use case — loads a thread and ensures the caller may read the target content.
 */
export interface IGetThreadUseCase {
    execute(id: string): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export interface IGetThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    persistence: CollabThreadPersistenceError;
    notAuthorized: CollabThreadNotAuthorizedError;
}

type UseCaseError = IGetThreadUseCaseErrors[keyof IGetThreadUseCaseErrors];

export const GetThreadUseCase = createAbstraction<IGetThreadUseCase>("GetThreadUseCase");

export namespace GetThreadUseCase {
    export type Interface = IGetThreadUseCase;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}
