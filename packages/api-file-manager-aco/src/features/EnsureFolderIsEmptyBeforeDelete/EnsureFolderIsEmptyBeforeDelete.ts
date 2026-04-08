import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";

class EnsureFolderIsEmptyBeforeDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listFiles: ListFilesUseCase.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { folder } = event.payload;

        const { id, type } = folder;

        /**
         * Exit if the folder type is not related to File Manager
         */
        if (type !== "FmFile") {
            return;
        }

        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const result = await this.listFiles.execute({
                where: {
                    location: {
                        folderId: id
                    }
                },
                limit: 1
            });

            const { items } = result.value;

            return items.length > 0;
        });

        if (result.isFail()) {
            throw WebinyError.from(result.error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HANDLER"
            });
        }
    }
}

export const EnsureFolderIsEmptyBeforeDelete = FolderBeforeDeleteEventHandler.createImplementation({
    implementation: EnsureFolderIsEmptyBeforeDeleteImpl,
    dependencies: [EnsureFolderIsEmpty, ListFilesUseCase]
});
