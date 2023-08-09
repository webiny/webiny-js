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
        action?: "create" | "update" | "delete" | "read";
    }

    const canAccessFolder = async (params: CanAccessFolderParams) => {
        const { folder, foldersPermissions } = params;
        const folderPermissions = await listFolderPermissions({ folder, foldersPermissions });

        const hasPermissionsDefined = folderPermissions?.length > 0;
        if (!hasPermissionsDefined) {
            return true;
        }

        const identity = getIdentity();
        const userPermission = folderPermissions.find(p => p.target === identity.id);
        const teamPermission = folderPermissions.find(p => p.target === "team:my-team");

        if (!params.action) {
            return userPermission || teamPermission;
        }

        const {action} = params;

        return false;
        // if (userPermission) {
        //     if (userPermission.level === params.level) {
        //         return true;
        //     }
        // }
        //
        // if (teamPermission) {
        //     if (teamPermission.level === params.level) {
        //         return true;
        //     }
        // }
        //
        // return false;
    };

    const filterInaccessibleFolders = async (folders, options: { level?: FolderAccessLevel }) => {
        const filteredFolders = [];
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            const canAccess = await canAccessFolder(folder, options);
            if (canAccess) {
                filteredFolders.push(folder);
            }
        }
        return filteredFolders;
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
        async get(id) {
            return storageOperations.getFolder({ id });
        },
        async list(params) {
            const [folders, meta] = storageOperations.listFolders(params);

            if (folders.length === 0) {
                return [folders, meta];
            }

            const [allFolders] = this.listAll({ where: { type: params.where.type } });
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
