export interface ModelDeleteWorkflowCopyParams {
    modelName: string;
    workflowName: string;
    // Whether the viewer may open and delete workflows (Manage workflows).
    canManage: boolean;
}

export interface ModelDeleteWorkflowCopy {
    // The heading line; null when the whole message is one sentence (no heading, no icon).
    title: string | null;
    body: string;
    showLink: boolean;
}
