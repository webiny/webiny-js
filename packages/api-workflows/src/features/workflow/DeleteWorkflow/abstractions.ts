import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import {
    type WorkflowNotFoundError,
    type WorkflowNotAuthorizedError,
    type WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

// Input types
export interface IDeleteWorkflowParams {
    app: string;
    id: string;
}

// Event payloads
export interface WorkflowBeforeDeletePayload {
    workflow: IWorkflow;
}

export interface WorkflowAfterDeletePayload {
    workflow: IWorkflow;
}

/**
 * DeleteWorkflow use case interface
 */
export interface IDeleteWorkflowUseCase {
    execute(input: IDeleteWorkflowParams): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    notAuthorized: WorkflowNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Params = IDeleteWorkflowParams;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * DeleteWorkflow repository interface
 */
export interface IDeleteWorkflowRepository {
    execute(input: IDeleteWorkflowParams): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteWorkflowRepositoryErrors {
    persistence: WorkflowPersistenceError;
}

type RepositoryError = IDeleteWorkflowRepositoryErrors[keyof IDeleteWorkflowRepositoryErrors];

export const DeleteWorkflowRepository = createAbstraction<IDeleteWorkflowRepository>(
    "DeleteWorkflowRepository"
);

export namespace DeleteWorkflowRepository {
    export type Interface = IDeleteWorkflowRepository;
    export type Params = IDeleteWorkflowParams;
    export type Return = Promise<Result<void, RepositoryError>>;
    export type Error = RepositoryError;
}
