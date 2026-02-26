import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";

export const createWebsiteBuilderPageGraphQLExtension = () => {
    return new GraphQLSchemaPlugin({
        isApplicable: context => {
            const wcpContext = context.container.resolve(WcpContext);
            return wcpContext.canUseWorkflows();
        },
        typeDefs: /* GraphQL */ `
            extend type WbPage {
                system: CmsEntrySystem
            }

            extend input WbPagesListWhereInput {
                workflow: ListWhereInputCmsEntrySystemWorkflowInput
            }
        `,
        resolvers: {
            WbPage: {
                system: async (page: WbPage) => {
                    return page.system;
                }
            }
        }
    });
};
