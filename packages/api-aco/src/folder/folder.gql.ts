import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";

import type { CreateFolderTypeDefsParams } from "./createFolderTypeDefs.js";
import { createFolderTypeDefs } from "./createFolderTypeDefs.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import type { AcoContext, Folder } from "~/types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/abstractions.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/abstractions.js";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/abstractions.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folder/DeleteFolder/abstractions.js";
import { GetFolderHierarchyUseCase } from "~/features/folder/GetFolderHierarchy/abstractions.js";
import { ListFolderLevelPermissionsTargetsUseCase } from "~/features/folder/ListFolderLevelPermissionsTargets/abstractions.js";
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
                        const { folders, meta } = result.value;
                        return new ListResponse(folders, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
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
                        const result = await deleteFolderUseCase.execute(id);
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
