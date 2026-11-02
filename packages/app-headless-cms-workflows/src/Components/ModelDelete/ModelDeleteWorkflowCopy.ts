export interface ModelDeleteWorkflowCopyParams {
    modelName: string;
    workflowName: string;
    // Whether the viewer may open and delete workflows (Manage workflows).
    canManage: boolean;
}

export interface ModelDeleteWorkflowCopy {
    title: string;
    body: string;
    showLink: boolean;
}
