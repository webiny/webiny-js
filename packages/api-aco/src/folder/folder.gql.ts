import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import { checkPermissions } from "~/utils/checkPermissions";
import { resolve } from "~/utils/resolve";

import { AcoContext } from "~/types";

export const folderSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        type Folder {
            id: ID!
            title: String!
            slug: String!
            type: String!
            parentId: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: AcoUser
        }

        input FolderCreateInput {
            title: String!
            slug: String!
            type: String!
            parentId: ID
        }

        input FolderUpdateInput {
            title: String
            slug: String
            parentId: ID
        }

        input FoldersListWhereInput {
            type: String!
            parentId: String
        }

        type FolderResponse {
            data: Folder
            error: AcoError
        }

        type FoldersListResponse {
            data: [Folder]
            error: AcoError
        }

        extend type AcoQuery {
            getFolder(id: ID!): FolderResponse
            listFolders(
                where: FoldersListWhereInput!
                limit: Int
                after: String
                sort: AcoSort
            ): FoldersListResponse
        }

        extend type AcoMutation {
            createFolder(data: FolderCreateInput!): FolderResponse
            updateFolder(id: ID!, data: FolderUpdateInput!): FolderResponse
            deleteFolder(id: ID!): AcoBooleanResponse
        }
    `,
    resolvers: {
        AcoQuery: {
            getFolder: async (_, { id }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.folder.get(id));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listFolders: async (_, args: any, context) => {
                try {
                    await checkPermissions(context);
                    const [entries, meta] = await context.aco.folder.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        AcoMutation: {
            createFolder: async (_, { data }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.folder.create(data));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateFolder: async (_, { id, data }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.folder.update(id, data));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteFolder: async (_, { id }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.folder.delete(id));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
