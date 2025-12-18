import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/domain/workflow/abstractions.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

describe("Workflows Use Cases", () => {
    it("should not list any workflows because there are no any", async () => {
        const { context } = await createContextHandler();

        const listWorkflows = context.container.resolve(ListWorkflowsUseCase);
        const result = await listWorkflows.execute({
            where: {
                app: "test"
            }
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                hasMoreItems: false,
                cursor: null
            }
        });
    });

    it("should create, update, list, get and delete a workflow", async () => {
        const { context } = await createContextHandler();
        const id = `workflow-1`;

        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        const workflowResult = await storeWorkflow.execute({
            app: "test",
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

        expect(workflowResult.isOk()).toBe(true);
        const workflow = workflowResult.value!;

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

        const updatedWorkflowResult = await storeWorkflow.execute({
            app: "test",
            id: workflow.id,
            name: `${workflow.name} Updated`,
            steps: workflow.steps
        });
        expect(updatedWorkflowResult.isOk()).toBe(true);
        const updatedWorkflow = updatedWorkflowResult.value!;
        expect(updatedWorkflow).toEqual({
            ...expected,
            name: `${workflow.name} Updated`
        });

        const listWorkflows = context.container.resolve(ListWorkflowsUseCase);
        const listResult = await listWorkflows.execute({});
        expect(listResult.isOk()).toBe(true);
        expect(listResult.value).toEqual({
            items: [updatedWorkflow],
            meta: {
                totalCount: 1,
                hasMoreItems: false,
                cursor: null
            }
        });

        const getWorkflow = context.container.resolve(GetWorkflowUseCase);
        const getResult = await getWorkflow.execute({
            app: "test",
            id: workflow.id
        });
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value).toEqual(updatedWorkflow);

        const deleteWorkflow = context.container.resolve(DeleteWorkflowUseCase);
        const deleteResult = await deleteWorkflow.execute({
            app: "test",
            id: workflow.id
        });
        expect(deleteResult.isOk()).toBe(true);

        const listAfterDeleteResult = await listWorkflows.execute({});
        expect(listAfterDeleteResult.isOk()).toBe(true);
        expect(listAfterDeleteResult.value).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                hasMoreItems: false,
                cursor: null
            }
        });

        const getAfterDeleteResult = await getWorkflow.execute({
            app: "test",
            id: workflow.id
        });
        expect(getAfterDeleteResult.isFail()).toBe(true);
    });
});
