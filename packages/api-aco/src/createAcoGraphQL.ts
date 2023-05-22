import { ContextPlugin } from "@webiny/api";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { folderSchema } from "~/folder/folder.gql";
import { AcoContext } from "~/types";
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

        input AcoSearchRecordTagListWhereInput {
            tags_in: [String!]
            tags_startsWith: String
            tags_not_startsWith: String
            createdBy: ID
            AND: [AcoSearchRecordTagListWhereInput!]
            OR: [AcoSearchRecordTagListWhereInput!]
        }

        type TagItem {
            tag: String!
            count: Int!
        }

        type AcoSearchRecordTagListResponse {
            data: [TagItem!]
            error: AcoError
            meta: AcoMeta
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
        context.plugins.register([baseSchema, appGql, folderSchema]);
    });
};
