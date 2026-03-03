import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";

class WorkflowStatesGetPageGraphQLFieldSelection implements GetPageGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [
            `system {
                workflow {
                    workflowId
                    stepId
                    stepName
                    state
                }
            }`
        ];
    }
}

export const WorkflowStateGetPageFieldSelection = GetPageGraphQLFieldSelection.createImplementation(
    {
        dependencies: [],
        implementation: WorkflowStatesGetPageGraphQLFieldSelection
    }
);
