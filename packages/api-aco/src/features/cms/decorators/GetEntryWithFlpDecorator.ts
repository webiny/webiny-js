import { createDecorator, Result } from "@webiny/feature/api";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry/abstractions.js";
import type {
    CmsModel,
    CmsEntryGetParams,
    CmsEntryValues,
    CmsEntry
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors";

class GetEntryWithFlpDecoratorImpl implements GetEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryGetParams
    ): Promise<Result<CmsEntry<T>, GetEntryUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, params);

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

export const GetEntryWithFlpDecorator = createDecorator({
    abstraction: GetEntryUseCase,
    decorator: GetEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
