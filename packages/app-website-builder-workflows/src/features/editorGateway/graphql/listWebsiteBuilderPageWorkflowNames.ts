import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

/*
 * The page workflows with only what the model row needs: the id, the name and the bound
 * namespaces. The editor loads the whole workflow later with `getWebsiteBuilderPageWorkflow`.
 */
export const LIST_WEBSITE_BUILDER_PAGE_WORKFLOW_NAMES = /* GraphQL */ `
    query ListWebsiteBuilderPageWorkflowNames {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
                data {
                    id
                    name
                    models
                    steps {
                        id
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
