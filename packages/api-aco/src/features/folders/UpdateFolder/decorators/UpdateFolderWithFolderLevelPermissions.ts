import { createDecorator } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-security";
import WError from "@webiny/error";
import type { UpdateFolderParams } from "~/folder/folder.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderUseCase } from "../abstractions.js";
import { FolderStorageOperations } from "~/features/folders/shared/abstractions.js";

class UpdateFolderWithFolderLevelPermissionsImpl implements UpdateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly storageOperations: FolderStorageOperations.Interface;
    private readonly decoretee: UpdateFolderUseCase.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        storageOperations: FolderStorageOperations.Interface,
        decoretee: UpdateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.storageOperations = storageOperations;
        this.decoretee = decoretee;
    }

    async execute(id: string, params: UpdateFolderParams) {
        const original = await this.storageOperations.getFolder({ id });
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
                    rwd: "r"
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

export const UpdateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: UpdateFolderUseCase,
    decorator: UpdateFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions, FolderStorageOperations]
});
