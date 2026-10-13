import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabMessage } from "~/api/domain/thread/abstractions.js";
import type {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError,
    CollabThreadValidationError
} from "~/api/domain/thread/errors.js";

export interface IUpdateMessageUseCaseErrors {
    threadNotFound: CollabThreadNotFoundError;
    messageNotFound: CollabMessageNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    validation: CollabThreadValidationError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IUpdateMessageUseCaseErrors[keyof IUpdateMessageUseCaseErrors];

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
