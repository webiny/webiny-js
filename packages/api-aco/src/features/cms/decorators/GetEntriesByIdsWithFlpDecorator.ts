import { createDecorator, Result } from "@webiny/feature/api";
import { GetEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { filterEntriesByFolderAccess } from "./canAccessEntryFolder.js";

/** Security: drop entries located in folders the identity cannot read. */
class GetEntriesByIdsWithFlpDecoratorImpl implements GetEntriesByIdsUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetEntriesByIdsUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): Promise<Result<CmsEntry<T>[], GetEntriesByIdsUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, ids);

        if (result.isFail() || !this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        return Result.ok(
            await filterEntriesByFolderAccess(this.folderLevelPermissions, result.value)
        );
    }
}

export const GetEntriesByIdsWithFlpDecorator = createDecorator({
    abstraction: GetEntriesByIdsUseCase,
    decorator: GetEntriesByIdsWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
