import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import {
    type IWorkflowStateRecord,
    WorkflowStateRecordState
} from "~/domain/workflowState/abstractions.js";
import type { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IMeta } from "~/types.js";

export interface IListWorkflowStatesParamsWhere extends CmsEntryListWhere {
    app?: string;
    app_in?: string[];
    targetRevisionId?: string;
    targetRevisionId_in?: string[];
    state?: WorkflowStateRecordState;
    state_in?: WorkflowStateRecordState[];
    workflowId?: string;
    workflowId_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    savedBy?: string;
    createdBy?: string;
    isActive?: boolean;
}

export interface IListWorkflowStatesParams {
    where?: IListWorkflowStatesParamsWhere;
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string;
}

export interface IListWorkflowStatesResponse {
    items: WorkflowState[];
    meta: IMeta;
}

export interface IListWorkflowStatesRecordResponse {
    items: IWorkflowStateRecord[];
    meta: IMeta;
}

/**
 * ListWorkflowStates use case interface
 */
export interface IListWorkflowStatesUseCase {
    execute(
        params?: IListWorkflowStatesParams
    ): Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
}

export interface IListWorkflowStatesUseCaseErrors {
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = IListWorkflowStatesUseCaseErrors[keyof IListWorkflowStatesUseCaseErrors];

export const ListWorkflowStatesUseCase = createAbstraction<IListWorkflowStatesUseCase>(
    "ListWorkflowStatesUseCase"
);

export namespace ListWorkflowStatesUseCase {
    export type Interface = IListWorkflowStatesUseCase;
    export type Params = IListWorkflowStatesParams;
    export type Response = IListWorkflowStatesResponse;
    export type Return = Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * ListWorkflowStates repository interface
 */
export interface IListWorkflowStatesRepository {
    execute(
        params?: IListWorkflowStatesParams
    ): Promise<Result<IListWorkflowStatesRecordResponse, RepositoryError>>;
}

export interface IListWorkflowStatesRepositoryErrors {
    persistence: WorkflowStatePersistenceError;
}

type RepositoryError =
    IListWorkflowStatesRepositoryErrors[keyof IListWorkflowStatesRepositoryErrors];

export const ListWorkflowStatesRepository = createAbstraction<IListWorkflowStatesRepository>(
    "ListWorkflowStatesRepository"
);

export namespace ListWorkflowStatesRepository {
    export type Interface = IListWorkflowStatesRepository;
    export type Params = IListWorkflowStatesParams;
    export type Return = Promise<Result<IListWorkflowStatesRecordResponse, RepositoryError>>;
    export type Error = RepositoryError;
}
