import type { Context } from "@webiny/api";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import { model } from "~tests/__cms/models.js";

export const createWorkflow = async (context: Context) => {
    const id = `workflow-1`;

    const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);

    const workflow = await storeWorkflow.execute({
        app: `cms.${model.modelId}`,
        id,
        name: "Test Workflow",
        steps: [
            {
                id: "step-1",
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                teams: [{ id: FULL_ACCESS_TEAM_ID }],
                notifications: [{ id: "notif-1" }]
            }
        ]
    });

    return {
        id,
        workflow: workflow.value
    };
};
