import { createDecorator, Result } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { filterEntriesByFolderAccess } from "./canAccessEntryFolder.js";

/** Security: drop revisions located in folders the identity cannot read. */
class GetRevisionsByEntryIdWithFlpDecoratorImpl implements GetRevisionsByEntryIdUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetRevisionsByEntryIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        entryId: string
    ): Promise<Result<CmsEntry<T>[], GetRevisionsByEntryIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, entryId);

        if (result.isFail() || !this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        return Result.ok(
            await filterEntriesByFolderAccess(this.folderLevelPermissions, result.value)
        );
    }
}

export const GetRevisionsByEntryIdWithFlpDecorator = createDecorator({
    abstraction: GetRevisionsByEntryIdUseCase,
    decorator: GetRevisionsByEntryIdWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
