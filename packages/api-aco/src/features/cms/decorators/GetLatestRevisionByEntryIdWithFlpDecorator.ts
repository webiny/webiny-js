import { createDecorator, Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { canAccessEntryFolder } from "./canAccessEntryFolder.js";

/**
 * Security: the latest revision of an entry in a folder the identity cannot read must not be
 * returned (used, for example, by collaboration to authorize access to entry threads).
 */
class GetLatestRevisionByEntryIdWithFlpDecoratorImpl
    implements GetLatestRevisionByEntryIdUseCase.Interface
{
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: GetLatestRevisionByEntryIdUseCase.Params
    ): Promise<Result<CmsEntry<T>, GetLatestRevisionByEntryIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, params);

        if (result.isFail() || !this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        const folderId = result.value.location?.folderId;
        if (!(await canAccessEntryFolder(this.folderLevelPermissions, folderId, "r"))) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return result;
    }
}

export const GetLatestRevisionByEntryIdWithFlpDecorator = createDecorator({
    abstraction: GetLatestRevisionByEntryIdUseCase,
    decorator: GetLatestRevisionByEntryIdWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
