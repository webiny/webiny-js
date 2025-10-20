import { describe, expect, it } from "vitest";
import { WorkflowsContext } from "~/context/WorkflowsContext.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { WorkflowsTransformer } from "~/context/transformer/WorkflowsTransformer.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";

describe("Workflows Context", () => {
    it("should not list any workflows because there are no any", async () => {
        const { context, workflowModel: model } = await createContextHandler();
        const workflowsContext = new WorkflowsContext({
            context,
            transformer: new WorkflowsTransformer(),
            model
        });
        const result = await workflowsContext.listWorkflows({
            where: {
                app: "test"
            }
        });
        expect(result).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                hasMoreItems: false,
                cursor: null
            }
        });
    });

    it("should create, update, list, get and delete a workflow", async () => {
        const { context, workflowModel: model } = await createContextHandler();
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
                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
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
                    teams: [{ id: FULL_ACCESS_TEAM_ID }],
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
        expect(list).toEqual({
            items: [updatedWorkflow],
            meta: {
                totalCount: 1,
                hasMoreItems: false,
                cursor: null
            }
        });

        const get = await workflowsContext.getWorkflow({
            app: "test",
            id: workflow.id
        });
        expect(get).toEqual(updatedWorkflow);

        const deleteResult = await workflowsContext.deleteWorkflow("test", workflow.id);
        expect(deleteResult).toEqual(true);

        const listAfterDelete = await workflowsContext.listWorkflows({});
        expect(listAfterDelete).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                hasMoreItems: false,
                cursor: null
            }
        });

        const getAfterDelete = await workflowsContext.getWorkflow(workflow);
        expect(getAfterDelete).toBeNull();
    });
});
