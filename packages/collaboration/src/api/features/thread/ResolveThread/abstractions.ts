import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";
import type { ICollabThreadView } from "~/api/features/thread/shared/abstractions.js";

export interface IResolveThreadUseCase {
    execute(id: string): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export interface IResolveThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IResolveThreadUseCaseErrors[keyof IResolveThreadUseCaseErrors];

export const ResolveThreadUseCase =
    createAbstraction<IResolveThreadUseCase>("ResolveThreadUseCase");

export namespace ResolveThreadUseCase {
    export type Interface = IResolveThreadUseCase;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}
