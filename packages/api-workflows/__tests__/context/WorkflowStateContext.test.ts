import { describe, expect, it } from "vitest";
import { createContext } from "~tests/__helpers/context.js";
import { createMockWorkflow } from "~tests/context/mocks/workflow.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

const reviewerIdentity = {
    id: "reviewer-identity-id",
    displayName: "Reviewer Identity",
    type: "user"
};

const takeOverIdentity = {
    id: "takeOver-identity-id",
    displayName: "Takeover Identity",
    type: "user"
};

const nonOwnerIdentity = {
    id: "non-owner-identity-id",
    displayName: "Non Owner Identity",
    type: "user"
};

describe("Workflow State Context", () => {
    const targetTitle = "App: Some Record Title";

    it("should not list any states", async () => {
        const { workflowStateContext } = await createContext();

        const response = await workflowStateContext.listStates();
        expect(response).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                cursor: null,
                hasMoreItems: false
            }
        });
    });

    it("should not get a state because there is none", async () => {
        const { workflowStateContext, workflowsContext } = await createContext();
        const app = "testApp";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        await expect(() => {
            return workflowStateContext.getTargetState(app, "non-existing-id#0001");
        }).rejects.toThrow("No workflow state for given record.");
    });

    it("should throw an error on getState because of faulty targetId", async () => {
        const { workflowStateContext } = await createContext();

        await expect(workflowStateContext.getTargetState("app", "non-revision-id")).rejects.toThrow(
            "Cannot get a workflow state without version of a target record."
        );
    });

    it("should fail to create a workflow state because of faulty targetId", async () => {
        const { workflowStateContext } = await createContext();

        await expect(
            workflowStateContext.createState("app", "non-revision-id", targetTitle)
        ).rejects.toThrow("Cannot create a workflow state without version of a target record.");
    });

    it("should not create a state because there are no workflows", async () => {
        const { workflowStateContext } = await createContext();

        await expect(() => {
            return workflowStateContext.createState(
                "non-existing-app",
                "non-existing-id#0001",
                targetTitle
            );
        }).rejects.toThrow("No workflows are defined for the given app.");
    });

    it("should create, update and delete a state", async () => {
        const { workflowStateContext, workflowsContext } = await createContext();
        const app = "testingApp";
        const targetRevisionId = "record-id#0001";

        const mockWorkflow = createMockWorkflow({
            app
        });
        const workflow = await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const state = await workflowStateContext.createState(app, targetRevisionId, targetTitle);

        expect(state).toBeDefined();
        expect(state.done).toBe(false);
        expect(state.isActive).toBeTrue();
        expect(state).toBeDefined();
        expect(state.app).toBe(app);
        expect(state.workflowId).toBe(workflow.id);
        expect(state.targetRevisionId).toBe("record-id#0001");
        expect(state.targetId).toBe("record-id");
        expect(state.state).toEqual(WorkflowStateRecordState.pending);
        expect(state.steps).toEqual([
            ...workflow.steps.map(step => {
                return {
                    canReview: false,
                    isOwner: false,
                    canTakeOver: false,
                    id: step.id,
                    title: step.title,
                    description: step.description,
                    color: step.color,
                    teams: step.teams,
                    notifications: step.notifications,
                    state: WorkflowStateRecordState.pending,
                    savedBy: null,
                    comment: null
                };
            })
        ]);

        const targetState = await workflowStateContext.getTargetState(app, targetRevisionId);

        expect(targetState.done).toBeFalse();
        expect(targetState.getActiveStep()).toEqual(null);
        expect(targetState).toEqual({
            ...state
        });

        await workflowStateContext.updateState(state.id, {
            comment: "A comment!"
        });
        const updatedState = await workflowStateContext.getTargetState(app, targetRevisionId);
        expect(updatedState.comment).toBe("A comment!");

        await workflowStateContext.deleteTargetState(app, targetRevisionId);

        await expect(() => {
            return workflowStateContext.getTargetState(app, targetRevisionId);
        }).rejects.toThrow("No workflow state for given record.");
    });

    it("should approve a step and move to the next one", async () => {
        const { workflowStateContext: creatorWorkflowStateContext, workflowsContext } =
            await createContext();

        const { workflowStateContext: nonOwnerWorkflowStateContext } = await createContext({
            identity: nonOwnerIdentity
        });

        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const createdState = await creatorWorkflowStateContext.createState(
            app,
            targetId,
            targetTitle
        );

        expect(createdState.done).toBeFalse();
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        const listStatesResponse = await creatorWorkflowStateContext.listStates();
        expect(listStatesResponse.items.length).toBe(1);
        expect(listStatesResponse.items[0]).toEqual(createdState);
        /**
         * Should not allow starting a review with creator identity.
         */
        await expect(async () => {
            return createdState.start();
        }).rejects.toThrow("You do not have permissions to review this workflow state step.");

        expect(createdState.currentStep).toEqual({
            ...createdState.steps[0]
        });
        /**
         * Use new identity to review.
         */
        const { workflowStateContext } = await createContext({
            identity: reviewerIdentity
        });
        const state = await workflowStateContext.getTargetState(app, targetId);
        /**
         * Should start review
         */
        await state.start();
        /**
         * Should not be possible to start review again.
         */
        await expect(async () => {
            return await state.start();
        }).rejects.toThrow("The workflow state is already in review and cannot proceed.");

        const stateOnReviewStart = await workflowStateContext.getTargetState(app, targetId);

        expect(stateOnReviewStart.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateOnReviewStart.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        const stateAfterReviewStart = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterReviewStart.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterReviewStart.steps[0].state).toEqual(WorkflowStateRecordState.inReview);
        /**
         * Non-owner user should try to approve.
         */
        await expect(async () => {
            return await nonOwnerWorkflowStateContext.approveStateStep(state.id);
        }).rejects.toThrow(
            "You must be the owner of this workflow state step to perform this action."
        );

        await stateAfterReviewStart.approve("First step should be approved.");

        expect(stateAfterReviewStart.savedBy).toEqual(reviewerIdentity);
        expect(stateAfterReviewStart.createdBy).toEqual(createdState.createdBy);
        expect(stateAfterReviewStart.state).toEqual(WorkflowStateRecordState.pending);

        expect(stateAfterReviewStart.steps[0]).toEqual({
            id: "step-1",
            canReview: true,
            canTakeOver: false,
            isOwner: true,
            title: state.steps[0].title,
            description: state.steps[0].description,
            color: state.steps[0].color,
            notifications: state.steps[0].notifications,
            teams: state.steps[0].teams,
            state: WorkflowStateRecordState.approved,
            comment: "First step should be approved.",
            savedBy: reviewerIdentity
        });

        expect(stateAfterReviewStart.steps[1]).toEqual({
            id: "step-2",
            canReview: true,
            canTakeOver: false,
            isOwner: false,
            title: state.steps[1].title,
            description: state.steps[1].description,
            color: state.steps[1].color,
            notifications: state.steps[1].notifications,
            teams: state.steps[1].teams,
            state: WorkflowStateRecordState.pending,
            comment: null,
            savedBy: null
        });

        const stateAfterFirstApprove = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterFirstApprove.state).toEqual(WorkflowStateRecordState.pending);
        expect(stateAfterFirstApprove.steps[0].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterFirstApprove.steps[1].state).toEqual(WorkflowStateRecordState.pending);

        await stateAfterFirstApprove.start();

        const targetStateAfterFirstApprove = await workflowStateContext.getTargetState(
            app,
            targetId
        );

        await targetStateAfterFirstApprove.approve("Second step should be approved.");

        expect(targetStateAfterFirstApprove.steps[1]).toEqual({
            id: "step-2",
            canReview: true,
            canTakeOver: false,
            isOwner: true,
            title: state.steps[1].title,
            description: state.steps[1].description,
            color: state.steps[1].color,
            teams: state.steps[1].teams,
            notifications: state.steps[1].notifications,
            state: WorkflowStateRecordState.approved,
            comment: "Second step should be approved.",
            savedBy: reviewerIdentity
        });

        const stateAfterSecondApprove = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterSecondApprove.state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.steps[0].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.steps[1].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.done).toBeTrue();

        /**
         * Should not be able to start review on a completed workflow.
         */
        await expect(async () => {
            return await stateAfterSecondApprove.start();
        }).rejects.toThrow("The workflow state has no pending step to proceed.");
    });

    it("should throw an error when trying to approve or reject a workflow state but no step is in review", async () => {
        const { workflowStateContext, workflowsContext } = await createContext();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        await workflowStateContext.createState(app, targetId, targetTitle);

        const { workflowStateContext: reviewerWorkflowStateContext } = await createContext({
            identity: reviewerIdentity
        });
        const state = await reviewerWorkflowStateContext.getTargetState(app, targetId);

        expect(state.done).toBeFalse();
        expect(state.state).toEqual(WorkflowStateRecordState.pending);

        await state.start();
        await state.approve("First step should be approved.");
        await state.start();
        await state.approve("Second step should be approved.");

        await expect(() => {
            return state.approve("There is no step to approve.");
        }).rejects.toThrow("Cannot approve a workflow state that is not in review.");

        await expect(() => {
            return state.reject("There is no step to reject.");
        }).rejects.toThrow("Cannot reject a workflow state that is not in review.");
    });

    it("should list own workflow states only", async () => {
        const { workflowStateContext, workflowsContext } = await createContext();
        const app = "testingApp";
        const targetId1 = "record-1-id#0001";
        const targetTitle1 = "App: Record 1 Title";
        const targetId2 = "record-2-id#0001";
        const targetTitle2 = "App: Record 2 Title";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        await workflowStateContext.createState(app, targetId1, targetTitle1);
        await workflowStateContext.createState(app, targetId2, targetTitle2);

        const { items: ownItems } = await workflowStateContext.listOwnWorkflowStates();

        expect(ownItems.length).toBe(2);
        expect(ownItems[0].targetRevisionId).toBe(targetId2);
        expect(ownItems[1].targetRevisionId).toBe(targetId1);

        const { items: requestedItems } = await workflowStateContext.listRequestedWorkflowStates();

        expect(requestedItems.length).toBe(0);

        const { workflowStateContext: anotherIdentityWorkflowStateContext } = await createContext({
            identity: {
                id: "another-identity-id",
                displayName: "Another Identity",
                type: "user"
            }
        });

        const { items: noOwnItems } =
            await anotherIdentityWorkflowStateContext.listOwnWorkflowStates();

        expect(noOwnItems).toHaveLength(0);
    });

    it("should be able to take over a step", async () => {
        const { workflowStateContext: creatorWorkflowStateContext, workflowsContext } =
            await createContext();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const createdState = await creatorWorkflowStateContext.createState(
            app,
            targetId,
            targetTitle
        );

        expect(createdState.done).toBeFalse();
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        /**
         * Use new identity to review.
         */
        const { workflowStateContext } = await createContext({
            identity: reviewerIdentity
        });
        const state = await workflowStateContext.getTargetState(app, targetId);
        /**
         * Should start review
         */
        await state.start();
        // Should be able to take over the step from a reviewerIdentity
        const { workflowStateContext: takeOverWorkflowStateContext } = await createContext({
            identity: takeOverIdentity
        });
        const takeOverStateStepResult = await takeOverWorkflowStateContext.takeOverStateStep(
            state.id
        );

        expect(takeOverStateStepResult.steps).toEqual([
            {
                canReview: true,
                canTakeOver: false,
                color: "blue",
                comment: null,
                description: "This is step 1",
                id: "step-1",
                isOwner: true,
                notifications: [
                    {
                        id: "notif-1"
                    }
                ],
                savedBy: {
                    displayName: "Takeover Identity",
                    id: "takeOver-identity-id",
                    type: "user"
                },
                state: "inReview",
                teams: [
                    {
                        id: "full-access-team"
                    }
                ],
                title: "Step 1"
            },
            {
                canReview: true,
                canTakeOver: false,
                color: "green",
                comment: null,
                description: "This is step 2",
                id: "step-2",
                isOwner: false,
                notifications: [
                    {
                        id: "notif-2"
                    }
                ],
                savedBy: null,
                state: "pending",
                teams: [
                    {
                        id: "full-access-team"
                    }
                ],
                title: "Step 2"
            }
        ]);
    });

    it("should not be able to take over a step", async () => {
        const { workflowStateContext: creatorWorkflowStateContext, workflowsContext } =
            await createContext();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const createdState = await creatorWorkflowStateContext.createState(
            app,
            targetId,
            targetTitle
        );

        expect(createdState.done).toBeFalse();
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        /**
         * Use new identity to review.
         */
        const { workflowStateContext } = await createContext({
            identity: reviewerIdentity
        });
        const state = await workflowStateContext.getTargetState(app, targetId);
        /**
         * Should start review
         */
        await state.start();
        // Should be able to take over the step from a reviewerIdentity
        const { workflowStateContext: takeOverWorkflowStateContext } = await createContext({
            identity: reviewerIdentity
        });

        await expect(() => {
            return takeOverWorkflowStateContext.takeOverStateStep(state.id);
        }).rejects.toThrow("You do not have permissions to take over this workflow state step.");
    });
});
