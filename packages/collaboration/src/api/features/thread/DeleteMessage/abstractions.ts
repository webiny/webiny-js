import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabMessageNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";

export interface IDeleteMessageUseCaseErrors {
    threadNotFound: CollabThreadNotFoundError;
    messageNotFound: CollabMessageNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IDeleteMessageUseCaseErrors[keyof IDeleteMessageUseCaseErrors];

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
