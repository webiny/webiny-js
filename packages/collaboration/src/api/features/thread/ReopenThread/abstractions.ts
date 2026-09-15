import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    CollabThreadNotAuthorizedError,
    CollabThreadNotFoundError,
    CollabThreadPersistenceError
} from "~/api/domain/thread/errors.js";
import type { ICollabThreadView } from "~/api/features/thread/shared/abstractions.js";

export interface IReopenThreadUseCase {
    execute(id: string): Promise<Result<ICollabThreadView, UseCaseError>>;
}

export interface IReopenThreadUseCaseErrors {
    notFound: CollabThreadNotFoundError;
    notAuthorized: CollabThreadNotAuthorizedError;
    persistence: CollabThreadPersistenceError;
}

type UseCaseError = IReopenThreadUseCaseErrors[keyof IReopenThreadUseCaseErrors];

export const ReopenThreadUseCase = createAbstraction<IReopenThreadUseCase>("ReopenThreadUseCase");

export namespace ReopenThreadUseCase {
    export type Interface = IReopenThreadUseCase;
    export type Return = Promise<Result<ICollabThreadView, UseCaseError>>;
    export type Error = UseCaseError;
}
