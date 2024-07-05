import { createTopic } from "@webiny/pubsub";
import { validation } from "@webiny/validation";
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
import NotAuthorizedError from "@webiny/api-security/NotAuthorizedError";
import { AdminUser } from "@webiny/api-admin-users/types";
import { Team } from "@webiny/api-security/types";
import WError from "@webiny/error";

const FIXED_FOLDER_LISTING_LIMIT = 10_000;

interface CreateFolderCrudMethodsParams extends CreateAcoParams {
    listAdminUsers: () => Promise<AdminUser[]>;
    listTeams: () => Promise<Team[]>;
}

export const createFolderCrudMethods = ({
    storageOperations,
    folderLevelPermissions,
    listAdminUsers,
    listTeams
}: CreateFolderCrudMethodsParams): AcoFolderCrud => {
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

        async get(id) {
            const folder = await storageOperations.getFolder({ id });

            await folderLevelPermissions.ensureCanAccessFolder({
                folder,
                rwd: "r"
            });

            await folderLevelPermissions.assignFolderPermissions(folder);
            return folder;
        },
        async list(params) {
            // No matter what was the limit set in the params, initially, we always retrieve
            // all folders. The limit is then applied with the filtered folders list below.
            const filteredFolders = await folderLevelPermissions
                .listAllFoldersWithPermissions(params.where.type)
                .then(filteredFolders => {
                    // If `parentId` was included in the `where` clause, we need to filter the folders.
                    // TODO: we might want to incorporate this into the `listAllFoldersWithPermissions` method.
                    if (params.where.parentId) {
                        // Filter by parent ID.
                        return filteredFolders.filter(
                            folder => folder.parentId === params.where.parentId
                        );
                    }
                    return filteredFolders;
                });

            const totalCount = filteredFolders.length;
            let hasMoreItems = false;
            let cursor: string | null = null;

            // Apply cursor/limit params.
            if (params.after) {
                const afterListItemIndex = filteredFolders.findIndex(
                    folder => folder.id === params.after
                );
                if (afterListItemIndex >= 0) {
                    // Remove all items below the "after" item.
                    filteredFolders.splice(0, afterListItemIndex + 1);
                }
            }

            hasMoreItems = !!params.limit && filteredFolders.length > params.limit;

            if (hasMoreItems) {
                cursor = filteredFolders[params.limit! - 1]?.id || null;
                filteredFolders.splice(params.limit!);
            }

            return [filteredFolders, { totalCount, hasMoreItems, cursor }];
        },

        async listAll(params) {
            return this.list({ ...params, limit: FIXED_FOLDER_LISTING_LIMIT });
        },

        async create(data) {
            let canCreateFolder = false;
            if (data.parentId) {
                const parentFolder = await storageOperations.getFolder({ id: data.parentId });
                canCreateFolder = await folderLevelPermissions.canAccessFolder({
                    folder: parentFolder,
                    rwd: "w"
                });
            } else {
                canCreateFolder = await folderLevelPermissions.canCreateFolderInRoot();
            }

            if (!canCreateFolder) {
                throw new NotAuthorizedError();
            }

            await onFolderBeforeCreate.publish({ input: data });
            const folder = await storageOperations.createFolder({ data });

            // We need to add the newly created folder to FLP's internal cache. Note that we're also
            // invalidating the permissions list cache for the folder type. We cannot rely on the cache
            // to check if the user has access, because the cache is no longer up to date.
            folderLevelPermissions.invalidateFoldersPermissionsListCache(folder.type);
            folderLevelPermissions.updateFoldersCache(folder.type, cachedFolders => {
                return [...cachedFolders, folder];
            });

            // With caches updated and invalidated, we can now assign correct permissions to the folder.
            await folderLevelPermissions.assignFolderPermissions(folder);

            await onFolderAfterCreate.publish({ folder });

            return folder;
        },

        async update(id, data) {
            const original = await storageOperations.getFolder({ id });

            const canUpdateFolder = await folderLevelPermissions.canAccessFolder({
                folder: original,
                rwd: "w"
            });

            if (!canUpdateFolder) {
                throw new NotAuthorizedError();
            }

            // Validate data.
            if (Array.isArray(data.permissions)) {
                data.permissions.forEach(permission => {
                    const targetIsValid =
                        permission.target.startsWith("admin:") ||
                        permission.target.startsWith("team:");
                    if (!targetIsValid) {
                        throw new Error(`Permission target "${permission.target}" is not valid.`);
                    }

                    if (permission.inheritedFrom) {
                        throw new Error(`Permission "inheritedFrom" cannot be set manually.`);
                    }
                });
            }

            // Parent change is not allowed if the user doesn't have access to the new parent.
            if (data.parentId && data.parentId !== original.parentId) {
                try {
                    // Getting the parent folder will throw an error if the user doesn't have access.
                    await this.get(data.parentId);
                } catch (e) {
                    if (e instanceof NotAuthorizedError) {
                        throw new WError(
                            `Cannot move folder to a new parent because you don't have access to the new parent.`,
                            "CANNOT_MOVE_FOLDER_TO_NEW_PARENT"
                        );
                    }

                    // If we didn't receive the expected error, we still want to throw it.
                    throw e;
                }
            }

            // Assign permission ID to the permissions that don't have it.
            if (Array.isArray(data.permissions)) {
                data.permissions.forEach(permission => {
                    if (!permission.id) {
                        permission.id = folderLevelPermissions.generatePermissionId();
                    }
                });
            }

            // Finally, we check if the user would lose access to the folder by making the update.
            // In order to do this, we need to make a couple of steps. First, we're updating FLP's
            // internal cache with new folder data. Then, we're invalidating the permissions list
            // cache for the folder type. We cannot rely on the cache to check if the user still
            // has access, because the cache might no longer be up-to-date.
            folderLevelPermissions.updateFoldersCache(original.type, cachedFolders => {
                return cachedFolders.map(currentFolder => {
                    if (currentFolder.id !== id) {
                        return currentFolder;
                    }
                    return { ...currentFolder, ...data };
                });
            });
            folderLevelPermissions.invalidateFoldersPermissionsListCache(original.type);

            // With caches updated and invalidated, we can now check if the user still
            // has access to the folder.
            const stillHasAccess = await folderLevelPermissions.canAccessFolder({
                folder: { id, type: original.type },
                rwd: "w"
            });

            if (!stillHasAccess) {
                throw new WError(
                    `Cannot continue because you would loose access to this folder.`,
                    "CANNOT_LOOSE_FOLDER_ACCESS"
                );
            }

            await onFolderBeforeUpdate.publish({ original, input: { id, data } });

            const folder = await storageOperations.updateFolder({ id, data });
            await folderLevelPermissions.assignFolderPermissions(folder);

            await onFolderAfterUpdate.publish({ original, input: { id, data }, folder });

            return folder;
        },

        async delete(id: string) {
            const folder = await storageOperations.getFolder({ id });

            await folderLevelPermissions.ensureCanAccessFolder({
                folder,
                rwd: "d"
            });

            await onFolderBeforeDelete.publish({ folder });
            await storageOperations.deleteFolder({ id });
            await onFolderAfterDelete.publish({ folder });
            return true;
        },

        async getAncestors(folder: Folder) {
            const [folders] = await this.listAll({ where: { type: folder.type } });
            return getFolderAndItsAncestors({ folder, folders });
        },

        /**
         * @deprecated use `getAncestors` instead
         */
        async getFolderWithAncestors(id: string) {
            const folder = await this.get(id);
            return this.getAncestors(folder);
        },

        async listFolderLevelPermissionsTargets() {
            const adminUsers = await listAdminUsers();
            const teams = await listTeams();

            const teamTargets = teams.map(team => ({
                id: team.id,
                type: "team",
                target: `team:${team.id}`,
                name: team.name || "",
                meta: {}
            }));

            const adminUserTargets = adminUsers.map(user => {
                let name = user.displayName;
                if (!name) {
                    // For backwards compatibility, we also want to try concatenating first and last name.
                    name = [user.firstName, user.lastName].filter(Boolean).join(" ");
                }

                // We're doing the validation because, with non-Cognito IdPs (Okta, Auth0), the email
                // field might actually contain a non-email value: `id:${IdP_Identity_ID}`. In that case,
                // let's not assign anything to the `email` field.
                let email: string | null = user.email;
                try {
                    validation.validateSync(email, "email");
                } catch {
                    email = null;
                }

                const image = user.avatar?.src || null;

                return {
                    id: user.id,
                    type: "admin",
                    target: `admin:${user.id}`,
                    name,
                    meta: {
                        email,
                        image
                    }
                };
            });

            const results = [...teamTargets, ...adminUserTargets];
            const meta = { totalCount: results.length };

            return [results, meta];
        }
    };
};
