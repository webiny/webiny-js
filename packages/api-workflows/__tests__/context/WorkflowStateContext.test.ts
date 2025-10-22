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
        expect(state.isActive).toBeTrue();
        expect(state).toBeDefined();
        expect(state.app).toBe(app);
        expect(state.workflowId).toBe(workflow.id);
        expect(state.targetRevisionId).toBe("record-id#0001");
        expect(state.targetId).toBe("record-id");
        expect(state.steps).toEqual([
            ...workflow.steps.map(step => {
                return {
                    isAllowedToReview: true,
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

        const getResponse = await workflowStateContext.getTargetState(app, targetRevisionId);

        expect(getResponse.done).toBeFalse();
        expect(getResponse.activeStep).toEqual({
            ...state.steps[0]
        });
        expect(getResponse).toEqual({
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
        const { workflowStateContext, workflowsContext, context } = await createContext();
        const app = "testingApp";
        const targetId = "record-id#0001";
        const mockWorkflow = createMockWorkflow({
            app
        });
        await workflowsContext.storeWorkflow(app, mockWorkflow.id, mockWorkflow);

        const state = await workflowStateContext.createState(app, targetId);

        expect(state.done).toBeFalse();
        expect(state.state).toEqual(WorkflowStateRecordState.pending);

        const listStatesResponse = await workflowStateContext.listStates();
        expect(listStatesResponse.items.length).toBe(1);
        expect(listStatesResponse.items[0]).toEqual(state);

        await state.start();

        const stateAfterReview = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterReview.state).toEqual(WorkflowStateRecordState.inReview);
        expect(stateAfterReview.steps[0].state).toEqual(WorkflowStateRecordState.inReview);

        await stateAfterReview.approve("First step should be approved.");

        expect(stateAfterReview.steps[0]).toEqual({
            id: "step-1",
            isAllowedToReview: true,
            title: state.steps[0].title,
            description: state.steps[0].description,
            color: state.steps[0].color,
            notifications: state.steps[0].notifications,
            teams: state.steps[0].teams,
            state: WorkflowStateRecordState.approved,
            comment: "First step should be approved.",
            savedBy: {
                id: context.security.getIdentity().id,
                displayName: context.security.getIdentity().displayName,
                type: context.security.getIdentity().type
            }
        });

        const stateAfterFirstApprove = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterFirstApprove.state).toEqual(WorkflowStateRecordState.pending);
        expect(stateAfterFirstApprove.steps[0].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterFirstApprove.steps[1].state).toEqual(
            WorkflowStateRecordState.pending
        );

        await stateAfterFirstApprove.start();
        await stateAfterFirstApprove.approve("Second step should be approved.");

        expect(stateAfterFirstApprove.steps[1]).toEqual({
            id: "step-2",
            isAllowedToReview: true,
            title: state.steps[1].title,
            description: state.steps[1].description,
            color: state.steps[1].color,
            teams: state.steps[1].teams,
            notifications: state.steps[1].notifications,
            state: WorkflowStateRecordState.approved,
            comment: "Second step should be approved.",
            savedBy: {
                id: context.security.getIdentity().id,
                displayName: context.security.getIdentity().displayName,
                type: context.security.getIdentity().type
            }
        });

        const stateAfterSecondApprove = await workflowStateContext.getTargetState(app, targetId);
        expect(stateAfterSecondApprove.state).toEqual(WorkflowStateRecordState.approved);
        expect(stateAfterSecondApprove.steps[0].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterSecondApprove.steps[1].state).toEqual(
            WorkflowStateRecordState.approved
        );
        expect(stateAfterSecondApprove.done).toBeTrue();
    });
});
