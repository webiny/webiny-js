import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/abstractions.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class EnsureWbPageFolderIsEmptyOnDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listPages: ListPagesUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { folder } = event.payload;

        const { id, type } = folder;

        if (type !== "wb:page") {
            return;
        }

        // The existence check runs without authorization: ListPagesUseCase narrows results to
        // the identity's own pages under "own" scope, so a scoped user would see a folder holding
        // other users' pages as empty and could delete it. Only a boolean leaves the callback.
        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const result = await this.identityContext.withoutAuthorization(async () => {
                return this.listPages.execute({
                    where: {
                        location: {
                            folderId: id
                        }
                    },
                    sort: [],
                    limit: 1,
                    after: null
                });
            });

            if (result.isFail()) {
                throw result.error;
            }

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
        dependencies: [EnsureFolderIsEmpty, ListPagesUseCase, IdentityContext]
    });
