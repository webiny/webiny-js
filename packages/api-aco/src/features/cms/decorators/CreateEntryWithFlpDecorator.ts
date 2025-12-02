import { createDecorator, Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";
import type {
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class CreateEntryWithFlpDecoratorImpl implements CreateEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: CreateEntryUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        input: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): ReturnType<CreateEntryUseCase.Interface["execute"]> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, input, options);
        }

        const folderId = input.wbyAco_location?.folderId || input.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute(model, input, options);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "w"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute(model, input, options);
    }
}

export const CreateEntryWithFlpDecorator = createDecorator({
    abstraction: CreateEntryUseCase,
    decorator: CreateEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
