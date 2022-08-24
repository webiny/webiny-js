import { Response, ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { FoldersContext } from "../types";

export default new GraphQLSchemaPlugin<FoldersContext>({
    typeDefs: /* GraphQL */ `
        type Folder {
            id: ID
            name: String
            slug: String
            type: String
            createdOn: DateTime
            createdBy: SecurityCreatedBy
        }

        type FolderResponse {
            data: Folder
            error: FolderError
        }

        type FolderListResponse {
            data: [Folder]
            error: FolderError
        }

        extend type FolderQuery {
            getFolder(id: ID!): FolderResponse
            listFolders: FolderListResponse
        }
    `,
    resolvers: {
        FoldersQuery: {
            async getFolder(_, args: any, context) {
                try {
                    const folder = await context.folders.getFolder(args.id);

                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async listFolders(_, args: any, context) {
                try {
                    const folders = await context.folders.listFolders(args);

                    return new ListResponse(folders);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },

        FoldersMutation: {
            async createFolder(_, args: any, context) {
                try {
                    const folder = await context.folders.createFolder(args.data);

                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async updateFolder(_, args: any, context) {
                try {
                    const folder = await context.folders.updateFolder(args.id, args.data);

                    return new Response(folder);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            async deleteFolder(_, args: any, context) {
                try {
                    await context.folders.deleteFolder(args.id);

                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
