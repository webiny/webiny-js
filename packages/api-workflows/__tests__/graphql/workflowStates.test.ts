import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

describe("workflow states graphql", () => {
    const handler = createGraphQLHandler();

    const createWorkflow = async () => {
        const [response] = await handler.storeWorkflow({
            app: "test",
            id: `workflow-1`,
            data: {
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
            }
        });
        if (response.data?.workflows?.storeWorkflow.error) {
            throw new Error(response.data.workflows.storeWorkflow.error.message);
        }
        return response.data?.workflows?.storeWorkflow?.data as IWorkflow;
    };

    it("should create a new workflow state", async () => {
        const workflow = await createWorkflow();

        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId: "record-1#0001"
        });

        expect(response).toMatchObject({
            data: {
                workflows: {
                    createWorkflowState: {
                        data: {
                            id: expect.any(String),
                            workflowId: workflow.id,
                            targetId: "record-1",
                            targetRevisionId: "record-1#0001",
                            app: workflow.app,
                            steps: workflow.steps.map(step => {
                                return {
                                    id: step.id,
                                    state: WorkflowStateRecordState.pending,
                                    comment: null,
                                    savedBy: null
                                };
                            })
                        },
                        error: null
                    }
                }
            }
        });
        const workflowState = response.data?.workflows?.createWorkflowState?.data;

        const [getResponse] = await handler.getTargetWorkflowState({
            app: workflow.app,
            targetRevisionId: "record-1#0001"
        });
        expect(getResponse).toMatchObject({
            data: {
                workflows: {
                    getTargetWorkflowState: {
                        data: {
                            id: workflowState!.id
                        },
                        error: null
                    }
                }
            }
        });
    });
});
