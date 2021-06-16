import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-security-base",
    schema: {
        typeDefs: `
            type SecurityQuery {
                _empty: String
            }

            type SecurityMutation {
                _empty: String
            }

            extend type Query {
                security: SecurityQuery
            }

            extend type Mutation {
                security: SecurityMutation
            }
            
            type SecurityCreatedBy {
                id: ID
                displayName: String
            }

            type SecurityError {
                code: String
                message: String
                data: JSON
            }

            type SecurityBooleanResponse {
                data: Boolean
                error: SecurityError
            }
        `,
        resolvers: {
            Query: {
                security: emptyResolver
            },
            Mutation: {
                security: emptyResolver
            }
        }
    }
};

export default plugin;
