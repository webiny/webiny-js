import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/loadPages/abstractions.js";

class WorkflowStatesListPagesGraphQLFieldSelection
    implements ListPagesGraphQLFieldSelection.Interface
{
    getSelection(): string[] {
        // i want this to throw so i know it was hit
        throw new Error("Method not implemented.");
    }
}

export const WorkflowStateListPagesFieldSelection =
    ListPagesGraphQLFieldSelection.createImplementation({
        dependencies: [],
        implementation: WorkflowStatesListPagesGraphQLFieldSelection
    });
