import { Result } from "@webiny/feature/api";
import {
    DeleteFolderRepository as RepositoryAbstraction,
    type IDeleteFolderRepository
} from "./abstractions.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { FolderModelProvider } from "~/domain/folder/abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import { FolderNotAuthorizedError, FolderPersistenceError } from "~/domain/folder/errors.js";

class DeleteFolderRepositoryImpl implements IDeleteFolderRepository {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(folder: Folder): Promise<Result<void, RepositoryAbstraction.Error>> {
        const folderModel = await this.folderModelProvider.get();
        const result = await this.deleteEntry.execute(folderModel, folder.id, {
            permanently: true,
            force: true
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotAuthorized") {
                return Result.fail(new FolderNotAuthorizedError());
            }
            return Result.fail(new FolderPersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteFolderRepositoryImpl,
    dependencies: [DeleteEntryUseCase, FolderModelProvider]
});
