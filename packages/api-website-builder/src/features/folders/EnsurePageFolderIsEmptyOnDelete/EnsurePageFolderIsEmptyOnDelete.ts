import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";

const WB_PAGE_FOLDER_TYPE = "wb:page";

class EnsurePageFolderIsEmptyOnDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listPages: ListPagesUseCase.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { id, type } = event.payload.folder;

        if (type !== WB_PAGE_FOLDER_TYPE) {
            return;
        }

        // EnsureFolderIsEmpty re-runs this check without authorization when folder-level
        // permissions are on, and reports hidden content as FolderNotAuthorizedError.
        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const listResult = await this.listPages.execute({
                where: { location: { folderId: id } },
                sort: ["createdOn_DESC"],
                limit: 1,
                after: null
            });

            if (listResult.isFail()) {
                console.error(listResult.error.message);
                return true;
            }

            return listResult.value.pages.length > 0;
        });

        if (result.isFail()) {
            // Throw the original error so DeleteFolderUseCase maps "Aco/Folder/NotEmpty" correctly.
            throw result.error;
        }
    }
}

export const EnsurePageFolderIsEmptyOnDelete = FolderBeforeDeleteEventHandler.createImplementation({
    implementation: EnsurePageFolderIsEmptyOnDeleteImpl,
    dependencies: [EnsureFolderIsEmpty, ListPagesUseCase]
});
