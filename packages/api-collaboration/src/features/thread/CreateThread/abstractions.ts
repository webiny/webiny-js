import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import {
    type CollabThreadType,
    type ICollabThread,
    type ICollabThreadValues
} from "~/domain/thread/abstractions.js";
import type {
    CollabAnchorNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadPersistenceError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";

export interface ICreateThreadInput {
    contentType: string;
    contentId: string;
    locator: string;
    type: CollabThreadType;
    // first message
    body: string;
    mentions?: string[];
    // task variant only
    assigneeId?: string | null;
    dueDate?: string | null;
}

/**
 * CreateThread use case interface.
 */
export interface ICreateThreadUseCase {
    execute(input: ICreateThreadInput): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export interface ICreateThreadUseCaseErrors {
    notAuthorized: CollabThreadNotAuthorizedError;
    anchorNotFound: CollabAnchorNotFoundError;
    validation: CollabThreadValidationError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = ICreateThreadUseCaseErrors[keyof ICreateThreadUseCaseErrors];

export const CreateThreadUseCase = createAbstraction<ICreateThreadUseCase>("CreateThreadUseCase");

export namespace CreateThreadUseCase {
    export type Interface = ICreateThreadUseCase;
    export type Input = ICreateThreadInput;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * CreateThread repository interface.
 */
export interface ICreateThreadRepositoryParams {
    id: string;
    values: ICollabThreadValues;
}

export interface ICreateThreadRepository {
    execute(params: ICreateThreadRepositoryParams): Promise<Result<ICollabThread, RepositoryError>>;
}

export interface ICreateThreadRepositoryErrors {
    persistence: CollabThreadPersistenceError;
}

type RepositoryError = ICreateThreadRepositoryErrors[keyof ICreateThreadRepositoryErrors];

export const CreateThreadRepository =
    createAbstraction<ICreateThreadRepository>("CreateThreadRepository");

export namespace CreateThreadRepository {
    export type Interface = ICreateThreadRepository;
    export type Params = ICreateThreadRepositoryParams;
    export type Return = Promise<Result<ICollabThread, RepositoryError>>;
    export type Error = RepositoryError;
}
