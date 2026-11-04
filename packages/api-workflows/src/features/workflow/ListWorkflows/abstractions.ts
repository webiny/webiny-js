import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface ListWorkflowsWhere {
    models_in?: string[];
}

export interface ListWorkflowsInput {
    where?: ListWorkflowsWhere;
    limit?: number;
    after?: string | null;
}

export interface ListWorkflowsResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IListWorkflowsUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowsUseCaseErrors[keyof IListWorkflowsUseCaseErrors];

export interface IListWorkflowsUseCase {
    execute(input?: ListWorkflowsInput): Promise<Result<ListWorkflowsResult, UseCaseError>>;
}

/** List workflows, optionally by bound model. Internal (D132): no permission check. */
export const ListWorkflowsUseCase =
    createAbstraction<IListWorkflowsUseCase>("ListWorkflowsUseCase");

export namespace ListWorkflowsUseCase {
    export type Interface = IListWorkflowsUseCase;
    export type Input = ListWorkflowsInput;
    export type Where = ListWorkflowsWhere;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListWorkflowsResult, UseCaseError>>;
}
