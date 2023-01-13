import { createSystemSchemaPlugin } from "./system";
import { graphQLHandlerFactory, GraphQLHandlerFactoryParams } from "./graphQLHandlerFactory";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

const createBaseSchema = (): CmsGraphQLSchemaPlugin => {
    const plugin = new CmsGraphQLSchemaPlugin({
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
    plugin.name = "cms.graphql.schema.base";
    return plugin;
};

export type CreateGraphQLParams = GraphQLHandlerFactoryParams;
export const createGraphQL = (params: CreateGraphQLParams) => {
    return [createBaseSchema(), createSystemSchemaPlugin(), graphQLHandlerFactory(params)];
};
