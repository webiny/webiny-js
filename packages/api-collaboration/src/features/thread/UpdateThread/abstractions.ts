import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabThread } from "~/domain/thread/abstractions.js";
import type {
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/domain/thread/errors.js";

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
