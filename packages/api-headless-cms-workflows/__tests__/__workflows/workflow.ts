import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { model } from "~tests/__cms/models.js";

export const createWorkflowValues = (
    models: string[] = [`cms.${model.modelId}`]
): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Test Workflow",
        models,
        steps: [
            {
                id: "step-1",
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                type: "review",
                notifications: [{ id: "e-mail" }],
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            }
        ]
    };
};

export const storeWorkflow = async (
    context: CmsContext,
    values: WorkflowValues = createWorkflowValues(),
    savedOn?: string
) => {
    return context.container.resolve(StoreWorkflowUseCase).execute({ workflow: values, savedOn });
};
