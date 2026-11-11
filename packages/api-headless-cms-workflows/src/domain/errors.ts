import { BaseError } from "@webiny/feature/api";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface BoundWorkflow {
    id: string;
    name: string;
}

export interface ModelBoundToWorkflowErrorData {
    modelId: string;
    workflows: BoundWorkflow[];
}

/**
 * A model bound to a workflow cannot be deleted, neither through `DeleteModelUseCase` nor the
 * "fully delete model" task (D41, D64, D134); the workflow must be deleted or the model removed
 * from it first.
 */
export class ModelBoundToWorkflowError extends BaseError<ModelBoundToWorkflowErrorData> {
    override readonly code = "Workflows/Model/BoundToWorkflow" as const;

    constructor(data: ModelBoundToWorkflowErrorData) {
        const names = data.workflows.map(workflow => `"${workflow.name}"`).join(", ");
        const noun = data.workflows.length === 1 ? "workflow" : "workflows";
        super({
            message: `The model "${data.modelId}" is used by the ${noun} ${names}. Delete the ${noun} or remove the model from it first.`,
            data
        });
    }
}

declare module "@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.js" {
    interface IDeleteModelUseCaseErrors {
        /** Added by the CMS workflows package (R64). */
        boundToWorkflow: ModelBoundToWorkflowError;
        /** The bound-workflow lookup failed; the delete is blocked (R64). */
        workflowPersistence: WorkflowPersistenceError;
    }
}
