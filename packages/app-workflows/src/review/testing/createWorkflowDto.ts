import type { WorkflowDto } from "~/review/gateway/dto.js";

// A workflow as the server lists it, bound to the given namespaces, with one manual-pick review step.
export const createWorkflowDto = (id: string, models: string[]): WorkflowDto => {
    return {
        id,
        name: `Workflow ${id}`,
        models,
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#2f80ed",
                description: null,
                type: "review",
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: true, rules: [] }
                }
            }
        ]
    };
};
