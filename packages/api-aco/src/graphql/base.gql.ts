import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ACOContext } from "~/types";

const emptyResolver = () => ({});

export const baseSchema = new GraphQLSchemaPlugin<ACOContext>({
    typeDefs: /* GraphQL */ `
        type FoldersQuery {
            _empty: String
        }

        type FoldersMutation {
            _empty: String
        }

        extend type Query {
            folders: FoldersQuery
        }

        extend type Mutation {
            folders: FoldersMutation
        }

        type FolderCreatedBy {
            id: ID
            displayName: String
        }

        type FolderError {
            code: String
            message: String
            data: JSON
        }

        type FolderBooleanResponse {
            data: Boolean
            error: FolderError
        }

        type ListMeta {
            cursor: String
            totalCount: Int
            hasMoreItems: Boolean
        }
    `,
    resolvers: {
        Query: {
            folders: emptyResolver
        },
        Mutation: {
            folders: emptyResolver
        }
    }
});
