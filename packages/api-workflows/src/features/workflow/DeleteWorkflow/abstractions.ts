import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Delete a workflow. No permission check in 1a (phase 1b). */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
