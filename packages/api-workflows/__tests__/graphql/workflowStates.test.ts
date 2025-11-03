import { beforeEach, describe, expect, it } from "vitest";
import { createGraphQLHandler } from "~tests/__helpers/handler.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";
import {
    type IWorkflowStateRecord,
    type IWorkflowStateRecordStepWithPermissions,
    WorkflowStateRecordState
} from "~/context/abstractions/WorkflowState.js";
import { FULL_ACCESS_TEAM_ID, UNKNOWN_TEAM_ID } from "@webiny/testing";

const reviewerIdentity = {
    id: "reviewer-1",
    type: "user",
    displayName: "Reviewer User"
};

describe("workflow states graphql", () => {
    const handler = createGraphQLHandler();
    
    const targetTitle = "App: Test Record Title";

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

    const targetId = "record-1";
    const targetRevisionId = `${targetId}#0001`;
    let workflow: IWorkflow;

    beforeEach(async () => {
        workflow = await createWorkflow();
    });

    it("should create, get and list a new workflow state", async () => {
        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
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
                            state: WorkflowStateRecordState.pending,
                            app: workflow.app,
                            steps: workflow.steps.map(step => {
                                return {
                                    id: step.id,
                                    title: step.title,
                                    description: step.description,
                                    color: step.color,
                                    teams: step.teams,
                                    notifications: step.notifications,
                                    state: WorkflowStateRecordState.pending,
                                    comment: null,
                                    savedBy: null
                                };
                            }),
                            currentStep: {
                                id: workflow.steps[0].id,
                                state: WorkflowStateRecordState.pending,
                                comment: null,
                                savedBy: null
                            },
                            nextStep: {
                                id: workflow.steps[1].id,
                                state: WorkflowStateRecordState.pending,
                                comment: null,
                                savedBy: null
                            },
                            previousStep: null
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
        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });

        const workflowState = response.data?.workflows?.createWorkflowState?.data;

        const [noPermissionStartReviewResponse] = await handler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(noPermissionStartReviewResponse).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_REVIEWER_NO_PERMISSION"
                        }
                    }
                }
            }
        });

        const reviewerHandler = createGraphQLHandler({
            identity: reviewerIdentity
        });

        // start the review
        const [startReviewResponse] = await reviewerHandler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startReviewResponse).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            steps: [
                                {
                                    id: workflow.steps[0].id,
                                    state: WorkflowStateRecordState.inReview
                                },
                                {
                                    id: workflow.steps[1].id,
                                    state: WorkflowStateRecordState.pending
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        // let's move on to approving steps
        const [approveFirstStepResponse] = await reviewerHandler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 1"
        });

        expect(approveFirstStepResponse).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            savedBy: reviewerIdentity,
                            steps: [
                                {
                                    id: workflow.steps[0].id,
                                    state: WorkflowStateRecordState.approved,
                                    comment: "Approving step 1",
                                    savedBy: reviewerIdentity
                                },
                                {
                                    id: workflow.steps[1].id,
                                    state: WorkflowStateRecordState.pending,
                                    comment: null,
                                    savedBy: null
                                }
                            ],
                            previousStep: {
                                id: workflow.steps[0].id,
                                state: WorkflowStateRecordState.approved,
                                comment: "Approving step 1",
                                savedBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: expect.any(String)
                                }
                            },
                            currentStep: {
                                id: workflow.steps[1].id,
                                state: WorkflowStateRecordState.pending,
                                comment: null,
                                savedBy: null
                            },
                            nextStep: null
                        },
                        error: null
                    }
                }
            }
        });
        const afterApprovedFirstStepState =
            approveFirstStepResponse.data?.workflows?.approveWorkflowStateStep?.data;

        /**
         * Start second step review.
         */
        const [startSecondReviewResponse] = await reviewerHandler.startWorkflowStateStep({
            id: workflowState!.id
        });
        expect(startSecondReviewResponse).toMatchObject({
            data: {
                workflows: {
                    startWorkflowStateStep: {
                        data: {
                            id: workflowState!.id,
                            steps: [
                                {
                                    id: workflow.steps[0].id,
                                    state: WorkflowStateRecordState.approved
                                },
                                {
                                    id: workflow.steps[1].id,
                                    state: WorkflowStateRecordState.inReview
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Move to approving a second step.
         */
        const [approveSecondStepResponse] = await reviewerHandler.approveWorkflowStateStep({
            id: workflowState!.id,
            comment: "Approving step 2"
        });

        expect(
            approveSecondStepResponse.data.workflows.approveWorkflowStateStep.data!.previousStep
        ).toMatchObject({
            id: workflow.steps[0].id
        });
        expect(
            approveSecondStepResponse.data.workflows.approveWorkflowStateStep.data!.currentStep
        ).toMatchObject({
            id: workflow.steps[1].id
        });
        expect(
            approveSecondStepResponse.data.workflows.approveWorkflowStateStep.data!.nextStep
        ).toBeNull();

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
                            ],
                            previousStep: {
                                id: afterApprovedFirstStepState!.steps[0].id,
                                state: WorkflowStateRecordState.approved,
                                comment: "Approving step 1",
                                savedBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: expect.any(String)
                                }
                            },
                            currentStep: {
                                ...afterApprovedFirstStepState!.steps[1],
                                id: afterApprovedFirstStepState!.steps[1].id,
                                state: WorkflowStateRecordState.approved,
                                comment: "Approving step 2",
                                savedBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: expect.any(String)
                                }
                            },
                            nextStep: null
                        },
                        error: null
                    }
                }
            }
        });

        // state should be approved as well, we can check that by getting it
        const [getFinalStateResponse] = await reviewerHandler.getTargetWorkflowState({
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
        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });

        const workflowState = response.data?.workflows?.createWorkflowState?.data;

        const reviewerHandler = createGraphQLHandler({
            identity: reviewerIdentity
        });

        const [notInReviewResponse] = await reviewerHandler.rejectWorkflowStateStep({
            id: workflowState!.id,
            comment: "Rejecting step 1"
        });
        expect(notInReviewResponse).toMatchObject({
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

        await reviewerHandler.startWorkflowStateStep({
            id: workflowState!.id
        });

        const [rejectResponse] = await reviewerHandler.rejectWorkflowStateStep({
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

        // should not be able to do anything with steps next step after rejection
        const [approveAfterRejection] = await reviewerHandler.approveWorkflowStateStep({
            id: workflowState!.id
        });
        expect(approveAfterRejection).toMatchObject({
            data: {
                workflows: {
                    approveWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_STATE_REJECTED"
                        }
                    }
                }
            }
        });

        const [rejectAfterRejection] = await reviewerHandler.rejectWorkflowStateStep({
            id: workflowState!.id,
            comment: "testing"
        });
        expect(rejectAfterRejection).toMatchObject({
            data: {
                workflows: {
                    rejectWorkflowStateStep: {
                        data: null,
                        error: {
                            code: "WORKFLOW_STATE_REJECTED"
                        }
                    }
                }
            }
        });

        const [getAfterRejectionResponse] = await reviewerHandler.getTargetWorkflowState({
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

    it("should allow creating multiple workflow states for same record - if previous state is inactive", async () => {
        const [response] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });

        const firstWorkflowState = response.data?.workflows?.createWorkflowState?.data;

        expect(firstWorkflowState).toMatchObject({
            id: expect.any(String),
            isActive: true,
            workflowId: workflow.id
        });

        const [canceledFirstWorkflowStateResponse] = await handler.cancelWorkflowState({
            id: firstWorkflowState!.id
        });

        expect(canceledFirstWorkflowStateResponse).toMatchObject({
            data: {
                workflows: {
                    cancelWorkflowState: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [secondWorkflowStateResponse] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });
        const secondWorkflowState =
            secondWorkflowStateResponse.data?.workflows?.createWorkflowState?.data;

        expect(secondWorkflowStateResponse).toMatchObject({
            data: {
                workflows: {
                    createWorkflowState: {
                        data: {
                            id: expect.any(String),
                            isActive: true,
                            workflowId: workflow.id
                        },
                        error: null
                    }
                }
            }
        });

        const [listResponse] = await handler.listWorkflowStates({});
        expect(listResponse).toMatchObject({
            data: {
                workflows: {
                    listWorkflowStates: {
                        data: [
                            {
                                id: secondWorkflowState!.id,
                                isActive: true
                            },
                            {
                                id: firstWorkflowState!.id,
                                isActive: false
                            }
                        ],
                        error: null,
                        meta: {
                            totalCount: 2,
                            cursor: null,
                            hasMoreItems: false
                        }
                    }
                }
            }
        });
        /**
         * Must not be possible to create a new workflow state if the previous one is still active.
         */
        const [errorOnCreatingActiveWorkflowState] = await handler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });

        expect(errorOnCreatingActiveWorkflowState).toMatchObject({
            data: {
                workflows: {
                    createWorkflowState: {
                        data: null,
                        error: {
                            code: "ACTIVE_STATE_EXISTS"
                        }
                    }
                }
            }
        });
        /**
         * Should be possible to get the inactive workflow state by its ID.
         */
        const [inactiveFirstStateResponse] = await handler.getWorkflowState({
            id: firstWorkflowState!.id
        });
        expect(inactiveFirstStateResponse).toMatchObject({
            data: {
                workflows: {
                    getWorkflowState: {
                        data: {
                            id: firstWorkflowState!.id,
                            isActive: false,
                            workflowId: workflow.id
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should not allow reviewing a step current user does not have access to - wrong team", async () => {
        const reviewerHandler = createGraphQLHandler({
            identity: reviewerIdentity
        });
        const [response] = await reviewerHandler.storeWorkflow({
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
                        teams: [{ id: UNKNOWN_TEAM_ID }],
                        notifications: [{ id: "notif-1" }]
                    }
                ]
            }
        });
        const workflow = response.data?.workflows?.storeWorkflow?.data as IWorkflow;

        const [createWorkflowStateResponse] = await reviewerHandler.createWorkflowState({
            app: workflow.app,
            targetRevisionId,
            title: targetTitle
        });
        /**
         * Reviewer handler (identity which created a workflow state) should not have permission to review.
         */
        const workflowState = createWorkflowStateResponse.data?.workflows?.createWorkflowState
            ?.data as IWorkflowStateRecord<IWorkflowStateRecordStepWithPermissions>;

        expect(workflowState.steps[0]).toMatchObject({
            id: "step-1",
            isAllowedToReview: false
        });

        expect(workflowState.steps[1]).toMatchObject({
            id: "step-2",
            isAllowedToReview: false
        });
        /**
         * Regular identity should have permission to review the step which is assigned to a team it has access to.
         * Other steps should not be accessible for review.
         */
        const [getWorkflowStateResponse] = await handler.getWorkflowState({
            id: workflowState.id
        });
        const fetchedWorkflowState = getWorkflowStateResponse.data?.workflows?.getWorkflowState
            ?.data as IWorkflowStateRecord<IWorkflowStateRecordStepWithPermissions>;

        expect(fetchedWorkflowState.steps[0]).toMatchObject({
            id: "step-1",
            isAllowedToReview: true
        });

        expect(fetchedWorkflowState.steps[1]).toMatchObject({
            id: "step-2",
            isAllowedToReview: false
        });
    });
});
