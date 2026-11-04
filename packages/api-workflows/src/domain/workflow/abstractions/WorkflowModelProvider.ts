import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowModelProvider {
    get(): Promise<CmsModel>;
}

/**
 * Provides the tenant's `wbyWorkflow` model. A provider rather than the model itself: fetching a
 * model is asynchronous and tenant-dependent, while DI resolution is synchronous.
 */
export const WorkflowModelProvider =
    createAbstraction<IWorkflowModelProvider>("WorkflowModelProvider");

export namespace WorkflowModelProvider {
    export type Interface = IWorkflowModelProvider;
}
