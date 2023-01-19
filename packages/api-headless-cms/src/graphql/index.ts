import { createSystemSchemaPlugin } from "./system";
import { graphQLHandlerFactory, GraphQLHandlerFactoryParams } from "./graphQLHandlerFactory";
import { CmsGraphQLSchemaPlugin } from "~/plugins";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

const createBaseSchema = (): GraphQLSchemaPlugin<CmsContext>[] => {
    const cmsPlugin = new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type CmsCursors {
                next: String
                previous: String
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsBooleanResponse {
                data: Boolean
                error: CmsError
            }
        `,
        resolvers: {}
    });
    cmsPlugin.name = "graphql.cms.schema.base";
    const corePlugin = new GraphQLSchemaPlugin({
        typeDefs: cmsPlugin.schema.typeDefs,
        resolvers: cmsPlugin.schema.resolvers
    });
    corePlugin.name = "graphql.cms.core.schema.base";
    /**
     * Due to splitting of CMS and Core schema plugins, we must have both defined for CMS to work.
     */
    return [cmsPlugin, corePlugin];
};

export type CreateGraphQLParams = GraphQLHandlerFactoryParams;
export const createGraphQL = (params: CreateGraphQLParams) => {
    return [createBaseSchema(), createSystemSchemaPlugin(), graphQLHandlerFactory(params)];
};
