import { createDecorator, Result } from "@webiny/feature/api";
import type { UpdateFolderParams } from "~/folder/folder.types.js";
import type { FolderPermission } from "~/types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderUseCase } from "../abstractions.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { FolderCannotMoveToNewParent, FolderValidationError } from "~/domain/folder/errors.js";

/**
 * Compares the folder's own (non-inherited) permissions. The admin app sends the current
 * permissions with every update, e.g. a rename.
 */
const permissionsChanged = (
    original: FolderPermission[],
    updated: Pick<FolderPermission, "target" | "level">[]
) => {
    const normalize = (permissions: Pick<FolderPermission, "target" | "level">[]) => {
        return permissions
            .map(permission => `${permission.target}=${permission.level}`)
            .sort()
            .join(",");
    };
    return (
        normalize(original.filter(permission => !permission.inheritedFrom)) !== normalize(updated)
    );
};

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

    async execute(id: string, input: UpdateFolderParams): UpdateFolderUseCase.Return {
        /* GraphQL accepts `permissions: null`. Treat it as "no own permissions" so it goes
           through the same owner check as an empty list, instead of skipping the check and
           wiping the folder's permissions. */
        const params: UpdateFolderParams =
            input.permissions === null ? { ...input, permissions: [] } : input;

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

        // Changing who has access to the folder requires the "owner" level.
        if (
            Array.isArray(params.permissions) &&
            permissionsChanged(originalPermissions, params.permissions) &&
            !(await this.folderLevelPermissions.canManageFolderPermissions({
                id: original.id,
                parentId: original.parentId ?? "",
                slug: original.slug,
                path: original.path,
                type: original.type,
                permissions: originalPermissions
            }))
        ) {
            return Result.fail(
                new FolderValidationError(`Not allowed to change the folder permissions.`)
            );
        }

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
