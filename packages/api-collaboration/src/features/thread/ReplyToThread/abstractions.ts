import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { ICollabMessage } from "~/domain/thread/abstractions.js";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";

export interface IReplyToThreadInput {
    threadId: string;
    body: string;
    mentions?: string[];
}

export interface IReplyToThreadUseCase {
    execute(input: IReplyToThreadInput): Promise<Result<ICollabMessage, UseCaseError>>;
}

export interface IReplyToThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    validation: CollabThreadValidationError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IReplyToThreadUseCaseErrors[keyof IReplyToThreadUseCaseErrors];

export const ReplyToThreadUseCase =
    createAbstraction<IReplyToThreadUseCase>("ReplyToThreadUseCase");

export namespace ReplyToThreadUseCase {
    export type Interface = IReplyToThreadUseCase;
    export type Input = IReplyToThreadInput;
    export type Return = Promise<Result<ICollabMessage, UseCaseError>>;
    export type Error = UseCaseError;
}
