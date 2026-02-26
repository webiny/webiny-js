import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface ICmsEntryWorkflowState {
    state: string;
    workflowId: string;
    stepId: string;
    stepName: string;
}

export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}

export interface IMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

declare module "@webiny/api-headless-cms/types/types.js" {
    export interface IEntrySystem {
        workflow?: ICmsEntryWorkflowState | null;
    }
}
