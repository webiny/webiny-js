import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createSystemSchemaPlugin } from "./system";
import { graphQLHandlerFactory, GraphQLHandlerFactoryParams } from "./graphQLHandlerFactory";
import { CmsContext } from "~/types";

const createBaseSchema = (): GraphQLSchemaPlugin<CmsContext> => {
    return {
        name: "cms.graphql.schema.base",
        type: "graphql-schema",
        schema: {
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
        }
    };
};

export type CreateGraphQLParams = GraphQLHandlerFactoryParams;
export const createGraphQL = (params: CreateGraphQLParams) => {
    return [createBaseSchema(), createSystemSchemaPlugin(), graphQLHandlerFactory(params)];
};
