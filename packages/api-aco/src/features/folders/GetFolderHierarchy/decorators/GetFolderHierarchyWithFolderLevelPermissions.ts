import { createDecorator } from "@webiny/feature/api";
import type { FolderPermission } from "~/flp/flp.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { GetFolderHierarchyUseCase } from "../abstractions.js";
import type {
    Folder,
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";

class GetFolderHierarchyWithFolderLevelPermissionsImpl
    implements GetFolderHierarchyUseCase.Interface
{
    private flpCatalog: Map<string, FolderPermission[]> = new Map();

    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetFolderHierarchyUseCase.Interface
    ) {}

    async execute(params: GetFolderHierarchyParams): Promise<GetFolderHierarchyResponse> {
        const { siblings, parents } = await this.decoratee.execute(params);
        const folders = [...parents, ...siblings];

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

        return {
            parents: await this.filterAccessibleFolders(parents),
            siblings: await this.filterAccessibleFolders(siblings)
        };
    }

    private async filterAccessibleFolders(folders: Folder[]): Promise<Folder[]> {
        const results = await Promise.all(
            folders.map(async folder => {
                const permissions = this.getFlp(folder.id);
                if (!permissions) {
                    return folder;
                }

                const canAccess = await this.folderLevelPermissions.canAccessFolder({
                    permissions,
                    rwd: "r"
                });

                return canAccess ? { ...folder, permissions } : null;
            })
        );
        return results.filter((folder): folder is Folder => folder !== null);
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

export const GetFolderHierarchyWithFolderLevelPermissions = createDecorator({
    abstraction: GetFolderHierarchyUseCase,
    decorator: GetFolderHierarchyWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
