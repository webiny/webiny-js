import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";

export interface IListWorkflowsWhere {
    app?: string;
    app_in?: string[];
    id?: string;
    id_in?: string[];
}

export interface IListWorkflowsParams {
    sort?: CmsEntryListSort;
    limit?: number;
    after?: string;
    where?: IListWorkflowsWhere;
}

export interface IListWorkflowsMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface IListWorkflowsResult {
    items: IWorkflow[];
    meta: IListWorkflowsMeta;
}

/**
 * ListWorkflows use case interface
 */
export interface IListWorkflowsUseCase {
    execute(input: IListWorkflowsParams): Promise<Result<IListWorkflowsResult, UseCaseError>>;
}

export interface IListWorkflowsUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowsUseCaseErrors[keyof IListWorkflowsUseCaseErrors];

export const ListWorkflowsUseCase =
    createAbstraction<IListWorkflowsUseCase>("ListWorkflowsUseCase");

export namespace ListWorkflowsUseCase {
    export type Interface = IListWorkflowsUseCase;
    export type Params = IListWorkflowsParams;
    export type Return = Promise<Result<IListWorkflowsResult, UseCaseError>>;
    export type Error = UseCaseError;
}

/**
 * ListWorkflows repository interface
 */
export interface IListWorkflowsRepository {
    execute(input: IListWorkflowsParams): Promise<Result<IListWorkflowsResult, RepositoryError>>;
}

export interface IListWorkflowsRepositoryErrors {
    persistence: WorkflowPersistenceError;
}

type RepositoryError = IListWorkflowsRepositoryErrors[keyof IListWorkflowsRepositoryErrors];

export const ListWorkflowsRepository =
    createAbstraction<IListWorkflowsRepository>("ListWorkflowsRepository");

export namespace ListWorkflowsRepository {
    export type Interface = IListWorkflowsRepository;
    export type Params = IListWorkflowsParams;
    export type Return = Promise<Result<IListWorkflowsResult, RepositoryError>>;
    export type Error = RepositoryError;
}
