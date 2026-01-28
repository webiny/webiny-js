import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { SecurityContext } from "~/types/security.js";

const emptyResolver = () => ({});

export default new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL */ `
        type SecurityMutation {
            _empty: String
        }

        type SecurityQuery {
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
            stack: String
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
