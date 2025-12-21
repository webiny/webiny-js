import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteHandler } from "@webiny/api-aco/features/folder/DeleteFolder";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty";

class EnsureFolderIsEmptyBeforeDeleteImpl implements FolderBeforeDeleteHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listFiles: ListFilesUseCase.Interface
    ) {}

    async handle(event: FolderBeforeDeleteHandler.Event): Promise<void> {
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

export const EnsureFolderIsEmptyBeforeDelete = FolderBeforeDeleteHandler.createImplementation({
    implementation: EnsureFolderIsEmptyBeforeDeleteImpl,
    dependencies: [EnsureFolderIsEmpty, ListFilesUseCase]
});
