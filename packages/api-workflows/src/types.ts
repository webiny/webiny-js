import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export enum WorkflowsSecurityPermissionAccessLevel {
    NO = "no",
    YES = "yes"
}

export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: WorkflowsSecurityPermissionAccessLevel;
}

export interface IMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}
