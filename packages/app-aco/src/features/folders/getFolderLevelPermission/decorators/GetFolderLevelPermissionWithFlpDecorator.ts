import { FoldersCache } from "~/features/folders/abstractions.js";
import type { FolderPermissionName } from "~/features/index.js";
import { GetFolderLevelPermissionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WcpService } from "@webiny/app-admin/features/wcp/abstractions.js";

class GetFolderLevelPermissionWithFlpDecoratorImpl implements UseCaseAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private wcp: WcpService.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    execute(id: string, permissionName: FolderPermissionName) {
        // Check if WCP allows folder-level permissions feature
        if (!this.wcp.canUseFeature("folderLevelPermissions")) {
            return this.decoratee.execute(id, permissionName);
        }

        // Check the permissions
        const folder = this.cache.getItem(folder => folder.id === id);

        if (!folder) {
            return false;
        }

        return folder[permissionName] ?? false;
    }
}

export const GetFolderLevelPermissionWithFlpDecorator = UseCaseAbstraction.createDecorator({
    decorator: GetFolderLevelPermissionWithFlpDecoratorImpl,
    dependencies: [FoldersCache, WcpService]
});
