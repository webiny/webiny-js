import { createAbstraction } from "@webiny/feature/api";

/**
 * Decides whether the current identity can read the content of an app a workflow is bound to
 * (e.g. `cms.<modelId>` or `wb.page`). Apps decorate this; the default denies, so workflows of
 * apps nobody claims stay visible only to identities that can manage workflows.
 */
export interface IWorkflowAppAccess {
    canRead(app: string): Promise<boolean>;
}

export const WorkflowAppAccess = createAbstraction<IWorkflowAppAccess>("WorkflowAppAccess");

export namespace WorkflowAppAccess {
    export type Interface = IWorkflowAppAccess;
}
