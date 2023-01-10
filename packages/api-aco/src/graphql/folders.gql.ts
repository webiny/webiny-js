import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { ACOContext } from "~/types";

export const foldersSchema = new GraphQLSchemaPlugin<ACOContext>({
    typeDefs: /* GraphQL */ `
        type Folder {
            id: ID!
            name: String!
            slug: String!
            type: String!
            parentId: ID
            createdOn: DateTime
            createdBy: FolderCreatedBy
        }

        input FolderCreateInput {
            name: String!
            slug: String!
            type: String!
            parentId: ID
        }

        input FolderUpdateInput {
            name: String
            slug: String
            parentId: ID
        }

        input FoldersListWhereInput {
            type: String!
        }

        type FolderResponse {
            data: Folder
            error: FolderError
        }

        type FoldersListResponse {
            data: [Folder]
            error: FolderError
        }

        extend type FoldersQuery {
            getFolder(id: ID!): FolderResponse
            listFolders(where: FoldersListWhereInput!): FoldersListResponse
        }

        extend type FoldersMutation {
            createFolder(data: FolderCreateInput!): FolderResponse
            updateFolder(id: ID!, data: FolderUpdateInput!): FolderResponse
            deleteFolder(id: ID!): FolderBooleanResponse
        }
    `,
    resolvers: {
        FoldersQuery: {
            getFolder: async (_, { id }, context) => {
                try {
                    const folder = await context.folders.getFolder({ id });
                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            listFolders: async (_, { where }, context) => {
                try {
                    const folders = await context.folders.listFolders({ where });
                    return new Response(folders);
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
            updateFolder: async (_, { id, data }, context) => {
                try {
                    const folder = await context.folders.updateFolder(id, data);
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
