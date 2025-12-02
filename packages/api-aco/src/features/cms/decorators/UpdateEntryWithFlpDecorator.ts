import { createDecorator, Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type {
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class UpdateEntryWithFlpDecoratorImpl implements UpdateEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: UpdateEntryUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): ReturnType<UpdateEntryUseCase.Interface["execute"]> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, id, input, metaInput, options);
        }

        const entryResult = await this.getRevisionById.execute(model, id);
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, id, input, metaInput, options);
        }

        const entry = entryResult.value;
        const folderId = entry?.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute(model, id, input, metaInput, options);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "w"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute(model, id, input, metaInput, options);
    }
}

export const UpdateEntryWithFlpDecorator = createDecorator({
    abstraction: UpdateEntryUseCase,
    decorator: UpdateEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
