import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import  { type WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface IGetWorkflowParams {
    app: string;
    id: string;
}

/**
 * GetWorkflow use case interface
 */
export interface IGetWorkflowUseCase {
    execute(input: IGetWorkflowParams): Promise<Result<IWorkflow, UseCaseError>>;
}

export interface IGetWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetWorkflowUseCaseErrors[keyof IGetWorkflowUseCaseErrors];

export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>("GetWorkflowUseCase");

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Params = IGetWorkflowParams;
    export type Return = Promise<Result<IWorkflow, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * GetWorkflow repository interface
 */
export interface IGetWorkflowRepository {
    execute(input: IGetWorkflowParams): Promise<Result<IWorkflow, RepositoryError>>;
}

export interface IGetWorkflowRepositoryErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type RepositoryError = IGetWorkflowRepositoryErrors[keyof IGetWorkflowRepositoryErrors];

export const GetWorkflowRepository =
    createAbstraction<IGetWorkflowRepository>("GetWorkflowRepository");

export namespace GetWorkflowRepository {
    export type Interface = IGetWorkflowRepository;
    export type Params = IGetWorkflowParams;
    export type Return = Promise<Result<IWorkflow, RepositoryError>>;
    export type Error = RepositoryError;
}
