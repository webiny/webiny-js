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
            # transferred from CmsEntryState - maybe we can share it somehow in the future?
            type WbPageState {
                workflowId: String
                stepId: ID
                stepName: String
                state: WorkflowStateStateValue
            }

            type WbPageWorkflow {
                state: WbPageState
            }

            extend type WbPage {
                workflows: WbPageWorkflow
            }

            input ListWhereInputWbPageState {
                workflowId: String
                stepId: ID
                state: CmsEntryStateType
                stepName: String
            }

            input WbPagesListWhereInputWorkflow {
                state: ListWhereInputWbPageState
            }

            extend input WbPagesListWhereInput {
                workflows: WbPagesListWhereInputWorkflow
            }
        `,
        resolvers: {
            WbPage: {
                workflows: async page => {
                    const state = page.state;
                    if (!state) {
                        return null;
                    }
                    return {
                        state
                    };
                }
            }
        }
    });
};
