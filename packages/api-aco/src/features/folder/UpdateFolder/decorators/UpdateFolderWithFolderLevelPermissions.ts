import { createDecorator, Result } from "@webiny/feature/api";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderUseCase } from "../abstractions.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { FolderCannotMoveToNewParent, FolderValidationError } from "~/domain/folder/errors.js";
import { CodeFlpMerger, CodeFlpsProvider } from "~/features/flp/shared/index.js";

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

        const permissions = await this.folderLevelPermissions.getDefaultPermissions(
            await this.withCodePermissions(original, params.permissions ?? [])
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
        return Result.ok({
            ...result.value,
            permissions: await this.folderLevelPermissions.getDefaultPermissions(
                await this.withCodePermissions(result.value, params.permissions ?? [])
            )
        });
    }

    /**
     * Code-defined permissions are resolved from the folder's own type and path rather than the FLP
     * catalog, so they apply even when the stored record is missing or not yet written.
     */
    private async withCodePermissions(
        folder: Pick<Folder, "type" | "path">,
        permissions: FolderPermission[]
    ): Promise<FolderPermission[]> {
        const codePermissions =
            (await this.codeFlpsProvider?.getPermissions({
                type: folder.type,
                path: folder.path
            })) ?? [];

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
