import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";

import type { CreateFolderTypeDefsParams } from "./createFolderTypeDefs.js";
import { createFolderTypeDefs } from "./createFolderTypeDefs.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { compress } from "~/utils/compress.js";

import type { AcoContext, Folder } from "~/types.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { GetFolderUseCase } from "~/features/folders/GetFolder/abstractions.js";
import { ListFoldersUseCase } from "~/features/folders/ListFolders/abstractions.js";
import { CreateFolderUseCase } from "~/features/folders/CreateFolder/abstractions.js";
import { UpdateFolderUseCase } from "~/features/folders/UpdateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/DeleteFolder/abstractions.js";
import { GetFolderHierarchyUseCase } from "~/features/folders/GetFolderHierarchy/abstractions.js";
import { ListFolderLevelPermissionsTargetsUseCase } from "~/features/folders/ListFolderLevelPermissionsTargets/abstractions.js";
import { FolderModel } from "~/domain/folder/abstractions.js";

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
                    return resolve(async () => {
                        ensureAuthentication(context);
                        return context.container.resolve(FolderModel);
                    });
                },
                getFolder: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const getFolderUseCase = context.container.resolve(GetFolderUseCase);
                        const result = await getFolderUseCase.execute(id);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                listFolders: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const listFoldersUseCase = context.container.resolve(ListFoldersUseCase);
                        const result = await listFoldersUseCase.execute(args);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        const [entries, meta] = result.value;
                        return new ListResponse(entries, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listFoldersCompressed: async (_, args: any, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);

                        const flp = context.container.resolve(FolderLevelPermissions);
                        const listFoldersUseCase = context.container.resolve(ListFoldersUseCase);
                        const result = await listFoldersUseCase.execute(args);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        const [entries] = result.value;
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
                        return resolve(async () => {
                            ensureAuthentication(context);
                            const getFolderHierarchyUseCase =
                                context.container.resolve(GetFolderHierarchyUseCase);
                            const result = await getFolderHierarchyUseCase.execute(args);
                            if (result.isFail()) {
                                throw result.error;
                            }
                            return result.value;
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listFolderLevelPermissionsTargets: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const listTargetsUseCase = context.container.resolve(
                            ListFolderLevelPermissionsTargetsUseCase
                        );
                        const result = await listTargetsUseCase.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        const [entries, meta] = result.value;
                        return new ListResponse(entries, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            AcoMutation: {
                createFolder: async (_, { data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const createFolderUseCase = context.container.resolve(CreateFolderUseCase);
                        const result = await createFolderUseCase.execute(data);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                updateFolder: async (_, { id, data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const updateFolderUseCase = context.container.resolve(UpdateFolderUseCase);
                        const result = await updateFolderUseCase.execute(id, data);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                deleteFolder: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const deleteFolderUseCase = context.container.resolve(DeleteFolderUseCase);
                        const result = await deleteFolderUseCase.execute({ id });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return true;
                    });
                }
            }
        }
    });

    folderGraphQL.name = "aco.graphql.folders";

    return folderGraphQL;
};
