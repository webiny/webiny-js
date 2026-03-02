import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/loadPages/abstractions.js";

class WorkflowStatesListPagesGraphQLFieldSelection
    implements ListPagesGraphQLFieldSelection.Interface
{
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

export const WorkflowStateListPagesFieldSelection =
    ListPagesGraphQLFieldSelection.createImplementation({
        dependencies: [],
        implementation: WorkflowStatesListPagesGraphQLFieldSelection
    });
