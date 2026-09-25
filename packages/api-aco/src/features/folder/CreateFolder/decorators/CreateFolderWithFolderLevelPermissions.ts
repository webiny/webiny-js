import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { CreateFolderUseCase } from "../abstractions.js";
import type { CreateFolderParams } from "~/folder/folder.types.js";
import type { Folder } from "~/folder/folder.types.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { createDecorator, Result } from "@webiny/feature/api";
import { FolderNotAuthorizedError } from "~/domain/folder/errors.js";
import { CodeFlpMerger } from "~/features/flp/shared/index.js";
import { CodeFlpsProvider } from "~/features/flp/shared/index.js";

class CreateFolderWithFolderLevelPermissionsImpl implements CreateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: CreateFolderUseCase.Interface;
    private readonly codeFlpsProvider?: CodeFlpsProvider.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        codeFlpsProvider: CodeFlpsProvider.Interface | undefined,
        decoretee: CreateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.codeFlpsProvider = codeFlpsProvider;
        this.decoretee = decoretee;
    }

    async execute(params: CreateFolderParams): CreateFolderUseCase.Return {
        let canCreateFolder: boolean;
        if (params.parentId) {
            const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                params.parentId
            );
            canCreateFolder = await this.folderLevelPermissions.canAccessFolder({
                permissions,
                rwd: "w"
            });
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

        const permissions = await this.withCodePermissions(folder, folder?.permissions ?? []);

        // Let's set default permissions based on the current user.
        const permissionsWithDefaults =
            await this.folderLevelPermissions.getDefaultPermissions(permissions);

        return Result.ok({
            ...folder,
            permissions: permissionsWithDefaults
        });
    }

    /**
     * Code-defined permissions are resolved from the folder's own type and path rather than the FLP
     * catalog: the record for a folder this new is written by an event handler and may not exist
     * yet. Without this the response would omit them until something refetched the folder.
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

export const CreateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: CreateFolderUseCase,
    decorator: CreateFolderWithFolderLevelPermissionsImpl,
    // `CodeFlpsProvider` is optional: `CodeFlpsFeature` does not register it unless the project has
    // the folder-level permissions entitlement.
    dependencies: [FolderLevelPermissions, [CodeFlpsProvider, { optional: true }]]
});
