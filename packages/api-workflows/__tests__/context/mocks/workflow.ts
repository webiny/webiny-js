import type { IWorkflow } from "~/context/abstractions/Workflow.js";

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
                        id: "team-1"
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
                        id: "team-2"
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
