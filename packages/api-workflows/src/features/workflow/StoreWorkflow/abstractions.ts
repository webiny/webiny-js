import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import {
    type WorkflowNotFoundError,
    type WorkflowNotAuthorizedError,
    type WorkflowPersistenceError,
    type WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type { IWorkflowStepInput } from "~/features/shared/abstractions.js";

// Input types (from context/abstractions/WorkflowsContext.ts)
export interface IStoreWorkflowInput {
    app: string;
    id: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}

/**
 * StoreWorkflow use case interface - delegates to CreateWorkflow or UpdateWorkflow
 */
export interface IStoreWorkflowUseCase {
    execute(input: IStoreWorkflowInput): Promise<Result<IWorkflow, UseCaseError>>;
}

export interface IStoreWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    notAuthorized: WorkflowNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    validation: WorkflowValidationError;
}

type UseCaseError = IStoreWorkflowUseCaseErrors[keyof IStoreWorkflowUseCaseErrors];

export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Input = IStoreWorkflowInput;
    export type Return = Promise<Result<IWorkflow, UseCaseError>>;
    export type Error = UseCaseError;
}
