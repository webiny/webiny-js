import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import { ensureAuthentication } from "~/utils/ensureAuthentication";
import { resolve } from "~/utils/resolve";

import { AcoContext, Folder } from "~/types";

export const folderSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        type FolderPermission {
            id: ID
            target: String!
            level: String!
            inheritedFrom: ID
            originallyInheritedFrom: ID
        }

        input FolderPermissionInput {
            id: ID
            target: String!
            level: String!
            inheritedFrom: ID
            originallyInheritedFrom: ID
        }

        type Folder {
            id: ID!
            title: String!
            slug: String!
            permissions: [FolderPermission]

            # Tells us if the current user can manage folder structure.
            canManageStructure: Boolean

            # Tells us if the current user can manage folder permissions.
            canManagePermissions: Boolean

            # Tells us if the current user can manage folder content.
            canManageContent: Boolean

            # Tells us if the folder contains non-inherited permissions.
            hasNonInheritedPermissions: Boolean

            type: String!
            parentId: ID
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: AcoUser
            modifiedBy: AcoUser
            savedBy: AcoUser
        }

        input FolderCreateInput {
            title: String!
            slug: String!
            permissions: [FolderPermissionInput]
            type: String!
            parentId: ID
        }

        input FolderUpdateInput {
            title: String
            slug: String
            permissions: [FolderPermissionInput]
            parentId: ID
        }

        input FoldersListWhereInput {
            type: String!
            parentId: String
            createdBy: ID
        }

        type FolderResponse {
            data: Folder
            error: AcoError
        }

        type FoldersListResponse {
            data: [Folder]
            error: AcoError
            meta: AcoMeta
        }

        type FolderLevelPermissionsTarget {
            id: ID!
            type: String!
            target: ID!
            name: String!
            meta: JSON
        }

        type FolderLevelPermissionsTargetsListMeta {
            totalCount: Int!
        }

        type FolderLevelPermissionsTargetsListResponse {
            data: [FolderLevelPermissionsTarget]
            meta: FolderLevelPermissionsTargetsListMeta
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

            listFolderLevelPermissionsTargets: FolderLevelPermissionsTargetsListResponse
        }

        extend type AcoMutation {
            createFolder(data: FolderCreateInput!): FolderResponse
            updateFolder(id: ID!, data: FolderUpdateInput!): FolderResponse
            deleteFolder(id: ID!): AcoBooleanResponse
        }
    `,
    resolvers: {
        Folder: {
            hasNonInheritedPermissions: (folder: Folder, _, context) => {
                return context.aco.folderLevelPermissions.permissionsIncludeNonInheritedPermissions(
                    folder.permissions
                );
            },
            canManageStructure: (folder, _, context) => {
                return context.aco.folderLevelPermissions.canManageFolderStructure(folder);
            },
            canManagePermissions: (folder, _, context) => {
                return context.aco.folderLevelPermissions.canManageFolderPermissions(folder);
            },
            canManageContent: (folder, _, context) => {
                return context.aco.folderLevelPermissions.canManageFolderContent(folder);
            }
        },
        AcoQuery: {
            getFolder: async (_, { id }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.aco.folder.get(id);
                });
            },
            listFolders: async (_, args: any, context) => {
                try {
                    ensureAuthentication(context);
                    const [entries, meta] = await context.aco.folder.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listFolderLevelPermissionsTargets: async (_, args: any, context) => {
                try {
                    ensureAuthentication(context);
                    const [entries, meta] =
                        await context.aco.folder.listFolderLevelPermissionsTargets();
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        AcoMutation: {
            createFolder: async (_, { data }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.aco.folder.create(data);
                });
            },
            updateFolder: async (_, { id, data }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.aco.folder.update(id, data);
                });
            },
            deleteFolder: async (_, { id }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.aco.folder.delete(id);
                });
            }
        }
    }
});
