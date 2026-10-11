import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";

export interface IWorkflowsPermissions {
    /** `*` or `workflows.*` (D54). */
    isFullAccess(): Promise<boolean>;
    /** `editor`, or full access: configure workflows and tenant settings (spec 8). */
    canEdit(): Promise<boolean>;
    /** `reassign`, or full access: reassign, restart, cancel reviews of others (spec 8, D34). */
    canReassign(): Promise<boolean>;
    /** All three answers at once, for viewer flags (spec 5.3). */
    getPermissionSet(): Promise<WorkflowsPermissionSet>;
}

/**
 * The one shared checker of the `workflows` permission (spec 8, D54). A building block for the
 * app wrappers (D132): the api-workflows use cases never call it, they are an internal engine.
 */
export const WorkflowsPermissions =
    createAbstraction<IWorkflowsPermissions>("WorkflowsPermissions");

export namespace WorkflowsPermissions {
    export type Interface = IWorkflowsPermissions;
}
