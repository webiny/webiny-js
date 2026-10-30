import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowSettingsModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowSettings` model on demand. */
export const WorkflowSettingsModelProvider = createAbstraction<IWorkflowSettingsModelProvider>(
    "WorkflowSettingsModelProvider"
);

export namespace WorkflowSettingsModelProvider {
    export type Interface = IWorkflowSettingsModelProvider;
}
