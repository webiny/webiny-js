import { createDecorator, Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class GetEntryByIdWithFlpDecoratorImpl implements GetEntryByIdUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetEntryByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, GetEntryByIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, id);

        if (result.isFail()) {
            return result;
        }

        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        const entry = result.value;
        const folderId = entry?.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return result;
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "r"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return result;
    }
}

export const GetEntryByIdWithFlpDecorator = createDecorator({
    abstraction: GetEntryByIdUseCase,
    decorator: GetEntryByIdWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
