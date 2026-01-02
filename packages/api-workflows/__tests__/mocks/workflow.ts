import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";

export const createMockWorkflow = (input: Partial<IWorkflow> = {}): IWorkflow => {
    return {
        id: "workflow-1",
        app: "test",
        name: "Test Workflow",
        steps: [
            {
                id: "step-1",
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                teams: [
                    {
                        id: FULL_ACCESS_TEAM_ID
                    }
                ],
                notifications: [
                    {
                        id: "notif-1"
                    }
                ]
            },
            {
                id: "step-2",
                title: "Step 2",
                description: "This is step 2",
                color: "green",
                teams: [
                    {
                        id: FULL_ACCESS_TEAM_ID
                    }
                ],
                notifications: [
                    {
                        id: "notif-2"
                    }
                ]
            }
        ],
        ...input
    };
};
