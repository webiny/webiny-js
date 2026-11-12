import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { CreateFolderUseCase } from "../abstractions.js";
import type { CreateFolderParams } from "~/folder/folder.types.js";
import { createDecorator, Result } from "@webiny/feature/api";
import { FolderNotAuthorizedError, FolderValidationError } from "~/domain/folder/errors.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { validatePermissionsInput } from "~/features/folder/shared/validatePermissionsInput.js";

class CreateFolderWithFolderLevelPermissionsImpl implements CreateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: CreateFolderUseCase.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        decoretee: CreateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.decoretee = decoretee;
    }

    async execute(input: CreateFolderParams): CreateFolderUseCase.Return {
        // GraphQL input accepts `permissions` (and `null`); it is not part of the typed params.
        const params: CreateFolderParams & { permissions?: FolderPermission[] | null } = {
            ...input
        };
        if (params.permissions === null) {
            delete params.permissions;
        }
        const ownPermissions = params.permissions ?? [];

        // Security: validate permissions like on update.
        if (ownPermissions.length > 0) {
            const validationError = validatePermissionsInput(ownPermissions);
            if (validationError) {
                return Result.fail(validationError);
            }
        }

        let canCreateFolder: boolean;
        if (params.parentId) {
            const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                params.parentId
            );
            canCreateFolder = await this.folderLevelPermissions.canAccessFolder({
                permissions,
                rwd: "w"
            });

            /* Security: own permissions on a subfolder override the inherited ones (e.g. lock out
               the parent's owners), so setting them requires the "owner" level on the parent,
               the same as changing permissions of an existing folder. Root folders inherit
               nothing, so the creator may set any permissions on a folder they just created. */
            if (
                canCreateFolder &&
                ownPermissions.length > 0 &&
                this.folderLevelPermissions.canUseFolderLevelPermissions() &&
                !(await this.folderLevelPermissions.canManageFolderPermissions({
                    id: params.parentId,
                    parentId: "",
                    slug: "",
                    path: "",
                    type: params.type,
                    permissions
                }))
            ) {
                return Result.fail(
                    new FolderValidationError(`Not allowed to set the folder permissions.`)
                );
            }
        } else {
            canCreateFolder = this.folderLevelPermissions.canCreateFolderInRoot();
        }

        if (!canCreateFolder) {
            return Result.fail(new FolderNotAuthorizedError());
        }

        const result = await this.decoretee.execute(params);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const folder = result.value;

        // Let's set default permissions based on the current user.
        const permissionsWithDefaults = await this.folderLevelPermissions.getDefaultPermissions(
            folder?.permissions ?? []
        );

        return Result.ok({
            ...folder,
            permissions: permissionsWithDefaults
        });
    }
}

export const CreateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: CreateFolderUseCase,
    decorator: CreateFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
