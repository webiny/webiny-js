import { createImplementation } from "@webiny/di";
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/loadPages/ListPagesGqlGateway.js";

class WorkflowStatesListPagesGraphQLFieldSelection
    implements ListPagesGraphQLFieldSelection.Interface
{
    getSelection(): string[] {
        // i want this to throw so i know it was hit
        throw new Error("Method not implemented.");
    }
}

export const WorkflowStateListPagesFieldSelection = createImplementation({
    abstraction: ListPagesGraphQLFieldSelection,
    dependencies: [],
    implementation: WorkflowStatesListPagesGraphQLFieldSelection
});
