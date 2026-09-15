import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabThread } from "~/api/domain/thread/abstractions.js";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";
import type { ICollabThreadView } from "~/api/features/thread/shared/abstractions.js";

/**
 * Input for updating thread metadata (assignee, due date, etc.).
 */
export interface IUpdateThreadInput {
    id: string;
    assigneeId?: string | null;
    dueDate?: string | null;
}

/**
 * UpdateThread use case — updates thread metadata fields. Called from GraphQL when a user
 * wants to change assignee, due date, etc.
 */
export interface IUpdateThreadUseCase {
    execute(input: IUpdateThreadInput): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export interface IUpdateThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IUpdateThreadUseCaseErrors[keyof IUpdateThreadUseCaseErrors];

export const UpdateThreadUseCase = createAbstraction<IUpdateThreadUseCase>("UpdateThreadUseCase");

export namespace UpdateThreadUseCase {
    export type Interface = IUpdateThreadUseCase;
    export type Input = IUpdateThreadInput;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * Shared repository that persists the full thread entry (read-modify-write). Used by every
 * thread mutation (reply, resolve, reopen, edit/delete message, delete thread).
 */
export interface IUpdateThreadRepository {
    execute(thread: ICollabThread): Promise<Result<ICollabThread, RepositoryError>>;
}

export interface IUpdateThreadRepositoryErrors {
    notFound: CollabThreadNotFoundError;
    persistence: CollabThreadPersistenceError;
}

type RepositoryError = IUpdateThreadRepositoryErrors[keyof IUpdateThreadRepositoryErrors];

export const UpdateThreadRepository =
    createAbstraction<IUpdateThreadRepository>("UpdateThreadRepository");

export namespace UpdateThreadRepository {
    export type Interface = IUpdateThreadRepository;
    export type Return = Promise<Result<ICollabThread, RepositoryError>>;
    export type Error = RepositoryError;
}
