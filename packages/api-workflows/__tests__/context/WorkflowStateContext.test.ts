import { describe, expect, it } from "vitest";
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

        await expect(workflowStateContext.createState("app", "non-revision-id")).rejects.toThrow(
            "Cannot create a workflow state without version of a target record."
        );
    });

    it("should not create a state because there are no workflows", async () => {
        const { workflowStateContext } = await createContext();

        await expect(() => {
            return workflowStateContext.createState("non-existing-app", "non-existing-id#0001");
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
                    savedBy: null,
                    comment: null
                };
            })
        ]);

        const getResponse = await workflowStateContext.getTargetState(app, targetRevisionId);

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
        const updatedState = await workflowStateContext.getTargetState(app, targetRevisionId);
        expect(updatedState.record?.comment).toBe("A comment!");

        await workflowStateContext.deleteTargetState(app, targetRevisionId);

        await expect(() => {
            return workflowStateContext.getTargetState(app, targetRevisionId);
        }).rejects.toThrow("No workflow state for given record.");
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

        await state.start();

        const stateAfterReview = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterReview.record?.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterReview.record?.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        await stateAfterReview.approve("First step should be approved.");

        expect(stateAfterReview.record?.steps[0]).toEqual({
            id: "step-1",
            state: WorkflowStateRecordState.approved,
            comment: "First step should be approved.",
            savedBy: {
                id: context.security.getIdentity().id,
                displayName: context.security.getIdentity().displayName,
                type: context.security.getIdentity().type
            }
        });

        const stateAfterFirstApprove = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterFirstApprove.record?.state).toEqual(WorkflowStateRecordState.pending);
        expect(stateAfterFirstApprove.record?.steps[0].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterFirstApprove.record?.steps[1].state).toEqual(
            WorkflowStateRecordState.pending
        );

        await stateAfterFirstApprove.start();
        await stateAfterFirstApprove.approve("Second step should be approved.");

        expect(stateAfterFirstApprove.record?.steps[1]).toEqual({
            id: "step-2",
            state: WorkflowStateRecordState.approved,
            comment: "Second step should be approved.",
            savedBy: {
                id: context.security.getIdentity().id,
                displayName: context.security.getIdentity().displayName,
                type: context.security.getIdentity().type
            }
        });

        const stateAfterSecondApprove = await workflowStateContext.getTargetState(app, targetId);
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
