import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { Context } from "~/types.js";

export const createWebsiteBuilderPageGraphQLExtension = () => {
    return new GraphQLSchemaPlugin<Context>({
        isApplicable: context => {
            if (!context.wcp.canUseWorkflows()) {
                return false;
            } else if (!context.workflows) {
                return false;
            } else if (!context.websiteBuilder) {
                return false;
            }
            return true;
        },
        typeDefs: /* GraphQL */ `
            # CmsEntryStateType
            enum WbPageStateType {
                pending
                inReview
                rejected
                approved
            }

            # CmsEntryState
            type WbPageState {
                workflowId: String
                stepId: ID
                stepName: String
                state: WbPageStateType
            }

            extend type WbPage {
                state: WbPageState
            }

            input ListWhereInputWbPageState {
                workflowId: String
                stepId: ID
                state: CmsEntryStateType
                stepName: String
            }

            extend input WbPagesListWhereInput {
                state: ListWhereInputWbPageState
            }
        `
    });
};
