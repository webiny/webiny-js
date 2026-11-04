import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type { ReviewStepAssignmentConfig } from "@webiny/api-workflows/domain/workflow/types.js";
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

/** The test workflow with the given routing on its only step (team "team-1"). */
export const createWorkflowValuesWithAssignment = (
    assignment: ReviewStepAssignmentConfig
): WorkflowValues => {
    const values = createWorkflowValues();
    return {
        ...values,
        steps: values.steps.map(step => {
            return { ...step, config: { teams: ["team-1"], assignment } };
        })
    };
};

/** The default identity of `createCmsTestHandler`, as a workflow actor (R58). */
export const ADMIN_ACTOR: Actor = {
    type: "user",
    id: "id-12345678",
    displayName: "John Doe",
    identityType: "admin"
};

export const storeWorkflow = async (
    context: CmsContext,
    values: WorkflowValues = createWorkflowValues(),
    savedOn?: string
) => {
    return context.container
        .resolve(StoreWorkflowUseCase)
        .execute({ workflow: values, savedOn, actor: ADMIN_ACTOR });
};
