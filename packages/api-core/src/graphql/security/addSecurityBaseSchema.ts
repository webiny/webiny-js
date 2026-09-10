import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";

export const addSecurityBaseSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
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
    `);

    builder.addResolver({
        path: "Query.security",
        resolver: () => async () => ({})
    });

    builder.addResolver({
        path: "Mutation.security",
        resolver: () => async () => ({})
    });
};
