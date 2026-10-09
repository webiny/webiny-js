import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";

const WB_PAGE_FOLDER_TYPE = "wb:page";

class EnsurePageFolderIsEmptyOnDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listPages: ListPagesUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { id, type } = event.payload.folder;

        if (type !== WB_PAGE_FOLDER_TYPE) {
            return;
        }

        // The existence check runs without authorization: ListPagesUseCase narrows results to
        // the identity's own pages under "own" scope, so a scoped user would see a folder holding
        // other users' pages as empty and could delete it. Only a boolean leaves the callback.
        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            return this.identityContext.withoutAuthorization(async () => {
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
        });

        if (result.isFail()) {
            // Throw the original error so DeleteFolderUseCase maps "Aco/Folder/NotEmpty" correctly.
            throw result.error;
        }
    }
}

export const EnsurePageFolderIsEmptyOnDelete = FolderBeforeDeleteEventHandler.createImplementation({
    implementation: EnsurePageFolderIsEmptyOnDeleteImpl,
    dependencies: [EnsureFolderIsEmpty, ListPagesUseCase, IdentityContext]
});
