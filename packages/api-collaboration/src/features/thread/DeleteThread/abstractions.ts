import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/domain/thread/errors.js";

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
