import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import type { Context } from "~/types.js";

export const createWorkflow = async (context: Pick<Context, "workflows">) => {
    const id = `workflow-1`;

    const workflow = await context.workflows.storeWorkflow("test", id, {
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
        workflow
    };
};
