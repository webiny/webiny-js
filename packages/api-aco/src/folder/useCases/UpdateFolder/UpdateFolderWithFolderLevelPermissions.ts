import { NotAuthorizedError } from "@webiny/api-security";
import WError from "@webiny/error";
import type { AcoFolderStorageOperations, UpdateFolderParams } from "~/folder/folder.types.js";
import type { IUpdateFolder } from "./IUpdateFolder.js";
import type { FolderLevelPermissions } from "~/flp/index.js";

export class UpdateFolderWithFolderLevelPermissions implements IUpdateFolder {
    private folderLevelPermissions: FolderLevelPermissions;
    private readonly getOperation: AcoFolderStorageOperations["getFolder"];
    private readonly decoretee: IUpdateFolder;

    constructor(
        folderLevelPermissions: FolderLevelPermissions,
        getOperation: AcoFolderStorageOperations["getFolder"],
        decoretee: IUpdateFolder
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(id: string, params: UpdateFolderParams) {
        const original = await this.getOperation({ id });
        const originalPermissions = await this.folderLevelPermissions.getFolderLevelPermissions(id);

        // Let's ensure current identity's permission allows the update operation.
        await this.folderLevelPermissions.ensureCanAccessFolder({
            permissions: originalPermissions,
            rwd: "w"
        });

        const permissions = await this.folderLevelPermissions.getDefaultPermissions(
            params.permissions ?? []
        );

        // Check if the user still has access to the folder with the provided permissions.
        const stillHasAccess = await this.folderLevelPermissions.canAccessFolder({
            permissions,
            rwd: "w"
        });

        if (!stillHasAccess) {
            throw new WError(
                `Cannot continue because you would loose access to this folder.`,
                "CANNOT_LOOSE_FOLDER_ACCESS"
            );
        }

        // Validate data.
        if (Array.isArray(params.permissions)) {
            params.permissions.forEach(permission => {
                const targetIsValid =
                    permission.target.startsWith("admin:") || permission.target.startsWith("team:");
                if (!targetIsValid) {
                    throw new Error(`Permission target "${permission.target}" is not valid.`);
                }

                if (permission.inheritedFrom) {
                    throw new Error(`Permission "inheritedFrom" cannot be set manually.`);
                }
            });
        }

        // Parent change is not allowed if the user doesn't have access to the new parent.
        if (params.parentId && params.parentId !== original.parentId) {
            try {
                // Getting the parent folder permissions will throw an error if the user doesn't have access.
                const parentPermissions =
                    await this.folderLevelPermissions.getFolderLevelPermissions(params.parentId);

                await this.folderLevelPermissions.ensureCanAccessFolder({
                    permissions: parentPermissions,
                    rwd: "w"
                });
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

        const folder = await this.decoretee.execute(id, params);

        return {
            ...folder,
            permissions
        };
    }
}
