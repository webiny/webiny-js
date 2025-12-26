import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";

export const createWebsiteBuilderPageGraphQLExtension = () => {
    return new GraphQLSchemaPlugin({
        isApplicable: context => {
            const wcpContext = context.container.resolve(WcpContext);
            return wcpContext.canUseWorkflows();
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
