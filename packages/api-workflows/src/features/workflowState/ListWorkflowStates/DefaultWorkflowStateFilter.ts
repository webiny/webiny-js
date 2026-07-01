import { WorkflowStateFilter } from "./WorkflowStateFilter.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

class PassThroughWorkflowStateFilter implements WorkflowStateFilter.Interface {
    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        return items;
    }
}

export const DefaultWorkflowStateFilter = WorkflowStateFilter.createImplementation({
    implementation: PassThroughWorkflowStateFilter,
    dependencies: []
});
