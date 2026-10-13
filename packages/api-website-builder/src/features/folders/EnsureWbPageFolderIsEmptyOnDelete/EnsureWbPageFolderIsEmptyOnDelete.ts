import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/abstractions.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";

class EnsureWbPageFolderIsEmptyOnDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listPages: ListPagesUseCase.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { folder } = event.payload;

        const { id, type } = folder;

        if (type !== "wb:page") {
            return;
        }

        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const result = await this.listPages.execute({
                where: {
                    location: {
                        folderId: id
                    }
                },
                sort: [],
                limit: 1,
                after: null
            });

            const { pages } = result.value;

            return pages.length > 0;
        });

        if (result.isFail()) {
            throw WebinyError.from(result.error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "WB_BEFORE_FOLDER_DELETE_PAGE_HANDLER"
            });
        }
    }
}

export const EnsureWbPageFolderIsEmptyOnDelete =
    FolderBeforeDeleteEventHandler.createImplementation({
        implementation: EnsureWbPageFolderIsEmptyOnDeleteImpl,
        dependencies: [EnsureFolderIsEmpty, ListPagesUseCase]
    });
