import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS = /* GraphQL */ `
    query ListWebsiteBuilderPageWorkflows {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
                data {
                    ${WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
