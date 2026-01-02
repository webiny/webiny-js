import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createMockWorkflow } from "~tests/mocks/workflow.js";
import { WorkflowStateRecordState } from "~/domain/workflowState/abstractions.js";
import { GetTargetWorkflowStateUseCase } from "~/features/workflowState/GetTargetWorkflowState/index.js";
import { ListWorkflowStatesUseCase } from "~/features/workflowState/ListWorkflowStates/index.js";
import { ListOwnWorkflowStatesUseCase } from "~/features/workflowState/ListOwnWorkflowStates/index.js";
import { ListRequestedWorkflowStatesUseCase } from "~/features/workflowState/ListRequestedWorkflowStates/index.js";
import { CreateWorkflowStateUseCase } from "~/features/workflowState/CreateWorkflowState/index.js";
import { UpdateWorkflowStateUseCase } from "~/features/workflowState/UpdateWorkflowState/index.js";
import { DeleteTargetWorkflowStateUseCase } from "~/features/workflowState/DeleteTargetWorkflowState/index.js";
import { StartWorkflowStateStepUseCase } from "~/features/workflowState/StartWorkflowStateStep/index.js";
import { ApproveWorkflowStateStepUseCase } from "~/features/workflowState/ApproveWorkflowStateStep/index.js";
import { RejectWorkflowStateStepUseCase } from "~/features/workflowState/RejectWorkflowStateStep/index.js";
import { TakeOverWorkflowStateStepUseCase } from "~/features/workflowState/TakeOverWorkflowStateStep/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";

import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";

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

describe("Workflow State Use Cases", () => {
    const targetTitle = "App: Some Record Title";

    it("should not list any states", async () => {
        const { context } = await createContextHandler();

        const listWorkflowStates = context.container.resolve(ListWorkflowStatesUseCase);
        const result = await listWorkflowStates.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            items: [],
            meta: {
                totalCount: 0,
                cursor: null,
                hasMoreItems: false
            }
        });
    });

    it("should not get a state because there is none", async () => {
        const { context } = await createContextHandler();
        const app = "testApp";
        const mockWorkflow = createMockWorkflow({ app });

        // Store a workflow
        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        // Try to get a non-existing workflow state
        const getTargetWorkflowState = context.container.resolve(GetTargetWorkflowStateUseCase);
        const result = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: "non-existing-id#0001"
        });

        expect(result.isFail()).toBe(true);
    });

    it("should throw an error on getState because of faulty targetId", async () => {
        const { context } = await createContextHandler();

        const getTargetWorkflowState = context.container.resolve(GetTargetWorkflowStateUseCase);
        const result = await getTargetWorkflowState.execute({
            app: "app",
            targetRevisionId: "non-revision-id"
        });

        expect(result.isFail()).toBe(true);
    });

    it("should fail to create a workflow state because of faulty targetId", async () => {
        const { context } = await createContextHandler();

        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        const result = await createWorkflowState.execute({
            app: "app",
            targetRevisionId: "non-revision-id",
            title: targetTitle
        });

        expect(result.isFail()).toBe(true);
    });

    it("should not create a state because there are no workflows", async () => {
        const { context } = await createContextHandler();

        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        const result = await createWorkflowState.execute({
            app: "non-existing-app",
            targetRevisionId: "non-existing-id#0001",
            title: targetTitle
        });

        expect(result.isFail()).toBe(true);
    });

    it("should create, update and delete a state", async () => {
        const { context } = await createContextHandler();
        const app = "testingApp";
        const targetRevisionId = "record-id#0001";

        // Store a workflow
        const mockWorkflow = createMockWorkflow({ app });
        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        const workflowResult = await storeWorkflow.execute(mockWorkflow);
        expect(workflowResult.isOk()).toBe(true);
        const workflow = workflowResult.value!;

        // Create a workflow state
        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        const stateResult = await createWorkflowState.execute({
            app,
            targetRevisionId,
            title: targetTitle
        });

        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        // Verify created state properties
        expect(state).toBeDefined();
        expect(state.done).toBe(false);
        expect(state.isActive).toBe(true);
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

        // Get workflow state by target
        const getTargetWorkflowState = context.container.resolve(GetTargetWorkflowStateUseCase);
        const targetStateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId
        });

        expect(targetStateResult.isOk()).toBe(true);
        const targetState = targetStateResult.value!;
        expect(targetState.done).toBe(false);
        expect(targetState.currentStep).toBeDefined();

        // Update workflow state with a comment
        const updateWorkflowState = context.container.resolve(UpdateWorkflowStateUseCase);
        await updateWorkflowState.execute(state.id, {
            comment: "A comment!"
        });

        // Verify the update
        const updatedStateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId
        });
        expect(updatedStateResult.isOk()).toBe(true);
        expect(updatedStateResult.value!.comment).toBe("A comment!");

        // Delete workflow state
        const deleteTargetWorkflowState = context.container.resolve(
            DeleteTargetWorkflowStateUseCase
        );
        await deleteTargetWorkflowState.execute(app, targetRevisionId);

        // Verify deletion
        const deletedStateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId
        });
        expect(deletedStateResult.isFail()).toBe(true);
    });

    it("should approve a step and move to the next one", async () => {
        // Setup: Create contexts for creator, non-owner, and reviewer
        const { context: creatorContext } = await createContextHandler();
        const { context: nonOwnerContext } = await createContextHandler({
            identity: nonOwnerIdentity
        });

        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({ app });

        // Store workflow
        const storeWorkflow = creatorContext.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        // Create workflow state as creator
        const createWorkflowState = creatorContext.container.resolve(CreateWorkflowStateUseCase);
        const createdStateResult = await createWorkflowState.execute({
            app,
            targetRevisionId: targetId,
            title: targetTitle
        });

        expect(createdStateResult.isOk()).toBe(true);
        const createdState = createdStateResult.value!;
        expect(createdState.done).toBe(false);
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        // Verify state can be listed
        const listWorkflowStates = creatorContext.container.resolve(ListWorkflowStatesUseCase);
        const listStatesResult = await listWorkflowStates.execute();
        expect(listStatesResult.isOk()).toBe(true);
        expect(listStatesResult.value!.items.length).toBe(1);

        // Verify creator cannot start review (creator cannot review their own workflow)
        const startResult = createdState.start();
        expect(startResult.isFail()).toBe(true);

        expect(createdState.currentStep).toEqual({
            ...createdState.steps[0]
        });

        // Get state as reviewer
        const { context: reviewerContext } = await createContextHandler({
            identity: reviewerIdentity
        });
        const getTargetWorkflowState = reviewerContext.container.resolve(
            GetTargetWorkflowStateUseCase
        );
        const stateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        // Start review of first step as reviewer
        const startWorkflowStateStep = reviewerContext.container.resolve(
            StartWorkflowStateStepUseCase
        );

        const startStateStepResult = await startWorkflowStateStep.execute(state.id);
        expect(startStateStepResult.isOk()).toBe(true);

        // Verify cannot start review twice
        const secondStartResult = await startWorkflowStateStep.execute(state.id);
        expect(secondStartResult.isFail()).toBe(true);

        // Verify state is now in review
        const stateOnReviewStartResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateOnReviewStartResult.isOk()).toBe(true);
        const stateOnReviewStart = stateOnReviewStartResult.value!;

        expect(stateOnReviewStart.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateOnReviewStart.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        const stateAfterReviewStartResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateAfterReviewStartResult.isOk()).toBe(true);
        const stateAfterReviewStart = stateAfterReviewStartResult.value!;
        expect(stateAfterReviewStart.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterReviewStart.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        // Verify non-owner cannot approve (they didn't start the review)
        const nonOwnerApprove = nonOwnerContext.container.resolve(ApproveWorkflowStateStepUseCase);
        const nonOwnerApproveResult = await nonOwnerApprove.execute(state.id);
        expect(nonOwnerApproveResult.isFail()).toBe(true);

        // Approve first step as reviewer
        const approveWorkflowStateStep = reviewerContext.container.resolve(
            ApproveWorkflowStateStepUseCase
        );
        const approveResult = await approveWorkflowStateStep.execute(
            stateAfterReviewStart.id,
            "First step should be approved."
        );
        expect(approveResult.isOk()).toBe(true);

        // Verify first step approval and workflow state transitions to pending (for step 2)
        const stateAfterApprove = approveResult.value!;
        expect(stateAfterApprove.savedBy).toEqual(reviewerIdentity);
        expect(stateAfterApprove.createdBy).toEqual(createdState.createdBy);
        expect(stateAfterApprove.state).toEqual(WorkflowStateRecordState.pending);

        expect(stateAfterApprove.steps[0]).toEqual({
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

        expect(stateAfterApprove.steps[1]).toEqual({
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

        // Re-fetch state and verify step states
        const stateAfterFirstApproveResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateAfterFirstApproveResult.isOk()).toBe(true);
        const stateAfterFirstApprove = stateAfterFirstApproveResult.value!;
        expect(stateAfterFirstApprove.state).toEqual(WorkflowStateRecordState.pending);
        expect(stateAfterFirstApprove.steps[0].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterFirstApprove.steps[1].state).toEqual(WorkflowStateRecordState.pending);

        // Start review of second step
        await startWorkflowStateStep.execute(stateAfterFirstApprove.id);

        const targetStateAfterFirstApproveResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(targetStateAfterFirstApproveResult.isOk()).toBe(true);
        const targetStateAfterFirstApprove = targetStateAfterFirstApproveResult.value!;

        // Approve second step
        const secondApproveResult = await approveWorkflowStateStep.execute(
            targetStateAfterFirstApprove.id,
            "Second step should be approved."
        );
        expect(secondApproveResult.isOk()).toBe(true);

        // Verify second step approval
        const stateAfterApproveStep2 = secondApproveResult.value!;
        expect(stateAfterApproveStep2.steps[1]).toEqual({
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

        // Verify entire workflow is now approved and done
        const stateAfterSecondApproveResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateAfterSecondApproveResult.isOk()).toBe(true);
        const stateAfterSecondApprove = stateAfterSecondApproveResult.value!;
        expect(stateAfterSecondApprove.state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.steps[0].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.steps[1].state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.done).toBe(true);

        // Verify cannot start review on completed workflow
        const finalStartResult = stateAfterSecondApprove.start();
        expect(finalStartResult.isFail()).toBe(true);
    });

    it("should throw an error when trying to approve or reject a workflow state but no step is in review", async () => {
        const { context } = await createContextHandler();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({ app });

        // Store workflow and create workflow state
        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        await createWorkflowState.execute({
            app,
            targetRevisionId: targetId,
            title: targetTitle
        });

        // Get state as reviewer
        const { context: reviewerContext } = await createContextHandler({
            identity: reviewerIdentity
        });
        const getTargetWorkflowState = reviewerContext.container.resolve(
            GetTargetWorkflowStateUseCase
        );
        const stateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        expect(state.done).toBe(false);
        expect(state.state).toEqual(WorkflowStateRecordState.pending);

        const startWorkflowStateStep = reviewerContext.container.resolve(
            StartWorkflowStateStepUseCase
        );
        const approveWorkflowStateStep = reviewerContext.container.resolve(
            ApproveWorkflowStateStepUseCase
        );
        const rejectWorkflowStateStep = reviewerContext.container.resolve(
            RejectWorkflowStateStepUseCase
        );

        // Approve both steps completely
        await startWorkflowStateStep.execute(state.id);
        await approveWorkflowStateStep.execute(state.id, "First step should be approved.");
        await startWorkflowStateStep.execute(state.id);
        await approveWorkflowStateStep.execute(state.id, "Second step should be approved.");

        // Try to approve a third time (should fail - no steps left)
        const thirdApproveResult = await approveWorkflowStateStep.execute(
            state.id,
            "There is no step to approve."
        );
        expect(thirdApproveResult.isFail()).toBe(true);

        // Try to reject (should fail - no steps left to reject)
        const rejectResult = await rejectWorkflowStateStep.execute(
            state.id,
            "There is no step to reject."
        );
        expect(rejectResult.isFail()).toBe(true);
    });

    it("should list own workflow states only", async () => {
        const { context } = await createContextHandler();
        const app = "testingApp";
        const targetId1 = "record-1-id#0001";
        const targetTitle1 = "App: Record 1 Title";
        const targetId2 = "record-2-id#0001";
        const targetTitle2 = "App: Record 2 Title";
        const mockWorkflow = createMockWorkflow({ app });

        // Store workflow
        const storeWorkflow = context.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        // Create two workflow states
        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        await createWorkflowState.execute({
            app,
            targetRevisionId: targetId1,
            title: targetTitle1
        });
        await createWorkflowState.execute({
            app,
            targetRevisionId: targetId2,
            title: targetTitle2
        });

        // List own workflow states (states created by current identity)
        const listOwnWorkflowStates = context.container.resolve(ListOwnWorkflowStatesUseCase);
        const ownResult = await listOwnWorkflowStates.execute();
        expect(ownResult.isOk()).toBe(true);
        const ownItems = ownResult.value!.items;

        expect(ownItems.length).toBe(2);
        expect(ownItems[0].targetRevisionId).toBe(targetId2);
        expect(ownItems[1].targetRevisionId).toBe(targetId1);

        // List requested workflow states (states where current identity is a reviewer)
        // Should be empty since creator cannot review their own workflows
        const listRequestedWorkflowStates = context.container.resolve(
            ListRequestedWorkflowStatesUseCase
        );
        const requestedResult = await listRequestedWorkflowStates.execute();
        expect(requestedResult.isOk()).toBe(true);
        const requestedItems = requestedResult.value!.items;

        expect(requestedItems.length).toBe(0);

        // Create a different identity context
        const { context: anotherContext } = await createContextHandler({
            identity: {
                id: "another-identity-id",
                displayName: "Another Identity",
                type: "user"
            }
        });

        // Verify another identity sees no own workflow states
        const anotherListOwnWorkflowStates = anotherContext.container.resolve(
            ListOwnWorkflowStatesUseCase
        );
        const noOwnResult = await anotherListOwnWorkflowStates.execute();
        expect(noOwnResult.isOk()).toBe(true);
        expect(noOwnResult.value!.items).toHaveLength(0);
    });

    it("should be able to take over a step", async () => {
        // Setup: Create creator context
        const { context: creatorContext } = await createContextHandler();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({ app });

        // Store workflow
        const storeWorkflow = creatorContext.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        // Create workflow state as creator
        const createWorkflowState = creatorContext.container.resolve(CreateWorkflowStateUseCase);
        const createdStateResult = await createWorkflowState.execute({
            app,
            targetRevisionId: targetId,
            title: targetTitle
        });

        expect(createdStateResult.isOk()).toBe(true);
        const createdState = createdStateResult.value!;
        expect(createdState.done).toBe(false);
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        // Get state as first reviewer and start review
        const { context: reviewerContext } = await createContextHandler({
            identity: reviewerIdentity
        });
        const getTargetWorkflowState = reviewerContext.container.resolve(
            GetTargetWorkflowStateUseCase
        );
        const stateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        const startWorkflowStateStep = reviewerContext.container.resolve(
            StartWorkflowStateStepUseCase
        );
        await startWorkflowStateStep.execute(state.id);

        // Different reviewer takes over the review
        const { context: takeOverContext } = await createContextHandler({
            identity: {
                ...takeOverIdentity,
                teams: [FULL_ACCESS_TEAM_ID]
            }
        });
        const takeOverWorkflowStateStep = takeOverContext.container.resolve(
            TakeOverWorkflowStateStepUseCase
        );
        const takeOverResult = await takeOverWorkflowStateStep.execute(state.id);

        expect(takeOverResult.isOk()).toBe(true);
        const takeOverStateStepResult = takeOverResult.value!;

        // Verify takeover was successful and new reviewer owns the step
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
        // Setup: Create creator context
        const { context: creatorContext } = await createContextHandler();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({ app });

        // Store workflow
        const storeWorkflow = creatorContext.container.resolve(StoreWorkflowUseCase);
        await storeWorkflow.execute(mockWorkflow);

        // Create workflow state as creator
        const createWorkflowState = creatorContext.container.resolve(CreateWorkflowStateUseCase);
        const createdStateResult = await createWorkflowState.execute({
            app,
            targetRevisionId: targetId,
            title: targetTitle
        });

        expect(createdStateResult.isOk()).toBe(true);
        const createdState = createdStateResult.value!;
        expect(createdState.done).toBe(false);
        expect(createdState.state).toEqual(WorkflowStateRecordState.pending);

        // Get state as reviewer and start review
        const { context: reviewerContext } = await createContextHandler({
            identity: reviewerIdentity
        });
        const getTargetWorkflowState = reviewerContext.container.resolve(
            GetTargetWorkflowStateUseCase
        );
        const stateResult = await getTargetWorkflowState.execute({
            app,
            targetRevisionId: targetId
        });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        const startWorkflowStateStep = reviewerContext.container.resolve(
            StartWorkflowStateStepUseCase
        );
        await startWorkflowStateStep.execute(state.id);

        // Same reviewer tries to take over (should fail - cannot take over from yourself)
        const { context: takeOverContext } = await createContextHandler({
            identity: reviewerIdentity
        });

        const takeOverWorkflowStateStep = takeOverContext.container.resolve(
            TakeOverWorkflowStateStepUseCase
        );
        const takeOverResult = await takeOverWorkflowStateStep.execute(state.id);

        expect(takeOverResult.isFail()).toBe(true);
    });
});
