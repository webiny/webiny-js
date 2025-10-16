import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";

import type { CreateFolderTypeDefsParams } from "./createFolderTypeDefs.js";
import { createFolderTypeDefs } from "./createFolderTypeDefs.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { compress } from "~/utils/compress.js";

import type { AcoContext, Folder } from "~/types.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";
import { FOLDER_MODEL_ID } from "~/folder/folder.model.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";

export const createFoldersSchema = (params: CreateFolderTypeDefsParams) => {
    const folderGraphQL = new GraphQLSchemaPlugin<AcoContext>({
        typeDefs: createFolderTypeDefs(params),
        resolvers: {
            Folder: {
                hasNonInheritedPermissions: (folder: Folder, _, context) => {
                    const flp = context.container.resolve(FolderLevelPermissions);
                    return flp.permissionsIncludeNonInheritedPermissions(folder.permissions ?? []);
                },
                canManageStructure: (folder, _, context) => {
                    const flp = context.container.resolve(FolderLevelPermissions);
                    return flp.canManageFolderStructure(folder);
                },
                canManagePermissions: (folder, _, context) => {
                    const flp = context.container.resolve(FolderLevelPermissions);
                    return flp.canManageFolderPermissions(folder);
                },
                canManageContent: (folder, _, context) => {
                    const flp = context.container.resolve(FolderLevelPermissions);
                    return flp.canManageFolderContent(folder);
                }
            },
            AcoQuery: {
                getFolderModel(_, __, context) {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.cms.getModel(FOLDER_MODEL_ID);
                    });
                },
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
                listFoldersCompressed: async (_, args: any, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);

                        const flp = context.container.resolve(FolderLevelPermissions);
                        const [entries] = await context.aco.folder.list(args);
                        const foldersPromises = entries.map(folder => {
                            const canManageStructure = flp.canManageFolderStructure(
                                folder as unknown as FolderLevelPermission
                            );
                            const canManagePermissions = flp.canManageFolderPermissions(
                                folder as unknown as FolderLevelPermission
                            );
                            const canManageContent = flp.canManageFolderContent(
                                folder as unknown as FolderLevelPermission
                            );
                            const hasNonInheritedPermissions =
                                flp.permissionsIncludeNonInheritedPermissions(
                                    folder.permissions ?? []
                                );

                            return Promise.all([
                                canManageStructure,
                                canManagePermissions,
                                canManageContent,
                                hasNonInheritedPermissions
                            ]).then(
                                ([
                                    canManageStructure,
                                    canManagePermissions,
                                    canManageContent,
                                    hasNonInheritedPermissions
                                ]) => {
                                    return {
                                        ...folder,
                                        canManageStructure,
                                        canManagePermissions,
                                        canManageContent,
                                        hasNonInheritedPermissions
                                    };
                                }
                            );
                        });

                        return Promise.all(foldersPromises).then(compress);
                    });
                },
                getFolderHierarchy: async (_, args: any, context) => {
                    try {
                        return resolve(() => {
                            ensureAuthentication(context);
                            return context.aco.folder.getFolderHierarchy(args);
                        });
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

    folderGraphQL.name = "aco.graphql.folders";

    return folderGraphQL;
};
