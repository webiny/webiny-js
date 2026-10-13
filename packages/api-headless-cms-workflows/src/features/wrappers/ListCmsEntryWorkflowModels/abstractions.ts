import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import type { ListCmsEntryWorkflowsUseCase } from "../ListCmsEntryWorkflows/index.js";

export interface ListCmsEntryWorkflowModelsInput {
    /** Case-insensitive, on the model name and the model id. */
    search?: string | null;
    /** Default 20, max 100. */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface CmsEntryWorkflowModelWorkflow {
    id: string;
    name: string;
}

export interface CmsEntryWorkflowModel {
    /** Namespace id, `cms.<modelId>`, as a workflow's `models` holds it. */
    model: string;
    modelId: string;
    name: string;
    /** The workflow bound to the model (one model per workflow, D15). */
    workflow: CmsEntryWorkflowModelWorkflow | null;
}

export interface CmsEntryWorkflowModelListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface ListCmsEntryWorkflowModelsResult {
    items: CmsEntryWorkflowModel[];
    meta: CmsEntryWorkflowModelListMeta;
}

export interface IListCmsEntryWorkflowModelsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
    workflows: ListCmsEntryWorkflowsUseCase.Error;
}

type UseCaseError =
    IListCmsEntryWorkflowModelsUseCaseErrors[keyof IListCmsEntryWorkflowModelsUseCaseErrors];

export interface IListCmsEntryWorkflowModelsUseCase {
    execute(
        input: ListCmsEntryWorkflowModelsInput
    ): Promise<Result<ListCmsEntryWorkflowModelsResult, UseCaseError>>;
}

/**
 * The models the workflow editor can bind, one page at a time (D116, R99): needs `editor`; only
 * readable, public, publishable models; each row names its bound workflow.
 */
export const ListCmsEntryWorkflowModelsUseCase =
    createAbstraction<IListCmsEntryWorkflowModelsUseCase>("ListCmsEntryWorkflowModelsUseCase");

export namespace ListCmsEntryWorkflowModelsUseCase {
    export type Interface = IListCmsEntryWorkflowModelsUseCase;
    export type Input = ListCmsEntryWorkflowModelsInput;
    export type Row = CmsEntryWorkflowModel;
    export type Value = ListCmsEntryWorkflowModelsResult;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListCmsEntryWorkflowModelsResult, UseCaseError>>;
}
