import { ContextPlugin } from "@webiny/api";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { folderSchema } from "~/folder/folder.gql";
import { AcoContext } from "~/types";
import { createSchema } from "~/record/record.gql";
import { appGql } from "~/apps/app.gql";

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

        type AcoSearchLocationType {
            folderId: ID!
        }
        input AcoSearchLocationInput {
            folderId: ID!
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
    return new ContextPlugin<AcoContext>(async context => {
        const searchRecordSchema = await createSchema(context);
        context.plugins.register([baseSchema, appGql, folderSchema, searchRecordSchema]);
    });
};
