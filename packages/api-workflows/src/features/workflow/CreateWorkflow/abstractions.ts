import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import {
    type WorkflowNotAuthorizedError,
    type WorkflowPersistenceError,
    type WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type { IWorkflowStepInput } from "~/features/shared/abstractions.js";

// Input types
export interface ICreateWorkflowInput {
    app: string;
    id: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

// Event payloads
export interface WorkflowBeforeCreatePayload {
    workflow: IWorkflow;
    input: ICreateWorkflowInput;
}

export interface WorkflowAfterCreatePayload {
    workflow: IWorkflow;
    input: ICreateWorkflowInput;
}

/**
 * CreateWorkflow use case interface
 */
export interface ICreateWorkflowUseCase {
    execute(input: ICreateWorkflowInput): Promise<Result<IWorkflow, UseCaseError>>;
}

export interface ICreateWorkflowUseCaseErrors {
    notAuthorized: WorkflowNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    validation: WorkflowValidationError;
}

type UseCaseError = ICreateWorkflowUseCaseErrors[keyof ICreateWorkflowUseCaseErrors];

export const CreateWorkflowUseCase =
    createAbstraction<ICreateWorkflowUseCase>("CreateWorkflowUseCase");

export namespace CreateWorkflowUseCase {
    export type Interface = ICreateWorkflowUseCase;
    export type Input = ICreateWorkflowInput;
    export type Return = Promise<Result<IWorkflow, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * CreateWorkflow repository interface
 */
export interface ICreateWorkflowRepository {
    execute(input: ICreateWorkflowInput): Promise<Result<IWorkflow, RepositoryError>>;
}

export interface ICreateWorkflowRepositoryErrors {
    persistence: WorkflowPersistenceError;
}

type RepositoryError = ICreateWorkflowRepositoryErrors[keyof ICreateWorkflowRepositoryErrors];

export const CreateWorkflowRepository = createAbstraction<ICreateWorkflowRepository>(
    "CreateWorkflowRepository"
);

export namespace CreateWorkflowRepository {
    export type Interface = ICreateWorkflowRepository;
    export type Input = ICreateWorkflowInput;
    export type Return = Promise<Result<IWorkflow, RepositoryError>>;
    export type Error = RepositoryError;
}
