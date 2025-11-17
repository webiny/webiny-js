import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    ModelNotAuthorizedError,
    type ModelNotFoundError,
    type ModelPersistenceError
} from "~/domain/contentModel/errors.js";

/**
 * InitializeModel Use Case
 */
export interface IInitializeModelUseCase {
    execute(modelId: string, data?: Record<string, any>): Promise<Result<void, UseCaseError>>;
}

export interface IInitializeModelUseCaseErrors {
    notFound: ModelNotFoundError;
    notAuthorized: ModelNotAuthorizedError;
    persistence: ModelPersistenceError;
}

type UseCaseError = IInitializeModelUseCaseErrors[keyof IInitializeModelUseCaseErrors];

export const InitializeModelUseCase = createAbstraction<IInitializeModelUseCase>(
    "InitializeModelUseCase"
);

export namespace InitializeModelUseCase {
    export type Interface = IInitializeModelUseCase;
    export type Error = UseCaseError;
}
