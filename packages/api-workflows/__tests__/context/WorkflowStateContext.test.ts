import { describe, expect, it } from "vitest";
import { NullWorkflowState } from "~/context/workflowState/NullWorkflowState.js";
import { createContext } from "~tests/__helpers/context.js";
import { createMockWorkflow } from "~tests/context/mocks/workflow.js";
import { WorkflowStateRecordState } from "~/context/abstractions/WorkflowState.js";

describe("Workflow State Context", () => {
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
        const { workflowStateContext } = await createContext();

        const response = await workflowStateContext.getState("app", "non-existing-id#0001");
        expect(response).toBeInstanceOf(NullWorkflowState);
        expect(response.workflow).toBeUndefined();
        expect(response.record).toBeUndefined();
        expect(response.done).toBe(true);
    });

    it("should throw an error on getState because of faulty targetId", async () => {
        const { workflowStateContext } = await createContext();

        await expect(workflowStateContext.getState("app", "non-revision-id")).rejects.toThrow(
            "Cannot get a workflow state without version of a target record."
        );
    });

    it("should fail to create a workflow state because of faulty targetId", async () => {
        const { workflowStateContext } = await createContext();

        await expect(workflowStateContext.createState("app", "non-revision-id")).rejects.toThrow(
            "Cannot create a workflow state without version of a target record."
        );
    });

    it("should not create a state because there are no workflows", async () => {
        const { workflowStateContext } = await createContext();

        const response = await workflowStateContext.createState(
            "non-existing-app",
            "non-existing-id#0001"
        );
        expect(response).toBeInstanceOf(NullWorkflowState);
        expect(response.workflow).toBeUndefined();
        expect(response.record).toBeUndefined();
        expect(response.done).toBe(true);
    });

    it("should create, update and delete a state", async () => {
        const { workflowStateContext, workflowsContext } = await createContext();
        const app = "testingApp";
        const targetRevisionId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        const workflow = await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const state = await workflowStateContext.createState(app, targetRevisionId);

        expect(state).toBeDefined();
        expect(state.done).toBe(false);
        expect(state.workflow).toEqual(workflow);
        expect(state.record).toBeDefined();
        expect(state.record!.app).toBe(app);
        expect(state.record!.workflowId).toBe(workflow.id);
        expect(state.record!.targetRevisionId).toBe("record-id#0001");
        expect(state.record!.targetId).toBe("record-id");
        expect(state.record?.steps).toEqual([
            ...workflow.steps.map(step => {
                return {
                    id: step.id,
                    state: WorkflowStateRecordState.pending,
                    userId: undefined,
                    comment: undefined
                };
            })
        ]);

        const getResponse = await workflowStateContext.getState(app, targetRevisionId);

        expect(getResponse.done).toBeFalse();
        expect(getResponse.workflow).toEqual({
            ...state.workflow
        });
        expect(getResponse.record).toEqual({
            ...state.record
        });

        await workflowStateContext.updateState(state.record!.id, {
            comment: "A comment!"
        });
        const updatedState = await workflowStateContext.getState(app, targetRevisionId);
        expect(updatedState.record?.comment).toBe("A comment!");

        await workflowStateContext.deleteState(app, targetRevisionId);
        const afterDeleteState = await workflowStateContext.getState(app, targetRevisionId);
        expect(afterDeleteState).toBeInstanceOf(NullWorkflowState);
        expect(afterDeleteState.workflow).toBeUndefined();
        expect(afterDeleteState.record).toBeUndefined();
        expect(afterDeleteState.done).toBe(true);
    });

    it("should approve a step and move to the next one", async () => {
        const { workflowStateContext, workflowsContext, context } = await createContext();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const state = await workflowStateContext.createState(app, targetId);

        expect(state.done).toBeFalse();
        expect(state.record?.state).toEqual(WorkflowStateRecordState.pending);

        const listStatesResponse = await workflowStateContext.listStates();
        expect(listStatesResponse.items.length).toBe(1);
        expect(listStatesResponse.items[0].record).toEqual(state.record);

        await state.review();

        const stateAfterReview = await workflowStateContext.getState(app, targetId);
        expect(stateAfterReview.record?.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterReview.record?.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        await stateAfterReview.approve("First step should be approved.");

        expect(stateAfterReview.record?.steps[0]).toEqual({
            id: "step-1",
            state: WorkflowStateRecordState.approved,
            comment: "First step should be approved.",
            userId: context.security.getIdentity().id
        });

        const stateAfterFirstApprove = await workflowStateContext.getState(app, targetId);
        expect(stateAfterFirstApprove.record?.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterFirstApprove.record?.steps[0].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterFirstApprove.record?.steps[1].state).toEqual(
            WorkflowStateRecordState.inReview
        );

        await stateAfterFirstApprove.approve("Second step should be approved.");

        expect(stateAfterFirstApprove.record?.steps[1]).toEqual({
            id: "step-2",
            state: WorkflowStateRecordState.approved,
            comment: "Second step should be approved.",
            userId: context.security.getIdentity().id
        });

        const stateAfterSecondApprove = await workflowStateContext.getState(app, targetId);
        expect(stateAfterSecondApprove.record?.state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.record?.steps[0].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterSecondApprove.record?.steps[1].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterSecondApprove.done).toBeTrue();
    });
});
