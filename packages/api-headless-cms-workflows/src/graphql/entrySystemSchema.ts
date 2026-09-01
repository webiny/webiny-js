import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms/plugins/index.js";

export const createEntrySystemSchemaExtension = () => {
    return new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsEntrySystemWorkflow {
                workflowId: String
                stepId: ID
                stepName: String
                state: String
            }

            extend type CmsEntrySystem {
                workflow: CmsEntrySystemWorkflow
            }
        `
    });
};
