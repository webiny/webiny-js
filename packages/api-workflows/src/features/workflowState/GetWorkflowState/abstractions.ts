import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";

/**
 * GetWorkflowState use case interface
 */
export interface IGetWorkflowStateUseCase {
    execute(id: string): Promise<Result<IWorkflowState, UseCaseError>>;
}

export interface IGetWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = IGetWorkflowStateUseCaseErrors[keyof IGetWorkflowStateUseCaseErrors];

export const GetWorkflowStateUseCase =
    createAbstraction<IGetWorkflowStateUseCase>("GetWorkflowStateUseCase");

export namespace GetWorkflowStateUseCase {
    export type Interface = IGetWorkflowStateUseCase;
    export type Return = Promise<Result<IWorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * GetWorkflowState repository interface
 */
export interface IGetWorkflowStateRepository {
    execute(id: string): Promise<Result<IWorkflowStateRecord, RepositoryError>>;
}

export interface IGetWorkflowStateRepositoryErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type RepositoryError = IGetWorkflowStateRepositoryErrors[keyof IGetWorkflowStateRepositoryErrors];

export const GetWorkflowStateRepository = createAbstraction<IGetWorkflowStateRepository>(
    "GetWorkflowStateRepository"
);

export namespace GetWorkflowStateRepository {
    export type Interface = IGetWorkflowStateRepository;
    export type Return = Promise<Result<IWorkflowStateRecord, RepositoryError>>;
    export type Error = RepositoryError;
}
