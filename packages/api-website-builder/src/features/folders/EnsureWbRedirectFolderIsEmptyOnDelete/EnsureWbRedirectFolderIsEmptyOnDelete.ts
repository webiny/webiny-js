import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";
import { ListRedirectsRepository } from "~/features/redirects/ListRedirects/abstractions.js";

class EnsureWbRedirectFolderIsEmptyOnDeleteImpl
    implements FolderBeforeDeleteEventHandler.Interface
{
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listRedirects: ListRedirectsRepository.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { folder } = event.payload;

        const { id, type } = folder;

        if (type !== "wb:redirect") {
            return;
        }

        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            const result = await this.listRedirects.execute({
                where: {
                    location: {
                        folderId: id
                    }
                },
                limit: 1
            });

            if (result.isFail()) {
                throw result.error;
            }

            const { redirects } = result.value;

            return redirects.length > 0;
        });

        if (result.isFail()) {
            throw WebinyError.from(result.error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "WB_BEFORE_FOLDER_DELETE_REDIRECT_HANDLER"
            });
        }
    }
}

export const EnsureWbRedirectFolderIsEmptyOnDelete =
    FolderBeforeDeleteEventHandler.createImplementation({
        implementation: EnsureWbRedirectFolderIsEmptyOnDeleteImpl,
        dependencies: [EnsureFolderIsEmpty, ListRedirectsRepository]
    });
