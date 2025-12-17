import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError,
    type MultipleWorkflowsFoundError,
    WorkflowStateValidationError
} from "~/domain/workflowState/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface IGetTargetWorkflowStateParams {
    app: string;
    targetRevisionId: string;
}

/**
 * GetTargetWorkflowState use case interface
 */
export interface IGetTargetWorkflowStateUseCase {
    execute(input: IGetTargetWorkflowStateParams): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface IGetTargetWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
    multipleFound: MultipleWorkflowsFoundError;
    validation: WorkflowStateValidationError;
}

type UseCaseError =
    IGetTargetWorkflowStateUseCaseErrors[keyof IGetTargetWorkflowStateUseCaseErrors];

export const GetTargetWorkflowStateUseCase = createAbstraction<IGetTargetWorkflowStateUseCase>(
    "GetTargetWorkflowStateUseCase"
);

export namespace GetTargetWorkflowStateUseCase {
    export type Interface = IGetTargetWorkflowStateUseCase;
    export type Params = IGetTargetWorkflowStateParams;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * GetTargetWorkflowState repository interface
 */
export interface IGetTargetWorkflowStateRepository {
    execute(
        input: IGetTargetWorkflowStateParams
    ): Promise<Result<IWorkflowStateRecord, RepositoryError>>;
}

export interface IGetTargetWorkflowStateRepositoryErrors {
    notFound: WorkflowStateNotFoundError;
    persistence: WorkflowStatePersistenceError;
    multipleFound: MultipleWorkflowsFoundError;
}

type RepositoryError =
    IGetTargetWorkflowStateRepositoryErrors[keyof IGetTargetWorkflowStateRepositoryErrors];

export const GetTargetWorkflowStateRepository =
    createAbstraction<IGetTargetWorkflowStateRepository>("GetTargetWorkflowStateRepository");

export namespace GetTargetWorkflowStateRepository {
    export type Interface = IGetTargetWorkflowStateRepository;
    export type Params = IGetTargetWorkflowStateParams;
    export type Return = Promise<Result<IWorkflowStateRecord, RepositoryError>>;
    export type Error = RepositoryError;
}
