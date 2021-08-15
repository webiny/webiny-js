import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import merge from "lodash/merge";
import system from "./graphql/system";

const emptyResolver = () => ({});

export default () => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsError {
                    code: String
                    message: String
                    data: JSON
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

                extend type Query {
                    cms: CmsQuery
                }

                extend type Mutation {
                    cms: CmsMutation
                }

                type CmsQuery {
                    _empty: String
                }

                type CmsMutation {
                    _empty: String
                }

                ${system.typeDefs}
            `,
            resolvers: merge(
                {
                    Query: {
                        cms: emptyResolver
                    },
                    Mutation: {
                        cms: emptyResolver
                    }
                },
                system.resolvers
            )
        }
    } as GraphQLSchemaPlugin
];
