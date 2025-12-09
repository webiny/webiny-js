import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/loadPages/abstractions.js";

class WorkflowStatesListPagesGraphQLFieldSelection
    implements ListPagesGraphQLFieldSelection.Interface
{
    getSelection(): string[] {
        return [
            `state {
                workflowId
                stepId
                state
                savedBy {
                    id
                    displayName
                    type
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
