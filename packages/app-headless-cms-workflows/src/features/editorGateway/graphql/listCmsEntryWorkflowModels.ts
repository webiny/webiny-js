import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_WORKFLOW_MODELS = /* GraphQL */ `
    query ListCmsEntryWorkflowModels($search: String, $limit: Int, $after: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after) {
                data {
                    model
                    modelId
                    name
                    workflow {
                        id
                        name
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
