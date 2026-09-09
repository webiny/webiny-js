import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";

const BASE_TYPE_DEFS = /* GraphQL */ `
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
`;

/**
 * The static ACO base schema (root Query.aco / Mutation.aco wrappers + shared types). The dynamic
 * folder schema (field plugins + folders schema) is built by AcoFolderSchemaFactory, which awaits
 * the per-tenant folder model when the schema is built. The filter schema comes from
 * addFilterSchema.
 */
export const addAcoBaseSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(BASE_TYPE_DEFS);
    builder.addResolver({ path: "Query.aco", dependencies: [], resolver: () => () => ({}) });
    builder.addResolver({ path: "Mutation.aco", dependencies: [], resolver: () => () => ({}) });
};
