import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError,
    type WorkflowStateValidationError,
    type ActiveStateExistsError,
    MultipleWorkflowsFoundError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface ICreateWorkflowStateUseCaseInput {
    app: string;
    targetRevisionId: string;
    title: string;
}

export interface WorkflowStateAfterCreatePayload {
    state: WorkflowState;
}

/**
 * CreateWorkflowState use case interface
 */
export interface ICreateWorkflowStateUseCase {
    execute(input: ICreateWorkflowStateUseCaseInput): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface ICreateWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    multipleWorkflows: MultipleWorkflowsFoundError;
    activeExists: ActiveStateExistsError;
    validation: WorkflowStateValidationError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = ICreateWorkflowStateUseCaseErrors[keyof ICreateWorkflowStateUseCaseErrors];

export const CreateWorkflowStateUseCase = createAbstraction<ICreateWorkflowStateUseCase>(
    "CreateWorkflowStateUseCase"
);

export namespace CreateWorkflowStateUseCase {
    export type Interface = ICreateWorkflowStateUseCase;
    export type Input = ICreateWorkflowStateUseCaseInput;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * CreateWorkflowState repository interface
 */

export type ICreateWorkflowStateRepositoryInput = Omit<
    IWorkflowStateRecord,
    "id" | "savedBy" | "createdOn" | "savedOn" | "createdBy"
>;

export interface ICreateWorkflowStateRepository {
    execute(
        input: ICreateWorkflowStateRepositoryInput
    ): Promise<Result<IWorkflowStateRecord, RepositoryError>>;
}

export interface ICreateWorkflowStateRepositoryErrors {
    persistence: WorkflowStatePersistenceError;
}

type RepositoryError =
    ICreateWorkflowStateRepositoryErrors[keyof ICreateWorkflowStateRepositoryErrors];

export const CreateWorkflowStateRepository = createAbstraction<ICreateWorkflowStateRepository>(
    "CreateWorkflowStateRepository"
);

export namespace CreateWorkflowStateRepository {
    export type Interface = ICreateWorkflowStateRepository;
    export type Input = ICreateWorkflowStateRepositoryInput;
    export type Return = Promise<Result<IWorkflowStateRecord, RepositoryError>>;
    export type Error = RepositoryError;
}
