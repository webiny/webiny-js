import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const STORE_WEBSITE_BUILDER_PAGE_WORKFLOW = /* GraphQL */ `
    mutation StoreWebsiteBuilderPageWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        websiteBuilder {
            storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
