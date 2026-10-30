import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_WORKFLOW = /* GraphQL */ `
    query GetWebsiteBuilderPageWorkflow($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageWorkflow(id: $id) {
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
