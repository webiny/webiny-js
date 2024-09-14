import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

export const createBaseGraphQL = (): GraphQLSchemaPlugin => {
    return {
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

                type PbIdentity {
                    id: ID
                    displayName: String
                    type: String
                }

                type PbError {
                    code: String
                    message: String
                    data: JSON
                    stack: String
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
    };
};
