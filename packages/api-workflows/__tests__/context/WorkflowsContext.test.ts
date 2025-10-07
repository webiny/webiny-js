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

    it("should create, update, list, get and delete a workflow", async () => {
        const { context, model } = await createContextHandler();
        const workflowsContext = new WorkflowsContext({
            context,
            transformer: new WorkflowsTransformer(),
            model
        });
        const id = `workflow-1`;

        const workflow = await workflowsContext.storeWorkflow("test", id, {
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
            id,
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

        const updatedWorkflow = await workflowsContext.storeWorkflow("test", workflow.id, {
            name: `${workflow.name} Updated`,
            steps: workflow.steps
        });
        expect(updatedWorkflow).toEqual({
            ...expected,
            name: `${workflow.name} Updated`
        });

        const list = await workflowsContext.listWorkflows({});
        expect(list).toEqual([updatedWorkflow]);

        const get = await workflowsContext.getWorkflow({
            app: "test",
            id: workflow.id
        });
        expect(get).toEqual(updatedWorkflow);

        const deleteResult = await workflowsContext.deleteWorkflow("test", workflow.id);
        expect(deleteResult).toEqual(true);

        const listAfterDelete = await workflowsContext.listWorkflows({});
        expect(listAfterDelete).toEqual([]);

        const getAfterDelete = await workflowsContext.getWorkflow(workflow);
        expect(getAfterDelete).toBeNull();
    });
});
