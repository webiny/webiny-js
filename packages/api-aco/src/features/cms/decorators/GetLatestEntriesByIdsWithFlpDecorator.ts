import { createDecorator } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";

class GetLatestEntriesByIdsWithFlpDecoratorImpl implements GetLatestEntriesByIdsUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetLatestEntriesByIdsUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetLatestEntriesByIdsUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, ids);

        if (result.isFail()) {
            return result;
        }

        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        const entries = result.value;
        const filteredEntries = await this.filterEntriesByFolder<T>(entries);

        return Result.ok(filteredEntries);
    }

    private async filterEntriesByFolder<T>(entries: CmsEntry<T>[]): Promise<CmsEntry<T>[]> {
        const results = await Promise.all(
            entries.map(async entry => {
                const folderId = entry.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return entry;
                }

                const permissions =
                    await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
                const canAccess = await this.folderLevelPermissions.canAccessFolderContent({
                    permissions,
                    rwd: "r"
                });
                return canAccess ? entry : null;
            })
        );

        return results.filter((entry): entry is CmsEntry<T> => !!entry);
    }
}

export const GetLatestEntriesByIdsWithFlpDecorator = createDecorator({
    abstraction: GetLatestEntriesByIdsUseCase,
    decorator: GetLatestEntriesByIdsWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
