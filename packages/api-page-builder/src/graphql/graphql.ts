import menus from "./graphql/menus.gql";
import pages from "./graphql/pages.gql";
import pageElements from "./graphql/pageElements.gql";
import pageExportTask from "./graphql/pageExportTasks.gql";
import categories from "./graphql/categories.gql";
import settings from "./graphql/settings.gql";
import install from "./graphql/install.gql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

export default [
    {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                input PbFileInput {
                    id: ID!
                    src: String!
                }

                type PbFile {
                    id: ID!
                    src: String!
                }

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
            resolvers: {
                Query: {
                    pageBuilder: emptyResolver
                },
                Mutation: {
                    pageBuilder: emptyResolver
                }
            }
        }
    },
    menus,
    categories,
    pages,
    pageElements,
    settings,
    install,
    pageExportTask
] as GraphQLSchemaPlugin[];
