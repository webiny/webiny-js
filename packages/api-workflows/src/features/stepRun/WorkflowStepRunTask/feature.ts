import { createFeature } from "@webiny/feature/api";
import { WorkflowStepRunTaskDefinition } from "./WorkflowStepRunTaskDefinition.js";

export const WorkflowStepRunTaskFeature = createFeature({
    name: "Workflows/WorkflowStepRunTask",
    register(container) {
        // Only the definition is registered; the runner builds the handler with
        // `resolveImplementation(definition.handler)`, as for every other task.
        container.register(WorkflowStepRunTaskDefinition);
    }
});
