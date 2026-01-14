import { createDecorator, Result } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";

class GetPublishedEntriesByIdsWithFlpDecoratorImpl
    implements GetPublishedEntriesByIdsUseCase.Interface
{
    public constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetPublishedEntriesByIdsUseCase.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetPublishedEntriesByIdsUseCase.Error>> {
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

    private async filterEntriesByFolder<T extends CmsEntryValues = CmsEntryValues>(
        entries: CmsEntry<T>[]
    ): Promise<CmsEntry<T>[]> {
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

export const GetPublishedEntriesByIdsWithFlpDecorator = createDecorator({
    abstraction: GetPublishedEntriesByIdsUseCase,
    decorator: GetPublishedEntriesByIdsWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
