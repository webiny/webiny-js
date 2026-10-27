export interface ModelBoundWorkflow {
    id: string;
    name: string;
}

// `data` of the server's `Workflows/Model/BoundToWorkflow` refusal (api-headless-cms-workflows).
export interface ModelBoundToWorkflowErrorData {
    modelId: string;
    workflows: ModelBoundWorkflow[];
}
