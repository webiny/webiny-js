import type { ReviewWorkflow } from "~/review/domain/types.js";
import { TARGET } from "./reviewTarget.js";

export const createWorkflow = (overrides: Partial<ReviewWorkflow> = {}): ReviewWorkflow => {
    return {
        id: "workflow-1",
        name: "Content review",
        namespaces: [TARGET.namespace],
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#FA5723",
                description: null,
                type: "review",
                allowManualPick: false,
                assignedAutomatically: false
            }
        ],
        ...overrides
    };
};
