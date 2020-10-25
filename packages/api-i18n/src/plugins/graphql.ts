import { merge } from "lodash";
import gql from "graphql-tag";
import locales from "./graphql/locales";
import installation from "./graphql/installation";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-i18n",
    schema: {
        typeDefs: gql`
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

            type I18NCursors {
                next: String
                previous: String
            }

            type I18NListMeta {
                cursors: I18NCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            type I18NError {
                code: String
                message: String
                data: JSON
            }
            ${installation.typeDefs}
            ${locales.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    i18n: emptyResolver
                },
                Mutation: {
                    i18n: emptyResolver
                }
            },
            installation.resolvers,
            locales.resolvers
        )
    }
};

export default plugin;
