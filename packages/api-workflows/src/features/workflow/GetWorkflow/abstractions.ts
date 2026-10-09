import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface GetWorkflowInput {
    id: string;
}

export interface IGetWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetWorkflowUseCaseErrors[keyof IGetWorkflowUseCaseErrors];

export interface IGetWorkflowUseCase {
    execute(input: GetWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Get one workflow by id. No permission check in 1a (phase 1b). */
export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>("GetWorkflowUseCase");

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Input = GetWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
