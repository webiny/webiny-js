import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";

class WorkflowStateGetEntryFieldSelectionImpl implements GetEntryGraphQLFieldSelection.Interface {
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

export const WorkflowStateGetEntryFieldSelection =
    GetEntryGraphQLFieldSelection.createImplementation({
        dependencies: [],
        implementation: WorkflowStateGetEntryFieldSelectionImpl
    });
