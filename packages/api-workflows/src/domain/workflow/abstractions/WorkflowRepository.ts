import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow, WorkflowValues } from "../types.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "../errors.js";

export interface WorkflowRepositoryListWhere {
    /** Workflows bound to any of these namespace ids. */
    models_in?: string[];
}

export interface WorkflowRepositoryListParams {
    where?: WorkflowRepositoryListWhere;
    limit?: number;
    after?: string | null;
}

export interface WorkflowRepositoryListResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IWorkflowRepository {
    get(id: string): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    list(
        params: WorkflowRepositoryListParams
    ): Promise<Result<WorkflowRepositoryListResult, WorkflowPersistenceError>>;
    create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>>;
    update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    delete(id: string): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>>;
}

/** Reads and writes workflows (entries of the private `wbyWorkflow` model, always revision 1). */
export const WorkflowRepository = createAbstraction<IWorkflowRepository>("WorkflowRepository");

export namespace WorkflowRepository {
    export type Interface = IWorkflowRepository;
    export type ListParams = WorkflowRepositoryListParams;
    export type ListWhere = WorkflowRepositoryListWhere;
    export type ListResult = WorkflowRepositoryListResult;
}
