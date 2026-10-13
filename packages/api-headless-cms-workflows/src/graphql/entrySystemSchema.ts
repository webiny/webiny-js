import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins/index.js";

/**
 * `system.workflow` of a CMS entry on the CMS endpoints, in the stored shape
 * (`ReviewSystemWorkflow`, spec 4.5, R102).
 */
export const createEntrySystemSchemaExtension = () => {
    return new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsEntrySystemWorkflow {
                workflowId: String
                reviewState: String
                stepId: String
                stepName: String
                stepState: String
            }

            extend type CmsEntrySystem {
                workflow: CmsEntrySystemWorkflow
            }
        `
    });
};
