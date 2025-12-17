import { createDecorator, Result } from "@webiny/feature/api";
import type { UpdateFolderParams } from "~/folder/folder.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderUseCase } from "../abstractions.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { FolderCannotMoveToNewParent, FolderValidationError } from "~/domain/folder/errors.js";

class UpdateFolderWithFolderLevelPermissionsImpl implements UpdateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: UpdateFolderUseCase.Interface;

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        folderLevelPermissions: FolderLevelPermissions.Interface,
        decoretee: UpdateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.decoretee = decoretee;
    }

    async execute(id: string, params: UpdateFolderParams): UpdateFolderUseCase.Return {
        const originalResult = await this.getFolder.execute(id);

        if (originalResult.isFail()) {
            return Result.fail(originalResult.error);
        }

        const original = originalResult.value;

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
            return Result.fail(
                new FolderValidationError(
                    `Cannot continue because you would loose access to this folder.`
                )
            );
        }

        // Validate data.
        if (Array.isArray(params.permissions)) {
            for (const permission of params.permissions) {
                const targetIsValid =
                    permission.target.startsWith("admin:") || permission.target.startsWith("team:");
                if (!targetIsValid) {
                    return Result.fail(
                        new FolderValidationError(
                            `Permission target "${permission.target}" is not valid.`
                        )
                    );
                }

                if (permission.inheritedFrom) {
                    return Result.fail(
                        new FolderValidationError(
                            `Permission "inheritedFrom" cannot be set manually.`
                        )
                    );
                }
            }
        }

        // Parent change is not allowed if the user doesn't have access to the new parent.
        if (params.parentId && params.parentId !== original.parentId) {
            // Getting the parent folder permissions will throw an error if the user doesn't have access.
            const parentPermissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                params.parentId
            );

            const canAccessFolder = await this.folderLevelPermissions.canAccessFolder({
                permissions: parentPermissions,
                rwd: "w"
            });

            if (!canAccessFolder) {
                return Result.fail(new FolderCannotMoveToNewParent());
            }
        }

        const result = await this.decoretee.execute(id, params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok({
            ...result.value,
            permissions
        });
    }
}

export const UpdateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: UpdateFolderUseCase,
    decorator: UpdateFolderWithFolderLevelPermissionsImpl,
    dependencies: [GetFolderUseCase, FolderLevelPermissions]
});
