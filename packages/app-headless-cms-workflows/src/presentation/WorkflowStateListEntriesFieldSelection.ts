import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";

class WorkflowStateListEntriesFieldSelectionImpl
    implements ListEntriesGraphQLFieldSelection.Interface
{
    getSelection(): string[] {
        return [
            `meta {
                system {
                    workflow {
                        workflowId
                        stepId
                        stepName
                        state
                    }
                }
            }`
        ];
    }
}

export const WorkflowStateListEntriesFieldSelection =
    ListEntriesGraphQLFieldSelection.createImplementation({
        dependencies: [],
        implementation: WorkflowStateListEntriesFieldSelectionImpl
    });
