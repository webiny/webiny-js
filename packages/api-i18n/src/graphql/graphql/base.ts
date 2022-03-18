import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

export const createBaseGraphQL = (): GraphQLSchemaPlugin => {
    return {
        type: "graphql-schema",
        name: "graphql-schema-i18n",
        schema: {
            typeDefs: /* GraphQL */ `
                type I18NQuery {
                    _empty: String
                }

                type I18NMutation {
                    _empty: String
                }

                extend type Query {
                    i18n: I18NQuery
                }

                extend type Mutation {
                    i18n: I18NMutation
                }

                type I18NBooleanResponse {
                    data: Boolean
                    error: I18NError
                }

                type I18NDeleteResponse {
                    data: Boolean
                    error: I18NError
                }

                type I18NListMeta {
                    cursor: String
                    hasMoreItems: Boolean
                    totalCount: Int
                }

                type I18NError {
                    code: String
                    message: String
                    data: JSON
                    stack: String
                }
            `,
            resolvers: {
                Query: {
                    i18n: emptyResolver
                },
                Mutation: {
                    i18n: emptyResolver
                }
            }
        }
    };
};
