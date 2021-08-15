import { AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

const emptyResolver = () => ({});

export default new GraphQLSchemaPlugin<AdminUsersContext>({
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
});
