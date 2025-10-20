import { describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";

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
                        teams: [{ id: FULL_ACCESS_TEAM_ID }],
                        notifications: [{ id: "notif-1" }]
                    },
                    {
                        id: "step-2",
                        title: "Step 2",
                        description: "This is step 2",
                        color: "blue",
                        teams: [{ id: FULL_ACCESS_TEAM_ID }],
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

    it("should create, get and list a new workflow state", async () => {
        const targetId = "record-1";
        const targetRevisionId = `${targetId}#0001`;
        const workflow = await createWorkflow();

        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId
        });

        expect(response).toMatchObject({
            data: {
                workflows: {
                    createWorkflowState: {
                        data: {
                            id: expect.any(String),
                            workflowId: workflow.id,
                            targetId,
                            targetRevisionId,
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
            targetRevisionId
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

        const [listResponse] = await handler.listWorkflowStates({
            where: {
                app: workflow.app,
                targetRevisionId
            }
        });

        expect(listResponse).toMatchObject({
            data: {
                workflows: {
                    listWorkflowStates: {
                        data: [workflowState],
                        error: null,
                        meta: {
                            totalCount: 1,
                            cursor: null,
                            hasMoreItems: false
                        }
                    }
                }
            }
        });

        const [listNonExistingResponse] = await handler.listWorkflowStates({
            where: {
                app: workflow.app,
                targetRevisionId: `non-existing-${targetRevisionId}`
            }
        });

        expect(listNonExistingResponse).toMatchObject({
            data: {
                workflows: {
                    listWorkflowStates: {
                        data: [],
                        error: null,
                        meta: {
                            totalCount: 0,
                            cursor: null,
                            hasMoreItems: false
                        }
                    }
                }
            }
        });
    });

    it("should approve workflow state steps", async () => {
        const targetId = "record-1";
        const targetRevisionId = `${targetId}#0001`;
        const workflow = await createWorkflow();

        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId
        });

        const workflowState = response.data?.workflows?.createWorkflowState?.data;

        const [approveErrorResponse] = await handler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 1"
        });
        // should not be able to approve or reject a step of the workflow state that is not in review
        expect(approveErrorResponse).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_NOT_IN_REVIEW"
                        }
                    }
                }
            }
        });

        const [rejectErrorResponse] = await handler.rejectWorkflowStateStep({
            id: workflowState!.id,
            comment: "Rejecting step 1"
        });

        expect(rejectErrorResponse).toMatchObject({
            data: {
                workflows: {
                    rejectWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_NOT_IN_REVIEW"
                        }
                    }
                }
            }
        });

        const [startedState] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startedState).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: {
                            steps: [
                                {
                                    state: WorkflowStateRecordState.inReview
                                },
                                {
                                    state: WorkflowStateRecordState.pending
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        // should not be possible to start a new step when one is already in review
        const [tryToStartAgain] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(tryToStartAgain).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_PREVIOUS_STEP_NOT_APPROVED"
                        }
                    }
                }
            }
        });

        // let's move on to approving steps
        const [approveFirstStepResponse] = await handler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 1"
        });

        expect(approveFirstStepResponse).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            steps: [
                                {
                                    id: workflow.steps[0].id,
                                    state: WorkflowStateRecordState.approved,
                                    comment: "Approving step 1",
                                    savedBy: {
                                        id: expect.any(String),
                                        displayName: expect.any(String),
                                        type: expect.any(String)
                                    }
                                },
                                {
                                    id: workflow.steps[1].id,
                                    state: WorkflowStateRecordState.pending,
                                    comment: null,
                                    savedBy: null
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
        const afterApprovedFirstStepState =
            approveFirstStepResponse.data?.workflows?.approveWorkflowStateStep?.data;

        // this one will fail as review is not started yet for the second step
        const [tryToApproveSecondStepResponse] = await handler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 2"
        });

        expect(tryToApproveSecondStepResponse).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_NOT_IN_REVIEW"
                        }
                    }
                }
            }
        });

        const [startedSecondStep] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startedSecondStep).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: {
                            steps: [
                                {
                                    state: WorkflowStateRecordState.approved
                                },
                                {
                                    state: WorkflowStateRecordState.inReview
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [approveSecondStepResponse] = await handler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 2"
        });

        expect(approveSecondStepResponse).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            steps: [
                                {
                                    ...afterApprovedFirstStepState!.steps[0]
                                },
                                {
                                    ...afterApprovedFirstStepState!.steps[1],
                                    id: afterApprovedFirstStepState!.steps[1].id,
                                    state: WorkflowStateRecordState.approved,
                                    comment: "Approving step 2",
                                    savedBy: {
                                        id: expect.any(String),
                                        displayName: expect.any(String),
                                        type: expect.any(String)
                                    }
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        // there should be no more steps to start or approve
        const [startAfterAllApproved] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startAfterAllApproved).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_NO_PENDING_STEPS"
                        }
                    }
                }
            }
        });

        // state should be approved as well, we can check that by getting it
        const [getFinalStateResponse] = await handler.getTargetWorkflowState({
            app: workflow.app,
            targetRevisionId
        });
        expect(getFinalStateResponse).toMatchObject({
            data: {
                workflows: {
                    getTargetWorkflowState: {
                        data: {
                            id: workflowState!.id,
                            state: WorkflowStateRecordState.approved
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should reject workflow state step", async () => {
        const targetId = "record-1";
        const targetRevisionId = `${targetId}#0001`;
        const workflow = await createWorkflow();

        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId
        });

        const workflowState = response.data?.workflows?.createWorkflowState?.data;

        await handler.startWorkflowStateStep({
            id: workflowState!.id
        });

        const [rejectResponse] = await handler.rejectWorkflowStateStep({
            id: workflowState!.id,
            comment: "Rejecting step 1"
        });

        expect(rejectResponse).toMatchObject({
            data: {
                workflows: {
                    rejectWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            steps: [
                                {
                                    id: workflow.steps[0].id,
                                    state: WorkflowStateRecordState.rejected,
                                    comment: "Rejecting step 1",
                                    savedBy: {
                                        id: expect.any(String),
                                        displayName: expect.any(String),
                                        type: expect.any(String)
                                    }
                                },
                                {
                                    id: workflow.steps[1].id,
                                    state: WorkflowStateRecordState.pending,
                                    comment: null,
                                    savedBy: null
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        // should not be able to start next step after rejection
        const [startAfterRejection] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startAfterRejection).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_ALREADY_REJECTED"
                        }
                    }
                }
            }
        });

        const [getAfterRejectionResponse] = await handler.getTargetWorkflowState({
            app: workflow.app,
            targetRevisionId
        });
        expect(getAfterRejectionResponse).toMatchObject({
            data: {
                workflows: {
                    getTargetWorkflowState: {
                        data: {
                            id: workflowState!.id,
                            state: WorkflowStateRecordState.rejected
                        },
                        error: null
                    }
                }
            }
        });
    });
});
