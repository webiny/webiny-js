import { createTopic } from "@webiny/pubsub";

import { CreateAcoParams, Folder } from "~/types";
import {
    AcoFolderCrud,
    OnFolderAfterCreateTopicParams,
    OnFolderAfterDeleteTopicParams,
    OnFolderAfterUpdateTopicParams,
    OnFolderBeforeCreateTopicParams,
    OnFolderBeforeDeleteTopicParams,
    OnFolderBeforeUpdateTopicParams
} from "./folder.types";

import { getFolderAndItsAncestors } from "~/utils/getFolderAndItsAncestors";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import NotAuthorizedError from "@webiny/api-security/NotAuthorizedError";

export const createFolderCrudMethods = ({
    storageOperations,
    getIdentity,
    getPermissions
}: CreateAcoParams): AcoFolderCrud => {
    // create
    const onFolderBeforeCreate = createTopic<OnFolderBeforeCreateTopicParams>(
        "aco.onFolderBeforeCreate"
    );
    const onFolderAfterCreate =
        createTopic<OnFolderAfterCreateTopicParams>("aco.onFolderAfterCreate");
    // update
    const onFolderBeforeUpdate = createTopic<OnFolderBeforeUpdateTopicParams>(
        "aco.onFolderBeforeUpdate"
    );
    const onFolderAfterUpdate =
        createTopic<OnFolderAfterUpdateTopicParams>("aco.onFolderAfterUpdate");
    // delete
    const onFolderBeforeDelete = createTopic<OnFolderBeforeDeleteTopicParams>(
        "aco.onFolderBeforeDelete"
    );
    const onFolderAfterDelete =
        createTopic<OnFolderAfterDeleteTopicParams>("aco.onFolderAfterDelete");

    interface CanAccessFolderParams {
        folder: Folder;
        rwd?: "r" | "w" | "d";
        foldersPermissions?: FolderPermissions[];

        // If `foldersPermissions` is not provided, we must provide the following three params.
        folders?: Folder[];
        identity?: SecurityIdentity;
        permissions?: SecurityPermission[];
    }

    const canAccessFolder = async (params: CanAccessFolderParams): Promise<boolean> => {
        const { folder } = params;

        let { foldersPermissions } = params;
        if (!foldersPermissions) {
            const { identity, permissions } = params;
            if (!identity || !permissions) {
                throw new Error(
                    `You must either provide "foldersPermissions" or "identity" and "permissions" to the "canAccessFolder" method.`
                );
            }

            const { folders } = params;
            foldersPermissions = await listFoldersPermissions({
                identity,
                permissions,
                folders
            });
        }

        const folderPermissions = foldersPermissions.find(fp => fp.folderId === folder.id);

        const hasPermissions = folderPermissions && folderPermissions.permissions.length > 0;
        if (!hasPermissions) {
            return false;
        }

        const identity = getIdentity();
        const userAccessLevel = folderPermissions.permissions.find(
            p => p.target === "user:" + identity.id
        )?.level;
        const teamAccessLevel = folderPermissions.permissions.find(
            p => p.target === "team:my-team"
        )?.level;

        if (!params.rwd || params.rwd === "r") {
            return !!(userAccessLevel || teamAccessLevel);
        }

        // If we are here, it means we are checking for "w" or "d" access. In this case,
        // we need to check if the user has "owner" access.
        const accessLevels = [userAccessLevel, teamAccessLevel];
        return accessLevels.includes("owner");
    };

    interface ListFoldersPermissionsParams {
        type?: string;
        folders?: Folder[];
        identity: SecurityIdentity;
        permissions: SecurityPermission[];
    }

    type FolderPermissions = { folderId: string; permissions: Folder["permissions"] };

    const listFoldersPermissions = async ({
        type,
        folders,
        identity,
        permissions
    }: ListFoldersPermissionsParams): Promise<FolderPermissions[]> => {
        if (!folders) {
            if (!type) {
                throw new Error(
                    `You must either provide "type" or "folders" to the "listFoldersPermissions" method.`
                );
            }

            folders = await storageOperations
                .listFolders({
                    where: { type },
                    limit: 10000
                })
                .then(result => result[0]);
        }

        const processedFolderPermissions: FolderPermissions[] = [];

        function processFolderPermissions(folder: Folder) {
            if (processedFolderPermissions.some(fp => fp.folderId === folder.id)) {
                return;
            }

            // Copy permissions, so we don't modify the original object.
            const currentFolderPermissions: FolderPermissions = {
                folderId: folder.id,
                permissions: folder.permissions.map(permission => ({ ...permission }))
            };

            // Check for permissions inherited from parent folder.
            if (folder.parentId) {
                const parentFolder = folders!.find(f => f.id === folder.parentId)!;
                if (parentFolder) {
                    let processedParentFolderPermissions = processedFolderPermissions.find(
                        fp => fp.folderId === parentFolder.id
                    );

                    if (!processedParentFolderPermissions) {
                        processFolderPermissions(parentFolder);
                        processedParentFolderPermissions = processedFolderPermissions.find(
                            fp => fp.folderId === folder.parentId
                        );
                    }

                    if (processedParentFolderPermissions) {
                        const inheritedPermissions =
                            processedParentFolderPermissions.permissions.map(p => {
                                return {
                                    ...p,
                                    inheritedFrom:
                                        "parent:" + processedParentFolderPermissions!.folderId
                                };
                            });

                        currentFolderPermissions.permissions.push(...inheritedPermissions);
                    }
                }
            }

            // Finally, let's also ensure that the current user is included in the permissions,
            // if not already. Let's also ensure the user is the first item in the array.
            const [firstPermission] = currentFolderPermissions.permissions;

            // If current identity is already listed as the first permission, we don't need to do anything.
            const identityFirstPermission = firstPermission?.target === `user:${identity.id}`;

            if (!identityFirstPermission) {
                const currentIdentityPermissionIndex =
                    currentFolderPermissions.permissions.findIndex(
                        p => p.target === "user:" + getIdentity().id
                    );

                if (currentIdentityPermissionIndex >= 0) {
                    const [identityPermission] = currentFolderPermissions.permissions.splice(
                        currentIdentityPermissionIndex,
                        1
                    );
                    currentFolderPermissions.permissions.unshift(identityPermission);
                } else {
                    // If the current identity is not in the permissions, let's add it.
                    // If the user has full access, we'll add it as "owner".
                    const hasFullAccess = permissions.some(p => p.name === "*");
                    if (hasFullAccess) {
                        currentFolderPermissions.permissions.unshift({
                            target: "user:" + identity.id,
                            level: "owner",
                            inheritedFrom: "role:full-access"
                        });
                    }
                }
            }

            processedFolderPermissions.push(currentFolderPermissions);
        }

        for (let i = 0; i < folders!.length; i++) {
            const folder = folders![i];
            processFolderPermissions(folder);
        }

        return processedFolderPermissions;
    };

    interface ProcessFolderPermissions {
        folders: Folder[];
        foldersPermissions?: FolderPermissions[];
        rwd?: "r" | "w" | "d";
        identity: SecurityIdentity;
        permissions: SecurityPermission[];
    }

    /**
     * Populates the `permissions` field on the given folders.
     * Additionally, filters out the folders that the current user doesn't have access to.
     * @param params
     */
    const processFoldersPermissions = async (
        params: ProcessFolderPermissions
    ): Promise<Folder[]> => {
        const { folders, identity, permissions } = params;
        if (folders.length === 0) {
            return [];
        }

        let { foldersPermissions } = params;
        if (!foldersPermissions) {
            foldersPermissions = await listFoldersPermissions({
                folders,
                identity,
                permissions
            });
        }

        // Filter out folders that the current user doesn't have access to.
        // Append extra permissions data to the folders that the user has access to.
        const processedFolders: Folder[] = [];

        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const canAccess = await canAccessFolder({ folder, foldersPermissions });
            if (canAccess) {
                const folderPermissions = foldersPermissions.find(fp => fp.folderId === folder.id);
                if (folderPermissions) {
                    folder.permissions = folderPermissions.permissions;
                } else {
                    folder.permissions = [];
                }

                processedFolders.push(folder);
            }
        }

        return processedFolders;
    };

    return {
        /**
         * Lifecycle events
         */
        onFolderBeforeCreate,
        onFolderAfterCreate,
        onFolderBeforeUpdate,
        onFolderAfterUpdate,
        onFolderBeforeDelete,
        onFolderAfterDelete,

        canAccessFolder,
        async get(id) {
            const folder = await storageOperations.getFolder({ id });

            if (await canAccessFolder({ folder, identity: getIdentity(), rwd: "r" })) {
                return folder;
            }

            throw new NotAuthorizedError();
        },
        async list(params) {
            const [folders, meta] = await storageOperations.listFolders(params);

            if (folders.length === 0) {
                return [folders, meta];
            }

            const identity = getIdentity();
            const permissions = await getPermissions("*");

            const processedFolders = await processFoldersPermissions({
                folders,
                rwd: "r",
                identity,
                permissions
            });

            const processedFoldersMeta = meta;
            return [processedFolders, processedFoldersMeta];
        },
        async create(data) {
            await onFolderBeforeCreate.publish({ input: data });
            const folder = await storageOperations.createFolder({ data });
            await onFolderAfterCreate.publish({ folder });
            return folder;
        },
        async update(id, data) {
            const original = await storageOperations.getFolder({ id });

            const canUpdateFolder = await canAccessFolder({
                folder: original,
                rwd: "w",
                identity: getIdentity(),
                permissions: await getPermissions("*")
            });

            if (!canUpdateFolder) {
                throw new NotAuthorizedError();
            }

            // Validate data.
            if (data.permissions) {
                for (let i = 0; i < data.permissions.length; i++) {
                    const permission = data.permissions[i];
                    const targetIsValid =
                        permission.target.startsWith("user:") ||
                        permission.target.startsWith("team:");
                    if (!targetIsValid) {
                        throw new Error(`Permission target "${permission.target}" is not valid.`);
                    }
                }
            }

            await onFolderBeforeUpdate.publish({ original, input: { id, data } });
            const folder = await storageOperations.updateFolder({ id, data });
            await onFolderAfterUpdate.publish({ original, input: { id, data }, folder });
            return folder;
        },
        async delete(id: string) {
            const folder = await storageOperations.getFolder({ id });
            await onFolderBeforeDelete.publish({ folder });
            await storageOperations.deleteFolder({ id });
            await onFolderAfterDelete.publish({ folder });
            return true;
        },
        async getFolderWithAncestors(id: string) {
            const { type } = await storageOperations.getFolder({ id });
            const [folders] = await storageOperations.listFolders({
                where: {
                    type
                },
                limit: 10000
            });
            return getFolderAndItsAncestors({ id, folders });
        }
    };
};
