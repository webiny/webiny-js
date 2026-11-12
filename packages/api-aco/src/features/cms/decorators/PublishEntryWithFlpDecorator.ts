import { createDecorator, Result } from "@webiny/feature/api";
import {
    type IPublishEntryUseCaseOptions,
    PublishEntryUseCase
} from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { checkRevisionFolderWriteAccess } from "./canAccessEntryFolder.js";

/** Security: publishing requires write access to the entry's folder. */
class PublishEntryWithFlpDecoratorImpl implements PublishEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: PublishEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        options?: IPublishEntryUseCaseOptions<T>
    ): PublishEntryUseCase.Return<T> {
        if (this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            const error = await checkRevisionFolderWriteAccess(
                this.folderLevelPermissions,
                this.getRevisionById,
                model,
                id
            );
            if (error) {
                return Result.fail(error);
            }
        }

        return this.decoratee.execute<T>(model, id, options);
    }
}

export const PublishEntryWithFlpDecorator = createDecorator({
    abstraction: PublishEntryUseCase,
    decorator: PublishEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
