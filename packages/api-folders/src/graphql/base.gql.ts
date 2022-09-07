import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { FoldersContext } from "~/types";

const emptyResolver = () => ({});

export const baseSchema = new GraphQLSchemaPlugin<FoldersContext>({
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

        enum FolderType {
            page
            cms
            file
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
