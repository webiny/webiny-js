import { merge } from "lodash";
import menus from "./graphql/menus.gql";
import pages from "./graphql/pages.gql";
import pageElements from "./graphql/pageElements.gql";
import categories from "./graphql/categories.gql";
import install from "./graphql/install.gql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

export default [
    {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbCreatedBy {
                    id: ID
                    displayName: String
                }

                type PbError {
                    code: String
                    message: String
                    data: JSON
                }

                type PbDeleteResponse {
                    data: Boolean
                    error: PbError
                }

                type PbBooleanResponse {
                    data: Boolean
                    error: PbError
                }

                type PbCursors {
                    next: String
                    previous: String
                }

                type PbQuery {
                    pageBuilder: PbQuery
                }

                type PbMutation {
                    pageBuilder: PbMutation
                }

                extend type Query {
                    pageBuilder: PbQuery
                }

                extend type Mutation {
                    pageBuilder: PbMutation
                }
            `,
            resolvers: merge({
                Query: {
                    pageBuilder: emptyResolver
                },
                Mutation: {
                    pageBuilder: emptyResolver
                }
            })
        }
    },
    menus,
    categories,
    pages,
    pageElements,
    install
] as GraphQLSchemaPlugin[];
