import { createTopic } from "@webiny/pubsub";

import { CreateAcoParams, ListFoldersParams, Folder, FolderAccessLevel } from "~/types";
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
import { SecurityIdentity } from "@webiny/api-security/types";
import NotAuthorizedError from "@webiny/api-security/NotAuthorizedError";

export const createFolderCrudMethods = ({
    storageOperations,
    getIdentity
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

    const setPermissionsFieldOnFolder = (folder: Folder, allFolders: Folder[]) => {
        const hasPermissionsDefined = folder.permissions?.length > 0;
        if (hasPermissionsDefined) {
            return folder.permissions;
        }

        const hasParent = !!folder.parentId;
        if (!hasParent) {
            return [];
        }

        const parentFolder = allFolders.find(f => f.id === folder.parentId);
        const parentFolderPermissions = setPermissionsFieldOnFolder(parentFolder!, allFolders);

        folder.permissions = parentFolderPermissions;

        return folder.permissions;
    };

    const listFoldersPermissions = async (
        params: ListFoldersParams
    ): Promise<Pick<Folder, "id" | "slug" | "permissions">[]> => {
        const [folders] = await storageOperations.listFolders({
            where: {
                type: params.where.type
            },
            limit: 10000
        });

        folders.forEach(folder => {
            folder.permissions = setPermissionsFieldOnFolder(folder, folders);
        });

        return folders;
    };

    interface ListFolderPermissionsParams {
        folder: Folder;
        foldersPermissions?: Pick<Folder, "id" | "slug" | "permissions">[];
    }

    const listFolderPermissions = async (
        params: ListFolderPermissionsParams
    ): Promise<Folder["permissions"]> => {
        const { folder } = params;
        let { foldersPermissions } = params;

        if (!foldersPermissions) {
            foldersPermissions = await listFoldersPermissions({
                where: { type: folder.type }
            });
        }

        return foldersPermissions.find(f => f.id === folder.id)!.permissions;
    };

    interface CanAccessFolderParams {
        identity: SecurityIdentity;
        folder: Folder;
        foldersPermissions?: Pick<Folder, "id" | "slug" | "permissions">[];
        rwd?: "r" | "w" | "d";
    }

    const canAccessFolder = async (params: CanAccessFolderParams): Promise<boolean> => {
        const { folder, foldersPermissions } = params;
        const folderPermissions = await listFolderPermissions({ folder, foldersPermissions });

        const hasPermissionsDefined = folderPermissions?.length > 0;
        if (!hasPermissionsDefined) {
            return true;
        }

        const identity = getIdentity();
        const userAccessLevel = folderPermissions.find(p => p.target === identity.id)?.level;
        const teamAccessLevel = folderPermissions.find(p => p.target === "team:my-team")?.level;

        if (!params.rwd || params.rwd === "r") {
            return !!(userAccessLevel || teamAccessLevel);
        }

        // If we are here, it means we are checking for "w" or "d" access. In this case,
        // we need to check if the user has "owner" or "editor" access.
        const accessLevels = [userAccessLevel, teamAccessLevel];
        return accessLevels.includes("owner") || accessLevels.includes("editor");
    };

    interface FilterAccessibleFoldersParams {
        identity: SecurityIdentity;
        folders: Folder[];
        foldersPermissions?: Pick<Folder, "id" | "slug" | "permissions">[];
        rwd?: "r" | "w" | "d";
    }

    const filterAccessibleFolders = async (
        params: FilterAccessibleFoldersParams
    ): Promise<Folder[]> => {
        const { folders } = params;
        if (folders.length === 0) {
            return [];
        }

        // Just take the type from the first folder.
        const folderType = folders[0].type;

        let { foldersPermissions } = params;
        if (!foldersPermissions) {
            foldersPermissions = await listFoldersPermissions({
                where: { type: folderType }
            });
        }

        const accessibleFolders = [];
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const canAccess = await canAccessFolder({ folder, foldersPermissions, ...params });
            if (canAccess) {
                accessibleFolders.push(folder);
            }
        }
        return accessibleFolders;
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

            const accessibleFolders = await filterAccessibleFolders({
                identity: getIdentity(),
                folders,
                rwd: "r"
            });

            return [accessibleFolders, meta];
        },
        async create(data) {
            await onFolderBeforeCreate.publish({ input: data });
            const folder = await storageOperations.createFolder({ data });
            await onFolderAfterCreate.publish({ folder });
            return folder;
        },
        async update(id, data) {
            const original = await storageOperations.getFolder({ id });
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
