import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";

export interface IDeleteWorkflowStateUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = IDeleteWorkflowStateUseCaseErrors[keyof IDeleteWorkflowStateUseCaseErrors];

export const DeleteWorkflowStateUseCase = createAbstraction<IDeleteWorkflowStateUseCase>(
    "DeleteWorkflowStateUseCase"
);

export namespace DeleteWorkflowStateUseCase {
    export type Interface = IDeleteWorkflowStateUseCase;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

export interface IDeleteWorkflowStateRepository {
    execute(id: string): Promise<Result<void, never>>;
}

export const DeleteWorkflowStateRepository = createAbstraction<IDeleteWorkflowStateRepository>(
    "DeleteWorkflowStateRepository"
);

export namespace DeleteWorkflowStateRepository {
    export type Interface = IDeleteWorkflowStateRepository;
    export type Return = Promise<Result<void, never>>;
}
