import { ContextPlugin } from "@webiny/api";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";

import { folderSchema } from "~/folder/folder.gql";
import { searchRecordSchema } from "~/record/record.gql";

import { ACOContext } from "~/types";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type AcoQuery {
            _empty: String
        }

        type AcoMutation {
            _empty: String
        }

        type SearchQuery {
            _empty: String
        }

        type SearchMutation {
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
            savedOn: AcoSortDirection
            title: AcoSortDirection
        }

        extend type Query {
            aco: AcoQuery
            search: SearchQuery
        }

        extend type Mutation {
            aco: AcoMutation
            search: SearchMutation
        }
    `,
    resolvers: {
        Query: {
            aco: emptyResolver,
            search: emptyResolver
        },
        Mutation: {
            aco: emptyResolver,
            search: emptyResolver
        }
    }
});

export const createAcoGraphQL = () => {
    return new ContextPlugin<ACOContext>(context => {
        context.plugins.register([baseSchema, folderSchema, searchRecordSchema]);
    });
};
