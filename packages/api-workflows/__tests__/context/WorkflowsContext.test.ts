import { describe, expect, it } from "vitest";
import { WorkflowsContext } from "~/context/WorkflowsContext.js";
import { WorkflowsTransformer } from "~/context/transformer/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/types.js";

describe("Workflows Context", () => {
    it("should not list any workflows because there are no any", async () => {
        const { context, model } = await createContextHandler();
        const workflowsContext = new WorkflowsContext({
            context,
            transformer: new WorkflowsTransformer(),
            model
        });
        const result = await workflowsContext.listWorkflows({
            app: "test"
        });
        expect(result).toEqual([]);
    });

    it("should create a workflow", async () => {
        const { context, model } = await createContextHandler();
        const workflowsContext = new WorkflowsContext({
            context,
            transformer: new WorkflowsTransformer(),
            model
        });

        const workflow = await workflowsContext.createWorkflow("test", {
            id: "workflow-1",
            name: "Test Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    description: "This is step 1",
                    color: "blue",
                    teams: [{ id: "team-1" }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        });

        const expected: IWorkflow = {
            id: "workflow-1",
            app: "test",
            name: "Test Workflow",
            steps: [
                {
                    id: "step-1",
                    title: "Step 1",
                    description: "This is step 1",
                    color: "blue",
                    teams: [{ id: "team-1" }],
                    notifications: [{ id: "notif-1" }]
                }
            ]
        };
        expect(workflow).toEqual(expected);
    });
});
