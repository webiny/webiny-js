import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabMessage } from "~/domain/thread/abstractions.js";
import type {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";

export interface IMessageOperationErrors {
    threadNotFound: CollabThreadNotFoundError;
    messageNotFound: CollabMessageNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    validation: CollabThreadValidationError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IMessageOperationErrors[keyof IMessageOperationErrors];

/**
 * Edit a message body — author or admin only.
 */
export interface IUpdateMessageInput {
    threadId: string;
    messageId: string;
    body: string;
}

export interface IUpdateMessageUseCase {
    execute(input: IUpdateMessageInput): Promise<Result<ICollabMessage, UseCaseError>>;
}

export const UpdateMessageUseCase =
    createAbstraction<IUpdateMessageUseCase>("UpdateMessageUseCase");

export namespace UpdateMessageUseCase {
    export type Interface = IUpdateMessageUseCase;
    export type Input = IUpdateMessageInput;
    export type Return = Promise<Result<ICollabMessage, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * Soft-delete a message — author or admin only.
 */
export interface IDeleteMessageInput {
    threadId: string;
    messageId: string;
}

export interface IDeleteMessageUseCase {
    execute(input: IDeleteMessageInput): Promise<Result<boolean, UseCaseError>>;
}

export const DeleteMessageUseCase =
    createAbstraction<IDeleteMessageUseCase>("DeleteMessageUseCase");

export namespace DeleteMessageUseCase {
    export type Interface = IDeleteMessageUseCase;
    export type Input = IDeleteMessageInput;
    export type Return = Promise<Result<boolean, UseCaseError>>;
    export type Error = UseCaseError;
}
