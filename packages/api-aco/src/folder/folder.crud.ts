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
import NotAuthorizedError from "@webiny/api-security/NotAuthorizedError";
import { AdminUser } from "@webiny/api-admin-users/types";
import { Team } from "@webiny/api-security/types";
import structuredClone from "@ungap/structured-clone";
import WError from "@webiny/error";

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

            const canGetFolder = await folderLevelPermissions.canAccessFolder({
                folder,
                rwd: "r"
            });

            if (!canGetFolder) {
                throw new NotAuthorizedError();
            }

            await folderLevelPermissions.assignFolderPermissions(folder);
            return folder;
        },
        async list(params) {
            const [folders, meta] = await storageOperations.listFolders(params);
            if (folders.length === 0) {
                return [folders, meta];
            }

            const filteredFolders = await folderLevelPermissions.filterFolders({
                folders,
                rwd: "r"
            });

            await folderLevelPermissions.assignFolderPermissions(filteredFolders);

            const processedFoldersMeta = { ...meta }; // TODO: Process meta.
            return [filteredFolders, processedFoldersMeta];
        },

        async listAll(params) {
            return this.list({ ...params, limit: 10000 });
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

            folderLevelPermissions.invalidateCache();
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

            // Let's prepare a custom folder permissions list, where the folder contains the updated data.
            const customFoldersList = await folderLevelPermissions
                .listAllFolders(original.type)
                .then(folders => {
                    const foldersClone = structuredClone<Folder[]>(folders);
                    return foldersClone.map(folder => {
                        if (folder.id === id) {
                            Object.assign(folder, data);
                        }
                        return folder;
                    });
                });

            const stillHasAccess = await folderLevelPermissions.canAccessFolder({
                folder: { id, type: original.type },
                rwd: "w",
                foldersList: customFoldersList
            });

            if (!stillHasAccess) {
                throw new WError(
                    `Cannot continue because you would loose access to this folder.`,
                    "CANNOT_LOOSE_FOLDER_ACCESS"
                );
            }

            // TODO: Detect unallowed parent change.

            await onFolderBeforeUpdate.publish({ original, input: { id, data } });
            const folder = await storageOperations.updateFolder({ id, data });
            await onFolderAfterUpdate.publish({ original, input: { id, data }, folder });

            folderLevelPermissions.invalidateCache();
            await folderLevelPermissions.assignFolderPermissions(folder);
            return folder;
        },

        async delete(id: string) {
            const folder = await storageOperations.getFolder({ id });

            const canDeleteFolder = await folderLevelPermissions.canAccessFolder({
                folder,
                rwd: "d"
            });

            if (!canDeleteFolder) {
                throw new NotAuthorizedError();
            }

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

                return {
                    id: user.id,
                    type: "identity",
                    target: `admin:${user.id}`,
                    name,
                    meta: {
                        image: user.avatar?.src || null,
                        email: user.email
                    }
                };
            });

            const results = [...teamTargets, ...adminUserTargets];
            const meta = { totalCount: results.length };

            return [results, meta];
        }
    };
};
