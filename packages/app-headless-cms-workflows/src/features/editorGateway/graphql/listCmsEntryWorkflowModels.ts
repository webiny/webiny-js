import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_WORKFLOW_MODELS = /* GraphQL */ `
    query ListCmsEntryWorkflowModels($search: String, $hasWorkflow: Boolean, $limit: Int, $after: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, hasWorkflow: $hasWorkflow, limit: $limit, after: $after) {
                data {
                    model
                    modelId
                    name
                    workflow {
                        id
                        name
                        stepCount
                    }
                }
                meta {
                    cursor
                    hasMoreItems
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
