import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export type IUpdateWorkflowStateInput = Omit<
    IWorkflowStateRecord,
    "id" | "savedBy" | "savedOn" | "createdOn" | "createdBy"
>;

export interface WorkflowStateAfterUpdatePayload {
    state: WorkflowState;
    original: WorkflowState;
}

/**
 * UpdateWorkflowState use case interface
 */
export interface IUpdateWorkflowStateUseCase {
    execute(
        id: string,
        input: Partial<IUpdateWorkflowStateInput>
    ): Promise<Result<WorkflowState, UseCaseError>>;
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
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
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
