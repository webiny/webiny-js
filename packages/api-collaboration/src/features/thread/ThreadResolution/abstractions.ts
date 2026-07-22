import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/domain/thread/errors.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";

export interface IThreadResolutionErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IThreadResolutionErrors[keyof IThreadResolutionErrors];

/**
 * Resolve a thread — open to anyone with access. Records `resolvedBy`/`resolvedOn`.
 */
export interface IResolveThreadUseCase {
    execute(id: string): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export const ResolveThreadUseCase =
    createAbstraction<IResolveThreadUseCase>("ResolveThreadUseCase");

export namespace ResolveThreadUseCase {
    export type Interface = IResolveThreadUseCase;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * Reopen a resolved thread — open to anyone with access. Clears the resolution.
 */
export interface IReopenThreadUseCase {
    execute(id: string): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export const ReopenThreadUseCase = createAbstraction<IReopenThreadUseCase>("ReopenThreadUseCase");

export namespace ReopenThreadUseCase {
    export type Interface = IReopenThreadUseCase;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}
