import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";

export interface IDeleteThreadUseCase {
    execute(id: string): Promise<Result<boolean, UseCaseError>>;
}

export interface IDeleteThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IDeleteThreadUseCaseErrors[keyof IDeleteThreadUseCaseErrors];

export const DeleteThreadUseCase = createAbstraction<IDeleteThreadUseCase>("DeleteThreadUseCase");

export namespace DeleteThreadUseCase {
    export type Interface = IDeleteThreadUseCase;
    export type Return = Promise<Result<boolean, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * DeleteThread repository interface.
 */
export interface IDeleteThreadRepository {
    execute(id: string): Promise<Result<boolean, RepositoryError>>;
}

export interface IDeleteThreadRepositoryErrors {
    notFound: CollabThreadNotFoundError;
    persistence: CollabThreadPersistenceError;
}

type RepositoryError = IDeleteThreadRepositoryErrors[keyof IDeleteThreadRepositoryErrors];

export const DeleteThreadRepository =
    createAbstraction<IDeleteThreadRepository>("DeleteThreadRepository");

export namespace DeleteThreadRepository {
    export type Interface = IDeleteThreadRepository;
    export type Return = Promise<Result<boolean, RepositoryError>>;
    export type Error = RepositoryError;
}
