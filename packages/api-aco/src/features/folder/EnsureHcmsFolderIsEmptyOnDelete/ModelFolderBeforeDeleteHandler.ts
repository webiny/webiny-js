import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import { EnsureFolderIsEmpty } from "~/features/folder/EnsureFolderIsEmpty/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";

class ModelFolderBeforeDeleteHandlerImpl implements FolderBeforeDeleteHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private getModel: GetModelUseCase.Interface,
        private listEntries: ListEntriesUseCase.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        const { id, type } = folder;

        const modelId = type.split(":")[1];
        if (!modelId) {
            return;
        }

        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return;
        }

        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const entries = await this.listEntries.execute(modelResult.value, {
                where: {
                    latest: true,
                    wbyAco_location: {
                        folderId: id
                    }
                },
                limit: 1
            });

            const [content] = entries.value;

            return content.length > 0;
        });

        if (result.isFail()) {
            throw WebinyError.from(result.error, {
                message: "Error while ensuring HCMS folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_HCMS_HANDLER"
            });
        }
    }
}

export const ModelFolderBeforeDeleteHandler = FolderBeforeDeleteHandler.createImplementation({
    implementation: ModelFolderBeforeDeleteHandlerImpl,
    dependencies: [EnsureFolderIsEmpty, GetModelUseCase, ListEntriesUseCase]
});
