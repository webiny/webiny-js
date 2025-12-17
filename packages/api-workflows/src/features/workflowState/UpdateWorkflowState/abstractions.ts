import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflowState, IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";

export type IUpdateWorkflowStateInput = Partial<
    Omit<IWorkflowStateRecord, "id" | "savedBy" | "savedOn" | "createdOn" | "createdBy">
>;

export interface WorkflowStateAfterUpdatePayload {
    state: IWorkflowState;
    original: IWorkflowState;
}

/**
 * UpdateWorkflowState use case interface
 */
export interface IUpdateWorkflowStateUseCase {
    execute(
        id: string,
        input: IUpdateWorkflowStateInput
    ): Promise<Result<IWorkflowState, UseCaseError>>;
}

export interface IUpdateWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = IUpdateWorkflowStateUseCaseErrors[keyof IUpdateWorkflowStateUseCaseErrors];

export const UpdateWorkflowStateUseCase = createAbstraction<IUpdateWorkflowStateUseCase>(
    "UpdateWorkflowStateUseCase"
);

export namespace UpdateWorkflowStateUseCase {
    export type Interface = IUpdateWorkflowStateUseCase;
    export type Input = IUpdateWorkflowStateInput;
    export type Return = Promise<Result<IWorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * UpdateWorkflowState repository interface
 */
export interface IUpdateWorkflowStateRepository {
    execute(
        id: string,
        input: IUpdateWorkflowStateInput
    ): Promise<Result<IWorkflowStateRecord, RepositoryError>>;
}

export interface IUpdateWorkflowStateRepositoryErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type RepositoryError =
    IUpdateWorkflowStateRepositoryErrors[keyof IUpdateWorkflowStateRepositoryErrors];

export const UpdateWorkflowStateRepository = createAbstraction<IUpdateWorkflowStateRepository>(
    "UpdateWorkflowStateRepository"
);

export namespace UpdateWorkflowStateRepository {
    export type Interface = IUpdateWorkflowStateRepository;
    export type Input = IUpdateWorkflowStateInput;
    export type Return = Promise<Result<IWorkflowStateRecord, RepositoryError>>;
    export type Error = RepositoryError;
}
