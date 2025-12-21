import { Result } from "@webiny/feature/api";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import { ListFoldersUseCase } from "../abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { ROOT_FOLDER } from "~/constants.js";

class ListFoldersWithFolderLevelPermissionsImpl implements ListFoldersUseCase.Interface {
    private flpCatalog: Map<string, FolderPermission[]> = new Map();

    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: ListFoldersUseCase.Interface
    ) {}

    async execute(params: ListFoldersParams): ListFoldersUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const [folders, meta] = result.value;

        // Fetch FLP records for ROOT folders and populate the catalog.
        const rootFlps = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: {
                type: params.where.type,
                parentId: ROOT_FOLDER
            }
        });

        rootFlps.forEach(flp => this.setFlp(flp.id, flp.permissions));

        // Fetch FLP for folders not already in the catalog.
        await Promise.all(
            folders.map(async folder => {
                if (!this.hasFlp(folder.id)) {
                    const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                        folder.id
                    );
                    this.setFlp(folder.id, permissions);
                }
            })
        );

        // Filter folders based on permissions.
        const foldersWithPermissions = await Promise.all(
            folders.map(async folder => {
                const permissions = this.getFlp(folder.id);
                if (!permissions) {
                    return null;
                }

                const canAccessFolder = await this.folderLevelPermissions.canAccessFolder({
                    permissions,
                    rwd: "r"
                });

                if (!canAccessFolder) {
                    return null;
                }

                const folderWithFlp = { ...folder, permissions };
                return canAccessFolder ? folderWithFlp : null;
            })
        );

        return Result.ok([foldersWithPermissions.filter(Boolean) as Folder[], meta]);
    }

    private hasFlp(id: string): boolean {
        return this.flpCatalog.has(id);
    }

    private getFlp(id: string): FolderPermission[] | undefined {
        return this.flpCatalog.get(id);
    }

    private setFlp(id: string, permissions: FolderPermission[]): void {
        this.flpCatalog.set(id, permissions);
    }
}

export const ListFoldersWithFolderLevelPermissions = ListFoldersUseCase.createDecorator({
    decorator: ListFoldersWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
