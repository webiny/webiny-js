import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapWorkflow } from "./mapWorkflow.js";
import type { WorkflowDto } from "./dto.js";
import type { WorkflowStepDto } from "./dto.js";

const createStep = (overrides: Partial<WorkflowStepDto> = {}): WorkflowStepDto => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#2f80ed",
        description: "Check the copy.",
        type: "review",
        config: {
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        },
        ...overrides
    };
};

const createWorkflow = (steps: WorkflowStepDto[]): WorkflowDto => {
    return {
        id: "workflow-1",
        name: "Editorial",
        models: ["cms.article", "cms.page"],
        steps
    };
};

describe("mapWorkflow", () => {
    it("maps models to namespaces and every step field", () => {
        const workflow = mapWorkflow(createWorkflow([createStep()]));

        expect(workflow).toEqual({
            id: "workflow-1",
            name: "Editorial",
            namespaces: ["cms.article", "cms.page"],
            steps: [
                {
                    id: "step-1",
                    title: "Editorial check",
                    color: "#2f80ed",
                    description: "Check the copy.",
                    type: "review",
                    allowManualPick: false,
                    assignedAutomatically: false
                }
            ]
        });
    });

    it("sets assignedAutomatically for a review step whose strategy is not none (R246)", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: { assignment: { strategy: "none" } } }),
                createStep({ id: "b", config: { assignment: { strategy: "roundRobin" } } }),
                createStep({ id: "c", config: { assignment: { strategy: "leastLoaded" } } })
            ])
        );

        expect(workflow.steps.map(step => step.assignedAutomatically)).toEqual([false, true, true]);
    });

    it("leaves assignedAutomatically false when the config or the strategy is absent or unreadable", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: null }),
                createStep({ id: "b", config: {} }),
                createStep({ id: "c", config: { assignment: null } }),
                createStep({ id: "d", config: { assignment: {} } }),
                createStep({ id: "e", config: { assignment: { strategy: 1 } } })
            ])
        );

        expect(workflow.steps.map(step => step.assignedAutomatically)).toEqual([
            false,
            false,
            false,
            false,
            false
        ]);
    });

    it("sets allowManualPick for a review step that allows it", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({
                    config: {
                        teams: ["team-1"],
                        assignment: { strategy: "none", allowManualPick: true, rules: [] }
                    }
                })
            ])
        );

        expect(workflow.steps[0].allowManualPick).toBe(true);
    });

    it("leaves allowManualPick false when the config or the flag is absent or not true", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: null }),
                createStep({ id: "b", config: {} }),
                createStep({ id: "c", config: { assignment: null } }),
                createStep({ id: "d", config: { assignment: {} } }),
                createStep({ id: "e", config: { assignment: { allowManualPick: "true" } } })
            ])
        );

        expect(workflow.steps.map(step => step.allowManualPick)).toEqual([
            false,
            false,
            false,
            false,
            false
        ]);
    });

    it("never allows a manual pick on a step that is not a review step", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({
                    type: "ai",
                    config: { assignment: { allowManualPick: true, strategy: "roundRobin" } }
                })
            ])
        );

        expect(workflow.steps[0].allowManualPick).toBe(false);
        expect(workflow.steps[0].assignedAutomatically).toBe(false);
    });

    it("maps an absent description to null", () => {
        const step = createStep({
            description: undefined as unknown as WorkflowStepDto["description"]
        });
        const workflow = mapWorkflow(createWorkflow([step]));

        expect(workflow.steps[0].description).toBeNull();
    });
});
