import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}

export interface IMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}
