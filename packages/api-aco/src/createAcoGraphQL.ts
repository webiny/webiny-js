import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { filterSchema } from "~/filter/filter.gql.js";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type AcoQuery {
            _empty: String
        }

        type AcoMutation {
            _empty: String
        }

        type AcoMeta {
            hasMoreItems: Boolean
            totalCount: Int
            cursor: String
        }

        type AcoUser {
            id: ID
            displayName: String
            type: String
        }

        type AcoError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type AcoBooleanResponse {
            data: Boolean
            error: AcoError
        }

        enum AcoSortDirection {
            ASC
            DESC
        }

        input AcoSort {
            id: AcoSortDirection
            createdOn: AcoSortDirection
            modifiedOn: AcoSortDirection
            savedOn: AcoSortDirection
            title: AcoSortDirection
        }

        extend type Query {
            aco: AcoQuery
        }

        extend type Mutation {
            aco: AcoMutation
        }
    `,
    resolvers: {
        Query: {
            aco: emptyResolver
        },
        Mutation: {
            aco: emptyResolver
        }
    }
});

// The dynamic folder schema (field plugins + folders schema) is built per-request by AcoInitializer,
// which needs the resolved per-tenant folder model. Here we only provide the static base + filter
// schema plugins.
export const createAcoGraphQL = () => {
    return [baseSchema, filterSchema];
};
