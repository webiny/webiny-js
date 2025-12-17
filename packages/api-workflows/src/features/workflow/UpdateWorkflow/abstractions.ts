import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IWorkflowStepInput } from "~/context/abstractions/WorkflowInput.js";
import {
    type WorkflowNotAuthorizedError,
    type WorkflowPersistenceError,
    type WorkflowValidationError
} from "~/domain/workflow/errors.js";

// Input types
export interface IUpdateWorkflowInput {
    app: string;
    id: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

// Event payloads
export interface WorkflowBeforeUpdatePayload {
    workflow: IWorkflow;
    original: IWorkflow;
    input: IUpdateWorkflowInput;
}

export interface WorkflowAfterUpdatePayload {
    workflow: IWorkflow;
    original: IWorkflow;
    input: IUpdateWorkflowInput;
}

/**
 * UpdateWorkflow use case interface
 */
export interface IUpdateWorkflowUseCase {
    execute(
        input: IUpdateWorkflowInput,
        original: IWorkflow
    ): Promise<Result<IWorkflow, UseCaseError>>;
}

export interface IUpdateWorkflowUseCaseErrors {
    notAuthorized: WorkflowNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    validation: WorkflowValidationError;
}

type UseCaseError = IUpdateWorkflowUseCaseErrors[keyof IUpdateWorkflowUseCaseErrors];

export const UpdateWorkflowUseCase =
    createAbstraction<IUpdateWorkflowUseCase>("UpdateWorkflowUseCase");

export namespace UpdateWorkflowUseCase {
    export type Interface = IUpdateWorkflowUseCase;
    export type Input = IUpdateWorkflowInput;
    export type Return = Promise<Result<IWorkflow, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * UpdateWorkflow repository interface
 */
export interface IUpdateWorkflowRepository {
    execute(input: IUpdateWorkflowInput): Promise<Result<IWorkflow, RepositoryError>>;
}

export interface IUpdateWorkflowRepositoryErrors {
    persistence: WorkflowPersistenceError;
}

type RepositoryError = IUpdateWorkflowRepositoryErrors[keyof IUpdateWorkflowRepositoryErrors];

export const UpdateWorkflowRepository = createAbstraction<IUpdateWorkflowRepository>(
    "UpdateWorkflowRepository"
);

export namespace UpdateWorkflowRepository {
    export type Interface = IUpdateWorkflowRepository;
    export type Return = Promise<Result<IWorkflow, RepositoryError>>;
    export type Error = RepositoryError;
}
