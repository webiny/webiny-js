import { createDecorator, Result } from "@webiny/feature/api";
import type { Folder } from "~/folder/folder.types.js";
import type { UpdateFolderParams } from "~/folder/folder.types.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderUseCase } from "../abstractions.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { FolderCannotMoveToNewParent, FolderValidationError } from "~/domain/folder/errors.js";
import { CodeFlpMerger } from "~/features/flp/shared/index.js";
import { CodeFlpsProvider } from "~/features/flp/shared/index.js";
import { Path } from "~/utils/Path.js";

class UpdateFolderWithFolderLevelPermissionsImpl implements UpdateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: UpdateFolderUseCase.Interface;
    private readonly codeFlpsProvider?: CodeFlpsProvider.Interface;

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        folderLevelPermissions: FolderLevelPermissions.Interface,
        codeFlpsProvider: CodeFlpsProvider.Interface | undefined,
        decoretee: UpdateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.codeFlpsProvider = codeFlpsProvider;
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

        // The guard below asks whether the user keeps access once the update is saved. A new slug or
        // a new parent changes the path, and code-defined rules match on the path, so resolve them
        // against where the folder is going rather than where it is now.
        const targetFolder = await this.getTargetFolder(original, params);

        const submittedPermissions = await this.withCodePermissions(
            targetFolder,
            params.permissions ?? []
        );

        const permissions =
            await this.folderLevelPermissions.getDefaultPermissions(submittedPermissions);

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

                if (permission.plugin) {
                    return Result.fail(
                        new FolderValidationError(
                            `Permission "plugin" cannot be set manually. Code-defined permissions are managed via an "FlpFactory".`
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

        // Resolved again against the updated folder: a rename or a move changes the path, and with
        // it which code-defined rules apply.
        const updatedPermissions = await this.withCodePermissions(
            result.value,
            params.permissions ?? []
        );

        const updatedPermissionsWithDefaults =
            await this.folderLevelPermissions.getDefaultPermissions(updatedPermissions);

        return Result.ok({
            ...result.value,
            permissions: updatedPermissionsWithDefaults
        });
    }

    /**
     * The type and path the folder will have after this update, computed the same way
     * `UpdateFolderRepository` computes them: the submitted slug and parent, falling back to the
     * current ones.
     */
    private async getTargetFolder(
        original: Folder,
        params: UpdateFolderParams
    ): Promise<Pick<Folder, "type" | "path">> {
        const slug = params.slug || original.slug;
        const parentId = params.parentId !== undefined ? params.parentId : original.parentId;

        // Same parent: only the last segment of the path can change, so it is derived from the
        // current path. This avoids reading the parent, which the user may not have access to.
        if (parentId === original.parentId) {
            const parentPath = original.path.slice(0, -(original.slug.length + 1));
            const path = Path.create(slug, parentPath);

            return { type: original.type, path };
        }

        if (!parentId) {
            const path = Path.create(slug);

            return { type: original.type, path };
        }

        // A move. If the destination cannot be read, keep the current path: the parent check further
        // down rejects the move with its own error.
        const parentResult = await this.getFolder.execute(parentId);
        if (parentResult.isFail()) {
            return original;
        }

        const path = Path.create(slug, parentResult.value.path);

        return { type: original.type, path };
    }

    /**
     * Code-defined permissions are resolved from the folder's own type and path rather than the FLP
     * catalog, so they apply even when the stored record is missing or not yet written.
     */
    private async withCodePermissions(
        folder: Pick<Folder, "type" | "path">,
        permissions: FolderPermission[]
    ): Promise<FolderPermission[]> {
        if (!this.codeFlpsProvider) {
            return permissions;
        }

        const codePermissions = await this.codeFlpsProvider.getPermissions({
            type: folder.type,
            path: folder.path
        });

        return CodeFlpMerger.mergePermissions(permissions, codePermissions);
    }
}

export const UpdateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: UpdateFolderUseCase,
    decorator: UpdateFolderWithFolderLevelPermissionsImpl,
    // `CodeFlpsProvider` is optional: `CodeFlpsFeature` does not register it unless the project has
    // the folder-level permissions entitlement.
    dependencies: [GetFolderUseCase, FolderLevelPermissions, [CodeFlpsProvider, { optional: true }]]
});
