import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { FoldersContext } from "~/types";

export default new GraphQLSchemaPlugin<FoldersContext>({
    typeDefs: /* GraphQL */ `
        type Folder {
            id: ID!
            name: String!
            slug: String!
            category: String!
            createdOn: DateTime
            createdBy: FolderCreatedBy
        }

        input FolderCreateInput {
            name: String!
            slug: String!
            category: String!
        }

        input FolderGetWhereInput {
            id: ID
            slug: String
            category: String
        }

        type FolderResponse {
            data: Folder
            error: FolderError
        }

        extend type FoldersQuery {
            getFolder(where: FolderGetWhereInput!): FolderResponse
        }

        extend type FoldersMutation {
            createFolder(data: FolderCreateInput!): FolderResponse
            deleteFolder(id: ID!): FolderBooleanResponse
        }
    `,
    resolvers: {
        FoldersQuery: {
            getFolder: async (_, { where }, context) => {
                try {
                    const folder = await context.folders.getFolder({ where });
                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },

        FoldersMutation: {
            createFolder: async (_, { data }, context) => {
                try {
                    const folder = await context.folders.createFolder(data);
                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            deleteFolder: async (_, { id }, context) => {
                try {
                    await context.folders.deleteFolder(id);
                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
