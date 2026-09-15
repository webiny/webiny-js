import type { FolderPermissionName } from "~/features/folders/abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { GetFolderLevelPermissionUseCase as UseCaseAbstraction } from "../abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";

class GetFolderLevelPermissionWithFlpDecoratorImpl implements UseCaseAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private featureFlagsService: FeatureFlagsService.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    execute(id: string, permissionName: FolderPermissionName) {
        if (
            !this.featureFlagsService
                .getFlags()
                .isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        ) {
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
    dependencies: [FoldersCache, FeatureFlagsService]
});
