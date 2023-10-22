import { AdminUsersContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

const emptyResolver = () => ({});

export default new GraphQLSchemaPlugin<AdminUsersContext>({
    typeDefs: /* GraphQL */ `
        type AdminUsersQuery {
            _empty: String
        }

        type AdminUsersMutation {
            _empty: String
        }

        extend type Query {
            adminUsers: AdminUsersQuery
        }

        extend type Mutation {
            adminUsers: AdminUsersMutation
        }

        type AdminUsersCreatedBy {
            id: ID
            displayName: String
        }

        type AdminUsersError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type AdminUsersBooleanResponse {
            data: Boolean
            error: AdminUsersError
        }
    `,
    resolvers: {
        Query: {
            adminUsers: emptyResolver
        },
        Mutation: {
            adminUsers: emptyResolver
        }
    }
});
